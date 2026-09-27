import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "Commencer sur Sfera'Solys — Constituez votre dossier",
  "Crée ton profil Sfera'Solys en quelques minutes : vérification d'identité immédiate par Stripe Identity, gratuite, réservée aux hommes de 28 ans et plus.",
  "/commencer"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
