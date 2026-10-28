// src/app/fonts.ts
//
// Typographie « nuit cuivrée » — Sfera'Solys.
// Chargée via next/font/google, exposée en variables CSS et câblée dans
// src/app/layout.tsx (RootLayout).
//
// - Playfair Display → titres. Serif à fort contraste, c'est lui qui porte
//                      la direction artistique.
// - Instrument Sans  → corps, interface, boutons.
//
// Ce qui a disparu, et pourquoi : Archivo servait de display dans la charte
// « éclipse solaire », toujours accompagné de `` pour
// exploiter son axe de largeur variable. Playfair n'a pas cet axe, et la
// maquette ne demande pas d'élargissement — les 149 occurrences de cette
// classe ont été retirées avec lui. Fraunces italique servait d'accent
// éditorial ; le serif étant devenu la voix principale, un second serif
// n'apportait plus de contraste.

import { Instrument_Sans, Playfair_Display } from "next/font/google";

/**
 * Deux graisses, pas quatre.
 *
 * 500 et 600 étaient déclarées et ne sont utilisées nulle part : sur 195
 * usages de `font-display`, 127 sont en `font-normal` et 41 en
 * `font-bold`, pas un seul en graisse intermédiaire.
 *
 * Le retrait ne change **rien** à ce qui est construit : vérifié après
 * coup, la construction produit les mêmes dix fichiers de police, octet
 * pour octet, pour 244 Ko au total. Next sert Playfair en police
 * variable, et les graisses déclarées ne pilotent que les règles CSS,
 * pas le découpage des fichiers. C'est une déclaration honnête, pas une
 * optimisation — et la noter évite à quelqu'un de refaire le détour en
 * croyant y gagner des octets.
 *
 * ## Le préchargement, gardé après mesure
 *
 * Playfair précharge deux fichiers de 38 Ko sur chaque page, qui
 * disputent la bande passante à la photographie du héros — laquelle est
 * le plus grand élément affiché, donc celle qui décide du LCP. Couper ce
 * préchargement paraît donc évident, et je l'ai fait.
 *
 * Puis mesuré : dix chargements en 4G lente, cinq par version. Les
 * résultats se regroupent autour de 2,3 s ou de 2,9 s selon qu'un
 * aller-retour supplémentaire tombe ou non, et les deux versions se
 * retrouvent dans les deux paquets. Aucune amélioration démontrable.
 *
 * Le préchargement reste donc, parce que le coût de le retirer, lui, est
 * certain : le titre s'affiche plus longtemps dans la police de secours
 * avant de basculer. Payer un défaut visible pour un gain non prouvé est
 * un mauvais échange sur un site où la typographie porte la marque.
 */
export const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  // L'axe optique n'existe pas sur Playfair ; on prend les deux graisses
  // réellement employées — les titres et le mot-symbole.
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  weight: ["400", "500", "600"],
  display: "swap",
});
