// src/app/api/community/[id]/route.ts

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
 * POST /api/community/[id] — liker ou commenter un post.
 *
 * Deux manques corrigés, les mêmes que sur la création de post : les
 * commentaires n'étaient **pas filtrés** par la modération anti-harcèlement
 * (contrairement aux messages privés, pourtant moins exposés), et un membre
 * banni pouvait commenter et liker.
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
      .select("_id banned")
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

    const post = await CommunityPost.findById(id);
    if (!post) {
      return NextResponse.json({ success: false, error: "Post introuvable." }, { status: 404 });
    }

    const body = await req.json();
    const { action, content } = body;

    if (action === "like") {
      const currentUserId = currentUser._id as mongoose.Types.ObjectId;
      const likeIndex = post.likes.findIndex((uid) => uid.equals(currentUserId));

      if (likeIndex === -1) {
        post.likes.push(currentUserId);
      } else {
        post.likes.splice(likeIndex, 1);
      }

      await post.save();

      const updated = await CommunityPost.findById(id)
        .populate("userId", "pseudonyme image")
        .populate("comments.userId", "pseudonyme image")
        .lean();

      return NextResponse.json({ success: true, post: updated });
    }

    if (action === "comment") {
      if (!content?.trim() || content.trim().length > 500) {
        return NextResponse.json({ success: false, error: "Commentaire invalide (1–500 caractères)." }, { status: 400 });
      }

      // Commenter n'est pas une rafale : 20 commentaires / 10 min / IP.
      const rl = await rateLimit(req, 20, 600);

      if (rl.limited) {
        return NextResponse.json(
          {
            success: false,
            error: "Trop de commentaires d'affilée. Réessaie dans quelques minutes.",
            code: "RATE_LIMITED",
          },
          {
            status: 429,
            headers: rl.retryAfter ? { "Retry-After": String(rl.retryAfter) } : undefined,
          }
        );
      }

      /** Même filtre que la messagerie privée et que la création de post. */
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
                  "[AUTO] Filtre anti-harcèlement : commentaire bloqué dans la Communauté " +
                  `(${moderation.category ?? "abus"}).`,
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        } catch (reportErr) {
          console.warn("Signalement auto commentaire échoué :", reportErr);
        }

        return NextResponse.json(
          {
            success: false,
            error:
              "Ce commentaire enfreint nos règles de respect et n'a pas été publié.",
            code: "COMMENT_BLOCKED",
          },
          { status: 422 }
        );
      }

      post.comments.push({
        _id: new mongoose.Types.ObjectId(),
        userId: currentUser._id as mongoose.Types.ObjectId,
        content: content.trim(),
        createdAt: new Date(),
      });

      await post.save();

      const updated = await CommunityPost.findById(id)
        .populate("userId", "pseudonyme image")
        .populate("comments.userId", "pseudonyme image")
        .lean();

      return NextResponse.json({ success: true, post: updated });
    }

    return NextResponse.json({ success: false, error: "Action invalide. Utilisez 'like' ou 'comment'." }, { status: 400 });
  } catch (err) {
    console.error("POST /api/community/[id] :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}

/** DELETE /api/community/[id] — Supprimer un post (auteur ou admin) */
export async function DELETE(
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
      .select("_id role")
      .lean();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Utilisateur introuvable." }, { status: 404 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "ID invalide." }, { status: 400 });
    }

    const post = await CommunityPost.findById(id);
    if (!post) {
      return NextResponse.json({ success: false, error: "Post introuvable." }, { status: 404 });
    }

    const currentUserId = currentUser._id as mongoose.Types.ObjectId;
    const isAuthor = post.userId.equals(currentUserId);
    const isAdmin = currentUser.role === "admin";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ success: false, error: "Action non autorisée." }, { status: 403 });
    }

    await CommunityPost.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/community/[id] :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
