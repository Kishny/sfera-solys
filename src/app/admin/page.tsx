// src/app/admin/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Flag,
  Heart,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  MessageCircle,
  MoreHorizontal,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserRound,
  Users,
  UserX,
  Wrench,
} from "lucide-react";

/**
 * Dashboard Admin Sfera'Solys — design premium sombre + données réelles.
 *
 * Shell : sidebar fixe (desktop) + nav scrollable (mobile) + header.
 * Sections : Dashboard (overview branché sur /api/admin/stats), Utilisateurs,
 * Signalements, Témoignages, Newsletter, Outils. Toute la logique de gestion
 * existante est conservée (actions users, bannissement, reset, etc.).
 */

interface AdminStats {
  users: {
    total: number;
    premium: number;
    activeSubscriptions: number;
    profilesCompleted: number;
    newToday: number;
    newLast7days: number;
    newLast30days: number;
    conversionRate: number;
    active24h: number;
    activeLast7days: number;
    inactive: number;
    retentionRate: number;
  };
  matches: { total: number; active: number; last7days: number };
  messages: { total: number; last7days: number; today: number };
  revenue: {
    monthly: number;
    estimated: number;
    source: "stripe" | "estimate";
    currency: string;
    since: string;
  };
  planBreakdown: { plan: string; count: number }[];
  ageDistribution: { label: string; count: number; pct: number }[];
  dailySeries: {
    label: string;
    inscriptions: number;
    matches: number;
    messages: number;
  }[];
  canceled: {
    pseudonyme: string;
    plan: string;
    planLabel: string;
    date: string | null;
  }[];
}

interface AdminUser {
  _id: string;
  email: string;
  pseudonyme: string;
  plan: string;
  subscriptionStatus: string;
  isPremium: boolean;
  hasCompletedProfile: boolean;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
  localisation?: string;
  age?: number;
  identityVerified: boolean;
  identityVerificationStatus: string;
}

type TabId =
  | "dashboard"
  | "users"
  | "reports"
  | "testimonials"
  | "newsletter"
  | "tools";

type ResetTarget = "messages" | "matches" | "visits" | "posts" | "journal";

const nav: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Utilisateurs", icon: Users },
  { id: "reports", label: "Signalements", icon: Flag },
  { id: "testimonials", label: "Témoignages", icon: MessageCircle },
  { id: "newsletter", label: "Newsletter", icon: Mail },
  { id: "tools", label: "Outils", icon: Wrench },
];

const sectionTitle: Record<TabId, { title: string; sub: string }> = {
  dashboard: { title: "Dashboard Admin", sub: "Vue d'ensemble de la plateforme" },
  users: { title: "Utilisateurs", sub: "Gestion des membres" },
  reports: { title: "Signalements", sub: "Modération de la communauté" },
  testimonials: { title: "Témoignages", sub: "Validation des avis" },
  newsletter: { title: "Newsletter", sub: "Communication aux abonnés" },
  tools: { title: "Outils", sub: "Maintenance & données" },
};

const resetTargets: {
  id: ResetTarget;
  label: string;
  description: string;
  confirmMessage: string;
}[] = [
  {
    id: "messages",
    label: "Messages",
    description: "Supprime tous les messages échangés entre les membres.",
    confirmMessage:
      "Supprimer définitivement TOUS les messages du site ? Cette action est irréversible.",
  },
  {
    id: "matches",
    label: "Matchs & likes",
    description: "Supprime tous les matchs et tous les likes enregistrés.",
    confirmMessage:
      "Supprimer définitivement TOUS les matchs et likes du site ? Cette action est irréversible.",
  },
  {
    id: "visits",
    label: "Visites de profil",
    description: "Supprime l'historique des visites de profil.",
    confirmMessage:
      "Supprimer définitivement TOUTES les visites de profil ? Cette action est irréversible.",
  },
  {
    id: "posts",
    label: "Posts (Communauté / Entraide)",
    description: "Supprime tous les posts publiés sur ces 3 espaces.",
    confirmMessage:
      "Supprimer définitivement TOUS les posts Communauté et Entraide ? Cette action est irréversible.",
  },
];

interface AdminReport {
  _id: string;
  reporterId: { _id: string; pseudonyme: string; image?: string } | null;
  targetType: "user" | "message" | "community_post";
  targetId: { _id: string; pseudonyme?: string; image?: string } | null;
  reason: string;
  details?: string;
  status: "pending" | "reviewed" | "dismissed";
  createdAt: string;
}

const reasonLabel: Record<string, string> = {
  spam: "Spam",
  harcèlement: "Harcèlement",
  contenu_inapproprié: "Contenu inapproprié",
  faux_profil: "Faux profil",
  autre: "Autre",
};

const planLabel: Record<string, string> = {
  free: "Gratuit",
  "essential-monthly": "Essentiel",
  "premium-monthly": "Premium",
  "elite-monthly": "Elite",
};

const planBadgeColor: Record<string, string> = {
  free: "border-cream/10 bg-cream/5 text-cream/70",
  "essential-monthly": "border-orange/25 bg-orange/15 text-cream",
  "premium-monthly": "border-orange/25 bg-orange/15 text-cream",
  "elite-monthly": "border-orange/30 bg-orange/15 text-cream",
};

const statusColor: Record<string, string> = {
  active: "text-lime bg-lime/10 border-lime/20",
  trialing: "text-cream bg-cream/10 border-cream/20",
  inactive: "text-cream/60 bg-cream/5 border-cream/10",
  past_due: "text-cream bg-orange/10 border-orange/20",
  canceled: "text-cream bg-rust/10 border-rust/20",
};

function formatDate(date?: string | null) {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR");
}

function formatNumber(n: number) {
  return n.toLocaleString("fr-FR");
}

