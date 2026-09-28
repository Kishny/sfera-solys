// src/app/(app)/evenements/page.tsx

"use client";

/**
 * Événements Solys.
 *
 * ## Ce que la page portait encore
 *
 * Le titre affichait **« Événements Solys 🌙 »** — la lune, symbole de la
 * marque d'origine, collée au nom de la version solaire. L'état vide affichait
 * la même lune en grand. Et le type local s'appelait `LunaEvent`, comme le
 * modèle qui vient d'être renommé en `SolysEvent`.
 *
 * ## Les contrôles d'accès, corrigés côté serveur
 *
 * `/tarifs` vend « Événements exclusifs » à partir de l'offre Essentiel et
 * `eventsAccess` vaut `false` sur l'offre gratuite. Aucune des deux routes ne
 * lisait ce drapeau : tout compte connecté pouvait s'inscrire. Le détail est
 * dans `/api/events`.
 *
 * Le partage retenu se lit ici : **la liste reste visible par tous** — un
 * événement à venir est un argument, le cacher n'aide personne — et
 * l'inscription demande une offre payante. La page le dit avant le clic, au
 * lieu de laisser découvrir le refus après.
 *
 * ## Structure
 *
 * Comme `/matches` avant sa migration, la page maintenait **deux arbres de
 * cartes** — un pour mobile, un à partir de `md` — soit la même information
 * écrite deux fois. Une seule carte responsive les remplace.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  CalendarDays,
  Check,
  Clock,
  Loader2,
  Lock,
  MapPin,
  Monitor,
  Users,
  X,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Evenement {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  isOnline: boolean;
  maxAttendees: number;
  attendeeCount: number;
  category: string;
  isRegistered: boolean;
  isPast: boolean;
  isFull: boolean;
}

type Filtre = "all" | "online" | "presentiel";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss";

const FILTRES: Array<{ valeur: Filtre; label: string }> = [
  { valeur: "all", label: "Tous" },
  { valeur: "presentiel", label: "En présentiel" },
  { valeur: "online", label: "En ligne" },
];

function formaterDate(valeur: string): string {
  const date = new Date(valeur);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formaterHeure(valeur: string): string {
  const date = new Date(valeur);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function PageEvenements() {
  const { status } = useSession();
  const router = useRouter();
  const reduireAnimations = useReducedMotion();

  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [peutSinscrire, setPeutSinscrire] = useState(true);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [filtre, setFiltre] = useState<Filtre>("all");
  const [voirPasses, setVoirPasses] = useState(false);

  const [inscriptionEnCours, setInscriptionEnCours] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth?mode=login");
  }, [status, router]);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur("");

    try {
      const reponse = await fetch("/api/events", { cache: "no-store" });
      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || donnees?.success !== true) {
        setErreur(donnees?.error || "Impossible de charger les événements.");
        return;
      }

      setEvenements(donnees.events ?? []);
      setPeutSinscrire(donnees.peutSinscrire !== false);
    } catch {
      setErreur("Connexion interrompue. Réessaie dans un instant.");
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") void charger();
  }, [status, charger]);

  const basculerInscription = async (evenement: Evenement) => {
    if (inscriptionEnCours) return;

    setInscriptionEnCours(evenement._id);
    setErreur("");

    try {
      const reponse = await fetch(`/api/events/${evenement._id}`, {
        method: "POST",
      });

      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || donnees?.success !== true) {
        setErreur(donnees?.error || "Cette inscription n’a pas pu aboutir.");
        return;
      }

      setEvenements((actuels) =>
        actuels.map((item) =>
          item._id === evenement._id
            ? {
                ...item,
                isRegistered: donnees.registered === true,
                attendeeCount: donnees.attendeeCount ?? item.attendeeCount,
                isFull:
                  (donnees.attendeeCount ?? item.attendeeCount) >=
                  item.maxAttendees,
              }
            : item
        )
      );
    } catch {
      setErreur("Connexion interrompue.");
    } finally {
      setInscriptionEnCours(null);
    }
  };

  const aVenir = useMemo(
    () =>
      evenements
        .filter((evenement) => !evenement.isPast)
        .filter((evenement) => {
          if (filtre === "online") return evenement.isOnline;
          if (filtre === "presentiel") return !evenement.isOnline;
          return true;
        }),
    [evenements, filtre]
  );

  const passes = useMemo(
    () => evenements.filter((evenement) => evenement.isPast),
    [evenements]
  );

  const mesInscriptions = useMemo(
    () =>
      evenements.filter(
        (evenement) => evenement.isRegistered && !evenement.isPast
      ).length,
    [evenements]
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
    <div className="min-h-screen bg-abyss px-4 py-6 text-cream sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-4xl">
        {/* En-tête */}
        <header className="mb-5">
          <h1 className="font-display [font-stretch:125%] text-[26px] font-extrabold leading-tight tracking-tight text-cream sm:text-[32px]">
            Événements Solys
          </h1>

          <p
            className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-cream/60 sm:text-sm"
            aria-live="polite"
          >
            {chargement
              ? "Chargement…"
              : aVenir.length === 0
                ? "Aucun événement à venir pour l’instant."
                : `${aVenir.length} événement${aVenir.length > 1 ? "s" : ""} à venir${
                    mesInscriptions > 0
                      ? ` · tu es inscrit à ${mesInscriptions}`
                      : ""
                  }.`}
          </p>
        </header>

        {/* Accès */}
        {!chargement && !peutSinscrire && (
          <section className="mb-5 rounded-2xl border border-orange/30 bg-orange/10 px-4 py-3.5 sm:px-5">
            <p className="flex items-start gap-2.5 text-[13px] leading-relaxed text-cream/85">
              <Lock
                size={15}
                className="mt-0.5 shrink-0 text-orange"
                aria-hidden="true"
              />
              <span>
                Tu peux consulter les événements, mais l’inscription s’ouvre à
                partir de l’offre Essentiel.{" "}
                <Link
                  href="/tarifs"
                  className={`font-semibold text-cream underline underline-offset-2 hover:text-orange ${focusRing}`}
                >
                  Voir les offres
                </Link>
                .
              </span>
            </p>
          </section>
        )}

        {/* Filtres */}
        {!chargement && evenements.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {FILTRES.map((item) => {
              const actif = filtre === item.valeur;

              return (
                <button
                  key={item.valeur}
                  type="button"
                  onClick={() => setFiltre(item.valeur)}
                  aria-pressed={actif}
                  className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${focusRing} ${
                    actif
                      ? "border-orange bg-orange text-abyss"
                      : "border-cream/15 text-cream/70 hover:border-cream/30"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
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

        {/* À venir */}
        {chargement ? (
          <div className="flex flex-col items-center gap-3 py-24">
            <Loader2
              className="h-7 w-7 animate-spin text-orange"
              aria-hidden="true"
            />
            <p className="text-[13px] text-cream/55">
              Chargement des événements…
            </p>
          </div>
        ) : aVenir.length === 0 ? (
          <div className="rounded-2xl border border-cream/10 bg-[#0C222D] px-6 py-16 text-center">
            <CalendarDays
              size={26}
              className="mx-auto mb-4 text-cream/45"
              aria-hidden="true"
            />

            <h2 className="font-display [font-stretch:125%] text-[18px] font-bold text-cream">
              {filtre === "all"
                ? "Rien de prévu pour l’instant"
                : "Rien dans ce format"}
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-cream/60">
              {filtre === "all"
                ? "Les événements sont annoncés ici dès qu’une date est fixée. Rien n’est inventé pour remplir la page."
                : "Essaie l’autre format, ou reviens quand une date sera fixée."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {aVenir.map((evenement) => (
              <CarteEvenement
                key={evenement._id}
                evenement={evenement}
                peutSinscrire={peutSinscrire}
                enCours={inscriptionEnCours === evenement._id}
                onBasculer={() => basculerInscription(evenement)}
              />
            ))}
          </ul>
        )}

        {/* Passés */}
        {!chargement && passes.length > 0 && (
          <section className="mt-8">
            <button
              type="button"
              onClick={() => setVoirPasses((ouvert) => !ouvert)}
              aria-expanded={voirPasses}
              className={`inline-flex items-center gap-2 rounded-xl border border-cream/12 px-4 py-2.5 text-[13px] font-semibold text-cream/75 transition-colors hover:border-cream/25 hover:text-cream ${focusRing}`}
            >
              <Clock size={14} aria-hidden="true" />
              Événements passés ({passes.length})
            </button>

            <AnimatePresence initial={false}>
              {voirPasses && (
                <motion.ul
                  initial={{ opacity: 0, height: reduireAnimations ? "auto" : 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: reduireAnimations ? "auto" : 0 }}
                  transition={{ duration: reduireAnimations ? 0 : 0.25 }}
                  className="mt-3 space-y-3 overflow-hidden"
                >
                  {passes.map((evenement) => (
                    <CarteEvenement
                      key={evenement._id}
                      evenement={evenement}
                      peutSinscrire={peutSinscrire}
                      enCours={inscriptionEnCours === evenement._id}
                      onBasculer={() => basculerInscription(evenement)}
                    />
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </section>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Carte
// ─────────────────────────────────────────────

function CarteEvenement({
  evenement,
  peutSinscrire,
  enCours,
  onBasculer,
}: {
  evenement: Evenement;
  peutSinscrire: boolean;
  enCours: boolean;
  onBasculer: () => void;
}) {
  const places = Math.max(0, evenement.maxAttendees - evenement.attendeeCount);

  /**
   * Un événement passé n'accepte plus rien, dans un sens comme dans l'autre.
   * Se désinscrire reste possible tant qu'il est à venir, même sans offre
   * payante : un abonnement qui expire ne doit pas enfermer dans une
   * inscription.
   */
  const actionPossible = evenement.isPast
    ? false
    : evenement.isRegistered
      ? true
      : peutSinscrire && !evenement.isFull;

  return (
    <li
      className={`rounded-2xl border border-cream/10 bg-[#0C222D] p-4 sm:p-5 ${
        evenement.isPast ? "opacity-70" : ""
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                evenement.isOnline
                  ? "border-cream/15 text-cream/70"
                  : "border-cream/15 text-cream/70"
              }`}
            >
              {evenement.isOnline ? (
                <Monitor size={11} aria-hidden="true" />
              ) : (
                <MapPin size={11} aria-hidden="true" />
              )}
              {evenement.isOnline ? "En ligne" : "En présentiel"}
            </span>

            {evenement.category && (
              <span className="rounded-full border border-cream/12 px-2.5 py-0.5 text-[11px] text-cream/70">
                {evenement.category}
              </span>
            )}

            {evenement.isRegistered && !evenement.isPast && (
              <span className="inline-flex items-center gap-1 rounded-full bg-lime/15 px-2.5 py-0.5 text-[11px] font-bold text-lime">
                <Check size={11} aria-hidden="true" />
                Inscrit
              </span>
            )}

            {evenement.isPast && (
              <span className="rounded-full border border-cream/15 px-2.5 py-0.5 text-[11px] font-semibold text-cream/70">
                Passé
              </span>
            )}
          </div>

          <h2 className="font-display [font-stretch:125%] mt-3 text-[17px] font-bold leading-snug text-cream">
            {evenement.title}
          </h2>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-cream/60">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={12} aria-hidden="true" />
              {formaterDate(evenement.date)} à {formaterHeure(evenement.date)}
            </span>

            <span className="flex items-center gap-1.5">
              <MapPin size={12} aria-hidden="true" />
              {evenement.location}
            </span>

            <span className="flex items-center gap-1.5">
              <Users size={12} aria-hidden="true" />
              {evenement.attendeeCount} / {evenement.maxAttendees}
              {!evenement.isPast && places > 0 && places <= 5 && (
                <span className="text-orange">
                  · {places} place{places > 1 ? "s" : ""}
                </span>
              )}
            </span>
          </p>

          <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-cream/75">
            {evenement.description}
          </p>
        </div>

        {/* Action */}
        <div className="shrink-0 sm:pt-1">
          {evenement.isPast ? null : evenement.isRegistered ? (
            <button
              type="button"
              onClick={onBasculer}
              disabled={enCours}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cream/15 px-4 py-2.5 text-[12px] font-semibold text-cream/80 transition-colors hover:border-cream/30 hover:text-cream disabled:opacity-50 sm:w-auto ${focusRing}`}
            >
              {enCours && (
                <Loader2 size={13} className="animate-spin" aria-hidden="true" />
              )}
              Me retirer
            </button>
          ) : (
            <button
              type="button"
              onClick={onBasculer}
              disabled={enCours || !actionPossible}
              title={
                !peutSinscrire
                  ? "L’inscription s’ouvre à partir de l’offre Essentiel."
                  : evenement.isFull
                    ? "Cet événement est complet."
                    : undefined
              }
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange px-4 py-2.5 text-[12px] font-bold text-abyss transition-colors hover:bg-orange/90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto ${focusRing}`}
            >
              {enCours && (
                <Loader2 size={13} className="animate-spin" aria-hidden="true" />
              )}
              {evenement.isFull ? "Complet" : "M’inscrire"}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
