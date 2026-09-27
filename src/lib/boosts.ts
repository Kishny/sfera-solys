// src/lib/boosts.ts

import mongoose from 'mongoose';

import { Boost } from '@/models/Boost';

/**
 * Logique des boosts de visibilité — source unique de vérité.
 *
 * ## Pourquoi ce fichier existe
 *
 * Le modèle `Boost` existait depuis l'origine, les quotas par offre aussi
 * (`boostsPerMonth` : 0 / 1 / 3 / 10), et `/tarifs` les vendait. Mais **rien
 * ne créait jamais un boost**, et surtout : aucun classement ne le lisait.
 * `Boost` n'apparaissait dans le code qu'à deux endroits — un `countDocuments`
 * pour le quota, et un `deleteMany` à la suppression de compte. Un membre
 * Elite payait donc dix boosts par mois qui n'avaient aucun effet observable.
 *
 * Tout ce qui décide de la durée, de la force et de la fenêtre d'activité d'un
 * boost est rassemblé ici, pour que le classement (`/api/profiles`) et
 * l'interface (`PanneauBoost`) ne puissent pas en donner deux versions
 * différentes.
 *
 * ## La règle qui compte
 *
 * Un boost est actif **si et seulement si** `startsAt <= maintenant < endsAt`
 * et que son statut n'est pas `canceled`. La date est l'autorité, pas le champ
 * `status` : si aucune tâche planifiée ne passe jamais faire le ménage, un
 * boost échu reste marqué `active` en base mais **ne classe plus rien**. Le
 * champ `status` est un confort d'affichage et d'administration, jamais la
 * condition d'un avantage payant.
 */

/** Durée d'un boost de profil, en minutes. */
export const DUREE_BOOST_MINUTES = 30;

/** Force d'un boost de profil. Sert de score de classement. */
export const MULTIPLICATEUR_PROFIL = 2;

/** Force d'une mise en avant renforcée (non commercialisée pour l'instant). */
export const MULTIPLICATEUR_SPOTLIGHT = 3;

export type BoostPublic = {
  id: string;
  type: string;
  multiplier: number;
  startsAt: string;
  endsAt: string;
  /** Secondes restantes, jamais négatif. */
  secondesRestantes: number;
};

/** Le multiplicateur associé à un type de boost. */
export function multiplicateurPour(type: string): number {
  return type === 'spotlight' ? MULTIPLICATEUR_SPOTLIGHT : MULTIPLICATEUR_PROFIL;
}

/**
 * Filtre Mongo des boosts en cours à un instant donné.
 *
 * `scheduled` est inclus : un boost programmé dont la fenêtre a commencé est
 * actif, même si personne n'a encore basculé son statut.
 */
function filtreEnCours(maintenant: Date) {
  return {
    status: { $in: ['active', 'scheduled'] },
    startsAt: { $lte: maintenant },
    endsAt: { $gt: maintenant },
  };
}

/**
 * Remet les statuts en cohérence avec les dates.
 *
 * Appelée de façon opportuniste par les routes de boost — jamais depuis le
 * chemin chaud du classement. Aucun avantage ni aucune restriction ne dépend
 * de son passage : elle ne fait que rendre la base lisible.
 */
export async function synchroniserStatutsBoosts(): Promise<void> {
  const maintenant = new Date();

  try {
    await Promise.all([
      Boost.updateMany(
        { status: { $in: ['active', 'scheduled'] }, endsAt: { $lte: maintenant } },
        { $set: { status: 'expired' } }
      ),
      Boost.updateMany(
        { status: 'scheduled', startsAt: { $lte: maintenant }, endsAt: { $gt: maintenant } },
        { $set: { status: 'active' } }
      ),
    ]);
  } catch (error) {
    // Un échec ici n'a aucune conséquence fonctionnelle : les dates tranchent.
    console.error('Synchronisation des statuts de boost impossible :', error);
  }
}

/** Le boost en cours d'un membre, ou `null`. */
export async function boostEnCours(
  userId: string | mongoose.Types.ObjectId
): Promise<BoostPublic | null> {
  const maintenant = new Date();

  const boost = await Boost.findOne({
    userId,
    ...filtreEnCours(maintenant),
  })
    .sort({ endsAt: -1 })
    .lean();

  if (!boost) return null;

  return versPublic(boost, maintenant);
}

