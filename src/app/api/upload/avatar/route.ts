// src/app/api/upload/avatar/route.ts
//
// POST /api/upload/avatar
// Accepte un fichier image multipart/form-data (champ "file")
// Upload vers Cloudinary, sauvegarde l'URL dans User.image

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ModerationLog } from "@/models/ModerationLog";
import cloudinary, { verifierCloudinary, CLOUDINARY_INDISPONIBLE } from "@/lib/cloudinary";
import {
  getModerationUploadOption,
  evaluateModeration,
  MODERATION_REJECTION_MESSAGE,
} from "@/lib/moderation";
import { identifiantDeLEntree, modeDeLEntree } from "@/lib/photos-profil";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  // Sans clés Cloudinary, il n'y a nulle part où déposer l'image.
  if (!verifierCloudinary()) {
    return NextResponse.json(
      { success: false, error: CLOUDINARY_INDISPONIBLE, code: "UPLOAD_UNAVAILABLE" },
      { status: 503 }
    );
  }

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Non autorisé." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier fourni." },
        { status: 400 }
      );
    }

    // Validation type MIME
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Format non supporté. Utilisez JPG, PNG ou WebP." },
        { status: 400 }
      );
    }

    // Validation taille
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "Fichier trop lourd (max 5 Mo)." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload vers Cloudinary (avec modération automatique si activée — voir lib/moderation.ts)
    const result = await new Promise<{ secure_url: string; public_id: string; moderation?: unknown }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "sferasolys/avatars",
              transformation: [
                { width: 400, height: 400, crop: "fill", gravity: "face" },
              ],
              resource_type: "image",
              moderation: getModerationUploadOption(),
            },
            (err, res) => {
              if (err || !res) {
                reject(err ?? new Error("Cloudinary upload failed"));
              } else {
                resolve(res as { secure_url: string; public_id: string; moderation?: unknown });
              }
            }
          )
          .end(buffer);
      }
    );

    await connectDB();

    // Modération automatique : rejet → suppression immédiate sur Cloudinary, jamais sauvegardé en base.
    const verdict = evaluateModeration(result);
    if (!verdict.approved) {
      await cloudinary.uploader.destroy(result.public_id).catch(() => {});
      const rejectedUser = await User.findOne({ email: session.user.email.toLowerCase().trim() }).select("_id");
      if (rejectedUser) {
        await ModerationLog.create({
          userId: rejectedUser._id,
          context: "avatar",
          reason: verdict.reason ?? "Contenu rejeté",
        }).catch(() => {});
      }
      return NextResponse.json(
        { success: false, error: MODERATION_REJECTION_MESSAGE },
        { status: 400 }
      );
    }

    /**
     * L'ancien avatar est détruit avant d'être remplacé.
     *
     * Il ne l'était pas : la route écrivait la nouvelle adresse et
     * oubliait la précédente. Tous les avatars jamais déposés restaient
     * donc chez Cloudinary, à une adresse publique — chaque ancienne
     * photo de profil de chaque membre restait téléchargeable
     * indéfiniment. Sur un site de rencontre, ce n'est pas de l'hygiène
     * de stockage, c'est le droit à l'effacement.
     *
     * La destruction est faite après le dépôt réussi et avant
     * l'écriture : en cas d'échec du dépôt, l'ancienne photo est
     * toujours là, et le membre n'a rien perdu.
     *
     * Les avatars venus de Google ne sont pas chez nous : il n'y a rien
     * à y détruire, et l'identifiant extrait serait un faux.
     */
    const email = session.user.email.toLowerCase().trim();

    const precedent = await User.findOne({ email }).select("image");
    const ancienneAdresse = precedent?.image ?? "";

    if (ancienneAdresse.includes("res.cloudinary.com")) {
      const ancienIdentifiant = identifiantDeLEntree(ancienneAdresse);

      if (ancienIdentifiant && ancienIdentifiant !== result.public_id) {
        await cloudinary.uploader
          .destroy(ancienIdentifiant, { type: modeDeLEntree(ancienneAdresse) })
          .catch((erreur) => {
            // Un fichier qui résiste ne doit pas empêcher le changement
            // de photo, mais il doit se voir.
            console.warn(
              "[upload/avatar] L'ancien avatar n'a pas pu être détruit :",
              erreur
            );
          });
      }
    }

    await User.findOneAndUpdate(
      { email },
      { $set: { image: result.secure_url } }
    );

    return NextResponse.json(
      { success: true, imageUrl: result.secure_url },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Erreur POST /api/upload/avatar :", error);
    const err = error as { message?: string };

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de l'upload. Vérifiez vos clés Cloudinary.",
        message: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}
