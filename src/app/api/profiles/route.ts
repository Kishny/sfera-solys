// src/app/api/profiles/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Like } from "@/models/Like";
import { classementBoosts, pipelineProfilsClasses } from "@/lib/boosts";

/**
 * GET /api/profiles
 *
 * Retourne des profils compatibles avec l'utilisateur connecté.
 *
 * Mobile-first côté API :
 * - pagination stricte ;
 * - limite maximale ;
 * - champs publics uniquement ;
 * - pas de payload inutile.
 *
 * ## Les boosts entrent dans le classement ici
 *
 * C'est le seul endroit du site où l'ordre d'apparition des profils est
 * décidé — donc le seul endroit où un boost peut avoir un effet réel. Avant,
 * le tri était `updatedAt` décroissant et rien d'autre : les boosts vendus
 * dans les offres n'avaient littéralement aucune conséquence.
 *
 * Deux chemins, volontairement :
 *
 * - **aucun boost en cours** (le cas courant) : on garde le `find().sort()`
 *   d'origine, qui s'appuie sur les index. Coût inchangé.
 * - **au moins un boost en cours** : une agrégation ajoute un `scoreBoost` par
 *   profil et trie dessus d'abord. Le tri porte sur un champ calculé, donc en
 *   mémoire — c'est pourquoi on ne le paie que quand quelqu'un a réellement un
 *   boost actif, et avec `allowDiskUse`.
 *
 * Les deux chemins renvoient exactement les mêmes champs, `miseEnAvant`
 * compris : le client ne doit pas avoir à deviner lequel a répondu. Ce
 * booléen est exposé volontairement, pour que l'interface puisse dire qu'un
 * profil est mis en avant au lieu de le faire passer pour un hasard du
 * classement.
 */

/**
 * Champs publics d'un profil dans Explorer.
 *
 * Une seule définition pour les deux chemins de lecture : une divergence ici
 * se traduirait par des cartes incomplètes selon qu'un boost tourne ou non.
 */
