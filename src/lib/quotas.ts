// src/lib/quotas.ts

import { Like } from '@/models/Like';
import { Message } from '@/models/Message';
import {
  SUBSCRIPTION_PLANS,
  normalizePlanId,
  type PlanId,
} from '@/lib/subscription/config';

/**
 * Quotas quotidiens — comptés sur les collections, pas sur des compteurs.
 *
 * ## La façade que ce fichier referme
 *
 * `subscription-check.ts` comptait les likes et les messages du jour en lisant
 * `user.dailyLikesCount`, `user.dailyLikesDate`, `user.dailyMessagesCount`.
 * **Ces champs n'existent pas dans `models/User.ts` et ne sont incrémentés
 * nulle part.** Les compteurs renvoyaient donc toujours zéro,
 * `canPerformAction("like")` autorisait toujours, et `/api/likes` ne
 * vérifiait de toute façon aucun quota. Les « 5 likes par jour » et la
 * « messagerie limitée (10 messages/jour) » annoncés sur `/tarifs` n'étaient
 * pas appliqués : l'illimité était vendu comme un avantage sur une limite
 * inexistante.
 *
 * ## Pourquoi compter, plutôt qu'incrémenter
 *
 * Un compteur dénormalisé sur `User` demande une migration, une remise à zéro
 * quotidienne fiable, et il dérive au premier écrit manqué — un like créé sans
 * passer par la route, une suppression, un fuseau horaire mal géré. Compter la
 * collection est exact par construction : la source de vérité est la donnée
 * elle-même. `Like` porte déjà l'index `{ fromUserId: 1, createdAt: -1 }` et
 * `Message` un index sur `senderId` : le comptage est indexé.
 *
 * ## Le plan effectif
 *
 * Seules les offres payantes actives donnent l'illimité. Un compte dont
 * l'abonnement a expiré mais dont `user.plan` est resté à « premium » retombe
 * sur les limites gratuites — sinon un abonnement résilié continuerait d'ouvrir
 * l'illimité. C'est la même règle que `/api/profiles` et
 * `/api/subscription/status`, volontairement : trois endroits, une seule
 * définition de « premium actif ».
 */

export type Quota = {
  plan: PlanId;
  /** `Infinity` pour une offre illimitée. */
  limite: number;
  utilises: number;
  /** `null` quand la limite est illimitée. */
  restants: number | null;
  illimite: boolean;
  /** `true` si une action de plus dépasserait la limite. */
  atteint: boolean;
};

type UtilisateurPourQuota = {
  plan?: string | null;
  isPremium?: boolean | null;
  subscriptionStatus?: string | null;
};

/** Minuit, heure du serveur. */
function debutDuJour(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * L'offre réellement en vigueur pour ce membre.
 *
 * Un `plan` renseigné ne suffit pas : il faut un abonnement actif ou en
 * période d'essai. Sinon, retour aux limites gratuites.
 */
export function planEffectif(user: UtilisateurPourQuota): PlanId {
  const actif =
    user.isPremium === true &&
    (user.subscriptionStatus === 'active' ||
      user.subscriptionStatus === 'trialing');

  if (!actif) return 'free';

  return normalizePlanId(user.plan);
}

/** Assemble un quota à partir d'une limite et d'un usage mesuré. */
function construire(plan: PlanId, limite: number, utilises: number): Quota {
  const illimite = !Number.isFinite(limite);

  return {
    plan,
    limite,
    utilises,
    restants: illimite ? null : Math.max(0, limite - utilises),
    illimite,
    atteint: !illimite && utilises >= limite,
  };
}

/**
 * Likes envoyés aujourd'hui, et ce qu'il en reste.
 *
 * Un « re-like » d'un profil déjà liké ne crée pas de document (la route fait
 * un upsert), donc il ne consomme rien — c'est cohérent avec ce comptage.
 */
export async function quotaLikesDuJour(
  userId: string,
  user: UtilisateurPourQuota
): Promise<Quota> {
  const plan = planEffectif(user);
  const limite = SUBSCRIPTION_PLANS[plan].limits.dailyLikes as number;

  if (!Number.isFinite(limite)) return construire(plan, limite, 0);

  let utilises = 0;

  try {
    utilises = await Like.countDocuments({
      fromUserId: userId,
      createdAt: { $gte: debutDuJour() },
    });
  } catch (error) {
    /**
     * En cas d'échec de lecture, on n'invente pas un quota consommé : on
     * laisse passer. Bloquer un membre payant sur une erreur de base serait
     * pire que laisser filer un like au-delà de la limite gratuite.
     */
    console.error('Comptage des likes du jour impossible :', error);
    return construire(plan, limite, 0);
  }

  return construire(plan, limite, utilises);
}

/** Messages envoyés aujourd'hui, et ce qu'il en reste. */
export async function quotaMessagesDuJour(
  userId: string,
  user: UtilisateurPourQuota
): Promise<Quota> {
  const plan = planEffectif(user);
  const limite = SUBSCRIPTION_PLANS[plan].limits.dailyMessages as number;

  if (!Number.isFinite(limite)) return construire(plan, limite, 0);

  let utilises = 0;

  try {
    utilises = await Message.countDocuments({
      senderId: userId,
      createdAt: { $gte: debutDuJour() },
    });
  } catch (error) {
    console.error('Comptage des messages du jour impossible :', error);
    return construire(plan, limite, 0);
  }

  return construire(plan, limite, utilises);
}
