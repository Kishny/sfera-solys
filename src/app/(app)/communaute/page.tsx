// src/app/(app)/communaute/page.tsx

"use client";

/**
 * Communauté Solys.
 *
 * ## Ce que la page ne faisait pas
 *
 * Le fil fonctionnait, mais sans aucune des protections de la messagerie
 * privée — alors qu'il est **plus exposé** : un message privé atteint une
 * personne, un post atteint tout le monde. Les corrections sont côté API
 * (`/api/community`), et détaillées là-bas : filtre anti-harcèlement, limite de
 * débit, refus des comptes suspendus, validation de la catégorie.
 *
 * Côté page, deux manques :
 *
 * - **Aucune pagination.** La route renvoyait tous les posts jamais écrits et
 *   la page les affichait tous. C'est maintenant paginé explicitement, comme
 *   l'annuaire : on demande la suite, elle ne vient pas toute seule.
 * - **Aucun signalement.** Le fil public était le seul endroit du site où un
 *   contenu abusif ne pouvait pas être signalé, alors que `Report` accepte le
 *   type `community_post` depuis le début — et le vérifie réellement depuis la
 *   correction de `/api/reports`.
 *
 * ## Les emojis
 *
 * Le modèle exige un `emoji` par post, et l'ancienne page ouvrait un sélecteur
 * pour le choisir. La direction artistique n'utilise pas d'emoji : la catégorie
 * porte maintenant une icône, et l'emoji stocké est déduit de la catégorie pour
 * rester compatible avec les posts déjà en base. Un champ de moins à remplir,
 * et rien de cassé.
 */

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  Heart,
  Lightbulb,
  Loader2,
  MessageCircle,
  PartyPopper,
  Pin,
  Plus,
  Send,
  Smile,
  Sprout,
  Trash2,
  Users,
  X,
} from "lucide-react";

import ReportModal from "@/components/ReportModal";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type Categorie =
  | "rencontres"
  | "conseils"
  | "sorties"
  | "bien-etre"
  | "humour"
  | "general";

interface Auteur {
  _id: string;
  pseudonyme?: string;
  image?: string;
}

interface Commentaire {
  _id: string;
  content: string;
  createdAt: string;
  userId: Auteur | null;
}

interface Post {
  _id: string;
  title: string;
  content: string;
  category: Categorie;
  isPinned?: boolean;
  createdAt: string;
  userId: Auteur | null;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  comments?: Commentaire[];
}

interface Pagination {
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

// ─────────────────────────────────────────────
// Catégories
// ─────────────────────────────────────────────

const CATEGORIES: Array<{
  valeur: Categorie;
  label: string;
  icone: React.ComponentType<{ size?: number | string; className?: string }>;
  /** Conservé pour le champ `emoji` du modèle, pas pour l'affichage. */
  emoji: string;
}> = [
  { valeur: "rencontres", label: "Rencontres", icone: Heart, emoji: "💕" },
  { valeur: "conseils", label: "Conseils", icone: Lightbulb, emoji: "💡" },
  { valeur: "sorties", label: "Sorties", icone: PartyPopper, emoji: "🎉" },
  { valeur: "bien-etre", label: "Bien-être", icone: Sprout, emoji: "🌿" },
  { valeur: "humour", label: "Humour", icone: Smile, emoji: "😄" },
  { valeur: "general", label: "Général", icone: Users, emoji: "💬" },
];

const TITRE_MAX = 150;
const CONTENU_MAX = 2000;
const COMMENTAIRE_MAX = 500;

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss";

function categorie(valeur: Categorie) {
  return CATEGORIES.find((item) => item.valeur === valeur) ?? CATEGORIES[5];
}

function formaterDate(valeur: string): string {
  const date = new Date(valeur);
  if (Number.isNaN(date.getTime())) return "";

  const secondes = Math.floor((Date.now() - date.getTime()) / 1000);

  if (secondes < 60) return "à l’instant";
  if (secondes < 3600) return `il y a ${Math.floor(secondes / 60)} min`;
  if (secondes < 86400) return `il y a ${Math.floor(secondes / 3600)} h`;
  if (secondes < 604800) return `il y a ${Math.floor(secondes / 86400)} j`;

  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function PageCommunaute() {
  const { status } = useSession();
  const router = useRouter();
  const reduireAnimations = useReducedMotion();

  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [filtre, setFiltre] = useState<Categorie | "all">("all");

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [deplie, setDeplie] = useState<string | null>(null);
  const [likeEnCours, setLikeEnCours] = useState<string | null>(null);

  const [brouillons, setBrouillons] = useState<Record<string, string>>({});
  const [envoiCommentaire, setEnvoiCommentaire] = useState<string | null>(null);

  const [suppression, setSuppression] = useState<string | null>(null);
  const [signale, setSignale] = useState<string | null>(null);

  const [formulaire, setFormulaire] = useState(false);
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [categorieChoisie, setCategorieChoisie] = useState<Categorie>("general");
  const [publication, setPublication] = useState(false);
  const [erreurFormulaire, setErreurFormulaire] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth?mode=login");
  }, [status, router]);