const CHAMPS_PUBLICS =
  "pseudonyme age localisation departement interets intentions visibilite image photos identityVerified createdAt updatedAt";

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);

  if (Number.isNaN(parsed) || parsed <= 0) return fallback;

  return parsed;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isPremiumActive(user: any) {
  return (
    user.isPremium === true &&
    (user.subscriptionStatus === "active" ||
      user.subscriptionStatus === "trialing")
  );
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Non autorisé.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    await connectDB();

    const sessionEmail = session.user.email.toLowerCase().trim();

    const currentUser = await User.findOne({ email: sessionEmail }).select(
      "_id isPremium plan subscriptionStatus departement rayon"
    );

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Utilisateur introuvable.",
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const currentUserId = currentUser._id as mongoose.Types.ObjectId;
    const userIsPremium = isPremiumActive(currentUser);

    const alreadyLiked = await Like.find({
      fromUserId: currentUserId,
    }).select("toUserId");

    const likedIds = alreadyLiked.map((like) => like.toUserId);

    const { searchParams } = new URL(req.url);

    /**
     * Sfera'Solys vise 28+.
     * On met donc 28 par défaut.
     */
    const ageMin = parsePositiveInt(searchParams.get("age_min"), 28);
    const ageMax = parsePositiveInt(searchParams.get("age_max"), 120);

    const safeAgeMin = Math.max(28, Math.min(ageMin, 120));
    const safeAgeMax = Math.max(safeAgeMin, Math.min(ageMax, 120));

    const intentionsParam = searchParams.get("intentions");
    const localisation = searchParams.get("localisation");

    const limit = Math.min(parsePositiveInt(searchParams.get("limit"), 20), 50);
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const skip = (page - 1) * limit;

    /**
     * Filtres premium uniquement.
     */
    const orientation = userIsPremium ? searchParams.get("orientation") : null;
    const actifRecemment =
      userIsPremium && searchParams.get("actif_recemment") === "true";

    /**
     * Requête principale.
     */
    const query: Record<string, unknown> = {
      _id: {
        $ne: currentUserId,
        ...(likedIds.length > 0 ? { $nin: likedIds } : {}),
      },

      hasCompletedProfile: true,
      consentement: true,
      banned: { $ne: true },
      role: { $ne: "admin" },

      age: {
        $gte: safeAgeMin,
        $lte: safeAgeMax,
      },
    };

    /**
     * Visibilité :
     * - public : visible dans Explorer.
     * - premium : visible seulement si le visiteur est premium.
     * - matches : à réserver aux profils déjà matchés, pas à Explorer.
     * - invisible : jamais dans Explorer.
     */
    query.visibilite = userIsPremium
      ? { $in: ["public", "premium"] }
      : { $in: ["public"] };

    if (intentionsParam) {
      const intentions = intentionsParam
        .split(",")
        .map((intent) => intent.trim())
        .filter(Boolean)
        .slice(0, 10);

      if (intentions.length > 0) {
        query.intentions = { $in: intentions };
      }
    }

    if (localisation && localisation.trim().length >= 2) {
      query.localisation = {
        $regex: escapeRegex(localisation.trim()),
        $options: "i",
      };
    }

    /**
     * Filtre par département (bassin géographique cohérent, DOM inclus).
     *
     * - Un département explicite passé en query param prime (filtre manuel).
     * - Sinon, si le membre a choisi la portée "Mon département" et qu'un
     *   département est renseigné, on restreint à ce même département.
     * - Pour "Ma région" / "Toute la France" (ou anciennes valeurs en km),
     *   on n'ajoute pas de restriction départementale.
     *
     * Évite par exemple qu'une membre à La Réunion (974) se voie proposer
     * des profils métropolitains à 9 000 km.
     */
    const departementParam = (searchParams.get("departement") || "").trim();
    const currentDept = (currentUser as { departement?: string }).departement;
    const currentRayon = (currentUser as { rayon?: string }).rayon;

    let effectiveDepartement = "";

    if (departementParam === "all") {
      // Choix explicite "Toute la France" depuis Explorer : aucune restriction.
      effectiveDepartement = "";
    } else if (departementParam) {
      // Département explicitement sélectionné dans Explorer.
      effectiveDepartement = departementParam;
    } else if (currentRayon === "departement" && currentDept) {
      // Par défaut : on reste dans le bassin de le membre.
      effectiveDepartement = currentDept;
    }

    if (effectiveDepartement) {
      query.departement = effectiveDepartement;
    }

    if (orientation && orientation.trim().length > 0) {
      query.orientation = orientation.trim();
    }

    if (actifRecemment) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      query.updatedAt = { $gte: sevenDaysAgo };
    }

    /**
     * Profils actuellement mis en avant, tous membres confondus.
     * Ensemble minuscule par nature : un boost dure trente minutes.
     */
    const { ids: idsBoostes, scores: scoresBoostes } = await classementBoosts();

    const lireProfils = async () => {
      if (idsBoostes.length === 0) {
        const profils = await User.find(query)
          .select(CHAMPS_PUBLICS)
          .sort({ updatedAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean();

        // Même forme de réponse que le chemin agrégé.
        return profils.map((profil) => ({ ...profil, miseEnAvant: false }));
      }

      /**
       * Le pipeline vit dans `lib/boosts` : la règle de classement appartient
       * à la logique de boost, et elle y est couverte par des tests.
       */
      return User.aggregate(
        pipelineProfilsClasses({
          filtre: query,
          champs: CHAMPS_PUBLICS,
          ids: idsBoostes,
          scores: scoresBoostes,
          skip,
          limit,
        }),
        { allowDiskUse: true }
      );
    };

    const [profiles, total] = await Promise.all([
      lireProfils(),
      User.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        success: true,
        profiles,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + profiles.length < total,
        },
        filters: {
          userIsPremium,
          ageMin: safeAgeMin,
          ageMax: safeAgeMax,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Erreur GET /api/profiles :", error);

    const err = error as { message?: string };

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur.",
        code: "INTERNAL_SERVER_ERROR",
        message:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}
