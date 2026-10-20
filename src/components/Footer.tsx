'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Mail,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  ShieldCheck,
  Users,
  Gem,
  Globe,
  ChevronDown,
  Smartphone,
} from 'lucide-react';

import NewsletterSignup from '@/components/NewsletterSignup';
import { Logo } from '@/components/ui/Logo';

/**
 * Pied de page Sfera'Solys, d'après la maquette « nuit cuivrée ».
 *
 * ## Ce qui remplace quoi
 *
 * L'ancien pied de page datait de SferaLuna : pictogrammes emoji en tête de
 * colonne, accordéon sur mobile, et un encart d'appel dont le bouton était
 * `bg-champagne text-erreur` — un reste de la charte précédente, où ce rouge
 * était la couleur de marque et non celle des erreurs.
 *
 * Il est remplacé par la structure de la maquette : fond photographique,
 * mot-symbole et accroche à gauche, quatre colonnes à filet cuivré, trois
 * garanties en bandeau, barre basse.
 *
 * ## Ce qui n'existe pas encore, et comment c'est traité
 *
 * La maquette montre des éléments que le produit n'a pas. Ils sont rendus,
 * à la demande, mais sans prétendre fonctionner :
 *
 * - **Badges de magasins d'applications.** Il n'y a pas d'application
 *   mobile. Ce sont des `span`, pas des liens, portant la mention
 *   « Bientôt ». Les logos d'Apple et de Google ne sont pas reproduits : les
 *   nommer est licite, dessiner une approximation de leurs marques pour une
 *   application qui n'existe pas ne l'est pas, et une approximation mal
 *   faite se voit.
 * - **Sélecteur de langue.** Le projet n'a aucune internationalisation. Le
 *   bouton est `disabled` : visible comme dans la maquette, mais il ne
 *   promet pas un menu qui ne s'ouvrirait pas.
 * - **Réseaux sociaux.** Les cinq comptes pointent encore sur `#`, hérité
 *   de l'ancien pied de page. Les vraies adresses sont à mettre dans
 *   `RESEAUX` ci-dessous, en une fois.
 *
 * Les pages de `COLONNES` existent toutes : voir `src/app`. Toute entrée
 * ajoutée ici doit avoir sa route, sinon le pied de page envoie en 404 —
 * c'était le cas de « Centre d'aide » et « Mentions légales » avant.
 */

/** Icône TikTok — absente de lucide-react. */
function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16.6 5.82a4.28 4.28 0 0 1-1.06-2.82h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1-2.6-2.6c0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3c-1.5 0-2.86-.62-3.84-1.48Z" />
    </svg>
  );
}

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70 focus-visible:ring-offset-2 focus-visible:ring-offset-nuit';

/**
 * Les comptes sociaux.
 *
 * `href: '#'` signifie « compte pas encore ouvert ». Un `#` garde le
 * visiteur sur la page, ce qui vaut mieux qu'une 404, mais ça reste un lien
 * qui ne mène nulle part : à remplacer dès que les comptes existent.
 */
const RESEAUX = [
  { label: 'Instagram', href: '#', icone: <Instagram size={16} /> },
  { label: 'TikTok', href: '#', icone: <TikTokIcon /> },
  { label: 'X (Twitter)', href: '#', icone: <Twitter size={16} /> },
  { label: 'Facebook', href: '#', icone: <Facebook size={16} /> },
  { label: 'YouTube', href: '#', icone: <Youtube size={16} /> },
  { label: 'Nous écrire', href: '/contact', icone: <Mail size={16} /> },
];

