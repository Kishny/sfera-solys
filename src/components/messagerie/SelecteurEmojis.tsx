// src/components/messagerie/SelecteurEmojis.tsx

"use client";

/**
 * Sélecteur d'émojis du composeur.
 *
 * Une liste courte et choisie plutôt qu'un catalogue complet : la
 * messagerie du site sert à engager une conversation, pas à bricoler des
 * suites de symboles. Six familles, une centaine d'entrées, et rien à
 * télécharger — aucune dépendance supplémentaire, les émojis sont du
 * texte.
 *
 * Le panneau se ferme à Échap et au clic extérieur, et rend le focus au
 * bouton qui l'a ouvert.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface SelecteurEmojisProps {
  ouvert: boolean;
  /** Demande la fermeture (Échap, clic extérieur, choix fait). */
  onFermer: () => void;
  /** Insère l'émoji choisi dans la saisie. */
  onChoisir: (emoji: string) => void;
  /**
   * L'élément qui contient à la fois le panneau et le bouton qui
   * l'ouvre.
   *
   * Sans lui, un clic sur ce bouton alors que le panneau est ouvert le
   * fermerait (clic « extérieur ») avant que le bouton ne le rouvre : le
   * panneau paraîtrait ne jamais se fermer.
   */
  ancre: React.RefObject<HTMLElement | null>;
}

const FAMILLES: { nom: string; emojis: string[] }[] = [
  {
    nom: "Sourires",
    emojis: [
      "🙂", "😊", "😄", "😁", "😉", "😌", "😏", "🙃",
      "😅", "😂", "🤣", "🥹", "😘", "😍", "🥰", "😎",
      "🤔", "😬", "😴", "🤭", "🫠", "🙄", "😳", "🥲",
    ],
  },
  {
    nom: "Cœurs",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💘", "💞", "💫", "✨"],
  },
  {
    nom: "Gestes",
    emojis: [
      "👋", "🤝", "👍", "👏", "🙌", "🤞", "🙏", "💪",
      "🫶", "🤙", "✌️", "👌",
    ],
  },
  {
    nom: "Sorties",
    emojis: [
      "🥂", "🍷", "🍸", "🍾", "☕", "🍽️", "🎬", "🎭",
      "🎵", "🎸", "🌃", "🏙️", "🌅", "🔥", "🕯️", "🎉",
    ],
  },
  {
    nom: "Voyage",
    emojis: ["✈️", "🚗", "🚆", "🏖️", "⛰️", "🗺️", "🧭", "🏕️", "🌍", "🏝️"],
  },
  {
    nom: "Divers",
    emojis: ["👀", "📷", "📍", "🗓️", "⏰", "💬", "☀️", "🌙", "⭐", "☂️", "🍀", "🎁"],
  },
];

export default function SelecteurEmojis({
  ouvert,
  onFermer,
  onChoisir,
  ancre,
}: SelecteurEmojisProps) {
  const reduireAnimations = useReducedMotion();
  const panneau = useRef<HTMLDivElement>(null);

  const [famille, setFamille] = useState(0);

  /**
   * Échap ferme, et le clic en dehors aussi.
   *
   * « En dehors » veut dire hors de l'ancre, bouton d'ouverture compris.
   */
  useEffect(() => {
    if (!ouvert) return;

    const surTouche = (evenement: KeyboardEvent) => {
      if (evenement.key === "Escape") {
        evenement.preventDefault();
        onFermer();
      }
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
  }, [ancre, onFermer, ouvert]);

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
          aria-label="Choisir un émoji"
          className="absolute bottom-full right-0 z-30 mb-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-champagne/12 bg-minuit/95 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
        >
          {/* ─── Les familles ─────────────────────────────────────── */}
          <div
            role="tablist"
            aria-label="Familles d’émojis"
            className="flex gap-1 overflow-x-auto border-b border-champagne/10 px-2 py-2"
          >
            {FAMILLES.map((entree, index) => (
              <button
                key={entree.nom}
                type="button"
                role="tab"
                aria-selected={index === famille}
                onClick={() => setFamille(index)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11.5px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cuivre ${
                  index === famille
                    ? "bg-cuivre/20 text-champagne"
                    : "text-champagne/60 hover:text-champagne/90"
                }`}
              >
                {entree.nom}
              </button>
            ))}
          </div>

          {/* ─── La grille ────────────────────────────────────────── */}
          <div className="grid max-h-56 grid-cols-8 gap-0.5 overflow-y-auto p-2">
            {FAMILLES[famille].emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onChoisir(emoji)}
                aria-label={`Insérer ${emoji}`}
                className="rounded-lg p-1.5 text-[19px] leading-none transition hover:bg-champagne/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cuivre"
              >
                {emoji}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
