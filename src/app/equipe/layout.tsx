import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "L'équipe Sfera'Solys — Ceux qui font la différence",
  "Les pôles qui font tourner Sfera'Solys : vérification d'identité, modération humaine, produit et relation membres.",
  "/equipe"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
