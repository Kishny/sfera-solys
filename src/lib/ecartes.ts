// src/lib/ecartes.ts

import mongoose from "mongoose";

import { User } from "@/models/User";

/**
 * Profils écartés — le bouton « Passer » de la fiche de profil.
 *
 * ## Pourquoi ce n'est pas `lib/blocages.ts`
 *
 * Les deux listes se ressemblent et ne font pas du tout la même chose.
 *
 * Un **blocage** vaut dans les deux sens et masque partout : annuaire,
 * Circle, matchs, messagerie, Communauté, Entraide. Il rompt le lien, et
 * c'est son objet.
 *
 * Un **écartement** est unilatéral et ne touche que la découverte. Il dit
 * « ne me propose plus ce profil », pas « cette personne n'existe plus » :
 * un match déjà noué et sa conversation restent intacts, et la personne
 * écartée ne voit aucune différence. Les confondre reviendrait à rompre des
 * liens existants sur un simple « Passer », geste bien plus léger qu'un
 * blocage.
 *
 * ## Forme des identifiants
 *
 * `profilsEcartes` est déclaré `[String]`, comme `blockedUsers` : la route
 * y pousse l'identifiant reçu en JSON. La conversion en `ObjectId` n'a donc
 * lieu qu'au moment de filtrer sur `_id`.
 */

export type Ecartes = {
  /** À exclure d'un filtre sur `_id`. */
  ids: mongoose.Types.ObjectId[];
};

const AUCUN: Ecartes = { ids: [] };

/**
 * Les profils que ce membre a écartés.
 *
 * Une seule lecture, sur la clé primaire. En cas de panne de base, renvoie
 * un ensemble vide plutôt que de faire échouer la page : un profil écarté
 * qui réapparaît est un désagrément, une page blanche en est un autre.
 */
export async function ecartesDe(utilisateurId: unknown): Promise<Ecartes> {
  const moi = String(utilisateurId ?? "");
  if (!mongoose.Types.ObjectId.isValid(moi)) return AUCUN;

  try {
    const profil = await User.findById(moi).select("profilsEcartes").lean();

    const ids = ((profil?.profilsEcartes ?? []) as unknown[])
      .map((valeur) => String(valeur ?? ""))
      .filter((texte) => mongoose.Types.ObjectId.isValid(texte))
      .map((texte) => new mongoose.Types.ObjectId(texte));

    return { ids };
  } catch (erreur) {
    console.error("Lecture des profils écartés impossible :", erreur);
    return AUCUN;
  }
}
