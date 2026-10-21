'use client';

import { Clock, Cookie, Globe, Mail } from 'lucide-react';

import PageLegale, { type SectionLegale } from '@/components/legal/PageLegale';
import PreferencesCookies from '@/components/legal/PreferencesCookies';

/**
 * Politique des cookies — direction « nuit cuivrée », d'après la maquette.
 *
 * ## Ce que la page dit maintenant, et qui est vérifiable
 *
 * L'ancienne version décrivait des catégories sans jamais dire ce qui est
 * réellement déposé. L'inventaire a été refait à partir du code :
 *
 * - **Un seul cookie est posé par le site** : le jeton de session
 *   NextAuth. `session: { strategy: "jwt" }` sans `maxAge` : la valeur par
 *   défaut de NextAuth est de trente jours, et c'est cette durée qui est
 *   annoncée.
 * - **Le choix de consentement** vit dans `localStorage`, pas dans un
 *   cookie, et n'a donc pas de date d'expiration. La page le dit.
 * - **La catégorie analytique** ne gouverne pas un cookie mais le
 *   chargement de la mesure d'audience Vercel, monté seulement sur
 *   acceptation par `AnalytiqueConsentie`. Annoncer « durée : 6 mois »
 *   comme le fait la maquette décrirait un cookie que nous ne posons pas.
 * - **La catégorie fonctionnelle** ne recouvre rien aujourd'hui. Elle est
 *   présentée comme telle, et non comme un réglage actif.
 *
 * ## Le panneau de préférences agit
 *
 * Les interrupteurs écrivent dans le même stockage que le bandeau de
 * consentement, et la mesure d'audience se démonte dès l'enregistrement,
 * sans rechargement. C'était la condition pour mettre ce panneau sur une
 * page qui engage : un réglage qui n'éteint rien ferait croire à un choix.
 */

/** Petit composant de carte, pour l'inventaire des catégories. */
function CarteCategorie({
  icone: Icone,
  titre,
  texte,
  duree,
}: {
  icone: typeof Cookie;
  titre: string;
  texte: string;
  duree: string;
}) {
  return (
    <li className="flex h-full flex-col rounded-xl border border-champagne/15 bg-nuit/40 p-4">
      <span
        aria-hidden="true"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-cuivre/40 bg-nuit/60 text-cuivre"
      >
        <Icone size={18} />
      </span>

      <h3 className="font-display mt-3.5 text-[16px] font-normal leading-snug text-ivoire">
        {titre}
      </h3>

      <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-champagne/80">
        {texte}
      </p>

      <p className="mt-4 flex items-center gap-2 rounded-lg border border-champagne/12 bg-nuit/50 px-3 py-2 text-[12px] text-champagne/80">
        <Clock size={13} aria-hidden="true" className="shrink-0 text-cuivre" />
        {duree}
      </p>
    </li>
  );
}

/**
 * Les pages d'aide des trois navigateurs les plus répandus.
 *
 * Pas de logos : reproduire les marques Chrome, Firefox et Safari demande
 * une licence qu'on n'a pas, et c'est la même règle que pour les badges
 * App Store du pied de page. Le nom en toutes lettres suffit.
 */
const NAVIGATEURS = [
  {
    nom: 'Google Chrome',
    href: 'https://support.google.com/chrome/answer/95647',
  },
  {
    nom: 'Mozilla Firefox',
    href: 'https://support.mozilla.org/fr/kb/effacer-cookies-donnees-site-firefox',
  },
  {
    nom: 'Safari',
    href: 'https://support.apple.com/fr-fr/guide/safari/sfri11471/mac',
  },
];

const ADRESSE = 'contact@sferasolys.com';

