import { buildMeta } from '@/app/layout-meta';

export const metadata = buildMeta(
  "Notre histoire — Comment Sfera'Solys est née",
  "L'histoire de Sfera'Solys : pourquoi nous avons créé un site de rencontres premium à identité vérifiée, pensé pour les hommes de 28 ans et plus.",
  '/histoire'
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
