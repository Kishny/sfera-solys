// src/components/messagerie/EnregistreurVocal.tsx

"use client";

/**
 * L'enregistreur de message vocal.
 *
 * On appuie pour démarrer, on appuie pour arrêter — et non « maintenir
 * pour parler ». Maintenir est pénible au clavier, impossible à une main
 * sur un long message, et relâcher par accident efface tout. Ici, rien
 * ne part tant qu'on n'a pas validé : l'enregistrement s'écoute avant
 * d'être envoyé, et « Annuler » le jette pour de bon.
 *
 * Deux minutes maximum, arrêt automatique au bout.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send, Square, Trash2 } from "lucide-react";

interface EnregistreurVocalProps {
  /** Rend l'enregistrement terminé : le fichier et sa durée. */
  onEnvoyer: (fichier: Blob, duree: number) => void;
  /** Ferme l'enregistreur et rend la main au composeur texte. */
  onAnnuler: () => void;
  /** Vrai pendant que le composeur dépose le fichier. */
  envoiEnCours: boolean;
  /** Remonte une erreur à afficher dans le bandeau du composeur. */
  onErreur: (message: string) => void;
}

/** Deux minutes. Au-delà, ce n'est plus un message, c'est un podcast. */
export const DUREE_MAX = 120;

function formaterDuree(secondes: number): string {
  const m = Math.floor(secondes / 60);
  const s = Math.floor(secondes % 60);

  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Le format que sait produire ce navigateur.
 *
 * Chrome et Firefox donnent du WebM/Opus, Safari du MP4/AAC. On laisse
 * le navigateur choisir plutôt que d'imposer un format qu'il refuserait.
 */
function choisirLeFormat(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;

  const candidats = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];

  return candidats.find((type) => MediaRecorder.isTypeSupported(type));
}

