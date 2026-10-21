// src/lib/circle.ts

import { CircleWeek } from "@/models/CircleWeek";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription/config";
import { planEffectif } from "@/lib/quotas";
import type { PlanId } from "@/lib/subscription/config";

/**
 * Bornes de la semaine du Circle — source unique.
 *
 * Ces deux fonctions vivaient dans `/api/circle/route.ts`, seule à en
 * avoir besoin. Le signal « ta sélection de la semaine t'attend » les lit
 * désormais aussi, et deux calculs de « quel lundi sommes-nous » qui
 * divergeraient d'une heure feraient clignoter la pastille au mauvais
 * moment.
 *
 * ⚠️ `setHours` travaille en heure serveur, c'est-à-dire UTC sur Vercel.
 * La semaine bascule donc vers 1h ou 2h du matin à Paris selon la saison,
 * pas à minuit. C'est le comportement d'origine, conservé tel quel : le
 * corriger déplacerait la frontière des sélections déjà enregistrées.
 */

/** Nombre de profils par semaine. C'est le nom du produit. */
export const TAILLE_CERCLE = 6;

/** Lundi 00:00 de la semaine en cours, heure serveur. */
export function debutDeSemaine(reference = new Date()): Date {
  const date = new Date(reference);
  const jour = date.getDay();

  // getDay() : 0 = dimanche. On recule jusqu'au lundi.
  const recul = jour === 0 ? 6 : jour - 1;

  date.setDate(date.getDate() - recul);
  date.setHours(0, 0, 0, 0);

  return date;
}

/** Lundi 00:00 de la semaine suivante — la date du prochain tirage. */
export function prochainTirage(reference = new Date()): Date {
  const lundi = debutDeSemaine(reference);
  const suivant = new Date(lundi);
  suivant.setDate(suivant.getDate() + 7);
  return suivant;
}

/** L'offre en vigueur donne-t-elle accès au Circle ? */
export function aDroitAuCircle(user: {
  plan?: unknown;
  isPremium?: unknown;
  subscriptionStatus?: unknown;
}): boolean {
  const plan: PlanId = planEffectif({
    plan: user.plan,
    isPremium: user.isPremium,
    subscriptionStatus: user.subscriptionStatus,
  } as Parameters<typeof planEffectif>[0]);

  return SUBSCRIPTION_PLANS[plan].features.circleOfSix;
}

/**
 * La sélection de la semaine attend-elle d'être découverte ?
 *
 * Le tirage est paresseux : il a lieu au premier affichage de `/circle`
 * dans la semaine. L'absence de `CircleWeek` pour le lundi courant
 * signifie donc exactement « cette personne n'a pas encore vu sa
 * sélection » — c'est le signal qu'il manquait pour que « six nouveaux
 * profils chaque lundi » soit autre chose qu'une phrase sur une page.
 *
 * Renvoie `false` sans toucher la base pour qui n'y a pas droit.
 */
export async function circleAVoir(
  userId: unknown,
  user: { plan?: unknown; isPremium?: unknown; subscriptionStatus?: unknown }
): Promise<boolean> {
  if (!aDroitAuCircle(user)) return false;

  try {
    const dejaTire = await CircleWeek.exists({
      userId,
      weekStart: debutDeSemaine(),
    });

    return !dejaTire;
  } catch {
    // Un compteur ne casse pas une barre de navigation.
    return false;
  }
}
