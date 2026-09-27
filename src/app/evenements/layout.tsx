import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "Événements Solys — Rencontres & soirées | Sfera'Solys",
  "Participez aux événements Sfera'Solys : soirées, ateliers et rencontres en personne organisés pour les membres de la communauté.",
  "/evenements"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
