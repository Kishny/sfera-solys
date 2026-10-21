// src/lib/blocages.ts

import mongoose from "mongoose";

import { User } from "@/models/User";

/**
 * Blocages entre membres — source unique.
 *
 * ## Ce qui n'allait pas
 *
 * `User.blockedUsers` existait, `POST`/`DELETE /api/users/block` l'écrivait,
 * et le commentaire du schéma promettait que les profils bloqués étaient
 * « masqués partout ». En réalité **aucune requête ne lisait ce tableau** :
 * ni Explorer, ni le Circle, ni les matchs, ni la messagerie. Un membre
 * pouvait bloquer quelqu'un et continuer de le croiser, et surtout de le
 * recevoir en message. Sur une plateforme de rencontre, c'est une fonction
 * de sécurité qui ment.
 *
 * ## Le blocage vaut dans les deux sens
 *
 * Si A bloque B, A ne voit plus B — c'est le sens attendu. Mais B ne doit
 * plus voir A non plus, sans quoi B garde la main : il continue d'ouvrir le
 * profil, d'écrire, de liker, et A se retrouve à subir exactement ce dont
 * elle voulait se protéger. Un blocage à sens unique ne protège personne.
 *
 * ## Forme des identifiants
 *
 * `blockedUsers` est déclaré `[String]` au schéma, et la route de blocage y
 * pousse le `targetUserId` reçu en JSON — donc des chaînes. La recherche
 * inverse compare donc une chaîne, et la conversion en `ObjectId` n'a lieu
 * qu'au moment de filtrer sur `_id`. Mélanger les deux produirait un filtre
 * qui ne rejette rien, en silence : exactement le genre de panne qu'on ne
 * voit jamais.
 */

export type Blocages = {
  /** À exclure d'un filtre sur `_id`. */
  ids: mongoose.Types.ObjectId[];
  /** Les mêmes, en chaînes, pour un test d'appartenance direct. */
  chaines: Set<string>;
};

const AUCUN: Blocages = { ids: [], chaines: new Set() };

/** Convertit en `ObjectId` ce qui en est un, et ignore le reste. */
function versObjectId(valeur: unknown): mongoose.Types.ObjectId | null {
  const texte = String(valeur ?? "");
  return mongoose.Types.ObjectId.isValid(texte)
    ? new mongoose.Types.ObjectId(texte)
    : null;
}

/**
 * Tous les membres invisibles pour celui-ci : ceux qu'il a bloqués, et
 * ceux qui l'ont bloqué.
 *
 * Deux lectures, dont une sur l'index `blockedUsers`. En cas de panne de
 * base, renvoie un ensemble vide plutôt que de faire échouer la page —
 * mais le choix est délibérément consigné ici : un blocage qui disparaît
 * silencieusement vaut mieux qu'une page blanche, à condition que ce soit
 * écrit quelque part.
 */
export async function blocagesDe(utilisateurId: unknown): Promise<Blocages> {
  const moi = String(utilisateurId ?? "");
  if (!mongoose.Types.ObjectId.isValid(moi)) return AUCUN;

  try {
    const [monProfil, mOntBloque] = await Promise.all([
      User.findById(moi).select("blockedUsers").lean(),
      User.find({ blockedUsers: moi }).select("_id").lean(),
    ]);

    const chaines = new Set<string>();

    for (const bloque of (monProfil?.blockedUsers ?? []) as unknown[]) {
      const texte = String(bloque ?? "");
      if (texte) chaines.add(texte);
    }

    for (const ligne of mOntBloque as Array<{ _id: unknown }>) {
      chaines.add(String(ligne._id));
    }

    const ids = [...chaines]
      .map(versObjectId)
      .filter((id): id is mongoose.Types.ObjectId => id !== null);

    return { ids, chaines };
  } catch (erreur) {
    console.error("Lecture des blocages impossible :", erreur);
    return AUCUN;
  }
}

/**
 * Y a-t-il un blocage entre ces deux membres, dans un sens ou dans l'autre ?
 *
 * Pour les routes qui ne manipulent qu'un seul vis-à-vis — ouvrir un profil,
 * envoyer un message, poser un like — où charger tous les blocages serait
 * disproportionné.
 */
export async function blocageEntre(
  unId: unknown,
  autreId: unknown
): Promise<boolean> {
  const a = String(unId ?? "");
  const b = String(autreId ?? "");

  if (!mongoose.Types.ObjectId.isValid(a)) return false;
  if (!mongoose.Types.ObjectId.isValid(b)) return false;
  if (a === b) return false;

  try {
    const existe = await User.exists({
      $or: [
        { _id: a, blockedUsers: b },
        { _id: b, blockedUsers: a },
      ],
    });

    return Boolean(existe);
  } catch (erreur) {
    console.error("Vérification de blocage impossible :", erreur);
    return false;
  }
}

/** Le filtre Mongo à fusionner dans une requête sur `_id`. */
export function exclusion(blocages: Blocages): Record<string, unknown> {
  return blocages.ids.length ? { $nin: blocages.ids } : {};
}
