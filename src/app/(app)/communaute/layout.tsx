import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "Communauté Solys — Forum & échanges | Sfera'Solys",
  "Un fil public entre membres vérifiés : partage, échange et trouve du soutien. Accessible dès l'offre gratuite, modéré comme la messagerie.",
  "/communaute"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
