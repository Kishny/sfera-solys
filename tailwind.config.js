/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ───────────────────────────────────────────────────────────────
        // Direction « nuit cuivrée » — Sfera'Solys
        //
        // Elle remplace l'éclipse solaire (abyss/teal/cream/orange/rust/
        // lime). Les anciens noms ont été retirés du code plutôt que
        // réaffectés : la charte précédente avait gardé les clés de
        // SferaLuna en changeant leurs valeurs, et `orange` a fini par
        // désigner un vulcanico. On ne refait pas deux fois la même erreur.
        //
        // Contrastes mesurés (WCAG, sur les deux fonds) :
        //
        //                  nuit     minuit
        //   cuivre         6,97:1   5,35:1   ← accent lisible même en petit
        //   champagne     14,05:1  10,77:1   ← texte courant
        //   ivoire        17,60:1  13,50:1   ← titres, texte fort
        //   succes         8,07:1   6,19:1
        //   erreur         5,99:1   4,59:1
        //   cuivre-sombre  3,50:1   2,69:1   ← surface et survol, jamais du texte
        //
        // Le gain sur l'ancienne charte : l'orange plafonnait à 3,84:1 sur
        // la surface et devait être réservé aux icônes et aux grands
        // chiffres. Le cuivre passe partout.
        //
        // Piège connu : `minuit` sur `nuit` ne donne que 1,30:1. Une carte
        // ne se détache pas de son fond par son remplissage — il lui faut
        // un filet cuivré, une ombre ou le grain.
        // ───────────────────────────────────────────────────────────────

        nuit: "#0A0D12",
        minuit: "#1D2835",
        cuivre: {
          DEFAULT: "#BD9365",
          sombre: "#866137",
        },
        champagne: "#EAD9BD",
        ivoire: "#F7F3ED",

        // Teintes de service. Volontairement sourdes : on ne les remarque
        // pas tant que rien ne va mal, mais « c'est fait » et « ça a raté »
        // se distinguent d'un coup d'œil, ce que l'icône seule ne fait pas.
        succes: "#83B28C",
        erreur: "#CB7871",

        // Alias sémantiques
        background: "#0A0D12",
        surface: "#1D2835",
        text: "#EAD9BD",
        "text-fort": "#F7F3ED",
        accent: "#BD9365",
        "accent-deep": "#866137",
      },
      fontFamily: {
        // Corps : Instrument Sans — texte courant, UI, boutons.
        sans: [
          "var(--font-instrument-sans)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        // Display : Playfair Display — titres. C'est lui qui porte la
        // direction, bien plus que la palette : l'ancienne charte titrait
        // en sans-serif étendu, celle-ci titre en serif à fort contraste.
        display: ["var(--font-playfair)", "ui-serif", "Georgia", "serif"],
      },
      letterSpacing: {
        // Les intertitres en petites capitales de la maquette
        // (« PLATEFORME DE RENCONTRES PREMIUM », « CRÉER UN COMPTE »).
        surtitre: "0.18em",
      },
      backgroundImage: {
        // Le cuivre des boutons n'est pas un aplat dans la maquette : il va
        // du champagne au cuivre. Le texte dessus reste `nuit` (6,97:1 au
        // point le plus sombre du dégradé).
        "degrade-cuivre":
          "linear-gradient(135deg, #EAD9BD 0%, #BD9365 100%)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
