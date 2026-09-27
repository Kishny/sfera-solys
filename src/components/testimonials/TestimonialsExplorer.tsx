"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import TestimonialCard, { PublicTestimonial } from "./TestimonialCard";

type SortKey = "recent" | "rating";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Plus récents" },
  { key: "rating", label: "Mieux notés" },
];

/**
 * Explorateur de témoignages (page /temoignages).
 *
 * - Tri : plus récents / mieux notés.
 * - Pagination progressive via « Charger plus » (par paquets de `pageSize`).
 *
 * Reçoit la liste complète (rendue côté serveur pour le SEO) et gère
 * l'affichage côté client.
 */
export default function TestimonialsExplorer({
  testimonials,
  pageSize = 12,
  variant = "light",
}: {
  testimonials: PublicTestimonial[];
  pageSize?: number;
  variant?: "light" | "dark";
}) {
  const [sort, setSort] = useState<SortKey>("recent");
  const [visible, setVisible] = useState(pageSize);
  const isDark = variant === "dark";

  const sorted = useMemo(() => {
    const byRecent = (a: PublicTestimonial, b: PublicTestimonial) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime();

    const byRating = (a: PublicTestimonial, b: PublicTestimonial) => {
      const diff = (b.rating || 0) - (a.rating || 0);
      return diff !== 0 ? diff : byRecent(a, b);
    };

    const compare = sort === "rating" ? byRating : byRecent;

    // Les témoignages "À la une" restent toujours en tête, puis on applique
    // le tri choisi à l'intérieur de chaque groupe.
    return [...testimonials].sort((a, b) => {
      const fa = a.featured ? 1 : 0;
      const fb = b.featured ? 1 : 0;
      if (fa !== fb) return fb - fa;
      return compare(a, b);
    });
  }, [testimonials, sort]);

  const shown = sorted.slice(0, visible);
  const hasMore = visible < sorted.length;

  return (
    <div>
      {/* Barre de tri */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-7">
        <p className={isDark ? "text-sm text-cream/55" : "text-sm text-[#666]"}>
          {sorted.length} témoignage{sorted.length > 1 ? "s" : ""}
        </p>

        <div
          className={
            isDark
              ? "flex items-center gap-1.5 rounded-full border border-cream/10 bg-[#0C222D] p-1"
              : "flex items-center gap-1.5 rounded-full border border-[#E8E0FF] bg-white p-1"
          }
        >
          {SORTS.map((option) => {
            const isActive = sort === option.key;

            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  setSort(option.key);
                  setVisible(pageSize);
                }}
                className={`fx-btn rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 sm:text-sm ${
                  isDark
                    ? isActive
                      ? "bg-orange text-abyss"
                      : "text-cream/60 hover:text-cream"
                    : isActive
                      ? "bg-gradient-to-r from-[#8E7AB5] to-[#A68BC9] text-white"
                      : "text-[#5B4B8A] hover:bg-[#F0ECFA]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grille */}
      <motion.div
        layout
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {shown.map((testimonial) => (
          <TestimonialCard
            key={testimonial._id}
            testimonial={testimonial}
            variant={variant}
          />
        ))}
      </motion.div>

      {/* Charger plus */}
      {hasMore && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + pageSize)}
            className={
              isDark
                ? "inline-flex items-center gap-2 rounded-xl border border-cream/15 px-6 py-2.5 text-sm font-semibold text-cream/85 transition-colors hover:border-cream/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss"
                : "inline-flex items-center gap-2 rounded-full border border-[#8E7AB5] px-6 py-2.5 text-sm font-semibold text-[#8E7AB5] transition-all hover:bg-[#8E7AB5] hover:text-white"
            }
          >
            Charger plus
            <span className="text-xs text-current opacity-70">
              ({sorted.length - visible} restant
              {sorted.length - visible > 1 ? "s" : ""})
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
