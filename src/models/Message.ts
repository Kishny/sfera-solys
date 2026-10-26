// src/models/Message.ts

import mongoose, { Schema, Document, Model, models } from "mongoose";

/**
 * Modèle Message Sfera'Solys.
 *
 * Un message privé appartient toujours à un Match.
 * Il est envoyé par l'un des deux utilisateurs du match.
 *
 * Le champ readAt permet de savoir si le message a été lu.
 */
export interface IMessage extends Document {
  matchId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;

  /**
   * Contenu texte du message.
   *
   * Facultatif depuis l'arrivée des photos : une photo seule est un
   * message légitime. Un message doit en revanche porter au moins l'un
   * des deux — texte ou image —, ce que vérifie le validateur plus bas.
   */
  content: string;

  /**
   * Photo jointe, hébergée sur Cloudinary.
   *
   * `null` pour un message en texte seul. L'URL est produite par
   * `POST /api/upload/chat-image`, qui passe l'image à la modération
   * automatique avant de la rendre : rien n'arrive ici sans être passé
   * par là.
   */
  imageUrl: string | null;

  /**
   * Date de lecture.
   *
   * null = pas encore lu.
   */
  readAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    /**
     * Match auquel appartient le message.
     */
    matchId: {
      type: Schema.Types.ObjectId,
      ref: "Match",
      required: true,
      index: true,
    },

    /**
     * Utilisateur qui a envoyé le message.
     */
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /**
     * Contenu du message.
     *
     * 1000 caractères suffisent largement pour une première version mobile-first.
     * Ça évite les très gros messages qui rendent l'interface lourde.
     */
    content: {
      type: String,
      required: false,
      default: "",
      trim: true,
      maxlength: [1000, "Le message ne peut pas dépasser 1000 caractères."],
    },

    /**
     * Photo jointe.
     *
     * Rien d'autre qu'une URL Cloudinary n'est accepté : la route
     * d'envoi refuse toute autre provenance, pour que le fil ne puisse
     * pas servir à afficher une image arbitraire du web.
     */
    imageUrl: {
      type: String,
      default: null,
    },

    /**
     * Date de lecture du message.
     */
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Un message vide n'existe pas.
 *
 * `content` n'est plus obligatoire en lui-même — une photo seule suffit —
 * mais les deux ne peuvent pas manquer en même temps. La règle vit ici
 * plutôt que dans la route : elle tient quel que soit le chemin d'écriture.
 */
MessageSchema.pre("validate", function (this: IMessage) {
  const texte = typeof this.content === "string" ? this.content.trim() : "";

  if (!texte && !this.imageUrl) {
    this.invalidate(
      "content",
      "Un message doit contenir du texte ou une photo."
    );
  }
});

/**
 * Index principal pour récupérer rapidement les messages d'un match
 * dans l'ordre chronologique.
 */
MessageSchema.index({
  matchId: 1,
  createdAt: 1,
});

/**
 * Index utile pour la pagination en arrière.
 */
MessageSchema.index({
  matchId: 1,
  createdAt: -1,
});

/**
 * Index utile pour marquer rapidement les messages non lus.
 */
MessageSchema.index({
  matchId: 1,
  senderId: 1,
  readAt: 1,
});

/**
 * Export du modèle compatible avec le hot reload Next.js.
 */
export interface MessageModel extends Model<IMessage> {}

export const Message: MessageModel =
  (models.Message as MessageModel) ||
  mongoose.model<IMessage, MessageModel>("Message", MessageSchema);
