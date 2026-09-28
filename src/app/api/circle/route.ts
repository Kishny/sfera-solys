// src/app/api/circle/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Like } from "@/models/Like";
import { CircleWeek } from "@/models/CircleWeek";
import { planEffectif } from "@/lib/quotas";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription/config";

/**
 * GET /api/circle
 *
 * Les six profils de la semaine, figés jusqu'au lundi suivant.
 *
 * ## Ce qui n'allait pas
 *
 * **1. Ce n'était pas hebdomadaire.** Le score était recalculé à chaque appel
 * et la route renvoyait le top 6 du moment. Un like, une connexion d'un
 * candidat, une modification de profil, et les six changeaient — parfois entre
 * deux chargements de la même page. Le champ `weekOf` partait au client sans
 * jamais rien figer. La promesse « six profils le lundi, puis ça s'arrête »
 * décrivait quelque chose qui n'existait pas.
 *
 * La sélection est maintenant écrite dans `CircleWeek` au premier affichage de
 * la semaine, et c'est elle qui est servie ensuite. Un profil devenu
 * indisponible est retiré de l'affichage mais jamais remplacé : la semaine est
 * la semaine.
 *
 * **2. L'accès n'était pas contrôlé.** `circleOfSix` vaut `false` sur l'offre
 * gratuite et `/tarifs` vend « Circle of Six hebdomadaire » à partir de
 * l'offre Essentiel. La route ne lisait jamais ce drapeau : n'importe quel
 * compte connecté obtenait ses six profils.
 *
 * **3. Un abonnement résilié restait premium.** `isPremium === true` était lu
 * seul, sans `subscriptionStatus`, donc un abonnement expiré continuait de
 * donner accès aux profils réservés. Même correctif que partout ailleurs :
 * `planEffectif`.
 *
 * ## L'algorithme de compatibilité (inchangé sur le fond)
 *
 *  [Intentions]    +3 pts par intention commune
 *  [Intérêts]      +1 pt  par intérêt commun
 *  [Réciprocité]   +10 pts s'il a déjà liké le membre  → très fort signal
 *  [Âge proche]    +3 si écart ≤ 5 ans, +1 si ≤ 10, -3 si > 15
 *  [Localisation]  +4 même ville, +2 même région
 *  [Activité]      +3 connecté cette semaine, +1 ce mois
 *  [Profil soigné] +2 photo, +1 question de sécurité remplie
 */

/** Nombre de profils par semaine. C'est le nom du produit. */
const TAILLE_CERCLE = 6;

/**
 * Taille du vivier passé au calcul de score.
 *
 * L'ancienne version prenait 200 candidats dans l'ordre naturel de la
 * collection — donc en pratique les 200 plus anciens comptes, indéfiniment les
 * mêmes. On prend désormais les plus récemment actifs : le plafond reste, mais
 * il porte sur un échantillon qui a du sens.
 */
const TAILLE_VIVIER = 300;

/** Lundi 00:00 de la semaine en cours, heure serveur. */
function debutDeSemaine(reference = new Date()): Date {
  const date = new Date(reference);
  const jour = date.getDay();

  // getDay() : 0 = dimanche. On recule jusqu'au lundi.
  const recul = jour === 0 ? 6 : jour - 1;

  date.setDate(date.getDate() - recul);
  date.setHours(0, 0, 0, 0);

  return date;
}

/** Lundi 00:00 de la semaine suivante — la date du prochain tirage. */
function prochainTirage(reference = new Date()): Date {
  const lundi = debutDeSemaine(reference);
  const suivant = new Date(lundi);
  suivant.setDate(suivant.getDate() + 7);
  return suivant;
}

type Candidat = Record<string, unknown> & {
  _id: mongoose.Types.ObjectId;
  age?: number;
  localisation?: string;
  interets?: string[];
  intentions?: string[];
  image?: string;
  question?: string;
  lastLoginAt?: Date;
};

