// src/app/(app)/mon-compte/_composants/types.ts

import type { ElementType } from "react";
import { Crown, Heart, Shield, Sparkles, User } from "lucide-react";

/**
 * Types, libellés et helpers partagés de l'espace compte.
 *
 * ## Pourquoi ce fichier existe
 *
 * `/mon-compte` était **un seul fichier de 3 344 lignes** : types, libellés,
 * helpers, page, six onglets, deux modales et trois sous-composants. Aucune
 * partie n'était relisable indépendamment, et une correction dans un onglet
 * imposait de faire défiler l'ensemble.
 *
 * Le fichier est découpé en un composant par onglet. Ce module porte ce qui est
 * réellement partagé — et rien d'autre.
 *
 * ## Ce qui a disparu au passage
 *
 * `planAccent` donnait à chaque offre sa propre teinte (violet pour Essentiel,
 * rose pour Premium, or pour Elite) : un second système de couleurs, superposé
 * à celui de la marque. L'éclipse solaire n'a qu'un accent — l'orange pour
 * l'action, le lime pour la validation — et une offre se reconnaît à son nom,
 * pas à sa couleur. `planEmoji` disparaît pour la même raison.
 */

export type AuthProvider = "credentials" | "google" | "apple";
export type UserRole = "user" | "admin";

export type PlanSolys =
  | "free"
  | "essential-monthly"
  | "premium-monthly"
  | "elite-monthly";

export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled";

export type ProfileVisibility = "public" | "matches" | "premium" | "invisible";

export type IdentityVerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "failed";

export type TabId =
  | "dashboard"
  | "profil"
  | "preferences"
  | "premium"
  | "securite"
  | "connexions";

export interface MembreSolys {
  _id?: string;
  id?: string;

  // Identité
  email: string;
  pseudonyme: string;
  name?: string;
  image?: string;
  photos?: string[];

  // Auth
  password?: string;
  provider?: AuthProvider;

  // Profil
  bio?: string;
  age?: number;
  orientation?: string;
  intentions: string[];
  localisation?: string;
  departement?: string;
  rayon?: string;
  /** Champ local uniquement : jamais renvoyé par l'API. */
  reponse?: string;
  question?: string;
  /** `true` si une réponse secrète est déjà enregistrée en base. */
  hasReponse?: boolean;
  interets: string[];
  visibilite: ProfileVisibility;

  // État du compte
  hasCompletedProfile: boolean;
  profileCompletedAt?: string | null;
  consentement: boolean;
  role: UserRole;

  // Abonnement / Stripe
  plan: PlanSolys;
  subscriptionStatus: SubscriptionStatus;
  isPremium: boolean;
  premiumStartedAt?: string | null;
  premiumExpiresAt?: string | null;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeCheckoutSessionId?: string;
  lastPaymentAt?: string | null;
  subscriptionCancelAtPeriodEnd?: boolean;
  subscriptionPaused?: boolean;

  // Délais annuels
  pseudonymeChangedAt?: string | null;
  orientationChangedAt?: string | null;

  // Sécurité
  lastLoginAt?: string | null;
  identityVerified?: boolean;
  identityVerificationStatus?: IdentityVerificationStatus;

  // Libellés éventuellement fournis par l'API
  planLabel?: string;
  subscriptionStatusLabel?: string;

  createdAt?: string;
  updatedAt?: string;
}

export type Visiteur = {
  user: {
    _id: string;
    pseudonyme: string;
    age?: number;
    localisation?: string;
    departement?: string;
    image?: string;
  } | null;
  lastVisit: string;
  visitCount: number;
};

export interface MembreMatche {
  _id: string;
  pseudonyme: string;
  age?: number;
  localisation?: string;
  departement?: string;
  image?: string;
  interets?: string[];
}

export interface RelationItem {
  matchId: string;
  createdAt: string;
  lastMessageAt: string | null;
  unreadCount?: number;
  hasUnreadMessage?: boolean;
  user: MembreMatche | null;
}

// ─────────────────────────────────────────────
// Style partagé
// ─────────────────────────────────────────────

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss";

/** Surface des cartes, alignée sur le reste de l'espace connecté. */
export const carte = "rounded-2xl border border-cream/10 bg-[#0C222D]";

/** Champ de formulaire. */
export const champ =
  "w-full rounded-xl border border-cream/12 bg-abyss px-3.5 py-2.5 text-[14px] text-cream placeholder:text-cream/55 disabled:opacity-60 " +
  focusRing;

// ─────────────────────────────────────────────
// Valeurs par défaut et libellés
// ─────────────────────────────────────────────

