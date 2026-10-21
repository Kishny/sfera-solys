'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Check, Settings, ShieldCheck } from 'lucide-react';

import { useCookieConsent } from '@/hooks/useCookieConsent';

/**
 * Le panneau « Tes préférences » de la page cookies.
 *
 * ## Il agit réellement
 *
 * Les interrupteurs écrivent dans `useCookieConsent`, le même stockage que
 * le bandeau de consentement. Et cette écriture a un effet observable :
 * `AnalytiqueConsentie` écoute l'événement diffusé par le hook et démonte
 * la mesure d'audience Vercel dès que la catégorie analytique passe à
 * faux, sans rechargement.
 *
 * C'est la seule raison d'être de ce panneau. Un réglage de consentement
 * qui n'éteint rien est pire que pas de réglage : il fait croire à un
 * choix. La page le dit d'ailleurs noir sur blanc sous les interrupteurs.
 *
 * ## Ce que chaque catégorie recouvre aujourd'hui
 *
 * - **Essentiels** : le jeton de session NextAuth, et l'enregistrement de
 *   ce choix lui-même. Sans eux, pas de connexion ni de mémoire du refus.
 * - **Analytiques** : la mesure d'audience Vercel. Montée seulement sur
 *   acceptation.
 * - **Fonctionnels** : rien n'est déposé à ce jour. L'interrupteur existe
 *   pour que le choix soit déjà connu le jour où quelque chose s'y range ;
 *   il est présenté comme tel et non comme un réglage actif.
 *
 * La catégorie `marketing` du stockage n'apparaît pas : aucun code ne la
 * lit, et rien ne la dépose. Elle est écrite à `false` à chaque
 * enregistrement.
 */

type Cle = 'personalization' | 'analytics';

const CATEGORIES: Array<{
  cle: Cle;
  icone: typeof ShieldCheck;
  titre: string;
  description: string;
}> = [
  {
    cle: 'personalization',
    icone: Settings,
    titre: 'Cookies fonctionnels',
    description:
      'Mémorisation de tes préférences d’affichage. Aucun n’est déposé à ce jour.',
  },
  {
    cle: 'analytics',
    icone: BarChart3,
    titre: 'Cookies analytiques',
    description: 'Mesure d’audience et amélioration du site.',
  },
];

export default function PreferencesCookies() {
  const { mounted, preferences, savePreferences, rejectAll } = useCookieConsent();

  const [brouillon, setBrouillon] = useState<Record<Cle, boolean>>({
    personalization: false,
    analytics: false,
  });
  const [enregistre, setEnregistre] = useState(false);

  /*
    Le hook lit `localStorage` dans un effet : avant son montage, il
    renvoie les valeurs par défaut. Recopier le brouillon à ce moment-là
    afficherait deux interrupteurs éteints à quelqu'un qui avait accepté.
  */
  useEffect(() => {
    if (!mounted) return;
    setBrouillon({
      personalization: preferences.personalization,
      analytics: preferences.analytics,
    });
  }, [mounted, preferences.personalization, preferences.analytics]);

  const basculer = (cle: Cle) => {
    setBrouillon((actuel) => ({ ...actuel, [cle]: !actuel[cle] }));
    setEnregistre(false);
  };

  const enregistrer = () => {
    savePreferences({ ...brouillon, marketing: false });
    setEnregistre(true);
  };

  const toutRefuser = () => {
    setBrouillon({ personalization: false, analytics: false });
    rejectAll();
    setEnregistre(true);
  };

  return (
    <section
      aria-labelledby="preferences-cookies"
      className="rounded-2xl bg-champagne p-5 text-nuit sm:p-7"
    >
      <h2
        id="preferences-cookies"
        className="font-display text-[22px] font-normal leading-snug sm:text-[26px]"
      >
        Tes préférences
      </h2>

      <p className="mt-2 text-[13px] leading-relaxed text-nuit/80">
        Tu peux choisir les catégories que tu souhaites autoriser. Les cookies
        essentiels sont nécessaires et ne peuvent pas être désactivés.
      </p>

      <ul className="mt-6 space-y-2.5">
        {/* Essentiels : affichés, jamais modifiables. */}
        <li className="flex items-center gap-4 rounded-xl border border-nuit/15 bg-nuit/[0.04] p-4">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-nuit/25"
          >
            <ShieldCheck size={18} />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold">
              Cookies essentiels
            </span>
            <span className="mt-0.5 block text-[12.5px] leading-snug text-nuit/75">
              Jeton de session et mémoire de ce choix — indispensables au
              fonctionnement du site.
            </span>
          </span>

          <span className="flex shrink-0 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-6 w-11 items-center rounded-full bg-nuit/25 p-0.5"
            >
              <span className="ml-auto h-5 w-5 rounded-full bg-champagne" />
            </span>
            <span className="hidden text-[12.5px] font-semibold text-nuit/60 sm:inline">
              Toujours actifs
            </span>
          </span>
        </li>

        {CATEGORIES.map(({ cle, icone: Icone, titre, description }) => {
          const actif = brouillon[cle];

          return (
            <li
              key={cle}
              className="flex items-center gap-4 rounded-xl border border-nuit/15 bg-nuit/[0.04] p-4"
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-nuit/25"
              >
                <Icone size={18} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold">{titre}</span>
                <span className="mt-0.5 block text-[12.5px] leading-snug text-nuit/75">
                  {description}
                </span>
              </span>

              <button
                type="button"
                role="switch"
                aria-checked={actif}
                onClick={() => basculer(cle)}
                className="flex shrink-0 items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nuit/60 focus-visible:ring-offset-2 focus-visible:ring-offset-champagne"
              >
                <span
                  aria-hidden="true"
                  className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
                    actif ? 'bg-nuit' : 'bg-nuit/25'
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-champagne transition-transform ${
                      actif ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </span>

                <span className="hidden text-[12.5px] font-semibold sm:inline">
                  {actif ? 'Autorisé' : 'Autoriser'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={enregistrer}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-degrade-cuivre px-6 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nuit/60 focus-visible:ring-offset-2 focus-visible:ring-offset-champagne"
        >
          <Check size={16} aria-hidden="true" />
          Enregistrer mes choix
        </button>

        <button
          type="button"
          onClick={toutRefuser}
          className="flex-1 rounded-xl bg-nuit px-6 py-3.5 text-sm font-bold text-champagne transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nuit/60 focus-visible:ring-offset-2 focus-visible:ring-offset-champagne"
        >
          Tout refuser sauf essentiels
        </button>
      </div>

      {/*
        `aria-live` : l'enregistrement ne déplace pas le focus et ne change
        rien de visible ailleurs. Sans annonce, un lecteur d'écran ne
        saurait pas que le choix a été pris en compte.
      */}
      <p aria-live="polite" className="mt-4 text-[12.5px] leading-relaxed text-nuit/75">
        {enregistre
          ? 'Tes choix sont enregistrés. La mesure d’audience a été coupée ou remise en route selon ton réglage, sans recharger la page.'
          : 'À ce jour, seule la catégorie analytique dépose réellement quelque chose : la mesure d’audience n’est chargée qu’avec ton accord.'}
      </p>
    </section>
  );
}
