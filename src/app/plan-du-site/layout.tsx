import { buildMeta } from '@/app/layout-meta';

export const metadata = buildMeta(
  "Plan du site — Sfera'Solys",
  "Toutes les pages de Sfera'Solys, classées par usage, avec celles qui demandent un compte.",
  '/plan-du-site'
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
