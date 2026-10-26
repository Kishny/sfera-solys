// src/components/messagerie/CarteRendezVous.tsx

"use client";

/**
 * La proposition de rendez-vous dans le fil.
 *
 * C'est la seule bulle dont l'état change après l'envoi : elle porte la
 * réponse, et les boutons qui permettent de la donner.
 *
 * Qui voit quoi :
 * - le destinataire voit « Accepter » et « Décliner » tant que rien
 *   n'est joué, puis peut revenir sur sa réponse — un plan tombe à
 *   l'eau, et le dire doit rester possible ;
 * - l'auteur ne voit que « Retirer », et attend ;
 * - une proposition retirée ou dont la date est passée ne propose plus
 *   rien : il n'y a plus de décision à prendre.
 *
 * Ces règles sont rejouées côté serveur. Ici elles ne font qu'éviter de
 * montrer un bouton qui serait refusé.
 */

import { CalendarDays, Check, Loader2, MapPin, X } from "lucide-react";

export type StatutRendezVous = "propose" | "accepte" | "decline" | "annule";

interface CarteRendezVousProps {
  rendezVous: {
    quand: string;
    ou: string;
    note: string;
    statut: StatutRendezVous;
  };
  /** Vrai si c'est moi qui ai proposé. */
  jeSuisLAuteur: boolean;
  /** Vrai dans une bulle cuivrée : les couleurs s'inversent. */
  surFondClair: boolean;
  /** Vrai pendant l'envoi d'une réponse. */
  enCours: boolean;
  onRepondre: (reponse: "accepte" | "decline" | "annule") => void;
}

function formaterQuand(valeur: string): string {
  const date = new Date(valeur);

  if (Number.isNaN(date.getTime())) return "Date inconnue";

  const jour = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const heure = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${jour} à ${heure}`;
}

const LIBELLES: Record<StatutRendezVous, string> = {
  propose: "En attente de réponse",
  accepte: "Accepté",
  decline: "Décliné",
  annule: "Retiré",
};

export default function CarteRendezVous({
  rendezVous,
  jeSuisLAuteur,
  surFondClair,
  enCours,
  onRepondre,
}: CarteRendezVousProps) {
  const passe = new Date(rendezVous.quand).getTime() < Date.now();
  const clos = rendezVous.statut === "annule" || passe;

  const teinte = surFondClair ? "text-nuit" : "text-champagne";
  const teinteDouce = surFondClair ? "text-nuit/70" : "text-champagne/60";
  const accent = surFondClair ? "text-nuit/80" : "text-cuivre";
  const trait = surFondClair ? "border-nuit/20" : "border-champagne/15";

  /** La couleur du statut dit l'issue sans avoir à lire. */
  const couleurStatut =
    rendezVous.statut === "accepte"
      ? surFondClair
        ? "text-nuit"
        : "text-succes"
      : rendezVous.statut === "decline" || rendezVous.statut === "annule"
        ? surFondClair
          ? "text-nuit/60"
          : "text-champagne/50"
        : teinteDouce;

  const bouton =
    "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold transition disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cuivre";

  return (
    <div className="min-w-[14rem] max-w-[18rem]">
      <p
        className={`mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${accent}`}
      >
        <CalendarDays size={12} aria-hidden="true" />
        Rendez-vous
      </p>

      <p className={`text-[13.5px] font-semibold leading-snug ${teinte}`}>
        {formaterQuand(rendezVous.quand)}
      </p>

      <p
        className={`mt-1 flex items-start gap-1.5 text-[12.5px] leading-snug ${teinteDouce}`}
      >
        <MapPin size={12} aria-hidden="true" className="mt-0.5 shrink-0" />
        <span className="min-w-0 break-words">{rendezVous.ou}</span>
      </p>

      {rendezVous.note && (
        <p className={`mt-1.5 text-[12.5px] italic leading-relaxed ${teinteDouce}`}>
          « {rendezVous.note} »
        </p>
      )}

      <p className={`mt-2 text-[11.5px] font-semibold ${couleurStatut}`}>
        {passe && rendezVous.statut === "propose"
          ? "Sans réponse, et la date est passée"
          : LIBELLES[rendezVous.statut]}
      </p>

      {!clos && (
        <div className={`mt-2.5 flex gap-2 border-t pt-2.5 ${trait}`}>
          {jeSuisLAuteur ? (
            <button
              type="button"
              onClick={() => onRepondre("annule")}
              disabled={enCours}
              className={`${bouton} border ${trait} ${teinteDouce} hover:opacity-80`}
            >
              {enCours ? (
                <Loader2 size={12} className="animate-spin" aria-hidden="true" />
              ) : (
                <X size={12} aria-hidden="true" />
              )}
              Retirer
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onRepondre("accepte")}
                disabled={enCours || rendezVous.statut === "accepte"}
                className={`${bouton} ${
                  surFondClair
                    ? "bg-nuit text-champagne hover:opacity-90"
                    : "bg-succes/20 text-succes hover:bg-succes/30"
                }`}
              >
                {enCours ? (
                  <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Check size={12} aria-hidden="true" />
                )}
                {rendezVous.statut === "accepte" ? "Accepté" : "Accepter"}
              </button>

              <button
                type="button"
                onClick={() => onRepondre("decline")}
                disabled={enCours || rendezVous.statut === "decline"}
                className={`${bouton} border ${trait} ${teinteDouce} hover:opacity-80`}
              >
                <X size={12} aria-hidden="true" />
                {rendezVous.statut === "decline" ? "Décliné" : "Décliner"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
