// src/app/api/entraide/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { MentorPost } from "@/models/MentorPost";
import { Report } from "@/models/Report";
import { rateLimit } from "@/lib/rate-limiter";
import { moderateText } from "@/lib/text-moderation";
import mongoose from "mongoose";

/**
 * Entraide — questions et réponses entre membres.
 *
 * ## Le renommage, et pourquoi
 *
 * Cette fonctionnalité s'appelait **VibeMentor** et `/tarifs` facturait
 * « Coaching VibeMentor mensuel » dans l'offre Elite à 34,99 €, tandis que
 * `/fonctionnalites` promettait « coaching individuel », « ateliers
 * thématiques » et « ressources exclusives ».
 *
 * Le modèle dit autre chose. `MentorPost` porte une question, des **réponses
 * d'autres membres**, des votes et une réponse acceptée. Aucun coach, aucun
 * professionnel, aucun atelier, aucune ressource : c'est un forum d'entraide
 * entre pairs. Un bon produit, mais pas du coaching — et sûrement pas ce qui
 * justifie l'offre la plus chère du catalogue.
 *
 * Décision : la fonctionnalité est nommée pour ce qu'elle est et **ouverte à
 * tous**, comme la Communauté. Le drapeau `vibementorCoaching` disparaît de la
 * configuration : il n'était de toute façon lu nulle part.
 *
 * ## Les protections qui manquaient
 *
 * Les mêmes que la Communauté, et pour la même raison — un contenu public est
 * plus exposé qu'un message privé : aucun filtre de modération, aucune limite
 * de débit, aucun contrôle de compte suspendu, et une catégorie non validée qui
 * faisait répondre 500 au lieu de 400.
 */

/** Catégories acceptées — doit suivre l'enum de `models/MentorPost.ts`. */
const CATEGORIES = [
  "premier-contact",
  "profil",
  "rencontre",
  "relation",
  "securite",
  "autre",
] as const;

/** GET /api/entraide — Liste des questions */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
    const before = searchParams.get("before");

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

    if (before) {
      const date = new Date(before);
      if (!Number.isNaN(date.getTime())) query.createdAt = { $lt: date };
    }

    const posts = await MentorPost.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "pseudonyme image")
      .populate("answers.userId", "pseudonyme image")
      .lean();

    const currentUser = await User.findOne({ email: session.user.email.toLowerCase() }).select("_id").lean();
    const currentUserId = currentUser?._id?.toString();

    const enriched = posts.map((p) => ({
      ...p,
      likesCount: p.likes.length,
      likedByMe: currentUserId ? p.likes.some((id) => id.toString() === currentUserId) : false,
      answersCount: p.answers.length,
    }));

    return NextResponse.json({
      success: true,
      posts: enriched,
      hasMore: posts.length === limit,
      /**
       * Nécessaire à la page pour savoir qui peut retenir une réponse : seul
       * l'auteur d'une question le peut, et le client n'a pas d'autre moyen de
       * s'identifier dans les données renvoyées.
       */
      currentUserId: currentUserId ?? null,
    });
  } catch (err) {
    console.error("GET /api/entraide :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}

/** POST /api/entraide — Poser une question */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    await connectDB();

    // Poser une question n'est pas une rafale : 5 / 10 min / IP.
    const rl = await rateLimit(req, 5, 600);

    if (rl.limited) {
      return NextResponse.json(
        {
          success: false,
          error: "Trop de questions d'affilée. Réessaie dans quelques minutes.",
          code: "RATE_LIMITED",
        },
        {
          status: 429,
          headers: rl.retryAfter ? { "Retry-After": String(rl.retryAfter) } : undefined,
        }
      );
    }

    const currentUser = await User.findOne({ email: session.user.email.toLowerCase() })
      .select("_id banned")
      .lean();
    if (!currentUser) return NextResponse.json({ success: false, error: "Membre introuvable." }, { status: 404 });

    if (currentUser.banned) {
      return NextResponse.json(
        { success: false, error: "Compte suspendu.", code: "ACCOUNT_BANNED" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { question, category } = body;

    if (!question?.trim() || question.trim().length > 500) {
      return NextResponse.json({ success: false, error: "Question invalide (1–500 caractères)." }, { status: 400 });
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

    /** Même filtre que la messagerie privée et que la Communauté. */
    const moderation = moderateText(question);

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
                "[AUTO] Filtre anti-harcèlement : question bloquée dans l'Entraide " +
                `(${moderation.category ?? "abus"}).`,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (reportErr) {
        console.warn("Signalement auto Entraide échoué :", reportErr);
      }

      return NextResponse.json(
        {
          success: false,
          error:
            "Cette question enfreint nos règles de respect et n'a pas été publiée.",
          code: "QUESTION_BLOCKED",
        },
        { status: 422 }
      );
    }

    const post = await MentorPost.create({
      userId: currentUser._id,
      question: question.trim(),
      category,
    });

    const populated = await post.populate("userId", "pseudonyme image");
    return NextResponse.json({ success: true, post: populated }, { status: 201 });
  } catch (err) {
    console.error("POST /api/entraide :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
