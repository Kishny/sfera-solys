// src/components/messagerie/MenuPlus.tsx

"use client";

/**
 * Le menu « + » du composeur.
 *
 * Il ne contient que ce qui existe. Les entrées annoncées pour plus tard
 * — message vocal, partage de lieu, proposition de rendez-vous, partage
 * d'un événement Solys — n'y figurent pas tant qu'elles ne font rien :
 * un menu qui promet est pire qu'un menu court.
 *
 * Deux vues : la liste, et le panneau des questions brise-glace.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  Image as IconeImage,
  Loader2,
  MapPin,
  MessageCircleQuestion,
} from "lucide-react";

import { BRISE_GLACE } from "./briseGlace";

interface MenuPlusProps {
  ouvert: boolean;
  onFermer: () => void;
  /** Ouvre le sélecteur de fichiers sur la photothèque. */
  onPhoto: () => void;
  /** Ouvre l'appareil photo sur mobile, la photothèque ailleurs. */
  onCamera: () => void;
  /** Place la question choisie dans la saisie. */
  onQuestion: (question: string) => void;
  /** Demande la position au navigateur, puis la partage. */
  onLieu: () => void;
  /** Vrai pendant que le navigateur cherche la position. */
  rechercheLieu: boolean;
  /**
   * L'élément qui contient à la fois le menu et le bouton « + ».
   *
   * Sans lui, un clic sur « + » alors que le menu est ouvert le fermerait
   * (clic « extérieur ») avant que le bouton ne le rouvre.
   */
  ancre: React.RefObject<HTMLElement | null>;
}

export default function MenuPlus({
  ouvert,
  onFermer,
  onPhoto,
  onCamera,
  onQuestion,
  onLieu,
  rechercheLieu,
  ancre,
}: MenuPlusProps) {
  const reduireAnimations = useReducedMotion();
  const panneau = useRef<HTMLDivElement>(null);

  const [vue, setVue] = useState<"liste" | "questions">("liste");

  /**
   * On revient toujours sur la liste à la réouverture : rouvrir le menu
   * et retomber sur le panneau des questions serait déroutant.
   */
  useEffect(() => {
    if (!ouvert) setVue("liste");
  }, [ouvert]);

  useEffect(() => {
    if (!ouvert) return;

    const surTouche = (evenement: KeyboardEvent) => {
      if (evenement.key !== "Escape") return;

      evenement.preventDefault();

      // Échap recule d'un cran avant de fermer.
      if (vue === "questions") setVue("liste");
      else onFermer();
    };

    const surClic = (evenement: MouseEvent) => {
      const cible = evenement.target as Node;

      if (ancre.current?.contains(cible)) return;
      if (panneau.current?.contains(cible)) return;

      onFermer();
    };

    window.addEventListener("keydown", surTouche);
    document.addEventListener("mousedown", surClic);

    return () => {
      window.removeEventListener("keydown", surTouche);
      document.removeEventListener("mousedown", surClic);
    };
  }, [ancre, onFermer, ouvert, vue]);

  const entrees = [
    {
      cle: "photo",
      libelle: "Photo",
      detail: "Depuis ta photothèque",
      icone: IconeImage,
      action: onPhoto,
    },
    {
      cle: "camera",
      libelle: "Caméra",
      detail: "Prendre une photo maintenant",
      icone: Camera,
      action: onCamera,
    },
    {
      cle: "lieu",
      libelle: "Lieu",
      detail: rechercheLieu
        ? "Recherche en cours…"
        : "Ton quartier, pas ton adresse",
      icone: rechercheLieu ? Loader2 : MapPin,
      action: onLieu,
    },
    {
      cle: "question",
      libelle: "Question brise-glace",
      detail: "Pour relancer sans forcer",
      icone: MessageCircleQuestion,
      action: () => setVue("questions"),
    },
  ];

  return (
    <AnimatePresence>
      {ouvert && (
        <motion.div
          ref={panneau}
          initial={reduireAnimations ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduireAnimations ? { opacity: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.16 }}
          role="dialog"
          aria-label="Ajouter au message"
          className="absolute bottom-full left-0 z-30 mb-2 w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-champagne/12 bg-minuit/95 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
        >
          {vue === "liste" ? (
            <ul className="p-1.5">
              {entrees.map((entree) => {
                const Icone = entree.icone;

                return (
                  <li key={entree.cle}>
                    <button
                      type="button"
                      onClick={entree.action}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-champagne/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cuivre"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cuivre/15 text-cuivre">
                        <Icone
                          size={16}
                          aria-hidden="true"
                          className={
                            entree.cle === "lieu" && rechercheLieu
                              ? "animate-spin"
                              : ""
                          }
                        />
                      </span>

                      <span className="min-w-0">
                        <span className="block text-[13.5px] text-champagne">
                          {entree.libelle}
                        </span>
                        <span className="block text-[11.5px] text-champagne/55">
                          {entree.detail}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div>
              <div className="flex items-center gap-2 border-b border-champagne/10 px-2 py-2">
                <button
                  type="button"
                  onClick={() => setVue("liste")}
                  aria-label="Revenir au menu"
                  className="rounded-lg p-1.5 text-champagne/65 transition hover:text-champagne focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cuivre"
                >
                  <ArrowLeft size={15} aria-hidden="true" />
                </button>

                <p className="text-[12px] font-semibold text-champagne/80">
                  Une question pour relancer
                </p>
              </div>

              {/*
                La question est placée dans la saisie, jamais envoyée
                directement : on doit pouvoir la retoucher, ou se raviser.
              */}
              <ul className="max-h-60 overflow-y-auto p-1.5">
                {BRISE_GLACE.map((question) => (
                  <li key={question}>
                    <button
                      type="button"
                      onClick={() => onQuestion(question)}
                      className="w-full rounded-xl px-3 py-2.5 text-left text-[13px] leading-relaxed text-champagne/85 transition hover:bg-champagne/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cuivre"
                    >
                      {question}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
