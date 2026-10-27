// src/__tests__/boosts.test.ts
//
// Tests de la logique de boost (src/lib/boosts.ts).
//
// Quatre garanties sont vérifiées ici.
//
// 1. **Un boost échu ne classe plus personne**, même si son statut en base est
//    resté « active » : c'est ce qui empêche un avantage payant de dépendre
//    d'une tâche planifiée qui pourrait ne jamais tourner.
// 2. **Chaque offre a une formule, et une seule**, dont la force croît avec le
//    rang de l'offre — sans quoi payer plus cher classerait moins bien.
// 3. **L'égalité ne retombe pas sur `updatedAt`** : à force égale, c'est le
//    boost lancé le plus récemment qui passe devant, et non celui dont le
//    propriétaire a retouché sa bio en dernier.
// 4. **« En vol » n'est pas « en cours »** : le filtre qui autorise un nouveau
//    lancement doit voir les boosts programmés, sinon on peut en empiler dix.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

const boostMocks = vi.hoisted(() => ({
  find: vi.fn(),
  findOne: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock('@/models/Boost', () => ({
  Boost: boostMocks,
}));

import {
  FORCE_PAR_DEFAUT,
  FORMULES_PAR_OFFRE,
  HORIZON_PROGRAMMATION_JOURS,
  boostEnCours,
  boostEnVol,
  classementBoosts,
  formuleBoostDe,
  pipelineProfilsClasses,
  synchroniserStatutsBoosts,
  versPublic,
} from '@/lib/boosts';
import { PLAN_ORDER } from '@/lib/subscription/config';

/** `Boost.find(...).select(...).lean()` */
function chaineFind(resultat: unknown) {
  return {
    select: () => ({
      lean: () => Promise.resolve(resultat),
    }),
  };
}

/** `Boost.findOne(...).sort(...).lean()` */
function chaineFindOne(resultat: unknown) {
  return {
    sort: () => ({
      lean: () => Promise.resolve(resultat),
    }),
  };
}

const id = () => new mongoose.Types.ObjectId();

beforeEach(() => {
  vi.clearAllMocks();
  boostMocks.updateMany.mockResolvedValue({ modifiedCount: 0 });
});

describe('formuleBoostDe', () => {
  it('donne une formule à chacune des quatre offres', () => {
    for (const offre of PLAN_ORDER) {
      expect(FORMULES_PAR_OFFRE[offre]).toBeDefined();
    }

    expect(Object.keys(FORMULES_PAR_OFFRE).sort()).toEqual(
      [...PLAN_ORDER].sort()
    );
  });

  it('retombe sur l’offre gratuite pour un plan inconnu ou absent', () => {
    expect(formuleBoostDe('offre-inventee')).toEqual(FORMULES_PAR_OFFRE.free);
    expect(formuleBoostDe(undefined)).toEqual(FORMULES_PAR_OFFRE.free);
    expect(formuleBoostDe(null)).toEqual(FORMULES_PAR_OFFRE.free);
  });

  it('ne fait jamais décroître la force quand l’offre monte', () => {
    // Payer plus cher et être classé moins haut serait la pire des trahisons.
    const forces = PLAN_ORDER.map((offre) => FORMULES_PAR_OFFRE[offre].force);

    for (let i = 1; i < forces.length; i += 1) {
      expect(forces[i]).toBeGreaterThanOrEqual(forces[i - 1]);
    }
  });

  it('ne fait jamais décroître la durée quand l’offre monte', () => {
    const durees = PLAN_ORDER.map(
      (offre) => FORMULES_PAR_OFFRE[offre].dureeMinutes
    );

    for (let i = 1; i < durees.length; i += 1) {
      expect(durees[i]).toBeGreaterThanOrEqual(durees[i - 1]);
    }
  });

  it('réserve la programmation aux offres hautes, jamais au gratuit', () => {
    expect(FORMULES_PAR_OFFRE.free.programmable).toBe(false);
    expect(FORMULES_PAR_OFFRE['elite-monthly'].programmable).toBe(true);
  });

  it('distingue le type de la mise en avant Elite', () => {
    // Le type est visible des autres membres : c'est lui qui change le badge
    // affiché sur la carte, pas un chiffre caché dans la base.
    expect(FORMULES_PAR_OFFRE['elite-monthly'].type).toBe('spotlight');
    expect(FORMULES_PAR_OFFRE.free.type).toBe('profile');
  });
});

describe('classementBoosts', () => {
  it('filtre sur la fenêtre de dates, pas seulement sur le statut', async () => {
    boostMocks.find.mockReturnValue(chaineFind([]));

    await classementBoosts();

    const filtre = boostMocks.find.mock.calls[0][0];

    // La date est l'autorité : un boost échu est exclu par la requête
    // elle-même, même si son statut n'a jamais été mis à jour.
    expect(filtre.startsAt).toHaveProperty('$lte');
    expect(filtre.endsAt).toHaveProperty('$gt');
    expect(filtre.status.$in).toContain('active');
    expect(filtre.status.$in).toContain('scheduled');
    expect(filtre.status.$in).not.toContain('expired');
    expect(filtre.status.$in).not.toContain('canceled');
  });

  it('range les forces décroissantes et garde les trois tableaux alignés', async () => {
    const faible = id();
    const fort = id();

    boostMocks.find.mockReturnValue(
      chaineFind([
        { userId: faible, multiplier: 2, type: 'profile', startsAt: new Date(1) },
        { userId: fort, multiplier: 4, type: 'spotlight', startsAt: new Date(1) },
      ])
    );

    const { ids, poids, types } = await classementBoosts();

    expect(ids.map(String)).toEqual([String(fort), String(faible)]);
    expect(types).toEqual(['spotlight', 'profile']);

    // Poids décroissants et strictement positifs : le zéro reste réservé aux
    // profils non boostés, ce qui laisse `miseEnAvant` se lire comme « > 0 ».
    expect(poids).toEqual([2, 1]);
    expect(poids.every((valeur) => valeur > 0)).toBe(true);
    expect(ids).toHaveLength(poids.length);
    expect(ids).toHaveLength(types.length);
  });

  it('tranche l’égalité par le boost lancé le plus récemment', async () => {
    const ancien = id();
    const recent = id();

    boostMocks.find.mockReturnValue(
      chaineFind([
        {
          userId: ancien,
          multiplier: 3,
          type: 'profile',
          startsAt: new Date('2026-01-01T10:00:00.000Z'),
        },
        {
          userId: recent,
          multiplier: 3,
          type: 'profile',
          startsAt: new Date('2026-01-01T10:20:00.000Z'),
        },
      ])
    );

    const { ids } = await classementBoosts();

    // Et non pas celui dont le profil a été modifié en dernier : c'était la
    // règle d'avant, et personne ne l'avait voulue.
    expect(ids.map(String)).toEqual([String(recent), String(ancien)]);
  });

  it('ne cumule pas les boosts d’un même membre : le plus fort gagne', async () => {
    const membre = id();

    boostMocks.find.mockReturnValue(
      chaineFind([
        { userId: membre, multiplier: 2, type: 'profile', startsAt: new Date(1) },
        { userId: membre, multiplier: 4, type: 'spotlight', startsAt: new Date(2) },
        { userId: membre, multiplier: 2, type: 'profile', startsAt: new Date(3) },
      ])
    );

    const { ids, poids, types } = await classementBoosts();

    // Sinon, enchaîner dix boosts reviendrait à acheter la première place.
    expect(ids).toHaveLength(1);
    expect(poids).toEqual([1]);
    expect(types).toEqual(['spotlight']);
  });

  it('retombe sur la force par défaut si la valeur est absente', async () => {
    boostMocks.find.mockReturnValue(chaineFind([{ userId: id() }]));

    const { poids, types } = await classementBoosts();

    // Le poids ne dit rien de la force : il ne dit que le rang. On vérifie
    // donc que le document abîmé est classé plutôt qu'écarté du tri.
    expect(poids).toEqual([1]);
    expect(types).toEqual(['profile']);
    expect(FORCE_PAR_DEFAUT).toBeGreaterThan(0);
  });

  it('renvoie un classement vide sans lever quand la lecture échoue', async () => {
    const erreur = vi.spyOn(console, 'error').mockImplementation(() => {});

    boostMocks.find.mockImplementation(() => {
      throw new Error('Mongo indisponible');
    });

    // Explorer doit rester utilisable, simplement sans mise en avant.
    await expect(classementBoosts()).resolves.toEqual({
      ids: [],
      poids: [],
      types: [],
    });

    erreur.mockRestore();
  });
});

describe('versPublic', () => {
  const debut = new Date('2026-01-01T10:00:00.000Z');
  const fin = new Date('2026-01-01T10:30:00.000Z');

  const doc = {
    _id: id(),
    type: 'profile',
    multiplier: 2,
    startsAt: debut,
    endsAt: fin,
  };

  it('ne renvoie jamais un décompte négatif', () => {
    const passe = versPublic(doc, new Date('2026-01-01T12:00:00.000Z'));

    expect(passe.secondesRestantes).toBe(0);
    expect(passe.secondesAvantDebut).toBe(0);
  });

  it('compte les secondes restantes jusqu’à la fin de la fenêtre', () => {
    const encours = versPublic(doc, new Date('2026-01-01T10:20:00.000Z'));

    expect(encours.secondesRestantes).toBe(600);
    expect(encours.commence).toBe(true);
    expect(encours.endsAt).toBe(fin.toISOString());
  });

  it('distingue un boost programmé d’un boost commencé', () => {
    const avant = versPublic(doc, new Date('2026-01-01T09:50:00.000Z'));

    // Le panneau doit pouvoir dire « programmé pour 10 h » au lieu
    // d'afficher un décompte de fin qui n'a pas encore de sens.
    expect(avant.commence).toBe(false);
    expect(avant.secondesAvantDebut).toBe(600);
  });
});

describe('boostEnCours et boostEnVol', () => {
  it('renvoie null quand le membre n’a aucun boost', async () => {
    boostMocks.findOne.mockReturnValue(chaineFindOne(null));

    await expect(boostEnCours(String(id()))).resolves.toBeNull();
    await expect(boostEnVol(String(id()))).resolves.toBeNull();
  });

  it('en cours : exige que la fenêtre soit ouverte', async () => {
    boostMocks.findOne.mockReturnValue(chaineFindOne(null));

    await boostEnCours(String(id()));

    const filtre = boostMocks.findOne.mock.calls[0][0];

    expect(filtre.startsAt).toHaveProperty('$lte');
    expect(filtre.endsAt).toHaveProperty('$gt');
  });

  it('en vol : voit aussi les boosts programmés pour plus tard', async () => {
    boostMocks.findOne.mockReturnValue(chaineFindOne(null));

    await boostEnVol(String(id()));

    const filtre = boostMocks.findOne.mock.calls[0][0];

    // Ne pas contraindre `startsAt` est le cœur de la garantie : sans cela,
    // un membre pourrait programmer dix boosts à l'avance, puisque aucun
    // n'aurait encore commencé.
    expect(filtre.startsAt).toBeUndefined();
    expect(filtre.endsAt).toHaveProperty('$gt');
    expect(filtre.status.$in).toContain('scheduled');
  });
});

describe('HORIZON_PROGRAMMATION_JOURS', () => {
  it('reste un horizon court', () => {
    // Un horizon long rendrait la règle du boost unique inopérante : réserver
    // un créneau par semaine suffirait à occuper la tête du mois.
    expect(HORIZON_PROGRAMMATION_JOURS).toBeGreaterThan(0);
    expect(HORIZON_PROGRAMMATION_JOURS).toBeLessThanOrEqual(14);
  });
});

describe('synchroniserStatutsBoosts', () => {
  it('expire les boosts échus et active les boosts programmés commencés', async () => {
    await synchroniserStatutsBoosts();

    const etats = boostMocks.updateMany.mock.calls.map(
      (appel) => appel[1].$set.status
    );

    expect(etats).toContain('expired');
    expect(etats).toContain('active');
  });

  it('n’échoue pas si la mise à jour est impossible', async () => {
    const erreur = vi.spyOn(console, 'error').mockImplementation(() => {});

    boostMocks.updateMany.mockRejectedValue(new Error('Mongo indisponible'));

    // Aucune conséquence fonctionnelle : les dates tranchent de toute façon.
    await expect(synchroniserStatutsBoosts()).resolves.toBeUndefined();

    erreur.mockRestore();
  });
});

describe('pipelineProfilsClasses', () => {
  const construire = (
    ids: mongoose.Types.ObjectId[],
    poids: number[],
    types: ('profile' | 'spotlight' | 'event')[] = []
  ) =>
    pipelineProfilsClasses({
      filtre: { hasCompletedProfile: true },
      champs: 'pseudonyme age updatedAt',
      ids,
      poids,
      types,
      skip: 20,
      limit: 10,
    }) as any[];

  it('trie sur le poids de boost avant l’ordre naturel', () => {
    const etapes = construire([id()], [1], ['profile']);
    const tri = etapes.find((etape) => etape.$sort).$sort;

    // L'ordre des clés compte : c'est lui qui donne la priorité au boost.
    expect(Object.keys(tri)).toEqual(['scoreBoost', 'updatedAt', 'createdAt']);
    expect(tri.scoreBoost).toBe(-1);
  });

  it('pagine après le tri, jamais avant', () => {
    const etapes = construire([id()], [1], ['profile']);
    const noms = etapes.map((etape) => Object.keys(etape)[0]);

    expect(noms).toEqual([
      '$match',
      '$addFields',
      '$addFields',
      '$sort',
      '$skip',
      '$limit',
      '$project',
    ]);
  });

  it('expose la mise en avant et son type, sans laisser fuiter le rang', () => {
    const etapes = construire([id()], [1], ['spotlight']);
    const projection = etapes.find((etape) => etape.$project).$project;

    expect(projection.miseEnAvant).toEqual({ $gt: ['$scoreBoost', 0] });
    expect(projection.typeMiseEnAvant).toBe(1);
    expect(projection.pseudonyme).toBe(1);
    expect(projection).not.toHaveProperty('scoreBoost');
    expect(projection).not.toHaveProperty('rangBoost');
  });

  it('donne un poids de zéro et aucun type aux profils absents du classement', () => {
    const etapes = construire([], []);
    const rang = etapes[1].$addFields.rangBoost;
    const calculs = etapes[2].$addFields;

    expect(rang).toEqual({ $indexOfArray: [[], '$_id'] });
    expect(calculs.scoreBoost.$cond[0]).toEqual({ $eq: ['$rangBoost', -1] });
    expect(calculs.scoreBoost.$cond[1]).toBe(0);
    expect(calculs.typeMiseEnAvant.$cond[1]).toBe(null);
  });
});
