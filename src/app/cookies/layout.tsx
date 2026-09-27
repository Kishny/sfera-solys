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
  "Politique des cookies — Sfera'Solys",
  "Quels cookies Sfera'Solys dépose, pour quoi faire, combien de temps, et comment refuser ceux qui ne sont pas indispensables.",
  '/cookies'
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
