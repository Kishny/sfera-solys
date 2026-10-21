// src/components/Sidebar.tsx

"use client";

/**
 * Sidebar Sfera'Solys — navigation de l'espace connecté.
 *
 * Restructuration (direction A retenue + sidebar de la direction B) :
 * - côté public (déconnecté), les pages gardent Header/Footer (nav
 *   horizontale sobre, mega-menus) ;
 * - côté connecté, cette sidebar verticale persistante remplace
 *   Header/Footer pour toutes les pages de l'espace membre.
 *
 * Reprend les mêmes briques que Header.tsx (session, notifications
 * temps réel via Pusher, sous-menus dépliables) pour rester cohérent
 * avec le reste du code plutôt que réinventer un système parallèle.
 *
 * Portée : desktop uniquement (lg et plus). Sous 1024 px, c'est
 * `BarreOngletsMobile` qui prend le relais — les deux lisent les mêmes
 * compteurs, via `FournisseurCompteurs`.
 *
 * TODO restructuration : /admin n'apparaît pas ici — c'est une zone à
 * accès restreint, traitée séparément du reste de l'espace membre.
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Compass,
  Crown,
  Globe,
  Heart,
  Home,
  LogOut,
  MessageCircle,
  ShieldCheck,
  User,
  Users2,
} from "lucide-react";
import EclipseMark from "@/components/brand/EclipseMark";
import { useCompteurs } from "@/components/espace/CompteursEspace";
import { Logo } from "@/components/ui/Logo";

type SidebarSubItem = {
  label: string;
  href: string;
};

type SidebarLink = {
  href?: string;
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  subItems?: SidebarSubItem[];
  /**
   * Compteur affiché en pastille. `messages` = messages non lus,
   * `matches` = mises en relation nouvelles depuis la dernière visite.
   *
   * L'entrée Messages portait `showBadge: true` et affichait le `total` de
   * `/api/notifications` — une somme qui mélange les messages non lus, un
   * drapeau « nouveaux matchs » et un drapeau « nouvelles visites de profil ».
   * Une visite sur le profil allumait donc la pastille de Messages, et on
   * arrivait sur une boîte vide. La route renvoyait déjà chaque compteur
   * séparément ; il suffisait de lire le bon.
   */
  pastille?: "messages" | "matches";
};

/**
 * La navigation de l'espace membre.
 *
 * « Accueil » pointait vers `/`, c'est-à-dire la page d'accueil publique :
 * depuis l'intérieur de l'application, le premier lien de la barre faisait
 * sortir. Il mène désormais au tableau de bord, et le retour au site
 * public a son propre lien, détaché en bas de la navigation.
 */
