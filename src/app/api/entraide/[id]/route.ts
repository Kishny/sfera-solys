// src/app/api/entraide/[id]/route.ts

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
 * POST /api/entraide/[id] — répondre, liker, ou accepter une réponse.
 *
 * Trois manques comblés :
 *
 * - **Aucun filtre de modération sur les réponses**, ni limite de débit, ni
 *   contrôle de compte suspendu. Mêmes protections que la Communauté.
 * - **`isAccepted` et `isSolved` n'étaient jamais écrits.** Le modèle prévoyait
 *   qu'une question soit résolue par une réponse retenue — c'est le principe
 *   même d'un forum d'entraide — et rien ne permettait de le faire. L'action
 *   `accept` existe, réservée à l'auteur de la question.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email.toLowerCase() })
      // `banned` sert au contrôle de compte suspendu ci-dessous.
      .select("_id pseudonyme image banned")
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

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "ID invalide." }, { status: 400 });
    }

    const post = await MentorPost.findById(id);
    if (!post) {
      return NextResponse.json({ success: false, error: "Question introuvable." }, { status: 404 });
    }

    const body = await req.json();
    const { action, content } = body;

    if (action === "answer") {
      if (!content?.trim() || content.trim().length > 1000) {
        return NextResponse.json({ success: false, error: "Réponse invalide (1–1000 caractères)." }, { status: 400 });
      }

      // Répondre n'est pas une rafale : 20 réponses / 10 min / IP.
      const rl = await rateLimit(req, 20, 600);

      if (rl.limited) {
        return NextResponse.json(
          {
            success: false,
            error: "Trop de réponses d'affilée. Réessaie dans quelques minutes.",
            code: "RATE_LIMITED",
          },
          {
            status: 429,
            headers: rl.retryAfter ? { "Retry-After": String(rl.retryAfter) } : undefined,
          }
        );
      }

      /** Même filtre que la messagerie privée et que la Communauté. */
      const moderation = moderateText(content);

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
                  "[AUTO] Filtre anti-harcèlement : réponse bloquée dans l'Entraide " +
                  `(${moderation.category ?? "abus"}).`,
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        } catch (reportErr) {
          console.warn("Signalement auto réponse Entraide échoué :", reportErr);
        }

        return NextResponse.json(
          {
            success: false,
            error:
              "Cette réponse enfreint nos règles de respect et n'a pas été publiée.",
            code: "ANSWER_BLOCKED",
          },
          { status: 422 }
        );
      }

      post.answers.push({
        _id: new mongoose.Types.ObjectId(),
        userId: currentUser._id as mongoose.Types.ObjectId,
        content: content.trim(),
        likes: [],
        isAccepted: false,
        createdAt: new Date(),
      });

      await post.save();

      const updated = await MentorPost.findById(id)
        .populate("userId", "pseudonyme image")
        .populate("answers.userId", "pseudonyme image")
        .lean();

      return NextResponse.json({ success: true, post: updated });
    }

    if (action === "like") {
      const currentUserId = currentUser._id as mongoose.Types.ObjectId;
      const likeIndex = post.likes.findIndex((uid) => uid.equals(currentUserId));

      if (likeIndex === -1) {
        post.likes.push(currentUserId);
      } else {
        post.likes.splice(likeIndex, 1);
      }

      await post.save();

      const updated = await MentorPost.findById(id)
        .populate("userId", "pseudonyme image")
        .populate("answers.userId", "pseudonyme image")
        .lean();

      return NextResponse.json({ success: true, post: updated });
    }

    /**
     * Accepter une réponse — réservé à l'auteur de la question.
     *
     * Une seule réponse retenue à la fois : accepter la deuxième retire la
     * première. `isSolved` suit l'existence d'une réponse retenue, plutôt que
     * d'être un drapeau séparé qui pourrait dériver.
     */
    if (action === "accept") {
      const currentUserId = currentUser._id as mongoose.Types.ObjectId;

      if (!post.userId.equals(currentUserId)) {
        return NextResponse.json(
          {
            success: false,
            error: "Seul l'auteur de la question peut retenir une réponse.",
            code: "NOT_QUESTION_AUTHOR",
          },
          { status: 403 }
        );
      }

      const answerId = typeof body?.answerId === "string" ? body.answerId : "";

      if (!mongoose.Types.ObjectId.isValid(answerId)) {
        return NextResponse.json(
          { success: false, error: "Réponse introuvable." },
          { status: 400 }
        );
      }

      const cible = post.answers.find((answer) => String(answer._id) === answerId);

      if (!cible) {
        return NextResponse.json(
          { success: false, error: "Réponse introuvable." },
          { status: 404 }
        );
      }

      // Bascule : re-accepter la réponse déjà retenue la désélectionne.
      const dejaRetenue = cible.isAccepted === true;

      for (const answer of post.answers) {
        answer.isAccepted = !dejaRetenue && String(answer._id) === answerId;
      }

      post.isSolved = !dejaRetenue;

      await post.save();

      const updated = await MentorPost.findById(id)
        .populate("userId", "pseudonyme image")
        .populate("answers.userId", "pseudonyme image")
        .lean();

      return NextResponse.json({ success: true, post: updated });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Action invalide. Utilise 'answer', 'like' ou 'accept'.",
      },
      { status: 400 }
    );
  } catch (err) {
    console.error("POST /api/entraide/[id] :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
