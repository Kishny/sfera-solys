import { buildMeta } from '@/app/layout-meta';

export const metadata = buildMeta(
  "Centre d'aide — Sfera'Solys",
  "Profil, vérification, offres, signalements : par où commencer, et comment nous joindre.",
  '/aide'
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
