"use client";

import { useState } from "react";
import { Mail, Loader2, CheckCircle } from "lucide-react";

/**
 * Formulaire d'inscription à la newsletter Sfera'Solys.
 *
 * Branché sur POST /api/newsletter (stockage MongoDB + email de bienvenue +
 * synchronisation vers l'Audience Resend).
 *
 * Deux variantes visuelles :
 * - "dark"  : pour le footer (fond sombre) ;
 * - "light" : pour les sections claires (page d'accueil).
 */
export default function NewsletterSignup({
  variant = "dark",
  className = "",
}: {
  variant?: "dark" | "light";
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  const isLight = variant === "light";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus("error");
      setMessage("Adresse email invalide.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setStatus("success");
        setMessage("Inscription confirmée — à très vite ☀️");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data?.error ?? "Une erreur est survenue.");
      }
    } catch {
      setStatus("error");
      setMessage("Erreur de connexion. Réessaie.");
    }
  };

  if (status === "success") {
    return (
      <div
        className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium ${
          isLight
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-green-400/30 bg-green-500/15 text-green-200"
        } ${className}`}
      >
        <CheckCircle size={18} className="shrink-0" />
        {message}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Mail
            size={16}
            className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${
              isLight ? "text-rust" : "text-cream/60"
            }`}
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ton adresse email"
            aria-label="Adresse email"
            className={`w-full rounded-full py-2.5 pl-9 pr-4 text-sm outline-none transition ${
              isLight
                ? "border border-orange/20 bg-white text-abyss placeholder-abyss/40 focus:border-orange focus:ring-2 focus:ring-orange/20"
                : "border border-cream/15 bg-cream/[0.06] text-cream placeholder-cream/40 focus:border-orange/50"
            }`}
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className={`flex shrink-0 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
            isLight
              ? "bg-gradient-to-r from-orange to-rust text-cream hover:opacity-90"
              : "bg-cream text-rust hover:scale-[1.02]"
          }`}
        >
          {status === "loading" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            "S'inscrire"
          )}
        </button>
      </div>

      {status === "error" && (
        <p
          className={`mt-2 text-xs ${
            isLight ? "text-red-500" : "text-red-300"
          }`}
        >
          {message}
        </p>
      )}

      <p
        className={`mt-2 text-[11px] ${
          isLight ? "text-abyss/40" : "text-cream/60"
        }`}
      >
        Pas de spam. Désabonnement en un clic à tout moment.
      </p>
    </form>
  );
}
