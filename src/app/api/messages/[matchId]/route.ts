// src/app/api/messages/[matchId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Match } from "@/models/Match";
import { blocageEntre } from "@/lib/blocages";
import { Message } from "@/models/Message";
import {
  identifiantValide,
  modeValide,
  urlPubliqueDuMedia,
} from "@/lib/medias";
import { SolysEvent } from "@/models/SolysEvent";
import { Report } from "@/models/Report";
import { envoyerPusher } from "@/lib/pusher";
import { sendNewMessagePush } from "@/lib/push";
import { moderateText } from "@/lib/text-moderation";
import { quotaMessagesDuJour } from "@/lib/quotas";
import { estEnSourdine } from "@/lib/matches";

/**
 * API Messages Sfera'Solys.
 *
 * GET /api/messages/[matchId]
 * - récupère les messages d'un match ;
 * - vérifie que l'utilisateur connecté fait partie du match ;
 * - marque comme lus les messages reçus.
 *
 * POST /api/messages/[matchId]
 * - envoie un message texte ;
 * - met à jour lastMessageAt du match ;
 * - notifie le canal Pusher private-match-[matchId].
 *
 * Mobile-first côté API :
 * - payload léger ;
 * - pagination limitée ;
 * - message limité à 1000 caractères ;
 * - pas de données inutiles.
 */

const MAX_MESSAGE_LENGTH = 1000;

/** Deux minutes, comme le composeur l'impose côté client. */
const DUREE_VOCAL_MAX = 130;
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 60;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function isValidObjectId(id: unknown): id is string {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id);
}

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);

  if (Number.isNaN(parsed) || parsed <= 0) return fallback;

  return parsed;
}

function getOtherUserId(match: any, currentUserId: mongoose.Types.ObjectId) {
  const current = currentUserId.toString();
  const user1 = match.user1Id.toString();
  const user2 = match.user2Id.toString();

  return user1 === current ? user2 : user1;
}

/**
 * Next.js App Router peut fournir params directement ou sous forme promise
 * selon versions / typages.
 *
 * Next 15 a tranché : `params` est toujours une promesse, et son validateur de
 * routes généré rejette l'union (`{ matchId: string } | Promise<…>`) qui était
 * déclarée ici — deux erreurs de types masquées par `ignoreBuildErrors`. On
 * garde le helper pour la lisibilité des appels.
 */
async function resolveParams(params: Promise<{ matchId: string }>) {
  return await params;
}

/**
 * Vérifie que l'utilisateur connecté fait bien partie du match.
 *
 * Retourne :
 * - currentUserId
 * - match
 *
 * Si l'accès est refusé, retourne null.
 */
async function authorizeMatchAccess(matchId: string, sessionEmail: string) {
  if (!isValidObjectId(matchId)) return null;

  await connectDB();

  const currentUser = await User.findOne({
    email: sessionEmail.toLowerCase().trim(),
  }).select(
    // plan / isPremium / subscriptionStatus : quota quotidien de messages.
    "_id banned plan isPremium subscriptionStatus"
  );

  if (!currentUser || currentUser.banned) return null;

  const currentUserId = currentUser._id as mongoose.Types.ObjectId;

  const match = await Match.findOne({
    _id: new mongoose.Types.ObjectId(matchId),
    $or: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
    isActive: true,
  });

  if (!match) return null;

  /**
   * Blocage entre les deux participants.
   *
   * Cette garde sert à la fois la lecture et l'envoi : la conversation
   * devient inaccessible des deux côtés, et personne ne peut plus écrire à
   * quelqu'un qui l'a bloqué. C'était le trou le plus grave — un membre
   * bloqué continuait d'envoyer des messages, et ils arrivaient.
   *
   * Même retour que pour un match inexistant : la réponse ne distingue pas
   * les deux cas, pour ne pas confirmer l'existence d'un blocage.
   */
  if (await blocageEntre(currentUserId, getOtherUserId(match, currentUserId))) {
    return null;
  }

  return {
    currentUserId,
    currentUser,
    match,
  };
}

