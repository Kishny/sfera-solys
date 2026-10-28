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

/**
 * Le mode de livraison Cloudinary du fichier.
 *
 * - `upload` : le fichier est déposé en accès libre. C'est le mode
 *   d'origine, celui des fichiers déjà en base.
 * - `authenticated` : le fichier n'est servi que sur présentation d'une
 *   signature, calculée avec le secret du compte. Même en connaissant
 *   l'identifiant, on ne peut pas construire l'adresse.
 *
 * Le mode est stocké sur le message plutôt que deviné : les deux
 * générations de fichiers cohabitent, et se tromper de mode rend le
 * média introuvable.
 */
export type ModeDeLivraison = "upload" | "authenticated";

export const MODES: ModeDeLivraison[] = ["upload", "authenticated"];

type MessageAvecMedia = {
  imageUrl?: string | null;
  imagePublicId?: string | null;
  imageType?: string | null;
  audioUrl?: string | null;
  audioPublicId?: string | null;
  audioType?: string | null;
};

/** Ramène une valeur venue du client à un mode connu. */
export function modeValide(valeur: unknown): ModeDeLivraison {
  return valeur === "authenticated" ? "authenticated" : "upload";
}

/**
 * L'adresse Cloudinary d'un fichier, signée si le mode l'exige.
 *
 * Destinée au serveur seul : c'est elle que la route de média va
 * chercher, jamais celle que le client reçoit.
 */
export function urlCloudinary(
  publicId: string,
  options: {
    resourceType: "image" | "video";
    mode: ModeDeLivraison;
    format?: string;
    transformation?: Record<string, unknown>[];
  }
): string {
  return cloudinary.url(publicId, {
    resource_type: options.resourceType,
    type: options.mode,
    // La signature n'a de sens que pour un fichier authentifié.
    sign_url: options.mode === "authenticated",
    ...(options.format ? { format: options.format } : {}),
    ...(options.transformation
      ? { transformation: options.transformation }
      : {}),
    secure: true,
    analytics: false,
  });
}

/**
 * La dérivée servie pour une photo de conversation.
 *
 * ## Le gâchis que cela corrige
 *
 * Les photos sont bornées à 1200 px au dépôt, ce qui est raisonnable pour
 * un stockage. Mais c'est cette taille-là qui partait vers le téléphone,
 * dans son format d'origine, pour une bulle large d'environ 350 points.
 * On envoyait trois à cinq fois trop d'octets, à chaque ouverture de
 * conversation, sur la connexion la plus lente de toutes.
 *
 * `f_auto` laisse Cloudinary négocier le format avec le navigateur —
 * WebP ou AVIF là où c'est accepté, ce qui couvre Safari depuis la
 * version 14 — et `q_auto` choisit la compression par analyse de l'image
 * plutôt qu'un palier fixe. `w_800,c_limit` borne sans jamais agrandir
 * ni recadrer : une photo déjà plus petite est servie telle quelle.
 *
 * 800 et non 350 : la bulle double sur écran dense, et la photo s'ouvre
 * en grand d'un clic. Servir la taille d'affichage donnerait une image
 * floue au premier agrandissement.
 */
const PHOTO_ALLEGEE = [
  { fetch_format: "auto", quality: "auto", width: 800, crop: "limit" },
];

/**
 * Cloudinary sert-il réellement cette adresse ?
 *
 * Appelée juste après un dépôt en mode authentifié. La livraison
 * authentifiée dépend de la configuration du compte, et plutôt que de la
 * supposer, on la demande : si elle ne répond pas, l'appelant retombe
 * sur le mode public et le dit dans les journaux. Un réglage de compte
 * ne doit pas pouvoir rendre les photos et les vocaux muets.
 */
export async function livraisonFonctionne(url: string): Promise<boolean> {
  try {
    const reponse = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });

    return reponse.ok;
  } catch {
    return false;
  }
}

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
 * Les adresses où lire réellement le fichier, par ordre de préférence.
 *
 * Plusieurs, et non une seule, à cause du son : le MP3 est le seul
 * format que tous les navigateurs lisent, mais son transcodage peut ne
 * pas aboutir. Le fichier d'origine vient alors en second — lisible au
 * moins par le navigateur qui l'a enregistré.
 *
 * Essayer dans l'ordre évite de stocker sur chaque message lequel des
 * deux existe, information qui se périmerait dès que Cloudinary finit un
 * transcodage en retard.
 *
 * Liste vide quand le message ne porte pas ce genre de média.
 */
export function sourcesDuMedia(
  message: MessageAvecMedia,
  genre: GenreDeMedia
): string[] {
  if (genre === "photo") {
    if (message.imagePublicId) {
      const mode = modeValide(message.imageType);

      /**
       * L'allégée d'abord, l'originale ensuite.
       *
       * Un compte Cloudinary peut refuser les transformations dérivées
       * non signées — c'est un réglage, « strict transformations », et
       * nous n'avons aucun moyen de le lire d'ici. Plutôt que de
       * supposer qu'il est ouvert et de risquer des photos cassées en
       * production, on demande, et on retombe sur l'originale si la
       * réponse ne vient pas. Même méthode que pour le MP3 des vocaux.
       */
      return [
        urlCloudinary(message.imagePublicId, {
          resourceType: "image",
          mode,
          transformation: PHOTO_ALLEGEE,
        }),
        urlCloudinary(message.imagePublicId, { resourceType: "image", mode }),
      ];
    }

    return message.imageUrl ? [message.imageUrl] : [];
  }

  if (message.audioPublicId) {
    const mode = modeValide(message.audioType);

    return [
      urlCloudinary(message.audioPublicId, {
        resourceType: "video",
        mode,
        format: "mp3",
      }),
      urlCloudinary(message.audioPublicId, { resourceType: "video", mode }),
    ];
  }

  return message.audioUrl ? [message.audioUrl] : [];
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
