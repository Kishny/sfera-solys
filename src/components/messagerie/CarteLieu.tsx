// src/components/messagerie/CarteLieu.tsx

"use client";

/**
 * Le lieu partagé, tel qu'il apparaît dans le fil.
 *
 * Pas de carte embarquée. Un plan tiers dans une bulle de conversation,
 * c'est un cadre d'un autre site chargé à chaque ouverture du fil :
 * il voit qui regarde, quand, et depuis où. Pour afficher un nom de
 * quartier, le prix est trop élevé.
 *
 * À la place : le nom du quartier, un repère dessiné sur place, et un
 * lien qui ouvre un plan dans un onglet — à la demande, et seulement
 * alors.
 */

import { ExternalLink, MapPin } from "lucide-react";

interface CarteLieuProps {
  lieu: { libelle: string; lat: number; lng: number };
  /** Vrai dans une bulle cuivrée : les couleurs s'inversent. */
  surFondClair: boolean;
}

export default function CarteLieu({ lieu, surFondClair }: CarteLieuProps) {
  /**
   * Le lien vers OpenStreetMap.
   *
   * `mlat`/`mlon` posent le repère, le fragment cadre la vue. Le zoom 14
   * correspond à la précision réellement partagée : ouvrir sur un zoom
   * plus fort laisserait croire à une exactitude qui n'existe pas.
   */
  const plan = `https://www.openstreetmap.org/?mlat=${lieu.lat}&mlon=${lieu.lng}#map=14/${lieu.lat}/${lieu.lng}`;

  const teinte = surFondClair ? "text-nuit" : "text-champagne";
  const teinteDouce = surFondClair ? "text-nuit/70" : "text-champagne/60";
  const pastille = surFondClair ? "bg-nuit/15" : "bg-cuivre/20";
  const accent = surFondClair ? "text-nuit" : "text-cuivre";

  return (
    <div className="flex min-w-[13rem] max-w-[17rem] items-start gap-3">
      <span
        aria-hidden="true"
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${pastille} ${accent}`}
      >
        <MapPin size={16} />
      </span>

      <div className="min-w-0 flex-1">
        <p className={`text-[13.5px] font-medium leading-snug ${teinte}`}>
          {lieu.libelle}
        </p>

        <p className={`mt-0.5 text-[11px] ${teinteDouce}`}>
          À environ un kilomètre près
        </p>

        <a
          href={plan}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-1.5 inline-flex items-center gap-1.5 text-[11.5px] underline underline-offset-2 ${accent} hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cuivre`}
        >
          Ouvrir le plan
          <ExternalLink size={11} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
