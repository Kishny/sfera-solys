// src/components/messagerie/EnregistreurVocal.tsx

"use client";

/**
 * L'enregistreur de message vocal.
 *
 * On appuie pour démarrer, on appuie pour arrêter — et non « maintenir
 * pour parler ». Maintenir est pénible au clavier, impossible à une main
 * sur un long message, et relâcher par accident efface tout.
 *
 * Deux minutes maximum, arrêt automatique au bout.
 *
 * LA RELECTURE SE FAIT SUR LE FICHIER DÉJÀ DÉPOSÉ
 * Safari ne sait lire ni une URL `blob:` ni une URL `data:` dans un
 * élément `<audio>` : son lecteur réclame des requêtes par plage, que
 * ni l'une ni l'autre ne savent servir. Il affiche « Erreur », ou rien.
 *
 * L'enregistrement est donc déposé dès l'arrêt, et c'est l'adresse
 * renvoyée — un MP3 servi en HTTPS, lisible partout — qu'on réécoute.
 * Le message, lui, ne part qu'à la validation : rien n'est encore
 * arrivé dans la conversation.
 *
 * La contrepartie est qu'un enregistrement abandonné laisse un fichier
 * sur Cloudinary. C'est déjà le cas des photos, et c'est le prix d'une
 * relecture qui fonctionne sur tous les navigateurs.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play, Send, Square, Trash2 } from "lucide-react";

interface EnregistreurVocalProps {
  /**
   * Dépose l'enregistrement et renvoie son adresse de lecture,
   * ou `null` si le dépôt a échoué.
   */
  onDeposer: (
    fichier: Blob,
    duree: number
  ) => Promise<{ url: string; duree: number } | null>;
  /** Envoie le vocal déjà déposé dans la conversation. */
  onEnvoyer: (url: string, duree: number) => void;
  /** Ferme l'enregistreur et rend la main au composeur texte. */
  onAnnuler: () => void;
  /** Vrai pendant que le composeur envoie le message. */
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
  onDeposer,
  onEnvoyer,
  onAnnuler,
  envoiEnCours,
  onErreur,
}: EnregistreurVocalProps) {
  const [etat, setEtat] = useState<
    "demarrage" | "enregistre" | "depot" | "relecture"
  >("demarrage");

  const [secondes, setSecondes] = useState(0);
  const [depose, setDepose] = useState<{ url: string; duree: number } | null>(
    null
  );
  const [enLecture, setEnLecture] = useState(false);
  const [relectureImpossible, setRelectureImpossible] = useState(false);

  const enregistreur = useRef<MediaRecorder | null>(null);
  const flux = useRef<MediaStream | null>(null);
  const morceaux = useRef<Blob[]>([]);
  const compteur = useRef<number | null>(null);
  const lecteur = useRef<HTMLAudioElement>(null);

  /**
   * La durée, lue hors du cycle de rendu.
   *
   * `onstop` est posé une fois pour toutes et ne verrait sinon que la
   * valeur initiale de `secondes` : zéro.
   */
  const dureeAtteinte = useRef(0);

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
      } catch (erreur) {
        /**
         * Trois causes possibles, et il vaut la peine de les distinguer :
         * un refus se règle dans les réglages du site, une absence de
         * micro ne se règle pas du tout, et un blocage par la politique
         * de permissions du serveur ne vient pas de l'utilisateur.
         */
        const nom = (erreur as DOMException)?.name ?? "";

        onErreur(
          nom === "NotAllowedError"
            ? "Le micro a été refusé. Autorise-le dans les réglages du site, puis réessaie."
            : nom === "NotFoundError"
              ? "Aucun micro n’a été trouvé sur cet appareil."
              : "Le micro n’a pas pu être ouvert."
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

        if (bloc.size === 0) {
          // Rien n'a été capté : il n'y a rien à déposer, et envoyer un
          // fichier vide donnerait un vocal muet dans le fil.
          onErreur("Rien n’a été enregistré. Réessaie.");
          onAnnuler();
          return;
        }

        setEtat("depot");

        void (async () => {
          const resultat = await onDeposer(bloc, dureeAtteinte.current);

          if (!resultat) {
            // Le message d'erreur a déjà été posé par le composeur.
            onAnnuler();
            return;
          }

          setDepose(resultat);
          setEtat("relecture");
        })();
      };

      enregistreur.current = machine;
      machine.start();

      setEtat("enregistre");

      compteur.current = window.setInterval(() => {
        setSecondes((valeur) => {
          const suivante = valeur + 1;
          dureeAtteinte.current = suivante;

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

  const jeter = () => {
    relacherLeMicro();
    onAnnuler();
  };

  const dureeAffichee = depose?.duree ?? secondes;

  return (
    <div className="flex items-center gap-2.5 rounded-[20px] border border-champagne/12 bg-nuit/65 px-3 py-2">
      <button
        type="button"
        onClick={jeter}
        disabled={envoiEnCours || etat === "depot"}
        aria-label="Annuler l’enregistrement"
        className="shrink-0 rounded-full p-2 text-champagne/65 transition hover:text-erreur disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cuivre"
      >
        <Trash2 size={17} aria-hidden="true" />
      </button>

      {etat === "relecture" && depose ? (
        <>
          <audio
            ref={lecteur}
            src={depose.url}
            preload="metadata"
            onPlay={() => setEnLecture(true)}
            onPause={() => setEnLecture(false)}
            onEnded={() => setEnLecture(false)}
            onError={() => setRelectureImpossible(true)}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => {
              const element = lecteur.current;
              if (!element) return;

              if (element.paused) {
                void element.play().catch(() => setRelectureImpossible(true));
              } else {
                element.pause();
              }
            }}
            disabled={relectureImpossible}
            aria-label={enLecture ? "Mettre en pause" : "Réécouter"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cuivre/20 text-champagne transition hover:bg-cuivre/30 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cuivre"
          >
            {enLecture ? (
              <Pause size={15} aria-hidden="true" />
            ) : (
              <Play size={15} aria-hidden="true" className="ml-0.5" />
            )}
          </button>

          <p className="min-w-0 flex-1 text-[12.5px] text-champagne/75">
            {relectureImpossible ? (
              <span className="text-champagne/60">
                Relecture indisponible ici. L’envoi reste possible.
              </span>
            ) : (
              <>
                <span className="tabular-nums">
                  {formaterDuree(dureeAffichee)}
                </span>
                <span className="text-champagne/50"> — réécoute avant d’envoyer</span>
              </>
            )}
          </p>

          <button
            type="button"
            onClick={() => onEnvoyer(depose.url, depose.duree)}
            disabled={envoiEnCours}
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
          {etat === "enregistre" && (
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full bg-erreur motion-safe:animate-pulse"
            />
          )}

          <p
            className="min-w-0 flex-1 text-[13px] text-champagne/80"
            role="status"
          >
            {etat === "demarrage" ? (
              "Ouverture du micro…"
            ) : etat === "depot" ? (
              "Préparation de l’enregistrement…"
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
            {etat === "enregistre" ? (
              <Square size={16} aria-hidden="true" />
            ) : (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            )}
          </button>
        </>
      )}
    </div>
  );
}
