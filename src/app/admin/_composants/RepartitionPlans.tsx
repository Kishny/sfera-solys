// src/app/admin/_composants/RepartitionPlans.tsx

import { Crown } from "lucide-react";

import { formatNumber, planLabel, type AdminStats } from "./types";

/**
 * Répartition des membres par offre.
 *
 * C'était un anneau à quatre couleurs. Quatre teintes catégorielles
 * distinguables en daltonisme n'existent pas dans cette palette — vert et
 * orange se confondent en deutéranopie, et l'or se confond avec l'orange
 * (ΔE 1,4). Plutôt que de forcer une palette qui échoue au contrôle,
 * l'identité passe ici par le libellé et la longueur de barre ; la couleur
 * ne porte plus rien, donc elle reste unique.
 */
export default function RepartitionPlans({
  breakdown,
  total,
}: {
  breakdown: AdminStats["planBreakdown"];
  total: number;
}) {
  const lignes = breakdown.map((b) => ({
    ...b,
    pct: total > 0 ? Math.round((b.count / total) * 100) : 0,
    label: planLabel[b.plan] || b.plan,
  }));

  return (
    <div>
      <div className="mb-5 flex items-baseline gap-2">
        <span className="font-display text-3xl font-extrabold text-cream">
          {formatNumber(total)}
        </span>
        <span className="text-[13px] text-cream/60">membres au total</span>
      </div>

      <ul className="space-y-3">
        {lignes.map((l) => (
          <li key={l.plan}>
            <div className="mb-1.5 flex items-center gap-2 text-[13px]">
              <span className="flex items-center gap-1 text-cream/70">
                {l.label}
                {l.plan === "elite-monthly" && (
                  <Crown className="h-3 w-3 text-orange" aria-hidden="true" />
                )}
              </span>
              <span className="ml-auto font-semibold text-cream">
                {formatNumber(l.count)}
              </span>
              <span className="w-9 text-right text-xs text-cream/60">
                {l.pct}%
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-cream/10">
              <div
                className="h-full rounded-full bg-orange"
                style={{ width: `${l.pct}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
