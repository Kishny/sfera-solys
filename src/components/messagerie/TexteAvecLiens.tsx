// src/components/messagerie/TexteAvecLiens.tsx

"use client";

/**
 * Le texte d'un message, avec ses adresses rendues cliquables.
 *
 * Le menu du trombone sait insérer un lien, mais le fil l'affichait en
 * texte brut : il fallait le sélectionner et le recopier. Un lien qu'on
 * ne peut pas suivre n'est pas un lien.
 *
 * TROIS PRÉCAUTIONS, ET POURQUOI
 *
 * 1. Le texte affiché est toujours l'adresse elle-même. C'est le point
 *    important : la tromperie classique consiste à écrire « notre
 *    banque » et à pointer ailleurs. Ici, ce qu'on lit est ce qu'on
 *    ouvre, et une adresse inattendue se voit avant le clic.
 *
 * 2. `noopener noreferrer` : sans ça, la page ouverte garde une prise
 *    sur l'onglet d'origine et peut le remplacer par une fausse page de
 *    connexion pendant qu'on regarde ailleurs.
 *
 * 3. `nofollow` : une messagerie privée n'a pas à distribuer de
 *    réputation aux sites qu'on y colle.
 *
 * Rien n'est injecté en HTML : le texte est découpé et rendu en
 * éléments React, qui échappent tout.
 */

interface TexteAvecLiensProps {
  texte: string;
  /** Vrai dans une bulle cuivrée : les couleurs s'inversent. */
  surFondClair: boolean;
}

/**
 * Repère les adresses.
 *
 * `www.` sans protocole est reconnu aussi : c'est la forme que les gens
 * collent le plus souvent.
 */
const ADRESSE = /\b(?:https?:\/\/|www\.)[^\s<>"'`]+/gi;

/**
 * La ponctuation finale n'appartient pas à l'adresse.
 *
 * « Regarde https://exemple.fr. » : le point termine la phrase, pas le
 * lien. Les parenthèses ne sont retirées que si elles ne sont pas
 * ouvertes dans l'adresse — certaines URL en contiennent.
 */
function detacherLaPonctuation(brut: string): {
  adresse: string;
  suite: string;
} {
  let adresse = brut;
  let suite = "";

  while (adresse.length > 1) {
    const dernier = adresse[adresse.length - 1];

    if (".,;:!?»".includes(dernier)) {
      suite = dernier + suite;
      adresse = adresse.slice(0, -1);
      continue;
    }

    if (dernier === ")" && !adresse.includes("(")) {
      suite = dernier + suite;
      adresse = adresse.slice(0, -1);
      continue;
    }

    break;
  }

  return { adresse, suite };
}

/** Ne laisse passer que http et https. */
function destination(adresse: string): string | null {
  const candidat = /^https?:\/\//i.test(adresse)
    ? adresse
    : `https://${adresse}`;

  try {
    const url = new URL(candidat);

    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;

    return url.toString();
  } catch {
    return null;
  }
}

export default function TexteAvecLiens({
  texte,
  surFondClair,
}: TexteAvecLiensProps) {
  const morceaux: React.ReactNode[] = [];

  let position = 0;
  let trouvaille: RegExpExecArray | null;

  // `exec` dans une boucle : l'expression porte le drapeau global, donc
  // elle garde sa position entre deux appels.
  ADRESSE.lastIndex = 0;

  while ((trouvaille = ADRESSE.exec(texte)) !== null) {
    const { adresse, suite } = detacherLaPonctuation(trouvaille[0]);
    const cible = destination(adresse);

    if (trouvaille.index > position) {
      morceaux.push(texte.slice(position, trouvaille.index));
    }

    if (cible) {
      morceaux.push(
        <a
          key={`${trouvaille.index}-${adresse}`}
          href={cible}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={`underline underline-offset-2 ${
            surFondClair
              ? "text-nuit hover:text-nuit/70"
              : "text-cuivre hover:text-cuivre/80"
          } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cuivre`}
        >
          {adresse}
        </a>
      );
    } else {
      // Pas une adresse exploitable : on laisse le texte tel quel.
      morceaux.push(adresse);
    }

    if (suite) morceaux.push(suite);

    position = trouvaille.index + trouvaille[0].length;
  }

  if (position < texte.length) morceaux.push(texte.slice(position));

  return <>{morceaux}</>;
}
