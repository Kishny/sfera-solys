// src/app/api/users/ecarter/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

/**
 * POST   /api/users/ecarter  { targetUserId }  → écarter un profil
 * DELETE /api/users/ecarter  { targetUserId }  → le remettre en circulation
 *
 * Le bouton « Passer » de la fiche de profil. Le profil sort d'Explorer et
 * du Circle, et de là seulement.
 *
 * ## Ce que ça ne fait pas
 *
 * Écarter n'est pas bloquer. Un match déjà noué et sa conversation restent
 * intacts, la personne écartée continue de voir le profil de celui qui
 * l'écarte, et rien ne lui est signalé. « Passer » est un geste léger —
 * en faire une rupture de lien serait disproportionné, et surprendrait
 * quiconque a cliqué sans y penser.
 *
 * Le retrait existe pour cette raison : un geste léger doit pouvoir se
 * défaire. Il n'a pas encore d'interface, mais la route est là.
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
        { success: false, error: "Impossible de s'écarter soi-même." },
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
     * `$addToSet` et non `$push` : repasser deux fois sur le même profil
     * ne doit pas l'inscrire deux fois.
     *
     * Le favori est retiré au passage — garder en favori quelqu'un qu'on
     * vient d'écarter n'a pas de sens, et la liste des favoris ne doit pas
     * contredire la découverte.
     */
    await User.findByIdAndUpdate(moi, {
      $addToSet: { profilsEcartes: lecture.cible },
      $pull: { favoris: lecture.cible },
    });

    return NextResponse.json({ success: true, ecarte: true });
  } catch (erreur) {
    console.error("POST /api/users/ecarter :", erreur);
    return NextResponse.json(
      { success: false, error: "Impossible d'écarter ce profil." },
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
      $pull: { profilsEcartes: lecture.cible },
    });

    return NextResponse.json({ success: true, ecarte: false });
  } catch (erreur) {
    console.error("DELETE /api/users/ecarter :", erreur);
    return NextResponse.json(
      { success: false, error: "Impossible de remettre ce profil." },
      { status: 500 }
    );
  }
}
