import { buildMeta } from '@/app/layout-meta';

export const metadata = buildMeta(
  "Gestion des données — Sfera'Solys",
  "Tes droits sur tes données, ce qui se règle depuis ton compte et ce qui passe par une demande.",
  '/gestion-donnees'
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
