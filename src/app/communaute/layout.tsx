import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "Communauté Solys — Forum & échanges | Sfera'Solys",
  "Rejoignez la communauté Sfera'Solys : partagez, échangez et trouvez du soutien dans un espace sécurisé réservé aux membres vérifiés.",
  "/communaute"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
