/**
 * POST /api/upload/photo
 * Ajoute une photo supplémentaire au profil (max 3).
 * Accepte un fichier multipart/form-data (champ "file").
 * Retourne { success: true, url: string, photos: string[] }
 *
 * DELETE /api/upload/photo?url=<encoded_url>
 * Supprime une photo du tableau User.photos et sur Cloudinary.
 * Retourne { success: true, photos: string[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ModerationLog } from "@/models/ModerationLog";
import cloudinary, { verifierCloudinary, CLOUDINARY_INDISPONIBLE } from "@/lib/cloudinary";
import {
  deposerPhotoDeGalerie,
  galeriePubliee,
  identifiantDeLEntree,
  identifiantDepuisUrl,
  modeDeLEntree,
  referencePhoto,
} from "@/lib/photos-profil";
import {
  getModerationUploadOption,
  evaluateModeration,
  MODERATION_REJECTION_MESSAGE,
} from "@/lib/moderation";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
const MAX_PHOTOS = 3;

// ── POST — ajouter une photo ───────────────────────────────────────────────

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
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "Aucun fichier fourni." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: "Format non supporté. Utilisez JPG, PNG ou WebP." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: "Fichier trop lourd (max 5 Mo)." }, { status: 400 });
    }

    await connectDB();
    const email = session.user.email.toLowerCase().trim();
    const user = await User.findOne({ email }).select("photos");

    if (!user) {
      return NextResponse.json({ success: false, error: "Utilisateur introuvable." }, { status: 404 });
    }
    if ((user.photos ?? []).length >= MAX_PHOTOS) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_PHOTOS} photos autorisées.` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    /**
     * Déposée en mode authentifié, avec repli si le compte Cloudinary ne
     * sait pas la livrer ainsi. Le détail est dans `@/lib/photos-profil`.
     */
    const depot = await deposerPhotoDeGalerie(buffer, {
      transformation: [
        { width: 800, height: 1000, crop: "fill", gravity: "face" },
      ],
      moderation: getModerationUploadOption(),
    });

    const result = depot.brut as {
      secure_url: string;
      public_id: string;
      moderation?: unknown;
    };

    // Modération automatique : rejet → suppression Cloudinary, jamais ajoutée à User.photos.
    const verdict = evaluateModeration(result);
    if (!verdict.approved) {
      await cloudinary.uploader
        .destroy(depot.publicId, { type: depot.mode, invalidate: true })
        .catch(() => {});
      await ModerationLog.create({
        userId: user._id,
        context: "profile_photo",
        reason: verdict.reason ?? "Contenu rejeté",
      }).catch(() => {});
      return NextResponse.json(
        { success: false, error: MODERATION_REJECTION_MESSAGE },
        { status: 400 }
      );
    }

    /**
     * C'est la référence qui est stockée, pas l'adresse : l'adresse
     * signée est recalculée à chaque lecture.
     */
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $push: { photos: referencePhoto(depot.publicId, depot.mode) } },
      { new: true }
    ).select("photos");

    return NextResponse.json({
      success: true,
      url: depot.url,
      photos: galeriePubliee(updatedUser?.photos),
    });
  } catch (err) {
    console.error("POST /api/upload/photo :", err);
    return NextResponse.json({ success: false, error: "Erreur lors de l'upload." }, { status: 500 });
  }
}

// ── DELETE — supprimer une photo ───────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    const url = req.nextUrl.searchParams.get("url");
    if (!url) {
      return NextResponse.json({ success: false, error: "Paramètre url manquant." }, { status: 400 });
    }

    await connectDB();
    const email = session.user.email.toLowerCase().trim();

    /**
     * Le client supprime par l'adresse qu'il affiche.
     *
     * Or ce n'est plus l'adresse qui est stockée : il faut retrouver
     * quelle entrée l'a produite. La comparaison se fait sur
     * l'identifiant Cloudinary, qui est stable, et non sur l'adresse
     * elle-même, qui porte une signature.
     */
    const utilisateur = await User.findOne({ email }).select("photos");

    if (!utilisateur) {
      return NextResponse.json({ success: false, error: "Utilisateur introuvable." }, { status: 404 });
    }

    const identifiantVise = identifiantDepuisUrl(url);

    const entree = (utilisateur.photos ?? []).find(
      (candidate) =>
        candidate === url ||
        (identifiantVise !== null &&
          identifiantDeLEntree(candidate) === identifiantVise)
    );

    if (!entree) {
      return NextResponse.json(
        { success: false, error: "Cette photo n'est pas dans ta galerie." },
        { status: 404 }
      );
    }

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $pull: { photos: entree } },
      { new: true }
    ).select("photos");

    // Supprimer sur Cloudinary (silencieux si échec)
    try {
      const publicId = identifiantDeLEntree(entree);

      if (publicId) {
        await cloudinary.uploader.destroy(publicId, {
          type: modeDeLEntree(entree),
          /**
           * `invalidate` purge le cache du CDN.
           *
           * Sans lui, Cloudinary retire le fichier de son origine mais
           * les serveurs de bordure continuent de servir la copie qu'ils
           * ont déjà, jusqu'à expiration. Une photo « supprimée » reste
           * alors téléchargeable par qui a l'adresse — ce qui vide la
           * suppression de son sens.
           */
          invalidate: true,
        });
      }
    } catch (cloudErr) {
      console.warn("Cloudinary delete échoué :", cloudErr);
    }

    return NextResponse.json({
      success: true,
      photos: galeriePubliee(updatedUser?.photos),
    });
  } catch (err) {
    console.error("DELETE /api/upload/photo :", err);
    return NextResponse.json({ success: false, error: "Erreur lors de la suppression." }, { status: 500 });
  }
}
