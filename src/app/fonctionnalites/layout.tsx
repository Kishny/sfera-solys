import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "Fonctionnalités Sfera'Solys — Circle of Six, Mode Fantôme & plus",
  "Explorez toutes les fonctionnalités de Sfera'Solys : Circle of Six, annuaire, Mode Fantôme, événements et coaching — entre profils vérifiés par document officiel.",
  "/fonctionnalites"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
