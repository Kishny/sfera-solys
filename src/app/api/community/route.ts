// src/app/api/community/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { CommunityPost } from "@/models/CommunityPost";
import { Report } from "@/models/Report";
import { rateLimit } from "@/lib/rate-limiter";
import { moderateText } from "@/lib/text-moderation";
import mongoose from "mongoose";

/**
 * Communauté Solys — fil public.
 *
 * ## Ce qui manquait
 *
 * Le fil était fonctionnel mais sans aucune des protections de la messagerie
 * privée, alors qu'il est **plus exposé** : un message privé atteint une
 * personne, un post atteint tout le monde.
 *
 * - **Aucun filtre de modération.** `moderateText` protégeait les messages
 *   privés et pas le fil public. Un contenu abusif y était donc publié
 *   directement, visible de tous, en attendant qu'un membre le signale.
 * - **Aucune limite de débit.** Rien n'empêchait de publier en boucle.
 * - **Aucune pagination.** `find(query)` sans `limit` renvoyait *tous* les
 *   posts jamais écrits, à chaque chargement de la page.
 * - **Aucun contrôle de compte.** Un membre banni pouvait publier, et les posts
 *   d'un compte banni restaient affichés dans le fil.
 * - **La catégorie n'était pas validée.** Une valeur hors enum faisait échouer
 *   mongoose, donc répondait 500 au lieu de 400.
 */

/** Catégories acceptées — doit suivre l'enum de `models/CommunityPost.ts`. */
const CATEGORIES = [
  "rencontres",
  "conseils",
  "sorties",
  "bien-etre",
  "humour",
  "general",
] as const;

const PAR_PAGE_DEFAUT = 20;
const PAR_PAGE_MAX = 50;

/** GET /api/community — Liste des posts communautaires */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email.toLowerCase() })
      .select("_id")
      .lean();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Utilisateur introuvable." }, { status: 404 });
    }

    const currentUserId = currentUser._id as mongoose.Types.ObjectId;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const query: Record<string, unknown> = {};

    if (category && category !== "all") {
      if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
        return NextResponse.json(
          { success: false, error: "Catégorie inconnue." },
          { status: 400 }
        );
      }

      query.category = category;
    }

    const limite = Math.min(
      Math.max(1, Number.parseInt(searchParams.get("limit") ?? "", 10) || PAR_PAGE_DEFAUT),
      PAR_PAGE_MAX
    );

    const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "", 10) || 1);

    const [posts, total] = await Promise.all([
      CommunityPost.find(query)
        .sort({ isPinned: -1, createdAt: -1 })
        // `banned` sert à retirer les posts d'un compte suspendu.
        .populate("userId", "pseudonyme image banned")
        .skip((page - 1) * limite)
        .limit(limite)
        .lean(),

      CommunityPost.countDocuments(query),
    ]);

    const enriched = posts
      /**
       * Un compte suspendu disparaît du fil. On filtre après lecture plutôt
       * qu'avec un `$lookup` : l'ensemble d'une page est petit, et la requête
       * reste indexée.
       */
      .filter((post) => {
        const auteur = post.userId as unknown as { banned?: boolean } | null;
        return !auteur?.banned;
      })
      .map((post) => ({
        ...post,
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
        likedByMe: post.likes.some((uid) => uid.equals(currentUserId)),
      }));

    return NextResponse.json({
      success: true,
      posts: enriched,
      pagination: {
        total,
        page,
        limit: limite,
        totalPages: Math.max(1, Math.ceil(total / limite)),
        hasMore: page * limite < total,
      },
    });
  } catch (err) {
    console.error("GET /api/community :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}

/** POST /api/community — Créer un post communautaire */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    await connectDB();

    // Publier n'est pas une rafale : 5 posts / 10 min / IP.
    const rl = await rateLimit(req, 5, 600);

    if (rl.limited) {
      return NextResponse.json(
        {
          success: false,
          error: "Trop de publications d'affilée. Réessaie dans quelques minutes.",
          code: "RATE_LIMITED",
        },
        {
          status: 429,
          headers: rl.retryAfter ? { "Retry-After": String(rl.retryAfter) } : undefined,
        }
      );
    }

    const currentUser = await User.findOne({ email: session.user.email.toLowerCase() })
      .select("_id banned hasCompletedProfile")
      .lean();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Membre introuvable." }, { status: 404 });
    }

    if (currentUser.banned) {
      return NextResponse.json(
        { success: false, error: "Compte suspendu.", code: "ACCOUNT_BANNED" },
        { status: 403 }
      );
    }

    if (currentUser.hasCompletedProfile !== true) {
      return NextResponse.json(
        {
          success: false,
          error: "Complète ton profil avant de publier dans la Communauté.",
          code: "PROFILE_INCOMPLETE",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, content, category, emoji } = body;

    if (!title?.trim() || title.trim().length > 150) {
      return NextResponse.json({ success: false, error: "Titre invalide (1–150 caractères)." }, { status: 400 });
    }
    if (!content?.trim() || content.trim().length > 2000) {
      return NextResponse.json({ success: false, error: "Contenu invalide (1–2000 caractères)." }, { status: 400 });
    }
    if (!CATEGORIES.includes(category)) {
      return NextResponse.json(
        {
          success: false,
          error: "Catégorie inconnue.",
          allowedCategories: CATEGORIES,
        },
        { status: 400 }
      );
    }

    if (typeof emoji !== "string" || emoji.trim().length === 0 || emoji.length > 8) {
      return NextResponse.json(
        { success: false, error: "Emoji invalide." },
        { status: 400 }
      );
    }

    /**
     * Filtre anti-harcèlement — le même que la messagerie privée.
     *
     * Il manquait ici, alors que le fil est plus exposé : un message privé
     * atteint une personne, un post atteint tout le monde. Le contenu n'est pas
     * publié et un signalement automatique est créé pour la modération.
     */
    const moderation = moderateText(`${title}\n${content}`);

    if (moderation.blocked) {
      try {
        await Report.findOneAndUpdate(
          {
            reporterId: currentUser._id,
            targetType: "user",
            targetId: currentUser._id,
          },
          {
            $set: {
              reason: "harcèlement",
              status: "pending",
              details:
                "[AUTO] Filtre anti-harcèlement : publication bloquée dans la Communauté " +
                `(${moderation.category ?? "abus"}).`,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (reportErr) {
        console.warn("Signalement auto Communauté échoué :", reportErr);
      }

      return NextResponse.json(
        {
          success: false,
          error:
            "Cette publication enfreint nos règles de respect et n'a pas été publiée. Les échanges doivent rester bienveillants.",
          code: "POST_BLOCKED",
        },
        { status: 422 }
      );
    }

    const post = await CommunityPost.create({
      userId: currentUser._id,
      title: title.trim(),
      content: content.trim(),
      category,
      emoji,
    });

    const populated = await post.populate("userId", "pseudonyme image");

    return NextResponse.json({ success: true, post: populated }, { status: 201 });
  } catch (err) {
    console.error("POST /api/community :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
