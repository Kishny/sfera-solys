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
import Image from "next/image";
import Link from "next/link";
import EnteteEspace from "@/components/espace/EnteteEspace";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70 focus-visible:ring-offset-2 focus-visible:ring-offset-nuit";

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
      <div className="flex min-h-screen items-center justify-center bg-nuit">
        <Loader2 className="h-8 w-8 animate-spin text-cuivre" aria-hidden="true" />
        <span className="sr-only">Chargement</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nuit px-4 py-6 text-champagne sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-screen-2xl">
        {/* En-tête */}
        <EnteteEspace
          className="mb-6"
          surtitre="Cercle & communauté"
          titre="Événements Solys"
          action={{ libelle: "Calendrier Solys", icone: CalendarDays }}
        />

        {/*
          Panneau d'introduction.

          Le décompte dynamique qui vivait ici rejoint la rangée de filtres,
          sous la forme de la pastille d'état de la maquette : il y est lu
          au même endroit que ce sur quoi il porte.

          Voile mesuré sur `solys-05` dans la zone de texte : l'ivoire y
          tient 13,12:1, le champagne à 85 % 7,99 et le surtitre cuivré 5,20.
        */}
        <section className="relative isolate mb-5 overflow-hidden rounded-2xl border border-champagne/12">
          <Image
            src="/visuels/solys-05.webp"
            alt=""
            fill
            sizes="(max-width: 1280px) 100vw, 1460px"
            className="-z-10 object-cover object-center"
          />

          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(10,13,18,0.92)_0%,rgba(10,13,18,0.88)_45%,rgba(10,13,18,0.55)_70%,rgba(10,13,18,0.15)_100%)]"
          />

          <div className="p-6 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-surtitre text-cuivre/90">
              Des rencontres au-delà de l’écran
            </p>

            <h2 className="font-display mt-3.5 max-w-lg text-[26px] font-normal leading-tight text-ivoire sm:text-[32px]">
              Des moments à vivre.
              <br />
              <span className="text-cuivre">Ensemble.</span>
            </h2>

            <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-champagne/85">
              Les futurs événements Solys seront annoncés ici. Tu peux
              consulter le calendrier gratuitement&nbsp;; l’inscription
              s’ouvre dès l’offre Essentiel.
            </p>

            <p className="mt-8 text-right text-[10.5px] text-champagne/70">
              Visuel de démonstration — aucun membre représenté
            </p>
          </div>
        </section>

        {/* Accès */}
        {!chargement && !peutSinscrire && (
          <section className="mb-5 rounded-2xl border border-cuivre/30 bg-cuivre/10 px-4 py-3.5 sm:px-5">
            <p className="flex items-start gap-2.5 text-[13px] leading-relaxed text-champagne/85">
              <Lock
                size={15}
                className="mt-0.5 shrink-0 text-cuivre"
                aria-hidden="true"
              />
              <span>
                Tu peux consulter les événements, mais l’inscription s’ouvre à
                partir de l’offre Essentiel.{" "}
                <Link
                  href="/tarifs"
                  className={`font-semibold text-champagne underline underline-offset-2 hover:text-cuivre ${focusRing}`}
                >
                  Voir les offres
                </Link>
                .
              </span>
            </p>
          </section>
        )}

        {/*
          Filtres.

          La maquette propose « À venir / Passés / Mes inscriptions ». Ce
          sont trois axes que la page traite déjà autrement : les passés ont
          leur propre section repliable plus bas, et les inscriptions sont
          comptées dans la pastille de droite. Les filtres restent donc ceux
          du format — changer d'axe demanderait de refaire la récupération
          des données pour un gain nul.

          Ils s'affichent désormais même sans événement : la maquette les
          montre avec un calendrier vide, et une rangée qui disparaît quand
          il n'y a rien laisse croire qu'on a perdu un réglage.
        */}
        {!chargement && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
            {FILTRES.map((item) => {
              const actif = filtre === item.valeur;

              return (
                <button
                  key={item.valeur}
                  type="button"
                  onClick={() => setFiltre(item.valeur)}
                  aria-pressed={actif}
                  className={`rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition-colors ${focusRing} ${
                    actif
                      ? "border-transparent bg-degrade-cuivre text-nuit"
                      : "border-champagne/15 bg-minuit/70 text-champagne/85 hover:border-cuivre/45"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            </div>

            <p
              aria-live="polite"
              className="flex items-center gap-2 rounded-xl border border-champagne/15 bg-minuit/70 px-4 py-2.5 text-[12.5px] text-champagne/85"
            >
              <CalendarDays size={14} aria-hidden="true" className="text-cuivre" />
              {aVenir.length === 0
                ? "Aucun événement programmé"
                : `${aVenir.length} événement${aVenir.length > 1 ? "s" : ""} à venir${
                    mesInscriptions > 0
                      ? ` · inscrit à ${mesInscriptions}`
                      : ""
                  }`}
            </p>
          </div>
        )}

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

        {/* À venir */}
        {chargement ? (
          <div className="flex flex-col items-center gap-3 py-24">
            <Loader2
              className="h-7 w-7 animate-spin text-cuivre"
              aria-hidden="true"
            />
            <p className="text-[13px] text-champagne/55">
              Chargement des événements…
            </p>
          </div>
        ) : aVenir.length === 0 ? (
          <div className="rounded-2xl border border-champagne/12 bg-minuit/70 px-6 py-16 text-center">
            <span
              aria-hidden="true"
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-cuivre/40 bg-nuit/60 text-cuivre"
            >
              <CalendarDays size={22} />
            </span>

            <h2 className="font-display text-[24px] font-normal leading-snug text-ivoire sm:text-[28px]">
              {filtre === "all"
                ? "Le calendrier attend sa première date."
                : "Rien dans ce format."}
            </h2>

            <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed text-champagne/80">
              {filtre === "all"
                ? "Aucun événement n’est annoncé pour le moment. Les prochaines rencontres apparaîtront ici dès qu’une date sera confirmée — rien n’est inventé pour remplir la page."
                : "Essaie l’autre format, ou reviens quand une date sera fixée."}
            </p>

            {!peutSinscrire && (
              <Link
                href="/tarifs"
                className={`mt-7 inline-flex items-center gap-2 rounded-xl border border-cuivre/50 bg-cuivre/10 px-6 py-3 text-[13px] font-bold text-champagne transition-colors hover:bg-cuivre/20 ${focusRing}`}
              >
                Découvrir les offres
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            )}
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
              className={`inline-flex items-center gap-2 rounded-xl border border-champagne/12 px-4 py-2.5 text-[13px] font-semibold text-champagne/75 transition-colors hover:border-champagne/25 hover:text-champagne ${focusRing}`}
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
      /*
        L'ancre sert les liens venus de la messagerie : partager un
        événement dans une conversation doit mener à cet événement-là, pas
        au haut de la liste. Le navigateur fait le défilement lui-même, et
        `scroll-mt` évite que l'en-tête vienne le recouvrir.
      */
      id={`evenement-${evenement._id}`}
      className={`scroll-mt-24 rounded-2xl border border-champagne/10 bg-minuit p-4 sm:p-5 ${
        evenement.isPast ? "opacity-70" : ""
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                evenement.isOnline
                  ? "border-champagne/15 text-champagne/70"
                  : "border-champagne/15 text-champagne/70"
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
              <span className="rounded-full border border-champagne/12 px-2.5 py-0.5 text-[11px] text-champagne/70">
                {evenement.category}
              </span>
            )}

            {evenement.isRegistered && !evenement.isPast && (
              <span className="inline-flex items-center gap-1 rounded-full bg-succes/15 px-2.5 py-0.5 text-[11px] font-bold text-succes">
                <Check size={11} aria-hidden="true" />
                Inscrit
              </span>
            )}

            {evenement.isPast && (
              <span className="rounded-full border border-champagne/15 px-2.5 py-0.5 text-[11px] font-semibold text-champagne/70">
                Passé
              </span>
            )}
          </div>

          <h2 className="font-display mt-3 text-[17px] font-bold leading-snug text-champagne">
            {evenement.title}
          </h2>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-champagne/60">
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
                <span className="text-cuivre">
                  · {places} place{places > 1 ? "s" : ""}
                </span>
              )}
            </span>
          </p>

          <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-champagne/75">
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
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border border-champagne/15 px-4 py-2.5 text-[12px] font-semibold text-champagne/80 transition-colors hover:border-champagne/30 hover:text-champagne disabled:opacity-50 sm:w-auto ${focusRing}`}
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
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cuivre px-4 py-2.5 text-[12px] font-bold text-nuit transition-colors hover:bg-cuivre/90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto ${focusRing}`}
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
