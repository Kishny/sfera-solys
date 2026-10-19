// src/app/admin/_composants/OngletDashboard.tsx

"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Bell,
  ChevronRight,
  Crown,
  Heart,
  MessageCircle,
  MoreHorizontal,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserRound,
  Users,
  UserX,
} from "lucide-react";

import GraphiqueActivite from "./GraphiqueActivite";
import RepartitionPlans from "./RepartitionPlans";
import {
  effectivePlan,
  formatDate,
  formatNumber,
  memberStatus,
  memberStatusStyle,
  planBadgeColor,
  reasonLabel,
  type AdminReport,
  type AdminStats,
  type AdminUser,
} from "./types";

/**
 * Onglet Dashboard : cartes de synthèse, graphiques, derniers inscrits,
 * signalements en attente et résiliations.
 *
 * Les cinq cartes du haut étaient peintes chacune d'une couleur différente
 * — un arc-en-ciel où la couleur n'encodait rien. Elles partagent désormais
 * une seule surface, et seule la flèche de tendance porte une couleur.
 */
export default function OngletDashboard({
  stats,
  recentUsers,
  pendingReports,
  onVoirUtilisateurs,
  onVoirSignalements,
}: {
  stats: AdminStats;
  recentUsers: AdminUser[];
  pendingReports: AdminReport[];
  onVoirUtilisateurs: () => void;
  onVoirSignalements: () => void;
}) {
  const cartes = [
    {
      icon: Users,
      label: "Total Utilisateurs",
      value: formatNumber(stats.users.total),
      sub: `+${stats.users.newLast7days} cette semaine`,
      trend: "up" as const,
    },
    {
      icon: Activity,
      label: "Membres Actifs",
      value: formatNumber(stats.users.active24h),
      sub: "connectés / 24h",
      trend: "up" as const,
    },
    {
      icon: UserX,
      label: "Membres Inactifs",
      value: formatNumber(stats.users.inactive),
      sub: "aucune activité 30j",
      trend: "down" as const,
    },
    {
      icon: Heart,
      label: "Matches Actifs",
      value: formatNumber(stats.matches.active),
      sub: `+${stats.matches.last7days} cette semaine`,
      trend: "up" as const,
    },
    {
      icon: MessageCircle,
      label: "Messages (auj.)",
      value: formatNumber(stats.messages.today),
      sub: `${formatNumber(stats.messages.last7days)} / 7j`,
      trend: "up" as const,
    },
  ];

  return (
    <motion.section
      key="dashboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Cartes de synthèse */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {cartes.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-2xl border border-cream/8 bg-[#123243] p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-xl bg-orange/15 p-2 text-orange">
                <s.icon className="h-4 w-4" />
              </div>
              {s.trend === "up" ? (
                <TrendingUp className="h-3.5 w-3.5 text-lime" aria-label="En hausse" />
              ) : (
                <TrendingDown
                  className="h-3.5 w-3.5 text-orange"
                  aria-label="En baisse"
                />
              )}
            </div>
            <p className="text-2xl font-bold tracking-tight">{s.value}</p>
            <p className="mt-0.5 text-xs text-cream/60">{s.label}</p>
            <p className="mt-1.5 text-[11px] font-medium text-cream">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Inscrits · rétention · revenus */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-cream/10 bg-cream/[0.04] p-5 backdrop-blur-sm">
          <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-cream/70">
            <UserRound className="h-4 w-4 text-cream" />
            Nouveaux inscrits
          </p>
          <div className="grid grid-cols-3 divide-x divide-cream/10">
            {[
              { k: "Aujourd'hui", v: stats.users.newToday },
              { k: "Semaine", v: stats.users.newLast7days },
              { k: "Mois", v: stats.users.newLast30days },
            ].map((c) => (
              <div key={c.k} className="px-2 text-center first:pl-0 last:pr-0">
                <p className="text-2xl font-bold">{formatNumber(c.v)}</p>
                <p className="mt-0.5 text-[11px] text-cream/60">{c.k}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-cream/10 bg-cream/[0.04] p-5 backdrop-blur-sm">
          <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-cream/70">
            <Activity className="h-4 w-4 text-lime" />
            Taux de rétention
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-lime">
                {stats.users.retentionRate} %
              </p>
              <p className="mt-1 text-[11px] text-cream/60">
                membres &gt; 30j revenus / 30j
              </p>
            </div>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-cream/10">
              <div
                className="h-full rounded-full bg-lime"
                style={{ width: `${stats.users.retentionRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-orange/30 bg-[#123243] p-5">
          <p className="mb-4 flex items-center justify-between gap-2 text-sm font-semibold text-cream/70">
            <span className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-orange" />
              Revenu du mois
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                stats.revenue.source === "stripe"
                  ? "border-lime/30 bg-lime/15 text-lime"
                  : "border-cream/15 bg-cream/5 text-cream/60"
              }`}
            >
              {stats.revenue.source === "stripe" ? "Stripe · réel" : "estimé"}
            </span>
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-orange">
                {formatNumber(stats.revenue.monthly)} €
              </p>
              <p className="mt-1 text-[11px] text-cream/60">
                {stats.revenue.source === "stripe"
                  ? `paiements encaissés · est. ${formatNumber(
                      stats.revenue.estimated
                    )} €`
                  : `${formatNumber(
                      stats.users.activeSubscriptions
                    )} abonnements actifs`}
              </p>
            </div>
            <Sparkles className="h-8 w-8 text-orange/40" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-cream/10 bg-cream/[0.04] p-5 backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Activité — 7 derniers jours</h3>
            <p className="text-xs text-cream/60">
              Inscriptions, matches &amp; messages
            </p>
          </div>
          {/* La légende est rendue par le graphique lui-même, avec les
              couleurs réellement utilisées. */}
          <GraphiqueActivite data={stats.dailySeries} />
        </div>

        <div className="rounded-2xl border border-cream/10 bg-cream/[0.04] p-5 backdrop-blur-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Répartition des plans</h3>
            <MoreHorizontal className="h-4 w-4 text-cream/55" aria-hidden="true" />
          </div>

          <RepartitionPlans
            breakdown={stats.planBreakdown}
            total={stats.users.total}
          />

          <div className="mt-5 border-t border-cream/10 pt-4">
            <p className="mb-3 text-xs font-semibold text-cream/60">
              Répartition par âge
            </p>
            <div className="space-y-2.5">
              {stats.ageDistribution.map((a) => (
                <div key={a.label} className="flex items-center gap-3 text-xs">
                  <span className="w-20 shrink-0 text-cream/70">{a.label}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream/10">
                    <div
                      className="h-full rounded-full bg-orange"
                      style={{ width: `${a.pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-cream/60">{a.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Derniers inscrits · signalements */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-cream/10 bg-cream/[0.04] backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-cream/10 px-5 py-4">
            <h3 className="text-sm font-semibold">Derniers inscrits</h3>
            <button
              onClick={onVoirUtilisateurs}
              className="flex items-center gap-1 text-xs text-cream transition hover:text-cream/70"
            >
              Voir tout <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-cream/55">
                  <th className="px-5 py-3 font-medium">Membre</th>
                  <th className="px-3 py-3 font-medium">Âge</th>
                  <th className="px-3 py-3 font-medium">Statut</th>
                  <th className="px-3 py-3 font-medium">Abonnement</th>
                  <th className="px-3 py-3 font-medium">Inscription</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-cream/55">
                      Aucun inscrit récent.
                    </td>
                  </tr>
                ) : (
                  recentUsers.map((m) => {
                    const st = memberStatus(m);
                    const ep = effectivePlan(m);
                    return (
                      <tr
                        key={m._id}
                        className="border-t border-cream/5 transition hover:bg-cream/[0.03]"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange text-xs font-bold text-abyss">
                              {m.pseudonyme.charAt(0).toUpperCase()}
                              {ep.isElite && (
                                <Crown className="absolute -right-1 -top-1 h-3.5 w-3.5 text-orange drop-shadow" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium leading-none">
                                {m.pseudonyme}
                              </p>
                              <p className="mt-1 truncate text-[11px] text-cream/55">
                                {m.localisation || m.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-cream/70">{m.age ?? "—"}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${memberStatusStyle[st]}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {st}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${ep.style}`}
                          >
                            {ep.isElite && <Crown className="h-3 w-3" />}
                            {ep.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-cream/60">
                          {formatDate(m.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-cream/10 bg-cream/[0.04] p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Bell className="h-4 w-4 text-cream" />
              Activités récentes
            </h3>
            {pendingReports.length > 0 && (
              <span className="rounded-full bg-rust/20 px-2 py-0.5 text-[10px] font-bold text-cream">
                {pendingReports.length} à traiter
              </span>
            )}
          </div>
          <div className="space-y-2.5">
            {pendingReports.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-lime/15 bg-lime/5 p-4 text-sm text-lime/80">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                Aucun signalement en attente.
              </div>
            ) : (
              pendingReports.slice(0, 5).map((r) => (
                <button
                  key={r._id}
                  onClick={onVoirSignalements}
                  className="flex w-full items-start gap-3 rounded-xl border border-cream/8 bg-cream/[0.03] p-3 text-left transition hover:bg-cream/[0.06]"
                >
                  <div className="rounded-lg border border-rust/25 bg-rust/15 p-1.5 text-cream">
                    <ShieldAlert className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">
                      {reasonLabel[r.reason] || r.reason}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-cream/60">
                      {r.reporterId?.pseudonyme || "Inconnu"} →{" "}
                      {r.targetId?.pseudonyme || r.targetType}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-cream/55">
                    {formatDate(r.createdAt)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Résiliations */}
      <div className="rounded-2xl border border-orange/15 bg-orange/[0.06] p-5 backdrop-blur-sm">
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <UserX className="h-4 w-4 text-cream" />
            Abonnements résiliés
          </h3>
          <p className="text-xs text-cream/60">
            {stats.canceled.length} résiliation
            {stats.canceled.length !== 1 ? "s" : ""} récente
            {stats.canceled.length !== 1 ? "s" : ""}
          </p>
        </div>

        {stats.canceled.length === 0 ? (
          <p className="rounded-xl border border-cream/8 bg-cream/[0.03] p-4 text-center text-sm text-cream/60">
            Aucune résiliation.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {stats.canceled.map((c, i) => (
              <div
                key={i}
                className="rounded-xl border border-cream/8 bg-cream/[0.03] p-3.5"
              >
                <div className="flex items-center justify-between">
                  <p className="truncate font-medium">{c.pseudonyme}</p>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                      planBadgeColor[c.plan] || planBadgeColor.free
                    }`}
                  >
                    {c.planLabel}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-cream/60">
                  Résilié le {formatDate(c.date)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}