/** Statut lisible d'un membre pour l'overview. */
function memberStatus(u: AdminUser): "Actif" | "Inactif" | "Résilié" {
  if (u.subscriptionStatus === "canceled") return "Résilié";
  if (u.lastLoginAt) {
    const days = (Date.now() - new Date(u.lastLoginAt).getTime()) / 86400000;
    if (days <= 30) return "Actif";
  }
  return "Inactif";
}

const memberStatusStyle: Record<string, string> = {
  Actif: "text-lime bg-lime/12 border-lime/25",
  Inactif: "text-cream bg-orange/12 border-orange/25",
  Résilié: "text-cream bg-orange/15 border-orange/30",
};

/**
 * Abonnement EFFECTIF d'un membre (pas le plan choisi).
 * - abonnement annulé  → "Résilié"
 * - premium réellement actif (isPremium) → palier réel
 * - sinon → "Gratuit" (ex : plan Elite sélectionné mais jamais payé)
 */
function effectivePlan(u: AdminUser): {
  key: string;
  label: string;
  style: string;
  isElite: boolean;
} {
  if (u.subscriptionStatus === "canceled") {
    return {
      key: "canceled",
      label: "Résilié",
      style: "text-cream bg-orange/15 border-orange/30",
      isElite: false,
    };
  }
  if (u.isPremium && u.plan !== "free") {
    return {
      key: u.plan,
      label: planLabel[u.plan] || u.plan,
      style: planBadgeColor[u.plan] || planBadgeColor.free,
      isElite: u.plan === "elite-monthly",
    };
  }
  return {
    key: "free",
    label: "Gratuit",
    style: planBadgeColor.free,
    isElite: false,
  };
}

/* ---------- Graphiques SVG (aucune dépendance) ---------- */

/**
 * Palette des séries, validée plutôt que choisie à l'œil.
 *
 * Contrôlée sur le fond des cartes (#123243) : bande de luminosité OKLCH
 * [0,48 – 0,67], chroma ≥ 0,10, séparation daltonienne ΔE ≥ 8 entre séries
 * voisines (20,5 au pire ici, en protanopie), contraste ≥ 3:1 sur le fond.
 *
 * L'ordre compte : vert et orange se confondent en deutéranopie (ΔE 4,5).
 * Ils ne sont donc jamais voisins — le bleu les sépare, et les messages sont
 * tracés en ligne quand les deux autres séries sont en barres, ce qui ajoute
 * une distinction de forme à la distinction de couleur.
 */
const SERIE = {
  inscriptions: "#6b9b00",
  matchs: "#218cb5",
  messages: "#FF4103",
} as const;

