import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GrainOverlay from '@/components/brand/GrainOverlay';
import NewsletterSignup from '@/components/NewsletterSignup';

/**
 * Le blog.
 *
 * La route existe désormais : le pied de page y renvoie, et un lien de pied
 * de page qui tombe en 404 est pire qu'un blog vide.
 *
 * **Il n'y a aucun article, et la page le dit.** L'alternative aurait été
 * d'écrire deux ou trois billets pour meubler — c'est-à-dire de publier au
 * nom de la marque des textes que personne n'a relus ni voulus. Un état
 * vide honnête se répare en ajoutant un article ; un faux article se répare
 * en le retirant, après que des gens l'ont lu.
 *
 * ## Ajouter un article
 *
 * Remplir `ARTICLES` ci-dessous, puis créer `src/app/blog/[slug]/page.tsx`
 * pour le contenu. Le tri se fait sur `date`, au format ISO, du plus récent
 * au plus ancien. Aucune dépendance n'est nécessaire tant que les articles
 * restent peu nombreux ; au-delà d'une dizaine, passer à des fichiers
 * Markdown avec métadonnées sera plus confortable que ce tableau.
 */

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70 focus-visible:ring-offset-2 focus-visible:ring-offset-nuit';

type Article = {
  slug: string;
  titre: string;
  resume: string;
  /** Format ISO, par exemple 2026-11-04. */
  date: string;
  minutes: number;
};

const ARTICLES: Article[] = [];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function BlogPage() {
  const articles = [...ARTICLES].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <Header />
      <GrainOverlay />

      <main id="contenu" className="relative bg-nuit text-champagne">
        <section className="px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-surtitre text-champagne/60">
              <span aria-hidden="true" className="h-px w-8 bg-cuivre" />
              Le blog
            </p>

            <h1 className="font-display mt-5 text-[34px] font-normal leading-tight tracking-tight text-ivoire sm:text-[44px]">
              Ce qu&apos;on a à dire.
            </h1>

            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-champagne/65 sm:text-base">
              Sur la rencontre à partir de 28 ans, la vérification d&apos;
              identité, et ce qu&apos;on apprend en construisant une plateforme
              qui refuse le défilement infini.
            </p>

            {articles.length > 0 ? (
              <ul className="mt-12 grid gap-5 lg:grid-cols-2">
                {articles.map((article) => (
                  <li key={article.slug}>
                    <Link
                      href={`/blog/${article.slug}`}
                      className={`group flex h-full flex-col rounded-2xl border border-cuivre/15 bg-minuit p-6 transition-colors hover:border-cuivre/45 ${focusRing}`}
                    >
                      <span className="text-[11px] uppercase tracking-surtitre text-champagne/55">
                        <time dateTime={article.date}>
                          {formatDate(article.date)}
                        </time>
                        {' · '}
                        {article.minutes} min de lecture
                      </span>

                      <span className="font-display mt-4 text-[22px] font-normal leading-snug text-ivoire">
                        {article.titre}
                      </span>

                      <span className="mt-3 flex-1 text-[14px] leading-relaxed text-champagne/65">
                        {article.resume}
                      </span>

                      <span className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-cuivre transition-colors group-hover:text-champagne">
                        Lire
                        <ArrowRight size={13} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              /*
                État vide. Il dit franchement qu'il n'y a rien plutôt que de
                promettre « bientôt », et propose la seule action qui ait du
                sens à cet instant : être prévenu du premier article.
              */
              <div className="mt-12 rounded-2xl border border-cuivre/15 bg-minuit p-8 sm:p-10">
                <h2 className="font-display text-[22px] font-normal leading-snug text-ivoire">
                  Le premier article n&apos;est pas encore écrit.
                </h2>

                <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-champagne/65">
                  Plutôt que de remplir cette page pour qu&apos;elle ait
                  l&apos;air vivante, elle attend d&apos;avoir quelque chose à
                  dire. Laisse ton adresse si tu veux être prévenu quand ce
                  sera le cas.
                </p>

                <div className="mt-6 max-w-md">
                  <NewsletterSignup variant="dark" />
                </div>

                <p className="mt-6 text-[13px] text-champagne/55">
                  En attendant, le{' '}
                  <Link
                    href="/guide"
                    className={`text-cuivre underline transition-colors hover:text-champagne ${focusRing}`}
                  >
                    guide
                  </Link>{' '}
                  et{' '}
                  <Link
                    href="/histoire"
                    className={`text-cuivre underline transition-colors hover:text-champagne ${focusRing}`}
                  >
                    notre histoire
                  </Link>{' '}
                  racontent déjà l&apos;essentiel.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
