import { buildMeta } from '@/app/layout-meta';

/**
 * Métadonnées de la politique de confidentialité.
 *
 * Aucune des quatre pages légales n'avait de `layout.tsx` : étant toutes des
 * composants client, elles ne pouvaient pas exporter `metadata` et se
 * retrouvaient donc sans titre ni description propres — y compris dans les
 * résultats de recherche et les aperçus de partage.
 */
export const metadata = buildMeta(
  "Politique de confidentialité — Sfera'Solys",
  "Quelles données Sfera'Solys collecte, pourquoi, qui les traite, combien de temps elles sont conservées, et comment exercer tes droits.",
  '/confidentialite'
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
