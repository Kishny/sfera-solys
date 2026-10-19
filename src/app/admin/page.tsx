// src/app/admin/page.tsx

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Crown,
  Loader2,
  LogOut,
  RefreshCw,
} from "lucide-react";

import OngletDashboard from "./_composants/OngletDashboard";
import OngletNewsletter from "./_composants/OngletNewsletter";
import OngletOutils from "./_composants/OngletOutils";
import OngletSignalements from "./_composants/OngletSignalements";
import OngletTemoignages from "./_composants/OngletTemoignages";
import OngletUtilisateurs from "./_composants/OngletUtilisateurs";
import {
  nav,
  sectionTitle,
  type AdminReport,
  type AdminStats,
  type AdminTestimonial,
  type AdminUser,
  type ResetTarget,
  type TabId,
} from "./_composants/types";

/**
 * Console d'administration Sfera'Solys.
 *
 * Ce fichier ne contient plus que la coquille : la garde d'accès, l'état
 * partagé, les appels à l'API et la navigation. Les six onglets vivent dans
 * `_composants/`, un fichier chacun.
 *
 * Avant ce découpage, tout tenait ici — 2 400 lignes, six écrans et deux
 * graphiques dans une seule fonction. La page était devenue le dernier
 * endroit du projet qu'on ne pouvait pas relire.
 *
 * La garde d'accès est doublée : la page redirige sur un 403, et les dix
 * routes `/api/admin/*` vérifient `role === "admin"` côté serveur. C'est le
 * serveur qui protège réellement ; ce qui suit n'est que du confort.
 */

