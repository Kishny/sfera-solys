// src/lib/pusher-client.ts

/**
 * Client Pusher côté navigateur uniquement.
 *
 * Utilisé dans les composants client pour écouter :
 * - private-user-{userId}
 * - private-match-{matchId}
 *
 * Variables nécessaires dans .env.local :
 *
 * NEXT_PUBLIC_PUSHER_KEY=
 * NEXT_PUBLIC_PUSHER_CLUSTER=eu
 */

import type PusherType from "pusher-js";

let pusherClient: PusherType | null = null;

/**
 * Vérifie les variables publiques nécessaires au navigateur.
 */
function getPublicPusherConfig() {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu";

  if (!key) {
    throw new Error(
      "NEXT_PUBLIC_PUSHER_KEY est manquant dans les variables d'environnement."
    );
  }

  return {
    key,
    cluster,
  };
}

/**
 * Retourne une instance singleton de Pusher côté client.
 *
 * Important :
 * - cette fonction doit seulement être appelée côté navigateur ;
 * - elle utilise authEndpoint pour les canaux privés ;
 * - la route /api/pusher/auth vérifie les droits en base.
 */
export function getPusherClient(): PusherType {
  if (typeof window === "undefined") {
    throw new Error("getPusherClient() ne peut être appelé que côté client.");
  }

  if (!pusherClient) {
    const { key, cluster } = getPublicPusherConfig();

    /**
     * Import dynamique pour éviter les problèmes SSR.
     */
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Pusher = require("pusher-js") as typeof PusherType;

    pusherClient = new Pusher(key, {
      cluster,
      authEndpoint: "/api/pusher/auth",

      /**
       * Pusher enverra automatiquement :
       * - socket_id
       * - channel_name
       * à /api/pusher/auth.
       */
      auth: {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    });
  }

  return pusherClient;
}

/**
 * Déconnecte explicitement le client Pusher.
 *
 * Utile si tu veux l'appeler à la déconnexion utilisateur
 * pour éviter de garder une connexion ouverte.
 */
export function disconnectPusherClient() {
  if (pusherClient) {
    pusherClient.disconnect();
    pusherClient = null;
  }
}

/**
 * Vrai si la clé publique existe. Lue au build par Next.js, donc constante
 * pour toute la durée de vie du bundle.
 */
export const pusherClientEstConfigure = Boolean(
  process.env.NEXT_PUBLIC_PUSHER_KEY
);

/**
 * Variante tolérante de `getPusherClient()`.
 *
 * `getPusherClient()` lève quand `NEXT_PUBLIC_PUSHER_KEY` manque. C'est le
 * bon comportement là où l'appelant sait rattraper — la page de conversation
 * le fait, et affiche « temps réel indisponible ». Mais le Header et la
 * Sidebar l'appelaient sans filet, dans un `useEffect` : l'exception
 * remontait jusqu'à la frontière d'erreur de React et emportait toute la
 * page, alors que ces deux composants ne font qu'incrémenter une pastille.
 *
 * Une pastille qui ne s'anime pas n'est pas une raison de refuser d'afficher
 * l'application.
 */
export function clientPusherOuNull(): PusherType | null {
  if (typeof window === "undefined" || !pusherClientEstConfigure) return null;

  try {
    return getPusherClient();
  } catch {
    return null;
  }
}
