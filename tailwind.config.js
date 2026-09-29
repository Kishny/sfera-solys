/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}", // ← au cas où tu as encore un dossier `pages`
    "./src/**/*.{js,ts,jsx,tsx}", // ← au cas où tu as déplacé des fichiers dans `src`
  ],
  theme: {
    extend: {
      colors: {
        primary: "#8E7AB5",
        secondary: "#F5F3F7",
        dark: "#1C1C1C",
        muted: "#5E5E5E",

        // Éclipse solaire — tokens Sfera'Solys (concept 5 : lime & vulcanico)
        //
        // On garde les MÊMES clés qu'avant (abyss/teal/cream/orange/rust) pour que
        // les classes déjà utilisées dans tout le code (bg-orange, text-rust, etc.)
        // continuent de fonctionner sans rien renommer. Seules les valeurs hex
        // changent :
        //   - orange / accent      → vulcanico (#FF4103), remplace l'ancien orange
        //   - rust / accent-deep   → ember (#6B1B02), déclinaison sombre du
        //                            vulcanico pour les hovers/états pressés
        //                            (remplace le rôle que jouait rust)
        //   - teal / surface       → neutre proche de l'abyss (#0C222D), pour
        //                            retirer la teinte teal tout en gardant la
        //                            même utilité de "surface" un peu plus claire
        //                            que le fond (cartes, dégradés, séparations)
        //   - lime / accent-electric → nouveau, accent électrique secondaire
        //                              réservé aux petites touches à fort impact
        //                              (badges, points de statut, glows) — jamais
        //                              en grande surface ni en texte courant
        //
        // TODO rebranding (phase 2, optionnelle) : une fois toutes les pages
        // repassées en revue, on pourra renommer teal→(nouveau nom neutre) et
        // rust→ember dans le code pour que les noms de classes redeviennent
        // fidèles aux couleurs qu'ils décrivent.
        // Palier de luminosité (29/09/2026) : le fond est passé de #001724 à
        // #04202E et la surface de #0C222D à #123243. Le site était lu comme
        // trop sombre. C'est le seul cran où tout reste conforme AA, y compris
        // l'orange sur le fond (4,80:1, contre 5,23:1 avant). Le crème tient
        // 14,4:1 sur le fond et 11,6:1 sur la surface ; `text-abyss` sur un
        // bouton orange reste à 4,80:1.
        abyss: "#04202E",
        teal: "#123243",
        cream: "#FFEBD1",
        orange: "#FF4103",
        rust: "#6B1B02",
        lime: "#B6FF00",

        // Alias sémantiques (mêmes valeurs que les tokens ci-dessus)
        background: "#04202E", // abyss
        surface: "#123243", // teal → surface, un cran au-dessus du fond
        text: "#FFEBD1", // cream
        accent: "#FF4103", // orange → vulcanico
        "accent-deep": "#6B1B02", // rust → ember
        "accent-electric": "#B6FF00", // lime
      },
      fontFamily: {
        // Corps : Instrument Sans — texte courant, UI
        sans: [
          "var(--font-instrument-sans)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        // Display : Archivo — titres, boutons, wordmark (bas-de-casse, largeur expanded)
        display: [
          "var(--font-archivo)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        // Accent : Fraunces italique — touches éditoriales / chaleureuses
        accent: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"), // ← Optionnel mais recommandé
    require("@tailwindcss/typography"), // ← Pour le style des textes/actualités/blog
    require("@tailwindcss/aspect-ratio"), // ← Pour gérer les images/vidéos responsive
  ],
};
