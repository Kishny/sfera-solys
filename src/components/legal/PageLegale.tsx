'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

/**
 * Coquille commune aux pages légales — direction A.
 *
 * Les quatre pages légales (conditions, confidentialité, cookies,
 * accessibilité) répétaient chacune leur propre en-tête, leur propre
 * accordéon et leur propre pied de page, pour un total de 1 516 lignes dont
 * l'essentiel était de la mise en page dupliquée. Le texte juridique, lui,
 * vivait déjà dans des tableaux de données : il est repris **tel quel**, ce
 * qui garantit qu'aucune migration visuelle ne modifie la lettre d'un
 * document qui engage.
 *
 * Sur mobile, chaque section est repliée ; à partir de `sm`, tout est
 * déplié en permanence. Le contenu reste dans le DOM dans les deux cas —
 * une page légale doit être lisible par un lecteur d'écran et indexable,
 * même repliée.
 */

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss';

export type SectionLegale = {
  id: string;
  titre: string;
  resume?: string;
  contenu: React.ReactNode;
};

export default function PageLegale({
  badge,
  titre,
  chapeau,
  miseAJour,
  sections,
  avertissement,
  apres,
}: {
  badge: string;
  titre: string;
  chapeau: string;
  /** Date de dernière révision, affichée telle quelle. */
  miseAJour?: string;
  sections: SectionLegale[];
  /** Encart d'alerte affiché avant les sections (ex. document à relire). */
  avertissement?: React.ReactNode;
  /** Contenu libre inséré après les sections. */
  apres?: React.ReactNode;
}) {
  const [ouverte, setOuverte] = useState<string | null>(sections[0]?.id ?? null);

  return (
    <>
      <Header />

      <main id="contenu" className="bg-abyss text-cream">
        {/* En-tête */}
        <section className="border-b border-cream/8 px-4 pt-20 sm:px-6 sm:pt-24 lg:px-16 xl:pt-28">
          <div className="mx-auto max-w-3xl py-12 text-center sm:py-16">
            <span className="inline-block rounded-full border border-orange/35 bg-orange/[0.12] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-cream">
              {badge}
            </span>

            <h1 className="font-display [font-stretch:125%] mt-5 text-[28px] font-extrabold leading-[1.15] tracking-tight text-cream sm:text-[38px]">
              {titre}
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-cream/70">
              {chapeau}
            </p>

            {miseAJour && (
              <p className="mt-4 text-[12px] text-cream/55">
                Dernière mise à jour : {miseAJour}
              </p>
            )}
          </div>
        </section>

        {/* Sections */}
        <section className="border-b border-cream/8 px-4 py-12 sm:px-6 sm:py-16 lg:px-16">
          <div className="mx-auto max-w-3xl">
            {avertissement}

            <div className="space-y-3">
              {sections.map((section) => {
                const estOuverte = ouverte === section.id;

                return (
                  <article
                    key={section.id}
                    className="overflow-hidden rounded-2xl border border-cream/10 bg-[#123243]"
                  >
                    <h2>
                      <button
                        type="button"
                        onClick={() => setOuverte(estOuverte ? null : section.id)}
                        aria-expanded={estOuverte}
                        aria-controls={`section-${section.id}`}
                        className={`flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-cream/[0.03] sm:px-6 sm:py-5 ${focusRing}`}
                      >
                        <span className="min-w-0">
                          <span className="font-display [font-stretch:125%] block text-[16px] font-bold text-cream sm:text-[17px]">
                            {section.titre}
                          </span>
                          {section.resume && (
                            <span className="mt-1 block text-[13px] leading-relaxed text-cream/55">
                              {section.resume}
                            </span>
                          )}
                        </span>

                        <ChevronDown
                          size={17}
                          aria-hidden="true"
                          className={`mt-0.5 shrink-0 text-cream/60 transition-transform sm:hidden ${
                            estOuverte ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </h2>

                    <div
                      id={`section-${section.id}`}
                      className={`grid transition-[grid-template-rows] duration-300 sm:!grid-rows-[1fr] ${
                        estOuverte ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="space-y-3 px-5 pb-5 text-[14px] leading-relaxed text-cream/70 sm:px-6 sm:pb-6 [&_a]:text-orange [&_a]:underline [&_a]:underline-offset-2 [&_li]:ml-4 [&_li]:list-disc [&_strong]:text-cream">
                          {section.contenu}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {apres}
          </div>
        </section>

        {/* Renvois vers les autres pages légales */}
        <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-16">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[13px]">
            {[
              { href: '/conditions', label: "Conditions d'utilisation" },
              { href: '/confidentialite', label: 'Confidentialité' },
              { href: '/cookies', label: 'Cookies' },
              { href: '/accessibilite', label: 'Accessibilité' },
              { href: '/contact', label: 'Nous écrire' },
            ].map((lien) => (
              <Link
                key={lien.href}
                href={lien.href}
                className={`fx-link font-semibold text-cream/60 transition-colors hover:text-orange ${focusRing}`}
              >
                {lien.label}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
