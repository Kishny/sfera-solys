// src/app/admin/_composants/GraphiqueActivite.tsx

"use client";

import { useState } from "react";

import type { AdminStats } from "./types";

/**
 * Palette des séries, validée plutôt que choisie à l'œil.
 *
 * Contrôlée sur le fond des cartes (#1D2835) : bande de luminosité OKLCH
 * [0,48 – 0,67], chroma ≥ 0,10, séparation daltonienne ΔE ≥ 8 entre séries
 * voisines (20,5 au pire ici, en protanopie), contraste ≥ 3:1 sur le fond.
 *
 * Repassée au contrôle après le changement de charte. Le cuivre de la
 * marque ne peut pas servir de série : sa luminosité (0,692) sort de la
 * bande et son chroma (0,080) passe sous le plancher — à côté de teintes
 * saturées il se lit comme un gris chaud. Les couleurs de données ne sont
 * pas les couleurs de marque, et le troisième ton est donc un ambre
 * (#CF7A2B) voisin du cuivre mais assez saturé pour tenir son rôle.
 *
 * L'ordre compte : vert et ambre se confondent en deutéranopie.
 * Ils ne sont donc jamais voisins — le bleu les sépare, et les messages sont
 * tracés en ligne quand les deux autres séries sont en barres, ce qui ajoute
 * une distinction de forme à la distinction de couleur.
 */
const SERIE = {
  inscriptions: "#6b9b00",
  matchs: "#218cb5",
  messages: "#CF7A2B",
} as const;

const LEGENDE = [
  { cle: "inscriptions", libelle: "Inscriptions", couleur: SERIE.inscriptions },
  { cle: "matchs", libelle: "Matchs", couleur: SERIE.matchs },
  { cle: "messages", libelle: "Messages", couleur: SERIE.messages },
] as const;

export default function GraphiqueActivite({
  data,
}: {
  data: AdminStats["dailySeries"];
}) {
  const [survol, setSurvol] = useState<number | null>(null);

  const W = 560;
  const H = 240;
  const pad = { top: 20, right: 16, bottom: 28, left: 28 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;

  const pic = Math.max(
    1,
    ...data.map((d) => Math.max(d.inscriptions, d.matches, d.messages))
  );
  const max = Math.ceil(pic / 4) * 4 || 4;

  const groupW = iW / Math.max(data.length, 1);
  const barW = 12;
  const gap = 5;

  const points = data.map((d, i) => ({
    x: pad.left + groupW * i + groupW / 2,
    y: pad.top + iH - (d.messages / max) * iH,
  }));

  const chemin = points
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
    .join(" ");

  const grilles = [0, max / 4, max / 2, (3 * max) / 4, max];

  return (
    <div className="relative">
      {/* Trois séries : la légende n'est pas optionnelle. */}
      <ul className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {LEGENDE.map((s) => (
          <li key={s.cle} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: s.couleur }}
            />
            <span className="text-[11px] text-champagne/70">{s.libelle}</span>
          </li>
        ))}
      </ul>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {grilles.map((g, i) => {
          const y = pad.top + iH - (g / max) * iH;
          return (
            <g key={i}>
              <line
                x1={pad.left}
                y1={y}
                x2={W - pad.right}
                y2={y}
                stroke="rgba(234,217,189,0.08)"
                strokeWidth="1"
              />
              <text x={4} y={y + 3} fill="rgba(234,217,189,0.45)" fontSize="9">
                {Math.round(g)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const centre = pad.left + groupW * i + groupW / 2;
          const hInscr = (d.inscriptions / max) * iH;
          const hMatch = (d.matches / max) * iH;

          return (
            <g key={i}>
              {survol === i && (
                <rect
                  x={centre - groupW / 2}
                  y={pad.top}
                  width={groupW}
                  height={iH}
                  fill="rgba(234,217,189,0.05)"
                />
              )}

              <rect
                x={centre - barW - gap / 2}
                y={pad.top + iH - hInscr}
                width={barW}
                height={hInscr}
                rx="3"
                fill={SERIE.inscriptions}
              />
              <rect
                x={centre + gap / 2}
                y={pad.top + iH - hMatch}
                width={barW}
                height={hMatch}
                rx="3"
                fill={SERIE.matchs}
              />

              <text
                x={centre}
                y={H - 8}
                textAnchor="middle"
                fill="rgba(234,217,189,0.6)"
                fontSize="10"
              >
                {d.label}
              </text>

              {/* Cible de survol : toute la colonne, pas seulement la barre. */}
              <rect
                x={centre - groupW / 2}
                y={pad.top}
                width={groupW}
                height={iH}
                fill="transparent"
                onMouseEnter={() => setSurvol(i)}
                onMouseLeave={() => setSurvol(null)}
              />
            </g>
          );
        })}

        {points.length > 0 && (
          <>
            <path
              d={chemin}
              fill="none"
              stroke={SERIE.messages}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r="4"
                fill={SERIE.messages}
                stroke="#1D2835"
                strokeWidth="2"
              />
            ))}
          </>
        )}
      </svg>

      {survol !== null && data[survol] && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 rounded-xl border border-champagne/15 bg-nuit/95 px-3 py-2 text-[11px] shadow-lg"
          style={{
            left: `${((pad.left + groupW * survol + groupW / 2) / W) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          <p className="mb-1 font-semibold text-champagne">{data[survol].label}</p>
          {LEGENDE.map((s) => (
            <p key={s.cle} className="flex items-center gap-1.5 text-champagne/70">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: s.couleur }}
              />
              {s.libelle}
              <span className="ml-2 font-semibold text-champagne">
                {s.cle === "inscriptions"
                  ? data[survol].inscriptions
                  : s.cle === "matchs"
                    ? data[survol].matches
                    : data[survol].messages}
              </span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
