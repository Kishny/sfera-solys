import Link from 'next/link';
import { Lock } from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GrainOverlay from '@/components/brand/GrainOverlay';

/**
 * Plan du site.
 *
 * Construit à la main plutôt que généré : une génération automatique à
 * partir de `src/app` listerait aussi `/admin`, les routes d'API et les
 * segments dynamiques, et surtout elle ne saurait pas dire **lesquelles
 * demandent un compte** — ce qui est la seule information que cette page
 * apporte vraiment par rapport au menu.
 *
 * Contrepartie assumée : ajouter une route au site demande de l'ajouter
 * ici. Une page qui prétend recenser le site et en oublie la moitié vaut
 * moins que pas de page du tout.
 */

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70 focus-visible:ring-offset-2 focus-visible:ring-offset-nuit';

type Entree = { label: string; href: string; compte?: boolean };

const GROUPES: { titre: string; intro: string; entrees: Entree[] }[] = [
  {
    titre: 'Découvrir',
    intro: 'Ce qu’est Sfera’Solys, et comment ça fonctionne.',
    entrees: [
      { label: 'Accueil', href: '/' },
      { label: 'Notre histoire', href: '/histoire' },
      { label: 'Nos valeurs', href: '/valeurs' },
      { label: 'L’équipe', href: '/equipe' },
      { label: 'Les fonctionnalités', href: '/fonctionnalites' },
      { label: 'Le guide', href: '/guide' },
      { label: 'Témoignages', href: '/temoignages' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    titre: 'Commencer',
    intro: 'Créer un compte, se faire vérifier, choisir une offre.',
    entrees: [
      { label: 'Créer mon profil', href: '/commencer' },
      { label: 'Inscription', href: '/inscription' },
      { label: 'Connexion', href: '/auth?mode=login' },
      { label: 'Les offres', href: '/tarifs' },
    ],
  },
  {
    titre: 'L’espace membre',
    intro: 'Accessible une fois le compte créé.',
    entrees: [
      { label: 'Explorer des profils', href: '/explorer', compte: true },
      { label: 'Circle of Six', href: '/circle', compte: true },
      { label: 'Mes matchs', href: '/matches', compte: true },
      { label: 'Messages', href: '/messages', compte: true },
      { label: 'Événements', href: '/evenements', compte: true },
      { label: 'Entraide', href: '/entraide', compte: true },
      { label: 'Ma sphère', href: '/mon-compte', compte: true },
    ],
  },
  {
    titre: 'Aide',
    intro: 'Les réponses, et comment nous joindre.',
    entrees: [
      { label: 'Centre d’aide', href: '/aide' },
      { label: 'Questions fréquentes', href: '/faq' },
      { label: 'Nous écrire', href: '/contact' },
    ],
  },
  {
    titre: 'Légal',
    intro: 'Les documents de référence.',
    entrees: [
      { label: 'Mentions légales', href: '/mentions-legales' },
      { label: 'Politique de confidentialité', href: '/confidentialite' },
      { label: 'Conditions d’utilisation', href: '/conditions' },
      { label: 'Cookies', href: '/cookies' },
      { label: 'Gestion des données', href: '/gestion-donnees' },
      { label: 'Accessibilité', href: '/accessibilite' },
    ],
  },
];

export default function PlanDuSitePage() {
  return (
    <>
      <Header />
      <GrainOverlay />

      <main id="contenu" className="relative bg-nuit text-champagne">
        <section className="px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-surtitre text-champagne/60">
              <span aria-hidden="true" className="h-px w-8 bg-cuivre" />
              Plan du site
            </p>

            <h1 className="font-display mt-5 text-[34px] font-normal leading-tight tracking-tight text-ivoire sm:text-[44px]">
              Tout le site, sur une page.
            </h1>

            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-champagne/65 sm:text-base">
              Les pages marquées d&apos;un cadenas demandent un compte. Toutes
              les autres sont libres d&apos;accès.
            </p>

            <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
              {GROUPES.map((groupe) => (
                <nav key={groupe.titre} aria-label={groupe.titre}>
                  <h2 className="font-display text-[20px] font-normal text-ivoire">
                    {groupe.titre}
                  </h2>

                  <p className="mt-1.5 text-[13px] leading-relaxed text-champagne/55">
                    {groupe.intro}
                  </p>

                  <span
                    aria-hidden="true"
                    className="mt-4 block h-px w-10 bg-cuivre"
                  />

                  <ul className="mt-5 space-y-3">
                    {groupe.entrees.map((entree) => (
                      <li key={entree.href}>
                        <Link
                          href={entree.href}
                          className={`inline-flex items-center gap-2 text-[14px] text-champagne/70 transition-colors hover:text-ivoire ${focusRing}`}
                        >
                          {entree.label}
                          {entree.compte && (
                            <>
                              <Lock
                                size={11}
                                aria-hidden="true"
                                className="shrink-0 text-champagne/40"
                              />
                              <span className="sr-only">
                                — nécessite un compte
                              </span>
                            </>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
