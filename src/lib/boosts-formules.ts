// src/lib/boosts-formules.ts

import { normalizePlanId, type PlanId } from '@/lib/subscription/config';
import type { BoostType } from '@/models/Boost';

/**
 * Ce que vaut le boost de chaque offre — le tableau, et rien d'autre.
 *
 * ## Pourquoi ce fichier est séparé de `lib/boosts.ts`
 *
 * Trois endroits ont besoin de lire ces formules : la logique serveur, le
 * panneau de boost dans le navigateur, et la page des tarifs. `lib/boosts.ts`
 * importe Mongoose et le modèle `Boost` — l'importer depuis un composant
 * client embarquerait tout cela dans le paquet envoyé au navigateur.
 *
 * Ici, il n'y a que des données et des fonctions pures. L'import de
 * `BoostType` est un import de type, effacé à la compilation : il ne crée
 * aucune dépendance à l'exécution.
 *
 * Le bénéfice réel n'est pas la taille du paquet, c'est qu'il n'existe qu'un
 * seul tableau. La page des tarifs décrit ce que le serveur applique, parce
 * qu'elle lit la même chose — et non parce que quelqu'un a pensé à mettre les
 * deux à jour.
 */

/** Ce que vaut le boost d'une offre. */
export type FormuleBoost = {
  /** Le type posé sur le boost. Décide aussi du libellé sur la carte. */
  type: BoostType;

  /** Durée de la fenêtre de mise en avant, en minutes. */
  dureeMinutes: number;

  /**
   * Force de classement : décide qui passe devant qui quand plusieurs
   * membres sont boostés en même temps.
   *
   * C'est le levier à somme nulle : monter la force d'une offre rabaisse
   * mécaniquement les autres. À manier en sachant que le boost d'un membre
   * Essentiel devient décoratif dès qu'un Elite est actif.
   */
  force: number;

  /** Le membre peut-il choisir l'heure de lancement, au lieu de « maintenant » ? */
  programmable: boolean;
};

/**
 * La formule de chaque offre.
 *
 * `free` a une formule bien qu'il n'ait aucun boost mensuel : le boost de
 * découverte, offert une fois, se lance avec celle-ci.
 */
export const FORMULES_PAR_OFFRE: Record<PlanId, FormuleBoost> = {
  free: {
    type: 'profile',
    dureeMinutes: 30,
    force: 2,
    programmable: false,
  },

  'essential-monthly': {
    type: 'profile',
    dureeMinutes: 30,
    force: 2,
    programmable: false,
  },

  'premium-monthly': {
    type: 'profile',
    dureeMinutes: 45,
    force: 3,
    programmable: true,
  },

  'elite-monthly': {
    type: 'spotlight',
    dureeMinutes: 60,
    force: 4,
    programmable: true,
  },
};

/** La formule de l'offre, pour une valeur de plan quelconque. */
export function formuleBoostDe(plan: unknown): FormuleBoost {
  return FORMULES_PAR_OFFRE[normalizePlanId(plan)];
}

/**
 * Cette formule passe-t-elle devant la formule de base ?
 *
 * Calculée ici et transmise au client sous forme de booléen, parce que le
 * panneau de boost ne doit pas importer ce fichier : il tirerait Mongoose et
 * les modèles dans le paquet du navigateur. C'est aussi ce qui évite d'écrire
 * « la force de base vaut 2 » une seconde fois, dans un composant.
 */
export function formulePrioritaire(formule: FormuleBoost): boolean {
  return formule.force > FORMULES_PAR_OFFRE.free.force;
}

/**
 * Le nom que porte la mise en avant, tel que les autres membres le lisent.
 *
 * C'est le seul endroit où ces deux mots sont écrits. La carte d'un profil
 * dans Explorer, le panneau de boost et la page des tarifs les prennent ici :
 * un membre qui lit « À la une » sur /tarifs doit retrouver « À la une » sur
 * la carte, et pas un synonyme.
 */
export function libelleTypeBoost(type: string): string {
  return type === 'spotlight' ? 'À la une' : 'Mis en avant';
}

/**
 * Où se situe la force d'une formule parmi toutes les formules.
 *
 * Dérivé du tableau, jamais écrit offre par offre : rééquilibrer une force
 * suffit à corriger le mot affiché. Dire « maximale » resterait vrai même si
 * une cinquième offre apparaissait au-dessus — ce serait alors elle qui le
 * porterait.
 */
export function niveauDeForce(
  formule: FormuleBoost
): 'standard' | 'élevée' | 'maximale' {
  const forces = Object.values(FORMULES_PAR_OFFRE).map((f) => f.force);
  const minimum = Math.min(...forces);
  const maximum = Math.max(...forces);

  if (formule.force >= maximum) return 'maximale';
  if (formule.force <= minimum) return 'standard';

  return 'élevée';
}

/**
 * Jusqu'où un boost peut être programmé.
 *
 * Sans horizon, un membre Elite placerait ses dix boosts sur les dix
 * prochains vendredis soir et occuperait la tête du classement pour le mois.
 */
export const HORIZON_PROGRAMMATION_JOURS = 7;

/**
 * Force attribuée à un boost qui n'en porte pas.
 *
 * Les boosts créés avant les formules ont tous `multiplier: 2` ; ce défaut ne
 * sert qu'aux documents abîmés, pour qu'ils classent comme un boost de base
 * plutôt que de disparaître du tri.
 */
export const FORCE_PAR_DEFAUT = 2;
