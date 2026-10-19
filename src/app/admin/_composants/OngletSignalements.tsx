// src/app/admin/_composants/OngletSignalements.tsx

"use client";

import { motion } from "framer-motion";
import { Loader2, RefreshCw } from "lucide-react";

import { formatDate, reasonLabel, type AdminReport } from "./types";

const STATUT = {
  pending: {
    libelle: "En attente",
    style: "border-orange/20 bg-orange/10 text-cream",
  },
  reviewed: { libelle: "Traité", style: "border-lime/20 bg-lime/10 text-lime" },
  dismissed: {
    libelle: "Ignoré",
    style: "border-cream/10 bg-cream/5 text-cream/60",
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
        <p className="text-sm text-cream/70">
          {reports.length} signalement{reports.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1 text-xs text-cream/60 transition hover:text-cream"
        >
          <RefreshCw className="h-3 w-3" />
          Actualiser
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-cream" />
        </div>
      )}

      {!isLoading && reports.length === 0 && (
        <div className="rounded-2xl border border-cream/10 bg-cream/5 py-12 text-center text-cream/55">
          Aucun signalement.
        </div>
      )}

      {reports.map((report) => {
        const statut = STATUT[report.status];

        return (
          <article
            key={report._id}
            className="space-y-3 rounded-2xl border border-cream/10 bg-cream/5 p-4 sm:p-5"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statut.style}`}
                >
                  {statut.libelle}
                </span>
                <span className="text-xs text-cream/60">
                  {formatDate(report.createdAt)}
                </span>
              </div>

              <p className="text-sm font-semibold">
                Motif :{" "}
                <span className="text-cream">
                  {reasonLabel[report.reason] || report.reason}
                </span>
              </p>

              {report.details && (
                <p className="text-xs text-cream/60">{report.details}</p>
              )}

              <p className="text-xs text-cream/60">
                Signalé par :{" "}
                <span className="text-cream/70">
                  {report.reporterId?.pseudonyme || "Inconnu"}
                </span>{" "}
                → Visé :{" "}
                <span className="text-cream/70">
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
                    className="rounded-xl bg-rust px-4 py-2 text-xs font-bold text-cream transition hover:bg-rust/80 disabled:opacity-50"
                  >
                    Bannir
                  </button>
                )}

                <button
                  onClick={() => onResolve(report._id, "reviewed")}
                  disabled={actionLoading === report._id + "reviewed"}
                  className="rounded-xl border border-lime/30 bg-lime/20 px-4 py-2 text-xs text-lime transition hover:bg-lime/30 disabled:opacity-50"
                >
                  Marquer traité
                </button>

                <button
                  onClick={() => onResolve(report._id, "dismissed")}
                  disabled={actionLoading === report._id + "dismissed"}
                  className="rounded-xl border border-cream/10 bg-cream/5 px-4 py-2 text-xs text-cream/60 transition hover:bg-cream/10 disabled:opacity-50"
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
