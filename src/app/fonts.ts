// src/app/fonts.ts
//
// Typographie « éclipse solaire » — Sfera'Solys.
// Chargée via next/font/google, exposée en variables CSS et câblée
// dans src/app/layout.tsx (RootLayout).
//
// - Archivo         → display (titres, boutons, wordmark),
//                      largeur expanded (~125) via l'axe variable `wdth`.
// - Fraunces        → accent italique (touches éditoriales / chaleureuses).
// - Instrument Sans → corps (texte courant, UI), poids 400/500/600.

import { Archivo, Fraunces, Instrument_Sans } from "next/font/google";

export const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  // Inclut l'axe de largeur variable pour pouvoir aller jusqu'à ~125
  // (expanded) via `[font-stretch:125%]` dans les composants.
  axes: ["wdth"],
  display: "swap",
});

export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["italic"],
  // Axe optical size pour un rendu plus fin aux grandes tailles éditoriales.
  axes: ["opsz"],
  display: "swap",
});

export const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  weight: ["400", "500", "600"],
  display: "swap",
});