export const membreVide: MembreSolys = {
  email: "",
  pseudonyme: "Membre Solys",
  name: "",
  image: "",
  photos: [],
  provider: "credentials",

  age: 28,
  bio: "",
  orientation: "",
  intentions: [],
  localisation: "",
  departement: "",
  rayon: "departement",
  question: "",
  reponse: "",
  interets: [],
  visibilite: "matches",

  hasCompletedProfile: false,
  profileCompletedAt: null,
  consentement: true,
  role: "user",

  plan: "free",
  subscriptionStatus: "inactive",
  isPremium: false,
  premiumStartedAt: null,
  premiumExpiresAt: null,
  stripeCustomerId: "",
  stripeSubscriptionId: "",
  stripeCheckoutSessionId: "",
  lastPaymentAt: null,

  lastLoginAt: null,
  identityVerified: false,
  identityVerificationStatus: "unverified",

  planLabel: "Gratuit",
  subscriptionStatusLabel: "Inactif",
};

/**
 * Orientations, au masculin.
 *
 * La liste était intégralement au féminin — reste du fork SferaLuna — et
 * contenait « Lesbienne / Homosexuelle », qui n'avait rien à faire sur la
 * version hommes. La clé `curieuse` est conservée **en plus** de `curieux` :
 * elle a pu être enregistrée en base avant la reprise, et un profil ne doit pas
 * afficher une valeur brute parce qu'on a renommé une clé.
 */
export const orientationLabels: Record<string, string> = {
  hetero: "Hétérosexuel",
  homo: "Homosexuel",
  bi: "Bisexuel",
  pan: "Pansexuel",
  curieux: "Curieux — je souhaite découvrir",
  curieuse: "Curieux — je souhaite découvrir",
  other: "Autre",
};

export const intentionLabels: Record<string, string> = {
  "rencontre-serieuse": "Rencontre sérieuse",
  amitie: "Amitié",
  aventure: "Aventure",
  reseautage: "Réseautage",
  discussion: "Discussion",
};

export const visibilityLabels: Record<ProfileVisibility, string> = {
  public: "Visible par tous",
  matches: "Réservé à mes mises en relation",
  premium: "Visible par les offres payantes",
  invisible: "Mode Fantôme",
};

export const planLabels: Record<PlanSolys, string> = {
  free: "Gratuit",
  "essential-monthly": "Essentiel",
  "premium-monthly": "Premium",
  "elite-monthly": "Elite",
};

export const subscriptionLabels: Record<SubscriptionStatus, string> = {
  // « En attente » laissait croire à un traitement en cours qui n'existe pas.
  inactive: "Inactif",
  active: "Actif",
  trialing: "Essai gratuit",
  past_due: "Paiement en retard",
  canceled: "Annulé",
};

