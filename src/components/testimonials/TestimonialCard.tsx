import StarRating from "./StarRating";

/**
 * Témoignage public tel qu'exposé par GET /api/testimonials.
 * L'avatar n'est présent que si le membre a consenti à l'afficher.
 */
export interface PublicTestimonial {
  _id: string;
  authorName: string;
  age?: number;
  city?: string;
  content: string;
  rating: number;
  avatar?: string | null;
  featured?: boolean;
  createdAt?: string;
}

/**
 * Carte de témoignage Sfera'Solys.
 *
 * Composant présentational réutilisé sur :
 * - la page dédiée /temoignages (variante sombre) ;
 * - la page /valeurs et /circle (variante claire, pas encore migrées).
 *
 * `variant` vaut "light" par défaut : les pages au fond clair qui utilisent
 * déjà ce composant n'ont rien à changer. Les pages passées à l'identité
 * sombre de la direction A passent explicitement "dark".
 */
export default function TestimonialCard({
  testimonial,
  className = "",
  variant = "light",
}: {
  testimonial: PublicTestimonial;
  className?: string;
  variant?: "light" | "dark";
}) {
  const { authorName, age, city, content, rating, avatar, featured } =
    testimonial;
  const initial = authorName?.[0]?.toUpperCase() ?? "S";
  const isDark = variant === "dark";

  const surfaceClass = isDark
    ? featured
      ? "bg-[#0C222D] border-orange/40 ring-1 ring-orange/20"
      : "bg-[#0C222D] border-cream/8"
    : featured
      ? "bg-white border-orange/40 shadow-[0_12px_34px_-12px_rgba(255,65,3,0.35)] ring-1 ring-orange/30"
      : "bg-white border-orange/15 shadow-[0_10px_30px_-12px_rgba(107,27,2,0.25)]";

  return (
    <figure
      className={`relative flex h-full flex-col overflow-hidden rounded-3xl border p-5 sm:p-6 ${surfaceClass} ${className}`}
    >
      {/* Guillemet décoratif */}
      <span className="pointer-events-none absolute right-4 top-2 select-none text-5xl text-orange/10 sm:text-6xl">
        &quot;
      </span>

      {featured && (
        <span
          className={
            isDark
              ? "relative z-10 mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-lime px-2.5 py-0.5 text-[11px] font-bold text-abyss"
              : "relative z-10 mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-gradient-to-r from-orange to-rust px-2.5 py-0.5 text-[11px] font-bold text-cream shadow-sm"
          }
        >
          À la une
        </span>
      )}

      <StarRating
        value={rating}
        readOnly
        size={16}
        variant={variant}
        className="relative z-10 mb-3"
      />

      <blockquote
        className={
          isDark
            ? "relative z-10 mb-5 flex-1 text-sm font-light leading-relaxed text-cream/85 sm:text-base"
            : "relative z-10 mb-5 flex-1 text-sm font-light leading-relaxed text-abyss sm:text-base"
        }
      >
        « {content} »
      </blockquote>

      <figcaption className="relative z-10 flex items-center gap-3">
        <div
          className={
            isDark
              ? "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange text-base font-bold text-abyss"
              : "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-orange to-rust text-base font-bold text-cream"
          }
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt={authorName}
              className="h-full w-full object-cover"
            />
          ) : (
            initial
          )}
        </div>

        <div className="min-w-0">
          <div
            className={
              isDark
                ? "truncate text-sm font-semibold text-cream"
                : "truncate text-sm font-semibold text-abyss"
            }
          >
            {authorName}
            {age ? `, ${age} ans` : ""}
          </div>

          <div
            className={
              isDark
                ? "truncate text-xs text-cream/55"
                : "truncate text-xs text-rust"
            }
          >
            {city ? `${city} · ` : ""}Membre Sfera&apos;Solys
          </div>
        </div>
      </figcaption>
    </figure>
  );
}
