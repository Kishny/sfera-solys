// src/lib/boosts.ts

import mongoose from 'mongoose';

import { Boost, type BoostType } from '@/models/Boost';
import {
  FORCE_PAR_DEFAUT,
  FORMULES_PAR_OFFRE,
  HORIZON_PROGRAMMATION_JOURS,
  formuleBoostDe,
  formulePrioritaire,
  type FormuleBoost,
} from '@/lib/boosts-formules';

/**
 * Les formules vivent dans `lib/boosts-formules`, qui n'importe ni Mongoose ni
 * les modèles : le panneau de boost et la page des tarifs peuvent les lire.
 * Elles sont réexportées ici pour que le code serveur n'ait qu'un seul chemin
 * d'import à connaître.
 */
export {
  FORCE_PAR_DEFAUT,
  FORMULES_PAR_OFFRE,
  HORIZON_PROGRAMMATION_JOURS,
  formuleBoostDe,
  formulePrioritaire,
};
export type { FormuleBoost };

/**
 * Logique des boosts de visibilite — source unique de vérité.
 *
 * ## Pourquoi ce fichier existe
 *
 * Le modele `Boost` existait depuis l'origine, les quotas par offre aussi
 * (`boostsPerMonth` : 0 / 1 / 3 / 10), et `/tarifs` les vendait. Mais **rien
 * ne créait jamais un boost**, et surtout : aucun classement ne le lisait.
 * Tout ce qui decide de la durée, de la force et de la fenêtre d'activité d'un
 * boost est rassemblé ici, pour que le classement (`/api/profiles`) et
 * l'interface (`PanneauBoost`) ne puissent pas en donner deux versions
 * différentes.
 *
 * ## Une formule par offre, et non quatre réglages
 *
 * Les offres se distinguaient par le **nombre** de boosts, et par rien
 * d'autre : un boost Essentiel et un boost Elite étaient le même objet —
 * trente minutes, force 2, même type. L'Elite en avait simplement dix.
 *
 * Quatre leviers les séparent maintenant : la durée, la force, le type et la
 * possibilité de choisir l'heure. Ils ne sont pas quatre réglages
 * indépendants : ce sont les quatre colonnes d'une **formule**, une par offre,
 * dans le tableau ci-dessous. Un seul endroit à lire pour savoir ce que vaut
 * le boost de quelqu'un, et un seul à modifier pour en changer le prix.
 *
 * ## La règle qui compte
 *
 * Un boost est actif **si et seulement si** `startsAt <= maintenant < endsAt`
 * et que son statut n'est pas `canceled`. La date est l'autorité, pas le champ
 * `status` : si aucune tâche planifiée ne passe jamais faire le ménage, un
 * boost échu reste marqué `active` en base mais **ne classe plus rien**. Le
 * champ `status` est un confort d'affichage et d'administration, jamais la
 * condition d'un avantage payant.
 *
 * C'est aussi ce qui permet de programmer un boost sans tâche planifiée :
 * un boost `scheduled` dont l'heure est venue classe de lui-même, parce que
 * le filtre regarde les dates.
 */

export type BoostPublic = {
  id: string;
  type: BoostType;
  /** La force de classement telle qu'elle a été posée au lancement. */
  multiplier: number;
  startsAt: string;
  endsAt: string;
  /** La fenêtre a-t-elle commencé ? Faux pour un boost programmé plus tard. */
  commence: boolean;
  /** Secondes avant le début, zéro si la fenêtre est ouverte ou passée. */
  secondesAvantDebut: number;
  /** Secondes restantes avant la fin, jamais négatif. */
  secondesRestantes: number;
};

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
 * Filtre des boosts **en vol** : en cours ou encore à venir.
 *
 * Distinct de `filtreEnCours`, et c'est tout l'intérêt. Le contrôle « un boost
 * est déjà en cours » ne regardait que les fenêtres ouvertes : un membre
 * pouvait programmer dix boosts à l'avance sans qu'aucun ne soit encore
 * commencé. C'est ce filtre, et non l'autre, qui garde la règle d'un seul
 * boost à la fois.
 */
