// src/app/api/profiles/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Like } from "@/models/Like";
import { Match } from "@/models/Match";

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
  return (
    user.isPremium === true &&
    (user.subscriptionStatus === "active" ||
      user.subscriptionStatus === "trialing")
  );
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

    const currentUser = await User.findOne({ email: sessionEmail }).select(
      "_id isPremium subscriptionStatus"
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
        "pseudonyme age localisation departement interets intentions orientation bio image photos identityVerified visibilite hasCompletedProfile banned createdAt role"
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

    if (profile.visibilite === "invisible" && !isOwnProfile) {
      return NextResponse.json(
        {
          success: false,
          error: "Profil non disponible.",
          code: "PROFILE_INVISIBLE",
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
     * Visibilité « réservé à mes matchs ».
     *
     * C'est le réglage que le membre a choisi : sans match actif entre les deux,
     * le profil n'est pas consultable, même avec l'identifiant en main.
     */
    if (
      profile.visibilite === "matches" &&
      !isOwnProfile &&
      !match
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Ce membre réserve son profil à ses mises en relation.",
          code: "MATCH_REQUIRED",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        profile,
        relation: {
          estMonProfil: isOwnProfile,
          dejaAime: Boolean(dejaAime),
          estUnMatch: Boolean(match),
          matchId: match ? String(match._id) : null,
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
