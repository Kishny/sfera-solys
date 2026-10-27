// src/lib/visibilite.ts

/**
 * Les niveaux de visibilité d'un profil.
 *
 * ## Trois niveaux, quatre valeurs en base
 *
 * Le produit proposait quatre réglages. Deux d'entre eux — « réservé à
 * mes mises en relation » et « invisible » — faisaient presque la même
 * chose : sortir de l'annuaire et des Circle. Ils ne différaient que sur
 * un point, l'accès à la fiche, et depuis que le Mode Fantôme laisse
 * passer les matchs, ils ne diffèrent plus du tout.
 *
 * Deux réglages voisins que rien ne distingue, c'est un choix que
 * personne ne sait faire. Ils sont fusionnés sous le Mode Fantôme.
 *
 * `matches` reste accepté en base : des comptes l'ont déjà, et le
 * retirer de l'énumération rendrait leur document invalide à la première
 * écriture. Il est traité partout comme `invisible`, et toute écriture
 * le convertit — les documents migrent d'eux-mêmes, sans script.
 */

/** Ce qu'un document peut contenir, héritage compris. */
export type VisibiliteStockee = "public" | "premium" | "matches" | "invisible";

/** Ce que l'interface propose. */
export const VISIBILITES_PROPOSEES = [
  "public",
  "premium",
  "invisible",
] as const;

/** Ce qu'une route d'écriture accepte, `matches` toléré puis converti. */
export const VISIBILITES_ACCEPTEES: VisibiliteStockee[] = [
  "public",
  "premium",
  "matches",
  "invisible",
];

/**
 * Le profil est-il en Mode Fantôme ?
 *
 * Vrai pour les deux valeurs, l'ancienne comme la nouvelle. C'est cette
 * fonction, et non une comparaison directe, qui doit être appelée
 * partout : une comparaison à `"invisible"` seule laisserait passer les
 * comptes restés sur l'ancienne valeur.
 */
export function estFantome(valeur: unknown): boolean {
  return valeur === "invisible" || valeur === "matches";
}

/**
 * La valeur à écrire en base.
 *
 * Toute écriture passe par ici : c'est ce qui fait disparaître `matches`
 * du parc au fil des modifications, sans migration.
 */
export function normaliserVisibilite(valeur: unknown): VisibiliteStockee {
  if (estFantome(valeur)) return "invisible";
  if (valeur === "premium") return "premium";

  return "public";
}