function filtreEnVol(maintenant: Date) {
  return {
    status: { $in: ['active', 'scheduled'] },
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

/** Le boost dont la fenêtre est ouverte maintenant, ou `null`. */
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

/**
 * Le boost en vol d'un membre : en cours, ou programmé et pas encore échu.
 *
 * C'est ce que doit lire toute route qui décide si un nouveau boost peut être
 * lancé.
 */
export async function boostEnVol(
  userId: string | mongoose.Types.ObjectId
): Promise<BoostPublic | null> {
  const maintenant = new Date();

  const boost = await Boost.findOne({
    userId,
    ...filtreEnVol(maintenant),
  })
    .sort({ startsAt: 1 })
    .lean();

  if (!boost) return null;

  return versPublic(boost, maintenant);
}

/** Convertit un document boost en payload d'API. */
export function versPublic(boost: any, maintenant = new Date()): BoostPublic {
  const debut = new Date(boost.startsAt);
  const fin = new Date(boost.endsAt);
  const instant = maintenant.getTime();

  const secondes = (cible: number) =>
    Math.max(0, Math.round((cible - instant) / 1000));

  return {
    id: String(boost._id),
    type: boost.type,
    multiplier: Number(boost.multiplier) || FORCE_PAR_DEFAUT,
    startsAt: debut.toISOString(),
    endsAt: fin.toISOString(),
    commence: debut.getTime() <= instant,
    secondesAvantDebut: secondes(debut.getTime()),
    secondesRestantes: secondes(fin.getTime()),
  };
}

/**
 * Le classement des profils actuellement mis en avant.
 *
 * Retourne trois tableaux parallèles — les identifiants, un poids de
 * classement et le type de boost — que consomme directement l'agrégation de
 * `/api/profiles`. Ce format évite un `$lookup` sur la collection des boosts à
 * chaque page d'Explorer ; l'ensemble est minuscule par nature, puisque ce
 * sont les boosts en cours à la seconde près, tous membres confondus.
 *
 * ## Le poids, et pourquoi ce n'est pas la force
 *
 * Le tri renvoyait la force brute. À force égale — deux membres Premium
 * boostés en même temps — l'égalité retombait sur `updatedAt`, c'est-à-dire
 * que **celui qui avait retouché son profil le plus récemment passait
 * devant**. Personne n'a conçu cette règle, elle est tombée là.
 *
 * L'ordre est donc décidé ici, entièrement, puis transmis sous forme de poids
 * décroissants. À force égale, c'est le boost lancé le plus récemment qui
 * passe devant : cela récompense le lancement, pas la retouche de bio. Et
 * comme le poids est unique par position, l'agrégation n'a plus aucune
 * égalité à trancher pour les profils boostés.
 *
 * ## Le cumul
 *
 * Si un membre cumule plusieurs boosts sur la même fenêtre, seul le plus fort
 * compte : on n'additionne pas les forces, sinon enchaîner dix boosts
 * deviendrait un achat de première place.
 */
export async function classementBoosts(): Promise<{
  ids: mongoose.Types.ObjectId[];
  poids: number[];
  types: BoostType[];
}> {
  const maintenant = new Date();

  try {
    const boosts = await Boost.find(filtreEnCours(maintenant))
      .select('userId multiplier type startsAt')
      .lean();

    type Retenu = {
      id: mongoose.Types.ObjectId;
      force: number;
      debut: number;
      type: BoostType;
    };

    const meilleur = new Map<string, Retenu>();

    for (const boost of boosts as Array<{
      userId: mongoose.Types.ObjectId;
      multiplier?: number;
      type?: BoostType;
      startsAt?: Date | string;
    }>) {
      const cle = String(boost.userId);
      const force = Number(boost.multiplier) || FORCE_PAR_DEFAUT;
      const debut = new Date(boost.startsAt ?? 0).getTime();
      const actuel = meilleur.get(cle);

      const gagne =
        !actuel ||
        force > actuel.force ||
        (force === actuel.force && debut > actuel.debut);

      if (gagne) {
        meilleur.set(cle, {
          id: boost.userId,
          force,
          debut,
          type: boost.type ?? 'profile',
        });
      }
    }

    const tries = [...meilleur.values()].sort(
      (a, b) => b.force - a.force || b.debut - a.debut
    );

    /**
     * Poids décroissants, strictement positifs : le premier reçoit `N`, le
     * dernier `1`. Le zéro reste réservé aux profils non boostés, ce qui
     * laisse `miseEnAvant` se lire comme « poids supérieur à zéro ».
     */
    const total = tries.length;

    return {
      ids: tries.map((entree) => entree.id),
      poids: tries.map((_, index) => total - index),
      types: tries.map((entree) => entree.type),
    };
  } catch (error) {
    /**
     * En cas d'échec, on retourne un classement vide plutôt que de faire
     * tomber Explorer : la page reste utilisable, sans mise en avant.
     */
    console.error('Lecture des boosts actifs impossible :', error);
    return { ids: [], poids: [], types: [] };
  }
}

/**
 * Construit le pipeline de lecture des profils classes par boost.
 *
 * Vit ici, et pas dans la route, pour deux raisons : la règle de classement
 * appartient à la logique de boost, et un pipeline inline dans une route API
 * n'est pas testable. Celui-ci l'est — voir `src/__tests__/boosts.test.ts`.
 *
 * `$indexOfArray` donne le rang du profil dans la liste des boostés ; le rang
 * sert ensuite à lire son poids et son type. Ce détour évite un `$lookup` sur
 * la collection des boosts à chaque page d'Explorer : les trois tableaux sont
 * passés en littéraux, et ils sont minuscules par construction.
 *
 * `miseEnAvant` et `typeMiseEnAvant` sont projetés volontairement :
 * l'interface doit pouvoir dire qu'un profil est poussé, et comment, au lieu
 * de le faire passer pour l'ordre naturel.
 */
export function pipelineProfilsClasses({
  filtre,
  champs,
  ids,
  poids,
  types,
  skip,
  limit,
}: {
  filtre: Record<string, unknown>;
  /** Champs publics, séparés par des espaces — même format que `.select()`. */
  champs: string;
  ids: mongoose.Types.ObjectId[];
  poids: number[];
  types: BoostType[];
  skip: number;
  limit: number;
}): mongoose.PipelineStage[] {
  const projection: Record<string, unknown> = Object.fromEntries(
    champs.split(/\s+/).filter(Boolean).map((champ) => [champ, 1])
  );

  projection.miseEnAvant = { $gt: ['$scoreBoost', 0] };
  projection.typeMiseEnAvant = 1;

  const absent = { $eq: ['$rangBoost', -1] };

  return [
    { $match: filtre } as mongoose.PipelineStage.Match,
    { $addFields: { rangBoost: { $indexOfArray: [ids, '$_id'] } } },
    {
      $addFields: {
        scoreBoost: {
          $cond: [absent, 0, { $arrayElemAt: [poids, '$rangBoost'] }],
        },
        typeMiseEnAvant: {
          $cond: [absent, null, { $arrayElemAt: [types, '$rangBoost'] }],
        },
      },
    },
    { $sort: { scoreBoost: -1, updatedAt: -1, createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    { $project: projection },
  ];
}
