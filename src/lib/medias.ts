// src/lib/medias.ts

import cloudinary from "@/lib/cloudinary";

/**
 * Les médias d'une conversation : où les prendre, et quoi en montrer.
 *
 * Deux générations de messages cohabitent, et cohabiteront longtemps.
 *
 * - Les anciens n'ont qu'une URL Cloudinary publique, écrite au moment de
 *   l'envoi. On la garde : elle fonctionne, et la réécrire demanderait
 *   une migration pour un gain nul.
 * - Les nouveaux portent l'identifiant Cloudinary. L'adresse est
 *   reconstruite à la lecture, ce qui permettra de passer les fichiers en
 *   mode authentifié sans toucher aux données déjà écrites.
 *
 * Dans les deux cas, cette adresse reste **côté serveur**. Le client ne
 * reçoit que celle de notre route de média.
 */

/** Les deux sortes de médias qu'un message peut porter. */
export type GenreDeMedia = "photo" | "vocal";

type MessageAvecMedia = {
  imageUrl?: string | null;
  imagePublicId?: string | null;
  audioUrl?: string | null;
  audioPublicId?: string | null;
};

/**
 * Les dossiers Cloudinary attendus, par genre.
 *
 * Un identifiant venu d'ailleurs est refusé : ce champ transite par la
 * route d'envoi, donc par le client, et rien de ce qui vient du client
 * n'est cru sur parole.
 */
const DOSSIERS: Record<GenreDeMedia, string> = {
  photo: "sferasolys/chat/",
  vocal: "sferasolys/chat-audio/",
};

/**
 * Un identifiant Cloudinary est-il acceptable ?
 *
 * Il doit désigner le bon dossier et ne contenir que des caractères
 * attendus — en particulier aucun `..`, qui permettrait de viser un
 * autre dossier du compte.
 */
export function identifiantValide(
  publicId: string,
  genre: GenreDeMedia
): boolean {
  if (!publicId.startsWith(DOSSIERS[genre])) return false;
  if (publicId.includes("..")) return false;

  return /^[A-Za-z0-9/_\-.]+$/.test(publicId);
}

/**
 * L'adresse d'où lire réellement le fichier.
 *
 * `null` quand le message ne porte pas ce genre de média.
 */
export function urlSourceDuMedia(
  message: MessageAvecMedia,
  genre: GenreDeMedia
): string | null {
  if (genre === "photo") {
    if (message.imagePublicId) {
      return cloudinary.url(message.imagePublicId, {
        resource_type: "image",
        secure: true,
        analytics: false,
      });
    }

    return message.imageUrl || null;
  }

  if (message.audioPublicId) {
    return cloudinary.url(message.audioPublicId, {
      resource_type: "video",
      // Le MP3 est le seul format audio que tous les navigateurs lisent.
      format: "mp3",
      secure: true,
      analytics: false,
    });
  }

  return message.audioUrl || null;
}

/**
 * L'adresse que reçoit le client.
 *
 * Toujours la nôtre, jamais celle de Cloudinary : c'est tout l'objet du
 * changement. `null` quand il n'y a rien à servir.
 */
export function urlPubliqueDuMedia(
  message: MessageAvecMedia & { _id?: unknown },
  matchId: string,
  genre: GenreDeMedia
): string | null {
  const porteUnMedia =
    genre === "photo"
      ? Boolean(message.imagePublicId || message.imageUrl)
      : Boolean(message.audioPublicId || message.audioUrl);

  if (!porteUnMedia) return null;

  const messageId = String(message._id ?? "");

  if (!messageId) return null;

  return `/api/messages/${matchId}/media/${messageId}?k=${genre}`;
}