/**
 * Une URL de média est-elle bien l'une des nôtres ?
 *
 * Le fil n'affiche et ne joue que des fichiers déposés sur notre compte
 * Cloudinary, dans le dossier attendu. Tout le reste est refusé : un
 * champ libre pointant vers un fichier distant serait un traceur offert
 * à l'expéditeur, qui saurait quand le destinataire ouvre la
 * conversation.
 */
function estUnMediaCloudinary(url: string, dossier: string): boolean {
  const nomDuCompte = process.env.CLOUDINARY_CLOUD_NAME?.trim();

  if (!nomDuCompte) return false;

  let adresse: URL;

  try {
    adresse = new URL(url);
  } catch {
    return false;
  }

  if (adresse.protocol !== "https:") return false;
  if (adresse.hostname !== "res.cloudinary.com") return false;

  return (
    adresse.pathname.startsWith(`/${nomDuCompte}/`) &&
    adresse.pathname.includes(`/${dossier}/`)
  );
}

/**
 * Construit un message propre à renvoyer au frontend.
 */
/**
 * Construit un message propre à renvoyer au frontend.
 *
 * Les médias sont servis par notre route, jamais par Cloudinary : le
 * client ne reçoit plus d'adresse qu'un inconnu pourrait réutiliser.
 */
