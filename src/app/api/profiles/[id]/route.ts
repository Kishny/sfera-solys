// src/app/api/profiles/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { blocageEntre } from "@/lib/blocages";
import { Like } from "@/models/Like";
import { Match } from "@/models/Match";
import { galeriePubliee } from "@/lib/photos-profil";
import { estFantome } from "@/lib/visibilite";
import { estAbonnePayant } from "@/lib/abonnement";

/**
 * GET /api/profiles/[id]
 *
 * Retourne le profil public d'un utilisateur.
 *
 * Sécurité :
 * - nécessite une session ;
 * - valide l'id MongoDB ;
 * - ne renvoie jamais email, password, Stripe, tokens, réponse secrète ;
 * - bloque les profils invisibles ;
 * - bloque les profils premium-only si le visiteur n'est pas premium ;
 * - bloque les profils réservés aux matchs si aucun match actif ne lie les deux.
 *
 * ## Le trou de confidentialité corrigé
 *
 * La visibilité « matches » (« visible seulement par mes matchs ») n'était
 * **pas appliquée ici**. Un commentaire annonçait qu'il fallait attendre le
 * modèle `Match`… qui existait depuis le début. Conséquence : un membre ayant
 * choisi ce réglage était bien exclu de l'annuaire — `/api/profiles` filtre sur
 * `visibilite` — mais son profil restait **entièrement consultable par
 * n'importe quel membre connecté** ayant son identifiant. Un réglage de
 * confidentialité qui ne protège que de la navigation, pas de l'accès direct,
 * ne protège de rien.
 *
 * ## L'état de la relation, renvoyé avec le profil
 *
 * La page de profil avait un bouton « Liker ce profil » qui ne faisait que
 * revenir en arrière. Pour qu'il devienne réel, il lui faut savoir où en est la
 * relation : déjà aimé, déjà en match, ou rien. C'est le bloc `relation`.
 */

function isPremiumActive(user: any) {
  // Dérivé de l'offre et du statut — voir `@/lib/abonnement`.
  return estAbonnePayant(user);
}

/** Au-delà, on n'affiche plus de mention de présence. */
const SEUIL_PRESENCE_MS = 7 * 24 * 60 * 60 * 1000;

