'use client';

import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';

import { EVENEMENT_CONSENTEMENT } from '@/hooks/useCookieConsent';

/**
 * Mesure d'audience conditionnée au consentement.
 *
 * ## Le défaut corrigé
 *
 * `<Analytics />` était monté sans condition dans `layout.tsx`, et les
 * préférences du bandeau cookies n'étaient lues nulle part dans
 * l'application — seulement par les tests unitaires. Refuser la catégorie
 * « analytics » enregistrait donc un refus qui ne coupait rien. Le bandeau
 * demandait un consentement sans jamais s'y conformer.
 *
 * ## Le fonctionnement
 *
 * Le composant lit la préférence au montage, puis écoute deux signaux :
 * `EVENEMENT_CONSENTEMENT`, diffusé par le hook dès qu'un choix est
 * enregistré dans le même onglet, et `storage`, qui couvre le cas d'un
 * changement fait dans un autre onglet. Tant que la catégorie n'est pas
 * explicitement acceptée, rien n'est monté — y compris au tout premier
 * affichage, avant que la personne ait répondu.
 *
 * On relit `localStorage` directement plutôt que d'appeler
 * `useCookieConsent()` : le hook garde son état dans un `useState` local,
 * donc une seconde instance ne verrait pas les écritures de la première.
 */

const CLE = 'sferasolys-cookie-consent';

function analytiqueAcceptee(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const brut = window.localStorage.getItem(CLE);
    if (!brut) return false;

    const etat = JSON.parse(brut) as {
      hasConsented?: boolean;
      preferences?: { analytics?: boolean };
    };

    return etat.hasConsented === true && etat.preferences?.analytics === true;
  } catch {
    // localStorage indisponible ou contenu illisible : on ne mesure pas.
    return false;
  }
}

export default function AnalytiqueConsentie() {
  const [autorisee, setAutorisee] = useState(false);

  useEffect(() => {
    const relire = () => setAutorisee(analytiqueAcceptee());

    relire();
    window.addEventListener(EVENEMENT_CONSENTEMENT, relire);
    window.addEventListener('storage', relire);

    return () => {
      window.removeEventListener(EVENEMENT_CONSENTEMENT, relire);
      window.removeEventListener('storage', relire);
    };
  }, []);

  if (!autorisee) return null;

  return <Analytics />;
}
