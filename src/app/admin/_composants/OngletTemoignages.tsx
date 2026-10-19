// src/app/admin/_composants/OngletTemoignages.tsx

"use client";

import { motion } from "framer-motion";
import { Camera, Loader2, MapPin, RefreshCw, Star } from "lucide-react";

import { formatDate, type AdminTestimonial } from "./types";

const STATUT: Record<string, { libelle: string; style: string }> = {
  approved: { libelle: "Approuvé", style: "border-succes/20 bg-succes/10 text-succes" },
  rejected: { libelle: "Rejeté", style: "border-erreur/20 bg-erreur/10 text-champagne" },
  pending: {
    libelle: "En attente",
    style: "border-cuivre/20 bg-cuivre/10 text-champagne",
  },
};

/** Note en étoiles, en lecture seule. */
function Note({ valeur }: { valeur: number }) {
  return (
    <span
      className="ml-2 inline-flex items-center gap-0.5 align-middle"
      aria-label={`Note : ${valeur} sur 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3 w-3 ${n <= valeur ? "text-cuivre" : "text-champagne/25"}`}
          fill={n <= valeur ? "currentColor" : "none"}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export default function OngletTemoignages({
  testimonials,
  isLoading,
  actionLoading,
  onRefresh,
  onAction,
  onFeatured,
}: {
  testimonials: AdminTestimonial[];
  isLoading: boolean;
  actionLoading: string | null;
  onRefresh: () => void;
  onAction: (id: string, action: "approved" | "rejected" | "delete") => void;
  onFeatured: (id: string, featured: boolean) => void;
}) {
  return (
    <motion.section
      key="testimonials"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm text-champagne/70">
          {testimonials.length} témoignage{testimonials.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1 text-xs text-champagne/60 transition hover:text-champagne"
        >
          <RefreshCw className="h-3 w-3" />
          Actualiser
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-champagne" />
        </div>
      )}

      {!isLoading && testimonials.length === 0 && (
        <div className="rounded-2xl border border-champagne/10 bg-champagne/5 py-16 text-center text-champagne/60">
          Aucun témoignage pour l&apos;instant.
        </div>
      )}

      {testimonials.map((t) => {
        const statut = STATUT[t.status] ?? STATUT.pending;

        return (
          <article
            key={t._id}
            className="space-y-3 rounded-2xl border border-champagne/10 bg-champagne/5 p-4 sm:p-5"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="font-medium text-champagne">
                  {t.authorName}
                  {t.age ? `, ${t.age} ans` : ""}
                </span>

                {t.city && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs text-champagne/70">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {t.city}
                  </span>
                )}

                <Note valeur={t.rating ?? 5} />

                {t.showAvatar && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs text-champagne/60">
                    <Camera className="h-3 w-3" aria-hidden="true" />
                    photo
                  </span>
                )}

                <span className="ml-3 text-xs text-champagne/60">
                  {formatDate(t.createdAt)}
                </span>
              </div>

              <span
                className={`w-fit rounded-full border px-2 py-1 text-xs font-medium ${statut.style}`}
              >
                {statut.libelle}
              </span>
            </div>

            <p className="text-sm italic leading-relaxed text-champagne/70">
              « {t.content} »
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {t.status !== "approved" && (
                <button
                  onClick={() => onAction(t._id, "approved")}
                  disabled={actionLoading === t._id + "approved"}
                  className="rounded-lg border border-succes/30 bg-succes/20 px-3 py-1.5 text-xs font-medium text-succes transition hover:bg-succes/30 disabled:opacity-50"
                >
                  {actionLoading === t._id + "approved" ? "…" : "Approuver"}
                </button>
              )}

              {t.status !== "rejected" && (
                <button
                  onClick={() => onAction(t._id, "rejected")}
                  disabled={actionLoading === t._id + "rejected"}
                  className="rounded-lg border border-cuivre/30 bg-cuivre/20 px-3 py-1.5 text-xs font-medium text-champagne transition hover:bg-cuivre/30 disabled:opacity-50"
                >
                  {actionLoading === t._id + "rejected" ? "…" : "Rejeter"}
                </button>
              )}

              {t.status === "approved" && (
                <button
                  onClick={() => onFeatured(t._id, !t.featured)}
                  disabled={actionLoading === t._id + "featured"}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                    t.featured
                      ? "border-cuivre/40 bg-cuivre/20 text-champagne hover:bg-cuivre/30"
                      : "border-champagne/15 bg-champagne/5 text-champagne/70 hover:bg-champagne/10"
                  }`}
                >
                  {actionLoading === t._id + "featured"
                    ? "…"
                    : t.featured
                      ? "Épinglé"
                      : "Épingler"}
                </button>
              )}

              <button
                onClick={() => onAction(t._id, "delete")}
                disabled={actionLoading === t._id + "delete"}
                className="ml-auto rounded-lg border border-erreur/30 bg-erreur/20 px-3 py-1.5 text-xs font-medium text-champagne transition hover:bg-erreur/30 disabled:opacity-50"
              >
                {actionLoading === t._id + "delete" ? "…" : "Supprimer"}
              </button>
            </div>
          </article>
        );
      })}
    </motion.section>
  );
}
