// src/hooks/useCookieConsent.ts
//
// Hook pour lire et écrire les préférences cookies de l'utilisateur.
// Les préférences sont stockées dans localStorage (cookie-consent key).

"use client";

import { useCallback, useEffect, useState } from "react";

export type CookieCategory = "essential" | "analytics" | "marketing" | "personalization";

export interface CookiePreferences {
  essential: true;           // toujours activé, non modifiable
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

export interface CookieConsentState {
  hasConsented: boolean;     // l'utilisateur a fait un choix
  preferences: CookiePreferences;
  consentedAt: string | null;
}

const STORAGE_KEY = "sferasolys-cookie-consent";

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  personalization: false,
};

function readFromStorage(): CookieConsentState {
  if (typeof window === "undefined") {
    return { hasConsented: false, preferences: DEFAULT_PREFERENCES, consentedAt: null };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { hasConsented: false, preferences: DEFAULT_PREFERENCES, consentedAt: null };

    const parsed = JSON.parse(raw) as CookieConsentState;
    return {
      hasConsented: parsed.hasConsented === true,
      preferences: {
        essential: true,
        analytics: parsed.preferences?.analytics === true,
        marketing: parsed.preferences?.marketing === true,
        personalization: parsed.preferences?.personalization === true,
      },
      consentedAt: parsed.consentedAt ?? null,
    };
  } catch {
    return { hasConsented: false, preferences: DEFAULT_PREFERENCES, consentedAt: null };
  }
}

/**
 * Événement diffusé à chaque changement de consentement.
 *
 * Nécessaire parce que `useCookieConsent` garde son état dans un `useState`
 * local : deux composants qui appellent le hook ont deux états séparés, et
 * celui qui n'a pas fait l'écriture ne saurait jamais qu'elle a eu lieu.
 * Sans ce signal, un script conditionné au consentement ne se couperait
 * qu'au rechargement suivant.
 */
export const EVENEMENT_CONSENTEMENT = "sferasolys:consentement-cookies";

function diffuserChangement() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENEMENT_CONSENTEMENT));
}

function writeToStorage(state: CookieConsentState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  diffuserChangement();
}

export function useCookieConsent() {
  const [state, setState] = useState<CookieConsentState>({
    hasConsented: false,
    preferences: DEFAULT_PREFERENCES,
    consentedAt: null,
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setState(readFromStorage());
    setMounted(true);
  }, []);

  const acceptAll = useCallback(() => {
    const next: CookieConsentState = {
      hasConsented: true,
      preferences: {
        essential: true,
        analytics: true,
        marketing: true,
        personalization: true,
      },
      consentedAt: new Date().toISOString(),
    };
    setState(next);
    writeToStorage(next);
  }, []);

  const rejectAll = useCallback(() => {
    const next: CookieConsentState = {
      hasConsented: true,
      preferences: {
        essential: true,
        analytics: false,
        marketing: false,
        personalization: false,
      },
      consentedAt: new Date().toISOString(),
    };
    setState(next);
    writeToStorage(next);
  }, []);

  const savePreferences = useCallback((prefs: Omit<CookiePreferences, "essential">) => {
    const next: CookieConsentState = {
      hasConsented: true,
      preferences: {
        essential: true,
        ...prefs,
      },
      consentedAt: new Date().toISOString(),
    };
    setState(next);
    writeToStorage(next);
  }, []);

  const resetConsent = useCallback(() => {
    const next: CookieConsentState = {
      hasConsented: false,
      preferences: DEFAULT_PREFERENCES,
      consentedAt: null,
    };
    setState(next);
    window.localStorage.removeItem(STORAGE_KEY);
    diffuserChangement();
  }, []);

  const hasCategory = useCallback(
    (category: CookieCategory) => state.preferences[category] === true,
    [state.preferences]
  );

  return {
    mounted,
    hasConsented: state.hasConsented,
    preferences: state.preferences,
    consentedAt: state.consentedAt,
    acceptAll,
    rejectAll,
    savePreferences,
    resetConsent,
    hasCategory,
  };
}
