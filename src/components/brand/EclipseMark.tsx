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
  /**
   * Épaisseur du trait, dans le repère du viewBox (200 × 200).
   *
   * Elle compte plus qu'il n'y paraît. À 6, l'anneau rendu dans l'en-tête
   * à 36 px donnait un trait d'un pixel : le dégradé disparaissait et le
   * motif se lisait comme un cercle gris. Plus le logo est petit, plus le
   * trait doit être épais en proportion.
   */
  strokeWidth = 11,
}: {
  id: string;
  className?: string;
  withCorona?: boolean;
  strokeWidth?: number;
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
        <linearGradient id={gradId} x1="85%" y1="15%" x2="10%" y2="95%">
          <stop offset="0%" stopColor="#866137" stopOpacity="0.12" />
          <stop offset="30%" stopColor="#866137" stopOpacity="0.5" />
          <stop offset="62%" stopColor="#BD9365" />
          <stop offset="85%" stopColor="#EAD9BD" />
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
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