  const charger = useCallback(
    async (numero: number, categorieFiltre: Categorie | "all") => {
      setChargement(true);
      setErreur("");

      try {
        const params = new URLSearchParams();
        if (categorieFiltre !== "all") params.set("category", categorieFiltre);
        params.set("page", String(numero));
        params.set("limit", "20");

        const reponse = await fetch(`/api/community?${params.toString()}`, {
          cache: "no-store",
        });

        const donnees = await reponse.json().catch(() => null);

        if (!reponse.ok || donnees?.success !== true) {
          setErreur(donnees?.error || "Impossible de charger la Communauté.");
          setPosts([]);
          return;
        }

        setPosts(donnees.posts ?? []);
        setPagination(donnees.pagination ?? null);
      } catch {
        setErreur("Connexion interrompue. Réessaie dans un instant.");
        setPosts([]);
      } finally {
        setChargement(false);
      }
    },
    []
  );

  useEffect(() => {
    if (status === "authenticated") void charger(page, filtre);
  }, [status, page, filtre, charger]);

  const changerFiltre = (valeur: Categorie | "all") => {
    setPage(1);
    setFiltre(valeur);
    setDeplie(null);
  };

  const allerPage = (numero: number) => {
    const total = pagination?.totalPages ?? 1;
    const cible = Math.min(Math.max(1, numero), total);
    if (cible === page) return;

    setPage(cible);
    setDeplie(null);
    window.scrollTo({ top: 0, behavior: reduireAnimations ? "auto" : "smooth" });
  };

