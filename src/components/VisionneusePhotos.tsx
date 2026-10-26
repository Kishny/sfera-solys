// src/components/VisionneusePhotos.tsx

"use client";

/**
 * Visionneuse de photos plein écran.
 *
 * Elle s'ouvre au clic sur une vignette et affiche la photo entière,
 * sans recadrage : une photo de profil se regarde en entier, pas dans
 * le cadre que la grille lui avait imposé.
 *
 * Ce qu'elle gère :
 * - navigation précédent / suivant (boutons, flèches du clavier,
 *   glissement du doigt sur mobile) ;
 * - fermeture par Échap, par le bouton, ou en cliquant à côté ;
 * - retour du focus sur la vignette d'origine à la fermeture ;
 * - `prefers-reduced-motion` : plus de glissement, seulement un fondu.
 *
 * Elle est volontairement indépendante du profil : la galerie du compte
 * ou une carte d'exploration pourront la réutiliser telle quelle.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface VisionneusePhotosProps {
  /** Les URL des photos, dans l'ordre d'affichage de la galerie. */
  photos: string[];
  /** Index de la photo ouverte, ou `null` quand la visionneuse est fermée. */
  indexOuvert: number | null;
  /** Demande la fermeture. */
  onFermer: () => void;
  /** Change la photo affichée. */
  onChanger: (index: number) => void;
  /** Le prénom du membre, pour les textes alternatifs. */
  nom: string;
}

/** Distance minimale, en pixels, pour qu'un glissement compte comme tel. */
const SEUIL_GLISSEMENT = 50;

