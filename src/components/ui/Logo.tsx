// src/components/ui/Logo.tsx

import Link from "next/link";
import { cn } from "@/lib/utils";

export type LogoSize = "sm" | "md" | "lg" | "xl";

interface LogoProps {
  /** Lien de destination. `null` pour un rendu statique (non cliquable). */
  href?: string | null;
  size?: LogoSize;
  className?: string;
}

const sizeStyles: Record<LogoSize, string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-5xl",
};

const dotStyles: Record<LogoSize, string> = {
  sm: "h-[0.16em] w-[0.16em] mb-[0.6em] mx-[0.04em]",
  md: "h-[0.16em] w-[0.16em] mb-[0.6em] mx-[0.04em]",
  lg: "h-[0.15em] w-[0.15em] mb-[0.58em] mx-[0.035em]",
  xl: "h-[0.14em] w-[0.14em] mb-[0.56em] mx-[0.03em]",
};

/**
 * Wordmark « Sfera'Solys » — Archivo, largeur expanded.
 * L'apostrophe est remplacée par un point solaire orange (signature de
 * marque), rendu en `<span>` décoratif avec un label accessible sur le
 * conteneur.
 *
 * @example
 * <Logo />                    // lien vers "/"
 * <Logo size="sm" href="/mon-compte" />
 * <Logo href={null} />        // rendu statique, ex. footer légal
 */
export function Logo({ href = "/", size = "md", className }: LogoProps) {
  const mark = (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex items-baseline font-display [font-stretch:125%] tracking-tight text-cream",
        sizeStyles[size]
      )}
    >
      <span>Sfera</span>
      <span
        className={cn(
          "inline-block shrink-0 rounded-full bg-orange",
          dotStyles[size]
        )}
      />
      <span>Solys</span>
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label="Sfera'Solys — retour à l'accueil"
        className={cn("inline-flex items-baseline outline-none", className)}
      >
        {mark}
      </Link>
    );
  }

  return (
    <span
      role="img"
      aria-label="Sfera'Solys"
      className={cn("inline-flex items-baseline", className)}
    >
      {mark}
    </span>
  );
}
