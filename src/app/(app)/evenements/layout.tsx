import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "Événements Solys — Rencontres & soirées | Sfera'Solys",
  "Soirées, ateliers et rencontres en présentiel ou en ligne, entre membres vérifiés. La liste est visible par tous ; l'inscription s'ouvre à partir de l'offre Essentiel.",
  "/evenements"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
