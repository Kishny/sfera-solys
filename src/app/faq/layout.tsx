import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "FAQ Sfera'Solys — Questions fréquentes",
  "Toutes les réponses à vos questions sur Sfera'Solys : inscription, abonnement, sécurité, profil, matchs et messagerie.",
  "/faq"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
