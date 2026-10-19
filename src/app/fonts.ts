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

export const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  // L'axe optique n'existe pas sur Playfair ; on prend les graisses utiles
  // aux titres et au mot-symbole.
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  weight: ["400", "500", "600"],
  display: "swap",
});
