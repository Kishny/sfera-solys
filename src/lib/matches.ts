// src/lib/matches.ts

import mongoose from 'mongoose';

import { Like } from '@/models/Like';
import { Match } from '@/models/Match';
import { User } from '@/models/User';
import { SUBSCRIPTION_PLANS, type PlanId } from '@/lib/subscription/config';
import { planEffectif } from '@/lib/quotas';

/**
 * Plafond de mises en relation — appliqué, enfin.
 *
 * ## La promesse qui n'était pas tenue
 *
 * `/tarifs` annonce « 3 matchs maximum » sur l'offre gratuite, et
 * `SUBSCRIPTION_PLANS.free.limits.maxMatches` vaut bien 3. Mais **rien ne
 * lisait cette valeur** : `/api/likes` créait le match dès la réciprocité, sans
 * jamais compter. La seule limite structurante de l'offre gratuite n'existait
 * pas.
 *
 * ## Le comportement retenu
 *
 * Quand un like réciproque ferait dépasser le plafond, **le like reste
 * enregistré mais la relation ne s'ouvre pas**. Elle est « en attente », et
 * s'ouvre dès qu'une place se libère — retirer un like désactive le match
 * correspondant, donc un membre reprend la main sur ses places quand il veut.
 *
 * Chacun est mesuré contre **son propre** plafond : on n'applique pas le plus
 * strict des deux aux deux. Un membre payant n'est donc jamais limité par
 * l'offre de son vis-à-vis. Il reste qu'une relation a besoin de deux places
 * libres pour s'ouvrir : si l'un est au plafond, elle attend.
 *
 * ## Deux façons de quitter une relation, et ce qu'elles comptent
 *
 * `DELETE /api/likes` retire le like et désactive le match des deux côtés :
 * c'est « mettre fin à la relation », et c'est ce que déclenche le bouton de
 * `/matches`. `DELETE /api/matches/[id]` est plus doux — il ajoute le membre à
 * `deletedBy` et ne désactive le match que lorsque les **deux** l'ont fait :
 * c'est « retirer de ma liste ».
 *
 * Les deux doivent libérer une place pour celui qui part, sinon le plafond
 * devient un cul-de-sac. Le comptage exclut donc les matchs que le membre a
 * lui-même supprimés, même s'ils restent actifs pour l'autre.
 *
 * ## Pas de résurrection involontaire
 *
 * « En attente » se lit comme : les deux likes existent, et aucun match actif ne
 * les relie. Retirer un like le supprime (`DELETE /api/likes`), donc un membre
 * qui met fin à une relation ne la verra pas revenir : la paire réciproque
 * n'existe plus.
 */

export type QuotaMatchs = {
  plan: PlanId;
  /** `Infinity` sur les offres payantes. */
  plafond: number;
  actifs: number;
  /** `null` quand le plafond est illimité. */
  restants: number | null;
  illimite: boolean;
  atteint: boolean;
};

type UtilisateurPourQuota = {
  plan?: string | null;
  isPremium?: boolean | null;
  subscriptionStatus?: string | null;
};

type Identifiant = string | mongoose.Types.ObjectId;

/**
 * Filtre des matchs qui occupent une place chez un membre.
 *
 * `deletedBy: { $ne: userId }` : un membre qui a retiré la conversation de sa
 * liste ne doit plus la voir compter contre son plafond, même si elle reste
 * active pour l'autre.
 */
function filtreOccupes(userId: Identifiant) {
  return {
    isActive: true,
    deletedBy: { $ne: userId },
    $or: [{ user1Id: userId }, { user2Id: userId }],
  };
}

/** Les matchs qui occupent une place chez ce membre. */
export async function compterMatchsActifs(userId: Identifiant): Promise<number> {
  try {
    return await Match.countDocuments(filtreOccupes(userId));
  } catch (error) {
    console.error('Comptage des matchs actifs impossible :', error);
    return 0;
  }
}

/** Le plafond d'un membre et ce qu'il en reste. */
export async function quotaMatchs(
  userId: Identifiant,
  user: UtilisateurPourQuota
): Promise<QuotaMatchs> {
  const plan = planEffectif(user);
  const plafond = SUBSCRIPTION_PLANS[plan].limits.maxMatches as number;
  const illimite = !Number.isFinite(plafond);

  if (illimite) {
    return {
      plan,
      plafond,
      actifs: await compterMatchsActifs(userId),
      restants: null,
      illimite: true,
      atteint: false,
    };
  }

  const actifs = await compterMatchsActifs(userId);

  return {
    plan,
    plafond,
    actifs,
    restants: Math.max(0, plafond - actifs),
    illimite: false,
    atteint: actifs >= plafond,
  };
}

/**
 * Les membres dont le like est réciproque sans qu'un match actif ne les relie.
 *
 * Trois lectures indexées : les likes émis, les likes reçus, les matchs actifs.
 */
