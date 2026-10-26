// src/components/messagerie/ProposerRendezVous.tsx

"use client";

/**
 * Le formulaire de proposition de rendez-vous.
 *
 * Une modale et non un panneau dans le composeur : trois champs ne
 * tiennent pas au-dessus d'une barre de saisie sur un téléphone, et une
 * proposition mérite qu'on s'arrête dessus.
 *
 * Trois champs, dont un facultatif. Demander davantage — durée, type de
 * sortie, budget — ferait d'une invitation un formulaire.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Loader2, MapPin, X } from "lucide-react";

interface ProposerRendezVousProps {
  ouvert: boolean;
  onFermer: () => void;
  onProposer: (proposition: {
    quand: string;
    ou: string;
    note: string;
  }) => Promise<void> | void;
  envoiEnCours: boolean;
}

/**
 * La valeur minimale du champ date, au format attendu par
 * `datetime-local` : l'heure qui vient, pas le passé.
 */
function prochaineHeure(): string {
  const date = new Date(Date.now() + 60 * 60 * 1000);

  // `toISOString` passe en UTC, ce qui décalerait l'heure affichée.
  const pad = (valeur: number) => String(valeur).padStart(2, "0");

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

export default function ProposerRendezVous({
  ouvert,
  onFermer,
  onProposer,
  envoiEnCours,
}: ProposerRendezVousProps) {
  const reduireAnimations = useReducedMotion();

  const [quand, setQuand] = useState("");
  const [ou, setOu] = useState("");
  const [note, setNote] = useState("");
  const [erreur, setErreur] = useState("");

  const premierChamp = useRef<HTMLInputElement>(null);
  const focusPrecedent = useRef<HTMLElement | null>(null);

  const minimum = prochaineHeure();

  /** À l'ouverture : champs vierges et focus sur la date. */
  useEffect(() => {
    if (!ouvert) return;

    setQuand("");
    setOu("");
    setNote("");
    setErreur("");

    focusPrecedent.current = document.activeElement as HTMLElement | null;

    const minuterie = window.setTimeout(() => {
      premierChamp.current?.focus();
    }, 60);

    return () => {
      window.clearTimeout(minuterie);
      focusPrecedent.current?.focus?.();
    };
  }, [ouvert]);

  useEffect(() => {
    if (!ouvert) return;

    const surTouche = (evenement: KeyboardEvent) => {
      if (evenement.key === "Escape" && !envoiEnCours) {
        evenement.preventDefault();
        onFermer();
      }
    };

    const debordement = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", surTouche);

    return () => {
      window.removeEventListener("keydown", surTouche);
      document.body.style.overflow = debordement;
    };
  }, [envoiEnCours, onFermer, ouvert]);

  const valider = async () => {
    const lieu = ou.trim();

    if (!quand) {
      setErreur("Indique quand.");
      return;
    }

    if (!lieu) {
      setErreur("Indique où.");
      return;
    }

    const date = new Date(quand);

    if (Number.isNaN(date.getTime())) {
      setErreur("Cette date n’est pas lisible.");
      return;
    }

    if (date.getTime() < Date.now()) {
      setErreur("Cette date est déjà passée.");
      return;
    }

    setErreur("");

    await onProposer({
      quand: date.toISOString(),
      ou: lieu,
      note: note.trim(),
    });
  };

  const champ =
    "w-full rounded-xl border border-champagne/12 bg-nuit px-3.5 py-2.5 text-[14px] text-champagne placeholder:text-champagne/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70";

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
          aria-label="Proposer un rendez-vous"
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
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-champagne/12 bg-minuit shadow-[0_24px_70px_-24px_rgba(0,0,0,0.95)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-champagne/10 px-5 py-4">
              <div>
                <h2 className="font-display text-[18px] font-bold text-ivoire">
                  Proposer un rendez-vous
                </h2>
                <p className="mt-1 text-[12px] leading-relaxed text-champagne/60">
                  Il pourra accepter ou décliner. Rien n’est confirmé tant
                  qu’il n’a pas répondu.
                </p>
              </div>

              <button
                type="button"
                onClick={onFermer}
                disabled={envoiEnCours}
                aria-label="Fermer"
                className="shrink-0 rounded-lg p-1.5 text-champagne/60 transition hover:text-champagne disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cuivre"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <form
              onSubmit={(evenement) => {
                evenement.preventDefault();
                void valider();
              }}
              className="space-y-4 px-5 py-5"
            >
              <div>
                <label
                  htmlFor="rdv-quand"
                  className="mb-1.5 flex items-center gap-2 text-[12.5px] font-semibold text-champagne/80"
                >
                  <CalendarDays size={13} aria-hidden="true" className="text-cuivre" />
                  Quand
                </label>

                <input
                  id="rdv-quand"
                  ref={premierChamp}
                  type="datetime-local"
                  value={quand}
                  min={minimum}
                  onChange={(evenement) => setQuand(evenement.target.value)}
                  className={champ}
                />
              </div>

              <div>
                <label
                  htmlFor="rdv-ou"
                  className="mb-1.5 flex items-center gap-2 text-[12.5px] font-semibold text-champagne/80"
                >
                  <MapPin size={13} aria-hidden="true" className="text-cuivre" />
                  Où
                </label>

                <input
                  id="rdv-ou"
                  type="text"
                  value={ou}
                  maxLength={160}
                  onChange={(evenement) => setOu(evenement.target.value)}
                  placeholder="Un café, un quartier, une adresse…"
                  className={champ}
                />
              </div>

              <div>
                <label
                  htmlFor="rdv-note"
                  className="mb-1.5 block text-[12.5px] font-semibold text-champagne/80"
                >
                  Un mot{" "}
                  <span className="font-normal text-champagne/50">
                    (facultatif)
                  </span>
                </label>

                <textarea
                  id="rdv-note"
                  value={note}
                  maxLength={300}
                  rows={2}
                  onChange={(evenement) => setNote(evenement.target.value)}
                  placeholder="« On verra sur place si ça te va. »"
                  className={`${champ} resize-y`}
                />
              </div>

              {erreur && (
                <p role="alert" className="text-[12.5px] text-erreur">
                  {erreur}
                </p>
              )}

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={onFermer}
                  disabled={envoiEnCours}
                  className="flex-1 rounded-xl border border-champagne/15 px-4 py-2.5 text-[13px] text-champagne/80 transition hover:border-champagne/30 hover:text-champagne disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cuivre"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={envoiEnCours}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-degrade-cuivre px-4 py-2.5 text-[13px] font-semibold text-nuit transition hover:opacity-90 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cuivre"
                >
                  {envoiEnCours && (
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  )}
                  Proposer
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
