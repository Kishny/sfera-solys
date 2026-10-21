// src/components/espace/BarreOngletsMobile.tsx

"use client";

/**
 * Barre d'onglets de l'espace membre, sous 1024 px.
 *
 * La barre latérale est en `hidden lg:flex` et le gabarit `(app)` ne
 * proposait rien d'autre : en dessous de 1024 px, un membre connecté
 * n'avait plus aucun moyen de passer d'Explorer à Matches ou aux
 * Messages autrement qu'en tapant l'URL. Sur un site de rencontre,
 * c'est la majorité du trafic.
 *
 * Quatre destinations tiennent dans la barre ; les cinq pages de
 * « Cercle & communauté », l'abonnement, le retour au site public et la
 * déconnexion vivent derrière « Plus ». Rien de ce qu'offre la barre
 * latérale n'est perdu en chemin — une barre mobile amputée obligerait
 * à sortir de l'application pour y revenir.
 *
 * Les compteurs viennent du contexte partagé : cette barre et la barre
 * latérale sont montées en même temps, et deux sondages pour le même
 * chiffre seraient deux fois trop.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  Compass,
  Crown,
  EyeOff,
  Globe,
  Heart,
  HeartHandshake,
  Home,
  LogOut,
  MessageCircle,
  Menu,
  Sparkles,
  Users2,
  X,
} from "lucide-react";

import { useCompteurs, type Compteurs } from "./CompteursEspace";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70 focus-visible:ring-offset-2 focus-visible:ring-offset-nuit";

type Onglet = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  pastille?: keyof Compteurs;
};

/** Les quatre destinations de la barre. Même ordre que la barre latérale. */
const ONGLETS: Onglet[] = [
  { href: "/mon-compte", label: "Accueil", icon: Home },
  { href: "/explorer", label: "Explorer", icon: Compass },
  { href: "/matches", label: "Matches", icon: Heart, pastille: "matches" },
  {
    href: "/messages",
    label: "Messages",
    icon: MessageCircle,
    pastille: "messages",
  },
];

/** Ce que « Plus » déplie : le sous-menu de la barre latérale, intégralement. */
const SECONDAIRES = [
  { href: "/circle", label: "Circle of Six", icon: Sparkles },
  { href: "/entraide", label: "Entraide", icon: HeartHandshake },
  { href: "/mode-fantome", label: "Mode fantôme", icon: EyeOff },
  { href: "/evenements", label: "Événements", icon: CalendarDays },
  { href: "/communaute", label: "Communauté", icon: Users2 },
];

/** Libellé lisible d'une pastille, pour les lecteurs d'écran. */
function libellePastille(cle: keyof Compteurs, valeur: number): string {
  if (cle === "messages") {
    return `${valeur} message${valeur > 1 ? "s" : ""} non lu${valeur > 1 ? "s" : ""}`;
  }
  return `${valeur} nouvelle${valeur > 1 ? "s" : ""} mise${valeur > 1 ? "s" : ""} en relation`;
}

