// src/lib/abonnement.ts

import { normalizePlanId, type PlanId } from "@/lib/subscription/config";

/**
 * « Ce membre paie-t-il ? » — une seule réponse, un seul calcul.
 *
 * ## Le défaut que ce fichier corrige
 *
 * Le produit répondait à cette question de deux façons, selon l'endroit
 * du code. Certaines portes lisaient `user.isPremium`, d'autres
 * `user.plan`. Les deux pouvaient diverger, et elles ont divergé : un
 * compte s'est retrouvé avec `plan: "free"` et `isPremium: true`, donc
 * gratuit pour l'interface et le Mode Fantôme, payant pour l'accès aux
 * profils réservés et pour le Circle.
 *
 * La divergence venait du crochet de sauvegarde, qui dérivait
 * `isPremium` de `subscriptionStatus` **seul**. Or un statut « actif »
 * sans offre payante ne veut rien dire : on peut être « actif » sur
 * rien. Le crochet ne regardait jamais `plan`.
 *
 * ## La règle, désormais unique
 *
 * Un membre paie si, et seulement si, son offre est payante **et** son
 * abonnement est en cours. Les deux conditions, jamais une seule.
 *
 * `isPremium` reste écrit en base — des index et des statistiques s'en
 * servent — mais il est **dérivé**, jamais décidé. Aucune porte ne doit
 * plus le lire pour autoriser quoi que ce soit : si le champ se
 * désynchronise, il ne doit plus pouvoir ouvrir ni fermer l'accès à
 * quiconque.
 */

/** Les statuts qui valent abonnement en cours. */
const STATUTS_EN_COURS = ["active", "trialing"] as const;

type UtilisateurAbonne = {
  plan?: unknown;
  subscriptionStatus?: unknown;
};

/** L'offre du membre, ramenée à une valeur connue. */
export function offreDe(user: UtilisateurAbonne): PlanId {
  return normalizePlanId(user?.plan);
}

/** L'abonnement est-il en cours, quel que soit le plan ? */
export function abonnementEnCours(user: UtilisateurAbonne): boolean {
  return STATUTS_EN_COURS.includes(
    user?.subscriptionStatus as (typeof STATUTS_EN_COURS)[number]
  );
}

/**
 * Le membre a-t-il une offre payante en cours ?
 *
 * C'est la seule fonction que les contrôles d'accès doivent appeler.
 */
export function estAbonnePayant(user: UtilisateurAbonne): boolean {
  return offreDe(user) !== "free" && abonnementEnCours(user);
}

/**
 * La valeur à écrire dans `isPremium`.
 *
 * Exposée pour que les écritures — crochets du modèle, webhook Stripe,
 * bascule d'administration — posent toutes la même valeur, calculée au
 * même endroit.
 */
export function premiumDerive(user: UtilisateurAbonne): boolean {
  return estAbonnePayant(user);
}
