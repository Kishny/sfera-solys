// src/lib/resend.ts

import { Resend } from "resend";

import { lireVariable, signalerAbsence } from "@/lib/configuration";

/**
 * Client Resend pour les e-mails transactionnels.
 *
 * ## Le blocage de déploiement que ce fichier contenait
 *
 * `export const resend = new Resend(process.env.RESEND_API_KEY)` s'exécutait
 * à l'import. Or **le constructeur de Resend lève quand la clé est absente** :
 * « Missing API key ». Sur Vercel, oublier `RESEND_API_KEY` ne donnait donc
 * pas une application sans e-mails — ça donnait un **build qui échoue**, sur
 * un message qui ne dit pas quelle variable manque ni où la poser.
 *
 * Le client est maintenant construit à la demande, une seule fois, et
 * seulement s'il y a une vraie clé. Sans clé, les e-mails ne partent pas et
 * on le dit une fois au démarrage : un service tiers non configuré est un
 * service indisponible, pas une application cassée.
 */

const cle = lireVariable("RESEND_API_KEY");

/** Vrai seulement si la clé existe et n'est pas un placeholder. */
export const resendEstConfigure = cle !== null;

let client: Resend | null = null;

/**
 * Renvoie le client, ou `null` en signalant l'absence une seule fois par
 * démarrage. Les appelants n'envoient tout simplement pas.
 */
export function clientResend(): Resend | null {
  if (!cle) {
    signalerAbsence(
      "Resend",
      "aucun e-mail ne part (vérification d'adresse, réinitialisation de mot " +
        "de passe, relances, newsletter) — RESEND_API_KEY."
    );
    return null;
  }

  if (!client) client = new Resend(cle);

  return client;
}

export const FROM_EMAIL =
  lireVariable("RESEND_FROM_EMAIL") ?? "Sfera'Solys <contact@sferasolys.com>";

/**
 * ID de l'Audience Resend qui regroupe les inscrits à la newsletter.
 * À créer dans le tableau de bord Resend (Audiences), puis à renseigner dans
 * l'environnement : RESEND_AUDIENCE_ID.
 */
export const AUDIENCE_ID = lireVariable("RESEND_AUDIENCE_ID") ?? "";
