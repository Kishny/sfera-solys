import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "Tarifs Sfera'Solys — Offres Essentiel, Premium & Elite",
  "Découvrez les offres Sfera'Solys : Essentiel à 9,99€/mois, Premium à 19,99€/mois, Elite à 34,99€/mois. Vérification d'identité incluse, sans engagement.",
  "/tarifs"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