  /** Like optimiste : on inverse tout de suite, on corrige si le serveur refuse. */
  const aimer = async (post: Post) => {
    if (likeEnCours) return;

    setLikeEnCours(post._id);

    const avant = { likedByMe: post.likedByMe, likesCount: post.likesCount };

    setPosts((actuels) =>
      actuels.map((item) =>
        item._id === post._id
          ? {
              ...item,
              likedByMe: !item.likedByMe,
              likesCount: item.likesCount + (item.likedByMe ? -1 : 1),
            }
          : item
      )
    );

    try {
      const reponse = await fetch(`/api/community/${post._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like" }),
      });

      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || donnees?.success !== true) {
        setPosts((actuels) =>
          actuels.map((item) =>
            item._id === post._id ? { ...item, ...avant } : item
          )
        );
        setErreur(donnees?.error || "Ce like n’a pas pu être enregistré.");
      }
    } catch {
      setPosts((actuels) =>
        actuels.map((item) => (item._id === post._id ? { ...item, ...avant } : item))
      );
      setErreur("Connexion interrompue.");
    } finally {
      setLikeEnCours(null);
    }
  };

  const commenter = async (post: Post) => {
    const texte = (brouillons[post._id] ?? "").trim();
    if (!texte || envoiCommentaire) return;

    setEnvoiCommentaire(post._id);
    setErreur("");

    try {
      const reponse = await fetch(`/api/community/${post._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment", content: texte }),
      });

      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || donnees?.success !== true) {
        setErreur(donnees?.error || "Ce commentaire n’a pas été publié.");
        return;
      }

      setBrouillons((actuels) => ({ ...actuels, [post._id]: "" }));

      // Le serveur renvoie le post complet, commentaires peuplés compris.
      setPosts((actuels) =>
        actuels.map((item) =>
          item._id === post._id
            ? {
                ...item,
                comments: donnees.post?.comments ?? item.comments,
                commentsCount:
                  donnees.post?.comments?.length ?? item.commentsCount + 1,
              }
            : item
        )
      );
    } catch {
      setErreur("Connexion interrompue.");
    } finally {
      setEnvoiCommentaire(null);
    }
  };

  const supprimer = async (postId: string) => {
    try {
      const reponse = await fetch(`/api/community/${postId}`, {
        method: "DELETE",
      });

      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || donnees?.success !== true) {
        setErreur(donnees?.error || "Cette publication n’a pas pu être retirée.");
        return;
      }

      setSuppression(null);
      await charger(page, filtre);
    } catch {
      setErreur("Connexion interrompue.");
    }
  };

  const publier = async () => {
    if (publication) return;

    const t = titre.trim();
    const c = contenu.trim();

    if (!t || !c) {
      setErreurFormulaire("Un titre et un contenu sont nécessaires.");
      return;
    }

    setPublication(true);
    setErreurFormulaire("");

    try {
      const reponse = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t,
          content: c,
          category: categorieChoisie,
          // Déduit de la catégorie : le modèle l'exige, la page ne le demande plus.
          emoji: categorie(categorieChoisie).emoji,
        }),
      });

      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || donnees?.success !== true) {
        setErreurFormulaire(
          donnees?.error || "Cette publication n’a pas pu être envoyée."
        );
        return;
      }

      setFormulaire(false);
      setTitre("");
      setContenu("");
      setCategorieChoisie("general");
      setPage(1);
      await charger(1, filtre);
    } catch {
      setErreurFormulaire("Connexion interrompue.");
    } finally {
      setPublication(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-abyss">
        <Loader2 className="h-8 w-8 animate-spin text-orange" aria-hidden="true" />
        <span className="sr-only">Chargement</span>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-abyss px-4 py-6 text-cream sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto max-w-3xl">
          {/* En-tête */}
          <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display [font-stretch:125%] text-[26px] font-extrabold leading-tight tracking-tight text-cream sm:text-[32px]">
                Communauté Solys
              </h1>

              <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-cream/60 sm:text-sm">
                Un fil public entre membres vérifiés. Accessible dès l’offre
                gratuite — et modéré comme la messagerie.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setFormulaire(true)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl bg-orange px-4 py-2.5 text-[13px] font-bold text-abyss transition-colors hover:bg-orange/90 ${focusRing}`}
            >
              <Plus size={15} aria-hidden="true" />
              Publier
            </button>
          </header>

          {/* Filtres */}
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => changerFiltre("all")}
              aria-pressed={filtre === "all"}
              className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${focusRing} ${
                filtre === "all"
                  ? "border-orange bg-orange text-abyss"
                  : "border-cream/15 text-cream/70 hover:border-cream/30"
              }`}
            >
              Tout
            </button>

            {CATEGORIES.map((item) => {
              const Icone = item.icone;
              const actif = filtre === item.valeur;

              return (
                <button
                  key={item.valeur}
                  type="button"
                  onClick={() => changerFiltre(item.valeur)}
                  aria-pressed={actif}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${focusRing} ${
                    actif
                      ? "border-orange bg-orange text-abyss"
                      : "border-cream/15 text-cream/70 hover:border-cream/30"
                  }`}
                >
                  <Icone size={13} aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Erreur */}
          {erreur && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-2xl border border-orange/30 bg-orange/10 px-4 py-3"
            >
              <AlertCircle
                size={16}
                className="mt-0.5 shrink-0 text-orange"
                aria-hidden="true"
              />
              <p className="flex-1 text-[13px] leading-relaxed text-cream/85">
                {erreur}
              </p>
              <button
                type="button"
                onClick={() => setErreur("")}
                aria-label="Fermer le message"
                className={`shrink-0 rounded-lg p-1 text-cream/55 hover:text-cream ${focusRing}`}
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Fil */}
          {chargement ? (
            <div className="flex flex-col items-center gap-3 py-24">
              <Loader2
                className="h-7 w-7 animate-spin text-orange"
                aria-hidden="true"
              />
              <p className="text-[13px] text-cream/55">Chargement du fil…</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-cream/10 bg-[#0C222D] px-6 py-16 text-center">
              <MessageCircle
                size={26}
                className="mx-auto mb-4 text-cream/45"
                aria-hidden="true"
              />

              <h2 className="font-display [font-stretch:125%] text-[18px] font-bold text-cream">
                {filtre === "all"
                  ? "Le fil est vide"
                  : "Rien dans cette catégorie"}
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-cream/60">
                {filtre === "all"
                  ? "Personne n’a encore écrit. La première publication a toujours l’air de rien, et elle lance tout."
                  : "Essaie une autre catégorie, ou ouvre le sujet toi-même."}
              </p>

              <button
                type="button"
                onClick={() => setFormulaire(true)}
                className={`mt-6 inline-flex items-center gap-2 rounded-xl bg-orange px-5 py-2.5 text-[13px] font-bold text-abyss transition-colors hover:bg-orange/90 ${focusRing}`}
              >
                <Plus size={15} aria-hidden="true" />
                Publier
              </button>
            </div>
          ) : (
            <>
              <ul className="space-y-3">
                {posts.map((post) => (
                  <CartePost
                    key={post._id}
                    post={post}
                    deplie={deplie === post._id}
                    likeEnCours={likeEnCours === post._id}
                    envoiCommentaire={envoiCommentaire === post._id}
                    suppressionDemandee={suppression === post._id}
                    brouillon={brouillons[post._id] ?? ""}
                    onDeplier={() =>
                      setDeplie((actuel) => (actuel === post._id ? null : post._id))
                    }
                    onAimer={() => aimer(post)}
                    onBrouillon={(texte) =>
                      setBrouillons((actuels) => ({
                        ...actuels,
                        [post._id]: texte,
                      }))
                    }
                    onCommenter={() => commenter(post)}
                    onDemanderSuppression={() => setSuppression(post._id)}
                    onAnnulerSuppression={() => setSuppression(null)}
                    onConfirmerSuppression={() => supprimer(post._id)}
                    onSignaler={() => setSignale(post._id)}
                  />
                ))}
              </ul>

              {/* Pagination explicite, comme l'annuaire. */}
              {pagination && pagination.totalPages > 1 && (
                <nav
                  aria-label="Pagination du fil"
                  className="mt-8 flex items-center justify-center gap-3"
                >
                  <button
                    type="button"
                    onClick={() => allerPage(page - 1)}
                    disabled={page <= 1}
                    className={`inline-flex items-center gap-1.5 rounded-xl border border-cream/12 px-4 py-2.5 text-[13px] font-semibold text-cream transition-colors hover:border-cream/25 disabled:cursor-not-allowed disabled:opacity-35 ${focusRing}`}
                  >
                    <ChevronLeft size={15} aria-hidden="true" />
                    Précédent
                  </button>

                  <p className="min-w-[7.5rem] text-center text-[13px] text-cream/60">
                    Page <span className="font-bold text-cream">{page}</span> sur{" "}
                    {pagination.totalPages}
                  </p>

                  <button
                    type="button"
                    onClick={() => allerPage(page + 1)}
                    disabled={page >= pagination.totalPages}
                    className={`inline-flex items-center gap-1.5 rounded-xl border border-cream/12 px-4 py-2.5 text-[13px] font-semibold text-cream transition-colors hover:border-cream/25 disabled:cursor-not-allowed disabled:opacity-35 ${focusRing}`}
                  >
                    Suivant
                    <ChevronRight size={15} aria-hidden="true" />
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>

      {/* Formulaire de publication */}
      <AnimatePresence>
        {formulaire && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduireAnimations ? 0 : 0.2 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titre-formulaire"
          >
            <button
              type="button"
              onClick={() => setFormulaire(false)}
              aria-label="Fermer"
              className="absolute inset-0 cursor-default bg-abyss/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: reduireAnimations ? 0 : 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduireAnimations ? 0 : 24 }}
              transition={{ duration: reduireAnimations ? 0 : 0.25 }}
              className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-[1.75rem] border border-cream/10 bg-[#0C222D] p-5 sm:rounded-[1.75rem] sm:p-6"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <h2
                  id="titre-formulaire"
                  className="font-display [font-stretch:125%] text-[19px] font-bold text-cream"
                >
                  Publier dans la Communauté
                </h2>

                <button
                  type="button"
                  onClick={() => setFormulaire(false)}
                  aria-label="Fermer"
                  className={`shrink-0 rounded-lg p-1.5 text-cream/55 hover:text-cream ${focusRing}`}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              <form
                onSubmit={(evenement) => {
                  evenement.preventDefault();
                  void publier();
                }}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="titre-post"
                    className="mb-1.5 block text-[12px] font-semibold text-cream/70"
                  >
                    Titre
                  </label>

                  <input
                    id="titre-post"
                    type="text"
                    value={titre}
                    onChange={(evenement) =>
                      setTitre(evenement.target.value.slice(0, TITRE_MAX))
                    }
                    placeholder="De quoi veux-tu parler ?"
                    className={`w-full rounded-xl border border-cream/12 bg-abyss px-3.5 py-2.5 text-[14px] text-cream placeholder:text-cream/55 ${focusRing}`}
                  />
                </div>

                <fieldset>
                  <legend className="mb-2 text-[12px] font-semibold text-cream/70">
                    Catégorie
                  </legend>

                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((item) => {
                      const Icone = item.icone;
                      const actif = categorieChoisie === item.valeur;

                      return (
                        <button
                          key={item.valeur}
                          type="button"
                          onClick={() => setCategorieChoisie(item.valeur)}
                          aria-pressed={actif}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${focusRing} ${
                            actif
                              ? "border-orange bg-orange text-abyss"
                              : "border-cream/15 text-cream/70 hover:border-cream/30"
                          }`}
                        >
                          <Icone size={13} aria-hidden="true" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div>
                  <label
                    htmlFor="contenu-post"
                    className="mb-1.5 block text-[12px] font-semibold text-cream/70"
                  >
                    Contenu
                  </label>

                  <textarea
                    id="contenu-post"
                    rows={6}
                    value={contenu}
                    onChange={(evenement) =>
                      setContenu(evenement.target.value.slice(0, CONTENU_MAX))
                    }
                    placeholder="Écris ce que tu as en tête."
                    className={`w-full resize-y rounded-xl border border-cream/12 bg-abyss px-3.5 py-2.5 text-[14px] leading-relaxed text-cream placeholder:text-cream/55 ${focusRing}`}
                  />

                  <p className="mt-1.5 text-[11px] text-cream/55">
                    {contenu.length} / {CONTENU_MAX} caractères. Les publications
                    passent par le même filtre que la messagerie.
                  </p>
                </div>

                {erreurFormulaire && (
                  <p
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-orange/30 bg-orange/10 px-3.5 py-2.5 text-[12px] leading-relaxed text-cream/85"
                  >
                    <AlertCircle
                      size={14}
                      className="mt-0.5 shrink-0 text-orange"
                      aria-hidden="true"
                    />
                    {erreurFormulaire}
                  </p>
                )}

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    type="submit"
                    disabled={publication || !titre.trim() || !contenu.trim()}
                    className={`inline-flex items-center gap-2 rounded-xl bg-orange px-5 py-2.5 text-[13px] font-bold text-abyss transition-colors hover:bg-orange/90 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
                  >
                    {publication ? (
                      <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Send size={14} aria-hidden="true" />
                    )}
                    Publier
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormulaire(false)}
                    className={`inline-flex items-center rounded-xl border border-cream/15 px-4 py-2.5 text-[13px] font-semibold text-cream/80 transition-colors hover:border-cream/30 hover:text-cream ${focusRing}`}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ReportModal
        isOpen={signale !== null}
        targetId={signale ?? ""}
        targetType="community_post"
        onClose={() => setSignale(null)}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// Carte de publication
// ─────────────────────────────────────────────

function CartePost({
  post,
  deplie,
  likeEnCours,
  envoiCommentaire,
  suppressionDemandee,
  brouillon,
  onDeplier,
  onAimer,
  onBrouillon,
  onCommenter,
  onDemanderSuppression,
  onAnnulerSuppression,
  onConfirmerSuppression,
  onSignaler,
}: {
  post: Post;
  deplie: boolean;
  likeEnCours: boolean;
  envoiCommentaire: boolean;
  suppressionDemandee: boolean;
  brouillon: string;
  onDeplier: () => void;
  onAimer: () => void;
  onBrouillon: (texte: string) => void;
  onCommenter: () => void;
  onDemanderSuppression: () => void;
  onAnnulerSuppression: () => void;
  onConfirmerSuppression: () => void;
  onSignaler: () => void;
}) {
  const cat = categorie(post.category);
  const IconeCategorie = cat.icone;
  const auteur = post.userId?.pseudonyme ?? "Membre retiré";

  return (
    <li className="rounded-2xl border border-cream/10 bg-[#0C222D] p-4 sm:p-5">
      {/* En-tête */}
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-cream/12 bg-abyss">
          {post.userId?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.userId.image}
              alt={`Photo de ${auteur}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[14px] font-bold text-cream/55">
              {auteur.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-bold text-cream">{auteur}</span>

            <span className="inline-flex items-center gap-1 rounded-full border border-cream/12 px-2 py-0.5 text-[11px] text-cream/70">
              <IconeCategorie size={11} aria-hidden="true" />
              {cat.label}
            </span>

            {post.isPinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange px-2 py-0.5 text-[11px] font-bold text-abyss">
                <Pin size={10} aria-hidden="true" />
                Épinglé
              </span>
            )}
          </div>

          <p className="mt-0.5 text-[11px] text-cream/55">
            {formaterDate(post.createdAt)}
          </p>
        </div>
      </div>

      {/* Contenu */}
      <h2 className="font-display [font-stretch:125%] mt-3.5 text-[16px] font-bold leading-snug text-cream">
        {post.title}
      </h2>

      <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-cream/80">
        {post.content}
      </p>

      {/* Actions */}
      {suppressionDemandee ? (
        <div className="mt-4 rounded-xl border border-orange/30 bg-orange/10 p-3.5">
          <p className="text-[13px] leading-relaxed text-cream/85">
            Retirer cette publication la supprime pour tout le monde, avec ses
            commentaires. C’est définitif.
          </p>

          <div className="mt-3.5 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onConfirmerSuppression}
              className={`rounded-xl bg-orange px-4 py-2.5 text-[12px] font-bold text-abyss transition-colors hover:bg-orange/90 ${focusRing}`}
            >
              Retirer
            </button>

            <button
              type="button"
              onClick={onAnnulerSuppression}
              className={`rounded-xl border border-cream/15 px-4 py-2.5 text-[12px] font-semibold text-cream/80 transition-colors hover:border-cream/30 hover:text-cream ${focusRing}`}
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onAimer}
            disabled={likeEnCours}
            aria-pressed={post.likedByMe}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[12px] font-semibold transition-colors disabled:opacity-60 ${focusRing} ${
              post.likedByMe
                ? "border-lime/30 bg-lime/15 text-lime"
                : "border-cream/12 text-cream/70 hover:border-cream/25 hover:text-cream"
            }`}
          >
            <Heart
              size={13}
              className={post.likedByMe ? "fill-lime" : ""}
              aria-hidden="true"
            />
            {post.likesCount}
            <span className="sr-only">
              {post.likesCount > 1 ? "mentions j’aime" : "mention j’aime"}
            </span>
          </button>

          <button
            type="button"
            onClick={onDeplier}
            aria-expanded={deplie}
            className={`inline-flex items-center gap-1.5 rounded-xl border border-cream/12 px-3.5 py-2 text-[12px] font-semibold text-cream/70 transition-colors hover:border-cream/25 hover:text-cream ${focusRing}`}
          >
            <MessageCircle size={13} aria-hidden="true" />
            {post.commentsCount}
            <span className="sr-only">commentaires</span>
          </button>

          <span className="flex-1" />

          <button
            type="button"
            onClick={onSignaler}
            aria-label="Signaler cette publication"
            className={`rounded-xl border border-cream/12 p-2 text-cream/55 transition-colors hover:border-orange/40 hover:text-orange ${focusRing}`}
          >
            <Flag size={13} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onDemanderSuppression}
            aria-label="Retirer cette publication"
            title="Retirer — possible si tu en es l’auteur"
            className={`rounded-xl border border-cream/12 p-2 text-cream/55 transition-colors hover:border-orange/40 hover:text-orange ${focusRing}`}
          >
            <Trash2 size={13} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Commentaires */}
      {deplie && (
        <div className="mt-4 border-t border-cream/10 pt-4">
          {(post.comments ?? []).length > 0 ? (
            <ul className="space-y-3">
              {(post.comments ?? []).map((commentaire) => (
                <li key={commentaire._id} className="flex gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-cream/12 bg-abyss text-[11px] font-bold text-cream/55">
                    {(commentaire.userId?.pseudonyme ?? "?")
                      .charAt(0)
                      .toUpperCase()}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold text-cream">
                      {commentaire.userId?.pseudonyme ?? "Membre retiré"}
                      <span className="ml-2 font-normal text-cream/55">
                        {formaterDate(commentaire.createdAt)}
                      </span>
                    </p>

                    <p className="mt-0.5 whitespace-pre-line text-[13px] leading-relaxed text-cream/80">
                      {commentaire.content}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-cream/55">
              Aucun commentaire pour l’instant.
            </p>
          )}

          <form
            onSubmit={(evenement) => {
              evenement.preventDefault();
              onCommenter();
            }}
            className="mt-4 flex items-end gap-2"
          >
            <div className="min-w-0 flex-1">
              <label htmlFor={`commentaire-${post._id}`} className="sr-only">
                Ton commentaire
              </label>

              <input
                id={`commentaire-${post._id}`}
                type="text"
                value={brouillon}
                onChange={(evenement) =>
                  onBrouillon(evenement.target.value.slice(0, COMMENTAIRE_MAX))
                }
                placeholder="Répondre…"
                className={`w-full rounded-xl border border-cream/12 bg-abyss px-3.5 py-2.5 text-[13px] text-cream placeholder:text-cream/55 ${focusRing}`}
              />
            </div>

            <button
              type="submit"
              disabled={!brouillon.trim() || envoiCommentaire}
              aria-label="Envoyer le commentaire"
              className={`shrink-0 rounded-xl bg-orange p-2.5 text-abyss transition-colors hover:bg-orange/90 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
            >
              {envoiCommentaire ? (
                <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              ) : (
                <Send size={15} aria-hidden="true" />
              )}
            </button>
          </form>
        </div>
      )}
    </li>
  );
}