/** Les éléments présents des deux côtés, sans doublon. */
function croiser(miens: unknown, siens: unknown): string[] {
  const a = Array.isArray(miens) ? miens.map(String) : [];
  const b = new Set(Array.isArray(siens) ? siens.map(String) : []);
  return [...new Set(a.filter((item) => b.has(item)))];
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Non authentifié.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    const { id: profileId } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(profileId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Identifiant de profil invalide.",
          code: "INVALID_PROFILE_ID",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const sessionEmail = session.user.email.toLowerCase().trim();

    /*
     * `interets`, `intentions` et `favoris` s'ajoutent : les deux premiers
     * servent à calculer les affinités avec le profil consulté, le
     * troisième à savoir si l'étoile est déjà allumée.
     */
    const currentUser = await User.findOne({ email: sessionEmail }).select(
      // `plan` est indispensable : c'est de lui que dépend désormais
      // le calcul de l'offre payante.
      "_id plan isPremium subscriptionStatus interets intentions favoris"
    );

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Utilisateur connecté introuvable.",
          code: "CURRENT_USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const profile = await User.findById(profileId)
      .select(
        "pseudonyme age localisation departement interets intentions orientation bio image photos identityVerified visibilite hasCompletedProfile banned createdAt role lastLoginAt"
      )
      .lean();

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Profil introuvable.",
          code: "PROFILE_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const isOwnProfile = String(profile._id) === String(currentUser._id);

    // Bloquer l'accès aux profils admin (invisibles pour les membres)
    if ((profile as any).role === "admin" && !isOwnProfile) {
      return NextResponse.json(
        { success: false, error: "Profil introuvable.", code: "PROFILE_NOT_FOUND" },
        { status: 404 }
      );
    }

    /**
     * Blocage, dans un sens ou dans l'autre.
     *
     * Même réponse que pour un profil banni : rien dans le message ne dit
     * qu'il s'agit d'un blocage, ni qui l'a posé.
     */
    if (!isOwnProfile && (await blocageEntre(currentUser._id, profileId))) {
      return NextResponse.json(
        {
          success: false,
          error: "Profil non disponible.",
          code: "PROFILE_UNAVAILABLE",
        },
        { status: 403 }
      );
    }

    if (profile.banned && !isOwnProfile) {
      return NextResponse.json(
        {
          success: false,
          error: "Profil non disponible.",
          code: "PROFILE_UNAVAILABLE",
        },
        { status: 403 }
      );
    }

    if (!profile.hasCompletedProfile && !isOwnProfile) {
      return NextResponse.json(
        {
          success: false,
          error: "Profil incomplet.",
          code: "PROFILE_INCOMPLETE",
        },
        { status: 403 }
      );
    }

    if (
      profile.visibilite === "premium" &&
      !isPremiumActive(currentUser) &&
      !isOwnProfile
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Ce profil est réservé aux membres premium.",
          code: "PREMIUM_REQUIRED",
        },
        { status: 403 }
      );
    }

    /**
     * Relation entre le visiteur et ce profil.
     *
     * Lue avant le contrôle de visibilité « matches », puisque c'est elle qui
     * en décide. Les deux lectures sont indexées : `Like` sur
     * `{ fromUserId, toUserId }` (unique) et `Match` sur
     * `{ user1Id, user2Id }` (unique).
     */
    const [dejaAime, match] = await Promise.all([
      isOwnProfile
        ? Promise.resolve(null)
        : Like.exists({
            fromUserId: currentUser._id,
            toUserId: profile._id,
          }),
      isOwnProfile
        ? Promise.resolve(null)
        : Match.findOne({
            isActive: true,
            $or: [
              { user1Id: currentUser._id, user2Id: profile._id },
              { user1Id: profile._id, user2Id: currentUser._id },
            ],
          }).select("_id"),
    ]);

    /**
     * Le Mode Fantôme.
     *
     * Il sort le profil de l'annuaire et des Circle, et ferme la fiche à
     * tout le monde — sauf aux mises en relation déjà nouées. Le réglage
     * sert à ne plus être découvert, pas à disparaître de ceux qu'on a
     * déjà rencontrés : couper l'accès à un match laisserait une
     * conversation ouverte avec quelqu'un dont on ne peut plus ouvrir le
     * profil.
     *
     * Le test passe par `estFantome` et non par une comparaison à
     * `"invisible"` : les comptes restés sur l'ancienne valeur `matches`
     * doivent être traités à l'identique.
     */
    if (estFantome(profile.visibilite) && !isOwnProfile && !match) {
      return NextResponse.json(
        {
          success: false,
          error: "Ce membre réserve son profil à ses mises en relation.",
          code: "MATCH_REQUIRED",
        },
        { status: 403 }
      );
    }

    const mesFavoris = new Set(
      ((currentUser as { favoris?: unknown[] }).favoris ?? []).map((v) =>
        String(v)
      )
    );

    /**
     * Présence, et le Mode Fantôme qui prime dessus.
     *
     * `lastLoginAt` ne sort jamais tel quel : seule une mention « vu
     * récemment » est calculée ici, et elle est tue pour un profil en
     * visibilité restreinte. Quelqu'un qui paie pour être discret ne doit
     * pas voir sa présence annoncée — ce serait vendre le Mode Fantôme et
     * le contredire sur la même page.
     */
    const discret =
      estFantome(profile.visibilite);

    const vuRecemment =
      !discret &&
      profile.lastLoginAt != null &&
      Date.now() - new Date(profile.lastLoginAt).getTime() < SEUIL_PRESENCE_MS;

    // `lastLoginAt` est retiré de la charge utile : la page n'a pas à
    // connaître l'horodatage, seulement le fait.
    const { lastLoginAt: _horodatage, ...profilPublic } =
      profile as unknown as Record<string, unknown>;

    return NextResponse.json(
      {
        success: true,
        profile: {
          ...profilPublic,
          // Références résolues en adresses, signées si authentifiées.
          photos: galeriePubliee(profilPublic.photos),
          vuRecemment,
        },
        relation: {
          estMonProfil: isOwnProfile,
          dejaAime: Boolean(dejaAime),
          estUnMatch: Boolean(match),
          matchId: match ? String(match._id) : null,
          estFavori: mesFavoris.has(String(profile._id)),
        },

        /**
         * Affinités réellement partagées, calculées ici plutôt que devinées
         * par la page.
         *
         * Ce sont des intersections, rien d'autre : un centre d'intérêt ou
         * une intention que vous avez tous les deux cochés. Aucun score,
         * aucune estimation — afficher « 87 % de compatibilité » sur une
         * donnée pareille serait une invention présentée comme une mesure.
         */
        affinites: {
          interets: croiser(currentUser.interets, profile.interets),
          intentions: croiser(currentUser.intentions, profile.intentions),
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
    console.error("Erreur GET /api/profiles/[id] :", error);

    const err = error as { message?: string };

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur lors de la récupération du profil.",
        code: "INTERNAL_SERVER_ERROR",
        message:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Une erreur est survenue.",
      },
      { status: 500 }
    );
  }
}
