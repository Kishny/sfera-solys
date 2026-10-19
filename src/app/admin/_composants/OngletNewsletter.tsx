// src/app/admin/_composants/OngletNewsletter.tsx

"use client";

import { motion } from "framer-motion";
import { AlertCircle, Mail, RefreshCw } from "lucide-react";

export default function OngletNewsletter({
  stats,
  subject,
  content,
  status,
  message,
  onSubject,
  onContent,
  onSend,
  onRefresh,
}: {
  stats: { subscriberCount: number; audienceConfigured: boolean } | null;
  subject: string;
  content: string;
  status: "idle" | "sending" | "success" | "error";
  message: string;
  onSubject: (value: string) => void;
  onContent: (value: string) => void;
  onSend: () => void;
  onRefresh: () => void;
}) {
  return (
    <motion.section
      key="newsletter"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-cream">
            <Mail className="h-4 w-4 text-orange" aria-hidden="true" />
            Newsletter &amp; actualités
          </p>
          <p className="text-xs text-cream/60">
            {stats
              ? `${stats.subscriberCount} abonné${
                  stats.subscriberCount !== 1 ? "s" : ""
                }`
              : "Chargement…"}
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1 text-xs text-cream/60 transition hover:text-cream"
        >
          <RefreshCw className="h-3 w-3" />
          Actualiser
        </button>
      </div>

      {stats && !stats.audienceConfigured && (
        <div className="flex gap-3 rounded-2xl border border-orange/20 bg-orange/10 p-4 text-xs text-cream">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Audience Resend non configurée. Crée une Audience dans le tableau de
            bord Resend, puis renseigne{" "}
            <code className="rounded bg-abyss/40 px-1">RESEND_AUDIENCE_ID</code>{" "}
            dans les variables d&apos;environnement Vercel pour activer l&apos;envoi.
          </p>
        </div>
      )}

      <div className="space-y-3 rounded-2xl border border-cream/10 bg-cream/5 p-4 sm:p-5">
        <div>
          <label
            htmlFor="newsletter-objet"
            className="mb-1 block text-xs font-medium text-cream/70"
          >
            Objet
          </label>
          <input
            id="newsletter-objet"
            type="text"
            value={subject}
            onChange={(e) => onSubject(e.target.value)}
            placeholder="Les nouveautés du mois sur Sfera'Solys"
            maxLength={120}
            className="w-full rounded-xl border border-cream/15 bg-cream/5 px-3 py-2.5 text-sm text-cream placeholder-cream/55 outline-none focus:border-orange/50"
          />
        </div>

        <div>
          <label
            htmlFor="newsletter-message"
            className="mb-1 block text-xs font-medium text-cream/70"
          >
            Message
          </label>
          <textarea
            id="newsletter-message"
            value={content}
            onChange={(e) => onContent(e.target.value)}
            rows={8}
            placeholder={
              "Écris ton actualité ici…\n\nSaute une ligne pour séparer les paragraphes. Un lien de désabonnement est ajouté automatiquement."
            }
            className="w-full resize-y rounded-xl border border-cream/15 bg-cream/5 px-3 py-2.5 text-sm text-cream placeholder-cream/55 outline-none focus:border-orange/50"
          />
        </div>

        {message && (
          <p
            role="status"
            className={`text-xs ${status === "success" ? "text-lime" : "text-cream"}`}
          >
            {message}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-cream/60">
            L&apos;envoi part vers toute l&apos;audience Resend.
          </p>
          <button
            onClick={onSend}
            disabled={status === "sending"}
            className="rounded-xl bg-orange px-5 py-2.5 text-sm font-bold text-abyss transition hover:bg-orange/90 disabled:opacity-50"
          >
            {status === "sending" ? "Envoi…" : "Envoyer la newsletter"}
          </button>
        </div>
      </div>
    </motion.section>
  );
}
