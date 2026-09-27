import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "VibeMentor — Conseils & Q&A communauté | Sfera'Solys",
  "Posez vos questions, partagez vos expériences et obtenez des conseils bienveillants de la communauté Sfera'Solys.",
  "/vibementor"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
