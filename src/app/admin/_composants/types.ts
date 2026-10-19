// src/app/admin/_composants/types.ts

import {
  Flag,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Users,
  Wrench,
} from "lucide-react";

/**
 * Types, constantes et helpers partagés par la console d'administration.
 *
 * Tout ce fichier vivait dans `page.tsx`, qui pesait 2 400 lignes. Il est
 * isolé ici pour que les six onglets puissent être lus — et modifiés — un
 * par un.
 */

// ─────────────────────────────────────────────
// Données renvoyées par l'API
// ─────────────────────────────────────────────

export interface AdminStats {
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

export interface AdminUser {
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

export interface AdminReport {
  _id: string;
  reporterId: { _id: string; pseudonyme: string; image?: string } | null;
  targetType: "user" | "message" | "community_post";
  targetId: { _id: string; pseudonyme?: string; image?: string } | null;
  reason: string;
  details?: string;
  status: "pending" | "reviewed" | "dismissed";
  createdAt: string;
}

export interface AdminTestimonial {
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
}

// ─────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────

export type TabId =
  | "dashboard"
  | "users"
  | "reports"
  | "testimonials"
  | "newsletter"
  | "tools";

export type ResetTarget = "messages" | "matches" | "visits" | "posts" | "journal";

export const nav: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Utilisateurs", icon: Users },
  { id: "reports", label: "Signalements", icon: Flag },
  { id: "testimonials", label: "Témoignages", icon: MessageCircle },
  { id: "newsletter", label: "Newsletter", icon: Mail },
  { id: "tools", label: "Outils", icon: Wrench },
];

export const sectionTitle: Record<TabId, { title: string; sub: string }> = {
  dashboard: { title: "Dashboard Admin", sub: "Vue d'ensemble de la plateforme" },
  users: { title: "Utilisateurs", sub: "Gestion des membres" },
  reports: { title: "Signalements", sub: "Modération de la communauté" },
  testimonials: { title: "Témoignages", sub: "Validation des avis" },
  newsletter: { title: "Newsletter", sub: "Communication aux abonnés" },
  tools: { title: "Outils", sub: "Maintenance & données" },
};

export const resetTargets: {
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

// ─────────────────────────────────────────────
// Libellés et styles
// ─────────────────────────────────────────────

export const reasonLabel: Record<string, string> = {
  spam: "Spam",
  harcèlement: "Harcèlement",
  contenu_inapproprié: "Contenu inapproprié",
  faux_profil: "Faux profil",
  autre: "Autre",
};

export const planLabel: Record<string, string> = {
  free: "Gratuit",
  "essential-monthly": "Essentiel",
  "premium-monthly": "Premium",
  "elite-monthly": "Elite",
};

/**
 * Pastilles d'offre. Le texte reste en crème : l'orange sur le fond des
 * cartes ne donne que 3,84:1, insuffisant pour du petit texte. C'est la
 * bordure et le fond qui portent le signal.
 */
export const planBadgeColor: Record<string, string> = {
  free: "border-cream/10 bg-cream/5 text-cream/70",
  "essential-monthly": "border-orange/25 bg-orange/15 text-cream",
  "premium-monthly": "border-orange/25 bg-orange/15 text-cream",
  "elite-monthly": "border-orange/30 bg-orange/15 text-cream",
};

export const statusColor: Record<string, string> = {
  active: "text-lime bg-lime/10 border-lime/20",
  trialing: "text-cream bg-cream/10 border-cream/20",
  inactive: "text-cream/60 bg-cream/5 border-cream/10",
  past_due: "text-cream bg-orange/10 border-orange/20",
  canceled: "text-cream bg-rust/10 border-rust/20",
};

export const memberStatusStyle: Record<string, string> = {
  Actif: "text-lime bg-lime/12 border-lime/25",
  Inactif: "text-cream bg-orange/12 border-orange/25",
  Résilié: "text-cream bg-rust/15 border-rust/30",
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

export function formatDate(date?: string | null) {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR");
}

export function formatNumber(n: number) {
  return n.toLocaleString("fr-FR");
}

/** Statut lisible d'un membre pour l'overview. */
export function memberStatus(u: AdminUser): "Actif" | "Inactif" | "Résilié" {
  if (u.subscriptionStatus === "canceled") return "Résilié";
  if (u.lastLoginAt) {
    const days = (Date.now() - new Date(u.lastLoginAt).getTime()) / 86400000;
    if (days <= 30) return "Actif";
  }
  return "Inactif";
}

/**
 * Abonnement EFFECTIF d'un membre (pas le plan choisi).
 * - abonnement annulé  → "Résilié"
 * - premium réellement actif (isPremium) → palier réel
 * - sinon → "Gratuit" (ex : plan Elite sélectionné mais jamais payé)
 */
export function effectivePlan(u: AdminUser): {
  key: string;
  label: string;
  style: string;
  isElite: boolean;
} {
  if (u.subscriptionStatus === "canceled") {
    return {
      key: "canceled",
      label: "Résilié",
      style: "text-cream bg-rust/15 border-rust/30",
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
