// src/lib/stripe.ts

import Stripe from "stripe";

import { lireVariable, signalerAbsence } from "@/lib/configuration";

/**
 * Client Stripe, côté serveur uniquement.
 *
 * ## Deux défauts corrigés ici
 *
 * **Le module levait une exception à l'import** quand `STRIPE_SECRET_KEY`
 * manquait, avec un message parlant de `.env.local` — ce qui n'a aucun sens
 * sur Vercel, où les variables se posent dans les réglages du projet. Neuf
 * routes importent ce fichier : l'exception faisait tomber le build entier
 * pour une clé oubliée, sur un message trompeur.
 *
 * **Et il ne bronchait pas si la clé valait `A_REMPLACER`.** Présente, donc
 * valide à ses yeux. Le client se construisait, et l'erreur n'arrivait qu'au
 * premier paiement, sous la forme d'un 401 de Stripe.
 *
 * Désormais : `stripeEstConfigure` dit la vérité, `stripe` vaut `null` quand
 * il n'y a rien à appeler, et les routes qui en dépendent répondent 503 avec
 * une phrase compréhensible plutôt que de planter.
 */

const cleSecrete = lireVariable("STRIPE_SECRET_KEY");

/**
 * Vrai seulement si la clé existe **et** n'est pas un placeholder.
 * À vérifier avant toute promesse de paiement faite à l'utilisateur.
 */
export const stripeEstConfigure = cleSecrete !== null;

export const stripe = cleSecrete
  ? new Stripe(cleSecrete, {
      /**
       * Pas d'`apiVersion` : on laisse Stripe utiliser celle du compte,
       * comme avant. La fixer ici la figerait à une valeur qui devrait être
       * tenue à jour à la main.
       */
    })
  : null;

/**
 * Renvoie le client, ou `null` en signalant l'absence une seule fois.
 *
 * Les routes s'en servent pour sortir tôt avec un 503 : un service de
 * paiement non configuré est indisponible, pas cassé.
 */
export function clientStripe(): Stripe | null {
  if (!stripe) {
    signalerAbsence(
      "Stripe",
      "les paiements et la vérification d'identité sont indisponibles " +
        "(STRIPE_SECRET_KEY)."
    );
  }

  return stripe;
}

/** Message unique, pour que toutes les routes disent la même chose. */
export const STRIPE_INDISPONIBLE =
  "Les paiements ne sont pas encore activés sur ce serveur. Réessaie plus tard.";