function GraphiqueActivite({ data }: { data: AdminStats["dailySeries"] }) {
  const [survol, setSurvol] = useState<number | null>(null);

  const W = 560;
  const H = 240;
  const pad = { top: 20, right: 16, bottom: 28, left: 28 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;

  const pic = Math.max(
    1,
    ...data.map((d) => Math.max(d.inscriptions, d.matches, d.messages))
  );
  const max = Math.ceil(pic / 4) * 4 || 4;

  const groupW = iW / Math.max(data.length, 1);
  const barW = 12;
  const gap = 5;

  const points = data.map((d, i) => ({
    x: pad.left + groupW * i + groupW / 2,
    y: pad.top + iH - (d.messages / max) * iH,
  }));

  const chemin = points
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
    .join(" ");

  const grilles = [0, max / 4, max / 2, (3 * max) / 4, max];

  const legende = [
    { cle: "inscriptions", libelle: "Inscriptions", couleur: SERIE.inscriptions },
    { cle: "matchs", libelle: "Matchs", couleur: SERIE.matchs },
    { cle: "messages", libelle: "Messages", couleur: SERIE.messages },
  ];

  return (
    <div className="relative">
      {/* Trois séries : la légende n'est pas optionnelle. */}
      <ul className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {legende.map((s) => (
          <li key={s.cle} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: s.couleur }}
            />
            <span className="text-[11px] text-cream/70">{s.libelle}</span>
          </li>
        ))}
      </ul>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {grilles.map((g, i) => {
          const y = pad.top + iH - (g / max) * iH;
          return (
            <g key={i}>
              <line
                x1={pad.left}
                y1={y}
                x2={W - pad.right}
                y2={y}
                stroke="rgba(255,235,209,0.08)"
                strokeWidth="1"
              />
              <text x={4} y={y + 3} fill="rgba(255,235,209,0.45)" fontSize="9">
                {Math.round(g)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const centre = pad.left + groupW * i + groupW / 2;
          const hInscr = (d.inscriptions / max) * iH;
          const hMatch = (d.matches / max) * iH;

          return (
            <g key={i}>
              {survol === i && (
                <rect
                  x={centre - groupW / 2}
                  y={pad.top}
                  width={groupW}
                  height={iH}
                  fill="rgba(255,235,209,0.05)"
                />
              )}

              <rect
                x={centre - barW - gap / 2}
                y={pad.top + iH - hInscr}
                width={barW}
                height={hInscr}
                rx="3"
                fill={SERIE.inscriptions}
              />
              <rect
                x={centre + gap / 2}
                y={pad.top + iH - hMatch}
                width={barW}
                height={hMatch}
                rx="3"
                fill={SERIE.matchs}
              />

              <text
                x={centre}
                y={H - 8}
                textAnchor="middle"
                fill="rgba(255,235,209,0.6)"
                fontSize="10"
              >
                {d.label}
              </text>

              {/* Cible de survol : toute la colonne, pas seulement la barre. */}
              <rect
                x={centre - groupW / 2}
                y={pad.top}
                width={groupW}
                height={iH}
                fill="transparent"
                onMouseEnter={() => setSurvol(i)}
                onMouseLeave={() => setSurvol(null)}
              />
            </g>
          );
        })}

        {points.length > 0 && (
          <>
            <path
              d={chemin}
              fill="none"
              stroke={SERIE.messages}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r="4"
                fill={SERIE.messages}
                stroke="#123243"
                strokeWidth="2"
              />
            ))}
          </>
        )}
      </svg>

      {survol !== null && data[survol] && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 rounded-xl border border-cream/15 bg-abyss/95 px-3 py-2 text-[11px] shadow-lg"
          style={{
            left: `${((pad.left + groupW * survol + groupW / 2) / W) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          <p className="mb-1 font-semibold text-cream">{data[survol].label}</p>
          {legende.map((s) => (
            <p key={s.cle} className="flex items-center gap-1.5 text-cream/70">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: s.couleur }}
              />
              {s.libelle}
              <span className="ml-2 font-semibold text-cream">
                {s.cle === "inscriptions"
                  ? data[survol].inscriptions
                  : s.cle === "matchs"
                    ? data[survol].matches
                    : data[survol].messages}
              </span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Répartition des membres par offre.
 *
 * C'était un anneau à quatre couleurs. Quatre teintes catégorielles
 * distinguables en daltonisme n'existent pas dans cette palette — vert et
 * orange se confondent en deutéranopie, et l'or se confond avec l'orange.
 * Plutôt que de forcer une palette qui échoue au contrôle, l'identité passe
 * ici par le libellé et la longueur de barre ; la couleur ne porte plus rien,
 * donc elle reste unique.
 */
function RepartitionPlans({
  breakdown,
  total,
}: {
  breakdown: AdminStats["planBreakdown"];
  total: number;
}) {
  const lignes = breakdown.map((b) => ({
    ...b,
    pct: total > 0 ? Math.round((b.count / total) * 100) : 0,
    label: planLabel[b.plan] || b.plan,
  }));

  return (
    <div>
      <div className="mb-5 flex items-baseline gap-2">
        <span className="font-display text-3xl font-extrabold text-cream">
          {formatNumber(total)}
        </span>
        <span className="text-[13px] text-cream/60">membres au total</span>
      </div>

      <ul className="space-y-3">
        {lignes.map((l) => (
          <li key={l.plan}>
            <div className="mb-1.5 flex items-center gap-2 text-[13px]">
              <span className="flex items-center gap-1 text-cream/70">
                {l.label}
                {l.plan === "elite-monthly" && (
                  <Crown className="h-3 w-3 text-orange" aria-hidden="true" />
                )}
              </span>
              <span className="ml-auto font-semibold text-cream">
                {formatNumber(l.count)}
              </span>
              <span className="w-9 text-right text-xs text-cream/60">
                {l.pct}%
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-cream/10">
              <div
                className="h-full rounded-full bg-orange"
                style={{ width: `${l.pct}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------- */

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

  const [testimonials, setTestimonials] = useState<
    {
      _id: string;
      authorName: string;
      age?: number;
      city?: string;
      content: string;
      rating?: number;
      showAvatar?: boolean;
      featured?: boolean;
      status: string;
      createdAt: string;
    }[]
  >([]);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(false);

  // Newsletter
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
      // silencieux
    }
  }, []);

  const handleSendNewsletter = async () => {
    if (nlSubject.trim().length < 3 || nlContent.trim().length < 20) {
      setNlStatus("error");
      setNlMessage("Objet (3+) et contenu (20+) requis.");
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
        setNlMessage("Newsletter envoyée à l'audience ✅");
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

  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

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
      // silencieux
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
      const res = await fetch("/api/admin/testimonials", {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) setTestimonials(data.testimonials);
    } catch {
      // Silence volontaire.
    } finally {
      setIsLoadingTestimonials(false);
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

  const handleResetData = async (target: ResetTarget, confirmMessage: string) => {
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
        setError(data.error || "Reset échoué.");
      }
    } catch {
      setError("Erreur lors du reset.");
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

  if (status === "loading" || isLoadingStats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-abyss">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-cream" />
          <p className="text-sm text-cream/60">
            Chargement du dashboard admin…
          </p>
        </div>
      </div>
    );
  }

  const pendingReports = reports.filter((r) => r.status === "pending");

  return (
    <div className="min-h-screen bg-abyss text-cream antialiased">
      {/* halos d'ambiance */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/3 h-[28rem] w-[28rem] rounded-full bg-orange/15 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-orange/12 blur-[120px]" />
        <div className="absolute top-1/2 -left-20 h-72 w-72 rounded-full bg-orange/8 blur-[120px]" />
      </div>

      <div className="relative z-10 flex">
        {/* -------- Sidebar (desktop) -------- */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-cream/10 bg-cream/[0.03] px-4 py-6 backdrop-blur-xl lg:flex">
          <button
            onClick={() => router.push("/mon-compte")}
            className="mb-6 flex items-center gap-2 px-2 text-xs text-cream/60 transition hover:text-cream"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Mon compte
          </button>

          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-orange">
              <div className="absolute inset-[3px] rounded-[13px] bg-abyss" />
              <span className="relative text-lg">🌙</span>
            </div>
            <div>
              <p className="text-base font-bold leading-none tracking-tight">
                Sfera<span className="text-orange">&apos;Solys</span>
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-cream/55">
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
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-orange/15 text-cream ring-1 ring-orange/30"
                      : "text-cream/60 hover:bg-cream/5 hover:text-cream"
                  }`}
                >
                  <item.icon
                    className={`h-[18px] w-[18px] ${
                      isActive ? "text-orange" : ""
                    }`}
                  />
                  {item.label}
                  {badge ? (
                    <span className="ml-auto rounded-full bg-rust/25 px-1.5 py-0.5 text-[10px] font-bold text-cream">
                      {badge}
                    </span>
                  ) : isActive ? (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-orange" />
                  ) : null}
                </button>
              );
            })}
          </nav>

          <button
            onClick={() => router.push("/mon-compte")}
            className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-cream/60 transition hover:bg-rust/10 hover:text-cream"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Déconnexion
          </button>
        </aside>

        {/* -------- Main -------- */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {sectionTitle[activeTab].title}
              </h1>
              <p className="mt-1 text-sm text-cream/60">
                {sectionTitle[activeTab].sub}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 rounded-xl border border-cream/10 bg-cream/5 px-3.5 py-2.5 text-sm text-cream/70 transition hover:bg-cream/10 hover:text-cream"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Actualiser</span>
              </button>

              <button className="relative rounded-xl border border-cream/10 bg-cream/5 p-2.5 text-cream/70 transition hover:bg-cream/10">
                <Bell className="h-4 w-4" />
                {pendingReports.length > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange ring-2 ring-abyss" />
                )}
              </button>

              <div className="flex items-center gap-2.5 rounded-xl border border-cream/10 bg-cream/5 py-1.5 pl-1.5 pr-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange text-sm font-bold">
                  A
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold leading-none">Admin</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-cream">
                    <Crown className="h-2.5 w-2.5" /> Super Admin
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Nav mobile scrollable */}
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {nav.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                  activeTab === item.id
                    ? "border-cream/20 bg-cream/15 text-cream"
                    : "border-cream/10 bg-cream/5 text-cream/60"
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
                <div className="flex items-center gap-3 rounded-xl border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-cream">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{error}</span>
                  <button
                    onClick={() => setError("")}
                    className="text-cream hover:text-cream"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ================= DASHBOARD ================= */}
          {activeTab === "dashboard" && stats && (
            <motion.section
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Cartes stats principales */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                {[
                  {
                    icon: Users,
                    label: "Total Utilisateurs",
                    value: formatNumber(stats.users.total),
                    sub: `+${stats.users.newLast7days} cette semaine`,
                    trend: "up" as const,
                    accent: "text-cream",
                    ring: "border-cream/8",
                    iconBg: "bg-orange/15 text-orange",
                  },
                  {
                    icon: Activity,
                    label: "Membres Actifs",
                    value: formatNumber(stats.users.active24h),
                    sub: "connectés / 24h",
                    trend: "up" as const,
                    accent: "text-cream",
                    ring: "border-cream/8",
                    iconBg: "bg-orange/15 text-orange",
                  },
                  {
                    icon: UserX,
                    label: "Membres Inactifs",
                    value: formatNumber(stats.users.inactive),
                    sub: "aucune activité 30j",
                    trend: "down" as const,
                    accent: "text-cream",
                    ring: "border-cream/8",
                    iconBg: "bg-orange/15 text-orange",
                  },
                  {
                    icon: Heart,
                    label: "Matches Actifs",
                    value: formatNumber(stats.matches.active),
                    sub: `+${stats.matches.last7days} cette semaine`,
                    trend: "up" as const,
                    accent: "text-cream",
                    ring: "border-cream/8",
                    iconBg: "bg-orange/15 text-orange",
                  },
                  {
                    icon: MessageCircle,
                    label: "Messages (auj.)",
                    value: formatNumber(stats.messages.today),
                    sub: `${formatNumber(stats.messages.last7days)} / 7j`,
                    trend: "up" as const,
                    accent: "text-cream",
                    ring: "border-cream/8",
                    iconBg: "bg-orange/15 text-orange",
                  },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`relative overflow-hidden rounded-2xl border ${s.ring} bg-[#123243] p-4`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className={`rounded-xl p-2 ${s.iconBg}`}>
                        <s.icon className="h-4 w-4" />
                      </div>
                      {s.trend === "up" ? (
                        <TrendingUp className="h-3.5 w-3.5 text-lime" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-orange" />
                      )}
                    </div>
                    <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                    <p className="mt-0.5 text-xs text-cream/60">{s.label}</p>
                    <p className={`mt-1.5 text-[11px] font-medium ${s.accent}`}>
                      {s.sub}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Row 2 */}
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
                      <div
                        key={c.k}
                        className="px-2 text-center first:pl-0 last:pr-0"
                      >
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
                    <Sparkles className="h-8 w-8 text-orange/40" />
                  </div>
                </div>
              </div>

              {/* Row 3 : graphique + donut */}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
                <div className="rounded-2xl border border-cream/10 bg-cream/[0.04] p-5 backdrop-blur-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">
                        Activité — 7 derniers jours
                      </h3>
                      <p className="text-xs text-cream/60">
                        Inscriptions, matches & messages
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1.5 text-cream/70">
                        <span className="h-2 w-2 rounded-sm bg-orange" />
                        Inscriptions
                      </span>
                      <span className="flex items-center gap-1.5 text-cream/70">
                        <span className="h-2 w-2 rounded-sm bg-orange" />
                        Matches
                      </span>
                      <span className="flex items-center gap-1.5 text-cream/70">
                        <span className="h-2 w-4 rounded-full bg-orange" />
                        Messages
                      </span>
                    </div>
                  </div>
                  <GraphiqueActivite data={stats.dailySeries} />
                </div>

                <div className="rounded-2xl border border-cream/10 bg-cream/[0.04] p-5 backdrop-blur-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Répartition des plans</h3>
                    <MoreHorizontal className="h-4 w-4 text-cream/55" />
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
                        <div
                          key={a.label}
                          className="flex items-center gap-3 text-xs"
                        >
                          <span className="w-20 shrink-0 text-cream/70">
                            {a.label}
                          </span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream/10">
                            <div
                              className="h-full rounded-full bg-orange"
                              style={{ width: `${a.pct}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-cream/60">
                            {a.pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4 : derniers inscrits + activités */}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
                <div className="overflow-hidden rounded-2xl border border-cream/10 bg-cream/[0.04] backdrop-blur-sm">
                  <div className="flex items-center justify-between border-b border-cream/10 px-5 py-4">
                    <h3 className="text-sm font-semibold">Derniers inscrits</h3>
                    <button
                      onClick={() => setActiveTab("users")}
                      className="flex items-center gap-1 text-xs text-cream transition hover:text-cream"
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
                            <td
                              colSpan={5}
                              className="px-5 py-8 text-center text-cream/55"
                            >
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
                                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange text-xs font-bold">
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
                                <td className="px-3 py-3 text-cream/70">
                                  {m.age ?? "—"}
                                </td>
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

                {/* Activités récentes = signalements réels */}
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
                        Aucun signalement en attente. Tout est calme ✨
                      </div>
                    ) : (
                      pendingReports.slice(0, 5).map((r) => (
                        <button
                          key={r._id}
                          onClick={() => setActiveTab("reports")}
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

              {/* Row 5 : résiliations */}
              <div className="rounded-2xl border border-orange/15 bg-orange/[0.06] p-5 backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
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
                </div>
                {stats.canceled.length === 0 ? (
                  <p className="rounded-xl border border-cream/8 bg-cream/[0.03] p-4 text-center text-sm text-cream/60">
                    Aucune résiliation. 🎉
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
          )}

          {/* ================= USERS ================= */}
          {activeTab === "users" && (
            <motion.section
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 sm:space-y-5"
            >
              <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/55" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher email, pseudo…"
                    className="w-full rounded-xl border border-cream/10 bg-cream/5 py-2 pl-9 pr-4 text-sm text-cream placeholder-cream/55 focus:border-orange/50 focus:outline-none"
                  />
                </div>

                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="rounded-xl border border-cream/10 bg-[#123243] px-3 py-2 text-sm text-cream focus:outline-none"
                >
                  <option value="all">Tous les plans</option>
                  <option value="free">🌙 Gratuit</option>
                  <option value="essential-monthly">⭐ Essentiel</option>
                  <option value="premium-monthly">💎 Premium</option>
                  <option value="elite-monthly">👑 Elite</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-cream/10 bg-[#123243] px-3 py-2 text-sm text-cream focus:outline-none"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="trialing">Essai</option>
                  <option value="inactive">Inactif</option>
                  <option value="canceled">Annulé</option>
                </select>
              </div>

              <p className="text-xs text-cream/60">
                {formatNumber(totalUsers)} utilisateur
                {totalUsers !== 1 ? "s" : ""} trouvé
                {totalUsers !== 1 ? "s" : ""}
              </p>

              {isLoadingUsers ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-cream" />
                </div>
              ) : users.length === 0 ? (
                <div className="rounded-2xl border border-cream/10 bg-cream/5 py-12 text-center text-sm text-cream/60">
                  Aucun utilisateur trouvé.
                </div>
              ) : (
                <>
                  {/* Cards mobile */}
                  <div className="space-y-3 md:hidden">
                    {users.map((u) => (
                      <article
                        key={u._id}
                        className="rounded-2xl border border-cream/10 bg-cream/5 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange text-sm font-bold">
                            {u.pseudonyme.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-semibold">
                                {u.pseudonyme}
                              </p>
                              {u.hasCompletedProfile && (
                                <BadgeCheck className="h-4 w-4 text-lime" />
                              )}
                              {u.identityVerified && (
                                <ShieldCheck
                                  className="h-4 w-4 text-cream"
                                  aria-label="Identité vérifiée"
                                />
                              )}
                            </div>
                            <p className="truncate text-xs text-cream/60">
                              {u.email}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {(() => {
                                const ep = effectivePlan(u);
                                return (
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${ep.style}`}
                                  >
                                    {ep.isElite && <Crown className="h-3 w-3" />}
                                    {ep.label}
                                  </span>
                                );
                              })()}
                              <span
                                className={`rounded-full border px-2 py-1 text-xs ${
                                  statusColor[u.subscriptionStatus] ||
                                  statusColor.inactive
                                }`}
                              >
                                {u.subscriptionStatus}
                              </span>
                              <span className="rounded-full border border-cream/10 bg-cream/5 px-2 py-1 text-xs text-cream/60">
                                {u.role === "admin" ? "⭐ Admin" : "User"}
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-cream/60">
                              Inscription : {formatDate(u.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex justify-end gap-2 border-t border-cream/8 pt-3">
                          <button
                            onClick={() =>
                              handleUserAction(u._id, "toggle_premium")
                            }
                            disabled={actionLoading === u._id + "toggle_premium"}
                            title={
                              u.isPremium
                                ? "Retirer l'accès premium"
                                : "Rendre premium"
                            }
                            className={`rounded-lg border p-2 transition ${
                              u.isPremium
                                ? "border-orange/20 bg-orange/15 text-cream"
                                : "border-cream/10 bg-cream/5 text-cream/60"
                            }`}
                          >
                            {actionLoading === u._id + "toggle_premium" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Crown className="h-4 w-4" />
                            )}
                          </button>

                          <button
                            onClick={() =>
                              handleUserAction(
                                u._id,
                                u.role === "admin" ? "demote" : "promote"
                              )
                            }
                            disabled={
                              actionLoading ===
                              u._id + (u.role === "admin" ? "demote" : "promote")
                            }
                            title={
                              u.role === "admin"
                                ? "Rétrograder en membre"
                                : "Promouvoir administratrice"
                            }
                            className="rounded-lg border border-cream/10 bg-cream/5 p-2 text-cream/60 transition hover:bg-cream/10 hover:text-cream"
                          >
                            {actionLoading ===
                            u._id + (u.role === "admin" ? "demote" : "promote") ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Shield className="h-4 w-4" />
                            )}
                          </button>

                          <button
                            onClick={() =>
                              handleUserAction(u._id, "toggle_identity_verified")
                            }
                            disabled={
                              actionLoading === u._id + "toggle_identity_verified"
                            }
                            title={
                              u.identityVerified
                                ? "Retirer la vérification d'identité"
                                : "Valider manuellement l'identité"
                            }
                            className={`rounded-lg border p-2 transition ${
                              u.identityVerified
                                ? "border-cream/20 bg-cream/15 text-cream"
                                : "border-cream/10 bg-cream/5 text-cream/60"
                            }`}
                          >
                            {actionLoading === u._id + "toggle_identity_verified" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ShieldCheck className="h-4 w-4" />
                            )}
                          </button>

                          {u.role !== "admin" && (
                            <button
                              onClick={() => handleDeleteUser(u._id, u.pseudonyme)}
                              disabled={actionLoading === u._id + "delete"}
                              title="Supprimer définitivement le compte"
                              className="rounded-lg border border-rust/20 bg-rust/10 p-2 text-cream transition hover:bg-rust/20"
                            >
                              {actionLoading === u._id + "delete" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>

                  {/* Table desktop */}
                  <div className="hidden overflow-hidden rounded-2xl border border-cream/10 bg-cream/5 md:block">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-cream/8 text-xs text-cream/60">
                            <th className="px-4 py-3 text-left font-medium">
                              Utilisateur
                            </th>
                            <th className="px-4 py-3 text-left font-medium">Plan</th>
                            <th className="px-4 py-3 text-left font-medium">
                              Statut
                            </th>
                            <th className="px-4 py-3 text-left font-medium">
                              Inscription
                            </th>
                            <th className="px-4 py-3 text-left font-medium">Rôle</th>
                            <th className="px-4 py-3 text-right font-medium">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u) => (
                            <tr
                              key={u._id}
                              className="border-b border-cream/5 transition hover:bg-cream/5"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange text-xs font-bold">
                                    {u.pseudonyme.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="max-w-32 truncate font-medium">
                                      {u.pseudonyme}
                                    </p>
                                    <p className="max-w-32 truncate text-xs text-cream/60">
                                      {u.email}
                                    </p>
                                  </div>
                                  {u.hasCompletedProfile && (
                                    <BadgeCheck className="h-4 w-4 shrink-0 text-lime" />
                                  )}
                                  {u.identityVerified && (
                                    <ShieldCheck
                                      className="h-4 w-4 shrink-0 text-cream"
                                      aria-label="Identité vérifiée"
                                    />
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {(() => {
                                  const ep = effectivePlan(u);
                                  return (
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${ep.style}`}
                                    >
                                      {ep.isElite && <Crown className="h-3 w-3" />}
                                      {ep.label}
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`rounded-full border px-2 py-1 text-xs ${
                                    statusColor[u.subscriptionStatus] ||
                                    statusColor.inactive
                                  }`}
                                >
                                  {u.subscriptionStatus}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-cream/60">
                                {formatDate(u.createdAt)}
                              </td>
                              <td className="px-4 py-3">
                                {u.role === "admin" ? (
                                  <span className="flex items-center gap-1 text-xs text-cream">
                                    <Star className="h-3 w-3" /> Admin
                                  </span>
                                ) : (
                                  <span className="text-xs text-cream/60">User</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() =>
                                      handleUserAction(u._id, "toggle_premium")
                                    }
                                    disabled={
                                      actionLoading === u._id + "toggle_premium"
                                    }
                                    title={
                                      u.isPremium
                                        ? "Retirer l'accès premium"
                                        : "Rendre premium"
                                    }
                                    className={`rounded-lg border p-1.5 text-xs transition ${
                                      u.isPremium
                                        ? "border-orange/20 bg-orange/15 text-cream"
                                        : "border-cream/10 bg-cream/5 text-cream/60 hover:bg-cream/10 hover:text-cream"
                                    }`}
                                  >
                                    {actionLoading === u._id + "toggle_premium" ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Crown className="h-3.5 w-3.5" />
                                    )}
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleUserAction(
                                        u._id,
                                        u.role === "admin" ? "demote" : "promote"
                                      )
                                    }
                                    disabled={
                                      actionLoading ===
                                      u._id +
                                        (u.role === "admin" ? "demote" : "promote")
                                    }
                                    title={
                                      u.role === "admin"
                                        ? "Rétrograder en membre"
                                        : "Promouvoir administratrice"
                                    }
                                    className="rounded-lg border border-cream/10 bg-cream/5 p-1.5 text-cream/60 transition hover:bg-cream/10 hover:text-cream"
                                  >
                                    {actionLoading ===
                                    u._id +
                                      (u.role === "admin" ? "demote" : "promote") ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Shield className="h-3.5 w-3.5" />
                                    )}
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleUserAction(
                                        u._id,
                                        "toggle_identity_verified"
                                      )
                                    }
                                    disabled={
                                      actionLoading ===
                                      u._id + "toggle_identity_verified"
                                    }
                                    title={
                                      u.identityVerified
                                        ? "Retirer la vérification d'identité"
                                        : "Valider manuellement l'identité"
                                    }
                                    className={`rounded-lg border p-1.5 text-xs transition ${
                                      u.identityVerified
                                        ? "border-cream/20 bg-cream/15 text-cream"
                                        : "border-cream/10 bg-cream/5 text-cream/60 hover:bg-cream/10 hover:text-cream"
                                    }`}
                                  >
                                    {actionLoading ===
                                    u._id + "toggle_identity_verified" ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <ShieldCheck className="h-3.5 w-3.5" />
                                    )}
                                  </button>

                                  {u.role !== "admin" && (
                                    <button
                                      onClick={() =>
                                        handleDeleteUser(u._id, u.pseudonyme)
                                      }
                                      disabled={actionLoading === u._id + "delete"}
                                      title="Supprimer définitivement le compte"
                                      className="rounded-lg border border-rust/20 bg-rust/10 p-1.5 text-cream transition hover:bg-rust/20"
                                    >
                                      {actionLoading === u._id + "delete" ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-cream/60">
                    Page {page} / {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page <= 1 || isLoadingUsers}
                      className="flex items-center gap-1 rounded-lg border border-cream/10 bg-cream/5 px-3 py-1.5 text-sm text-cream/70 transition hover:bg-cream/10 hover:text-cream disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Préc.
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                      disabled={page >= totalPages || isLoadingUsers}
                      className="flex items-center gap-1 rounded-lg border border-cream/10 bg-cream/5 px-3 py-1.5 text-sm text-cream/70 transition hover:bg-cream/10 hover:text-cream disabled:opacity-30"
                    >
                      Suiv.
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {/* ================= TESTIMONIALS ================= */}
          {activeTab === "testimonials" && (
            <motion.section
              key="testimonials"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-cream/70">
                  {testimonials.length} témoignage(s)
                </p>
                <button
                  onClick={fetchTestimonials}
                  className="flex items-center gap-1 text-xs text-cream/60 transition hover:text-cream"
                >
                  <RefreshCw className="h-3 w-3" />
                  Actualiser
                </button>
              </div>

              {isLoadingTestimonials && (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-cream" />
                </div>
              )}

              {!isLoadingTestimonials && testimonials.length === 0 && (
                <div className="rounded-2xl border border-cream/10 bg-cream/5 py-16 text-center text-cream/60">
                  Aucun témoignage pour l&apos;instant.
                </div>
              )}

              {testimonials.map((t) => (
                <article
                  key={t._id}
                  className="space-y-3 rounded-2xl border border-cream/10 bg-cream/5 p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <span className="font-medium text-cream">
                        {t.authorName}
                        {t.age ? `, ${t.age} ans` : ""}
                      </span>
                      {t.city && (
                        <span className="ml-2 text-xs text-cream">
                          📍 {t.city}
                        </span>
                      )}
                      <span className="ml-2 text-xs text-cream">
                        {"★".repeat(t.rating ?? 5)}
                        <span className="text-cream/20">
                          {"★".repeat(5 - (t.rating ?? 5))}
                        </span>
                      </span>
                      {t.showAvatar && (
                        <span className="ml-2 text-xs text-cream/60">📷 photo</span>
                      )}
                      <span className="ml-3 text-xs text-cream/60">
                        {formatDate(t.createdAt)}
                      </span>
                    </div>

                    <span
                      className={`w-fit rounded-full border px-2 py-1 text-xs font-medium ${
                        t.status === "approved"
                          ? "border-lime/20 bg-lime/10 text-lime"
                          : t.status === "rejected"
                            ? "border-rust/20 bg-rust/10 text-cream"
                            : "border-orange/20 bg-orange/10 text-cream"
                      }`}
                    >
                      {t.status === "approved"
                        ? "✓ Approuvé"
                        : t.status === "rejected"
                          ? "✕ Rejeté"
                          : "⏳ En attente"}
                    </span>
                  </div>

                  <p className="text-sm italic leading-relaxed text-cream/70">
                    « {t.content} »
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {t.status !== "approved" && (
                      <button
                        onClick={() => handleTestimonialAction(t._id, "approved")}
                        disabled={actionLoading === t._id + "approved"}
                        className="rounded-lg border border-lime/30 bg-lime/20 px-3 py-1.5 text-xs font-medium text-lime transition hover:bg-lime/30 disabled:opacity-50"
                      >
                        {actionLoading === t._id + "approved" ? "…" : "✓ Approuver"}
                      </button>
                    )}

                    {t.status !== "rejected" && (
                      <button
                        onClick={() => handleTestimonialAction(t._id, "rejected")}
                        disabled={actionLoading === t._id + "rejected"}
                        className="rounded-lg border border-orange/30 bg-orange/20 px-3 py-1.5 text-xs font-medium text-cream transition hover:bg-orange/30 disabled:opacity-50"
                      >
                        {actionLoading === t._id + "rejected" ? "…" : "✕ Rejeter"}
                      </button>
                    )}

                    {t.status === "approved" && (
                      <button
                        onClick={() =>
                          handleTestimonialFeatured(t._id, !t.featured)
                        }
                        disabled={actionLoading === t._id + "featured"}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                          t.featured
                            ? "border-orange/40 bg-orange/20 text-cream hover:bg-orange/30"
                            : "border-cream/15 bg-cream/5 text-cream/70 hover:bg-cream/10"
                        }`}
                      >
                        {actionLoading === t._id + "featured"
                          ? "…"
                          : t.featured
                            ? "⭐ Épinglé"
                            : "☆ Épingler"}
                      </button>
                    )}

                    <button
                      onClick={() => handleTestimonialAction(t._id, "delete")}
                      disabled={actionLoading === t._id + "delete"}
                      className="ml-auto rounded-lg border border-rust/30 bg-rust/20 px-3 py-1.5 text-xs font-medium text-cream transition hover:bg-rust/30 disabled:opacity-50"
                    >
                      {actionLoading === t._id + "delete" ? "…" : "🗑 Supprimer"}
                    </button>
                  </div>
                </article>
              ))}
            </motion.section>
          )}

          {/* ================= REPORTS ================= */}
          {activeTab === "reports" && (
            <motion.section
              key="reports"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-cream/70">
                  {reports.length} signalement(s)
                </p>
                <button
                  onClick={fetchReports}
                  className="flex items-center gap-1 text-xs text-cream/60 transition hover:text-cream"
                >
                  <RefreshCw className="h-3 w-3" />
                  Actualiser
                </button>
              </div>

              {isLoadingReports && (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-cream" />
                </div>
              )}

              {!isLoadingReports && reports.length === 0 && (
                <div className="rounded-2xl border border-cream/10 bg-cream/5 py-12 text-center text-cream/55">
                  Aucun signalement.
                </div>
              )}

              {reports.map((report) => (
                <article
                  key={report._id}
                  className="space-y-3 rounded-2xl border border-cream/10 bg-cream/5 p-4 sm:p-5"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                          report.status === "pending"
                            ? "border-orange/20 bg-orange/10 text-cream"
                            : report.status === "reviewed"
                              ? "border-lime/20 bg-lime/10 text-lime"
                              : "border-cream/10 bg-cream/5 text-cream/60"
                        }`}
                      >
                        {report.status === "pending"
                          ? "En attente"
                          : report.status === "reviewed"
                            ? "Traité"
                            : "Ignoré"}
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
                            handleBan(
                              report.targetId!._id,
                              report.targetId?.pseudonyme || "cet utilisateur"
                            )
                          }
                          disabled={actionLoading === "ban-" + report.targetId._id}
                          className="rounded-xl bg-rust px-4 py-2 text-xs font-bold text-cream transition hover:bg-rust disabled:opacity-50"
                        >
                          🚫 Bannir
                        </button>
                      )}

                      <button
                        onClick={() => handleResolveReport(report._id, "reviewed")}
                        disabled={actionLoading === report._id + "reviewed"}
                        className="rounded-xl border border-lime/30 bg-lime/20 px-4 py-2 text-xs text-lime transition hover:bg-lime/30 disabled:opacity-50"
                      >
                        ✓ Marquer traité
                      </button>

                      <button
                        onClick={() => handleResolveReport(report._id, "dismissed")}
                        disabled={actionLoading === report._id + "dismissed"}
                        className="rounded-xl border border-cream/10 bg-cream/5 px-4 py-2 text-xs text-cream/60 transition hover:bg-cream/10 disabled:opacity-50"
                      >
                        Ignorer
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </motion.section>
          )}

          {/* ================= NEWSLETTER ================= */}
          {activeTab === "newsletter" && (
            <motion.section
              key="newsletter"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-cream">
                    📨 Newsletter & actualités
                  </p>
                  <p className="text-xs text-cream/60">
                    {newsletterStats
                      ? `${newsletterStats.subscriberCount} abonnée(s)`
                      : "Chargement…"}
                  </p>
                </div>
                <button
                  onClick={fetchNewsletterStats}
                  className="flex items-center gap-1 text-xs text-cream/60 transition hover:text-cream"
                >
                  <RefreshCw className="h-3 w-3" />
                  Actualiser
                </button>
              </div>

              {newsletterStats && !newsletterStats.audienceConfigured && (
                <div className="rounded-2xl border border-orange/20 bg-orange/10 p-4 text-xs text-cream">
                  ⚠️ Audience Resend non configurée. Crée une Audience dans le
                  dashboard Resend puis renseigne{" "}
                  <code className="rounded bg-black/30 px-1">RESEND_AUDIENCE_ID</code>{" "}
                  dans les variables d&apos;environnement Vercel pour activer
                  l&apos;envoi.
                </div>
              )}

              <div className="space-y-3 rounded-2xl border border-cream/10 bg-cream/5 p-4 sm:p-5">
                <div>
                  <label className="mb-1 block text-xs font-medium text-cream/70">
                    Objet
                  </label>
                  <input
                    type="text"
                    value={nlSubject}
                    onChange={(e) => setNlSubject(e.target.value)}
                    placeholder="Les nouveautés du mois sur Sfera'Solys 💜"
                    maxLength={120}
                    className="w-full rounded-xl border border-cream/15 bg-cream/5 px-3 py-2.5 text-sm text-cream placeholder-cream/55 outline-none focus:border-orange/50"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-cream/70">
                    Message
                  </label>
                  <textarea
                    value={nlContent}
                    onChange={(e) => setNlContent(e.target.value)}
                    rows={8}
                    placeholder={
                      "Écris ton actualité ici…\n\nSaute une ligne pour séparer les paragraphes. Un lien de désabonnement est ajouté automatiquement."
                    }
                    className="w-full resize-y rounded-xl border border-cream/15 bg-cream/5 px-3 py-2.5 text-sm text-cream placeholder-cream/55 outline-none focus:border-orange/50"
                  />
                </div>

                {nlMessage && (
                  <p
                    className={`text-xs ${
                      nlStatus === "success" ? "text-lime" : "text-cream"
                    }`}
                  >
                    {nlMessage}
                  </p>
                )}

                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] text-cream/60">
                    L&apos;envoi part vers toute l&apos;audience Resend.
                  </p>
                  <button
                    onClick={handleSendNewsletter}
                    disabled={nlStatus === "sending"}
                    className="rounded-xl bg-orange px-5 py-2.5 text-sm font-bold text-abyss transition hover:opacity-90 disabled:opacity-50"
                  >
                    {nlStatus === "sending" ? "Envoi…" : "Envoyer la newsletter"}
                  </button>
                </div>
              </div>
            </motion.section>
          )}

          {/* ================= TOOLS ================= */}
          {activeTab === "tools" && (
            <motion.section
              key="tools"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="rounded-2xl border border-rust/20 bg-rust/5 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-cream">
                  <AlertCircle className="h-4 w-4" />
                  Zone sensible
                </p>
                <p className="mt-1 text-xs text-cream/60">
                  Ces actions suppriment définitivement des données pour
                  l&apos;ensemble du site (toutes les utilisatrices), sans toucher
                  aux comptes eux-mêmes. Utile pour repartir avec des statistiques
                  propres après des tests. Irréversible.
                </p>
              </div>

              {resetMessage && (
                <div className="flex items-center gap-3 rounded-xl border border-lime/20 bg-lime/10 px-4 py-3 text-sm text-lime">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{resetMessage}</span>
                  <button
                    onClick={() => setResetMessage(null)}
                    className="text-lime hover:text-cream"
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
                      onClick={() => handleResetData(rt.id, rt.confirmMessage)}
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
          )}

          <p className="mt-8 text-center text-[11px] text-cream/25">
            Sfera'Solys · Dashboard admin
          </p>
        </main>
      </div>
    </div>
  );
}
