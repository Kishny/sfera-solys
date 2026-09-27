'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Menu,
  X,
  User,
  ChevronDown,
  LogOut,
  Crown,
  Bell,
  Compass,
  Heart,
  Users2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { getPusherClient } from '@/lib/pusher-client';

/**
 * Header Sfera'Solys — nav publique, direction A (« dossier de vérification »).
 *
 * Restructuration (voir CLAUDE.md § Restructuration de l'architecture) :
 * cette nav ne sert plus qu'aux pages publiques (marketing). Une fois
 * connecté, les pages de l'espace membre migrent vers Sidebar.tsx, qui
 * reprend le pattern « sidebar » de la direction B. Ce header garde donc
 * un état « connecté » minimal, pour les pages pas encore migrées vers
 * le groupe de routes (app) — pas un système de nav complet en double.
 *
 * Ton visuel : sobre et institutionnel plutôt que festif — mega-menus
 * discrets, CTA en lien texte plutôt qu'en gros bouton plein, peu
 * d'éléments au premier niveau. Cf. maquette DirA-Home dans le canvas.
 *
 * Accessibilité des mega-menus (corrigé le 25/09/2026) : la première
 * version ne s'ouvrait qu'au survol — un `aria-expanded` était bien posé,
 * mais sans `onClick`, donc un utilisateur au clavier ne pouvait jamais
 * déplier les sous-menus. Ils s'ouvrent maintenant au survol ET au clic /
 * à la touche Entrée, se ferment avec Échap (en rendant le focus au
 * bouton) et au clic en dehors.
 */

type HeaderSubItem = {
  label: string;
  href: string;
  /** Courte phrase affichée sous le lien dans le mega-menu. */
  description: string;
};

type HeaderLink = {
  label: string;
  href?: string;
  subItems?: HeaderSubItem[];
  /** Accroche affichée dans la colonne de droite du mega-menu. */
  panelTitle?: string;
  panelText?: string;
  panelCta?: { label: string; href: string };
};

const links: HeaderLink[] = [
  {
    label: 'Découvrir',
    subItems: [
      {
        label: 'Accueil',
        href: '/',
        description: 'La promesse, en une page',
      },
      {
        label: 'Notre histoire',
        href: '/histoire',
        description: "Pourquoi Sfera'Solys existe",
      },
      {
        label: 'Nos valeurs',
        href: '/valeurs',
        description: 'Ce qu’on défend, ce qu’on refuse',
      },
      {
        label: 'Équipe',
        href: '/equipe',
        description: 'Qui vérifie les dossiers',
      },
    ],
    panelTitle: 'vérification immédiate',
    panelText:
      'Pièce d’identité et selfie en direct, vérifiés par Stripe Identity. Le résultat tombe dans la minute.',
    panelCta: { label: 'Constituer mon dossier', href: '/commencer' },
  },
  {
    label: 'Comment ça marche',
    subItems: [
      {
        label: 'Fonctionnalités',
        href: '/fonctionnalites',
        description: 'Circle of Six, annuaire, Mode Fantôme…',
      },
      {
        label: 'Guide débutant',
        href: '/guide',
        description: 'Réussir son profil et son premier message',
      },
      {
        label: 'Foire aux questions',
        href: '/faq',
        description: 'Vérification, confidentialité, résiliation',
      },
      {
        label: 'Commencer',
        href: '/commencer',
        description: 'Le parcours d’inscription en détail',
      },
    ],
    panelTitle: 'le parcours en 4 étapes',
    panelText:
      'Profil, vérification, affinités, première mise en relation encadrée.',
    panelCta: { label: 'Voir le parcours', href: '/commencer' },
  },
  { label: 'Communauté', href: '/temoignages' },
  { label: 'Tarifs', href: '/tarifs' },
];

/**
 * Identifiant stable et sans accent pour relier un bouton de nav au
 * panneau de mega-menu qu'il ouvre (`aria-labelledby`).
 */
