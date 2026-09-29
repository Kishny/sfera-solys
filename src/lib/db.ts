// src/lib/db.ts

import mongoose from "mongoose";

import { lireVariable } from "@/lib/configuration";

/**
 * URI MongoDB Atlas.
 *
 * ## Pourquoi la vérification n'est plus au chargement du module
 *
 * Elle l'était, et elle faisait **échouer le build** : `next build` importe
 * chaque route pour en collecter les données, une exception au chargement
 * arrête tout. Le premier déploiement Vercel s'est arrêté sur
 * `Failed to collect page data for /api/admin/reports/[id]`, avec un message
 * disant que la variable manque « dans le fichier .env.local » — fichier qui
 * n'existe pas sur Vercel, où les variables se posent dans les réglages du
 * projet. Le message envoyait chercher au mauvais endroit.
 *
 * La vérification a lieu maintenant à la première connexion : le build passe,
 * et une requête sans base configurée échoue avec une phrase qui nomme la
 * variable et l'endroit où la poser.
 *
 * Le nom de la base est donné explicitement à `mongoose.connect` (`dbName`),
 * il n'a donc pas besoin de figurer dans l'URI.
 */
const MONGODB_URI = lireVariable("MONGODB_URI");

/**
 * Cache global pour éviter de créer plusieurs connexions MongoDB
 * à chaque refresh ou recompilation de Next.js.
 */
const globalForMongoose = global as typeof globalThis & {
  mongoose?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

/**
 * Initialisation du cache si nécessaire.
 */
if (!globalForMongoose.mongoose) {
  globalForMongoose.mongoose = {
    conn: null,
    promise: null,
  };
}

/**
 * Connexion MongoDB réutilisable.
 *
 * Important :
 * - En développement, Next.js recharge souvent les fichiers.
 * - Sans cache, MongoDB peut ouvrir trop de connexions.
 * - Cette fonction réutilise donc la connexion existante si elle existe.
 */
export async function connectDB() {
  /**
   * Si une connexion existe déjà, on la réutilise.
   */
  if (globalForMongoose.mongoose?.conn) {
    return globalForMongoose.mongoose.conn;
  }

  /**
   * Si une promesse de connexion est déjà en cours,
   * on attend cette même promesse.
   */
  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI n'est pas configurée. En local, la poser dans .env.local ; " +
        "sur Vercel, dans Settings → Environment Variables."
    );
  }

  if (!globalForMongoose.mongoose?.promise) {
    globalForMongoose.mongoose!.promise = mongoose.connect(MONGODB_URI, {
      dbName: "sferasolys",
      bufferCommands: false,
    });
  }

  /**
   * On stocke la connexion finale dans le cache global.
   */
  globalForMongoose.mongoose!.conn =
    await globalForMongoose.mongoose!.promise;

  if (process.env.NODE_ENV === "development") {
  }

  return globalForMongoose.mongoose!.conn;
}