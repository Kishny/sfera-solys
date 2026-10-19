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
 * Rendu depuis TestimonialSubmitSection (/temoignages) et depuis la modale
 * de l'onglet Interactions de Mon Compte.
 *
 * Gère : contenu, note en étoiles, ville, âge, consentement photo.
 *
 * Il portait une prop `variant` dont la valeur par défaut était "light" —
 * le formulaire blanc et lavande de SferaLuna. Mon Compte le montait sans
 * passer la prop : la modale sombre s'ouvrait donc sur un formulaire clair.
 * La variante claire n'avait plus aucun appelant légitime ; elle a été
 * retirée plutôt que corrigée appel par appel.
 */
export default function TestimonialForm({
  profileImage,
  initial,
  onSuccess,
  onCancel,
}: {
  /** Photo de profil du membre, pour l'aperçu de l'opt-in. */
  profileImage?: string | null;
  /** Valeurs pré-remplies (modification d'un témoignage existant). */
  initial?: TestimonialFormInitial;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  /** Classe commune aux champs de saisie. */
  const fieldClass =
    "rounded-xl border border-champagne/15 bg-nuit/60 text-champagne placeholder-champagne/55 outline-none transition focus:border-cuivre focus:ring-2 focus:ring-cuivre/25";

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
        className="flex items-center justify-center gap-2 rounded-2xl border border-succes/30 bg-succes/[0.08] p-4 text-sm font-medium text-succes"
      >
        <CheckCircle size={18} />
        Merci ! Ton témoignage sera visible après validation.
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-champagne/10 bg-minuit p-4 sm:p-6"
    >
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-champagne sm:mb-4 sm:text-base">
        <MessageSquarePlus size={18} />
        Partage ton expérience
      </h3>

      {/* Note en étoiles */}
      <div className="mb-3 flex items-center gap-3">
        <span className="text-xs font-medium text-champagne/60">Ta note</span>
        <StarRating value={rating} onChange={setRating} size={24} />
      </div>

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Raconte-nous ton expérience… 20 à 500 caractères."
        rows={3}
        maxLength={500}
        className={`mb-1 w-full resize-none px-3 py-2.5 text-sm sm:px-4 sm:py-3 ${fieldClass}`}
      />

      <p className="mb-3 text-right text-xs text-champagne/55 sm:mb-4">
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
          min={28}
          max={99}
          className={`w-full px-3 py-2 text-sm sm:w-44 sm:px-4 ${fieldClass}`}
        />
      </div>

      {/* Consentement photo */}
      <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-xl border border-champagne/10 bg-nuit/40 px-3 py-2.5">
        <input
          type="checkbox"
          checked={showAvatar}
          onChange={(event) => setShowAvatar(event.target.checked)}
          className="h-4 w-4 shrink-0 accent-cuivre"
        />

        {showAvatar && profileImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profileImage}
            alt="Aperçu"
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
        ) : null}

        <span className="text-xs leading-snug text-champagne/70">
          Afficher ma photo de profil avec mon témoignage
          {!profileImage && (
            <span className="block text-champagne/55">
              (ajoute d&apos;abord une photo de profil pour l&apos;activer)
            </span>
          )}
        </span>
      </label>

      {status === "error" && (
        <p
          role="alert"
          className="mb-3 rounded-xl border border-erreur/50 bg-erreur/20 px-3 py-2 text-sm text-champagne"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <button
          type="submit"
          disabled={status === "loading" || content.trim().length < 20}
          className="rounded-xl bg-cuivre px-5 py-2.5 text-sm font-bold text-nuit transition-colors hover:bg-cuivre/90 disabled:opacity-50 sm:px-6"
        >
          {status === "loading" ? "Envoi…" : "Envoyer"}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-champagne/15 px-5 py-2.5 text-sm text-champagne/70 transition-colors hover:border-champagne/30 sm:px-6"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
