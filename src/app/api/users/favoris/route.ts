// src/app/api/users/favoris/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { blocagesDe } from "@/lib/blocages";

/**
 * GET    /api/users/favoris  → les profils mis en favori
 * POST   /api/users/favoris  { targetUserId }  → ajouter
 * DELETE /api/users/favoris  { targetUserId }  → retirer
 *
 * Le favori est **privé** : rien n'est notifié, et la personne visée ne
 * peut pas savoir qu'elle y figure. C'est ce qui le distingue du like, qui
 * est un signal envoyé et peut déclencher une mise en relation.
 *
 * Les gardes reprennent celles de la route de blocage : identifiant
 * valide, cible existante, et pas soi-même.
 */

const MAX_FAVORIS = 100;

/** Lit et valide la cible, ou renvoie la réponse d'erreur correspondante. */
async function lireCible(req: NextRequest, moi: string) {
  let corps: { targetUserId?: unknown } | null = null;

  try {
    corps = await req.json();
  } catch {
    return {
      erreur: NextResponse.json(
        { success: false, error: "Corps de requête illisible." },
        { status: 400 }
      ),
    };
  }

  const cible = String(corps?.targetUserId ?? "");

  if (!mongoose.Types.ObjectId.isValid(cible)) {
    return {
      erreur: NextResponse.json(
        { success: false, error: "targetUserId invalide." },
        { status: 400 }
      ),
    };
  }

  if (cible === moi) {
    return {
      erreur: NextResponse.json(
        { success: false, error: "Impossible de se mettre soi-même en favori." },
        { status: 400 }
      ),
    };
  }

  return { cible };
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Non authentifié." },
      { status: 401 }
    );
  }

  try {
    await connectDB();

    const moi = String(session.user.id);
    const profil = await User.findById(moi).select("favoris").lean();

    const ids = ((profil?.favoris ?? []) as unknown[])
      .map((valeur) => String(valeur ?? ""))
      .filter((texte) => mongoose.Types.ObjectId.isValid(texte));

    if (ids.length === 0) {
      return NextResponse.json({ success: true, favoris: [] }, { status: 200 });
    }

    /*
     * Un blocage survenu depuis la mise en favori l'emporte : on ne
     * réaffiche pas quelqu'un qui a coupé le lien, même d'une liste privée.
     */
    const blocages = await blocagesDe(moi);

    const profils = await User.find({
      _id: {
        $in: ids,
        ...(blocages.ids.length ? { $nin: blocages.ids } : {}),
      },
      banned: { $ne: true },
      hasCompletedProfile: true,
      visibilite: { $ne: "invisible" },
    })
      .select(
        "_id pseudonyme age localisation departement image identityVerified"
      )
      .lean();

    // L'ordre de la liste fait foi : le plus récemment ajouté d'abord.
    const parId = new Map(profils.map((p) => [String(p._id), p]));
    const ordonnes = [...ids]
      .reverse()
      .map((id) => parId.get(id))
      .filter(Boolean);

    return NextResponse.json(
      { success: true, favoris: ordonnes, total: ordonnes.length },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (erreur) {
    console.error("GET /api/users/favoris :", erreur);
    return NextResponse.json(
      { success: false, error: "Impossible de lire tes favoris." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Non authentifié." },
      { status: 401 }
    );
  }

  const moi = String(session.user.id);
  const lecture = await lireCible(req, moi);
  if (lecture.erreur) return lecture.erreur;

  try {
    await connectDB();

    const existe = await User.exists({ _id: lecture.cible });

    if (!existe) {
      return NextResponse.json(
        { success: false, error: "Membre introuvable." },
        { status: 404 }
      );
    }

    /*
     * Plafond volontaire. Sans lui, le tableau grossit sans limite dans un
     * document déjà chargé, et la lecture finit par ramener des centaines
     * de profils d'un coup.
     */
    const profil = await User.findById(moi).select("favoris").lean();
    const dejaDedans = ((profil?.favoris ?? []) as unknown[]).some(
      (valeur) => String(valeur) === lecture.cible
    );

    if (!dejaDedans && (profil?.favoris ?? []).length >= MAX_FAVORIS) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum ${MAX_FAVORIS} favoris. Retires-en un pour en ajouter un autre.`,
          code: "FAVORIS_PLEIN",
        },
        { status: 400 }
      );
    }

    await User.findByIdAndUpdate(moi, {
      $addToSet: { favoris: lecture.cible },
    });

    return NextResponse.json({ success: true, favori: true });
  } catch (erreur) {
    console.error("POST /api/users/favoris :", erreur);
    return NextResponse.json(
      { success: false, error: "Impossible d'ajouter ce favori." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Non authentifié." },
      { status: 401 }
    );
  }

  const moi = String(session.user.id);
  const lecture = await lireCible(req, moi);
  if (lecture.erreur) return lecture.erreur;

  try {
    await connectDB();

    await User.findByIdAndUpdate(moi, {
      $pull: { favoris: lecture.cible },
    });

    return NextResponse.json({ success: true, favori: false });
  } catch (erreur) {
    console.error("DELETE /api/users/favoris :", erreur);
    return NextResponse.json(
      { success: false, error: "Impossible de retirer ce favori." },
      { status: 500 }
    );
  }
}
