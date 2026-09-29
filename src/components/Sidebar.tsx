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
 * Portée de cette première version : desktop uniquement (lg et plus).
 * TODO restructuration : équivalent mobile en tab bar basse (voir la
 * maquette "Direction B — mobile" du canvas de maquettes) — à faire
 * quand on migre les pages une par une vers cette sidebar.
 *
 * TODO restructuration : /admin n'apparaît pas ici — c'est une zone à
 * accès restreint, traitée séparément du reste de l'espace membre.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sun,
  Compass,
  Heart,
  MessageCircle,
  Users2,
  Crown,
  User,
  ChevronDown,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { getPusherClient } from "@/lib/pusher-client";

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

const links: SidebarLink[] = [
  { href: "/", label: "Accueil", icon: Sun },
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

  const [compteurs, setCompteurs] = useState({
    messages: 0,
    matches: 0,
  });
  const [circleOpen, setCircleOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isLoggedIn = !!session?.user;

  /**
   * Notifications : même logique que Header.tsx (polling + Pusher),
   * pour garder un seul compteur cohérent partout dans l'appli.
   */
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchNotifs = async () => {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();

        setCompteurs({
          messages: data.unreadMessages || 0,
          matches: data.newMatches || 0,
        });
      } catch {
        // On ignore volontairement l'erreur pour ne pas casser la sidebar.
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30_000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const sessionUser = session?.user as { id?: string } | undefined;
    const userId = sessionUser?.id;
    if (!userId) return;

    const channelName = `private-user-${userId}`;
    const client = getPusherClient();
    const channel = client.subscribe(channelName);

    /*
     * Le canal `private-user-{id}` porte les nouveaux matchs. Les nouveaux
     * messages, eux, passent par `private-match-{id}` : la barre latérale
     * n'y est pas abonnée, c'est la relecture toutes les 30 s qui met leur
     * compteur à jour.
     */
    channel.bind("new-match", () => {
      setCompteurs((precedents) => ({
        ...precedents,
        matches: precedents.matches + 1,
      }));
    });

    return () => {
      channel.unbind_all();
      client.unsubscribe(channelName);
    };
  }, [isLoggedIn, session?.user]);

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
      className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col border-r border-cream/10 bg-abyss px-4 py-6 lg:flex"
    >
      <Link href="/" className="flex items-center gap-2.5 px-2 pb-7">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-icon.png"
          alt=""
          aria-hidden="true"
          className="h-5 w-5 shrink-0"
        />
        <span className="font-display text-base font-extrabold tracking-tight text-cream">
          Sfera'Solys
        </span>
      </Link>

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
                      ? "bg-orange/15 text-cream"
                      : "text-cream/65 hover:bg-cream/5 hover:text-cream"
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
                      <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-cream/10 pl-4">
                        {link.subItems.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            aria-current={pathname === sub.href ? "page" : undefined}
                            className={`rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                              pathname === sub.href
                                ? "text-orange"
                                : "text-cream/55 hover:text-cream"
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
                  ? "bg-orange/15 text-cream"
                  : "text-cream/65 hover:bg-cream/5 hover:text-cream"
              }`}
            >
              <link.icon size={16} />
              <span className="flex-1">{link.label}</span>
              {link.pastille && compteurs[link.pastille] > 0 && (
                <span
                  className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-lime px-1 text-[10px] font-extrabold text-abyss"
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
          href="/paiement"
          className="mt-1 flex items-center gap-3 rounded-xl px-3 py-[11px] text-sm font-medium text-cream/65 transition-colors hover:bg-cream/5 hover:text-cream"
        >
          <Crown size={16} />
          <span>Premium</span>
        </Link>
      </nav>

      {/* chip utilisateur */}
      <div className="relative mt-2">
        <button
          type="button"
          onClick={() => setUserMenuOpen((current) => !current)}
          aria-expanded={userMenuOpen}
          className="flex w-full items-center gap-2.5 rounded-xl bg-cream/[0.04] px-3 py-2.5 text-left transition-colors hover:bg-cream/[0.07]"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange text-abyss">
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
            <div className="truncate text-[13px] font-semibold text-cream">
              {session?.user?.name || "mon compte"}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-lime">
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
              className="absolute bottom-full left-0 right-0 z-50 mb-2 rounded-2xl border border-cream/10 bg-abyss p-2 shadow-[0_18px_44px_-14px_rgba(0,0,0,0.5)]"
            >
              <Link
                href="/mon-compte"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-cream/70 transition-colors hover:bg-cream/5 hover:text-cream"
              >
                <User size={15} /> mon dossier
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-cream/55 transition-colors hover:bg-red-500/10 hover:text-red-400"
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
