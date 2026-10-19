// src/components/ui/Logo.tsx

import Link from "next/link";

import EclipseMark from "@/components/brand/EclipseMark";
import { cn } from "@/lib/utils";

export type LogoSize = "sm" | "md" | "lg" | "xl";

interface LogoProps {
  /** Lien de destination. `null` pour un rendu statique (non cliquable). */
  href?: string | null;
  size?: LogoSize;
  /** Anneau d'éclipse à gauche du mot-symbole. */
  withMark?: boolean;
  /** Accroche en petites capitales sous le mot-symbole. */
  tagline?: string;
  className?: string;
  /**
   * Identifiant du dégradé de l'anneau. Deux logos sur une même page — un
   * dans l'en-tête, un dans le pied — doivent en recevoir deux différents.
   */
  markId?: string;
}

const sizeStyles: Record<LogoSize, string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-5xl",
};

const markStyles: Record<LogoSize, string> = {
  sm: "h-6 w-6",
  md: "h-9 w-9",
  lg: "h-11 w-11",
  xl: "h-16 w-16",
};

const taglineStyles: Record<LogoSize, string> = {
  sm: "text-[7px]",
  md: "text-[8px]",
  lg: "text-[9px]",
  xl: "text-[11px]",
};

/**
 * Mot-symbole « Sfera'Solys ».
 *
 * ## Ce qui change avec la direction « nuit cuivrée »
 *
 * L'apostrophe était remplacée par un **point cuivré** : c'était la
 * signature de la charte précédente, où le disque solaire était le motif
 * central. La maquette rend l'apostrophe à sa fonction de ponctuation et
 * déplace la signature à gauche du mot, sous la forme de l'anneau
 * d'éclipse. Le point n'avait de sens que tant que la marque était un
 * disque.
 *
 * L'accroche en petites capitales est une **prop**, pas une constante : les
 * maquettes en proposent trois différentes (« rencontres sérieuses pour
 * hommes exigeants », « plus que des rencontres, des horizons partagés »,
 * « rencontres d'exception »). Tant qu'aucune n'est arrêtée, le composant
 * n'en impose aucune et n'affiche rien par défaut — plutôt que d'en figer
 * une par accident dans l'en-tête.
 *
 * @example
 * <Logo />                                  // lien vers "/", mot seul
 * <Logo withMark markId="entete" />         // avec l'anneau
 * <Logo href={null} size="sm" markId="pied" />
 */
export function Logo({
  href = "/",
  size = "md",
  withMark = false,
  tagline,
  className,
  markId = "logo",
}: LogoProps) {
  const mark = (
    <span className="inline-flex items-center gap-2.5">
      {withMark && (
        <EclipseMark
          id={markId}
          className={cn("shrink-0", markStyles[size])}
        />
      )}

      <span className="inline-flex flex-col">
        <span
          aria-hidden="true"
          className={cn(
            "font-display font-normal leading-none tracking-tight text-ivoire",
            sizeStyles[size]
          )}
        >
          Sfera&rsquo;Solys
        </span>

        {tagline && (
          <span
            aria-hidden="true"
            className={cn(
              "mt-1 font-semibold uppercase leading-tight tracking-surtitre text-champagne/55",
              taglineStyles[size]
            )}
          >
            {tagline}
          </span>
        )}
      </span>
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label="Sfera'Solys — retour à l'accueil"
        className={cn("inline-flex items-center outline-none", className)}
      >
        {mark}
      </Link>
    );
  }

  return (
    <span
      role="img"
      aria-label="Sfera'Solys"
      className={cn("inline-flex items-center", className)}
    >
      {mark}
    </span>
  );
}
