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
 * Composant présentationnel, rendu par TestimonialsExplorer sur
 * /temoignages.
 *
 * Il portait une prop `variant` et une seconde série de classes pour un
 * fond clair, héritées de SferaLuna. Sa documentation annonçait un usage
 * sur /valeurs et /circle : ces pages n'importent que le type
 * `PublicTestimonial`, jamais le composant. La variante claire n'était donc
 * atteignable par aucun chemin, et elle a été retirée.
 */
export default function TestimonialCard({
  testimonial,
  className = "",
}: {
  testimonial: PublicTestimonial;
  className?: string;
}) {
  const { authorName, age, city, content, rating, avatar, featured } =
    testimonial;
  const initial = authorName?.[0]?.toUpperCase() ?? "S";

  const surfaceClass = featured
    ? "bg-[#123243] border-orange/40 ring-1 ring-orange/20"
    : "bg-[#123243] border-cream/8";

  return (
    <figure
      className={`relative flex h-full flex-col overflow-hidden rounded-3xl border p-5 sm:p-6 ${surfaceClass} ${className}`}
    >
      {/* Guillemet décoratif */}
      <span className="pointer-events-none absolute right-4 top-2 select-none text-5xl text-orange/10 sm:text-6xl">
        &quot;
      </span>

      {featured && (
        <span className="relative z-10 mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-lime px-2.5 py-0.5 text-[11px] font-bold text-abyss">
          À la une
        </span>
      )}

      <StarRating value={rating} readOnly size={16} className="relative z-10 mb-3" />

      <blockquote className="relative z-10 mb-5 flex-1 text-sm font-light leading-relaxed text-cream/85 sm:text-base">
        « {content} »
      </blockquote>

      <figcaption className="relative z-10 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange text-base font-bold text-abyss">
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
          <div className="truncate text-sm font-semibold text-cream">
            {authorName}
            {age ? `, ${age} ans` : ""}
          </div>

          <div className="truncate text-xs text-cream/55">
            {city ? `${city} · ` : ""}Membre Sfera&apos;Solys
          </div>
        </div>
      </figcaption>
    </figure>
  );
}
