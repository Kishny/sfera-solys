// src/app/api/events/route.ts

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
 * Événements Solys.
 *
 * ## L'accès n'était pas contrôlé
 *
 * `/tarifs` vend « Événements exclusifs » à partir de l'offre Essentiel, et
 * `eventsAccess` vaut `false` sur l'offre gratuite. **Aucune des deux routes ne
 * lisait ce drapeau** : n'importe quel compte connecté pouvait consulter la
 * liste *et* s'inscrire.
 *
 * Partage retenu : la **liste reste visible par tous** — un événement à venir
 * est un argument, le cacher n'aide personne — mais **l'inscription demande une
 * offre payante**. C'est la présence qui est vendue, pas l'affiche. La réponse
 * porte `peutSinscrire` pour que la page le dise clairement au lieu de laisser
 * découvrir le refus au clic.
 */

/** GET /api/events — Liste des événements publiés */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email.toLowerCase() })
      .select("_id plan isPremium subscriptionStatus")
      .lean();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Membre introuvable." }, { status: 404 });
    }

    const currentUserId = currentUser._id as mongoose.Types.ObjectId;
    const now = new Date();

    /** Offre en vigueur : un abonnement résilié retombe sur l'offre gratuite. */
    const plan = planEffectif({
      plan: currentUser.plan,
      isPremium: currentUser.isPremium,
      subscriptionStatus: currentUser.subscriptionStatus,
    });

    const peutSinscrire = SUBSCRIPTION_PLANS[plan].features.eventsAccess === true;

    const events = await SolysEvent.find({ isPublished: true })
      .sort({ date: 1 })
      .lean();

    const enriched = events.map((event) => {
      const isRegistered = event.attendees.some((uid) => uid.equals(currentUserId));
      const isPast = event.date < now;
      const isFull = event.attendees.length >= event.maxAttendees;

      return {
        ...event,
        attendeeCount: event.attendees.length,
        isRegistered,
        isPast,
        isFull,
      };
    });

    return NextResponse.json({
      success: true,
      events: enriched,
      /** L'offre du membre autorise-t-elle l'inscription ? */
      peutSinscrire,
    });
  } catch (err) {
    console.error("GET /api/events :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}

/** POST /api/events — Créer un événement (admin uniquement) */
export async function POST(req: NextRequest) {
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

    if (currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Accès réservé aux administrateurs." }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, date, location, isOnline, maxAttendees, category, emoji, coverEmoji } = body;

    if (!title?.trim() || !description?.trim() || !date || !location?.trim() || !maxAttendees || !category || !emoji) {
      return NextResponse.json({ success: false, error: "Champs requis manquants." }, { status: 400 });
    }

    const event = await SolysEvent.create({
      title: title.trim(),
      description: description.trim(),
      date: new Date(date),
      location: location.trim(),
      isOnline: isOnline ?? false,
      maxAttendees: Number(maxAttendees),
      category: category.trim(),
      emoji,
      coverEmoji: coverEmoji ?? "🌙",
      createdBy: currentUser._id,
      isPublished: true,
    });

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (err) {
    console.error("POST /api/events :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
