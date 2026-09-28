import { buildMeta } from "@/app/layout-meta";

export const metadata = buildMeta(
  "Entraide — Questions & réponses entre membres | Sfera'Solys",
  "Un fil de questions-réponses entre membres vérifiés : premier contact, profil, limites à poser. Ce sont des membres qui répondent, pas des professionnels. Ouvert dès l'offre gratuite.",
  "/entraide"
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
