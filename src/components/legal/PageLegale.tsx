'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Cookie, FileText, Home, Scale, ShieldCheck } from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Surtitre,
  focusRing,
  premierBloc,
  sectionY,
  type IconeMarque,
} from '@/components/brand/mise-en-page';

/**
 * Coquille commune aux pages légales — direction « nuit cuivrée ».
 *
 * ## Ce que la refonte change
 *
 * Les six documents partageaient déjà cette coquille : un en-tête centré,
 * un accordéon, un pied de page. La maquette en fait un **centre légal** —
 * héros photographique, fil d'Ariane, barre d'onglets entre les documents,
 * sommaire ancré à gauche, sections en cartes ouvertes.
 *
 * Trois conséquences qui ne sont pas cosmétiques :
 *
 * 1. **Les sections ne sont plus repliées.** Un document qui engage se lit
 *    et s'imprime ; le repli ne servait que le confort visuel, et il
 *    obligeait à cliquer pour accéder à une clause. Le sommaire remplace
 *    l'accordéon pour la navigation.
 * 2. **Les six documents se rejoignent.** Jusqu'ici, passer des cookies aux
 *    conditions supposait de redescendre au pied de page. La barre
 *    d'onglets les relie entre eux.
 * 3. **Le texte juridique n'est pas touché.** Il vit dans les tableaux de
 *    chaque page et est repris tel quel, comme à chaque migration de cette
 *    coquille.
 *
 * ## Le sommaire suit la lecture
 *
 * L'entrée active est déterminée par un `IntersectionObserver` sur les
 * sections, pas par le clic : quelqu'un qui fait défiler sans cliquer voit
 * quand même où il en est. La marge haute de l'observateur tient compte de
 * l'en-tête fixe, sinon la section passant sous le bandeau serait comptée
 * comme visible.
 */

export type SectionLegale = {
  id: string;
  titre: string;
  resume?: string;
  contenu: React.ReactNode;
  /** Pictogramme posé à droite du titre, comme la maquette. */
  icone?: IconeMarque;
  /**
   * Rend le contenu sans la carte ni le titre de la coquille.
   *
   * Sert au panneau de préférences des cookies, que la maquette dessine en
   * champagne plein à la place d'une carte sombre. Le titre reste dans le
   * sommaire, et la section garde son ancre.
   */
  nu?: boolean;
};

/**
 * Les documents du centre légal.
 *
 * Les six y figurent, et pas seulement les quatre de la maquette :
 * /accessibilite et /gestion-donnees emploient la même coquille, et une
 * barre qui les afficherait sans onglet actif serait pire qu'une barre un
 * peu plus longue. Elle défile horizontalement quand elle ne tient pas.
 */
const DOCUMENTS: Array<{ href: string; label: string; icone: IconeMarque }> = [
  { href: '/cookies', label: 'Cookies', icone: Cookie },
  { href: '/confidentialite', label: 'Confidentialité', icone: ShieldCheck },
  { href: '/conditions', label: "Conditions d'utilisation", icone: FileText },
  { href: '/mentions-legales', label: 'Mentions légales', icone: Scale },
  { href: '/accessibilite', label: 'Accessibilité', icone: Home },
  { href: '/gestion-donnees', label: 'Données', icone: ShieldCheck },
];

