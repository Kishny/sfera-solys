// src/app/(app)/mon-compte/_composants/Champ.tsx

import type { ReactNode } from "react";
import { Info } from "lucide-react";

/** Libellé + champ. Les libellés portaient tous un emoji ; ils portent un mot. */
export function Champ({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[12px] font-semibold text-cream/70">
        {label}
      </span>
      {children}
    </label>
  );
}

/**
 * Délai annuel sur les champs verrouillés (pseudonyme, orientation).
 *
 * N'affiche rien tant que le changement est possible : un message permanent
 * « modifiable une fois par an » sur un champ librement modifiable est du bruit.
 */
export function DelaiAnnuel({ changeLe }: { changeLe?: string | null }) {
  if (!changeLe) return null;

  const UN_AN = 365 * 24 * 60 * 60 * 1000;
  const dernier = new Date(changeLe).getTime();

  if (Number.isNaN(dernier) || Date.now() - dernier >= UN_AN) return null;

  const prochain = new Date(dernier + UN_AN).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-cream/60">
      <Info size={12} className="mt-0.5 shrink-0 text-orange" aria-hidden="true" />
      Modifiable une fois par an — prochain changement possible le {prochain}.
    </p>
  );
}
