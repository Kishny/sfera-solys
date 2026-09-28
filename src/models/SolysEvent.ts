// src/models/SolysEvent.ts

import mongoose, { Schema, Document, Model, models } from "mongoose";

/**
 * Événement Solys.
 *
 * ## Renommage depuis `LunaEvent`
 *
 * Ce modèle s'appelait `LunaEvent` — nom du modèle, nom de l'interface, et
 * surtout **nom de la collection MongoDB** (`lunaevents`). C'était la dernière
 * trace structurelle de SferaLuna dans le code : tout le reste avait été
 * rebrandé, mais la base portait encore l'autre marque.
 *
 * ⚠️ **Conséquence à connaître** : mongoose déduit le nom de la collection du
 * nom du modèle. Renommer fait donc écrire dans `solysevents` et laisse les
 * documents éventuels de `lunaevents` orphelins. C'est sans effet sur ce fork,
 * dont la base ne contient pas encore d'événement réel. Si un jour il en
 * existait, la migration tient en une commande mongosh :
 *
 * ```js
 * db.lunaevents.renameCollection("solysevents")
 * ```
 *
 * Le `coverEmoji` avait pour valeur par défaut **la lune** — le symbole de la
 * marque d'origine, posé sur chaque événement de la version solaire. Le champ
 * reste, sans valeur par défaut : l'interface affiche une icône de catégorie.
 */

export interface ISolysEvent extends Document {
  title: string;
  description: string;
  date: Date;
  location: string;
  isOnline: boolean;
  maxAttendees: number;
  attendees: mongoose.Types.ObjectId[];
  category: string;
  emoji: string;
  /** Hérité. Conservé pour les documents existants, plus affiché. */
  coverEmoji?: string;
  createdBy: mongoose.Types.ObjectId;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SolysEventSchema = new Schema<ISolysEvent>(
  {
    title: { type: String, required: true, maxlength: 150, trim: true },
    description: { type: String, required: true, maxlength: 1000, trim: true },
    date: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    isOnline: { type: Boolean, default: false },
    maxAttendees: { type: Number, required: true, min: 1 },
    attendees: [{ type: Schema.Types.ObjectId, ref: "User" }],
    category: { type: String, required: true },
    emoji: { type: String, required: true },
    coverEmoji: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SolysEventSchema.index({ date: 1 });
SolysEventSchema.index({ isPublished: 1, date: 1 });

export const SolysEvent: Model<ISolysEvent> =
  (models.SolysEvent as Model<ISolysEvent>) ||
  mongoose.model<ISolysEvent>("SolysEvent", SolysEventSchema);
