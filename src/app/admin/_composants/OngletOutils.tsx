// src/app/admin/_composants/OngletOutils.tsx

"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2, Trash2 } from "lucide-react";

import { resetTargets, type ResetTarget } from "./types";

export default function OngletOutils({
  actionLoading,
  resetMessage,
  onCloseMessage,
  onReset,
}: {
  actionLoading: string | null;
  resetMessage: string | null;
  onCloseMessage: () => void;
  onReset: (target: ResetTarget, confirmMessage: string) => void;
}) {
  return (
    <motion.section
      key="tools"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="rounded-2xl border border-rust/20 bg-rust/5 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-cream">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          Zone sensible
        </p>
        <p className="mt-1 text-xs text-cream/60">
          Ces actions suppriment définitivement des données pour l&apos;ensemble
          du site, tous les membres confondus, sans toucher aux comptes
          eux-mêmes. Utile pour repartir avec des statistiques propres après des
          tests. Irréversible.
        </p>
      </div>

      {resetMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-lime/20 bg-lime/10 px-4 py-3 text-sm text-lime">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">{resetMessage}</span>
          <button
            onClick={onCloseMessage}
            aria-label="Fermer le message"
            className="text-lime transition hover:text-cream"
          >
            ✕
          </button>
        </div>
      )}

      <div className="space-y-3">
        {resetTargets.map((rt) => (
          <div
            key={rt.id}
            className="flex flex-col gap-3 rounded-2xl border border-cream/10 bg-cream/5 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-semibold">{rt.label}</p>
              <p className="text-xs text-cream/60">{rt.description}</p>
            </div>

            <button
              onClick={() => onReset(rt.id, rt.confirmMessage)}
              disabled={actionLoading === "reset-" + rt.id}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-rust/30 bg-rust/20 px-4 py-2 text-xs font-semibold text-cream transition hover:bg-rust/30 disabled:opacity-50"
            >
              {actionLoading === "reset-" + rt.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Réinitialiser
            </button>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
