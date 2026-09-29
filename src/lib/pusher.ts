// src/lib/pusher.ts

import Pusher from "pusher";

import { lireVariable, signalerAbsence } from "@/lib/configuration";

/**
 * Client Pusher, côté serveur uniquement.
 *
 * Porte les évènements temps réel : `new-match`, `new-message`,
 * `messages-read`.
 *
 * ## Pourquoi ce fichier a changé
 *
 * La garde d'origine vérifiait que les variables d'environnement étaient
 * **présentes**, et levait une exception sinon. Elle ne vérifiait pas
 * qu'elles voulaient dire quelque chose. `.env.local` livre ces trois
 * variables remplies avec `A_REMPLACER` : elles passaient la garde, le
 * client Pusher se construisait avec une clé bidon, et chaque match, chaque
 * message et chaque accusé de lecture partait vers l'API Pusher pour en
 * revenir avec un `400 auth_key should be a valid app key` — et une trace
 * d'exception complète dans le journal du serveur.
 *
 * Un placeholder n'est pas une configuration. La garde le sait maintenant,
 * et le temps réel s'éteint proprement au lieu d'échouer bruyamment : les
 * messages continuent d'être enregistrés et lus, ils n'arrivent simplement
 * plus tout seuls.
 */

const appId = lireVariable("PUSHER_APP_ID");
const cle = lireVariable("PUSHER_KEY");
const secret = lireVariable("PUSHER_SECRET");
const cluster = process.env.PUSHER_CLUSTER?.trim() || "eu";

/**
 * Vrai seulement si les trois variables existent **et** ne sont pas des
 * placeholders. À lire avant toute promesse de temps réel faite à
 * l'utilisateur.
 */
export const pusherEstConfigure = Boolean(appId && cle && secret);

/**
 * Instance serveur, ou `null` quand Pusher n'est pas configuré.
 *
 * Ce fichier ne doit jamais être importé depuis un composant client.
 */
export const pusher = pusherEstConfigure
  ? new Pusher({
      appId: appId as string,
      key: cle as string,
      secret: secret as string,
      cluster,
      useTLS: true,
    })
  : null;


/**
 * Envoie un évènement, ou ne fait rien si Pusher n'est pas configuré.
 *
 * Renvoie `true` si l'évènement est parti. Aucun appelant ne doit dépendre
 * de ce retour pour son résultat métier : un message enregistré reste
 * enregistré même si personne n'a pu être prévenu en direct.
 */
export async function envoyerPusher(
  canal: string,
  evenement: string,
  donnees: unknown
): Promise<boolean> {
  if (!pusher) {
    signalerAbsence(
      "Pusher",
      "le temps réel est désactivé — les messages sont bien enregistrés, " +
        "ils n'arrivent simplement pas tout seuls " +
        "(PUSHER_APP_ID / PUSHER_KEY / PUSHER_SECRET)."
    );

    return false;
  }

  try {
    await pusher.trigger(canal, evenement, donnees);
    return true;
  } catch (erreur) {
    console.warn(
      `Pusher : évènement « ${evenement} » non délivré sur ${canal} —`,
      erreur instanceof Error ? erreur.message : erreur
    );
    return false;
  }
}
