// src/app/api/events/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { SolysEvent } from "@/models/SolysEvent";
import { planEffectif } from "@/lib/quotas";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription/config";
import mongoose from "mongoose";

/**
 * POST /api/events/[id] — s'inscrire ou se désinscrire d'un événement.
 *
 * ## Quatre contrôles qui manquaient
 *
 * - **L'offre.** `eventsAccess` est `false` sur l'offre gratuite et `/tarifs`
 *   vend les événements à partir d'Essentiel : n'importe quel compte pouvait
 *   s'inscrire. Se **dés**inscrire reste autorisé quelle que soit l'offre — un
 *   abonnement qui expire ne doit pas enfermer quelqu'un dans une inscription.
 * - **La date.** On pouvait s'inscrire à un événement déjà passé.
 * - **La publication.** Un événement non publié était ouvert à qui avait son
 *   identifiant.
 * - **La place, pour de vrai.** L'ancienne version lisait l'événement,
 *   comparait `attendees.length` à `maxAttendees`, puis sauvegardait. Deux
 *   inscriptions simultanées sur la dernière place passaient toutes les deux.
 *   L'inscription est maintenant un `findOneAndUpdate` atomique dont le filtre
 *   contient la condition de capacité : c'est MongoDB qui arbitre, pas l'ordre
 *   d'arrivée dans Node.
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
      .select("_id banned plan isPremium subscriptionStatus")
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

    const event = await SolysEvent.findById(id).select(
      "_id date isPublished maxAttendees attendees"
    );

    if (!event) {
      return NextResponse.json({ success: false, error: "Événement introuvable." }, { status: 404 });
    }

    const currentUserId = currentUser._id as mongoose.Types.ObjectId;
    const estInscrit = event.attendees.some((uid) => uid.equals(currentUserId));

    /**
     * Désinscription : toujours permise.
     *
     * Traitée avant les contrôles d'accès, volontairement. Un abonnement qui
     * expire ne doit pas laisser quelqu'un inscrit sans pouvoir se retirer.
     */
    if (estInscrit) {
      const misAJour = await SolysEvent.findOneAndUpdate(
        { _id: event._id },
        { $pull: { attendees: currentUserId } },
        { new: true }
      ).select("attendees");

      return NextResponse.json({
        success: true,
        registered: false,
        attendeeCount: misAJour?.attendees.length ?? 0,
      });
    }

    if (!event.isPublished) {
      return NextResponse.json(
        { success: false, error: "Cet événement n'est pas ouvert.", code: "EVENT_UNPUBLISHED" },
        { status: 403 }
      );
    }

    if (event.date.getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: "Cet événement a déjà eu lieu.", code: "EVENT_PAST" },
        { status: 409 }
      );
    }

    const plan = planEffectif({
      plan: currentUser.plan,
      isPremium: currentUser.isPremium,
      subscriptionStatus: currentUser.subscriptionStatus,
    });

    if (SUBSCRIPTION_PLANS[plan].features.eventsAccess !== true) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Les événements Solys s'ouvrent à partir de l'offre Essentiel. La liste, elle, reste visible.",
          code: "EVENTS_NOT_IN_PLAN",
          upgradeUrl: "/tarifs",
        },
        { status: 403 }
      );
    }

    /**
     * Inscription atomique.
     *
     * La condition de capacité est dans le filtre : si l'événement s'est rempli
     * entre-temps, la mise à jour ne trouve rien et renvoie `null`. Aucune
     * fenêtre entre la lecture et l'écriture.
     */
    const misAJour = await SolysEvent.findOneAndUpdate(
      {
        _id: event._id,
        isPublished: true,
        $expr: { $lt: [{ $size: "$attendees" }, "$maxAttendees"] },
      },
      { $addToSet: { attendees: currentUserId } },
      { new: true }
    ).select("attendees");

    if (!misAJour) {
      return NextResponse.json(
        { success: false, error: "Cet événement est complet.", code: "EVENT_FULL" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      registered: true,
      attendeeCount: misAJour.attendees.length,
    });
  } catch (err) {
    console.error("POST /api/events/[id] :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
