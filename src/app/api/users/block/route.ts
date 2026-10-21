// src/app/api/users/block/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

/**
 * POST   /api/users/block  { targetUserId }  → bloquer
 * DELETE /api/users/block  { targetUserId }  → débloquer
 *
 * ## Ce qui a changé
 *
 * La route existait, écrivait dans `User.blockedUsers`, et c'était tout :
 * **aucune requête ne lisait ce tableau** et aucune interface n'appelait
 * cette route. Le blocage était annoncé sur la page d'aide, stocké en base,
 * et sans aucun effet.
 *
 * La lecture vit désormais dans `lib/blocages.ts`, appliquée à l'annuaire,
 * au Circle, aux matchs, à la messagerie, aux likes, aux visiteurs, à la
 * Communauté et à l'Entraide. Le bouton vit sur la fiche de profil.
 *
 * La validation, elle, manquait ici : un `targetUserId` qui n'était pas un
 * identifiant était poussé tel quel dans le tableau, où il restait sans
 * jamais correspondre à personne — une ligne morte que rien ne permettait
 * de retirer depuis l'interface.
 */

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
        { success: false, error: "Impossible de se bloquer soi-même." },
        { status: 400 }
      ),
    };
  }

  return { cible };
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

  await connectDB();

  /*
   * La cible doit exister. Sans ce contrôle, un identifiant bien formé mais
   * inconnu s'installait durablement dans le tableau.
   */
  const existe = await User.exists({ _id: lecture.cible });

  if (!existe) {
    return NextResponse.json(
      { success: false, error: "Membre introuvable." },
      { status: 404 }
    );
  }

  await User.findByIdAndUpdate(moi, {
    $addToSet: { blockedUsers: lecture.cible },
  });

  return NextResponse.json({ success: true });
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

  await connectDB();

  await User.findByIdAndUpdate(moi, {
    $pull: { blockedUsers: lecture.cible },
  });

  return NextResponse.json({ success: true });
}
