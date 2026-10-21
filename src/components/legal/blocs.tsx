'use client';

import { Info } from 'lucide-react';

import { type IconeMarque } from '@/components/brand/mise-en-page';

/**
 * Les blocs de présentation du centre légal.
 *
 * ## Pourquoi des résumés au-dessus du texte intégral
 *
 * Les maquettes posent, avant les articles, un bandeau d'avertissement,
 * une rangée de cartes « l'essentiel en un regard » et une grille
 * numérotée reprenant chaque article en une phrase.
 *
 * Ces blocs ne remplacent pas le texte juridique : la maquette des
 * conditions le dit elle-même, « le texte intégral doit rester
 * accessible ». Chaque carte numérotée est donc un **lien vers l'ancre de
 * son article**, qui reste écrit en entier plus bas. Résumer un document
 * qui engage sans donner accès à sa lettre serait le vider.
 *
 * ## Ce que ces blocs ne font pas
 *
 * Ils ne contiennent aucune information qui ne soit pas déjà dans les
 * articles. Un résumé qui ajouterait une obligation ou une garantie
 * absente du texte créerait deux versions du même document — et ce serait
 * la plus courte que les gens liraient.
 */

/** Bandeau d'avertissement, en tête de colonne. */
export function AvertissementLegal({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="note"
      className="flex items-start gap-3.5 rounded-2xl border border-cuivre/40 bg-cuivre/[0.07] px-5 py-4"
    >
      <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-cuivre" />

      <p className="text-[13px] leading-relaxed text-champagne/85">
        <span className="font-semibold text-champagne">{titre}</span>{' '}
        {children}
      </p>
    </div>
  );
}

/** Rangée de cartes illustrées — « L'essentiel en un regard ». */
export function CartesResume({
  titre,
  cartes,
}: {
  titre: string;
  cartes: Array<{ icone: IconeMarque; titre: string; texte: string }>;
}) {
  return (
    <section className="rounded-2xl border border-champagne/12 bg-minuit/70 p-5 sm:p-7">
      <h2 className="font-display text-[22px] font-normal leading-snug text-ivoire sm:text-[26px]">
        {titre}
      </h2>

      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {cartes.map(({ icone: Icone, titre: t, texte }) => (
          <li
            key={t}
            className="flex h-full flex-col rounded-xl border border-champagne/15 bg-nuit/40 p-4 sm:p-5"
          >
            <span
              aria-hidden="true"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-cuivre/40 bg-nuit/60 text-cuivre"
            >
              <Icone size={18} />
            </span>

            <h3 className="font-display mt-4 text-[17px] font-normal leading-snug text-ivoire">
              {t}
            </h3>

            <p className="mt-2 text-[12.5px] leading-relaxed text-champagne/80">
              {texte}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Grille numérotée.
 *
 * `ancre` est facultative : les mentions légales résument des champs à
 * compléter, qui n'ont pas d'article correspondant. Quand elle existe, la
 * carte devient un lien et mène au texte intégral.
 */
export function GrilleNumerotee({
  titre,
  intro,
  items,
}: {
  titre: string;
  intro?: string;
  items: Array<{ titre: string; texte: string; ancre?: string }>;
}) {
  return (
    <section className="rounded-2xl border border-champagne/12 bg-minuit/70 p-5 sm:p-7">
      <h2 className="font-display text-[22px] font-normal leading-snug text-ivoire sm:text-[26px]">
        {titre}
      </h2>

      {intro && (
        <p className="mt-2.5 text-[13px] leading-relaxed text-champagne/75">
          {intro}
        </p>
      )}

      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {items.map((item, index) => {
          const numero = String(index + 1).padStart(2, '0');

          const contenu = (
            <>
              <h3 className="flex items-baseline gap-2.5 text-[14.5px] font-semibold text-champagne">
                <span
                  aria-hidden="true"
                  className="font-display text-[12px] text-cuivre"
                >
                  {numero}
                </span>
                {item.titre}
              </h3>

              <p className="mt-1.5 text-[12.5px] leading-relaxed text-champagne/75">
                {item.texte}
              </p>
            </>
          );

          const classes =
            'block h-full rounded-xl border border-champagne/15 bg-nuit/40 p-4 transition-colors';

          return (
            <li key={item.titre} className="h-full">
              {item.ancre ? (
                <a
                  href={`#${item.ancre}`}
                  className={`${classes} hover:border-cuivre/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70 focus-visible:ring-offset-2 focus-visible:ring-offset-nuit`}
                >
                  {contenu}
                  <span className="mt-2 block text-[11.5px] font-semibold text-cuivre">
                    Lire l’article
                  </span>
                </a>
              ) : (
                <div className={classes}>{contenu}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Liste de règles, chacune marquée d'une pastille. */
export function ListeRegles({
  titre,
  regles,
  mention = 'Requis',
}: {
  titre: string;
  regles: string[];
  mention?: string;
}) {
  return (
    <section className="rounded-2xl border border-champagne/12 bg-minuit/70 p-5 sm:p-7">
      <h2 className="font-display text-[22px] font-normal leading-snug text-ivoire sm:text-[26px]">
        {titre}
      </h2>

      <ul className="mt-5 space-y-2.5">
        {regles.map((regle) => (
          <li
            key={regle}
            className="flex items-center justify-between gap-4 rounded-xl border border-champagne/15 bg-nuit/40 px-4 py-3.5"
          >
            <span className="text-[13.5px] font-semibold text-champagne">
              {regle}
            </span>

            <span className="shrink-0 rounded-full border border-cuivre/45 px-3 py-1 text-[11.5px] font-semibold text-cuivre">
              {mention}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Liste de prestataires, en ligne, telle que la dessine la maquette. */
export function ListePrestataires({
  titre,
  prestataires,
  note,
}: {
  titre: string;
  prestataires: Array<{ nom: string; role: string }>;
  note?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-champagne/12 bg-minuit/70 p-5 sm:p-7">
      <h2 className="font-display text-[22px] font-normal leading-snug text-ivoire sm:text-[26px]">
        {titre}
      </h2>

      <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
        {prestataires.map(({ nom, role }) => (
          <li key={nom} className="text-[13px] text-champagne/80">
            <span className="font-semibold text-champagne">{nom}</span>
            <span aria-hidden="true" className="px-1.5 text-champagne/45">
              ·
            </span>
            {role}
          </li>
        ))}
      </ul>

      {note && (
        <p className="mt-5 text-[12.5px] leading-relaxed text-champagne/75">
          {note}
        </p>
      )}
    </section>
  );
}
