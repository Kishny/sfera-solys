// src/app/(app)/layout.tsx

/**
 * Gabarit du groupe de routes (app) — l'espace connecté.
 *
 * Les pages de ce groupe n'utilisent pas Header/Footer : elles héritent
 * de la navigation définie ici. Les route groups Next.js (parenthèses)
 * ne changent pas l'URL — `(app)/explorer/page.tsx` reste servi sur
 * `/explorer`.
 *
 * Deux navigations, un seul jeu de compteurs. La barre latérale tient
 * à partir de 1024 px, la barre d'onglets en dessous ; les deux sont
 * montées en permanence et se masquent en CSS, d'où le fournisseur
 * commun qui leur évite de sonder `/api/notifications` chacune de son
 * côté.
 *
 * La marge basse du contenu compense la hauteur de la barre d'onglets,
 * sans quoi la dernière ligne de chaque page passerait dessous.
 */

import Sidebar from "@/components/Sidebar";
import BarreOngletsMobile from "@/components/espace/BarreOngletsMobile";
import { FournisseurCompteurs } from "@/components/espace/CompteursEspace";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FournisseurCompteurs>
      <div className="flex min-h-screen bg-nuit">
        <Sidebar />

        <main className="min-w-0 flex-1 pb-[calc(68px+env(safe-area-inset-bottom))] lg:pb-0">
          {children}
        </main>
      </div>

      <BarreOngletsMobile />
    </FournisseurCompteurs>
  );
}