export async function trouverEnAttente(
  userId: Identifiant
): Promise<mongoose.Types.ObjectId[]> {
  try {
    const [emis, recus, actifs] = await Promise.all([
      Like.find({ fromUserId: userId }).select('toUserId').lean(),
      Like.find({ toUserId: userId }).select('fromUserId createdAt').sort({ createdAt: 1 }).lean(),
      /**
       * Toutes les relations actives, y compris celles que le membre a retirées
       * de sa liste : on ne veut pas les « rouvrir », seulement ne pas les
       * compter contre son plafond (voir `filtreOccupes`).
       */
      Match.find({
        isActive: true,
        $or: [{ user1Id: userId }, { user2Id: userId }],
      })
        .select('user1Id user2Id')
        .lean(),
    ]);

    const aimes = new Set(
      (emis as Array<{ toUserId: mongoose.Types.ObjectId }>).map((like) =>
        String(like.toUserId)
      )
    );

    const moi = String(userId);

    const dejaEnRelation = new Set(
      (actifs as Array<{
        user1Id: mongoose.Types.ObjectId;
        user2Id: mongoose.Types.ObjectId;
      }>).map((match) =>
        String(match.user1Id) === moi ? String(match.user2Id) : String(match.user1Id)
      )
    );

    const enAttente: mongoose.Types.ObjectId[] = [];

    // `recus` est trié du plus ancien au plus récent : premier arrivé, premier servi.
    for (const like of recus as Array<{ fromUserId: mongoose.Types.ObjectId }>) {
      const autre = String(like.fromUserId);

      if (!aimes.has(autre)) continue;
      if (dejaEnRelation.has(autre)) continue;

      enAttente.push(like.fromUserId);
    }

    return enAttente;
  } catch (error) {
    console.error('Recherche des relations en attente impossible :', error);
    return [];
  }
}

/** Ordonne deux identifiants comme le fait le modèle Match (index unique). */
function normaliser(a: mongoose.Types.ObjectId, b: mongoose.Types.ObjectId) {
  return String(a) < String(b)
    ? { user1Id: a, user2Id: b }
    : { user1Id: b, user2Id: a };
}

/**
 * Ouvre les relations en attente qu'une place libérée rend possibles.
 *
 * Appelée après qu'un membre a retiré un like : c'est le seul moment où une
 * place se libère de son côté. Chaque candidat est vérifié contre **son propre**
 * plafond avant ouverture.
 *
 * Retourne les relations ouvertes, pour que l'appelant notifie les deux parties.
 */
export async function ouvrirEnAttente(
  userId: mongoose.Types.ObjectId,
  user: UtilisateurPourQuota
): Promise<Array<{ matchId: string; autreUserId: mongoose.Types.ObjectId }>> {
  const ouvertes: Array<{
    matchId: string;
    autreUserId: mongoose.Types.ObjectId;
  }> = [];

  try {
    const quota = await quotaMatchs(userId, user);
    let places = quota.illimite ? Number.POSITIVE_INFINITY : (quota.restants ?? 0);

    if (places <= 0) return ouvertes;

    const enAttente = await trouverEnAttente(userId);
    if (enAttente.length === 0) return ouvertes;

    const autres = await User.find({ _id: { $in: enAttente }, banned: { $ne: true } })
      .select('_id plan isPremium subscriptionStatus')
      .lean();

    const parId = new Map<string, UtilisateurPourQuota>(
      autres.map((autre) => [
        String(autre._id),
        {
          plan: autre.plan ?? null,
          isPremium: autre.isPremium ?? null,
          subscriptionStatus: autre.subscriptionStatus ?? null,
        },
      ])
    );

    for (const autreId of enAttente) {
      if (places <= 0) break;

      const autre = parId.get(String(autreId));
      if (!autre) continue;

      // Le plafond de l'autre compte aussi : une relation demande deux places.
      const quotaAutre = await quotaMatchs(autreId, autre);
      if (quotaAutre.atteint) continue;

      const { user1Id, user2Id } = normaliser(
        userId,
        autreId as mongoose.Types.ObjectId
      );

      const match = await Match.findOneAndUpdate(
        { user1Id, user2Id },
        {
          $set: { isActive: true },
          $setOnInsert: { user1Id, user2Id, lastMessageAt: null },
        },
        { upsert: true, new: true, runValidators: true }
      );

      ouvertes.push({
        matchId: String(match._id),
        autreUserId: autreId as mongoose.Types.ObjectId,
      });

      places -= 1;
    }
  } catch (error) {
    /**
     * Un échec ici ne doit pas faire échouer le retrait de like qui l'a
     * déclenché : la place est libérée, les relations en attente s'ouvriront au
     * prochain passage.
     */
    console.error('Ouverture des relations en attente impossible :', error);
  }

  return ouvertes;
}