/** Champs publics renvoyés au client. */
const CHAMPS_PUBLICS =
  "pseudonyme age localisation departement interets intentions image identityVerified visibilite";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Non autorisé.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    await connectDB();

    const currentUser = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    })
      .select(
        "_id interets intentions age localisation plan isPremium subscriptionStatus banned"
      )
      .lean();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Membre introuvable.", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (currentUser.banned) {
      return NextResponse.json(
        { success: false, error: "Compte suspendu.", code: "ACCOUNT_BANNED" },
        { status: 403 }
      );
    }

    const currentUserId = currentUser._id as mongoose.Types.ObjectId;

    /**
     * Offre en vigueur — un abonnement résilié retombe sur l'offre gratuite.
     */
    const plan = planEffectif({
      plan: currentUser.plan,
      isPremium: currentUser.isPremium,
      subscriptionStatus: currentUser.subscriptionStatus,
    });

    const offre = SUBSCRIPTION_PLANS[plan];
    const estPayant = plan !== "free";

    if (!offre.features.circleOfSix) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Le Circle of Six fait partie des offres payantes. L'annuaire, lui, reste ouvert.",
          code: "CIRCLE_NOT_IN_PLAN",
          upgradeUrl: "/tarifs",
        },
        { status: 403 }
      );
    }

    const semaine = debutDeSemaine();
    const renouvellement = prochainTirage();

    /**
     * Sélection déjà tirée cette semaine ?
     */
    let selection = await CircleWeek.findOne({
      userId: currentUserId,
      weekStart: semaine,
    }).lean();

    let vientDetreTiree = false;

    if (!selection) {
      const tirage = await tirerSelection(
        currentUserId,
        {
          interets: currentUser.interets,
          intentions: currentUser.intentions,
          age: currentUser.age,
          localisation: currentUser.localisation,
        },
        estPayant
      );

      /**
       * `upsert` plutôt qu'un `create` : deux onglets ouverts le lundi matin
       * peuvent déclencher deux tirages en parallèle, et l'index unique
       * (userId, weekStart) fait foi. Le second récupère le premier au lieu
       * d'échouer.
       */
      selection = await CircleWeek.findOneAndUpdate(
        { userId: currentUserId, weekStart: semaine },
        {
          $setOnInsert: {
            userId: currentUserId,
            weekStart: semaine,
            profileIds: tirage.ids,
            poolSize: tirage.poolSize,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      vientDetreTiree = true;
    }

    const ids = (selection?.profileIds ?? []) as mongoose.Types.ObjectId[];

    /**
     * Relecture des profils.
     *
     * Un profil devenu indisponible depuis le tirage disparaît de la liste et
     * n'est pas remplacé. On renvoie le nombre de disparus pour que la page
     * puisse l'expliquer, au lieu d'afficher quatre cartes sans un mot.
     */
    const profils = ids.length
      ? await User.find({
          _id: { $in: ids },
          banned: { $ne: true },
          hasCompletedProfile: true,
          visibilite: estPayant
            ? { $nin: ["invisible"] }
            : { $nin: ["invisible", "premium"] },
        })
          .select(CHAMPS_PUBLICS)
          .lean()
      : [];

    // On restitue l'ordre du tirage, que `$in` ne garantit pas.
    const parId = new Map(profils.map((profil) => [String(profil._id), profil]));
    const ordonnes = ids
      .map((id) => parId.get(String(id)))
      .filter((profil): profil is (typeof profils)[number] => Boolean(profil));

    return NextResponse.json(
      {
        success: true,
        profiles: ordonnes,
        semaine: {
          debut: semaine.toISOString(),
          renouvellement: renouvellement.toISOString(),
          /** Vient d'être tirée à cet appel : la page peut le souligner. */
          nouvelle: vientDetreTiree,
          /** Tirés au départ, encore disponibles maintenant. */
          tires: ids.length,
          disparus: ids.length - ordonnes.length,
          /** Vivier au moment du tirage — explique une sélection courte. */
          vivier: selection?.poolSize ?? 0,
        },
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("GET /api/circle :", err);

    return NextResponse.json(
      { success: false, error: "Erreur serveur.", code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * Calcule la sélection de la semaine.
 *
 * Appelée une fois par membre et par semaine, au premier affichage.
 */
async function tirerSelection(
  currentUserId: mongoose.Types.ObjectId,
  moi: {
    interets?: unknown;
    intentions?: unknown;
    age?: unknown;
    localisation?: unknown;
  },
  estPayant: boolean
): Promise<{ ids: mongoose.Types.ObjectId[]; poolSize: number }> {
  // Profils déjà likés : inutile de les reproposer.
  const dejaAimes = await Like.find({ fromUserId: currentUserId })
    .select("toUserId")
    .lean();

  const idsAimes = dejaAimes.map(
    (like) => (like as { toUserId: mongoose.Types.ObjectId }).toUserId
  );

  // Profils qui ont déjà liké le membre : signal de réciprocité très fort.
  const mOntAime = await Like.find({ toUserId: currentUserId })
    .select("fromUserId")
    .lean();

  const idsReciproques = new Set(
    mOntAime.map((like) =>
      String((like as { fromUserId: mongoose.Types.ObjectId }).fromUserId)
    )
  );

  const filtre: Record<string, unknown> = {
    _id: { $ne: currentUserId, ...(idsAimes.length ? { $nin: idsAimes } : {}) },
    hasCompletedProfile: true,
    banned: { $ne: true },
    role: { $ne: "admin" },
    visibilite: estPayant
      ? { $nin: ["invisible"] }
      : { $nin: ["invisible", "premium"] },
  };

  const candidats = (await User.find(filtre)
    .select(
      "pseudonyme age localisation interets intentions image question lastLoginAt"
    )
    .sort({ lastLoginAt: -1, updatedAt: -1 })
    .limit(TAILLE_VIVIER)
    .lean()) as unknown as Candidat[];

  const mesInterets: string[] = Array.isArray(moi.interets)
    ? (moi.interets as string[])
    : [];

  const mesIntentions: string[] = Array.isArray(moi.intentions)
    ? (moi.intentions as string[])
    : [];

  const monAge = typeof moi.age === "number" ? moi.age : null;

  const maVille = String(moi.localisation ?? "")
    .toLowerCase()
    .trim();

  const maintenant = Date.now();
  const uneSemaine = maintenant - 7 * 24 * 60 * 60 * 1000;
  const unMois = maintenant - 30 * 24 * 60 * 60 * 1000;

  const notes = candidats.map((candidat) => {
    let score = 0;

    const sesIntentions = Array.isArray(candidat.intentions)
      ? candidat.intentions
      : [];
    score += mesIntentions.filter((item) => sesIntentions.includes(item)).length * 3;

    const sesInterets = Array.isArray(candidat.interets) ? candidat.interets : [];
    score += mesInterets.filter((item) => sesInterets.includes(item)).length;

    if (idsReciproques.has(String(candidat._id))) score += 10;

    if (monAge !== null && typeof candidat.age === "number") {
      const ecart = Math.abs(monAge - candidat.age);
      if (ecart <= 5) score += 3;
      else if (ecart <= 10) score += 1;
      else if (ecart > 15) score -= 3;
    }

    if (maVille && candidat.localisation) {
      const saVille = String(candidat.localisation).toLowerCase().trim();

      if (saVille === maVille) {
        score += 4;
      } else {
        const maRegion = maVille.split(" ")[0];
        const saRegion = saVille.split(" ")[0];
        if (maRegion.length > 2 && maRegion === saRegion) score += 2;
      }
    }

    if (candidat.lastLoginAt) {
      const derniere = new Date(candidat.lastLoginAt).getTime();
      if (derniere >= uneSemaine) score += 3;
      else if (derniere >= unMois) score += 1;
    }

    if (candidat.image) score += 2;
    if (candidat.question) score += 1;

    return { id: candidat._id, score, derniere: candidat.lastLoginAt };
  });

  notes.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    const aDerniere = a.derniere ? new Date(a.derniere).getTime() : 0;
    const bDerniere = b.derniere ? new Date(b.derniere).getTime() : 0;
    return bDerniere - aDerniere;
  });

  return {
    ids: notes.slice(0, TAILLE_CERCLE).map((note) => note.id),
    poolSize: candidats.length,
  };
}
