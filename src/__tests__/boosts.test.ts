// src/__tests__/boosts.test.ts
//
// Tests de la logique de boost (src/lib/boosts.ts).
//
// Ce qui est vérifié ici tient en une phrase : **un boost échu ne doit plus
// classer personne, même si son statut en base est resté « active »**. C'est
// la garantie qui empêche un avantage payant de dépendre d'une tâche
// planifiée qui pourrait ne jamais tourner. Le reste couvre le cumul
// (plusieurs boosts sur la même fenêtre) et la robustesse (une panne de
// lecture ne doit pas faire tomber Explorer).

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
  DUREE_BOOST_MINUTES,
  MULTIPLICATEUR_PROFIL,
  MULTIPLICATEUR_SPOTLIGHT,
  boostEnCours,
  classementBoosts,
  multiplicateurPour,
  pipelineProfilsClasses,
  synchroniserStatutsBoosts,
  versPublic,
} from '@/lib/boosts';

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

describe('multiplicateurPour', () => {
  it('distingue le boost de profil de la mise en avant renforcée', () => {
    expect(multiplicateurPour('profile')).toBe(MULTIPLICATEUR_PROFIL);
    expect(multiplicateurPour('spotlight')).toBe(MULTIPLICATEUR_SPOTLIGHT);
    expect(MULTIPLICATEUR_SPOTLIGHT).toBeGreaterThan(MULTIPLICATEUR_PROFIL);
  });

  it('retombe sur le boost de profil pour un type inconnu', () => {
    expect(multiplicateurPour('inconnu')).toBe(MULTIPLICATEUR_PROFIL);
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
    expect(filtre.status.$in).not.toContain('expired');
    expect(filtre.status.$in).not.toContain('canceled');
  });

  it('trie par score décroissant et garde les deux tableaux alignés', async () => {
    const faible = id();
    const fort = id();

    boostMocks.find.mockReturnValue(
      chaineFind([
        { userId: faible, multiplier: 2 },
        { userId: fort, multiplier: 3 },
      ])
    );

    const { ids, scores } = await classementBoosts();

    expect(ids.map(String)).toEqual([String(fort), String(faible)]);
    expect(scores).toEqual([3, 2]);
    expect(ids).toHaveLength(scores.length);
  });

  it('ne cumule pas les boosts d’un même membre : le plus fort gagne', async () => {
    const membre = id();

    boostMocks.find.mockReturnValue(
      chaineFind([
        { userId: membre, multiplier: 2 },
        { userId: membre, multiplier: 3 },
        { userId: membre, multiplier: 2 },
      ])
    );

    const { ids, scores } = await classementBoosts();

    // Sinon, enchaîner dix boosts reviendrait à acheter la première place.
    expect(ids).toHaveLength(1);
    expect(scores).toEqual([3]);
  });

  it('retombe sur le multiplicateur de profil si la valeur est absente', async () => {
    boostMocks.find.mockReturnValue(chaineFind([{ userId: id() }]));

    const { scores } = await classementBoosts();

    expect(scores).toEqual([MULTIPLICATEUR_PROFIL]);
  });

  it('renvoie un classement vide sans lever quand la lecture échoue', async () => {
    const erreur = vi.spyOn(console, 'error').mockImplementation(() => {});

    boostMocks.find.mockImplementation(() => {
      throw new Error('Mongo indisponible');
    });

    // Explorer doit rester utilisable, simplement sans mise en avant.
    await expect(classementBoosts()).resolves.toEqual({ ids: [], scores: [] });

    erreur.mockRestore();
  });
});

describe('versPublic', () => {
  it('ne renvoie jamais un décompte négatif', () => {
    const debut = new Date('2026-01-01T10:00:00.000Z');
    const fin = new Date('2026-01-01T10:30:00.000Z');

    const passe = versPublic(
      { _id: id(), type: 'profile', multiplier: 2, startsAt: debut, endsAt: fin },
      new Date('2026-01-01T12:00:00.000Z')
    );

    expect(passe.secondesRestantes).toBe(0);
  });

  it('compte les secondes restantes jusqu’à la fin de la fenêtre', () => {
    const debut = new Date('2026-01-01T10:00:00.000Z');
    const fin = new Date('2026-01-01T10:30:00.000Z');

    const encours = versPublic(
      { _id: id(), type: 'profile', multiplier: 2, startsAt: debut, endsAt: fin },
      new Date('2026-01-01T10:20:00.000Z')
    );

    expect(encours.secondesRestantes).toBe(600);
    expect(encours.endsAt).toBe(fin.toISOString());
  });
});

describe('boostEnCours', () => {
  it('renvoie null quand le membre n’a aucun boost en cours', async () => {
    boostMocks.findOne.mockReturnValue(chaineFindOne(null));

    await expect(boostEnCours(String(id()))).resolves.toBeNull();
  });

  it('renvoie le boost en cours au format public', async () => {
    const maintenant = Date.now();

    boostMocks.findOne.mockReturnValue(
      chaineFindOne({
        _id: id(),
        type: 'profile',
        multiplier: 2,
        startsAt: new Date(maintenant),
        endsAt: new Date(maintenant + DUREE_BOOST_MINUTES * 60 * 1000),
      })
    );

    const boost = await boostEnCours(String(id()));

    expect(boost).not.toBeNull();
    expect(boost?.multiplier).toBe(2);
    expect(boost?.secondesRestantes).toBeGreaterThan(0);
    expect(boost?.secondesRestantes).toBeLessThanOrEqual(
      DUREE_BOOST_MINUTES * 60
    );
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
  const construire = (ids: mongoose.Types.ObjectId[], scores: number[]) =>
    pipelineProfilsClasses({
      filtre: { hasCompletedProfile: true },
      champs: 'pseudonyme age updatedAt',
      ids,
      scores,
      skip: 20,
      limit: 10,
    }) as any[];

  it('trie sur le score de boost avant l’ordre naturel', () => {
    const etapes = construire([id()], [2]);
    const tri = etapes.find((etape) => etape.$sort).$sort;

    // L'ordre des clés compte : c'est lui qui donne la priorité au boost.
    expect(Object.keys(tri)).toEqual(['scoreBoost', 'updatedAt', 'createdAt']);
    expect(tri.scoreBoost).toBe(-1);
  });

  it('pagine après le tri, jamais avant', () => {
    const etapes = construire([id()], [2]);
    const noms = etapes.map((etape) => Object.keys(etape)[0]);

    expect(noms).toEqual([
      '$match',
      '$addFields',
      '$sort',
      '$skip',
      '$limit',
      '$project',
    ]);
  });

  it('expose miseEnAvant et ne laisse pas fuiter le score interne', () => {
    const etapes = construire([id()], [2]);
    const projection = etapes.find((etape) => etape.$project).$project;

    expect(projection.miseEnAvant).toEqual({ $gt: ['$scoreBoost', 0] });
    expect(projection.pseudonyme).toBe(1);
    expect(projection.age).toBe(1);
    expect(projection).not.toHaveProperty('scoreBoost');
  });

  it('donne un score de zéro aux profils absents du classement', () => {
    const etapes = construire([], []);
    const calcul = etapes.find((etape) => etape.$addFields).$addFields
      .scoreBoost.$let;

    expect(calcul.vars.rang).toEqual({ $indexOfArray: [[], '$_id'] });
    expect(calcul.in.$cond[0]).toEqual({ $eq: ['$$rang', -1] });
    expect(calcul.in.$cond[1]).toBe(0);
  });
});
