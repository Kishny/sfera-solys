// src/components/ui/Sun.tsx

import { cn } from "@/lib/utils";

export interface SunProps {
  /** Taille en pixels (largeur = hauteur). */
  size?: number;
  className?: string;
  /** Ajoute des rayons solaires discrets autour du disque. */
  withRays?: boolean;
  /** Rotation lente et continue (respecte prefers-reduced-motion). */
  animated?: boolean;
  /** Purement décoratif (aria-hidden) plutôt qu'une image porteuse de sens. */
  decorative?: boolean;
}

/**
 * Signature de marque Sfera'Solys — le soleil en éclipse : un disque teal
 * qui mord un disque orange. Réutilisable en hero, séparateur ou état vide.
 *
 * @example
 * <Sun size={160} withRays />
 * <Sun size={48} decorative />   // usage purement ornemental
 */
export function Sun({
  size = 96,
  className,
  withRays = false,
  animated = false,
  decorative = false,
}: SunProps) {
  const a11yProps = decorative
    ? { "aria-hidden": true as const }
    : { role: "img" as const, "aria-label": "Sfera'Solys — soleil en éclipse" };

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      {...a11yProps}
      className={cn(
        animated && "motion-safe:animate-[spin_40s_linear_infinite]",
        className
      )}
    >
      {withRays && (
        <g className="stroke-orange/40" strokeWidth={2} strokeLinecap="round">
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * Math.PI) / 6;
            const x1 = 50 + Math.cos(angle) * 42;
            const y1 = 50 + Math.sin(angle) * 42;
            const x2 = 50 + Math.cos(angle) * 48;
            const y2 = 50 + Math.sin(angle) * 48;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </g>
      )}
      {/* Disque solaire */}
      <circle cx="45" cy="50" r="32" className="fill-orange" />
      {/* Disque teal qui « mord » le disque orange */}
      <circle cx="66" cy="42" r="27" className="fill-teal" />
    </svg>
  );
}
