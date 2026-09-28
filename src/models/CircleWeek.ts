// src/models/CircleWeek.ts

import mongoose, { Schema, models, model } from 'mongoose';

/**
 * La sélection Circle of Six d'un membre, pour une semaine donnée.
 *
 * ## Pourquoi ce modèle existe
 *
 * Le Circle of Six est la fonctionnalité signature du produit, et sa promesse
 * est précise. `/valeurs` : « Le Circle of Six propose six profils le lundi,
 * puis s'arrête. » `/fonctionnalites` : « Chaque semaine, notre algorithme te
 * présente 6 profils. »
 *
 * Or `/api/circle` **recalculait le score à chaque appel** et renvoyait le top 6
 * du moment. Rien n'était figé : un nouveau like, une connexion d'un candidat,
 * une modification de profil, et les six changeaient — parfois entre deux
 * chargements de la même page. Le champ `weekOf` était renvoyé au client sans
 * jamais servir à quoi que ce soit. Ce n'était pas une sélection hebdomadaire,
 * c'était un classement permanent affiché six par six.
 *
 * Figer demande de stocker. Un tirage déterministe à partir de
 * (membre, semaine) ne suffirait pas : le vivier change quand des membres
 * s'inscrivent ou se retirent, donc le top 6 bougerait quand même.
 *
 * ## La règle
 *
 * Une ligne par membre et par semaine, créée au premier affichage de la
 * semaine. Ensuite, c'est cette ligne qui est servie — l'algorithme n'est plus
 * consulté jusqu'au lundi suivant. Un profil devenu indisponible (compte
 * supprimé, suspendu, passé en invisible) est retiré de l'affichage mais
 * **jamais remplacé** : la semaine est la semaine, et six profils dont un a
 * disparu vaut mieux qu'une sélection qui se recompose en douce.
 */

export interface ICircleWeek {
  _id: mongoose.Types.ObjectId;

  /** Le membre à qui cette sélection est destinée. */
  userId: mongoose.Types.ObjectId;

  /** Lundi 00:00 (heure serveur) de la semaine concernée. */
  weekStart: Date;

  /** Les profils retenus, dans l'ordre du score au moment du tirage. */
  profileIds: mongoose.Types.ObjectId[];

  /**
   * Taille du vivier au moment du tirage.
   * Sert à expliquer une sélection courte : six profils ne peuvent pas sortir
   * d'un vivier de trois.
   */
  poolSize: number;

  createdAt: Date;
  updatedAt: Date;
}

const CircleWeekSchema = new Schema<ICircleWeek>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    weekStart: {
      type: Date,
      required: true,
      index: true,
    },

    profileIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },

    poolSize: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

/**
 * Une seule sélection par membre et par semaine.
 *
 * L'index unique est la garantie qui compte : deux requêtes simultanées le
 * lundi matin ne peuvent pas créer deux tirages différents. La route s'appuie
 * dessus plutôt que sur un verrou applicatif.
 */
CircleWeekSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export const CircleWeek =
  models.CircleWeek || model<ICircleWeek>('CircleWeek', CircleWeekSchema);
