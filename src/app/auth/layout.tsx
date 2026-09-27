import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "Connexion & Inscription — Sfera'Solys",
  "Connectez-vous ou créez votre compte Sfera'Solys. Rejoignez une communauté premium de rencontres pour hommes de 28 ans et plus, à l'identité vérifiée.",
  "/auth"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
