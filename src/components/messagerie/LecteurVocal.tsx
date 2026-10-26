// src/components/messagerie/LecteurVocal.tsx

"use client";

/**
 * Le lecteur d'un message vocal dans le fil.
 *
 * Les contrôles natifs du navigateur sont bruts, gris, et n'obéissent à
 * aucune des couleurs du site ; dans une bulle cuivrée, ils détonnent.
 * D'où ce lecteur, qui ne fait que l'essentiel : jouer, mettre en pause,
 * se déplacer, et dire où on en est.
 *
 * `preload="metadata"` : le son n'est téléchargé qu'à la lecture. Un fil
 * de vingt vocaux ne doit pas charger vingt fichiers à l'ouverture.
 */

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

interface LecteurVocalProps {
  url: string;
  /** Durée connue à l'envoi, affichée avant tout chargement. */
  duree: number | null;
  /** Vrai dans une bulle cuivrée : les couleurs s'inversent. */
  surFondClair: boolean;
}

function formaterDuree(secondes: number): string {
  if (!Number.isFinite(secondes) || secondes < 0) return "0:00";

  const m = Math.floor(secondes / 60);
  const s = Math.floor(secondes % 60);

  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function LecteurVocal({
  url,
  duree,
  surFondClair,
}: LecteurVocalProps) {
  const audio = useRef<HTMLAudioElement>(null);

  const [enLecture, setEnLecture] = useState(false);
  const [position, setPosition] = useState(0);
  const [dureeReelle, setDureeReelle] = useState<number | null>(duree);

  /**
   * Un seul vocal à la fois.
   *
   * Deux voix qui se parlent par-dessus sont inécoutables. Quand un
   * lecteur démarre, les autres s'arrêtent — y compris ceux des autres
   * conversations restées ouvertes dans un autre onglet du même
   * navigateur, qui n'entendent pas cet événement et dont on se moque.
   */
  useEffect(() => {
    const surDemarrage = (evenement: Event) => {
      const element = audio.current;

      if (!element || evenement.target === element) return;

      element.pause();
    };

    document.addEventListener("play", surDemarrage, true);

    return () => {
      document.removeEventListener("play", surDemarrage, true);
    };
  }, []);

  const basculer = () => {
    const element = audio.current;
    if (!element) return;

    if (element.paused) void element.play();
    else element.pause();
  };

  const avancement =
    dureeReelle && dureeReelle > 0
      ? Math.min(100, (position / dureeReelle) * 100)
      : 0;

  const teinte = surFondClair ? "text-nuit" : "text-champagne";
  const teinteDouce = surFondClair ? "text-nuit/70" : "text-champagne/60";
  const rail = surFondClair ? "bg-nuit/20" : "bg-champagne/15";
  const barre = surFondClair ? "bg-nuit/75" : "bg-cuivre";
  const pastille = surFondClair
    ? "bg-nuit/15 hover:bg-nuit/25"
    : "bg-cuivre/20 hover:bg-cuivre/30";

  return (
    <div className="flex min-w-[13rem] items-center gap-3">
      <audio
        ref={audio}
        src={url}
        preload="metadata"
        onPlay={() => setEnLecture(true)}
        onPause={() => setEnLecture(false)}
        onEnded={() => {
          setEnLecture(false);
          setPosition(0);
        }}
        onTimeUpdate={(evenement) =>
          setPosition(evenement.currentTarget.currentTime)
        }
        onLoadedMetadata={(evenement) => {
          const valeur = evenement.currentTarget.duration;

          // Certains WebM annoncent une durée infinie tant qu'ils n'ont
          // pas été parcourus : dans ce cas on garde celle de l'envoi.
          if (Number.isFinite(valeur) && valeur > 0) setDureeReelle(valeur);
        }}
      />

      <button
        type="button"
        onClick={basculer}
        aria-label={enLecture ? "Mettre en pause" : "Écouter le vocal"}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${pastille} ${teinte} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cuivre`}
      >
        {enLecture ? (
          <Pause size={15} aria-hidden="true" />
        ) : (
          <Play size={15} aria-hidden="true" className="ml-0.5" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        {/*
          Un `range` plutôt qu'une barre décorative : on doit pouvoir se
          déplacer dans un vocal, et au clavier les flèches suffisent.
        */}
        <label className="sr-only" htmlFor={`position-${url}`}>
          Position dans l’enregistrement
        </label>

        <div className={`relative h-1.5 w-full rounded-full ${rail}`}>
          <div
            className={`absolute inset-y-0 left-0 rounded-full ${barre}`}
            style={{ width: `${avancement}%` }}
            aria-hidden="true"
          />

          <input
            id={`position-${url}`}
            type="range"
            min={0}
            max={dureeReelle && dureeReelle > 0 ? dureeReelle : 1}
            step={0.1}
            value={position}
            onChange={(evenement) => {
              const valeur = Number(evenement.target.value);
              setPosition(valeur);

              if (audio.current) audio.current.currentTime = valeur;
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>

        <p className={`mt-1 text-[10.5px] tabular-nums ${teinteDouce}`}>
          {formaterDuree(position)}
          {dureeReelle ? ` / ${formaterDuree(dureeReelle)}` : ""}
        </p>
      </div>
    </div>
  );
}
