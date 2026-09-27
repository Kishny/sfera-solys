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
  "Conditions d'utilisation — Sfera'Solys",
  "Les conditions générales d'utilisation de Sfera'Solys : accès au service, engagements, comportement attendu, résiliation.",
  '/conditions'
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