/** Convertit un document boost en payload d'API. */
export function versPublic(boost: any, maintenant = new Date()): BoostPublic {
  const fin = new Date(boost.endsAt);

  return {
    id: String(boost._id),
    type: boost.type,
    multiplier: boost.multiplier,
    startsAt: new Date(boost.startsAt).toISOString(),
    endsAt: fin.toISOString(),
    secondesRestantes: Math.max(
      0,
      Math.round((fin.getTime() - maintenant.getTime()) / 1000)
    ),
  };
}

/**
 * Le classement des profils actuellement mis en avant.
 *
 * Retourne deux tableaux parallèles — les identifiants et leur score — triés
 * par score décroissant. Ce format est celui que consomme directement
 * l'agrégation de `/api/profiles` (`$indexOfArray` puis `$arrayElemAt`), ce
 * qui évite un `$lookup` sur la collection des boosts à chaque page
 * d'Explorer.
 *
 * L'ensemble est petit par nature : ce sont les boosts en cours à la seconde
 * près, tous membres confondus. Un boost dure trente minutes.
 *
 * Si un membre cumule plusieurs boosts sur la même fenêtre, seul le plus fort
 * compte : on additionne pas les multiplicateurs, sinon acheter dix boosts
 * d'affilée deviendrait un achat de première place.
 */
export async function classementBoosts(): Promise<{
  ids: mongoose.Types.ObjectId[];
  scores: number[];
}> {
  const maintenant = new Date();

  try {
    const boosts = await Boost.find(filtreEnCours(maintenant))
      .select('userId multiplier')
      .lean();

    const meilleur = new Map<string, { id: mongoose.Types.ObjectId; score: number }>();

    for (const boost of boosts as Array<{
      userId: mongoose.Types.ObjectId;
      multiplier?: number;
    }>) {
      const cle = String(boost.userId);
      const score = Number(boost.multiplier) || MULTIPLICATEUR_PROFIL;
      const actuel = meilleur.get(cle);

      if (!actuel || score > actuel.score) {
        meilleur.set(cle, { id: boost.userId, score });
      }
    }

    const tries = [...meilleur.values()].sort((a, b) => b.score - a.score);

    return {
      ids: tries.map((entree) => entree.id),
      scores: tries.map((entree) => entree.score),
    };
  } catch (error) {
    /**
     * En cas d'échec, on retourne un classement vide plutôt que de faire
     * tomber Explorer : la page reste utilisable, sans mise en avant.
     */
    console.error('Lecture des boosts actifs impossible :', error);
    return { ids: [], scores: [] };
  }
}

/**
 * Construit le pipeline de lecture des profils classés par boost.
 *
 * Vit ici, et pas dans la route, pour deux raisons : la règle de classement
 * appartient à la logique de boost, et un pipeline inline dans une route API
 * n'est pas testable. Celui-ci l'est — voir `src/__tests__/boosts.test.ts`.
 *
 * `$indexOfArray` donne le rang du profil dans la liste des boostés,
 * `$arrayElemAt` son score, et zéro pour tous les autres. Ce détour évite un
 * `$lookup` sur la collection des boosts à chaque page d'Explorer : les deux
 * tableaux sont passés en littéraux, et ils sont minuscules par construction.
 *
 * `miseEnAvant` est projeté volontairement : l'interface doit pouvoir dire
 * qu'un profil est poussé, au lieu de le faire passer pour l'ordre naturel.
 */
export function pipelineProfilsClasses({
  filtre,
  champs,
  ids,
  scores,
  skip,
  limit,
}: {
  filtre: Record<string, unknown>;
  /** Champs publics, séparés par des espaces — même format que `.select()`. */
  champs: string;
  ids: mongoose.Types.ObjectId[];
  scores: number[];
  skip: number;
  limit: number;
}): mongoose.PipelineStage[] {
  const projection: Record<string, unknown> = Object.fromEntries(
    champs.split(/\s+/).filter(Boolean).map((champ) => [champ, 1])
  );

  projection.miseEnAvant = { $gt: ['$scoreBoost', 0] };

  return [
    { $match: filtre } as mongoose.PipelineStage.Match,
    {
      $addFields: {
        scoreBoost: {
          $let: {
            vars: { rang: { $indexOfArray: [ids, '$_id'] } },
            in: {
              $cond: [
                { $eq: ['$$rang', -1] },
                0,
                { $arrayElemAt: [scores, '$$rang'] },
              ],
            },
          },
        },
      },
    },
    { $sort: { scoreBoost: -1, updatedAt: -1, createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    { $project: projection },
  ];
}
