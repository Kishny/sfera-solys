// src/components/messagerie/MenuTrombone.tsx

"use client";

/**
 * Le menu du trombone : ce qui s'attache à un message.
 *
 * Deux destinations : la photothèque, et un lien à coller.
 *
 * L'ENVOI DE PDF A ÉTÉ RETIRÉ
 * Cloudinary refuse de livrer les PDF tant qu'on ne l'autorise pas dans
 * les réglages du compte — et cette autorisation rend les documents
 * joignables par leur seule adresse, sans compte. Pour un échange privé
 * entre deux inconnus, le besoin ne valait pas la surface d'abus :
 * fichier malveillant à l'envoi, document lisible par quiconque a le
 * lien à la réception. La route d'upload et le champ du modèle
 * disparaissent avec l'entrée.
 *
 * « Lien » ne stocke rien : un lien est du texte, il va dans la saisie
 * comme le reste. Le panneau sert seulement à le coller proprement et à
 * vérifier qu'il ressemble à une adresse avant de l'insérer.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Image as IconeImage,
  Link as IconeLien,
} from "lucide-react";

interface MenuTromboneProps {
  ouvert: boolean;
  onFermer: () => void;
  /** Ouvre le sélecteur de fichiers sur la photothèque. */
  onGalerie: () => void;
  /** Insère le lien dans la saisie. */
  onLien: (lien: string) => void;
  ancre: React.RefObject<HTMLElement | null>;
}

/**
 * Le lien ressemble-t-il à une adresse ?
 *
 * On n'accepte que http et https : `javascript:` dans un champ qui part
 * ensuite dans un message est une porte qu'on ne laisse pas entrouverte,
 * même si rien ici ne le rendrait cliquable.
 */
function normaliser(saisie: string): string | null {
  const texte = saisie.trim();

  if (!texte) return null;

  const candidat = /^https?:\/\//i.test(texte) ? texte : `https://${texte}`;

  try {
    const adresse = new URL(candidat);

    if (adresse.protocol !== "http:" && adresse.protocol !== "https:") {
      return null;
    }

    // Un hôte sans point n'est pas une adresse publique.
    if (!adresse.hostname.includes(".")) return null;

    return adresse.toString();
  } catch {
    return null;
  }
}

export default function MenuTrombone({
  ouvert,
  onFermer,
  onGalerie,
  onLien,
  ancre,
}: MenuTromboneProps) {
  const reduireAnimations = useReducedMotion();
  const panneau = useRef<HTMLDivElement>(null);
  const champLien = useRef<HTMLInputElement>(null);

  const [vue, setVue] = useState<"liste" | "lien">("liste");
  const [lien, setLien] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!ouvert) {
      setVue("liste");
      setLien("");
      setErreur("");
    }
  }, [ouvert]);

  useEffect(() => {
    if (vue === "lien") {
      const minuterie = window.setTimeout(() => champLien.current?.focus(), 60);
      return () => window.clearTimeout(minuterie);
    }
  }, [vue]);

  useEffect(() => {
    if (!ouvert) return;

    const surTouche = (evenement: KeyboardEvent) => {
      if (evenement.key !== "Escape") return;

      evenement.preventDefault();

      if (vue === "lien") setVue("liste");
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

  const valider = () => {
    const propre = normaliser(lien);

    if (!propre) {
      setErreur("Cette adresse n’est pas lisible.");
      return;
    }

    onLien(propre);
  };

  const entrees = [
    {
      cle: "galerie",
      libelle: "Galerie",
      detail: "Une photo de ta photothèque",
      icone: IconeImage,
      action: onGalerie,
    },
    {
      cle: "lien",
      libelle: "Lien",
      detail: "Coller une adresse",
      icone: IconeLien,
      action: () => setVue("lien"),
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
          aria-label="Joindre au message"
          className="absolute bottom-full right-0 z-30 mb-2 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-champagne/12 bg-minuit/95 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
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
                        <Icone size={16} aria-hidden="true" />
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
                  Coller une adresse
                </p>
              </div>

              <div className="p-3">
                <label htmlFor="lien-a-coller" className="sr-only">
                  Adresse à insérer
                </label>

                <input
                  id="lien-a-coller"
                  ref={champLien}
                  type="url"
                  inputMode="url"
                  value={lien}
                  onChange={(evenement) => {
                    setLien(evenement.target.value);
                    setErreur("");
                  }}
                  onKeyDown={(evenement) => {
                    if (evenement.key === "Enter") {
                      evenement.preventDefault();
                      valider();
                    }
                  }}
                  placeholder="exemple.fr/la-page"
                  className="w-full rounded-xl border border-champagne/12 bg-nuit px-3 py-2 text-[13px] text-champagne placeholder:text-champagne/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70"
                />

                {erreur && (
                  <p role="alert" className="mt-1.5 text-[11.5px] text-erreur">
                    {erreur}
                  </p>
                )}

                <button
                  type="button"
                  onClick={valider}
                  className="mt-2.5 w-full rounded-xl bg-degrade-cuivre px-3 py-2 text-[12.5px] font-semibold text-nuit transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cuivre"
                >
                  Insérer dans le message
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