export default function PageLegale({
  badge,
  titre,
  titreAccent,
  chapeau,
  accroche,
  miseAJour,
  sections,
  avertissement,
  apres,
  photo = '/visuels/solys-04.webp',
  photoAlt = 'Une terrasse éclairée à la bougie, l’éclipse au-dessus de la ville.',
  encartSommaire,
}: {
  badge: string;
  titre: string;
  /** Seconde ligne du titre, en italique cuivré. */
  titreAccent?: string;
  chapeau: string;
  /** Phrase en gras entre le titre et le chapeau. */
  accroche?: string;
  miseAJour?: string;
  sections: SectionLegale[];
  avertissement?: React.ReactNode;
  apres?: React.ReactNode;
  photo?: string;
  photoAlt?: string;
  /** Encart illustré sous le sommaire. */
  encartSommaire?: { image: string; titre: string; texte: string };
}) {
  const pathname = usePathname();
  const [active, setActive] = useState<string | null>(sections[0]?.id ?? null);

  useEffect(() => {
    const cibles = sections
      .map((s) => document.getElementById(s.id))
      .filter((n): n is HTMLElement => n !== null);

    if (cibles.length === 0) return;

    const observateur = new IntersectionObserver(
      (entrees) => {
        const visible = entrees
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (visible) setActive(visible.target.id);
      },
      // La marge haute vaut la hauteur de l'en-tête fixe, plus une respiration.
      { rootMargin: '-120px 0px -55% 0px', threshold: 0 }
    );

    cibles.forEach((c) => observateur.observe(c));
    return () => observateur.disconnect();
  }, [sections]);

  return (
    <>
      <Header />

      <main id="contenu" className="bg-nuit text-champagne">
        {/* Héros */}
        <section className="relative isolate overflow-hidden px-4 sm:px-6 lg:px-16">
          <div className="absolute inset-0 -z-20 lg:left-[45%]">
            <Image
              src={photo}
              alt={photoAlt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-center"
            />

            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-nuit via-nuit/93 to-nuit/75 lg:bg-gradient-to-r lg:from-nuit lg:via-nuit/30 lg:to-transparent"
            />

            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-nuit to-transparent"
            />
          </div>

          <div className={`relative mx-auto max-w-7xl pb-12 sm:pb-14 ${premierBloc}`}>
            <div className="max-w-xl">
              <Surtitre>{badge}</Surtitre>

              <h1 className="font-display mt-6 text-[32px] font-normal leading-[1.08] tracking-tight text-ivoire sm:text-[44px]">
                {titre}
                {titreAccent && (
                  <>
                    <br />
                    <span className="italic text-cuivre">{titreAccent}</span>
                  </>
                )}
              </h1>

              {accroche && (
                <p className="mt-5 text-[15px] font-semibold leading-snug text-champagne sm:text-[17px]">
                  {accroche}
                </p>
              )}

              <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-champagne/80 sm:text-[14.5px]">
                {chapeau}
              </p>
            </div>
          </div>
        </section>

        {/* Fil d'Ariane et date */}
        <div className="border-y border-champagne/12 bg-minuit/50 px-4 sm:px-6 lg:px-16">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <nav aria-label="Fil d’Ariane">
              <ol className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-champagne/75">
                <li>
                  <Link
                    href="/"
                    className={`inline-flex items-center gap-1.5 transition-colors hover:text-champagne ${focusRing}`}
                  >
                    <Home size={13} aria-hidden="true" />
                    Accueil
                  </Link>
                </li>

                <ChevronRight size={13} aria-hidden="true" className="text-champagne/45" />
                <li>Légal</li>

                <ChevronRight size={13} aria-hidden="true" className="text-champagne/45" />
                <li aria-current="page" className="font-semibold text-cuivre">
                  {DOCUMENTS.find((d) => d.href === pathname)?.label ?? badge}
                </li>
              </ol>
            </nav>

            {miseAJour && (
              <p className="text-[12.5px] text-champagne/75">
                Dernière mise à jour&nbsp;: {miseAJour}
              </p>
            )}
          </div>
        </div>

        {/* Les documents du centre légal */}
        <nav
          aria-label="Documents légaux"
          className="px-4 pt-6 sm:px-6 lg:px-16"
        >
          <ul className="mx-auto flex max-w-7xl gap-2 overflow-x-auto pb-1">
            {DOCUMENTS.map(({ href, label, icone: Icone }) => {
              const courant = pathname === href;

              return (
                <li key={href} className="shrink-0">
                  <Link
                    href={href}
                    aria-current={courant ? 'page' : undefined}
                    className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-[13px] font-semibold transition-colors ${focusRing} ${
                      courant
                        ? 'border-transparent bg-degrade-cuivre text-nuit'
                        : 'border-champagne/12 bg-minuit/70 text-champagne/85 hover:border-cuivre/45'
                    }`}
                  >
                    <Icone size={16} aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sommaire et sections */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:gap-6">
            {/* Sommaire */}
            <aside className="lg:sticky lg:top-28 lg:self-start xl:top-32">
              <div className="rounded-2xl border border-champagne/12 bg-minuit/70 p-5 sm:p-6">
                <h2 className="font-display text-[20px] font-normal leading-tight text-ivoire">
                  Sommaire
                </h2>

                <ol className="mt-5 space-y-3">
                  {sections.map((section) => {
                    const courante = active === section.id;

                    return (
                      <li key={section.id} className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className={`mt-[5px] h-2 w-2 shrink-0 rounded-full border transition-colors ${
                            courante
                              ? 'border-cuivre bg-cuivre'
                              : 'border-champagne/45 bg-transparent'
                          }`}
                        />

                        <a
                          href={`#${section.id}`}
                          aria-current={courante ? 'true' : undefined}
                          className={`text-[13px] leading-snug transition-colors ${focusRing} ${
                            courante
                              ? 'font-semibold text-cuivre'
                              : 'text-champagne/80 hover:text-champagne'
                          }`}
                        >
                          {section.titre}
                        </a>
                      </li>
                    );
                  })}
                </ol>

                {encartSommaire && (
                  <div className="mt-6 overflow-hidden rounded-xl border border-champagne/12">
                    <div className="relative aspect-[16/10] w-full">
                      <Image
                        src={encartSommaire.image}
                        alt=""
                        fill
                        sizes="260px"
                        className="object-cover object-center"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-minuit via-transparent to-transparent"
                      />
                    </div>

                    <div className="bg-minuit/80 p-4">
                      <h3 className="font-display text-[15px] font-normal text-ivoire">
                        {encartSommaire.titre}
                      </h3>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-champagne/75">
                        {encartSommaire.texte}
                      </p>
                      <span
                        aria-hidden="true"
                        className="mt-3 block h-px w-10 bg-cuivre"
                      />
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* Les sections */}
            <div className="space-y-4">
              {avertissement}

              {sections.map((section) => {
                const Icone = section.icone;

                if (section.nu) {
                  return (
                    <div
                      key={section.id}
                      id={section.id}
                      className="scroll-mt-28 xl:scroll-mt-32"
                    >
                      {section.contenu}
                    </div>
                  );
                }

                return (
                  <article
                    key={section.id}
                    id={section.id}
                    className="scroll-mt-28 rounded-2xl border border-champagne/12 bg-minuit/70 p-5 sm:p-7 xl:scroll-mt-32"
                  >
                    <div className="flex items-start justify-between gap-5">
                      <div className="min-w-0">
                        <h2 className="font-display text-[22px] font-normal leading-snug text-ivoire sm:text-[26px]">
                          {section.titre}
                        </h2>

                        {section.resume && (
                          <p className="mt-2 text-[13px] leading-relaxed text-champagne/75">
                            {section.resume}
                          </p>
                        )}
                      </div>

                      {Icone && (
                        <span
                          aria-hidden="true"
                          className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-full border border-cuivre/35 bg-nuit/60 text-cuivre sm:flex"
                        >
                          <Icone size={22} />
                        </span>
                      )}
                    </div>

                    {/*
                      `prose-invert` cadre les paragraphes, listes et liens du
                      texte juridique sans qu'aucune page ait à styler les
                      siens. Les couleurs sont forcées sur la charte : les
                      valeurs par défaut du greffon sont grises.
                    */}
                    <div className="prose prose-invert mt-5 max-w-none text-[13.5px] leading-relaxed text-champagne/85 prose-headings:font-display prose-headings:font-normal prose-headings:text-ivoire prose-p:text-champagne/85 prose-a:text-cuivre prose-strong:text-champagne prose-li:text-champagne/85">
                      {section.contenu}
                    </div>
                  </article>
                );
              })}

              {apres}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
