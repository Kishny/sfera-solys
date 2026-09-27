import { buildMeta } from '@/app/layout-meta';

/**
 * Métadonnées de la page.
 *
 * Les quatre pages légales étaient des composants client sans `layout.tsx` :
 * elles ne pouvaient donc pas exporter `metadata` et n'avaient ni titre ni
 * description propres, y compris dans les résultats de recherche. Le fichier
 * de la page cookies contenait d'ailleurs un commentaire décrivant ce
 * contournement sans l'avoir appliqué.
 */
export const metadata = buildMeta(
  "Accessibilité — Sfera'Solys",
  "L'engagement d'accessibilité de Sfera'Solys, l'état de la conformité et comment nous signaler un blocage.",
  '/accessibilite'
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
