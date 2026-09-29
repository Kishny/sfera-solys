// src/app/(app)/matches/page.tsx

"use client";

/**
 * Mises en relation.
 *
 * ## Trois choses que cette page ne faisait pas
 *
 * **1. Aucun moyen de mettre fin à une relation.** `DELETE /api/likes` existe
 * depuis le début — il retire le like et désactive le match — et **aucune page
 * du site ne l'appelait**. Les champs `archivedBy`, `mutedBy` et `deletedBy` du
 * modèle `Match` ne sont lus nulle part non plus. Un membre pouvait entrer dans
 * une relation, jamais en sortir.
 *
 * Ce trou devient bloquant maintenant que le plafond de l'offre gratuite est
 * appliqué : « libère une place » n'a de sens que s'il existe un bouton pour le
 * faire. L'action est en deux temps, dans la carte, sans boîte de dialogue
 * native : on clique, la carte demande confirmation.
 *
 * **2. Les messages non lus étaient calculés puis jetés.** `/api/matches`
 * agrège `unreadCount` par conversation — le type `MatchItem` de l'ancienne
 * page ne le déclarait même pas. Le travail était fait côté serveur et ignoré
 * côté client.
 *
 * **3. L'archivage et la sourdine ne faisaient rien.** `archivedBy` et
 * `mutedBy` étaient écrits par leurs routes et relus nulle part. Archiver une
 * conversation ne la retirait d'aucune liste. Elles sont maintenant masquées par
 * défaut, avec un basculement pour les revoir — et elles **continuent d'occuper
 * une place** dans le plafond : archiver est un rangement, pas une sortie.
 *
 * **4. Le plafond était invisible.** L'offre gratuite est limitée à 3 mises en
 * relation. Sans affichage, un membre au plafond ne voit rien : juste des likes
 * réciproques qui ne donnent rien. La page montre l'état (« 3 sur 3 ») et le
 * nombre de relations en attente d'une place.
 *
 * ## Structure
 *
 * L'ancienne page maintenait **deux arbres de cartes** — un accordéon pour
 * mobile, des cartes complètes à partir de `md` — soit la même information
 * écrite deux fois, avec le risque habituel de divergence. Une seule carte,
 * responsive, la remplace.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  Archive,
  BellOff,
  Flag,
  Heart,
  Hourglass,
  Loader2,
  MapPin,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import ReportModal from "@/components/ReportModal";
import { getDepartementLabel } from "@/lib/locations";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface MembreMatche {
  _id: string;
  pseudonyme: string;
  age?: number;
  localisation?: string;
  departement?: string;
  interets?: string[];
  intentions?: string[];
  image?: string;
  identityVerified?: boolean;
}

interface Relation {
  matchId: string;
  createdAt: string;
  lastMessageAt: string | null;
  unreadCount?: number;
  hasUnreadMessage?: boolean;
  /** Rangée par le membre connecté, pas par l'autre. */
  archivee?: boolean;
  /** Sourdine encore valide côté serveur. */
  sourdineActive?: boolean;
  user: MembreMatche | null;
}

interface Plafond {
  actifs: number;
  /** `null` = illimité. */
  maximum: number | null;
  restants: number | null;
  atteint: boolean;
  enAttente: number;
}

// ─────────────────────────────────────────────
// Libellés
// ─────────────────────────────────────────────

