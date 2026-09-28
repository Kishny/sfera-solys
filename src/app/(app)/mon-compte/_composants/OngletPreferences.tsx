// src/app/(app)/mon-compte/_composants/OngletPreferences.tsx

"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Ghost, Loader2 } from "lucide-react";

import { Champ, DelaiAnnuel } from "./Champ";
import {
  carte,
  champ,
  focusRing,
  intentionLabels,
  offreActive,
  orientationLabels,
  visibilityLabels,
  type MembreSolys,
  type ProfileVisibility,
} from "./types";

/**
 * Onglet Préférences.
 *
 * Le basculeur du Mode Fantôme écrit **immédiatement** (il appelle
 * `/api/users/profile` sans passer par le mode édition), alors que le sélecteur
 * de visibilité juste en dessous n'écrit qu'à la sauvegarde. Deux chemins pour
 * le même champ, et c'est ce qui avait produit le défaut corrigé
 * précédemment : le sélecteur listait les quatre visibilités sans contrôle
 * d'offre, donc permettait de choisir « invisible » en contournant la garde du
 * basculeur. L'option est désormais désactivée sans l'offre.
 */
export default function OngletPreferences({
  user,
  edition,
  majBrouillon,
  versTableau,
  onVisibilite,
}: {
  user: MembreSolys;
  edition: boolean;
  majBrouillon: <K extends keyof MembreSolys>(
    cle: K,
    valeur: MembreSolys[K]
  ) => void;
  versTableau: (valeur: string) => string[];
  onVisibilite: (valeur: ProfileVisibility) => Promise<void>;
}) {
  const [bascule, setBascule] = useState(false);

  const invisible = user.visibilite === "invisible";
  const payante = offreActive(user);

  const basculerFantome = async () => {
    if (!payante || bascule) return;

    setBascule(true);

    try {
      await onVisibilite(invisible ? "public" : "invisible");
    } finally {
      setBascule(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display [font-stretch:125%] text-[19px] font-bold text-cream">
          Préférences
        </h2>
        <p className="mt-1 text-[13px] text-cream/60">
          Tes intentions, ton orientation, et qui peut te voir.
        </p>
      </div>

      {/* Mode Fantôme */}
      <section
        className={`rounded-2xl border p-4 sm:p-5 ${
          invisible ? "border-orange/30 bg-orange/[0.08]" : "border-cream/10 bg-[#0C222D]"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                invisible ? "bg-orange text-abyss" : "bg-cream/[0.06] text-cream/70"
              }`}
            >
              <Ghost size={16} aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[14px] font-semibold text-cream">
                  Mode Fantôme
                </p>

                {invisible && payante && (
                  <span className="rounded-full bg-orange px-2 py-0.5 text-[11px] font-bold text-abyss">
                    Actif
                  </span>
                )}

                {!payante && (
                  <span className="rounded-full border border-cream/15 px-2 py-0.5 text-[11px] font-semibold text-cream/70">
                    Offres Premium et Elite
                  </span>
                )}
              </div>

              <p className="mt-1 text-[12px] leading-relaxed text-cream/60">
                {invisible
                  ? "Ton profil n’apparaît ni dans l’annuaire ni dans les Circle, et tu consultes les autres sans laisser de trace. Tes conversations restent ouvertes."
                  : "Disparaître de l’annuaire et des Circle, et consulter les autres profils sans laisser de trace — sans perdre tes conversations."}
              </p>

              {!payante && (
                <p className="mt-2 text-[12px] text-cream/60">
                  <Link
                    href="/tarifs"
                    className={`font-semibold text-cream underline underline-offset-2 hover:text-orange ${focusRing}`}
                  >
                    Voir les offres
                  </Link>{" "}
                  · les trois autres visibilités sont accessibles à tous, sur{" "}
                  <Link
                    href="/mode-fantome"
                    className={`font-semibold text-cream underline underline-offset-2 hover:text-orange ${focusRing}`}
                  >
                    la page dédiée
                  </Link>
                  .
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={basculerFantome}
            disabled={bascule || !payante}
            role="switch"
            aria-checked={invisible}
            aria-label="Mode Fantôme"
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${focusRing} ${
              invisible ? "bg-orange" : "bg-cream/20"
            }`}
          >
            <motion.span
              animate={{ x: invisible ? 22 : 3 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-0.5 block h-6 w-6 rounded-full bg-cream"
            />

            {bascule && (
              <Loader2
                size={13}
                className="absolute inset-0 m-auto animate-spin text-abyss"
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </section>

      {/* Champs */}
      <section className={`${carte} p-4 sm:p-5`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Champ label="Orientation">
            <select
              disabled={!edition}
              value={user.orientation || ""}
              onChange={(evenement) =>
                majBrouillon("orientation", evenement.target.value)
              }
              className={champ}
            >
              <option value="">Non renseignée</option>

              {/*
                `curieuse` est un doublon de `curieux`, conservé pour les
                profils enregistrés avant la reprise du fork. On ne le propose
                pas à la sélection, mais un profil qui le porte l'affiche
                correctement.
              */}
              {Object.entries(orientationLabels)
                .filter(([cle]) => cle !== "curieuse")
                .map(([cle, valeur]) => (
                  <option key={cle} value={cle}>
                    {valeur}
                  </option>
                ))}
            </select>
            <DelaiAnnuel changeLe={user.orientationChangedAt} />
          </Champ>

          <Champ label="Intentions">
            <input
              disabled={!edition}
              value={(user.intentions || [])
                .map((item) => intentionLabels[item] || item)
                .join(", ")}
              onChange={(evenement) =>
                majBrouillon(
                  "intentions",
                  versTableau(evenement.target.value).map((valeur) => {
                    // On accepte le libellé lisible et on retrouve la clé.
                    const trouve = Object.entries(intentionLabels).find(
                      ([, label]) => label === valeur.trim()
                    );

                    return trouve ? trouve[0] : valeur.trim();
                  })
                )
              }
              className={champ}
              placeholder="Rencontre sérieuse, Amitié…"
            />
            <span className="mt-1.5 block text-[11px] text-cream/55">
              Séparées par des virgules.
            </span>
          </Champ>

          <Champ label="Qui peut voir mon profil" className="sm:col-span-2">
            <select
              disabled={!edition}
              value={user.visibilite || "matches"}
              onChange={(evenement) =>
                majBrouillon(
                  "visibilite",
                  evenement.target.value as ProfileVisibility
                )
              }
              className={champ}
            >
              {Object.entries(visibilityLabels).map(([cle, valeur]) => (
                <option
                  key={cle}
                  value={cle}
                  disabled={cle === "invisible" && !payante}
                >
                  {cle === "invisible" && !payante
                    ? `${valeur} (offres Premium et Elite)`
                    : valeur}
                </option>
              ))}
            </select>
            <span className="mt-1.5 block text-[11px] leading-relaxed text-cream/55">
              Ce réglage s’enregistre à la sauvegarde. Le basculeur du Mode
              Fantôme, lui, s’applique tout de suite.
            </span>
          </Champ>
        </div>
      </section>
    </div>
  );
}
