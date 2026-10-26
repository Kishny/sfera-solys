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
   * Message vocal, hébergé sur Cloudinary.
   *
   * `null` pour un message sans voix. Contrairement au texte et aux
   * images, un vocal ne passe par aucun filtre automatique : rien ne sait
   * écouter. Il reste signalable comme les autres, et c'est le seul
   * garde-fou — à garder en tête si la modération devient un sujet.
   */
  audioUrl: string | null;

  /** Durée du vocal en secondes, pour l'afficher sans charger le fichier. */
  audioDuree: number | null;

  /**
   * Lieu partagé.
   *
   * Volontairement imprécis : les coordonnées sont arrondies à deux
   * décimales avant d'arriver ici, soit environ un kilomètre. Sur un
   * site de rencontre, une position au mètre près est une adresse de
   * domicile, et on ne confie pas son adresse en appuyant sur un bouton.
   * Ce qu'on partage, c'est un quartier.
   */
  lieu: {
    libelle: string;
    lat: number;
    lng: number;
  } | null;

  /**
   * Proposition de rendez-vous.
   *
   * C'est le seul contenu de message dont l'état change après l'envoi :
   * l'autre répond, et la bulle se met à jour. Elle vit dans le message
   * plutôt que dans sa propre collection parce qu'une proposition *est*
   * un message — elle a sa place dans le fil, à sa date, et se signale
   * comme les autres.
   *
   * Qui peut quoi : seul le destinataire accepte ou décline, seul
   * l'auteur annule. La route de réponse est le gardien de cette règle.
   */
  /**
   * Événement Solys partagé.
   *
   * On ne garde que la référence, pas une copie des informations. Un
   * événement dont la date bouge doit bouger partout : une copie figée
   * dans une conversation donnerait rendez-vous au mauvais moment. La
   * contrepartie est qu'un événement retiré laisse une carte vide, ce
   * que l'affichage dit explicitement.
   */
  evenementId: mongoose.Types.ObjectId | null;

  /**
   * Fichier joint.
   *
   * Restreint au PDF par la route d'envoi — voir le commentaire qui y
   * explique pourquoi.
   */
  fichier: {
    url: string;
    nom: string;
    poids: number;
  } | null;

  rendezVous: {
    quand: Date;
    ou: string;
    note: string;
    statut: "propose" | "accepte" | "decline" | "annule";
    reponduLe: Date | null;
  } | null;

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
     * Message vocal.
     *
     * Même règle que pour l'image : seule une URL de notre propre compte
     * Cloudinary est acceptée par la route d'envoi.
     */
    audioUrl: {
      type: String,
      default: null,
    },

    audioDuree: {
      type: Number,
      default: null,
      min: 0,
    },

    /**
     * Lieu partagé, à l'échelle du quartier.
     *
     * `_id: false` : c'est une donnée, pas un sous-document à adresser.
     */
    /**
     * Événement Solys partagé : une référence, jamais une copie.
     */
    evenementId: {
      type: Schema.Types.ObjectId,
      ref: "SolysEvent",
      default: null,
    },

    /**
     * Fichier joint.
     */
    fichier: {
      type: new Schema(
        {
          url: { type: String, required: true },
          nom: { type: String, required: true, trim: true, maxlength: 200 },
          poids: { type: Number, required: true, min: 0 },
        },
        { _id: false }
      ),
      default: null,
    },

    /**
     * Proposition de rendez-vous.
     */
    rendezVous: {
      type: new Schema(
        {
          quand: { type: Date, required: true },
          ou: { type: String, required: true, trim: true, maxlength: 160 },
          note: { type: String, default: "", trim: true, maxlength: 300 },
          statut: {
            type: String,
            enum: ["propose", "accepte", "decline", "annule"],
            default: "propose",
          },
          reponduLe: { type: Date, default: null },
        },
        { _id: false }
      ),
      default: null,
    },

    lieu: {
      type: new Schema(
        {
          libelle: { type: String, required: true, trim: true, maxlength: 160 },
          lat: { type: Number, required: true, min: -90, max: 90 },
          lng: { type: Number, required: true, min: -180, max: 180 },
        },
        { _id: false }
      ),
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
 * `content` n'est plus obligatoire en lui-même — une photo ou un vocal
 * suffisent —, mais tout ne peut pas manquer en même temps. La règle vit
 * ici plutôt que dans la route : elle tient quel que soit le chemin
 * d'écriture.
 */
MessageSchema.pre("validate", function (this: IMessage) {
  const texte = typeof this.content === "string" ? this.content.trim() : "";

  if (
    !texte &&
    !this.imageUrl &&
    !this.audioUrl &&
    !this.lieu &&
    !this.rendezVous &&
    !this.evenementId &&
    !this.fichier
  ) {
    this.invalidate("content", "Un message doit avoir un contenu.");
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