function menuTriggerId(label: string): string {
  return `nav-${label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase()}`;
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDesktopGroup, setOpenDesktopGroup] = useState<string | null>(null);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const shouldReduceMotion = useReducedMotion();

  const isLoggedIn = status === 'authenticated' && !!session?.user;

  /**
   * Références sur les boutons de premier niveau : quand on ferme un
   * mega-menu avec Échap, le focus doit revenir sur le bouton qui l'a
   * ouvert, sinon l'utilisateur au clavier est perdu au début de la page.
   */
  const navRef = useRef<HTMLElement | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  /**
   * Échap ferme le mega-menu ouvert et le menu compte, et rend le focus.
   */
  useEffect(() => {
    if (!openDesktopGroup && !showUserDropdown) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      if (openDesktopGroup) {
        const trigger = triggerRefs.current[openDesktopGroup];
        setOpenDesktopGroup(null);
        trigger?.focus();
      }

      setShowUserDropdown(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openDesktopGroup, showUserDropdown]);

  /**
   * Un clic en dehors de la nav referme le mega-menu ouvert.
   */
  useEffect(() => {
    if (!openDesktopGroup) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpenDesktopGroup(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [openDesktopGroup]);

  /**
   * Lien d'évitement : on cible le premier `<main>` de la page plutôt qu'un
   * id, pour que ça marche aussi sur les pages pas encore migrées (elles
   * n'ont pas encore d'`id="contenu"`). Le href reste là comme repli si JS
   * ne tourne pas.
   */
  const handleSkipToContent = (
    event: React.MouseEvent<HTMLAnchorElement>
  ) => {
    const main = document.querySelector('main');
    if (!main) return;

    event.preventDefault();
    main.setAttribute('tabindex', '-1');
    (main as HTMLElement).focus();
    main.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth' });
  };

  /**
   * Légère ombre une fois qu'on a scrollé — le fond reste sombre en
   * permanence (plus de bascule clair/sombre comme avant).
   */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /**
   * On referme tout à chaque changement de route.
   */
  useEffect(() => {
    setOpen(false);
    setOpenMobileGroup(null);
    setOpenDesktopGroup(null);
    setShowUserDropdown(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  /**
   * Notifications : polling (30s) + temps réel via Pusher sur un
   * nouveau match. Identique à Sidebar.tsx pour garder un seul compteur
   * cohérent, que la page utilise le header ou la sidebar.
   */
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchNotifs = async () => {
      try {
        const res = await fetch('/api/notifications', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setNotifCount(data.total || 0);
      } catch {
        // On ignore volontairement l'erreur pour ne pas casser le header.
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

    channel.bind('new-match', () => {
      setNotifCount((prev) => prev + 1);
    });

    return () => {
      channel.unbind_all();
      client.unsubscribe(channelName);
    };
  }, [isLoggedIn, session?.user]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
    setShowUserDropdown(false);
    setOpen(false);
  };

  const toggleMobileGroup = (label: string) => {
    setOpenMobileGroup((current) => (current === label ? null : label));
  };

  const isLinkActive = (link: HeaderLink) =>
    pathname === link.href ||
    Boolean(link.subItems?.some((sub) => pathname === sub.href));

  const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss';

  const mobilePanelVariants = {
    closed: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : -18,
      transition: { duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeInOut' as const },
    },
    open: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.28,
        ease: 'easeOut' as const,
        staggerChildren: shouldReduceMotion ? 0 : 0.04,
        delayChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  const mobileItemVariants = {
    closed: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    open: { opacity: 1, y: 0 },
  };

  /** Entrée de nav dont le mega-menu est actuellement déplié. */
  const activeMegaMenu = links.find(
    (link) => link.label === openDesktopGroup && link.subItems
  );

  return (
    <>
      {/* Lien d'évitement : premier élément focusable de la page. */}
      <a
        href="#contenu"
        onClick={handleSkipToContent}
        className="fx-btn fixed left-3 top-3 z-[70] -translate-y-20 rounded-xl bg-orange px-4 py-2.5 text-sm font-bold text-abyss transition-transform focus:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream"
      >
        Aller au contenu
      </a>

      <header
        onMouseLeave={() => setOpenDesktopGroup(null)}
        className={`fixed left-0 right-0 top-0 z-50 border-b border-cream/8 bg-abyss/97 backdrop-blur-xl transition-shadow duration-300 ${
          scrolled ? 'shadow-[0_12px_34px_-18px_rgba(0,0,0,0.65)]' : ''
        }`}
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          {/*
            Hauteurs inchangées par rapport à l'ancien header (h-14 / h-16 /
            h-20) : toutes les autres pages compensent déjà le header fixe
            avec un pt-16 sm:pt-20. Tant qu'elles ne sont pas migrées, on
            ne touche pas à cette hauteur sous peine de passer sous le
            header de 4px partout.
          */}
          <div className="flex h-14 items-center justify-between sm:h-16 xl:h-20">
            {/* Logo + badge de confiance */}
            <div className="flex shrink-0 items-center">
              <Link
                href="/"
                className={`group flex items-center gap-2.5 rounded-lg ${focusRing}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-icon.png"
                  alt=""
                  aria-hidden="true"
                  className="h-7 w-7 shrink-0 sm:h-8 sm:w-8"
                />
                <span className="font-display text-base font-extrabold tracking-tight text-cream sm:text-lg">
                  Sfera'Solys
                </span>
              </Link>

              <div className="ml-4 hidden items-center gap-1.5 rounded-full border border-orange/25 bg-orange/[0.08] px-3 py-1 2xl:flex">
                <ShieldCheck size={12} className="text-orange" />
                <span className="whitespace-nowrap text-[11px] font-medium tracking-wide text-cream/75">
                  Hommes vérifiés 28+
                </span>
              </div>
            </div>

            {/*
              Nav desktop. Pas d'`overflow-hidden` ici : le panneau du
              mega-menu est rendu en dehors de cette nav (plus bas, en
              pleine largeur sous le header), justement pour ne pas être
              rogné — c'était la cause du bug de liens masqués en août.
            */}
            <nav
              ref={navRef}
              aria-label="Navigation principale"
              className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex"
            >
              {links.map((link) => {
                const active = isLinkActive(link);
                const key = link.label;

                if (link.subItems) {
                  const isGroupOpen = openDesktopGroup === key;

                  return (
                    <div key={key} className="relative">
                      <button
                        type="button"
                        id={menuTriggerId(key)}
                        ref={(node) => {
                          triggerRefs.current[key] = node;
                        }}
                        aria-expanded={isGroupOpen}
                        aria-haspopup="true"
                        onMouseEnter={() => setOpenDesktopGroup(key)}
                        onClick={() =>
                          setOpenDesktopGroup((current) =>
                            current === key ? null : key
                          )
                        }
                        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium transition-colors duration-200 ${focusRing} ${
                          active || isGroupOpen
                            ? 'text-orange'
                            : 'text-cream/75 hover:text-cream'
                        }`}
                      >
                        {link.label}
                        <ChevronDown
                          size={12}
                          className={`transition-transform duration-200 ${
                            isGroupOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-orange"
                        />
                      )}
                    </div>
                  );
                }

                return (
                  <div key={key} className="relative">
                    <Link
                      href={link.href as string}
                      aria-current={active ? 'page' : undefined}
                      onMouseEnter={() => setOpenDesktopGroup(null)}
                      className={`block shrink-0 rounded-full px-3 py-2 text-[13px] font-medium transition-colors duration-200 ${focusRing} ${
                        active ? 'text-orange' : 'text-cream/75 hover:text-cream'
                      }`}
                    >
                      {link.label}
                    </Link>

                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-orange"
                      />
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Actions desktop */}
            <div className="hidden shrink-0 items-center gap-6 xl:flex">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/explorer"
                    className={`flex items-center gap-1.5 text-[13px] font-medium text-cream/75 transition-colors hover:text-cream ${focusRing}`}
                  >
                    <Compass size={15} className="text-orange" />
                    mon espace
                  </Link>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown((current) => !current);
                        setNotifCount(0);
                      }}
                      aria-expanded={showUserDropdown}
                      className={`relative flex h-9 w-9 items-center justify-center rounded-full border border-cream/15 text-cream/80 transition-colors hover:border-orange/40 hover:text-cream ${focusRing}`}
                      aria-label="Mon compte"
                    >
                      {session?.user?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={session.user.image}
                          alt=""
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <User size={16} />
                      )}

                      {notifCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-lime px-1 text-[10px] font-extrabold leading-none text-abyss">
                          {notifCount > 9 ? '9+' : notifCount}
                        </span>
                      )}
                    </button>

                    <AnimatePresence>
                      {showUserDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: shouldReduceMotion ? 0 : 0.16 }}
                          className="absolute right-0 top-full z-50 mt-2 min-w-[210px] rounded-2xl border border-cream/10 bg-[#0C222D] p-2 shadow-[0_18px_44px_-14px_rgba(0,0,0,0.55)]"
                        >
                          <div className="mb-1 border-b border-cream/10 px-3 py-2">
                            <p className="truncate text-xs font-semibold text-cream/60">
                              {session?.user?.email}
                            </p>
                          </div>

                          <Link
                            href="/mon-compte"
                            onClick={() => setShowUserDropdown(false)}
                            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-cream/75 transition-colors hover:bg-cream/5 hover:text-cream ${focusRing}`}
                          >
                            <User size={15} />
                            mon dossier
                          </Link>

                          <Link
                            href="/mon-compte?tab=premium"
                            onClick={() => setShowUserDropdown(false)}
                            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-cream/75 transition-colors hover:bg-cream/5 hover:text-cream ${focusRing}`}
                          >
                            <Crown size={15} />
                            premium
                          </Link>

                          <div className="my-1 h-px bg-cream/10" />

                          <button
                            type="button"
                            onClick={handleLogout}
                            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-cream/55 transition-colors hover:bg-red-500/10 hover:text-red-400 ${focusRing}`}
                          >
                            <LogOut size={15} />
                            déconnexion
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/auth?mode=login"
                    className={`text-[13px] font-medium text-cream/65 transition-colors hover:text-cream ${focusRing}`}
                  >
                    se connecter
                  </Link>

                  <Link
                    href="/auth?mode=register"
                    className={`fx-link flex items-center gap-1.5 rounded-lg text-[13px] font-bold text-orange transition-colors hover:text-orange/80 ${focusRing}`}
                  >
                    rejoindre
                    <ArrowRight size={14} />
                  </Link>
                </>
              )}
            </div>

            {/* Actions mobile */}
            <div className="flex items-center gap-1.5 xl:hidden">
              <button
                type="button"
                onClick={() =>
                  router.push(isLoggedIn ? '/mon-compte' : '/auth?mode=login')
                }
                className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-cream/15 text-cream/80 transition-colors hover:border-orange/40 ${focusRing}`}
                aria-label={isLoggedIn ? 'Mon compte' : 'Connexion'}
              >
                {isLoggedIn && session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <User size={18} />
                )}

                {isLoggedIn && notifCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-lime px-1 text-[9px] font-extrabold text-abyss">
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className={`relative z-[60] flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${focusRing} ${
                  open
                    ? 'border-orange/40 bg-orange/10 text-orange'
                    : 'border-cream/15 text-cream/80'
                }`}
                aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
              >
                <AnimatePresence mode="wait">
                  {open ? (
                    <motion.span
                      key="close"
                      initial={{ opacity: 0, rotate: shouldReduceMotion ? 0 : -70 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: shouldReduceMotion ? 0 : 70 }}
                    >
                      <X size={20} />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="menu"
                      initial={{ opacity: 0, rotate: shouldReduceMotion ? 0 : 70 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: shouldReduceMotion ? 0 : -70 }}
                    >
                      <Menu size={20} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>

        {/*
          Panneau du mega-menu, en pleine largeur sous le header. Rendu ici,
          en dehors de la nav, pour deux raisons : il n'est pas rogné par le
          conteneur de la nav, et il donne l'allure « institutionnelle »
          voulue par la direction A plutôt qu'une petite liste flottante.
        */}
        <AnimatePresence>
          {activeMegaMenu && (
            <motion.div
              key={activeMegaMenu.label}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: 'easeOut' }}
              aria-labelledby={menuTriggerId(activeMegaMenu.label)}
              className="absolute inset-x-0 top-full hidden border-b border-cream/10 bg-[#0C222D] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7)] xl:block"
            >
              <div className="mx-auto max-w-7xl px-8 py-7">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <ul className="grid gap-1 sm:grid-cols-2">
                    {activeMegaMenu.subItems?.map((sub) => {
                      const subActive = pathname === sub.href;

                      return (
                        <li key={sub.href}>
                          <Link
                            href={sub.href}
                            aria-current={subActive ? 'page' : undefined}
                            onClick={() => setOpenDesktopGroup(null)}
                            className={`block rounded-xl px-3 py-2.5 transition-colors ${focusRing} ${
                              subActive
                                ? 'bg-orange/[0.08] text-orange'
                                : 'text-cream hover:bg-cream/5'
                            }`}
                          >
                            <span className="block text-sm font-semibold">
                              {sub.label}
                            </span>
                            <span
                              className={
                                subActive
                                  ? 'mt-0.5 block text-[12px] leading-snug text-orange/70'
                                  : 'mt-0.5 block text-[12px] leading-snug text-cream/55'
                              }
                            >
                              {sub.description}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>

                  {activeMegaMenu.panelTitle && (
                    <div className="lg:border-l lg:border-cream/8 lg:pl-7">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-lime">
                        <ShieldCheck size={12} />
                        {activeMegaMenu.panelTitle}
                      </p>

                      <p className="mt-2 text-[13px] leading-relaxed text-cream/60">
                        {activeMegaMenu.panelText}
                      </p>

                      {activeMegaMenu.panelCta && (
                        <Link
                          href={activeMegaMenu.panelCta.href}
                          onClick={() => setOpenDesktopGroup(null)}
                          className={`fx-link mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-orange transition-colors hover:text-orange/80 ${focusRing}`}
                        >
                          {activeMegaMenu.panelCta.label}
                          <ArrowRight size={14} />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Panneau mobile */}
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-abyss/70 backdrop-blur-sm xl:hidden"
              aria-label="Fermer le menu"
            />

            <motion.div
              variants={mobilePanelVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed left-3 right-3 top-[4.15rem] z-50 max-h-[calc(100dvh-5rem)] overflow-hidden rounded-[1.75rem] border border-cream/10 bg-[#0C222D] shadow-[0_24px_80px_rgba(0,0,0,0.5)] xl:hidden"
            >
              <div className="max-h-[calc(100dvh-5rem)] overflow-y-auto p-3">
                {/* Carte identité */}
                <motion.div
                  variants={mobileItemVariants}
                  className="mb-3 rounded-[1.25rem] border border-cream/10 bg-abyss/60 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange text-abyss">
                      {isLoggedIn && session?.user?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={session.user.image}
                          alt=""
                          className="h-full w-full rounded-2xl object-cover"
                        />
                      ) : (
                        <User size={20} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-cream">
                        {isLoggedIn
                          ? session?.user?.name || 'mon espace'
                          : "bienvenue sur Sfera'Solys"}
                      </p>
                      <p className="truncate text-xs text-cream/55">
                        {isLoggedIn
                          ? session?.user?.email
                          : 'une communauté vérifiée, dossier par dossier'}
                      </p>
                    </div>

                    {isLoggedIn && notifCount > 0 && (
                      <div className="flex items-center gap-1 rounded-full bg-lime px-2 py-1 text-[10px] font-bold text-abyss">
                        <Bell size={11} />
                        {notifCount > 9 ? '9+' : notifCount}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Accès rapides */}
                <motion.div
                  variants={mobileItemVariants}
                  className="mb-3 grid grid-cols-3 gap-2"
                >
                  {[
                    { label: 'Accueil', href: '/', icon: <ShieldCheck size={16} /> },
                    { label: 'Explorer', href: '/explorer', icon: <Compass size={16} /> },
                    {
                      label: isLoggedIn ? 'matches' : 'inscription',
                      href: isLoggedIn ? '/matches' : '/auth?mode=register',
                      icon: isLoggedIn ? <Heart size={16} /> : <Users2 size={16} />,
                    },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`fx-ghost flex flex-col items-center justify-center gap-1 rounded-2xl border border-cream/10 bg-abyss/40 px-2 py-2.5 text-cream/80 transition hover:border-orange/30 ${focusRing}`}
                    >
                      {item.icon}
                      <span className="text-[10px] font-semibold">{item.label}</span>
                    </Link>
                  ))}
                </motion.div>

                {/* Nav accordéon */}
                <div className="space-y-1.5">
                  {links.map((link) => {
                    const key = link.label;
                    const active = isLinkActive(link);

                    if (link.subItems) {
                      const isOpen = openMobileGroup === key;
                      return (
                        <motion.div
                          key={key}
                          variants={mobileItemVariants}
                          className={`overflow-hidden rounded-2xl border ${
                            active ? 'border-orange/25 bg-orange/[0.06]' : 'border-cream/8 bg-abyss/30'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleMobileGroup(key)}
                            aria-expanded={isOpen}
                            className={`fx-link flex w-full items-center justify-between px-3.5 py-3 text-left text-sm font-semibold ${focusRing} ${
                              active ? 'text-orange' : 'text-cream/85'
                            }`}
                          >
                            {link.label}
                            <ChevronDown
                              size={16}
                              className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            />
                          </button>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="space-y-0.5 border-t border-cream/8 px-3 pb-3 pt-2">
                                  {link.subItems.map((sub) => (
                                    <Link
                                      key={sub.href}
                                      href={sub.href}
                                      onClick={() => setOpen(false)}
                                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] text-cream/60 transition hover:bg-cream/5 hover:text-cream ${focusRing}`}
                                    >
                                      <span className="h-1.5 w-1.5 rounded-full bg-orange" />
                                      {sub.label}
                                    </Link>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    }

                    return (
                      <motion.div key={key} variants={mobileItemVariants}>
                        <Link
                          href={link.href as string}
                          onClick={() => setOpen(false)}
                          className={`flex items-center rounded-2xl border px-3.5 py-3 text-sm font-semibold transition ${focusRing} ${
                            active
                              ? 'border-orange/25 bg-orange/[0.06] text-orange'
                              : 'border-cream/8 bg-abyss/30 text-cream/85 hover:border-cream/20'
                          }`}
                        >
                          {link.label}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Actions */}
                <motion.div
                  variants={mobileItemVariants}
                  className="mt-3 border-t border-cream/8 pt-3"
                >
                  {isLoggedIn ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          router.push('/mon-compte');
                          setOpen(false);
                        }}
                        className={`fx-btn flex items-center justify-center gap-2 rounded-2xl bg-orange px-4 py-3 text-sm font-bold text-abyss ${focusRing}`}
                      >
                        <User size={16} />
                        mon compte
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className={`flex items-center justify-center gap-2 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400 ${focusRing}`}
                      >
                        <LogOut size={16} />
                        quitter
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2">
                      <Link
                        href="/auth?mode=login"
                        onClick={() => setOpen(false)}
                        className={`fx-ghost flex items-center justify-center gap-2 rounded-2xl border border-cream/15 px-4 py-3 text-sm font-bold text-cream/85 ${focusRing}`}
                      >
                        se connecter
                      </Link>

                      <Link
                        href="/auth?mode=register"
                        onClick={() => setOpen(false)}
                        className={`fx-btn flex items-center justify-center gap-2 rounded-2xl bg-orange px-4 py-3 text-sm font-bold text-abyss ${focusRing}`}
                      >
                        rejoindre <ArrowRight size={15} />
                      </Link>
                    </div>
                  )}
                </motion.div>

                <motion.p
                  variants={mobileItemVariants}
                  className="mt-3 text-center text-[10px] text-cream/55"
                >
                  Sfera'Solys · vérification immédiate · hommes 28+
                </motion.p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Retour en haut */}
      <motion.div
        className="fixed bottom-5 right-4 z-40 lg:hidden"
        animate={{ y: scrolled ? 0 : 90, opacity: scrolled ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      >
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`flex h-11 w-11 items-center justify-center rounded-full bg-orange text-abyss shadow-lg ${focusRing}`}
          aria-label="Remonter en haut"
        >
          <ChevronDown size={20} className="rotate-180" />
        </button>
      </motion.div>
    </>
  );
}
