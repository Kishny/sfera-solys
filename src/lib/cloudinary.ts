// src/lib/cloudinary.ts

import { v2 as cloudinary } from "cloudinary";

import { lireVariable, signalerAbsence } from "@/lib/configuration";

/**
 * Client Cloudinary, pour l'envoi des photos de profil et des images de
 * conversation.
 *
 * `cloudinary.config()` accepte des valeurs `undefined` sans broncher : rien
 * ne signalait l'absence de configuration, et l'envoi d'une photo échouait
 * plus tard avec une erreur de l'API. `cloudinaryEstConfigure` permet aux
 * routes d'envoi de répondre franchement.
 */

const cloudName = lireVariable("CLOUDINARY_CLOUD_NAME");
const apiKey = lireVariable("CLOUDINARY_API_KEY");
const apiSecret = lireVariable("CLOUDINARY_API_SECRET");

/** Vrai seulement si les trois valeurs existent et ne sont pas des placeholders. */
export const cloudinaryEstConfigure = Boolean(cloudName && apiKey && apiSecret);

if (cloudinaryEstConfigure) {
  cloudinary.config({
    cloud_name: cloudName as string,
    api_key: apiKey as string,
    api_secret: apiSecret as string,
  });
}

/** Message unique, pour que les trois routes d'envoi disent la même chose. */
export const CLOUDINARY_INDISPONIBLE =
  "L'envoi d'images n'est pas encore activé sur ce serveur.";

export function verifierCloudinary() {
  if (!cloudinaryEstConfigure) {
    signalerAbsence(
      "Cloudinary",
      "l'envoi de photos de profil et d'images est indisponible " +
        "(CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET)."
    );
  }

  return cloudinaryEstConfigure;
}

export default cloudinary;