const INTENTIONS: Record<string, string> = {
  "rencontre-serieuse": "Rencontre sérieuse",
  amitie: "Amitié",
  aventure: "Aventure",
  reseautage: "Réseautage",
  discussion: "Discussion",
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss";

/** Date relative courte, puis date absolue au-delà d'un jour. */
function formaterDate(valeur: string | null): string | null {
  if (!valeur) return null;

  const date = new Date(valeur);
  if (Number.isNaN(date.getTime())) return null;

  const secondes = Math.floor((Date.now() - date.getTime()) / 1000);

  if (secondes < 60) return "à l’instant";
  if (secondes < 3600) return `il y a ${Math.floor(secondes / 60)} min`;
  if (secondes < 86400) return `il y a ${Math.floor(secondes / 3600)} h`;

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function PageRelations() {
  const { status } = useSession();
  const router = useRouter();
  const reduireAnimations = useReducedMotion();

  const [relations, setRelations] = useState<Relation[]>([]);
  const [plafond, setPlafond] = useState<Plafond | null>(null);

  const [chargement, setChargement] = useState(true);
  const [rafraichissement, setRafraichissement] = useState(false);
  const [erreur, setErreur] = useState("");

  const [recherche, setRecherche] = useState("");
  const [voirArchivees, setVoirArchivees] = useState(false);

  /** Relation dont la fin est en attente de confirmation. */
  const [finDemandee, setFinDemandee] = useState<string | null>(null);
  const [finEnCours, setFinEnCours] = useState<string | null>(null);

  const [signale, setSignale] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth?mode=login");
  }, [status, router]);

  const charger = useCallback(async (rafraichir = false) => {
    if (rafraichir) setRafraichissement(true);
    else setChargement(true);

    setErreur("");

    try {
      const reponse = await fetch("/api/matches", { cache: "no-store" });
      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || donnees?.success !== true) {
        setErreur(donnees?.error || "Impossible de charger tes relations.");
        return;
      }

      setRelations(donnees.matches ?? []);
      setPlafond(donnees.plafond ?? null);
    } catch {
      setErreur("Connexion interrompue. Réessaie dans un instant.");
    } finally {
      setChargement(false);
      setRafraichissement(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") void charger();
  }, [status, charger]);

  /**
   * Met fin à une relation.
   *
   * Retire le like et désactive le match côté serveur, ce qui libère une place.
   * On recharge ensuite la liste : le serveur peut avoir ouvert dans la foulée
   * une relation qui attendait cette place, et elle doit apparaître.
   */
  const mettreFin = async (relation: Relation) => {
    if (!relation.user || finEnCours) return;

    setFinEnCours(relation.matchId);
    setErreur("");

    try {
      const reponse = await fetch("/api/likes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: relation.user._id }),
      });

      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || donnees?.success !== true) {
        setErreur(donnees?.error || "Cette relation n’a pas pu être fermée.");
        return;
      }

      setFinDemandee(null);
      await charger(true);
    } catch {
      setErreur("Connexion interrompue.");
    } finally {
      setFinEnCours(null);
    }
  };

  const archivees = useMemo(
    () => relations.filter((relation) => relation.archivee === true).length,
    [relations]
  );

  const filtrees = useMemo(() => {
    const terme = recherche.trim().toLowerCase();

    const visibles = relations.filter((relation) =>
      voirArchivees ? relation.archivee === true : relation.archivee !== true
    );

    if (!terme) return visibles;

    return visibles.filter((relation) => {
      const membre = relation.user;
      if (!membre) return false;

      const champs = [
        membre.pseudonyme,
        membre.localisation,
        getDepartementLabel(membre.departement),
        ...(membre.interets ?? []),
        ...(membre.intentions ?? []).map((item) => INTENTIONS[item] ?? item),
      ];

      return champs.filter(Boolean).some((champ) =>
        String(champ).toLowerCase().includes(terme)
      );
    });
  }, [relations, recherche, voirArchivees]);

  const nonLus = useMemo(
    () =>
      relations.reduce(
        (total, relation) => total + (relation.unreadCount ?? 0),
        0
      ),
    [relations]
  );

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
        <div className="mx-auto max-w-4xl">
          {/* En-tête */}
          <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display [font-stretch:125%] text-[26px] font-extrabold leading-tight tracking-tight text-cream sm:text-[32px]">
                Mises en relation
              </h1>

              <p
                className="mt-1.5 text-[13px] leading-relaxed text-cream/60 sm:text-sm"
                aria-live="polite"
              >
                {chargement
                  ? "Chargement…"
                  : relations.length === 0
                    ? "Aucune relation ouverte pour l’instant."
                    : `${relations.length} relation${relations.length > 1 ? "s" : ""}${
                        nonLus > 0
                          ? ` · ${nonLus} message${nonLus > 1 ? "s" : ""} non lu${nonLus > 1 ? "s" : ""}`
                          : ""
                      }`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => charger(true)}
              disabled={rafraichissement}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl border border-cream/12 px-3.5 py-2.5 text-[13px] font-semibold text-cream transition-colors hover:border-cream/25 disabled:opacity-50 ${focusRing}`}
            >
              <RefreshCw
                size={14}
                className={rafraichissement ? "animate-spin" : ""}
                aria-hidden="true"
              />
              Rafraîchir
            </button>
          </header>

          {/* Plafond de l'offre */}
          {plafond && plafond.maximum !== null && (
            <section
              className={`mb-5 rounded-2xl border px-4 py-3.5 sm:px-5 ${
                plafond.atteint
                  ? "border-orange/30 bg-orange/10"
                  : "border-cream/10 bg-[#123243]"
              }`}
            >
              <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px] leading-relaxed text-cream/80">
                <strong className="font-bold text-cream">
                  {plafond.actifs} sur {plafond.maximum}
                </strong>
                <span className="text-cream/60">
                  mises en relation pour ton offre.
                </span>
              </p>

              {plafond.enAttente > 0 && (
                <p className="mt-2 flex items-start gap-2 text-[12px] leading-relaxed text-cream/70">
                  <Hourglass
                    size={13}
                    className="mt-0.5 shrink-0 text-orange"
                    aria-hidden="true"
                  />
                  <span>
                    {plafond.enAttente === 1
                      ? "Une relation réciproque attend une place libre."
                      : `${plafond.enAttente} relations réciproques attendent une place libre.`}{" "}
                    Elles s’ouvriront dès que tu mettras fin à une relation en
                    cours, sans que personne ait à refaire un geste.
                  </span>
                </p>
              )}

              {plafond.atteint && (
                <p className="mt-2 text-[12px] leading-relaxed text-cream/70">
                  Tu peux libérer une place ci-dessous, ou{" "}
                  <Link
                    href="/tarifs"
                    className={`font-semibold text-cream underline underline-offset-2 hover:text-orange ${focusRing}`}
                  >
                    voir les offres sans plafond
                  </Link>
                  .
                </p>
              )}
            </section>
          )}

          {/* Recherche */}
          {relations.length > 0 && (
            <div className="mb-5">
              <label htmlFor="recherche-relations" className="sr-only">
                Rechercher dans tes relations
              </label>

              <div className="relative">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/55"
                  aria-hidden="true"
                />

                <input
                  id="recherche-relations"
                  type="search"
                  value={recherche}
                  onChange={(evenement) => setRecherche(evenement.target.value)}
                  placeholder="Pseudonyme, ville, centre d’intérêt…"
                  className={`w-full rounded-xl border border-cream/12 bg-[#123243] py-2.5 pl-10 pr-3 text-[13px] text-cream placeholder:text-cream/55 ${focusRing}`}
                />
              </div>
            </div>
          )}

          {/* Archivées */}
          {archivees > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setVoirArchivees(false)}
                aria-pressed={!voirArchivees}
                className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${focusRing} ${
                  voirArchivees
                    ? "border-cream/15 text-cream/70 hover:border-cream/30"
                    : "border-orange bg-orange text-abyss"
                }`}
              >
                En cours
              </button>

              <button
                type="button"
                onClick={() => setVoirArchivees(true)}
                aria-pressed={voirArchivees}
                className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${focusRing} ${
                  voirArchivees
                    ? "border-orange bg-orange text-abyss"
                    : "border-cream/15 text-cream/70 hover:border-cream/30"
                }`}
              >
                Rangées ({archivees})
              </button>

              <p className="text-[11px] leading-relaxed text-cream/55">
                Une relation rangée occupe toujours une place.
              </p>
            </div>
          )}

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

          {/* Liste */}
          {chargement ? (
            <div className="flex flex-col items-center gap-3 py-24">
              <Loader2
                className="h-7 w-7 animate-spin text-orange"
                aria-hidden="true"
              />
              <p className="text-[13px] text-cream/55">
                Chargement de tes relations…
              </p>
            </div>
          ) : relations.length === 0 ? (
            <div className="rounded-2xl border border-cream/10 bg-[#123243] px-6 py-16 text-center">
              <Heart
                size={26}
                className="mx-auto mb-4 text-cream/60"
                aria-hidden="true"
              />

              <h2 className="font-display [font-stretch:125%] text-[18px] font-bold text-cream">
                Rien d’ouvert pour l’instant
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-cream/60">
                Une relation s’ouvre quand un like est réciproque. Personne ne
                sait que tu l’as aimé avant ça.
              </p>

              <Link
                href="/explorer"
                className={`mt-6 inline-flex items-center gap-2 rounded-xl bg-orange px-5 py-2.5 text-[13px] font-bold text-abyss transition-colors hover:bg-orange/90 ${focusRing}`}
              >
                Parcourir l’annuaire
              </Link>
            </div>
          ) : filtrees.length === 0 ? (
            <div className="rounded-2xl border border-cream/10 bg-[#123243] px-6 py-14 text-center">
              <p className="text-[14px] font-semibold text-cream">
                Aucune relation ne correspond à « {recherche.trim()} »
              </p>

              <button
                type="button"
                onClick={() => setRecherche("")}
                className={`mt-5 inline-flex items-center gap-2 rounded-xl border border-cream/15 px-4 py-2.5 text-[13px] font-semibold text-cream transition-colors hover:border-cream/30 ${focusRing}`}
              >
                Effacer la recherche
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {filtrees.map((relation) => (
                  <motion.li
                    key={relation.matchId}
                    layout={!reduireAnimations}
                    initial={{ opacity: 0, y: reduireAnimations ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: reduireAnimations ? 1 : 0.98 }}
                    transition={{ duration: reduireAnimations ? 0 : 0.2 }}
                  >
                    <CarteRelation
                      relation={relation}
                      finDemandee={finDemandee === relation.matchId}
                      finEnCours={finEnCours === relation.matchId}
                      onDemanderFin={() => setFinDemandee(relation.matchId)}
                      onAnnulerFin={() => setFinDemandee(null)}
                      onConfirmerFin={() => mettreFin(relation)}
                      onSignaler={(membreId) => setSignale(membreId)}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>

      <ReportModal
        isOpen={signale !== null}
        targetId={signale ?? ""}
        targetType="user"
        onClose={() => setSignale(null)}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// Carte
// ─────────────────────────────────────────────

function CarteRelation({
  relation,
  finDemandee,
  finEnCours,
  onDemanderFin,
  onAnnulerFin,
  onConfirmerFin,
  onSignaler,
}: {
  relation: Relation;
  finDemandee: boolean;
  finEnCours: boolean;
  onDemanderFin: () => void;
  onAnnulerFin: () => void;
  onConfirmerFin: () => void;
  onSignaler: (membreId: string) => void;
}) {
  const membre = relation.user;

  /**
   * Le compte a pu être supprimé ou suspendu entre-temps : l'API renvoie alors
   * `user: null`. On l'affiche au lieu de masquer la ligne, sinon le décompte
   * du plafond ne correspondrait à rien de visible.
   */
  if (!membre) {
    return (
      <div className="rounded-2xl border border-cream/10 bg-[#123243] px-5 py-4">
        <p className="text-[13px] text-cream/60">
          Ce membre n’est plus disponible. La relation reste comptée tant qu’elle
          n’est pas fermée.
        </p>
      </div>
    );
  }

  const lieu = [membre.localisation, getDepartementLabel(membre.departement)]
    .filter(Boolean)
    .join(" · ");

  const intentions = (membre.intentions ?? []).slice(0, 2);
  const nonLus = relation.unreadCount ?? 0;
  const derniereActivite =
    formaterDate(relation.lastMessageAt) ?? formaterDate(relation.createdAt);

  return (
    <article className="rounded-2xl border border-cream/10 bg-[#123243] p-4 sm:p-5">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Link
          href={`/profil/${membre._id}?from=matches`}
          className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-cream/12 bg-abyss ${focusRing}`}
        >
          {membre.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={membre.image}
              alt={`Photo de ${membre.pseudonyme}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center">
              <UserRound size={22} className="text-cream/60" aria-hidden="true" />
            </span>
          )}
        </Link>

        {/* Informations */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/profil/${membre._id}?from=matches`}
              className={`font-display [font-stretch:125%] min-w-0 truncate text-[16px] font-bold text-cream hover:text-orange ${focusRing}`}
            >
              {membre.pseudonyme}
              {membre.age ? `, ${membre.age}` : ""}
            </Link>

            {membre.identityVerified && (
              <span className="flex items-center gap-1 rounded-full bg-lime/15 px-2 py-0.5 text-[11px] font-bold text-lime">
                <ShieldCheck size={11} aria-hidden="true" />
                Vérifié
              </span>
            )}

            {nonLus > 0 && (
              <span className="rounded-full bg-orange px-2 py-0.5 text-[11px] font-bold text-abyss">
                {nonLus} non lu{nonLus > 1 ? "s" : ""}
              </span>
            )}

            {relation.sourdineActive && (
              <span className="flex items-center gap-1 rounded-full border border-cream/15 px-2 py-0.5 text-[11px] font-semibold text-cream/70">
                <BellOff size={11} aria-hidden="true" />
                En sourdine
              </span>
            )}

            {relation.archivee && (
              <span className="flex items-center gap-1 rounded-full border border-cream/15 px-2 py-0.5 text-[11px] font-semibold text-cream/70">
                <Archive size={11} aria-hidden="true" />
                Rangée
              </span>
            )}
          </div>

          {lieu && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-cream/55">
              <MapPin size={12} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{lieu}</span>
            </p>
          )}

          {intentions.length > 0 && (
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {intentions.map((intention) => (
                <li
                  key={intention}
                  className="rounded-full border border-cream/12 px-2.5 py-0.5 text-[11px] text-cream/70"
                >
                  {INTENTIONS[intention] ?? intention}
                </li>
              ))}
            </ul>
          )}

          {derniereActivite && (
            <p className="mt-2.5 text-[11px] text-cream/55">
              {relation.lastMessageAt
                ? `Dernier message ${derniereActivite}`
                : `En relation depuis ${derniereActivite}`}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      {finDemandee ? (
        <div className="mt-4 rounded-xl border border-orange/30 bg-orange/10 p-3.5">
          <p className="text-[13px] leading-relaxed text-cream/85">
            Mettre fin à cette relation retire ton like et ferme la conversation.
            {" "}
            {membre.pseudonyme} n’est pas prévenu. Une place se libère, et une
            relation en attente peut s’ouvrir aussitôt.
          </p>

          <div className="mt-3.5 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onConfirmerFin}
              disabled={finEnCours}
              className={`inline-flex items-center gap-2 rounded-xl bg-orange px-4 py-2.5 text-[12px] font-bold text-abyss transition-colors hover:bg-orange/90 disabled:opacity-50 ${focusRing}`}
            >
              {finEnCours && (
                <Loader2 size={13} className="animate-spin" aria-hidden="true" />
              )}
              Confirmer
            </button>

            <button
              type="button"
              onClick={onAnnulerFin}
              disabled={finEnCours}
              className={`inline-flex items-center rounded-xl border border-cream/15 px-4 py-2.5 text-[12px] font-semibold text-cream/80 transition-colors hover:border-cream/30 hover:text-cream disabled:opacity-50 ${focusRing}`}
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href={`/messages/${relation.matchId}`}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange px-4 py-2.5 text-[12px] font-bold text-abyss transition-colors hover:bg-orange/90 sm:flex-none ${focusRing}`}
          >
            <MessageCircle size={14} aria-hidden="true" />
            {relation.lastMessageAt ? "Continuer" : "Écrire"}
          </Link>

          <Link
            href={`/profil/${membre._id}?from=matches`}
            className={`inline-flex items-center justify-center rounded-xl border border-cream/15 px-4 py-2.5 text-[12px] font-semibold text-cream transition-colors hover:border-cream/30 ${focusRing}`}
          >
            Profil
          </Link>

          <span className="flex-1" />

          <button
            type="button"
            onClick={() => onSignaler(membre._id)}
            aria-label={`Signaler ${membre.pseudonyme}`}
            className={`inline-flex items-center justify-center rounded-xl border border-cream/12 p-2.5 text-cream/55 transition-colors hover:border-orange/40 hover:text-orange ${focusRing}`}
          >
            <Flag size={13} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onDemanderFin}
            className={`inline-flex items-center justify-center rounded-xl border border-cream/12 px-4 py-2.5 text-[12px] font-semibold text-cream/70 transition-colors hover:border-orange/40 hover:text-cream ${focusRing}`}
          >
            Mettre fin
          </button>
        </div>
      )}
    </article>
  );
}
