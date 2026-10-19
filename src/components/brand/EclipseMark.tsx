// src/components/brand/EclipseMark.tsx

/**
 * L'éclipse — signature de marque Sfera'Solys.
 *
 * ## Ce qui a changé avec la direction « nuit cuivrée »
 *
 * La version précédente était un **disque plein** mordu par un disque
 * occultant, et tout l'enjeu était de garder l'anneau assez épais pour ne
 * pas basculer en croissant de lune — c'est-à-dire en symbole de SferaLuna,
 * exactement l'inverse de ce que Solys raconte.
 *
 * Les maquettes ont tranché autrement : l'éclipse est désormais un **anneau
 * fin**, pas un disque. Le piège du croissant disparaît avec le disque
 * plein, mais il est remplacé par un autre : un anneau d'épaisseur
 * constante et de couleur uniforme ne lit pas comme une éclipse, il lit
 * comme un cercle. C'est le **dégradé le long de la circonférence** qui
 * fait l'éclipse — un côté embrasé en champagne, l'autre éteint en cuivre
 * sombre.
 *
 * Deux choix conservés de la version précédente :
 *
 * 1. Le centre est réellement vide, donc le motif se pose aussi bien sur
 *    `nuit` que sur une carte `minuit` ou sur une photo.
 * 2. L'`id` est une prop obligatoire plutôt qu'un `useId()`. Sans hook, le
 *    composant fonctionne en composant serveur comme en client. Deux
 *    instances sur une même page doivent recevoir deux `id` distincts,
 *    sinon leurs dégradés se marchent dessus.
 *
 * Toujours décoratif : `aria-hidden`, jamais porteur d'information.
 */
export default function EclipseMark({
  id,
  className = "",
  /** Halo diffus autour de l'anneau, pour les grands formats. */
  withCorona = false,
}: {
  id: string;
  className?: string;
  withCorona?: boolean;
}) {
  const gradId = `eclipse-grad-${id}`;
  const glowId = `eclipse-glow-${id}`;

  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        {/*
          Le dégradé court en diagonale : le haut-droit est embrasé, le
          bas-gauche s'éteint. C'est ce déséquilibre qui fait lire une
          éclipse plutôt qu'un cercle.
        */}
        <linearGradient id={gradId} x1="15%" y1="90%" x2="85%" y2="10%">
          <stop offset="0%" stopColor="#866137" stopOpacity="0.35" />
          <stop offset="45%" stopColor="#BD9365" />
          <stop offset="80%" stopColor="#EAD9BD" />
          <stop offset="100%" stopColor="#F7F3ED" />
        </linearGradient>

        <radialGradient id={glowId}>
          <stop offset="55%" stopColor="#BD9365" stopOpacity="0" />
          <stop offset="78%" stopColor="#BD9365" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#BD9365" stopOpacity="0" />
        </radialGradient>
      </defs>

      {withCorona && <circle cx="100" cy="100" r="96" fill={`url(#${glowId})`} />}

      <circle
        cx="100"
        cy="100"
        r="68"
        stroke={`url(#${gradId})`}
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}
