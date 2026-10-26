// src/components/messagerie/SelecteurEvenement.tsx

"use client";

/**
 * Le choix de l'événement Solys à partager.
 *
 * Les événements ne sont chargés qu'à l'ouverture : la messagerie n'a
 * aucune raison d'interroger le calendrier tant qu'on ne le lui demande
 * pas.
 *
 * Seuls les événements à venir sont proposés. Partager une soirée
 * passée n'a pas de sens, et la liste serait vite encombrée.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Loader2, MapPin, Video, X } from "lucide-react";

interface EvenementListe {
  _id: string;
  title: string;
  date: string;
  location: string;
  emoji?: string;
  isOnline?: boolean;
  isPast?: boolean;
}

interface SelecteurEvenementProps {
  ouvert: boolean;
  onFermer: () => void;
  onChoisir: (evenementId: string) => void;
  envoiEnCours: boolean;
}

function formaterDate(valeur: string): string {
  const date = new Date(valeur);

  if (Number.isNaN(date.getTime())) return "Date à préciser";

  return `${date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })} · ${date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function SelecteurEvenement({
  ouvert,
  onFermer,
  onChoisir,
  envoiEnCours,
}: SelecteurEvenementProps) {
  const reduireAnimations = useReducedMotion();

  const [evenements, setEvenements] = useState<EvenementListe[] | null>(null);
  const [erreur, setErreur] = useState("");

  const focusPrecedent = useRef<HTMLElement | null>(null);
  const boutonFermer = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!ouvert) return;

    focusPrecedent.current = document.activeElement as HTMLElement | null;

    const minuterie = window.setTimeout(() => boutonFermer.current?.focus(), 60);

    const debordement = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const surTouche = (evenement: KeyboardEvent) => {
      if (evenement.key === "Escape" && !envoiEnCours) {
        evenement.preventDefault();
        onFermer();
      }
    };

    window.addEventListener("keydown", surTouche);

    return () => {
      window.clearTimeout(minuterie);
      window.removeEventListener("keydown", surTouche);
      document.body.style.overflow = debordement;
      focusPrecedent.current?.focus?.();
    };
  }, [envoiEnCours, onFermer, ouvert]);

  useEffect(() => {
    if (!ouvert) return;

    let abandonne = false;

    const charger = async () => {
      setEvenements(null);
      setErreur("");

      try {
        const reponse = await fetch("/api/events");
        const donnees = await reponse.json().catch(() => null);

        if (abandonne) return;

        if (!reponse.ok || donnees?.success !== true) {
          setErreur(donnees?.error || "Les événements n’ont pas pu être lus.");
          setEvenements([]);
          return;
        }

        const liste: EvenementListe[] = Array.isArray(donnees.events)
          ? donnees.events
          : [];

        setEvenements(
          liste
            .filter((entree) => !entree.isPast)
            .sort(
              (a, b) =>
                new Date(a.date).getTime() - new Date(b.date).getTime()
            )
        );
      } catch {
        if (!abandonne) {
          setErreur("Connexion interrompue.");
          setEvenements([]);
        }
      }
    };

    void charger();

    return () => {
      abandonne = true;
    };
  }, [ouvert]);

  return (
    <AnimatePresence>
      {ouvert && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[999] flex items-end justify-center p-3 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Partager un événement Solys"
        >
          <button
            type="button"
            onClick={() => !envoiEnCours && onFermer()}
            aria-label="Fermer"
            tabIndex={-1}
            className="absolute inset-0 cursor-default bg-nuit/80 backdrop-blur-sm"
          />

          <motion.div
            initial={reduireAnimations ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduireAnimations ? { opacity: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 0.2 }}
            className="relative flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-champagne/12 bg-minuit shadow-[0_24px_70px_-24px_rgba(0,0,0,0.95)]"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-champagne/10 px-5 py-4">
              <div>
                <h2 className="font-display text-[18px] font-bold text-ivoire">
                  Partager un événement
                </h2>
                <p className="mt-1 text-[12px] text-champagne/60">
                  Les prochaines dates Solys.
                </p>
              </div>

              <button
                ref={boutonFermer}
                type="button"
                onClick={onFermer}
                disabled={envoiEnCours}
                aria-label="Fermer"
                className="shrink-0 rounded-lg p-1.5 text-champagne/60 transition hover:text-champagne disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cuivre"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {evenements === null ? (
                <div className="flex flex-col items-center gap-3 py-14">
                  <Loader2
                    className="h-6 w-6 animate-spin text-cuivre"
                    aria-hidden="true"
                  />
                  <p className="text-[12.5px] text-champagne/55">
                    Chargement des dates…
                  </p>
                </div>
              ) : erreur ? (
                <p role="alert" className="px-2 py-10 text-center text-[13px] text-erreur">
                  {erreur}
                </p>
              ) : evenements.length === 0 ? (
                <p className="px-2 py-10 text-center text-[13px] leading-relaxed text-champagne/60">
                  Aucune date à venir pour le moment.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {evenements.map((evenement) => (
                    <li key={evenement._id}>
                      <button
                        type="button"
                        onClick={() => onChoisir(evenement._id)}
                        disabled={envoiEnCours}
                        className="w-full rounded-xl border border-champagne/10 bg-nuit/50 p-3 text-left transition hover:border-cuivre/35 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cuivre"
                      >
                        <p className="text-[13.5px] font-semibold leading-snug text-champagne">
                          {evenement.emoji ? `${evenement.emoji} ` : ""}
                          {evenement.title}
                        </p>

                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-champagne/60">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays size={11} aria-hidden="true" />
                            {formaterDate(evenement.date)}
                          </span>

                          <span className="flex min-w-0 items-center gap-1.5">
                            {evenement.isOnline ? (
                              <Video size={11} aria-hidden="true" />
                            ) : (
                              <MapPin size={11} aria-hidden="true" />
                            )}
                            <span className="truncate">{evenement.location}</span>
                          </span>
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
