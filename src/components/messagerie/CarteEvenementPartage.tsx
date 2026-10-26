// src/components/messagerie/CarteEvenementPartage.tsx

"use client";

/**
 * Un événement Solys partagé dans le fil.
 *
 * Les informations viennent de l'événement lui-même, pas d'une copie
 * faite au moment du partage : si la date bouge, la carte bouge. La
 * contrepartie est qu'un événement retiré laisse une carte vide — ce
 * cas est affiché tel quel plutôt que masqué, parce qu'un message qui
 * disparaît du fil est plus troublant qu'un message qui explique.
 */

import Link from "next/link";
import { CalendarDays, MapPin, Ticket, Video } from "lucide-react";

interface CarteEvenementPartageProps {
  evenement: {
    _id: string;
    titre: string;
    date: string;
    lieu: string;
    emoji: string;
    enLigne: boolean;
  } | null;
  /** Vrai dans une bulle cuivrée : les couleurs s'inversent. */
  surFondClair: boolean;
}

function formaterDate(valeur: string): string {
  const date = new Date(valeur);

  if (Number.isNaN(date.getTime())) return "Date à préciser";

  return `${date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })} à ${date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function CarteEvenementPartage({
  evenement,
  surFondClair,
}: CarteEvenementPartageProps) {
  const teinte = surFondClair ? "text-nuit" : "text-champagne";
  const teinteDouce = surFondClair ? "text-nuit/70" : "text-champagne/60";
  const accent = surFondClair ? "text-nuit/80" : "text-cuivre";
  const trait = surFondClair ? "border-nuit/20" : "border-champagne/15";

  if (!evenement) {
    return (
      <p className={`min-w-[12rem] max-w-[17rem] text-[12.5px] ${teinteDouce}`}>
        Cet événement n’est plus proposé.
      </p>
    );
  }

  const passe = new Date(evenement.date).getTime() < Date.now();

  return (
    <div className="min-w-[14rem] max-w-[18rem]">
      <p
        className={`mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${accent}`}
      >
        <Ticket size={12} aria-hidden="true" />
        Événement Solys
      </p>

      <p className={`text-[13.5px] font-semibold leading-snug ${teinte}`}>
        {evenement.emoji ? `${evenement.emoji} ` : ""}
        {evenement.titre}
      </p>

      <p
        className={`mt-1 flex items-start gap-1.5 text-[12px] leading-snug ${teinteDouce}`}
      >
        <CalendarDays size={12} aria-hidden="true" className="mt-0.5 shrink-0" />
        <span className="min-w-0">
          {formaterDate(evenement.date)}
          {passe && " — c’est passé"}
        </span>
      </p>

      <p
        className={`mt-1 flex items-start gap-1.5 text-[12px] leading-snug ${teinteDouce}`}
      >
        {evenement.enLigne ? (
          <Video size={12} aria-hidden="true" className="mt-0.5 shrink-0" />
        ) : (
          <MapPin size={12} aria-hidden="true" className="mt-0.5 shrink-0" />
        )}
        <span className="min-w-0 break-words">{evenement.lieu}</span>
      </p>

      <Link
        href={`/evenements#evenement-${evenement._id}`}
        className={`mt-2.5 block border-t pt-2.5 text-[12px] font-semibold underline underline-offset-2 ${trait} ${accent} hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cuivre`}
      >
        Voir l’événement
      </Link>
    </div>
  );
}