export const onglets: { id: TabId; label: string; icon: ElementType }[] = [
  { id: "dashboard", label: "Accueil", icon: Sparkles },
  { id: "profil", label: "Profil", icon: User },
  // « Intéractions » portait une faute d'orthographe depuis l'origine.
  { id: "connexions", label: "Interactions", icon: Heart },
  { id: "preferences", label: "Préférences", icon: Heart },
  { id: "premium", label: "Abonnement", icon: Crown },
  { id: "securite", label: "Sécurité", icon: Shield },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

export function isValidPlan(plan: unknown): plan is PlanSolys {
  return (
    plan === "free" ||
    plan === "essential-monthly" ||
    plan === "premium-monthly" ||
    plan === "elite-monthly"
  );
}

export function isValidSubscriptionStatus(
  status: unknown
): status is SubscriptionStatus {
  return (
    status === "inactive" ||
    status === "active" ||
    status === "trialing" ||
    status === "past_due" ||
    status === "canceled"
  );
}

export function isValidVisibility(value: unknown): value is ProfileVisibility {
  return (
    value === "public" ||
    value === "matches" ||
    value === "premium" ||
    value === "invisible"
  );
}

export function isValidIdentityStatus(
  value: unknown
): value is IdentityVerificationStatus {
  return (
    value === "unverified" ||
    value === "pending" ||
    value === "verified" ||
    value === "failed"
  );
}

/** Libellé de l'offre choisie, même si le paiement n'est pas encore confirmé. */
export function libelleOffre(user: MembreSolys) {
  if (user.plan && user.plan !== "free") {
    return planLabels[user.plan] || "Premium";
  }

  return "Gratuit";
}

/**
 * Offre payante réellement active.
 *
 * Le plan seul ne suffit pas : un compte peut porter `plan: "elite-monthly"`
 * avec `isPremium: false` et `subscriptionStatus: "inactive"` — l'offre a été
 * choisie, Stripe ne l'a pas confirmée. Les fonctionnalités restent fermées.
 */
export function offreActive(user: MembreSolys) {
  return (
    user.isPremium === true &&
    (user.subscriptionStatus === "active" ||
      user.subscriptionStatus === "trialing")
  );
}

export function formaterDate(date?: string | null) {
  if (!date) return "—";

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("fr-FR");
}

export function tempsRelatif(valeur: string | null) {
  if (!valeur) return null;

  const date = new Date(valeur);
  if (Number.isNaN(date.getTime())) return null;

  const secondes = Math.floor((Date.now() - date.getTime()) / 1000);

  if (secondes < 60) return "à l’instant";
  if (secondes < 3600) return `il y a ${Math.floor(secondes / 60)} min`;
  if (secondes < 86400) return `il y a ${Math.floor(secondes / 3600)} h`;

  return date.toLocaleDateString("fr-FR");
}

/**
 * Normalise le membre reçu de l'API.
 *
 * Évite les `undefined`, garde des valeurs cohérentes quand un champ manque, et
 * conserve les champs Stripe tels quels — c'est `offreActive` qui décide de
 * l'accès, pas ce normalisateur.
 */
export function normaliserMembre(rawUser: any, sessionUser?: any): MembreSolys {
  const rawPlan = rawUser?.plan;
  const rawSubscriptionStatus = rawUser?.subscriptionStatus;
  const rawVisibility = rawUser?.visibilite;
  const rawIdentityStatus = rawUser?.identityVerificationStatus;

  const plan = isValidPlan(rawPlan) ? rawPlan : "free";

  const subscriptionStatus = isValidSubscriptionStatus(rawSubscriptionStatus)
    ? rawSubscriptionStatus
    : "inactive";

  return {
    ...membreVide,
    ...rawUser,

    _id: rawUser?._id || rawUser?.id || "",
    id: rawUser?.id || rawUser?._id || "",

    email: rawUser?.email || sessionUser?.email || "",
    pseudonyme: rawUser?.pseudonyme || sessionUser?.name || "Membre Solys",
    name: rawUser?.name || sessionUser?.name || "",
    image: rawUser?.image || sessionUser?.image || "",
    photos: Array.isArray(rawUser?.photos) ? rawUser.photos : [],

    provider: rawUser?.provider || "credentials",

    bio: rawUser?.bio || "",
    age: typeof rawUser?.age === "number" ? rawUser.age : 28,
    orientation: rawUser?.orientation || "",
    intentions: Array.isArray(rawUser?.intentions) ? rawUser.intentions : [],
    localisation: rawUser?.localisation || "",
    departement: rawUser?.departement || "",
    rayon: rawUser?.rayon || "departement",
    question: rawUser?.question || "",
    // Toujours vide au chargement : l'API ne renvoie jamais la réponse secrète.
    reponse: "",
    hasReponse: Boolean(rawUser?.hasReponse),
    interets: Array.isArray(rawUser?.interets) ? rawUser.interets : [],
    visibilite: isValidVisibility(rawVisibility) ? rawVisibility : "matches",

    hasCompletedProfile: Boolean(rawUser?.hasCompletedProfile),
    profileCompletedAt: rawUser?.profileCompletedAt || null,
    consentement:
      typeof rawUser?.consentement === "boolean" ? rawUser.consentement : true,
    role: rawUser?.role === "admin" ? "admin" : "user",

    plan,
    subscriptionStatus,
    isPremium: Boolean(rawUser?.isPremium),

    premiumStartedAt: rawUser?.premiumStartedAt || null,
    premiumExpiresAt: rawUser?.premiumExpiresAt || null,
    stripeCustomerId: rawUser?.stripeCustomerId || "",
    stripeSubscriptionId: rawUser?.stripeSubscriptionId || "",
    stripeCheckoutSessionId: rawUser?.stripeCheckoutSessionId || "",
    lastPaymentAt: rawUser?.lastPaymentAt || null,
    subscriptionCancelAtPeriodEnd: Boolean(
      rawUser?.subscriptionCancelAtPeriodEnd
    ),
    subscriptionPaused: Boolean(rawUser?.subscriptionPaused),

    lastLoginAt: rawUser?.lastLoginAt || null,

    pseudonymeChangedAt: rawUser?.pseudonymeChangedAt || null,
    orientationChangedAt: rawUser?.orientationChangedAt || null,

    identityVerified: Boolean(rawUser?.identityVerified),
    identityVerificationStatus: isValidIdentityStatus(rawIdentityStatus)
      ? rawIdentityStatus
      : "unverified",

    planLabel: rawUser?.planLabel || planLabels[plan],
    subscriptionStatusLabel:
      rawUser?.subscriptionStatusLabel || subscriptionLabels[subscriptionStatus],

    createdAt: rawUser?.createdAt || undefined,
    updatedAt: rawUser?.updatedAt || undefined,
  };
}

// ─────────────────────────────────────────────
// Animations
// ─────────────────────────────────────────────

/**
 * `ease: "easeOut"` était inféré comme `string` alors que framer-motion attend
 * le littéral : cinq erreurs de types masquées par `ignoreBuildErrors`.
 */
export const variantesOnglet = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export const variantesCarte = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.07, duration: 0.3, ease: "easeOut" as const },
  }),
};
