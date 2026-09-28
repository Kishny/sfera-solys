// src/app/(app)/mon-compte/_composants/GaleriePhotos.tsx

"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ImagePlus, Loader2, X } from "lucide-react";

import { focusRing } from "./types";

/**
 * Galerie de trois photos.
 *
 * Contrairement à l'avatar, ces photos sont enregistrées **immédiatement** :
 * `/api/upload/photo` écrit côté serveur et la page relit le profil. Aucune
 * ambiguïté à lever ici, mais la différence de comportement avec l'avatar
 * méritait d'être écrite quelque part.
 */
export default function GaleriePhotos({
  photos,
  onEnregistrees,
}: {
  photos: string[];
  onEnregistrees: () => void;
}) {
  const [chargement, setChargement] = useState<Record<number, boolean>>({});
  const [emplacement, setEmplacement] = useState<number | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const champFichier = useRef<HTMLInputElement>(null);

  const ajouter = (index: number) => {
    setEmplacement(index);
    champFichier.current?.click();
  };

  const auChangement = async (
    evenement: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fichier = evenement.target.files?.[0];
    if (!fichier || emplacement === null) return;

    const index = emplacement;
    evenement.target.value = "";
    setEmplacement(null);

    setChargement((precedent) => ({ ...precedent, [index]: true }));
    setErreur(null);

    try {
      const corps = new FormData();
      corps.append("file", fichier);

      const reponse = await fetch("/api/upload/photo", {
        method: "POST",
        body: corps,
      });

      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || !donnees?.success) {
        setErreur(donnees?.error ?? "Cette photo n’a pas pu être envoyée.");
        return;
      }

      onEnregistrees();
    } catch {
      setErreur("Connexion interrompue.");
    } finally {
      setChargement((precedent) => ({ ...precedent, [index]: false }));
    }
  };

  const supprimer = async (url: string, index: number) => {
    setChargement((precedent) => ({ ...precedent, [index]: true }));
    setErreur(null);

    try {
      const reponse = await fetch(
        `/api/upload/photo?url=${encodeURIComponent(url)}`,
        { method: "DELETE" }
      );

      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || !donnees?.success) {
        setErreur(donnees?.error ?? "Cette photo n’a pas pu être retirée.");
        return;
      }

      onEnregistrees();
    } catch {
      setErreur("Connexion interrompue.");
    } finally {
      setChargement((precedent) => ({ ...precedent, [index]: false }));
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[12px] font-semibold text-cream/70">Mes photos</p>
        <p className="mt-0.5 text-[11px] text-cream/55">
          Jusqu’à trois photos · JPG, PNG ou WebP · recadrées en 4:5 ·
          enregistrées tout de suite, sans passer par « Sauvegarder ».
        </p>
      </div>

      {erreur && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          role="alert"
          className="flex items-center gap-2 overflow-hidden rounded-xl border border-orange/30 bg-orange/10 px-3.5 py-2.5 text-[12px] text-cream/85"
        >
          <AlertCircle size={13} className="shrink-0 text-orange" aria-hidden="true" />
          {erreur}
          <button
            type="button"
            onClick={() => setErreur(null)}
            aria-label="Fermer le message"
            className={`ml-auto text-cream/55 hover:text-cream ${focusRing}`}
          >
            <X size={13} aria-hidden="true" />
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-3 gap-2.5">
        {[0, 1, 2].map((index) => {
          const url = photos[index];
          const enCours = chargement[index] ?? false;

          return (
            <div
              key={index}
              className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-cream/10 bg-abyss"
            >
              {url ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Photo ${index + 1}`}
                    className="h-full w-full object-cover"
                  />

                  {enCours ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-abyss/70">
                      <Loader2
                        size={20}
                        className="animate-spin text-orange"
                        aria-hidden="true"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => supprimer(url, index)}
                      aria-label={`Retirer la photo ${index + 1}`}
                      className={`absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-abyss/80 text-cream/75 backdrop-blur-sm transition-colors hover:text-orange ${focusRing}`}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => ajouter(index)}
                  disabled={enCours}
                  aria-label={`Ajouter une photo en position ${index + 1}`}
                  className={`flex h-full w-full flex-col items-center justify-center gap-2 text-cream/45 transition-colors hover:bg-cream/5 hover:text-cream/70 disabled:opacity-40 ${focusRing}`}
                >
                  {enCours ? (
                    <Loader2 size={22} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/15">
                        <ImagePlus size={15} aria-hidden="true" />
                      </span>
                      <span className="text-[11px]">Ajouter</span>
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <input
        ref={champFichier}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={auChangement}
        className="sr-only"
      />
    </div>
  );
}
