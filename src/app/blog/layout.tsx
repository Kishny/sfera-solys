import { buildMeta } from '@/app/layout-meta';

export const metadata = buildMeta(
  "Blog — Sfera'Solys",
  "Sur la rencontre à partir de 28 ans, la vérification d'identité et ce qu'on apprend en chemin.",
  '/blog'
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
