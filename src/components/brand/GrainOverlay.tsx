// src/components/brand/GrainOverlay.tsx

/**
 * Grain discret sur toute la page.
 *
 * L'ancienne home Sfera'Solys en avait un ; je l'avais supprimé avec le reste
 * du décor lors de la refonte, et c'était une sur-correction : sur un fond
 * sombre uni, l'absence totale de texture donne un aplat un peu mort. Le
 * grain rattrape ça sans rien ajouter au discours.
 *
 * Opacité volontairement très basse (3,5 %) : au-delà, la texture commence
 * à grignoter le contraste du texte, et la palette est déjà calibrée au
 * ratio près (voir CLAUDE.md § Règles de contraste). À 3,5 % l'effet sur
 * les ratios mesurés est négligeable.
 *
 * Le bruit est un `feTurbulence` SVG encodé en URL : aucun fichier image à
 * charger, aucune requête réseau, quelques centaines d'octets.
 */

const noise = `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/></filter><rect width='140' height='140' filter='url(%23n)'/></svg>`;

export default function GrainOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] opacity-[0.035]"
      style={{
        backgroundImage: `url("data:image/svg+xml,${noise.replace(/"/g, "'")}")`,
        backgroundRepeat: 'repeat',
      }}
    />
  );
}
