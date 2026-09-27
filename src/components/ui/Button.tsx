// src/components/ui/Button.tsx
"use client";

import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

type ButtonAsLink = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantStyles: Record<ButtonVariant, string> = {
  // CTA principal — accent solaire. Réservé aux gros éléments (jamais de
  // petit texte orange sur teal ailleurs dans le site).
  primary:
    "bg-orange text-abyss hover:bg-rust hover:text-cream focus-visible:ring-orange",
  // Bouton secondaire — surface teal.
  secondary:
    "bg-teal text-cream border border-cream/15 hover:bg-teal/80 hover:border-orange/50 focus-visible:ring-cream",
  // Bouton fantôme — contour seul, pour actions tertiaires.
  ghost:
    "bg-transparent text-cream border border-cream/25 hover:border-orange hover:bg-cream/5 focus-visible:ring-orange",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm gap-1.5",
  md: "px-6 py-3 text-base gap-2",
  lg: "px-8 py-4 text-lg gap-2.5",
};

const baseStyles =
  "inline-flex items-center justify-center rounded-full font-display [font-stretch:125%] tracking-wide transition-colors duration-200 motion-reduce:transition-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss";

function isLinkProps(
  rest: Record<string, unknown>
): rest is AnchorHTMLAttributes<HTMLAnchorElement> & { href: string } {
  return typeof rest.href === "string";
}

/**
 * Bouton Sfera'Solys — variantes `primary` (orange, CTA), `secondary`
 * (teal), `ghost` (contour). Se rend en `<Link>` si `href` est fourni,
 * sinon en `<button>`.
 *
 * @example
 * <Button variant="primary" size="lg">Rejoindre</Button>
 * <Button variant="secondary" href="/tarifs">Voir les offres</Button>
 */
export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  fullWidth = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = cn(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && "w-full",
    className
  );

  const spinner = isLoading ? (
    <Loader2
      className="h-4 w-4 animate-spin motion-reduce:animate-none"
      aria-hidden="true"
    />
  ) : null;

  if (isLinkProps(rest)) {
    return (
      <Link {...rest} className={classes} aria-busy={isLoading || undefined}>
        {spinner}
        {children}
      </Link>
    );
  }

  const buttonRest = rest as Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "children"
  >;

  return (
    <button
      type="button"
      {...buttonRest}
      className={classes}
      disabled={isLoading || buttonRest.disabled}
      aria-busy={isLoading || undefined}
    >
      {spinner}
      {children}
    </button>
  );
}