const links: SidebarLink[] = [
  { href: "/mon-compte", label: "Accueil", icon: Home },
  { href: "/explorer", label: "Explorer", icon: Compass },
  { href: "/matches", label: "Matches", icon: Heart, pastille: "matches" },
  {
    label: "Cercle & communauté",
    icon: Users2,
    subItems: [
      { label: "Circle of Six", href: "/circle" },
      { label: "Entraide", href: "/entraide" },
      { label: "Mode fantôme", href: "/mode-fantome" },
      { label: "Événements", href: "/evenements" },
      { label: "Communauté", href: "/communaute" },
    ],
  },
  {
    href: "/messages",
    label: "Messages",
    icon: MessageCircle,
    pastille: "messages",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const [circleOpen, setCircleOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);


  /**
   * Les compteurs viennent du contexte de l'espace, pas d'ici.
   *
   * Cette barre portait son propre sondage de `/api/notifications` et son
   * propre abonnement Pusher. Avec l'arrivée de la barre d'onglets mobile,
   * les deux auraient tourné en parallèle : elles sont montées ensemble,
   * l'une masquée en CSS et non démontée. Le sondage a donc été remonté
   * d'un cran, dans `FournisseurCompteurs`.
   */
  const compteurs = useCompteurs();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const isActive = (href?: string, subItems?: SidebarSubItem[]) => {
    if (href) return pathname === href;
    return Boolean(subItems?.some((item) => pathname === item.href));
  };

  return (
    <aside
      aria-label="Navigation principale"
      className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col border-r border-champagne/10 bg-nuit px-4 py-6 lg:flex"
    >
      <div className="px-2 pb-7">
        <Logo
          href="/mon-compte"
          size="sm"
          withMark
          markId="barre-laterale"
          tagline="Rencontres d’exception"
        />
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {links.map((link) => {
          const active = isActive(link.href, link.subItems);

          if (link.subItems) {
            return (
              <div key={link.label}>
                <button
                  type="button"
                  aria-expanded={circleOpen}
                  onClick={() => setCircleOpen((current) => !current)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-[11px] text-sm font-medium transition-colors ${
                    active
                      ? "bg-cuivre/15 text-champagne"
                      : "text-champagne/65 hover:bg-champagne/5 hover:text-champagne"
                  }`}
                >
                  <link.icon size={16} />
                  <span className="flex-1 text-left">{link.label}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${
                      circleOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {circleOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-champagne/10 pl-4">
                        {link.subItems.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            aria-current={pathname === sub.href ? "page" : undefined}
                            className={`rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                              pathname === sub.href
                                ? "text-cuivre"
                                : "text-champagne/55 hover:text-champagne"
                            }`}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href as string}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-[11px] text-sm font-medium transition-colors ${
                active
                  ? "bg-cuivre/15 text-champagne"
                  : "text-champagne/65 hover:bg-champagne/5 hover:text-champagne"
              }`}
            >
              <link.icon size={16} />
              <span className="flex-1">{link.label}</span>
              {link.pastille && compteurs[link.pastille] > 0 && (
                <span
                  className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-succes px-1 text-[10px] font-extrabold text-nuit"
                  aria-label={
                    link.pastille === "messages"
                      ? `${compteurs.messages} message${compteurs.messages > 1 ? "s" : ""} non lu${compteurs.messages > 1 ? "s" : ""}`
                      : `${compteurs.matches} nouvelle${compteurs.matches > 1 ? "s" : ""} mise${compteurs.matches > 1 ? "s" : ""} en relation`
                  }
                >
                  {compteurs[link.pastille] > 9 ? "9+" : compteurs[link.pastille]}
                </span>
              )}
            </Link>
          );
        })}

        <Link
          href="/tarifs"
          className="mt-1 flex items-center gap-3 rounded-xl px-3 py-[11px] text-sm font-medium text-champagne/65 transition-colors hover:bg-champagne/5 hover:text-champagne"
        >
          <Crown size={16} />
          <span>Premium</span>
        </Link>

        {/*
          Sortie vers le site public.

          Détachée par un filet : ce n'est pas une destination de
          l'application, c'est la porte. La confondre avec les autres
          entrées est précisément ce qui rendait l'ancien « Accueil »
          trompeur.
        */}
        <span aria-hidden="true" className="my-3 block h-px bg-champagne/10" />

        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-[11px] text-sm font-medium text-champagne/65 transition-colors hover:bg-champagne/5 hover:text-champagne"
        >
          <Globe size={16} />
          <span>Retour au site</span>
        </Link>
      </nav>

      {/*
        Signature du bas de barre.

        Purement décorative — `aria-hidden` — mais elle porte du texte, et à
        ce titre elle reste mesurée : le champagne à 60 % tient 5,52:1 sur
        `nuit`. L'éclipse déborde à gauche pour qu'on en voie un arc plutôt
        qu'un cercle complet, comme sur la maquette.
      */}
      <div
        aria-hidden="true"
        className="relative mt-6 overflow-hidden px-2 pb-6 pt-10"
      >
        <EclipseMark
          id="barre-laterale-signature"
          attenuation={0}
          className="pointer-events-none absolute -left-16 -top-8 h-[190px] w-[190px] opacity-30"
        />

        <p className="relative text-[10px] font-semibold uppercase leading-[1.8] tracking-surtitre text-champagne/60">
          Des rencontres
          <br />
          qui ont du sens
        </p>

        <span className="relative mt-3 block h-px w-10 bg-cuivre/70" />
      </div>

      {/* chip utilisateur */}
      <div className="relative mt-2">
        <button
          type="button"
          onClick={() => setUserMenuOpen((current) => !current)}
          aria-expanded={userMenuOpen}
          className="flex w-full items-center gap-2.5 rounded-xl bg-champagne/[0.04] px-3 py-2.5 text-left transition-colors hover:bg-champagne/[0.07]"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cuivre text-nuit">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt=""
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <User size={16} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-champagne">
              {session?.user?.name || "Ma Sphère"}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-succes">
              <ShieldCheck size={11} /> vérifié
            </div>
          </div>
        </button>

        <AnimatePresence>
          {userMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute bottom-full left-0 right-0 z-50 mb-2 rounded-2xl border border-champagne/10 bg-nuit p-2 shadow-[0_18px_44px_-14px_rgba(0,0,0,0.5)]"
            >
              <Link
                href="/mon-compte"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-champagne/70 transition-colors hover:bg-champagne/5 hover:text-champagne"
              >
                <User size={15} /> Ma Sphère
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-champagne/55 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOut size={15} /> déconnexion
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
