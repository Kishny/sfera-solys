// src/app/api/messages/[matchId]/media/[messageId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Match } from "@/models/Match";
import { Message } from "@/models/Message";
import { blocageEntre } from "@/lib/blocages";
import { sourcesDuMedia } from "@/lib/medias";

/**
 * GET /api/messages/[matchId]/media/[messageId]?k=photo|vocal
 *
 * Sert une photo ou un vocal d'une conversation, à qui a le droit de la
 * voir — et à personne d'autre.
 *
 * POURQUOI CETTE ROUTE EXISTE
 * Les fichiers étaient servis directement par Cloudinary, à des adresses
 * publiques : qui avait le lien récupérait le fichier, sans compte, et
 * indéfiniment. Sur un site de rencontre, une photo envoyée en confiance
 * dans une conversation privée ne doit pas être une URL ouverte.
 *
 * Désormais le client ne reçoit plus jamais d'adresse Cloudinary. Il
 * reçoit celle-ci, et chaque requête est vérifiée : session valide,
 * appartenance à la conversation, absence de blocage. Les mêmes
 * conditions que pour lire le message lui-même — un média n'est pas
 * moins privé que le texte qui l'accompagne.
 *
 * LES REQUÊTES PAR PLAGE
 * L'en-tête `Range` est relayé tel quel et la réponse partielle est
 * rendue avec son code 206 et ses en-têtes. Ce n'est pas un détail :
 * Safari refuse de lire un média dont la source ne sait pas répondre par
 * plages, et c'est exactement ce qui avait cassé la relecture des vocaux.
 *
 * CE QUE CETTE ROUTE NE RÉPARE PAS
 * Les fichiers déjà déposés restent accessibles par leur ancienne adresse
 * Cloudinary à qui l'aurait notée. Rien de nouveau ne fuit, mais ce qui
 * est sorti est sorti. Le verrou complet demande de déposer les fichiers
 * en mode authentifié côté Cloudinary — seconde étape, une fois celle-ci
 * vérifiée en production.
 */

export const dynamic = "force-dynamic";

/**
 * Un an dans le cache du navigateur, et du sien seulement.
 *
 * ## Pourquoi un an, et pourquoi `immutable`
 *
 * Un `public_id` Cloudinary est unique et son contenu ne change jamais :
 * modifier une photo veut dire en déposer une autre, donc une autre
 * adresse. L'heure d'avant faisait re-télécharger les photos d'une
 * conversation à chaque retour au bout de soixante minutes, pour des
 * octets identiques. `immutable` dit au navigateur de ne même pas poser
 * la question — pas de requête de revalidation, pas d'aller-retour.
 *
 * ## Ce qui reste volontairement `private`
 *
 * Jamais `s-maxage`, jamais `public`. Une réponse mise en cache par le
 * CDN serait servie à quiconque connaît l'adresse **sans repasser par
 * cette fonction**, donc sans vérification de session ni d'appartenance
 * à la conversation : le verrou entier sauterait pour gagner quelques
 * centaines de millisecondes. Le cache reste celui du navigateur du
 * membre, où il ne profite qu'à lui.
 */
const CACHE = "private, max-age=31536000, immutable";

function estUnIdValide(valeur: string) {
  return mongoose.Types.ObjectId.isValid(valeur);
}

function autreMembre(match: any, moi: mongoose.Types.ObjectId) {
  const courant = moi.toString();
  const un = match.user1Id.toString();

  return un === courant ? match.user2Id.toString() : un;
}

/**
 * Une réponse sans corps ni détail.
 *
 * Refus d'accès, média absent, conversation inconnue : tout répond 404.
 * Distinguer les cas dirait à un inconnu qu'un message existe.
 */
function introuvable() {
  return new NextResponse(null, { status: 404 });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ matchId: string; messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) return introuvable();

    const { matchId, messageId } = await context.params;

    if (!estUnIdValide(matchId) || !estUnIdValide(messageId)) {
      return introuvable();
    }

    const genre = req.nextUrl.searchParams.get("k");

    if (genre !== "photo" && genre !== "vocal") return introuvable();

    await connectDB();

    const moi = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    }).select("_id banned");

    if (!moi || moi.banned) return introuvable();

    const match = await Match.findById(matchId).select("user1Id user2Id");

    if (
      !match ||
      (match.user1Id.toString() !== moi._id.toString() &&
        match.user2Id.toString() !== moi._id.toString())
    ) {
      return introuvable();
    }

    // Un blocage coupe la conversation dans les deux sens, les médias
    // déjà envoyés compris.
    if (await blocageEntre(moi._id.toString(), autreMembre(match, moi._id))) {
      return introuvable();
    }

    const message = await Message.findOne({
      _id: messageId,
      matchId: match._id,
    }).select(
      "imageUrl imagePublicId imageType audioUrl audioPublicId audioType"
    );

    if (!message) return introuvable();

    const sources = sourcesDuMedia(message, genre);

    if (sources.length === 0) return introuvable();

    /**
     * Le relais.
     *
     * `Range` part tel quel ; la réponse de Cloudinary est rendue avec son
     * code et ses en-têtes de plage. Le corps est transmis en flux, sans
     * être chargé en mémoire.
     */
    const plage = req.headers.get("range");

    /**
     * Pas de cache côté serveur.
     *
     * Une réponse partielle mise en cache serait rendue telle quelle à
     * une requête demandant une autre plage — un fichier audio lu de
     * travers, et introuvable à déboguer. Le navigateur, lui, garde le
     * fichier grâce à l'en-tête posé plus bas.
     */
    let amont: Response | null = null;

    // Les adresses sont essayées dans l'ordre : le MP3 d'abord pour un
    // vocal, puis le fichier d'origine si le transcodage manque.
    for (const source of sources) {
      const essai = await fetch(source, {
        headers: plage ? { Range: plage } : undefined,
        cache: "no-store",
      });

      if (essai.ok || essai.status === 206) {
        amont = essai;
        break;
      }

      // Le corps d'une réponse écartée est refermé : le laisser ouvert
      // retient une connexion jusqu'au ramasse-miettes.
      await essai.body?.cancel().catch(() => {});
    }

    if (!amont) {
      console.warn(
        `[media] Cloudinary n'a servi aucune des ${sources.length} adresses ` +
          `essayées pour le message ${messageId}.`
      );
      return introuvable();
    }

    const entetes = new Headers();

    for (const nom of [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "etag",
      "last-modified",
    ]) {
      const valeur = amont.headers.get(nom);
      if (valeur) entetes.set(nom, valeur);
    }

    entetes.set("Cache-Control", CACHE);

    // Le nom du fichier n'apparaît jamais : il n'apporte rien et peut
    // porter des informations personnelles.
    entetes.set("Content-Disposition", "inline");

    // Aucune interprétation du contenu autre que son type déclaré.
    entetes.set("X-Content-Type-Options", "nosniff");

    return new NextResponse(amont.body, {
      status: amont.status,
      headers: entetes,
    });
  } catch (erreur) {
    console.error("Erreur GET média de conversation :", erreur);
    return introuvable();
  }
}
