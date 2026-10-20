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
              isLight ? "text-erreur" : "text-champagne/70"
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
                ? "border border-cuivre/20 bg-white text-nuit placeholder-nuit/40 focus:border-cuivre focus:ring-2 focus:ring-cuivre/20"
                : "border border-champagne/20 bg-nuit/70 text-champagne placeholder-champagne/65 backdrop-blur-sm focus:border-cuivre/50"
            }`}
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className={`flex shrink-0 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
            isLight
              ? "bg-degrade-cuivre text-nuit hover:opacity-90"
              : "bg-degrade-cuivre text-nuit hover:opacity-90"
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
          className={`mt-2 inline-block rounded-lg px-2.5 py-1 text-xs ${
            isLight
              ? "text-red-500"
              : "bg-nuit/70 text-erreur backdrop-blur-sm"
          }`}
        >
          {message}
        </p>
      )}

      <p
        className={`mt-2 text-[11px] ${
          isLight ? "text-nuit/40" : "text-champagne/70"
        }`}
      >
        Pas de spam. Désabonnement en un clic à tout moment.
      </p>
    </form>
  );
}
