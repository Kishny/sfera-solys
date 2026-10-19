// src/app/(app)/entraide/page.tsx

"use client";

/**
 * Entraide.
 *
 * ## Le renommage
 *
 * Cette page s'appelait **VibeMentor**, et c'est la plus grosse tromperie
 * tarifaire trouvée dans ce projet. `/tarifs` facturait « Coaching VibeMentor
 * mensuel » dans l'offre Elite à 34,99 €, et `/fonctionnalites` promettait
 * « coaching individuel », « ateliers thématiques » et « ressources
 * exclusives ».
 *
 * Le modèle raconte autre chose. `MentorPost` porte une question, des
 * **réponses d'autres membres**, des votes et une réponse retenue. Aucun coach,
 * aucun professionnel, aucun atelier, aucune ressource. C'est un forum
 * d'entraide entre pairs — un bon produit, mais pas du coaching, et sûrement
 * pas ce qui justifie l'offre la plus chère du catalogue.
 *
 * Décision : la fonctionnalité est nommée pour ce qu'elle est et **ouverte à
 * tous**, comme la Communauté. Le drapeau `vibementorCoaching` a disparu de la
 * configuration ; il n'était de toute façon lu nulle part, donc la
 * fonctionnalité était déjà ouverte à tous — sans que personne le sache.
 * `/vibementor` redirige vers `/entraide` pour ne pas casser les liens
 * existants.
 *
 * ## Ce que la page ne faisait pas
 *
 * **`isAccepted` et `isSolved` n'étaient jamais écrits.** Le modèle prévoyait
 * qu'une question soit résolue par une réponse retenue — c'est le principe même
 * d'un forum d'entraide, et ce qui le rend utile aux suivants — et rien ne
 * permettait de le faire. L'auteur d'une question peut maintenant retenir la
 * réponse qui l'a aidé.
 *
 * L'ancienne page portait aussi une section « futures fonctionnalités
 * VibeMentor » : des promesses sans date, dans un produit qui en comptait déjà
 * trop.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  BadgeCheck,
  Check,
  Compass,
  Flag,
  Heart,
  HeartHandshake,
  Loader2,
  MessageCircle,
  Plus,
  Send,
  ShieldCheck,
  Sparkle,
  UserRound,
  X,
} from "lucide-react";

import ReportModal from "@/components/ReportModal";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type Categorie =
  | "premier-contact"
  | "profil"
  | "rencontre"
  | "relation"
  | "securite"
  | "autre";

interface Auteur {
  _id: string;
  pseudonyme?: string;
  image?: string;
}

interface Reponse {
  _id: string;
  content: string;
  createdAt: string;
  isAccepted?: boolean;
  userId: Auteur | null;
}

interface Question {
  _id: string;
  question: string;
  category: Categorie;
  createdAt: string;
  isSolved?: boolean;
  userId: Auteur | null;
  likesCount: number;
  likedByMe: boolean;
  answersCount: number;
  answers?: Reponse[];
}

// ─────────────────────────────────────────────
// Catégories
// ─────────────────────────────────────────────

const CATEGORIES: Array<{
  valeur: Categorie;
  label: string;
  icone: React.ComponentType<{ size?: number | string; className?: string }>;
}> = [
  { valeur: "premier-contact", label: "Premier contact", icone: MessageCircle },
  { valeur: "profil", label: "Profil", icone: UserRound },
  { valeur: "rencontre", label: "Rencontre", icone: Compass },
  { valeur: "relation", label: "Relation", icone: Heart },
  { valeur: "securite", label: "Sécurité", icone: ShieldCheck },
  { valeur: "autre", label: "Autre", icone: Sparkle },
];

const QUESTION_MAX = 500;
const REPONSE_MAX = 1000;

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70 focus-visible:ring-offset-2 focus-visible:ring-offset-nuit";

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

export default function PageEntraide() {
  const { status } = useSession();
  const router = useRouter();
  const reduireAnimations = useReducedMotion();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [monId, setMonId] = useState("");
  const [resteDesQuestions, setResteDesQuestions] = useState(false);

  const [filtre, setFiltre] = useState<Categorie | "all">("all");
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [deplie, setDeplie] = useState<string | null>(null);
  const [likeEnCours, setLikeEnCours] = useState<string | null>(null);
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);

  const [brouillons, setBrouillons] = useState<Record<string, string>>({});
  const [signale, setSignale] = useState<string | null>(null);

  const [formulaire, setFormulaire] = useState(false);
  const [texteQuestion, setTexteQuestion] = useState("");
  const [categorieChoisie, setCategorieChoisie] =
    useState<Categorie>("premier-contact");
  const [envoi, setEnvoi] = useState(false);
  const [erreurFormulaire, setErreurFormulaire] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth?mode=login");
  }, [status, router]);

  const charger = useCallback(async (categorieFiltre: Categorie | "all") => {
    setChargement(true);
    setErreur("");

    try {
      const params = new URLSearchParams();
      if (categorieFiltre !== "all") params.set("category", categorieFiltre);
      params.set("limit", "20");

      const reponse = await fetch(`/api/entraide?${params.toString()}`, {
        cache: "no-store",
      });

      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || donnees?.success !== true) {
        setErreur(donnees?.error || "Impossible de charger l’Entraide.");
        setQuestions([]);
        return;
      }

      setQuestions(donnees.posts ?? []);
      setMonId(donnees.currentUserId ?? "");
      setResteDesQuestions(Boolean(donnees.hasMore));
    } catch {
      setErreur("Connexion interrompue. Réessaie dans un instant.");
      setQuestions([]);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") void charger(filtre);
  }, [status, filtre, charger]);

  /** Envoie une action sur une question et remplace la version locale. */
  const agir = async (
    questionId: string,
    corps: Record<string, unknown>,
    messageErreur: string
  ) => {
    try {
      const reponse = await fetch(`/api/entraide/${questionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });

      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || donnees?.success !== true) {
        setErreur(donnees?.error || messageErreur);
        return false;
      }

      if (donnees.post) {
        setQuestions((actuelles) =>
          actuelles.map((item) =>
            item._id === questionId
              ? {
                  ...item,
                  ...donnees.post,
                  likesCount: donnees.post.likes?.length ?? item.likesCount,
                  likedByMe: (donnees.post.likes ?? []).some(
                    (id: string) => String(id) === monId
                  ),
                  answersCount:
                    donnees.post.answers?.length ?? item.answersCount,
                }
              : item
          )
        );
      }

      return true;
    } catch {
      setErreur("Connexion interrompue.");
      return false;
    }
  };

  const aimer = async (question: Question) => {
    if (likeEnCours) return;

    setLikeEnCours(question._id);
    setErreur("");

    await agir(question._id, { action: "like" }, "Ce like n’a pas été enregistré.");

    setLikeEnCours(null);
  };

  const repondre = async (question: Question) => {
    const texte = (brouillons[question._id] ?? "").trim();
    if (!texte || actionEnCours) return;

    setActionEnCours(question._id);
    setErreur("");

    const ok = await agir(
      question._id,
      { action: "answer", content: texte },
      "Cette réponse n’a pas été publiée."
    );

    if (ok) {
      setBrouillons((actuels) => ({ ...actuels, [question._id]: "" }));
    }

    setActionEnCours(null);
  };

  const retenir = async (question: Question, reponseId: string) => {
    if (actionEnCours) return;

    setActionEnCours(question._id);
    setErreur("");

    await agir(
      question._id,
      { action: "accept", answerId: reponseId },
      "Cette réponse n’a pas pu être retenue."
    );

    setActionEnCours(null);
  };

  const publier = async () => {
    const texte = texteQuestion.trim();

    if (!texte) {
      setErreurFormulaire("Écris ta question.");
      return;
    }

    setEnvoi(true);
    setErreurFormulaire("");

    try {
      const reponse = await fetch("/api/entraide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: texte, category: categorieChoisie }),
      });

      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || donnees?.success !== true) {
        setErreurFormulaire(
          donnees?.error || "Cette question n’a pas pu être publiée."
        );
        return;
      }

      setFormulaire(false);
      setTexteQuestion("");
      setCategorieChoisie("premier-contact");
      await charger(filtre);
    } catch {
      setErreurFormulaire("Connexion interrompue.");
    } finally {
      setEnvoi(false);
    }
  };

  const resolues = useMemo(
    () => questions.filter((question) => question.isSolved).length,
    [questions]
  );

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-nuit">
        <Loader2 className="h-8 w-8 animate-spin text-cuivre" aria-hidden="true" />
        <span className="sr-only">Chargement</span>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-nuit px-4 py-6 text-champagne sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto max-w-3xl">
          {/* En-tête */}
          <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display flex items-center gap-2.5 text-[26px] font-extrabold leading-tight tracking-tight text-champagne sm:text-[32px]">
                <HeartHandshake
                  size={24}
                  className="shrink-0 text-cuivre"
                  aria-hidden="true"
                />
                Entraide
              </h1>

              <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-champagne/60 sm:text-sm">
                Poser une question à ceux qui y sont déjà passés. Ce sont des
                membres qui répondent, pas des professionnels — et c’est ouvert
                dès l’offre gratuite.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setFormulaire(true)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl bg-cuivre px-4 py-2.5 text-[13px] font-bold text-nuit transition-colors hover:bg-cuivre/90 ${focusRing}`}
            >
              <Plus size={15} aria-hidden="true" />
              Poser une question
            </button>
          </header>

          {/* Filtres */}
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setFiltre("all");
                setDeplie(null);
              }}
              aria-pressed={filtre === "all"}
              className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${focusRing} ${
                filtre === "all"
                  ? "border-cuivre bg-cuivre text-nuit"
                  : "border-champagne/15 text-champagne/70 hover:border-champagne/30"
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
                  onClick={() => {
                    setFiltre(item.valeur);
                    setDeplie(null);
                  }}
                  aria-pressed={actif}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${focusRing} ${
                    actif
                      ? "border-cuivre bg-cuivre text-nuit"
                      : "border-champagne/15 text-champagne/70 hover:border-champagne/30"
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
              className="mb-5 flex items-start gap-3 rounded-2xl border border-cuivre/30 bg-cuivre/10 px-4 py-3"
            >
              <AlertCircle
                size={16}
                className="mt-0.5 shrink-0 text-cuivre"
                aria-hidden="true"
              />
              <p className="flex-1 text-[13px] leading-relaxed text-champagne/85">
                {erreur}
              </p>
              <button
                type="button"
                onClick={() => setErreur("")}
                aria-label="Fermer le message"
                className={`shrink-0 rounded-lg p-1 text-champagne/55 hover:text-champagne ${focusRing}`}
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Liste */}
          {chargement ? (
            <div className="flex flex-col items-center gap-3 py-24">
              <Loader2
                className="h-7 w-7 animate-spin text-cuivre"
                aria-hidden="true"
              />
              <p className="text-[13px] text-champagne/55">
                Chargement des questions…
              </p>
            </div>
          ) : questions.length === 0 ? (
            <div className="rounded-2xl border border-champagne/10 bg-minuit px-6 py-16 text-center">
              <HeartHandshake
                size={26}
                className="mx-auto mb-4 text-champagne/60"
                aria-hidden="true"
              />

              <h2 className="font-display text-[18px] font-bold text-champagne">
                {filtre === "all"
                  ? "Aucune question pour l’instant"
                  : "Rien dans cette catégorie"}
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-champagne/60">
                {filtre === "all"
                  ? "La première question est la plus difficile à poser, et celle qui sert le plus aux suivants."
                  : "Essaie une autre catégorie, ou ouvre le sujet toi-même."}
              </p>

              <button
                type="button"
                onClick={() => setFormulaire(true)}
                className={`mt-6 inline-flex items-center gap-2 rounded-xl bg-cuivre px-5 py-2.5 text-[13px] font-bold text-nuit transition-colors hover:bg-cuivre/90 ${focusRing}`}
              >
                <Plus size={15} aria-hidden="true" />
                Poser une question
              </button>
            </div>
          ) : (
            <>
              {resolues > 0 && (
                <p className="mb-3 text-[12px] text-champagne/55">
                  {resolues} question{resolues > 1 ? "s" : ""} sur{" "}
                  {questions.length} {resolues > 1 ? "ont" : "a"} trouvé une
                  réponse retenue.
                </p>
              )}

              <ul className="space-y-3">
                {questions.map((question) => (
                  <CarteQuestion
                    key={question._id}
                    question={question}
                    monId={monId}
                    deplie={deplie === question._id}
                    likeEnCours={likeEnCours === question._id}
                    actionEnCours={actionEnCours === question._id}
                    brouillon={brouillons[question._id] ?? ""}
                    onDeplier={() =>
                      setDeplie((actuel) =>
                        actuel === question._id ? null : question._id
                      )
                    }
                    onAimer={() => aimer(question)}
                    onBrouillon={(texte) =>
                      setBrouillons((actuels) => ({
                        ...actuels,
                        [question._id]: texte,
                      }))
                    }
                    onRepondre={() => repondre(question)}
                    onRetenir={(reponseId) => retenir(question, reponseId)}
                    onSignaler={() => setSignale(question._id)}
                  />
                ))}
              </ul>

              {resteDesQuestions && (
                <p className="mt-6 text-center text-[12px] text-champagne/55">
                  Seules les 20 questions les plus récentes de cette catégorie
                  sont affichées.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Formulaire */}
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
            aria-labelledby="titre-question"
          >
            <button
              type="button"
              onClick={() => setFormulaire(false)}
              aria-label="Fermer"
              className="absolute inset-0 cursor-default bg-nuit/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: reduireAnimations ? 0 : 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduireAnimations ? 0 : 24 }}
              transition={{ duration: reduireAnimations ? 0 : 0.25 }}
              className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-[1.75rem] border border-champagne/10 bg-minuit p-5 sm:rounded-[1.75rem] sm:p-6"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <h2
                  id="titre-question"
                  className="font-display text-[19px] font-bold text-champagne"
                >
                  Poser une question
                </h2>

                <button
                  type="button"
                  onClick={() => setFormulaire(false)}
                  aria-label="Fermer"
                  className={`shrink-0 rounded-lg p-1.5 text-champagne/55 hover:text-champagne ${focusRing}`}
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
                <fieldset>
                  <legend className="mb-2 text-[12px] font-semibold text-champagne/70">
                    Sur quoi porte ta question ?
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
                              ? "border-cuivre bg-cuivre text-nuit"
                              : "border-champagne/15 text-champagne/70 hover:border-champagne/30"
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
                    htmlFor="texte-question"
                    className="mb-1.5 block text-[12px] font-semibold text-champagne/70"
                  >
                    Ta question
                  </label>

                  <textarea
                    id="texte-question"
                    rows={5}
                    value={texteQuestion}
                    onChange={(evenement) =>
                      setTexteQuestion(
                        evenement.target.value.slice(0, QUESTION_MAX)
                      )
                    }
                    placeholder="Une question précise obtient de meilleures réponses qu’une question large."
                    className={`w-full resize-y rounded-xl border border-champagne/12 bg-nuit px-3.5 py-2.5 text-[14px] leading-relaxed text-champagne placeholder:text-champagne/55 ${focusRing}`}
                  />

                  <p className="mt-1.5 text-[11px] text-champagne/55">
                    {texteQuestion.length} / {QUESTION_MAX} caractères. Les
                    questions passent par le même filtre que la messagerie.
                  </p>
                </div>

                {erreurFormulaire && (
                  <p
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-cuivre/30 bg-cuivre/10 px-3.5 py-2.5 text-[12px] leading-relaxed text-champagne/85"
                  >
                    <AlertCircle
                      size={14}
                      className="mt-0.5 shrink-0 text-cuivre"
                      aria-hidden="true"
                    />
                    {erreurFormulaire}
                  </p>
                )}

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    type="submit"
                    disabled={envoi || !texteQuestion.trim()}
                    className={`inline-flex items-center gap-2 rounded-xl bg-cuivre px-5 py-2.5 text-[13px] font-bold text-nuit transition-colors hover:bg-cuivre/90 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
                  >
                    {envoi ? (
                      <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Send size={14} aria-hidden="true" />
                    )}
                    Publier
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormulaire(false)}
                    className={`inline-flex items-center rounded-xl border border-champagne/15 px-4 py-2.5 text-[13px] font-semibold text-champagne/80 transition-colors hover:border-champagne/30 hover:text-champagne ${focusRing}`}
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
// Carte de question
// ─────────────────────────────────────────────

function CarteQuestion({
  question,
  monId,
  deplie,
  likeEnCours,
  actionEnCours,
  brouillon,
  onDeplier,
  onAimer,
  onBrouillon,
  onRepondre,
  onRetenir,
  onSignaler,
}: {
  question: Question;
  monId: string;
  deplie: boolean;
  likeEnCours: boolean;
  actionEnCours: boolean;
  brouillon: string;
  onDeplier: () => void;
  onAimer: () => void;
  onBrouillon: (texte: string) => void;
  onRepondre: () => void;
  onRetenir: (reponseId: string) => void;
  onSignaler: () => void;
}) {
  const cat = categorie(question.category);
  const IconeCategorie = cat.icone;
  const auteur = question.userId?.pseudonyme ?? "Membre retiré";

  /** Seul l'auteur de la question peut retenir une réponse. */
  const jeSuisLAuteur = Boolean(monId) && question.userId?._id === monId;

  const reponses = question.answers ?? [];
  const retenue = reponses.find((reponse) => reponse.isAccepted);

  return (
    <li className="rounded-2xl border border-champagne/10 bg-minuit p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-champagne/12 px-2.5 py-0.5 text-[11px] text-champagne/70">
          <IconeCategorie size={11} aria-hidden="true" />
          {cat.label}
        </span>

        {question.isSolved && (
          <span className="inline-flex items-center gap-1 rounded-full bg-succes/15 px-2.5 py-0.5 text-[11px] font-bold text-succes">
            <BadgeCheck size={11} aria-hidden="true" />
            Réponse retenue
          </span>
        )}

        <span className="text-[11px] text-champagne/55">
          {auteur} · {formaterDate(question.createdAt)}
        </span>
      </div>

      <h2 className="font-display mt-3 text-[16px] font-bold leading-snug text-champagne">
        {question.question}
      </h2>

      {/* Aperçu de la réponse retenue, sans déplier */}
      {retenue && !deplie && (
        <div className="mt-3 rounded-xl border border-succes/20 bg-succes/[0.06] p-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-succes">
            Réponse retenue
          </p>
          <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-champagne/80">
            {retenue.content}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onAimer}
          disabled={likeEnCours}
          aria-pressed={question.likedByMe}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[12px] font-semibold transition-colors disabled:opacity-60 ${focusRing} ${
            question.likedByMe
              ? "border-succes/30 bg-succes/15 text-succes"
              : "border-champagne/12 text-champagne/70 hover:border-champagne/25 hover:text-champagne"
          }`}
        >
          <Heart
            size={13}
            className={question.likedByMe ? "fill-succes" : ""}
            aria-hidden="true"
          />
          {question.likesCount}
          <span className="sr-only">
            {question.likesCount > 1 ? "mentions utile" : "mention utile"}
          </span>
        </button>

        <button
          type="button"
          onClick={onDeplier}
          aria-expanded={deplie}
          className={`inline-flex items-center gap-1.5 rounded-xl border border-champagne/12 px-3.5 py-2 text-[12px] font-semibold text-champagne/70 transition-colors hover:border-champagne/25 hover:text-champagne ${focusRing}`}
        >
          <MessageCircle size={13} aria-hidden="true" />
          {question.answersCount} réponse{question.answersCount > 1 ? "s" : ""}
        </button>

        <span className="flex-1" />

        <button
          type="button"
          onClick={onSignaler}
          aria-label="Signaler cette question"
          className={`rounded-xl border border-champagne/12 p-2 text-champagne/55 transition-colors hover:border-cuivre/40 hover:text-cuivre ${focusRing}`}
        >
          <Flag size={13} aria-hidden="true" />
        </button>
      </div>

      {/* Réponses */}
      {deplie && (
        <div className="mt-4 border-t border-champagne/10 pt-4">
          {reponses.length > 0 ? (
            <ul className="space-y-3">
              {reponses.map((reponse) => (
                <li
                  key={reponse._id}
                  className={`rounded-xl border p-3.5 ${
                    reponse.isAccepted
                      ? "border-succes/25 bg-succes/[0.06]"
                      : "border-champagne/10"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[12px] font-bold text-champagne">
                      {reponse.userId?.pseudonyme ?? "Membre retiré"}
                    </span>

                    <span className="text-[11px] text-champagne/55">
                      {formaterDate(reponse.createdAt)}
                    </span>

                    {reponse.isAccepted && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-succes/15 px-2 py-0.5 text-[11px] font-bold text-succes">
                        <Check size={10} aria-hidden="true" />
                        Retenue
                      </span>
                    )}
                  </div>

                  <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-champagne/80">
                    {reponse.content}
                  </p>

                  {jeSuisLAuteur && (
                    <button
                      type="button"
                      onClick={() => onRetenir(reponse._id)}
                      disabled={actionEnCours}
                      className={`mt-3 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-60 ${focusRing} ${
                        reponse.isAccepted
                          ? "border-champagne/15 text-champagne/70 hover:border-champagne/30 hover:text-champagne"
                          : "border-succes/30 text-succes hover:bg-succes/10"
                      }`}
                    >
                      <Check size={11} aria-hidden="true" />
                      {reponse.isAccepted
                        ? "Ne plus retenir"
                        : "Retenir cette réponse"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-champagne/55">
              Personne n’a encore répondu. Une réponse, même courte, vaut mieux
              que le silence.
            </p>
          )}

          <form
            onSubmit={(evenement) => {
              evenement.preventDefault();
              onRepondre();
            }}
            className="mt-4"
          >
            <label htmlFor={`reponse-${question._id}`} className="sr-only">
              Ta réponse
            </label>

            <div className="flex items-end gap-2">
              <textarea
                id={`reponse-${question._id}`}
                rows={2}
                value={brouillon}
                onChange={(evenement) =>
                  onBrouillon(evenement.target.value.slice(0, REPONSE_MAX))
                }
                placeholder="Répondre à partir de ton expérience…"
                className={`min-w-0 flex-1 resize-y rounded-xl border border-champagne/12 bg-nuit px-3.5 py-2.5 text-[13px] leading-relaxed text-champagne placeholder:text-champagne/55 ${focusRing}`}
              />

              <button
                type="submit"
                disabled={!brouillon.trim() || actionEnCours}
                aria-label="Envoyer la réponse"
                className={`shrink-0 rounded-xl bg-cuivre p-2.5 text-nuit transition-colors hover:bg-cuivre/90 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
              >
                {actionEnCours ? (
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Send size={15} aria-hidden="true" />
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </li>
  );
}
