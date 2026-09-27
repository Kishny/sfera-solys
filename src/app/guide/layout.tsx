import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "Guide Sfera'Solys — Comment bien commencer",
  "Notre guide complet pour créer un profil attractif, trouver des matchs de qualité et vivre des rencontres authentiques sur Sfera'Solys.",
  "/guide"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
