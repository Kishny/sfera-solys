// src/components/brand/EclipseMark.tsx

/**
 * Le soleil en éclipse — signature de marque Sfera'Solys.
 *
 * ⚠️ Piège de conception, vérifié au rendu : une « morsure » trop décalée
 * ne produit pas une éclipse, elle produit un **croissant de lune** — donc
 * le symbole de Sfera'Solys, exactement l'inverse de ce que Solys raconte.
 * La première version de ce composant tombait dans le panneau (disque de
 * rayon 68 mordu par un disque de rayon 68 décalé de ~41) et le rendu
 * affichait un croissant lunaire en haut de la page d'accueil.
 *
 * La règle à retenir : c'est **l'épaisseur minimale de l'anneau** qui
 * décide de la lecture. Anneau continu = soleil ; anneau rompu ou réduit à
 * un fil = lune. On garde donc un disque occultant presque concentrique
 * (décalage ~8 sur un rayon de 68), ce qui laisse un anneau qui varie de
 * 8 à 24 px : il reste lisible comme un disque solaire occulté, tout en
 * gardant l'idée de morsure de la charte.
 *
 * Deux autres choix volontaires :
 *
 * 1. La morsure est faite avec un `mask` SVG, pas avec un second disque
 *    rempli de la couleur du fond : le centre est réellement transparent,
 *    donc le motif reste juste sur `abyss` comme sur une carte `#0C222D`.
 * 2. L'`id` est une prop obligatoire au lieu d'un `useId()`. Sans hook, le
 *    composant fonctionne aussi bien dans un composant serveur que client.
 *    Deux instances sur une même page doivent recevoir deux `id`
 *    différents, sinon les masques se marchent dessus.
 *
 * Toujours décoratif : `aria-hidden`, jamais porteur d'information.
 */
export default function EclipseMark({
  id,
  className = '',
  /** Couronne solaire : petits rayons courts autour du disque. */
  withCorona = false,
}: {
  id: string;
  className?: string;
  withCorona?: boolean;
}) {
  const maskId = `eclipse-mask-${id}`;

  /** 12 rayons courts, régulièrement répartis autour du disque. */
  const rays = Array.from({ length: 12 }, (_, index) => {
    const angle = (Math.PI / 6) * index;
    const inner = 76;
    const outer = 88;

    return {
      x1: 100 + inner * Math.cos(angle),
      y1: 100 + inner * Math.sin(angle),
      x2: 100 + outer * Math.cos(angle),
      y2: 100 + outer * Math.sin(angle),
    };
  });

  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <mask id={maskId}>
          {/* Blanc = visible, noir = masqué : le disque occultant creuse le disque solaire. */}
          <rect x="0" y="0" width="200" height="200" fill="white" />
          <circle cx="106" cy="95" r="52" fill="black" />
        </mask>
      </defs>

      <circle
        cx="100"
        cy="100"
        r="68"
        fill="currentColor"
        mask={`url(#${maskId})`}
      />

      {withCorona &&
        rays.map((ray, index) => (
          <line
            key={index}
            x1={ray.x1}
            y1={ray.y1}
            x2={ray.x2}
            y2={ray.y2}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.55"
          />
        ))}
    </svg>
  );
}