export default function EnregistreurVocal({
  onEnvoyer,
  onAnnuler,
  envoiEnCours,
  onErreur,
}: EnregistreurVocalProps) {
  const [etat, setEtat] = useState<"demarrage" | "enregistre" | "relecture">(
    "demarrage"
  );
  const [secondes, setSecondes] = useState(0);
  const [apercu, setApercu] = useState<string | null>(null);

  const enregistreur = useRef<MediaRecorder | null>(null);
  const flux = useRef<MediaStream | null>(null);
  const morceaux = useRef<Blob[]>([]);
  const resultat = useRef<Blob | null>(null);
  const compteur = useRef<number | null>(null);

  /**
   * Coupe le micro.
   *
   * Indispensable : sans ça, la pastille d'enregistrement reste allumée
   * dans l'onglet du navigateur une fois le message envoyé. Personne
   * n'aime voir que son micro est ouvert sans raison.
   */
  const relacherLeMicro = useCallback(() => {
    flux.current?.getTracks().forEach((piste) => piste.stop());
    flux.current = null;

    if (compteur.current !== null) {
      window.clearInterval(compteur.current);
      compteur.current = null;
    }
  }, []);

  const arreter = useCallback(() => {
    if (enregistreur.current?.state === "recording") {
      enregistreur.current.stop();
    }
  }, []);

  /**
   * Démarrage : on demande le micro dès l'ouverture.
   *
   * L'enregistreur n'apparaît que parce qu'on a cliqué sur le micro ;
   * faire cliquer une seconde fois pour « vraiment » démarrer serait un
   * pas de trop.
   */
  useEffect(() => {
    let annule = false;

    const demarrer = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        onErreur("Ce navigateur ne sait pas enregistrer de son.");
        onAnnuler();
        return;
      }

      let piste: MediaStream;

      try {
        piste = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        // Refus de la permission, ou aucun micro branché. Les deux se
        // disent de la même façon : ce n'est pas à l'utilisateur de
        // deviner laquelle des deux.
        onErreur(
          "Le micro n’est pas accessible. Vérifie l’autorisation du navigateur."
        );
        onAnnuler();
        return;
      }

      if (annule) {
        piste.getTracks().forEach((p) => p.stop());
        return;
      }

      flux.current = piste;

      const format = choisirLeFormat();
      const machine = new MediaRecorder(
        piste,
        format ? { mimeType: format } : undefined
      );

      morceaux.current = [];

      machine.ondataavailable = (evenement) => {
        if (evenement.data.size > 0) morceaux.current.push(evenement.data);
      };

      machine.onstop = () => {
        relacherLeMicro();

        const bloc = new Blob(morceaux.current, {
          type: machine.mimeType || "audio/webm",
        });

        resultat.current = bloc;
        setApercu(URL.createObjectURL(bloc));
        setEtat("relecture");
      };

      enregistreur.current = machine;
      machine.start();

      setEtat("enregistre");

      compteur.current = window.setInterval(() => {
        setSecondes((valeur) => {
          const suivante = valeur + 1;

          // Arrêt automatique : on ne laisse pas filer.
          if (suivante >= DUREE_MAX) {
            window.setTimeout(() => arreter(), 0);
          }

          return suivante;
        });
      }, 1000);
    };

    void demarrer();

    return () => {
      annule = true;

      if (enregistreur.current?.state === "recording") {
        // On coupe sans passer par `onstop` : le composant disparaît.
        enregistreur.current.onstop = null;
        enregistreur.current.stop();
      }

      relacherLeMicro();
    };
    // Volontairement au montage seulement : l'enregistreur n'existe que
    // le temps d'un enregistrement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** L'aperçu est une URL d'objet : elle se révoque, sinon elle fuit. */
  useEffect(() => {
    return () => {
      if (apercu) URL.revokeObjectURL(apercu);
    };
  }, [apercu]);

  const jeter = () => {
    relacherLeMicro();
    resultat.current = null;
    onAnnuler();
  };

  return (
    <div className="flex items-center gap-2.5 rounded-[20px] border border-champagne/12 bg-nuit/65 px-3 py-2">
      <button
        type="button"
        onClick={jeter}
        disabled={envoiEnCours}
        aria-label="Annuler l’enregistrement"
        className="shrink-0 rounded-full p-2 text-champagne/65 transition hover:text-erreur disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cuivre"
      >
        <Trash2 size={17} aria-hidden="true" />
      </button>

      {etat === "relecture" && apercu ? (
        <>
          {/*
            La relecture avant envoi.

            Les contrôles natifs suffisent ici : c'est un écran de
            passage, et le lecteur maison est fait pour le fil.
          */}
          <audio
            src={apercu}
            controls
            className="min-w-0 flex-1"
            aria-label="Réécouter avant d’envoyer"
          />

          <span className="shrink-0 text-[12px] tabular-nums text-champagne/65">
            {formaterDuree(secondes)}
          </span>

          <button
            type="button"
            onClick={() => {
              if (resultat.current) onEnvoyer(resultat.current, secondes);
            }}
            disabled={envoiEnCours || !resultat.current}
            aria-label="Envoyer le vocal"
            className="shrink-0 rounded-full bg-degrade-cuivre p-2.5 text-nuit transition hover:opacity-90 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cuivre"
          >
            {envoiEnCours ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Send size={16} aria-hidden="true" />
            )}
          </button>
        </>
      ) : (
        <>
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 rounded-full bg-erreur motion-safe:animate-pulse"
          />

          <p
            className="min-w-0 flex-1 text-[13px] text-champagne/80"
            role="status"
          >
            {etat === "demarrage" ? (
              "Ouverture du micro…"
            ) : (
              <>
                <span className="tabular-nums">{formaterDuree(secondes)}</span>
                <span className="text-champagne/50">
                  {" "}
                  / {formaterDuree(DUREE_MAX)}
                </span>
              </>
            )}
          </p>

          <button
            type="button"
            onClick={arreter}
            disabled={etat !== "enregistre"}
            aria-label="Arrêter l’enregistrement"
            className="shrink-0 rounded-full bg-champagne/15 p-2.5 text-champagne transition hover:bg-champagne/25 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cuivre"
          >
            {etat === "demarrage" ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Square size={16} aria-hidden="true" />
            )}
          </button>
        </>
      )}
    </div>
  );
}
