"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, MessageSquarePlus } from "lucide-react";
import StarRating from "./StarRating";

export interface TestimonialFormInitial {
  content?: string;
  age?: number;
  city?: string;
  rating?: number;
  showAvatar?: boolean;
}

/**
 * Formulaire de témoignage partagé Sfera'Solys.
 *
 * Réutilisé sur :
 * - /valeurs (variante claire) ;
 * - /temoignages (variante sombre) ;
 * - la bannière d'incitation dans Mon Compte (en modal).
 *
 * Gère : contenu, note en étoiles, ville, âge, consentement photo.
 *
 * `variant` vaut "light" par défaut : les pages au fond clair pas encore
 * migrées vers l'identité sombre n'ont rien à changer.
 */
export default function TestimonialForm({
  profileImage,
  initial,
  onSuccess,
  onCancel,
  variant = "light",
}: {
  /** Photo de profil du membre, pour l'aperçu de l'opt-in. */
  profileImage?: string | null;
  /** Valeurs pré-remplies (modification d'un témoignage existant). */
  initial?: TestimonialFormInitial;
  onSuccess?: () => void;
  onCancel?: () => void;
  variant?: "light" | "dark";
}) {
  const isDark = variant === "dark";

  /** Classe commune aux champs de saisie, déclinée par variante. */
  const fieldClass = isDark
    ? "rounded-xl border border-cream/15 bg-abyss/60 text-cream placeholder-cream/55 outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/25"
    : "rounded-xl border border-[#E8E0FF] text-[#1C1C1C] placeholder-[#999] outline-none transition focus:border-[#8E7AB5] focus:ring-2 focus:ring-[#8E7AB5]/20";
  const [content, setContent] = useState(initial?.content ?? "");
  const [rating, setRating] = useState(initial?.rating ?? 5);
  const [city, setCity] = useState(initial?.city ?? "");
  const [age, setAge] = useState(initial?.age ? String(initial.age) : "");
  const [showAvatar, setShowAvatar] = useState(initial?.showAvatar ?? false);

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          rating,
          city: city.trim() || undefined,
          age: age ? Number(age) : undefined,
          showAvatar,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setError(data?.error ?? "Une erreur est survenue.");
        setStatus("error");
        return;
      }

      setStatus("success");
      onSuccess?.();
    } catch {
      setError("Erreur de connexion au serveur.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className={
          isDark
            ? "flex items-center justify-center gap-2 rounded-2xl border border-lime/30 bg-lime/[0.08] p-4 text-sm font-medium text-lime"
            : "flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700"
        }
      >
        <CheckCircle size={18} />
        Merci ! Ton témoignage sera visible après validation.
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        isDark
          ? "rounded-3xl border border-cream/10 bg-[#123243] p-4 sm:p-6"
          : "rounded-3xl border border-[#E8E0FF] bg-white p-4 shadow-lg sm:p-6"
      }
    >
      <h3
        className={
          isDark
            ? "mb-3 flex items-center gap-2 text-sm font-semibold text-cream sm:mb-4 sm:text-base"
            : "mb-3 flex items-center gap-2 text-sm font-semibold text-[#5B4B8A] sm:mb-4 sm:text-base"
        }
      >
        <MessageSquarePlus size={18} />
        Partage ton expérience
      </h3>

      {/* Note en étoiles */}
      <div className="mb-3 flex items-center gap-3">
        <span
          className={
            isDark
              ? "text-xs font-medium text-cream/60"
              : "text-xs font-medium text-[#666]"
          }
        >
          Ta note
        </span>
        <StarRating
          value={rating}
          onChange={setRating}
          size={24}
          variant={variant}
        />
      </div>

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Raconte-nous ton expérience… 20 à 500 caractères."
        rows={3}
        maxLength={500}
        className={`mb-1 w-full resize-none px-3 py-2.5 text-sm sm:px-4 sm:py-3 ${fieldClass}`}
      />

      <p
        className={
          isDark
            ? "mb-3 text-right text-xs text-cream/55 sm:mb-4"
            : "mb-3 text-right text-xs text-[#999] sm:mb-4"
        }
      >
        {content.length}/500
      </p>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:gap-3">
        <input
          type="text"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="Ville (optionnel)"
          maxLength={60}
          className={`w-full px-3 py-2 text-sm sm:px-4 ${fieldClass}`}
        />

        <input
          type="number"
          value={age}
          onChange={(event) => setAge(event.target.value)}
          placeholder="Âge (optionnel)"
          min={18}
          max={99}
          className={`w-full px-3 py-2 text-sm sm:w-44 sm:px-4 ${fieldClass}`}
        />
      </div>

      {/* Consentement photo */}
      <label
        className={
          isDark
            ? "mb-4 flex cursor-pointer items-center gap-3 rounded-xl border border-cream/10 bg-abyss/40 px-3 py-2.5"
            : "mb-4 flex cursor-pointer items-center gap-3 rounded-xl border border-[#F0ECFA] bg-[#faf9ff] px-3 py-2.5"
        }
      >
        <input
          type="checkbox"
          checked={showAvatar}
          onChange={(event) => setShowAvatar(event.target.checked)}
          className={
            isDark
              ? "h-4 w-4 shrink-0 accent-orange"
              : "h-4 w-4 shrink-0 accent-[#8E7AB5]"
          }
        />

        {showAvatar && profileImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profileImage}
            alt="Aperçu"
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
        ) : null}

        <span
          className={
            isDark
              ? "text-xs leading-snug text-cream/70"
              : "text-xs leading-snug text-[#5B4B8A]"
          }
        >
          Afficher ma photo de profil avec mon témoignage
          {!profileImage && (
            <span className={isDark ? "block text-cream/55" : "block text-[#999]"}>
              (ajoute d&apos;abord une photo de profil pour l&apos;activer)
            </span>
          )}
        </span>
      </label>

      {status === "error" && (
        <p className={isDark ? "mb-3 text-sm text-red-400" : "mb-3 text-sm text-red-500"}>
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <button
          type="submit"
          disabled={status === "loading" || content.trim().length < 20}
          className={
            isDark
              ? "rounded-xl bg-orange px-5 py-2.5 text-sm font-bold text-abyss transition-colors hover:bg-orange/90 disabled:opacity-50 sm:px-6"
              : "rounded-full bg-gradient-to-r from-[#8E7AB5] to-[#A68BC9] px-5 py-2.5 text-sm font-medium text-white transition-all hover:shadow-lg disabled:opacity-50 sm:px-6"
          }
        >
          {status === "loading" ? "Envoi…" : "Envoyer"}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={
              isDark
                ? "rounded-xl border border-cream/15 px-5 py-2.5 text-sm text-cream/70 transition-colors hover:border-cream/30 sm:px-6"
                : "rounded-full border border-[#E8E0FF] px-5 py-2.5 text-sm text-[#666] transition-all hover:border-[#8E7AB5] sm:px-6"
            }
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
