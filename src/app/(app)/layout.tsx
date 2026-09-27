// src/app/(app)/layout.tsx

/**
 * Layout du groupe de routes (app) — espace connecté.
 *
 * Restructuration (direction A + sidebar de la direction B, voir
 * CLAUDE.md § Restructuration de l'architecture) : les pages de ce
 * groupe n'utilisent plus Header/Footer individuellement — elles
 * héritent toutes de la sidebar verticale persistante définie ici.
 *
 * Les route groups Next.js (parenthèses) ne changent pas l'URL :
 * src/app/(app)/explorer/page.tsx reste servi sur /explorer.
 *
 * Page pilote de la migration : /explorer (25/09/2026). Les autres
 * pages listées dans CLAUDE.md rejoindront ce groupe une fois le
 * pattern validé.
 */

import Sidebar from "@/components/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-abyss">
      <Sidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
