// src/app/api/messages/[matchId]/rendez-vous/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Match } from "@/models/Match";
import { Message } from "@/models/Message";
import { blocageEntre } from "@/lib/blocages";
import { envoyerPusher } from "@/lib/pusher";

/**
 * PATCH /api/messages/[matchId]/rendez-vous
 *
 * Répond à une proposition de rendez-vous, ou la retire.
 *
 * Corps : { messageId: string, reponse: "accepte" | "decline" | "annule" }
 *
 * QUI PEUT QUOI
 * - Le destinataire accepte ou décline. Il peut changer d'avis : un plan
 *   tombe à l'eau, et obliger à reproposer pour dire « finalement non »
 *   serait une rigidité gratuite.
 * - L'auteur annule, et seulement annule. Il ne peut pas accepter sa
 *   propre proposition.
 * - Une proposition annulée est close : elle ne se rouvre pas. Pour
 *   revenir dessus, on en fait une autre, et le fil garde la trace des
 *   deux.
 *
 * La règle vit ici, côté serveur. Le bouton masqué dans l'interface est
 * un confort, pas une protection.
 */

type Reponse = "accepte" | "decline" | "annule";

const REPONSES: Reponse[] = ["accepte", "decline", "annule"];

function estUnIdValide(valeur: string) {
  return mongoose.Types.ObjectId.isValid(valeur);
}

function autreMembre(match: any, moi: mongoose.Types.ObjectId) {
  const courant = moi.toString();
  const un = match.user1Id.toString();

  return un === courant ? match.user2Id.toString() : un;
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Non autorisé.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { matchId } = await context.params;

    if (!estUnIdValide(matchId)) {
      return NextResponse.json(
        { success: false, error: "Identifiant invalide.", code: "INVALID_MATCH_ID" },
        { status: 400 }
      );
    }

    let body: { messageId?: unknown; reponse?: unknown } | null = null;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Body JSON invalide.", code: "INVALID_JSON_BODY" },
        { status: 400 }
      );
    }

    const messageId = typeof body?.messageId === "string" ? body.messageId : "";
    const reponse = String(body?.reponse ?? "") as Reponse;

    if (!estUnIdValide(messageId) || !REPONSES.includes(reponse)) {
      return NextResponse.json(
        { success: false, error: "Réponse invalide.", code: "INVALID_ANSWER" },
        { status: 400 }
      );
    }

    await connectDB();

    const moi = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    }).select("_id banned");

    if (!moi || moi.banned) {
      return NextResponse.json(
        { success: false, error: "Accès refusé.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const match = await Match.findById(matchId);

    if (
      !match ||
      (match.user1Id.toString() !== moi._id.toString() &&
        match.user2Id.toString() !== moi._id.toString())
    ) {
      return NextResponse.json(
        { success: false, error: "Conversation introuvable.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Même garde que l'envoi : un blocage coupe la conversation dans les
    // deux sens, y compris pour répondre à ce qui a précédé.
    if (await blocageEntre(moi._id.toString(), autreMembre(match, moi._id))) {
      return NextResponse.json(
        { success: false, error: "Conversation introuvable.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const message = await Message.findOne({
      _id: messageId,
      matchId: match._id,
    });

    if (!message?.rendezVous) {
      return NextResponse.json(
        {
          success: false,
          error: "Cette proposition n'existe plus.",
          code: "MEETUP_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const jeSuisLAuteur = message.senderId.toString() === moi._id.toString();

    if (message.rendezVous.statut === "annule") {
      return NextResponse.json(
        {
          success: false,
          error: "Cette proposition a été retirée.",
          code: "MEETUP_CANCELLED",
        },
        { status: 409 }
      );
    }

    if (reponse === "annule" && !jeSuisLAuteur) {
      return NextResponse.json(
        {
          success: false,
          error: "Seul l'auteur peut retirer sa proposition.",
          code: "NOT_AUTHOR",
        },
        { status: 403 }
      );
    }

    if (reponse !== "annule" && jeSuisLAuteur) {
      return NextResponse.json(
        {
          success: false,
          error: "On ne répond pas à sa propre proposition.",
          code: "NOT_RECIPIENT",
        },
        { status: 403 }
      );
    }

    message.rendezVous.statut = reponse;
    message.rendezVous.reponduLe = new Date();

    await message.save();

    const charge = {
      messageId: message._id.toString(),
      statut: reponse,
      reponduLe: message.rendezVous.reponduLe.toISOString(),
    };

    /**
     * L'autre doit voir la réponse sans recharger : une proposition
     * acceptée dans un fil resté ouvert est exactement le moment où on
     * regarde l'écran.
     */
    try {
      await envoyerPusher(
        `private-match-${match._id.toString()}`,
        "rendez-vous-repondu",
        charge
      );
    } catch {
      // Le temps réel n'est pas la vérité : la base vient d'être écrite.
    }

    return NextResponse.json(
      { success: true, ...charge },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (erreur) {
    console.error("Erreur PATCH /api/messages/[matchId]/rendez-vous :", erreur);

    return NextResponse.json(
      { success: false, error: "Erreur serveur.", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