/** Le soleil en éclipse : un disque sombre qui mord le disque orange. */
function MarqueEclipse() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
      <defs>
        <mask id="admin-eclipse">
          <circle cx="20" cy="20" r="14" fill="#fff" />
          <circle cx="29" cy="13" r="12" fill="#000" />
        </mask>
      </defs>
      <circle cx="20" cy="20" r="14" fill="#BD9365" mask="url(#admin-eclipse)" />
    </svg>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { status } = useSession();

  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);

  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const [reports, setReports] = useState<AdminReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  const [testimonials, setTestimonials] = useState<AdminTestimonial[]>([]);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(false);

  const [newsletterStats, setNewsletterStats] = useState<{
    subscriberCount: number;
    audienceConfigured: boolean;
  } | null>(null);
  const [nlSubject, setNlSubject] = useState("");
  const [nlContent, setNlContent] = useState("");
  const [nlStatus, setNlStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [nlMessage, setNlMessage] = useState("");

  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // ─────────────────────────────────────────────
  // Garde d'accès
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?mode=login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/admin/stats", { cache: "no-store" }).then((res) => {
        if (res.status === 403) router.replace("/");
      });
    }
  }, [status, router]);

  // ─────────────────────────────────────────────
  // Lectures
  // ─────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    setError("");

    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      const data = await res.json();

      if (!data.success) {
        if (res.status === 403) {
          router.push("/mon-compte");
          return;
        }
        setError(data.error || "Erreur de chargement.");
        return;
      }

      setStats(data.stats);
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setIsLoadingStats(false);
    }
  }, [router]);

  const fetchRecentUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users?page=1&limit=6", {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) setRecentUsers(data.users);
    } catch {
      // Silence volontaire : l'absence de cette liste ne casse rien.
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(search.length >= 2 && { search }),
        ...(planFilter !== "all" && { plan: planFilter }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });

      const res = await fetch(`/api/admin/users?${params}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
        setTotalUsers(data.pagination.total);
      }
    } catch {
      setError("Erreur de chargement des utilisateurs.");
    } finally {
      setIsLoadingUsers(false);
    }
  }, [page, search, planFilter, statusFilter]);

  const fetchReports = useCallback(async () => {
    setIsLoadingReports(true);

    try {
      const res = await fetch("/api/admin/reports");
      const data = await res.json();
      if (data.reports) setReports(data.reports);
    } catch {
      // Silence volontaire.
    } finally {
      setIsLoadingReports(false);
    }
  }, []);

  const fetchTestimonials = useCallback(async () => {
    setIsLoadingTestimonials(true);

    try {
      const res = await fetch("/api/admin/testimonials", { cache: "no-store" });
      const data = await res.json();
      if (data.success) setTestimonials(data.testimonials);
    } catch {
      // Silence volontaire.
    } finally {
      setIsLoadingTestimonials(false);
    }
  }, []);

  const fetchNewsletterStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/newsletter");
      const data = await res.json();
      if (data.success) {
        setNewsletterStats({
          subscriberCount: data.subscriberCount ?? 0,
          audienceConfigured: Boolean(data.audienceConfigured),
        });
      }
    } catch {
      // Silence volontaire.
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchStats();
      fetchRecentUsers();
      fetchReports();
    }
  }, [status, fetchStats, fetchRecentUsers, fetchReports]);

  useEffect(() => {
    if (status === "authenticated" && activeTab === "users") fetchUsers();
  }, [status, activeTab, fetchUsers]);

  useEffect(() => {
    if (status === "authenticated" && activeTab === "testimonials") {
      fetchTestimonials();
    }
  }, [status, activeTab, fetchTestimonials]);

  useEffect(() => {
    if (status === "authenticated" && activeTab === "newsletter") {
      fetchNewsletterStats();
    }
  }, [status, activeTab, fetchNewsletterStats]);

  useEffect(() => {
    setPage(1);
  }, [search, planFilter, statusFilter]);

  // ─────────────────────────────────────────────
  // Écritures
  // ─────────────────────────────────────────────

  const handleRefresh = () => {
    fetchStats();
    fetchRecentUsers();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "reports") fetchReports();
    if (activeTab === "testimonials") fetchTestimonials();
    if (activeTab === "newsletter") fetchNewsletterStats();
  };

  const handleUserAction = async (userId: string, action: string) => {
    setActionLoading(userId + action);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });

      const data = await res.json();

      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, ...data.user } : u))
        );
      } else {
        setError(data.error || "Action échouée.");
      }
    } catch {
      setError("Erreur lors de l'action.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBan = async (userId: string, pseudonyme: string) => {
    if (!confirm(`Bannir ${pseudonyme} ? Cette action désactivera son compte.`)) {
      return;
    }

    setActionLoading("ban-" + userId);

    try {
      await fetch(`/api/admin/users/${userId}/ban`, { method: "POST" });
      fetchReports();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, pseudonyme: string) => {
    if (
      !confirm(
        `Supprimer définitivement ${pseudonyme} ? Cette action est irréversible : son profil, ses likes, matchs, messages, visites, vibes, posts et son abonnement seront supprimés. Les statistiques du site se mettront à jour automatiquement.`
      )
    ) {
      return;
    }

    setActionLoading(userId + "delete");

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        setUsers((prev) => prev.filter((u) => u._id !== userId));
        setTotalUsers((prev) => Math.max(prev - 1, 0));
      } else {
        setError(data.error || "Suppression échouée.");
      }
    } catch {
      setError("Erreur lors de la suppression.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetData = async (
    target: ResetTarget,
    confirmMessage: string
  ) => {
    if (!confirm(confirmMessage)) return;

    setActionLoading("reset-" + target);
    setResetMessage(null);

    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });

      const data = await res.json();

      if (data.success) {
        setResetMessage(
          `${data.label} : ${data.deletedCount} document(s) supprimé(s).`
        );
        fetchStats();
      } else {
        setError(data.error || "Réinitialisation échouée.");
      }
    } catch {
      setError("Erreur lors de la réinitialisation.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveReport = async (
    reportId: string,
    action: "reviewed" | "dismissed"
  ) => {
    setActionLoading(reportId + action);

    try {
      await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });

      fetchReports();
    } finally {
      setActionLoading(null);
    }
  };

  const handleTestimonialAction = async (
    id: string,
    action: "approved" | "rejected" | "delete"
  ) => {
    setActionLoading(id + action);

    try {
      if (action === "delete") {
        await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
        setTestimonials((prev) => prev.filter((t) => t._id !== id));
      } else {
        const res = await fetch(`/api/admin/testimonials/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: action }),
        });

        const data = await res.json();

        if (data.success) {
          setTestimonials((prev) =>
            prev.map((t) => (t._id === id ? { ...t, status: action } : t))
          );
        }
      }
    } catch {
      // Silence volontaire.
    } finally {
      setActionLoading(null);
    }
  };

  const handleTestimonialFeatured = async (id: string, featured: boolean) => {
    setActionLoading(id + "featured");

    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured }),
      });

      const data = await res.json();

      if (data.success) {
        setTestimonials((prev) =>
          prev.map((t) => (t._id === id ? { ...t, featured } : t))
        );
      }
    } catch {
      // Silence volontaire.
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendNewsletter = async () => {
    if (nlSubject.trim().length < 3 || nlContent.trim().length < 20) {
      setNlStatus("error");
      setNlMessage("Objet (3 caractères minimum) et message (20) requis.");
      return;
    }

    setNlStatus("sending");
    setNlMessage("");

    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: nlSubject, content: nlContent }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNlStatus("success");
        setNlMessage("Newsletter envoyée à l'audience.");
        setNlSubject("");
        setNlContent("");
      } else {
        setNlStatus("error");
        setNlMessage(data.error ?? "Envoi échoué.");
      }
    } catch {
      setNlStatus("error");
      setNlMessage("Erreur de connexion.");
    }
  };

  // ─────────────────────────────────────────────
  // Rendu
  // ─────────────────────────────────────────────

  if (status === "loading" || isLoadingStats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-nuit">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-champagne" />
          <p className="text-sm text-champagne/60">Chargement du dashboard admin…</p>
        </div>
      </div>
    );
  }

  const pendingReports = reports.filter((r) => r.status === "pending");

  return (
    <div className="min-h-screen bg-nuit text-champagne antialiased">
      {/* Halos d'ambiance */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/3 h-[28rem] w-[28rem] rounded-full bg-cuivre/15 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-cuivre/12 blur-[120px]" />
        <div className="absolute top-1/2 -left-20 h-72 w-72 rounded-full bg-cuivre/8 blur-[120px]" />
      </div>

      <div className="relative z-10 flex">
        {/* Barre latérale — desktop */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-champagne/10 bg-champagne/[0.03] px-4 py-6 backdrop-blur-xl lg:flex">
          <button
            onClick={() => router.push("/mon-compte")}
            className="mb-6 flex items-center gap-2 px-2 text-xs text-champagne/60 transition hover:text-champagne"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Mon compte
          </button>

          <div className="mb-8 flex items-center gap-3 px-2">
            <MarqueEclipse />
            <div>
              <p className="text-base font-bold leading-none tracking-tight">
                Sfera<span className="text-cuivre">&apos;Solys</span>
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-champagne/55">
                Admin
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {nav.map((item) => {
              const isActive = item.id === activeTab;
              const badge =
                item.id === "reports" && pendingReports.length > 0
                  ? pendingReports.length
                  : null;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-cuivre/15 text-champagne ring-1 ring-cuivre/30"
                      : "text-champagne/60 hover:bg-champagne/5 hover:text-champagne"
                  }`}
                >
                  <item.icon
                    className={`h-[18px] w-[18px] ${isActive ? "text-cuivre" : ""}`}
                  />
                  {item.label}
                  {badge ? (
                    <span className="ml-auto rounded-full bg-erreur/25 px-1.5 py-0.5 text-[10px] font-bold text-champagne">
                      {badge}
                    </span>
                  ) : isActive ? (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cuivre" />
                  ) : null}
                </button>
              );
            })}
          </nav>

          <button
            onClick={() => router.push("/mon-compte")}
            className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-champagne/60 transition hover:bg-erreur/10 hover:text-champagne"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Quitter la console
          </button>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {sectionTitle[activeTab].title}
              </h1>
              <p className="mt-1 text-sm text-champagne/60">
                {sectionTitle[activeTab].sub}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 rounded-xl border border-champagne/10 bg-champagne/5 px-3.5 py-2.5 text-sm text-champagne/70 transition hover:bg-champagne/10 hover:text-champagne"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Actualiser</span>
              </button>

              <button
                onClick={() => setActiveTab("reports")}
                aria-label={
                  pendingReports.length > 0
                    ? `${pendingReports.length} signalement(s) en attente`
                    : "Aucun signalement en attente"
                }
                className="relative rounded-xl border border-champagne/10 bg-champagne/5 p-2.5 text-champagne/70 transition hover:bg-champagne/10"
              >
                <Bell className="h-4 w-4" />
                {pendingReports.length > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cuivre ring-2 ring-nuit" />
                )}
              </button>

              <div className="flex items-center gap-2.5 rounded-xl border border-champagne/10 bg-champagne/5 py-1.5 pl-1.5 pr-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cuivre text-sm font-bold text-nuit">
                  A
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold leading-none">Admin</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-champagne">
                    <Crown className="h-2.5 w-2.5" /> Super Admin
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Navigation — mobile */}
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {nav.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-current={activeTab === item.id ? "page" : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                  activeTab === item.id
                    ? "border-champagne/20 bg-champagne/15 text-champagne"
                    : "border-champagne/10 bg-champagne/5 text-champagne/60"
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div
                  role="alert"
                  className="flex items-center gap-3 rounded-xl border border-erreur/30 bg-erreur/10 px-4 py-3 text-sm text-champagne"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{error}</span>
                  <button
                    onClick={() => setError("")}
                    aria-label="Fermer l'alerte"
                    className="text-champagne transition hover:text-champagne/70"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {activeTab === "dashboard" && stats && (
            <OngletDashboard
              stats={stats}
              recentUsers={recentUsers}
              pendingReports={pendingReports}
              onVoirUtilisateurs={() => setActiveTab("users")}
              onVoirSignalements={() => setActiveTab("reports")}
            />
          )}

          {activeTab === "users" && (
            <OngletUtilisateurs
              users={users}
              isLoading={isLoadingUsers}
              totalUsers={totalUsers}
              page={page}
              totalPages={totalPages}
              search={search}
              planFilter={planFilter}
              statusFilter={statusFilter}
              actionLoading={actionLoading}
              onSearch={setSearch}
              onPlanFilter={setPlanFilter}
              onStatusFilter={setStatusFilter}
              onPage={setPage}
              onAction={handleUserAction}
              onDelete={handleDeleteUser}
            />
          )}

          {activeTab === "reports" && (
            <OngletSignalements
              reports={reports}
              isLoading={isLoadingReports}
              actionLoading={actionLoading}
              onRefresh={fetchReports}
              onBan={handleBan}
              onResolve={handleResolveReport}
            />
          )}

          {activeTab === "testimonials" && (
            <OngletTemoignages
              testimonials={testimonials}
              isLoading={isLoadingTestimonials}
              actionLoading={actionLoading}
              onRefresh={fetchTestimonials}
              onAction={handleTestimonialAction}
              onFeatured={handleTestimonialFeatured}
            />
          )}

          {activeTab === "newsletter" && (
            <OngletNewsletter
              stats={newsletterStats}
              subject={nlSubject}
              content={nlContent}
              status={nlStatus}
              message={nlMessage}
              onSubject={setNlSubject}
              onContent={setNlContent}
              onSend={handleSendNewsletter}
              onRefresh={fetchNewsletterStats}
            />
          )}

          {activeTab === "tools" && (
            <OngletOutils
              actionLoading={actionLoading}
              resetMessage={resetMessage}
              onCloseMessage={() => setResetMessage(null)}
              onReset={handleResetData}
            />
          )}

          <p className="mt-8 text-center text-[11px] text-champagne/40">
            Sfera&apos;Solys · console d&apos;administration
          </p>
        </main>
      </div>
    </div>
  );
}
