// src/components/ui/VerifiedBadge.tsx

import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type VerifiedBadgeVariant = "icon" | "label";
export type VerifiedBadgeSize = "sm" | "md";

interface VerifiedBadgeProps {
  /** `icon` : pastille compacte (superposée sur une photo). `label` : puce avec texte. */
  variant?: VerifiedBadgeVariant;
  size?: VerifiedBadgeSize;
  className?: string;
}

const iconWrapperSize: Record<VerifiedBadgeSize, string> = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
};

const iconGlyphSize: Record<VerifiedBadgeSize, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
};

const labelSize: Record<VerifiedBadgeSize, string> = {
  sm: "px-2.5 py-1 text-xs gap-1",
  md: "px-3 py-1.5 text-sm gap-1.5",
};

/**
 * Badge « Profil vérifié ». Fond orange plein (pas de petit texte orange
 * sur teal) — l'icône seule utilise un fond crème pour rester lisible en
 * superposition sur une photo.
 *
 * @example
 * <VerifiedBadge variant="icon" size="sm" />       // superposé sur une photo
 * <VerifiedBadge variant="label" />                // puce avec texte
 */
export function VerifiedBadge({
  variant = "label",
  size = "md",
  className,
}: VerifiedBadgeProps) {
  if (variant === "icon") {
    return (
      <span
        role="img"
        aria-label="Profil vérifié"
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-cream shadow-sm ring-2 ring-abyss/30",
          iconWrapperSize[size],
          className
        )}
      >
        <BadgeCheck
          className={cn("text-orange", iconGlyphSize[size])}
          aria-hidden="true"
          strokeWidth={2.25}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-orange font-sans font-semibold text-abyss",
        labelSize[size],
        className
      )}
    >
      <BadgeCheck
        className={iconGlyphSize[size]}
        aria-hidden="true"
        strokeWidth={2.5}
      />
      Profil vérifié
    </span>
  );
}