export default function VisionneusePhotos({
  photos,
  indexOuvert,
  onFermer,
  onChanger,
  nom,
}: VisionneusePhotosProps) {
  const reduireAnimations = useReducedMotion();
  const ouverte = indexOuvert !== null;

  /**
   * Le sens du dernier déplacement, pour que la photo entre du bon côté.
   */
  const [sens, setSens] = useState<1 | -1>(1);

  /** Abscisse du doigt au début du glissement. */
  const departToucher = useRef<number | null>(null);

  /** L'élément qui avait le focus avant l'ouverture, pour le lui rendre. */
  const focusPrecedent = useRef<HTMLElement | null>(null);

  const boutonFermer = useRef<HTMLButtonElement>(null);

  const plusieurs = photos.length > 1;

  const aller = useCallback(
    (direction: 1 | -1) => {
      if (indexOuvert === null || !plusieurs) return;

      setSens(direction);

      // La galerie boucle : après la dernière photo on revient à la
      // première. Trois photos au maximum, autant pouvoir tourner en rond
      // sans jamais tomber sur un bouton mort.
      const suivant = (indexOuvert + direction + photos.length) % photos.length;

      onChanger(suivant);
    },
    [indexOuvert, onChanger, photos.length, plusieurs],
  );

  /**
   * Clavier : Échap ferme, les flèches naviguent.
   */
  useEffect(() => {
    if (!ouverte) return;

    const surTouche = (evenement: KeyboardEvent) => {
      if (evenement.key === "Escape") {
        evenement.preventDefault();
        onFermer();
        return;
      }

      if (evenement.key === "ArrowRight") {
        evenement.preventDefault();
        aller(1);
        return;
      }

      if (evenement.key === "ArrowLeft") {
        evenement.preventDefault();
        aller(-1);
      }
    };

    window.addEventListener("keydown", surTouche);

    return () => {
      window.removeEventListener("keydown", surTouche);
    };
  }, [aller, onFermer, ouverte]);

  /**
   * Le fond ne doit pas défiler pendant qu'on regarde une photo.
   */
  useEffect(() => {
    if (!ouverte) return;

    const debordementInitial = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = debordementInitial;
    };
  }, [ouverte]);

  /**
   * Le focus entre dans la visionneuse à l'ouverture et retourne à la
   * vignette à la fermeture : au clavier, on ne se retrouve pas renvoyé
   * en haut de la page.
   */
  useEffect(() => {
    if (!ouverte) return;

    focusPrecedent.current = document.activeElement as HTMLElement | null;

    // Le bouton n'existe qu'une fois l'animation d'entrée démarrée.
    const minuterie = window.setTimeout(() => {
      boutonFermer.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(minuterie);
      focusPrecedent.current?.focus?.();
    };
  }, [ouverte]);

  const surDebutToucher = (evenement: React.TouchEvent) => {
    departToucher.current = evenement.touches[0]?.clientX ?? null;
  };

  const surFinToucher = (evenement: React.TouchEvent) => {
    const depart = departToucher.current;
    departToucher.current = null;

    if (depart === null) return;

    const arrivee = evenement.changedTouches[0]?.clientX;
    if (arrivee === undefined) return;

    const parcours = arrivee - depart;

    if (Math.abs(parcours) < SEUIL_GLISSEMENT) return;

    aller(parcours < 0 ? 1 : -1);
  };

  return (
    <AnimatePresence>
      {ouverte && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[999] flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label={`Photos de ${nom}`}
        >
          {/*
            Le fond ferme au clic. C'est un bouton et non une simple div :
            au clavier et au lecteur d'écran, « fermer » doit s'annoncer
            comme une action, pas comme un décor.
          */}
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer les photos"
            className="absolute inset-0 cursor-default bg-nuit/92 backdrop-blur-sm"
            tabIndex={-1}
          />

          {/* ─── Barre du haut ──────────────────────────────────────── */}
          <div className="relative flex shrink-0 items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <span className="text-[13px] text-champagne/70">
              {plusieurs ? `${(indexOuvert ?? 0) + 1} / ${photos.length}` : nom}
            </span>

            <button
              ref={boutonFermer}
              type="button"
              onClick={onFermer}
              aria-label="Fermer les photos"
              className="rounded-full border border-champagne/15 bg-minuit/80 p-2.5 text-champagne/80 transition hover:border-champagne/30 hover:text-ivoire focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cuivre"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {/* ─── La photo ───────────────────────────────────────────── */}
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6 sm:px-6"
            onTouchStart={surDebutToucher}
            onTouchEnd={surFinToucher}
          >
            {plusieurs && (
              <button
                type="button"
                onClick={() => aller(-1)}
                aria-label="Photo précédente"
                className="absolute left-2 z-10 rounded-full border border-champagne/15 bg-minuit/80 p-2.5 text-champagne/80 transition hover:border-champagne/30 hover:text-ivoire focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cuivre sm:left-4 sm:p-3"
              >
                <ChevronLeft size={20} aria-hidden="true" />
              </button>
            )}

            <AnimatePresence mode="wait" initial={false} custom={sens}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <motion.img
                key={photos[indexOuvert ?? 0]}
                src={photos[indexOuvert ?? 0]}
                alt={`Photo ${(indexOuvert ?? 0) + 1} de ${nom}`}
                custom={sens}
                initial={
                  reduireAnimations
                    ? { opacity: 0 }
                    : { opacity: 0, x: sens * 28 }
                }
                animate={{ opacity: 1, x: 0 }}
                exit={
                  reduireAnimations
                    ? { opacity: 0 }
                    : { opacity: 0, x: sens * -28 }
                }
                transition={{ duration: 0.18 }}
                // `object-contain` : la photo est montrée entière, c'est
                // tout l'intérêt de l'agrandissement.
                className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
                draggable={false}
              />
            </AnimatePresence>

            {plusieurs && (
              <button
                type="button"
                onClick={() => aller(1)}
                aria-label="Photo suivante"
                className="absolute right-2 z-10 rounded-full border border-champagne/15 bg-minuit/80 p-2.5 text-champagne/80 transition hover:border-champagne/30 hover:text-ivoire focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cuivre sm:right-4 sm:p-3"
              >
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* ─── Les vignettes ──────────────────────────────────────── */}
          {plusieurs && (
            <div className="relative flex shrink-0 justify-center gap-2 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-6">
              {photos.map((url, index) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => {
                    setSens(index > (indexOuvert ?? 0) ? 1 : -1);
                    onChanger(index);
                  }}
                  aria-label={`Voir la photo ${index + 1}`}
                  aria-current={index === indexOuvert ? "true" : undefined}
                  className={`h-14 w-14 overflow-hidden rounded-lg border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cuivre ${
                    index === indexOuvert
                      ? "border-cuivre opacity-100"
                      : "border-champagne/15 opacity-55 hover:opacity-85"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