const sections: SectionLegale[] = [
  {
    id: 'comprendre',
    titre: 'Comprendre les cookies',
    icone: Cookie,
    contenu: (
      <>
        <p>
          Un cookie est un petit fichier texte déposé sur ton appareil
          lorsque tu visites un site web. Il permet notamment d&apos;assurer
          le bon fonctionnement du site, de retenir certaines préférences et
          de comprendre comment le site est utilisé.
        </p>
        <p>
          Sur Sfera&rsquo;Solys, un seul cookie est posé par le site
          lui-même : le jeton qui maintient ta session une fois connecté. Ton
          choix de consentement, lui, est conservé dans le stockage local de
          ton navigateur — ce n&apos;est pas un cookie, et il n&apos;est
          jamais transmis à nos serveurs.
        </p>
      </>
    ),
  },
  {
    id: 'utilises',
    titre: 'Les cookies utilisés',
    resume:
      'Voici les catégories présentes sur Sfera’Solys et ce que chacune recouvre réellement aujourd’hui.',
    contenu: (
      <ul className="mt-1 grid gap-3 sm:grid-cols-3">
        <CarteCategorie
          icone={Cookie}
          titre="Cookies essentiels"
          texte="Le jeton de session qui te garde connecté, et la mémoire de ton choix de consentement. Sans eux, ni connexion ni souvenir d’un refus."
          duree="Session : 30 jours"
        />

        <CarteCategorie
          icone={Cookie}
          titre="Cookies fonctionnels"
          texte="Mémorisation de préférences d’affichage. Aucun n’est déposé à ce jour : la catégorie existe pour que ton choix soit déjà connu si cela change."
          duree="Aucun déposé"
        />

        <CarteCategorie
          icone={Cookie}
          titre="Mesure d’audience"
          texte="La mesure d’audience Vercel, qui nous dit quelles pages sont consultées. Elle n’est chargée que si tu l’acceptes, et se coupe dès que tu la refuses."
          duree="Chargée sur accord"
        />
      </ul>
    ),
  },
  {
    id: 'preferences',
    titre: 'Gérer mes préférences',
    nu: true,
    contenu: <PreferencesCookies />,
  },
  {
    id: 'navigateur',
    titre: 'Les cookies dans le navigateur',
    resume:
      'Tu peux aussi configurer ou supprimer les cookies directement depuis ton navigateur.',
    contenu: (
      <ul className="mt-1 grid gap-3 sm:grid-cols-3">
        {NAVIGATEURS.map(({ nom, href }) => (
          <li key={nom}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="flex h-full items-center gap-3.5 rounded-xl border border-champagne/15 bg-nuit/40 p-4 transition-colors hover:border-cuivre/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70 focus-visible:ring-offset-2 focus-visible:ring-offset-nuit"
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cuivre/40 bg-nuit/60 text-cuivre"
              >
                <Globe size={18} />
              </span>

              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold text-champagne">
                  {nom}
                </span>
                <span className="mt-0.5 block text-[12px] text-cuivre">
                  Voir les instructions
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: 'contact',
    titre: 'Nous contacter',
    resume:
      'Une question sur notre utilisation des cookies ? Écris-nous, une personne lit et répond.',
    contenu: (
      <a
        href={`mailto:${ADRESSE}`}
        className="mt-1 inline-flex items-center gap-2.5 rounded-xl border border-cuivre/45 bg-cuivre/10 px-5 py-3 text-[13.5px] font-semibold text-champagne transition-colors hover:bg-cuivre/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70 focus-visible:ring-offset-2 focus-visible:ring-offset-nuit"
      >
        <Mail size={16} aria-hidden="true" className="text-cuivre" />
        {ADRESSE}
      </a>
    ),
  },
];

export default function CookiesPage() {
  return (
    <PageLegale
      badge="Centre légal"
      titre={
        <>
          Ce que nous déposons
          <br />
          <span className="italic text-cuivre">sur ton appareil.</span>
        </>
      }
      accroche="Comprendre et maîtriser tes choix."
      chapeau="Nous utilisons des cookies pour faire fonctionner Sfera’Solys et, si tu l’acceptes, pour mesurer l’audience du site. Tu peux revenir sur ce choix à tout moment depuis cette page."
      miseAJour="27 septembre 2026"
      sections={sections}
      encartSommaire={{
        image: '/visuels/solys-02.webp',
        titre: 'Tu gardes le contrôle.',
        texte: 'Tes préférences se modifient en un clic, et prennent effet aussitôt.',
      }}
    />
  );
}
