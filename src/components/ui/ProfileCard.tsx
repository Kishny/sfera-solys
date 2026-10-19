// src/components/ui/ProfileCard.tsx
"use client";

import { Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { VerifiedBadge } from "./VerifiedBadge";

export interface ProfileCardProps {
  photoUrl: string;
  photoAlt?: string;
  name: string;
  age: number;
  city: string;
  tags?: string[];
  verified?: boolean;
  /** Omettre pour une vignette non interactive (ex. Circle of Six, favoris). */
  onLike?: () => void;
  onPass?: () => void;
  className?: string;
}

/**
 * Carte profil — photo, badge vérifié, identité, tags, actions like/pass.
 * Style éclipse solaire : surface teal, overlay abyss sur la photo pour la
 * lisibilité du texte, CTA like en orange.
 *
 * @example
 * <ProfileCard
 *   photoUrl="/photos/thomas.jpg"
 *   name="Thomas"
 *   age={34}
 *   city="Lyon"
 *   tags={["Voile", "Œnologie"]}
 *   verified
 *   onLike={() => likeProfile(id)}
 *   onPass={() => passProfile(id)}
 * />
 */
export function ProfileCard({
  photoUrl,
  photoAlt,
  name,
  age,
  city,
  tags = [],
  verified = false,
  onLike,
  onPass,
  className,
}: ProfileCardProps) {
  return (
    <div
      className={cn(
        "group relative flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-champagne/10 bg-minuit shadow-lg shadow-nuit/40",
        className
      )}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-nuit">
        <img
          src={photoUrl}
          alt={photoAlt || `Photo de ${name}`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-nuit via-nuit/60 to-transparent" />

        {verified && (
          <div className="absolute right-3 top-3">
            <VerifiedBadge variant="icon" size="sm" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="flex items-baseline gap-1.5 font-display text-champagne">
            <span className="text-xl">{name}</span>
            <span className="text-lg text-champagne/80">{age}</span>
          </p>
          <p className="mt-0.5 font-sans text-sm text-champagne/70">{city}</p>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pt-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-champagne/15 bg-nuit/40 px-2.5 py-1 font-sans text-xs text-champagne/90"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {(onLike || onPass) && (
        <div className="flex items-center justify-center gap-4 px-4 py-4">
          {onPass && (
            <button
              type="button"
              onClick={onPass}
              aria-label={`Passer le profil de ${name}`}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-champagne/25 text-champagne/80 transition-colors duration-200 motion-reduce:transition-none hover:border-erreur hover:bg-erreur/20 hover:text-champagne focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2 focus-visible:ring-offset-minuit"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
          {onLike && (
            <button
              type="button"
              onClick={onLike}
              aria-label={`Aimer le profil de ${name}`}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-cuivre text-nuit transition-colors duration-200 motion-reduce:transition-none hover:bg-cuivre-sombre hover:text-ivoire focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre focus-visible:ring-offset-2 focus-visible:ring-offset-minuit"
            >
              <Heart className="h-5 w-5" aria-hidden="true" fill="currentColor" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