function serializeMessage(message: any) {
  const matchId = message.matchId?.toString();

  return {
    _id: message._id?.toString(),
    matchId,
    senderId: message.senderId?.toString(),
    content: message.content ?? "",
    imageUrl: urlPubliqueDuMedia(message, matchId, "photo"),
    audioUrl: urlPubliqueDuMedia(message, matchId, "vocal"),
    audioDuree:
      typeof message.audioDuree === "number" ? message.audioDuree : null,
    lieu: message.lieu
      ? {
          libelle: message.lieu.libelle,
          lat: message.lieu.lat,
          lng: message.lieu.lng,
        }
      : null,
    /**
     * L'événement est servi depuis sa source, pas depuis une copie
     * figée : une date qui bouge doit bouger dans la conversation aussi.
     * `evenement: null` avec `evenementPartage: true` dit « cet
     * événement n'existe plus », ce que l'affichage traduit.
     */
    evenementPartage: Boolean(message.evenementId),
    evenement:
      message.evenementId &&
      typeof message.evenementId === "object" &&
      "title" in message.evenementId &&
      // Un événement dépublié après coup redevient indisponible : la
      // carte doit le dire plutôt que d'annoncer une soirée annulée.
      (message.evenementId as any).isPublished !== false
        ? {
            _id: (message.evenementId as any)._id?.toString(),
            titre: (message.evenementId as any).title,
            date: (message.evenementId as any).date,
            lieu: (message.evenementId as any).location,
            emoji: (message.evenementId as any).emoji ?? "",
            enLigne: Boolean((message.evenementId as any).isOnline),
          }
        : null,
    rendezVous: message.rendezVous
      ? {
          quand: message.rendezVous.quand,
          ou: message.rendezVous.ou,
          note: message.rendezVous.note ?? "",
          statut: message.rendezVous.statut,
          reponduLe: message.rendezVous.reponduLe ?? null,
        }
      : null,
    readAt: message.readAt || null,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

// ─────────────────────────────────────────────
// GET /api/messages/[matchId]
// ─────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Non autorisé.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    const { matchId } = await resolveParams(context.params);

    if (!isValidObjectId(matchId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Identifiant de match invalide.",
          code: "INVALID_MATCH_ID",
        },
        { status: 400 }
      );
    }

    const access = await authorizeMatchAccess(matchId, session.user.email);

    if (!access) {
      return NextResponse.json(
        {
          success: false,
          error: "Match introuvable ou accès refusé.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    const { currentUserId, match } = access;

    const { searchParams } = new URL(req.url);

    const limit = Math.min(
      parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT),
      MAX_LIMIT
    );

    const before = searchParams.get("before");

    /**
     * Requête messages.
     *
     * Sans before :
     * - on charge les derniers messages.
     *
     * Avec before :
     * - on charge les messages plus anciens que la date fournie.
     */
    const query: Record<string, unknown> = {
      matchId: match._id,
    };

    if (before) {
      const beforeDate = new Date(before);

      if (!Number.isNaN(beforeDate.getTime())) {
        query.createdAt = { $lt: beforeDate };
      }
    }

    /**
     * On récupère en descendant pour avoir les plus récents rapidement,
     * puis on reverse pour afficher chronologiquement côté frontend.
     */
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("evenementId", "title date location emoji isOnline isPublished")
      .lean();

    const orderedMessages = messages.reverse().map(serializeMessage);

    /**
     * Marquer les messages reçus comme lus + émettre l'event Pusher
     * pour que l'expéditeur voie la double-coche bleue en temps réel.
     */
    const readNow = new Date();
    const updateResult = await Message.updateMany(
      {
        matchId: match._id,
        senderId: { $ne: currentUserId },
        readAt: null,
      },
      { $set: { readAt: readNow } }
    );

    const otherUserId = getOtherUserId(match, currentUserId);

    // Notifier l'expéditeur si des messages viennent d'être lus
    if (updateResult.modifiedCount > 0) {
      try {
        await envoyerPusher(
          `private-match-${match._id.toString()}`,
          'messages-read',
          { readerId: currentUserId.toString(), readAt: readNow.toISOString() }
        );
      } catch {
        // non bloquant
      }
    }

    return NextResponse.json(
      {
        success: true,
        messages: orderedMessages,
        currentUserId: currentUserId.toString(),
        otherUserId,
        hasMore: messages.length === limit,
        pagination: {
          limit,
          before: before || null,
          nextBefore:
            orderedMessages.length > 0 ? orderedMessages[0].createdAt : null,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Erreur GET /api/messages/[matchId] :", error);

    const err = error as { message?: string };

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur.",
        code: "INTERNAL_SERVER_ERROR",
        message:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────
// POST /api/messages/[matchId]
// ─────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Non autorisé.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    const { matchId } = await resolveParams(context.params);

    if (!isValidObjectId(matchId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Identifiant de match invalide.",
          code: "INVALID_MATCH_ID",
        },
        { status: 400 }
      );
    }

    const access = await authorizeMatchAccess(matchId, session.user.email);

    if (!access) {
      return NextResponse.json(
        {
          success: false,
          error: "Match introuvable ou accès refusé.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    const { currentUserId, currentUser, match } = access;

    let body: {
      content?: unknown;
      imageUrl?: unknown;
      imagePublicId?: unknown;
      imageType?: unknown;
      audioUrl?: unknown;
      audioPublicId?: unknown;
      audioType?: unknown;
      audioDuree?: unknown;
      lieu?: unknown;
      rendezVous?: unknown;
      evenementId?: unknown;
    } | null = null;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Body JSON invalide.",
          code: "INVALID_JSON_BODY",
        },
        { status: 400 }
      );
    }

    const content =
      typeof body?.content === "string" ? body.content.trim() : "";

    /**
     * La photo jointe.
     *
     * Seule une URL produite par notre propre compte Cloudinary est
     * acceptée. Sans ce contrôle, le champ laisserait afficher dans le fil
     * n'importe quelle image du web — un traceur, ou pire — sous couvert
     * d'un message. L'upload réel, lui, se fait en amont par
     * `POST /api/upload/chat-image`, qui applique la modération.
     */
    const imageBrute =
      typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";

    let imageUrl: string | null = null;

    if (imageBrute) {
      if (!estUnMediaCloudinary(imageBrute, "sferasolys/chat")) {
        return NextResponse.json(
          {
            success: false,
            error: "Cette image n'a pas été déposée par Sfera'Solys.",
            code: "INVALID_IMAGE_URL",
          },
          { status: 400 }
        );
      }

      imageUrl = imageBrute;
    }

    /**
     * L'identifiant Cloudinary de la photo.
     *
     * C'est lui qui compte désormais : il permet de reconstruire
     * l'adresse à la lecture. Il vient du client, donc on vérifie qu'il
     * désigne bien le dossier des photos de conversation.
     */
    let imagePublicId: string | null = null;
    let imageType: "upload" | "authenticated" = "upload";

    if (typeof body?.imagePublicId === "string" && body.imagePublicId) {
      if (!identifiantValide(body.imagePublicId, "photo")) {
        return NextResponse.json(
          {
            success: false,
            error: "Cette image n'a pas été déposée par Sfera'Solys.",
            code: "INVALID_IMAGE_ID",
          },
          { status: 400 }
        );
      }

      imagePublicId = body.imagePublicId;

      // Un mode inconnu retombe sur l'accès libre : au pire la photo est
      // servie sans signature, jamais introuvable.
      imageType = modeValide(body?.imageType);
    }

    /**
     * Le message vocal.
     *
     * Même contrôle d'origine que pour l'image. La durée n'est qu'un
     * affichage — elle vient du client — donc elle est bornée ici plutôt
     * que crue.
     */
    const audioBrut =
      typeof body?.audioUrl === "string" ? body.audioUrl.trim() : "";

    let audioUrl: string | null = null;
    let audioPublicId: string | null = null;
    let audioType: "upload" | "authenticated" = "upload";
    let audioDuree: number | null = null;

    if (audioBrut) {
      if (!estUnMediaCloudinary(audioBrut, "sferasolys/chat-audio")) {
        return NextResponse.json(
          {
            success: false,
            error: "Cet enregistrement n'a pas été déposé par Sfera'Solys.",
            code: "INVALID_AUDIO_URL",
          },
          { status: 400 }
        );
      }

      audioUrl = audioBrut;

      if (typeof body?.audioPublicId === "string" && body.audioPublicId) {
        if (!identifiantValide(body.audioPublicId, "vocal")) {
          return NextResponse.json(
            {
              success: false,
              error: "Cet enregistrement n'a pas été déposé par Sfera'Solys.",
              code: "INVALID_AUDIO_ID",
            },
            { status: 400 }
          );
        }

        audioPublicId = body.audioPublicId;
        audioType = modeValide(body?.audioType);
      }

      const dureeBrute = Number(body?.audioDuree);

      audioDuree =
        Number.isFinite(dureeBrute) && dureeBrute > 0
          ? Math.min(Math.round(dureeBrute), DUREE_VOCAL_MAX)
          : null;
    }

    /**
     * Le lieu partagé.
     *
     * Il vient de `POST /api/geo/inverse`, qui a déjà arrondi les
     * coordonnées. On ré-arrondit ici : cette route est publique, et ce
     * qui protège l'utilisateur ne doit pas dépendre du chemin emprunté
     * pour écrire.
     */
    let lieu: { libelle: string; lat: number; lng: number } | null = null;

    if (body?.lieu && typeof body.lieu === "object") {
      const brut = body.lieu as {
        libelle?: unknown;
        lat?: unknown;
        lng?: unknown;
      };

      const libelle =
        typeof brut.libelle === "string" ? brut.libelle.trim().slice(0, 160) : "";
      const lat = Number(brut.lat);
      const lng = Number(brut.lng);

      const coordonneesValides =
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180;

      if (!libelle || !coordonneesValides) {
        return NextResponse.json(
          {
            success: false,
            error: "Ce lieu est incomplet.",
            code: "INVALID_PLACE",
          },
          { status: 400 }
        );
      }

      lieu = {
        libelle,
        lat: Math.round(lat * 100) / 100,
        lng: Math.round(lng * 100) / 100,
      };
    }

    /**
     * La proposition de rendez-vous.
     *
     * Une proposition part toujours au statut « propose » : le client ne
     * décide pas de l'état de sa propre proposition, sans quoi il
     * pourrait l'envoyer déjà acceptée.
     */
    let rendezVous:
      | { quand: Date; ou: string; note: string; statut: "propose" }
      | null = null;

    if (body?.rendezVous && typeof body.rendezVous === "object") {
      const brut = body.rendezVous as {
        quand?: unknown;
        ou?: unknown;
        note?: unknown;
      };

      const quand = new Date(String(brut.quand ?? ""));
      const ou = typeof brut.ou === "string" ? brut.ou.trim().slice(0, 160) : "";
      const note =
        typeof brut.note === "string" ? brut.note.trim().slice(0, 300) : "";

      if (Number.isNaN(quand.getTime()) || !ou) {
        return NextResponse.json(
          {
            success: false,
            error: "Il manque la date ou le lieu du rendez-vous.",
            code: "INVALID_MEETUP",
          },
          { status: 400 }
        );
      }

      /**
       * Une proposition dans le passé n'a pas de sens, et une à dix ans
       * d'ici non plus. La borne haute évite surtout les dates saisies de
       * travers (« 2206 » pour « 2026 »).
       */
      const maintenant = Date.now();
      const unAn = 365 * 24 * 60 * 60 * 1000;

      if (quand.getTime() < maintenant - 60 * 60 * 1000) {
        return NextResponse.json(
          {
            success: false,
            error: "Cette date est déjà passée.",
            code: "MEETUP_IN_PAST",
          },
          { status: 400 }
        );
      }

      if (quand.getTime() > maintenant + unAn) {
        return NextResponse.json(
          {
            success: false,
            error: "Cette date est trop lointaine.",
            code: "MEETUP_TOO_FAR",
          },
          { status: 400 }
        );
      }

      rendezVous = { quand, ou, note, statut: "propose" };
    }

    /**
     * L'événement partagé.
     *
     * On vérifie qu'il existe et qu'il est publié : partager un
     * brouillon ou un événement retiré reviendrait à donner rendez-vous
     * à un lieu qui n'ouvre pas.
     */
    let evenementId: mongoose.Types.ObjectId | null = null;

    if (typeof body?.evenementId === "string" && body.evenementId) {
      if (!isValidObjectId(body.evenementId)) {
        return NextResponse.json(
          {
            success: false,
            error: "Cet événement est introuvable.",
            code: "INVALID_EVENT",
          },
          { status: 400 }
        );
      }

      const evenement = await SolysEvent.findOne({
        _id: body.evenementId,
        isPublished: true,
      }).select("_id");

      if (!evenement) {
        return NextResponse.json(
          {
            success: false,
            error: "Cet événement n'est plus proposé.",
            code: "EVENT_NOT_FOUND",
          },
          { status: 404 }
        );
      }

      evenementId = evenement._id;
    }

    if (
      !content &&
      !imageUrl &&
      !audioUrl &&
      !lieu &&
      !rendezVous &&
      !evenementId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Le message ne peut pas être vide.",
          code: "EMPTY_CONTENT",
        },
        { status: 400 }
      );
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: `Message trop long. Maximum ${MAX_MESSAGE_LENGTH} caractères.`,
          code: "TOO_LONG",
        },
        { status: 400 }
      );
    }

    /**
     * Filtre anti-harcèlement.
     *
     * Un message clairement abusif n'est PAS envoyé, et un signalement
     * automatique est créé pour la modération admin (visé : l'expéditeur).
     * On upsert pour respecter l'index unique (reporterId, targetType,
     * targetId) et éviter un crash sur récidive.
     */
    const moderation = content
      ? moderateText(content)
      : { blocked: false as const, category: undefined };

    if (moderation.blocked) {
      try {
        await Report.findOneAndUpdate(
          {
            reporterId: currentUserId,
            targetType: "user",
            targetId: currentUserId,
          },
          {
            $set: {
              reason: "harcèlement",
              status: "pending",
              details:
                "[AUTO] Filtre anti-harcèlement : message bloqué dans la messagerie " +
                `(${moderation.category ?? "abus"}).`,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (reportErr) {
        console.warn("Signalement auto anti-harcèlement échoué :", reportErr);
      }

      return NextResponse.json(
        {
          success: false,
          error:
            "Ce message enfreint nos règles de respect et n'a pas été envoyé. Les échanges doivent rester bienveillants.",
          code: "MESSAGE_BLOCKED",
        },
        { status: 422 }
      );
    }

    /**
     * Quota quotidien de messages.
     *
     * L'offre gratuite annonce « messagerie limitée (10 messages/jour) » sur
     * /tarifs, et cette route ne vérifiait rien : le compteur de
     * `subscription-check` lisait un champ `dailyMessagesCount` absent du modèle
     * User, donc toujours zéro. Les messages sont désormais comptés sur la
     * collection (voir src/lib/quotas.ts).
     *
     * Vérifié **après** la modération : un message bloqué pour abus ne doit pas
     * consommer de quota, il n'a jamais existé.
     */
    const quota = await quotaMessagesDuJour(currentUserId.toString(), {
      plan: currentUser.plan,
      isPremium: currentUser.isPremium,
      subscriptionStatus: currentUser.subscriptionStatus,
    });

    if (quota.atteint) {
      return NextResponse.json(
        {
          success: false,
          error: `Tu as envoyé tes ${quota.limite} messages du jour. Le compteur repart à minuit.`,
          code: "MESSAGE_QUOTA_REACHED",
          quota: {
            limite: quota.limite,
            utilises: quota.utilises,
            restants: quota.restants,
          },
          upgradeUrl: "/tarifs",
        },
        { status: 403 }
      );
    }

    const message = await Message.create({
      matchId: match._id,
      senderId: currentUserId,
      content,
      imageUrl,
      imagePublicId,
      imageType,
      audioUrl,
      audioPublicId,
      audioType,
      audioDuree,
      lieu,
      rendezVous,
      evenementId,
    });

    /**
     * Mettre à jour lastMessageAt sur le match.
     *
     * Cela permet à /api/matches de trier les conversations récentes.
     */
    await Match.findByIdAndUpdate(match._id, {
      $set: {
        lastMessageAt: message.createdAt,
      },
    });

    /**
     * L'événement est chargé avant d'être renvoyé.
     *
     * Sans ça, l'expéditeur verrait sa propre carte se vider à la
     * seconde où la réponse du serveur remplace son message provisoire.
     */
    if (evenementId) {
      await message.populate(
        "evenementId",
        "title date location emoji isOnline isPublished"
      );
    }

    const serializedMessage = serializeMessage(message);

    /**
     * Notifier le canal Pusher en temps réel.
     *
     * Si Pusher échoue en dev ou à cause d'une config manquante,
     * on ne bloque pas l'envoi du message.
     */
    try {
      await envoyerPusher(
        `private-match-${match._id.toString()}`,
        "new-message",
        { ...serializedMessage }
      );
    } catch (erreur) {
      console.warn("Message non annoncé en temps réel :", erreur);
    }

    /**
     * Notification push vers le destinataire — sauf s'il a mis la conversation
     * en sourdine.
     *
     * `mutedBy` était écrit par `PATCH /api/matches/[id]/mute` et **relu
     * nulle part** : la sourdine ne coupait rien. Elle coupe la notification,
     * jamais l'arrivée du message : une conversation muette reste une
     * conversation, et l'événement Pusher ci-dessus part dans tous les cas.
     *
     * Silencieux en cas d'échec : un push raté ne doit pas faire échouer
     * l'envoi du message.
     */
    try {
      const otherUserId = getOtherUserId(match, access.currentUserId);

      if (estEnSourdine(match, otherUserId)) {
        // Rien à envoyer : le destinataire a demandé le silence.
      } else {
        const sender = (await User.findById(access.currentUserId)
          .select("pseudonyme")
          .lean()) as { pseudonyme?: string } | null;

        await sendNewMessagePush({
          recipientUserId: otherUserId,
          senderName: sender?.pseudonyme ?? "Quelqu'un",
          // Une photo ou un vocal n'ont pas de texte à montrer.
          preview:
            content ||
            (audioUrl
              ? "Message vocal"
              : lieu
                ? "Position partagée"
                : rendezVous
                  ? "Proposition de rendez-vous"
                  : evenementId
                    ? "Un événement Solys"
                    : "Photo"),
          matchId: match._id.toString(),
        });
      }
    } catch (pushErr) {
      console.warn("Push notification message échouée :", pushErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: serializedMessage,
        quota: {
          limite: quota.limite,
          utilises: quota.utilises + 1,
          restants:
            quota.restants === null ? null : Math.max(0, quota.restants - 1),
        },
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Erreur POST /api/messages/[matchId] :", error);

    const err = error as {
      name?: string;
      message?: string;
      errors?: unknown;
    };

    if (err.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          error: "Erreur de validation MongoDB.",
          code: "DB_VALIDATION_ERROR",
          details: err.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur.",
        code: "INTERNAL_SERVER_ERROR",
        message:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}
