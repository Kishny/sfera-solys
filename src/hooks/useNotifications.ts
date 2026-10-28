// src/hooks/useNotifications.ts

"use client";

import { useEffect, useState } from "react";

/**
 * Les compteurs de notification — un seul sondage pour tout le site.
 *
 * ## Le gâchis que cela corrige
 *
 * Deux composants interrogeaient `/api/notifications` toutes les trente
 * secondes, chacun pour son compte : le `Header` lisait `total`,
 * `CompteursEspace` lisait `unreadMessages` et `newMatches`. Même route,
 * mêmes données, deux fonctions serveur réveillées, deux requêtes
 * réseau — et sur un téléphone, deux réveils de la radio, toutes les
 * trente secondes, tant que l'onglet est ouvert.
 *
 * Ils partagent maintenant un seul sondage. Le premier composant monté
 * le démarre, le dernier démonté l'arrête.
 *
 * ## L'onglet en arrière-plan
 *
 * Le sondage s'arrête quand la page n'est plus visible, et relit une
 * fois au retour. Un compteur n'a aucune raison de tourner pendant que
 * le membre fait autre chose, et c'est sur mobile que cela se paie le
 * plus cher — chaque réveil sort la radio de veille.
 *
 * ## Pourquoi un module et non un contexte React
 *
 * Le `Header` vit dans la mise en page publique, `CompteursEspace` dans
 * celle de l'espace connecté. Aucun fournisseur commun ne les englobe
 * sans remonter à la racine, ce qui reviendrait à rendre toute
 * l'application cliente. Un module partagé les relie sans rien changer
 * à l'arborescence.
 */

export type Notifications = {
  total: number;
  unreadMessages: number;
  newMatches: number;
  circlePret: boolean;
};

const VIDE: Notifications = {
  total: 0,
  unreadMessages: 0,
  newMatches: 0,
  circlePret: false,
};

/** Intervalle du sondage, en millisecondes. */
const PERIODE = 30_000;

let etat: Notifications = VIDE;

const abonnes = new Set<(valeur: Notifications) => void>();

let minuteur: ReturnType<typeof setInterval> | null = null;

/** La requête en cours, s'il y en a une : deux abonnés n'en lancent qu'une. */
let enVol: Promise<void> | null = null;

function diffuser(valeur: Notifications) {
  etat = valeur;
  for (const abonne of abonnes) abonne(valeur);
}

/**
 * Relit les compteurs maintenant.
 *
 * Exportée pour les moments où attendre le prochain tour serait absurde :
 * une page vient de marquer des messages comme lus, la pastille doit
 * s'éteindre tout de suite et non dans trente secondes.
 */
export function rafraichirNotifications(): Promise<void> {
  if (enVol) return enVol;

  enVol = (async () => {
    try {
      const reponse = await fetch("/api/notifications", { cache: "no-store" });

      if (!reponse.ok) return;

      const donnees = await reponse.json();

      diffuser({
        total: Number(donnees?.total) || 0,
        unreadMessages: Number(donnees?.unreadMessages) || 0,
        newMatches: Number(donnees?.newMatches) || 0,
        circlePret: donnees?.circlePret === true,
      });
    } catch {
      // Ignoré volontairement : une barre de navigation ne casse pas
      // parce qu'un compteur n'a pas pu être relu.
    } finally {
      enVol = null;
    }
  })();

  return enVol;
}

/**
 * Ajoute une notification sans attendre le serveur.
 *
 * Sert à l'arrivée d'une mise en relation par Pusher : le compteur doit
 * bouger à la seconde, le prochain sondage confirmera le chiffre exact.
 */
export function incrementerNotifications() {
  diffuser({ ...etat, total: etat.total + 1 });
}

/** Éteint la pastille principale, le temps que le serveur confirme. */
export function viderNotifications() {
  diffuser({ ...etat, total: 0 });
}

function visible() {
  return typeof document === "undefined" || !document.hidden;
}

function surChangementDeVisibilite() {
  if (visible()) {
    void rafraichirNotifications();
    demarrerMinuteur();
  } else {
    arreterMinuteur();
  }
}

function demarrerMinuteur() {
  if (minuteur !== null || !visible()) return;

  minuteur = setInterval(() => {
    if (visible()) void rafraichirNotifications();
  }, PERIODE);
}

function arreterMinuteur() {
  if (minuteur === null) return;

  clearInterval(minuteur);
  minuteur = null;
}

function brancher() {
  if (abonnes.size !== 1) return;

  void rafraichirNotifications();
  demarrerMinuteur();

  document.addEventListener("visibilitychange", surChangementDeVisibilite);
  window.addEventListener("solys:notifications", rafraichirNotifications);
}

function debrancher() {
  if (abonnes.size !== 0) return;

  arreterMinuteur();

  document.removeEventListener("visibilitychange", surChangementDeVisibilite);
  window.removeEventListener("solys:notifications", rafraichirNotifications);
}

/**
 * Les compteurs, partagés.
 *
 * `actif` vaut généralement « le membre est connecté » : à faux, le hook
 * ne s'abonne pas et aucun sondage ne démarre.
 */
export function useNotifications(actif: boolean): Notifications {
  const [valeur, setValeur] = useState<Notifications>(etat);

  useEffect(() => {
    if (!actif) return;

    abonnes.add(setValeur);
    setValeur(etat);
    brancher();

    return () => {
      abonnes.delete(setValeur);
      debrancher();
    };
  }, [actif]);

  return actif ? valeur : VIDE;
}
