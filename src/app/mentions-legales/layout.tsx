import { buildMeta } from '@/app/layout-meta';

export const metadata = buildMeta(
  "Mentions légales — Sfera'Solys",
  "L'éditeur du site, le directeur de la publication, l'hébergeur et les voies de recours.",
  '/mentions-legales'
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