const COLONNES: { titre: string; liens: { label: string; href: string }[] }[] = [
  {
    titre: "Sfera'Solys",
    liens: [
      { label: 'Accueil', href: '/' },
      { label: 'Notre histoire', href: '/histoire' },
      { label: 'Nos valeurs', href: '/valeurs' },
      { label: 'Témoignages', href: '/temoignages' },
      { label: 'Équipe', href: '/equipe' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    titre: 'Explorer',
    liens: [
      { label: 'Explorer des profils', href: '/explorer' },
      { label: 'Circle of Six', href: '/circle' },
      { label: 'Événements', href: '/evenements' },
      { label: 'Entraide', href: '/entraide' },
      { label: "Centre d'aide", href: '/aide' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    titre: 'Légal',
    liens: [
      { label: 'Mentions légales', href: '/mentions-legales' },
      { label: 'Confidentialité', href: '/confidentialite' },
      { label: "Conditions d'utilisation", href: '/conditions' },
      { label: 'Cookies', href: '/cookies' },
      { label: 'Gestion des données', href: '/gestion-donnees' },
      { label: 'Accessibilité', href: '/accessibilite' },
    ],
  },
];

/** Les trois garanties du bandeau bas. */
const GARANTIES = [
  {
    icone: ShieldCheck,
    titre: 'Sécurité & confidentialité',
    texte: 'Vos données sont protégées',
  },
  {
    icone: Users,
    titre: 'Communauté bienveillante',
    texte: 'Des rencontres respectueuses',
  },
  {
    icone: Gem,
    titre: 'Une expérience premium',
    texte: 'Qualité plutôt que quantité',
  },
];

/** Titre de colonne : petites capitales, filet cuivré dessous. */
function TitreColonne({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h3 className="text-[11px] font-semibold uppercase tracking-surtitre text-champagne/70">
        {children}
      </h3>
      <span
        aria-hidden="true"
        className="mt-2.5 block h-px w-8 bg-cuivre"
      />
    </>
  );
}

/**
 * Badge de magasin d'applications.
 *
 * Un `span`, pas un lien : il n'y a pas d'application à télécharger. La
 * mention « Bientôt » remplace la ligne « Télécharger sur » de la maquette,
 * et l'icône est générique plutôt qu'une imitation du logo du magasin.
 */
function BadgeMagasin({ magasin }: { magasin: string }) {
  return (
    <span className="flex items-center gap-3 rounded-xl border border-champagne/15 bg-nuit/50 px-4 py-2.5 backdrop-blur-sm">
      <Smartphone size={20} className="shrink-0 text-champagne/60" />
      <span className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase tracking-surtitre text-cuivre">
          Bientôt
        </span>
        <span className="text-[13px] font-semibold text-champagne/80">
          {magasin}
        </span>
      </span>
    </span>
  );
}

export default function Footer() {
  return (
    <footer className="relative isolate overflow-hidden bg-nuit text-champagne">
      {/*
        Fond photographique. Le voile est à 88 % : le pied de page est
        l'endroit de la page qui porte le plus de petit texte, et sous un
        voile plus clair le champagne atténué descend sous le seuil de
        lisibilité sur les zones éclairées de la terrasse.
      */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <Image
          src="/visuels/solys-09.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-nuit/88" />
        <div className="absolute inset-0 bg-gradient-to-b from-nuit via-transparent to-nuit" />
      </div>

      <div className="px-4 sm:px-6 lg:px-16">
        <div className="mx-auto max-w-7xl py-12 sm:py-14 lg:py-16">
          {/* ───────── Haut : marque + colonnes ───────── */}
          <div className="grid gap-10 lg:grid-cols-[1.8fr_0.9fr_1fr_1fr_2fr] lg:gap-8">
            {/* La marque */}
            <div>
              <Logo
                href="/"
                size="lg"
                markSize="xl"
                withMark
                markId="pied"
                tagline="Plus que des rencontres, des horizons partagés."
              />

              <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-champagne/65">
                Une plateforme pensée pour les hommes qui veulent des
                rencontres sincères, sûres et alignées avec leur vibe.
              </p>

              <ul className="mt-5 flex flex-wrap items-center gap-2">
                {RESEAUX.map((reseau) => (
                  <li key={reseau.label}>
                    <Link
                      href={reseau.href}
                      aria-label={reseau.label}
                      className={`flex h-10 w-10 items-center justify-center rounded-full border border-champagne/15 bg-nuit/40 text-champagne/65 backdrop-blur-sm transition-colors hover:border-cuivre/50 hover:text-champagne ${focusRing}`}
                    >
                      {reseau.icone}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex flex-wrap gap-3">
                <BadgeMagasin magasin="App Store" />
                <BadgeMagasin magasin="Google Play" />
              </div>
            </div>

            {/* Les colonnes de liens */}
            {COLONNES.map((colonne) => (
              <nav key={colonne.titre} aria-label={colonne.titre}>
                <TitreColonne>{colonne.titre}</TitreColonne>

                <ul className="mt-4 space-y-2.5">
                  {colonne.liens.map((lien) => (
                    <li key={lien.href}>
                      <Link
                        href={lien.href}
                        className={`text-[14px] text-champagne/65 transition-colors hover:text-ivoire ${focusRing}`}
                      >
                        {lien.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            {/* La newsletter */}
            <div>
              <TitreColonne>Rester informé</TitreColonne>

              <p className="mt-4 max-w-[16rem] text-[14px] leading-relaxed text-champagne/65">
                Conseils, événements et nouveautés en avant-première.
              </p>

              {/*
                Pas de mention « pas de spam » ajoutée ici : NewsletterSignup
                porte déjà la sienne. En doubler une deuxième par-dessus
                faisait se chevaucher deux phrases presque identiques.
              */}
              <NewsletterSignup variant="dark" className="mt-4" />
            </div>
          </div>

          {/* ───────── Les trois garanties ───────── */}
          {/*
            Séparées par des filets verticaux sur grand écran, comme dans la
            maquette. Le filet est posé par `divide-x` sur une rangée en
            `flex`, où l'ordre du DOM et l'ordre visuel coïncident — ce qui
            n'aurait pas été vrai sur une grille repassant en colonnes.
          */}
          <ul className="mt-10 flex flex-col gap-6 border-t border-champagne/20 pt-8 sm:flex-row sm:gap-0 sm:divide-x sm:divide-champagne/20">
            {GARANTIES.map(({ icone: Icone, titre, texte }) => (
              <li
                key={titre}
                className="flex flex-1 items-center gap-4 sm:px-6 sm:first:pl-0 sm:last:pr-0"
              >
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cuivre/30 bg-nuit/50 text-cuivre"
                >
                  <Icone size={20} />
                </span>

                <span>
                  <span className="block text-[14px] font-semibold text-champagne">
                    {titre}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-champagne/60">
                    {texte}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          {/* ───────── Barre basse ───────── */}
          <div className="mt-8 flex flex-col gap-5 border-t border-champagne/20 pt-6 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-[12px] text-champagne/55">
              © {new Date().getFullYear()} Sfera&rsquo;Solys. Tous droits
              réservés.
            </p>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7">
              <nav aria-label="Liens de bas de page">
                <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
                  {[
                    { label: 'Plan du site', href: '/plan-du-site' },
                    { label: 'Accessibilité', href: '/accessibilite' },
                    { label: 'Paramètres cookies', href: '/cookies' },
                  ].map((lien) => (
                    <li key={lien.href}>
                      <Link
                        href={lien.href}
                        className={`text-champagne/55 transition-colors hover:text-champagne ${focusRing}`}
                      >
                        {lien.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {/*
                Sélecteur de langue `disabled`. La maquette le montre, le
                produit n'a qu'une langue et aucune route localisée. Désactivé
                plutôt que muet : un bouton qui a l'air cliquable et n'ouvre
                rien est pire qu'un bouton qui dit qu'il n'est pas prêt.
              */}
              <button
                type="button"
                disabled
                title="Sfera'Solys n'est disponible qu'en français pour l'instant."
                className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-champagne/15 bg-nuit/40 px-4 py-2 text-[12px] text-champagne/55 backdrop-blur-sm"
              >
                <Globe size={13} aria-hidden="true" />
                Français
                <ChevronDown size={13} aria-hidden="true" className="opacity-40" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
