// src/lib/configuration.ts

/**
 * Lecture des variables d'environnement des services tiers.
 *
 * ## Pourquoi ce module existe
 *
 * Chaque intégration avait sa propre garde, et toutes faisaient la même
 * erreur : vérifier qu'une variable est **présente**, pas qu'elle veut dire
 * quelque chose. `.env.local` livre les variables non encore renseignées
 * remplies avec `A_REMPLACER`. Elles passaient donc toutes les gardes.
 *
 * Ce que ça a coûté, en vrai, sur ce projet :
 *
 * - **Pusher** construisait un client avec `auth_key=A_REMPLACER`. Chaque
 *   match, chaque message et chaque accusé de lecture partait vers l'API pour
 *   en revenir en `400 auth_key should be a valid app key`, avec une trace
 *   d'exception complète à chaque fois.
 * - **Stripe** levait une exception à l'import si la clé manquait — message
 *   parlant de `.env.local`, ce qui n'a aucun sens sur Vercel — et se
 *   construisait sans broncher si la clé valait `A_REMPLACER`.
 *
 * Un placeholder n'est pas une configuration. Une variable absente non plus
 * ne doit pas faire tomber le build : un service tiers non configuré est un
 * service indisponible, pas une application cassée.
 */

/** Valeur que `.env.local` utilise pour les variables non encore remplies. */
export const A_REMPLIR = "A_REMPLACER";

/**
 * Renvoie la valeur de la variable, ou `null` si elle est absente, vide ou
 * encore à remplir.
 */
export function lireVariable(nom: string): string | null {
  const valeur = process.env[nom]?.trim();

  if (!valeur || valeur === A_REMPLIR) return null;

  return valeur;
}

/** Vrai si toutes les variables citées sont réellement renseignées. */
export function variablesPretes(...noms: string[]): boolean {
  return noms.every((nom) => lireVariable(nom) !== null);
}

const dejaSignales = new Set<string>();

/**
 * Signale une fois — et une seule par démarrage du serveur — qu'un service
 * n'est pas configuré. Sans ça, un service manquant remplit le journal d'une
 * ligne par évènement et noie ce qui mérite d'être lu.
 */
export function signalerAbsence(service: string, consequence: string) {
  if (dejaSignales.has(service)) return;

  dejaSignales.add(service);
  console.info(`${service} n'est pas configuré : ${consequence}`);
}

/**
 * Adresse publique du site, normalisée.
 *
 * ## Ce que cette fonction évite
 *
 * `layout.tsx` faisait `metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL)`.
 * Next évalue cette expression en collectant la configuration de **chaque**
 * page, y compris `/_not-found` : une valeur sans schéma — `mon-site.vercel.app`
 * au lieu de `https://mon-site.vercel.app` — lève `ERR_INVALID_URL` et **fait
 * échouer le déploiement entier**. C'est arrivé au deuxième essai, avec en
 * prime une valeur masquée dans le journal (`input: '[REDACTED]'`), parce que
 * la variable avait été marquée « Secret » côté Vercel : l'erreur ne disait
 * même pas quelle adresse posait problème.
 *
 * Une adresse mal formée est une erreur de configuration, pas une raison de ne
 * pas livrer le site. On prévient, et on retombe sur le repli.
 *
 * Quatre fichiers lisaient cette variable chacun de son côté, avec **deux
 * replis différents** (`sferasolys.fr` dans `layout.tsx`, `sferasolys.com`
 * ailleurs) : le site pouvait donc se décrire sous deux domaines selon la
 * balise. Un seul endroit désormais.
 */
const REPLI_URL = "https://sferasolys.com";

function normaliserUrl(valeur: string | null): string {
  if (!valeur) return REPLI_URL;

  try {
    // `new URL` exige un schéma ; c'est précisément ce qui manquait.
    const url = new URL(valeur);
    return url.origin;
  } catch {
    console.warn(
      `NEXT_PUBLIC_APP_URL n'est pas une adresse valide (${valeur}) : il lui ` +
        `manque sans doute « https:// ». Repli sur ${REPLI_URL} — les URL ` +
        `canoniques, le sitemap et les balises de partage seront fausses tant ` +
        `que ce n'est pas corrigé.`
    );
    return REPLI_URL;
  }
}

/** Adresse publique du site, sans barre oblique finale. */
export const URL_SITE = normaliserUrl(lireVariable("NEXT_PUBLIC_APP_URL"));
