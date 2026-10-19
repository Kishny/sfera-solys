// src/app/admin/_composants/OngletSignalements.tsx

"use client";

import { motion } from "framer-motion";
import { Loader2, RefreshCw } from "lucide-react";

import { formatDate, reasonLabel, type AdminReport } from "./types";

const STATUT = {
  pending: {
    libelle: "En attente",
    style: "border-cuivre/20 bg-cuivre/10 text-champagne",
  },
  reviewed: { libelle: "Traité", style: "border-succes/20 bg-succes/10 text-succes" },
  dismissed: {
    libelle: "Ignoré",
    style: "border-champagne/10 bg-champagne/5 text-champagne/60",
  },
} as const;

export default function OngletSignalements({
  reports,
  isLoading,
  actionLoading,
  onRefresh,
  onBan,
  onResolve,
}: {
  reports: AdminReport[];
  isLoading: boolean;
  actionLoading: string | null;
  onRefresh: () => void;
  onBan: (userId: string, pseudonyme: string) => void;
  onResolve: (reportId: string, action: "reviewed" | "dismissed") => void;
}) {
  return (
    <motion.section
      key="reports"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm text-champagne/70">
          {reports.length} signalement{reports.length !== 1 ? "s" : ""}
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

      {!isLoading && reports.length === 0 && (
        <div className="rounded-2xl border border-champagne/10 bg-champagne/5 py-12 text-center text-champagne/55">
          Aucun signalement.
        </div>
      )}

      {reports.map((report) => {
        const statut = STATUT[report.status];

        return (
          <article
            key={report._id}
            className="space-y-3 rounded-2xl border border-champagne/10 bg-champagne/5 p-4 sm:p-5"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statut.style}`}
                >
                  {statut.libelle}
                </span>
                <span className="text-xs text-champagne/60">
                  {formatDate(report.createdAt)}
                </span>
              </div>

              <p className="text-sm font-semibold">
                Motif :{" "}
                <span className="text-champagne">
                  {reasonLabel[report.reason] || report.reason}
                </span>
              </p>

              {report.details && (
                <p className="text-xs text-champagne/60">{report.details}</p>
              )}

              <p className="text-xs text-champagne/60">
                Signalé par :{" "}
                <span className="text-champagne/70">
                  {report.reporterId?.pseudonyme || "Inconnu"}
                </span>{" "}
                → Visé :{" "}
                <span className="text-champagne/70">
                  {report.targetId?.pseudonyme || report.targetType}
                </span>
              </p>
            </div>

            {report.status === "pending" && (
              <div className="flex flex-wrap items-center gap-2">
                {report.targetId?._id && (
                  <button
                    onClick={() =>
                      onBan(
                        report.targetId!._id,
                        report.targetId?.pseudonyme || "cet utilisateur"
                      )
                    }
                    disabled={actionLoading === "ban-" + report.targetId._id}
                    className="rounded-xl bg-erreur px-4 py-2 text-xs font-bold text-nuit transition hover:bg-erreur/80 disabled:opacity-50"
                  >
                    Bannir
                  </button>
                )}

                <button
                  onClick={() => onResolve(report._id, "reviewed")}
                  disabled={actionLoading === report._id + "reviewed"}
                  className="rounded-xl border border-succes/30 bg-succes/20 px-4 py-2 text-xs text-succes transition hover:bg-succes/30 disabled:opacity-50"
                >
                  Marquer traité
                </button>

                <button
                  onClick={() => onResolve(report._id, "dismissed")}
                  disabled={actionLoading === report._id + "dismissed"}
                  className="rounded-xl border border-champagne/10 bg-champagne/5 px-4 py-2 text-xs text-champagne/60 transition hover:bg-champagne/10 disabled:opacity-50"
                >
                  Ignorer
                </button>
              </div>
            )}
          </article>
        );
      })}
    </motion.section>
  );
}