export default function BarreOngletsMobile() {
  const pathname = usePathname();
  const router = useRouter();
  const compteurs = useCompteurs();
  const reduitLesAnimations = useReducedMotion();

  const [plusOuvert, setPlusOuvert] = useState(false);
  const declencheur = useRef<HTMLButtonElement>(null);
  const panneau = useRef<HTMLDivElement>(null);

  /** Le panneau se referme au changement de page. */
  useEffect(() => {
    setPlusOuvert(false);
  }, [pathname]);

  /** Échap referme et rend le focus au bouton, comme les menus de l'en-tête. */
  useEffect(() => {
    if (!plusOuvert) return;

    const auClavier = (evenement: KeyboardEvent) => {
      if (evenement.key === "Escape") {
        setPlusOuvert(false);
        declencheur.current?.focus();
      }
    };

    const auClic = (evenement: MouseEvent) => {
      const cible = evenement.target as Node;
      if (
        !panneau.current?.contains(cible) &&
        !declencheur.current?.contains(cible)
      ) {
        setPlusOuvert(false);
      }
    };

    document.addEventListener("keydown", auClavier);
    document.addEventListener("mousedown", auClic);

    return () => {
      document.removeEventListener("keydown", auClavier);
      document.removeEventListener("mousedown", auClic);
    };
  }, [plusOuvert]);

  const deconnexion = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const sousMenuActif = SECONDAIRES.some((item) => pathname === item.href);

  return (
    <>
      <AnimatePresence>
        {plusOuvert && (
          <motion.div
            ref={panneau}
            id="panneau-plus"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: reduitLesAnimations ? 0 : 0.18 }}
            className="fixed inset-x-0 bottom-[calc(68px+env(safe-area-inset-bottom))] z-50 mx-3 rounded-2xl border border-champagne/12 bg-minuit p-2 shadow-[0_-18px_44px_-14px_rgba(0,0,0,0.6)] lg:hidden"
          >
            {SECONDAIRES.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${focusRing} ${
                  pathname === item.href
                    ? "bg-cuivre/15 text-champagne"
                    : "text-champagne/70 hover:bg-champagne/5 hover:text-champagne"
                }`}
              >
                <item.icon size={16} className="shrink-0 text-cuivre" />
                {item.label}
              </Link>
            ))}

            <span aria-hidden="true" className="my-2 block h-px bg-champagne/10" />

            <Link
              href="/mon-compte?tab=premium"
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-champagne/70 transition-colors hover:bg-champagne/5 hover:text-champagne ${focusRing}`}
            >
              <Crown size={16} className="shrink-0 text-cuivre" />
              Abonnement
            </Link>

            <Link
              href="/"
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-champagne/70 transition-colors hover:bg-champagne/5 hover:text-champagne ${focusRing}`}
            >
              <Globe size={16} className="shrink-0 text-cuivre" />
              Retour au site
            </Link>

            <button
              type="button"
              onClick={deconnexion}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-champagne/55 transition-colors hover:bg-erreur/10 hover:text-erreur ${focusRing}`}
            >
              <LogOut size={16} className="shrink-0" />
              Déconnexion
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <nav
        aria-label="Navigation de l’espace membre"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-champagne/10 bg-nuit/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {ONGLETS.map((onglet) => {
            const actif = pathname === onglet.href;
            const valeur = onglet.pastille ? compteurs[onglet.pastille] : 0;

            return (
              <li key={onglet.href}>
                <Link
                  href={onglet.href}
                  aria-current={actif ? "page" : undefined}
                  className={`relative flex h-[68px] flex-col items-center justify-center gap-1 text-[10.5px] font-semibold transition-colors ${focusRing} ${
                    actif ? "text-cuivre" : "text-champagne/60"
                  }`}
                >
                  <span className="relative">
                    <onglet.icon size={20} />

                    {onglet.pastille && valeur > 0 && (
                      <span
                        aria-label={libellePastille(onglet.pastille, valeur)}
                        className="absolute -right-2 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-succes px-1 text-[9.5px] font-extrabold text-nuit"
                      >
                        {valeur > 9 ? "9+" : valeur}
                      </span>
                    )}
                  </span>

                  {onglet.label}

                  {actif && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-5 top-0 h-px bg-degrade-cuivre"
                    />
                  )}
                </Link>
              </li>
            );
          })}

          <li>
            <button
              ref={declencheur}
              type="button"
              aria-expanded={plusOuvert}
              aria-controls="panneau-plus"
              onClick={() => setPlusOuvert((ouvert) => !ouvert)}
              className={`relative flex h-[68px] w-full flex-col items-center justify-center gap-1 text-[10.5px] font-semibold transition-colors ${focusRing} ${
                plusOuvert || sousMenuActif ? "text-cuivre" : "text-champagne/60"
              }`}
            >
              {plusOuvert ? <X size={20} /> : <Menu size={20} />}
              Plus

              {sousMenuActif && !plusOuvert && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-5 top-0 h-px bg-degrade-cuivre"
                />
              )}
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
