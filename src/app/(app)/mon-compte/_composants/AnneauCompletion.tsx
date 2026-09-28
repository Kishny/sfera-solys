// src/app/(app)/mon-compte/_composants/AnneauCompletion.tsx

import type { ReactNode } from "react";

/**
 * Anneau de progression autour de l'avatar.
 *
 * Le dégradé du tracé allait du violet (#9333ea) au rose (#ec4899) — deux
 * couleurs codées en dur qui n'appartiennent pas à la palette. Il utilise
 * maintenant l'orange de la marque, et le lime une fois le profil complet :
 * une validation se signale, elle ne se devine pas.
 */
export default function AnneauCompletion({
  completion,
  taille,
  children,
}: {
  completion: number;
  taille: number;
  children: ReactNode;
}) {
  const epaisseur = 4;
  const rayon = (taille - epaisseur * 2) / 2;
  const circonference = 2 * Math.PI * rayon;
  const decalage = circonference - (completion / 100) * circonference;
  const centre = taille / 2;

  const complet = completion >= 100;

  return (
    <div
      className="relative"
      style={{ width: taille, height: taille }}
      role="img"
      aria-label={`Profil complété à ${completion} %`}
    >
      <svg width={taille} height={taille} className="absolute inset-0">
        <circle
          cx={centre}
          cy={centre}
          r={rayon}
          fill="none"
          stroke="rgba(255,235,209,0.10)"
          strokeWidth={epaisseur}
        />

        <circle
          cx={centre}
          cy={centre}
          r={rayon}
          fill="none"
          stroke={complet ? "#B6FF00" : "#FF4103"}
          strokeWidth={epaisseur}
          strokeDasharray={circonference}
          strokeDashoffset={decalage}
          strokeLinecap="round"
          transform={`rotate(-90 ${centre} ${centre})`}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>

      <div className="absolute" style={{ inset: epaisseur + 2 }}>
        {children}
      </div>
    </div>
  );
}
