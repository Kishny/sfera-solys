'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronDown,
  Compass,
  EyeOff,
  Flag,
  Ghost,
  GraduationCap,
  Lightbulb,
  Lock,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HexagonSix from '@/components/icons/HexagonSix';

/**
 * Page Fonctionnalités Sfera'Solys — direction A (« dossier de vérification »).
 *
 * Restructuration + rebranding (voir CLAUDE.md § Restructuration) :
 * cette page était restée intégralement celle du site d'origine — un
 * dégradé différent par fonctionnalité, des orbes animées, des mockups en
 * emojis, une marque et une cible non corrigées, et une copy rédigée au
 * féminin (« Sois guidée », « Rejoins celles qui... »).
 *
 * Elle prend aussi du galon : la grille des 6 fonctionnalités a été
 * retirée de la home, donc /fonctionnalites est désormais LE point de
 * découverte du produit. La page se lit de haut en bas comme un sommaire :
 * les 8 fonctionnalités, la façon dont elles s'enchaînent, le socle
 * commun, quelques chiffres, les questions qui reviennent.
 *
 * Ce qui ne change pas : les 8 fonctionnalités, leurs titres, leurs
 * descriptions, leurs bénéfices, leurs destinations, et le chargement des
 * statistiques via /api/stats. Aucune fonctionnalité n'est annoncée comme
 * « à venir » : les 7 routes liées existent, et « Sécurité totale » n'a
 * volontairement pas de page dédiée (/securite n'existe pas).
 */

interface SiteStats {
  membres: number;
  matchs: number;
  messages: number;
  evenements: number;
}

interface FeatureItem {
  id: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  title: string;
  description: string;
  details: string;
  benefits: string[];
  /** Absent = pas de page dédiée, la carte reste non cliquable. */
  link?: string;
  /** Fonctionnalité de tête, mise en avant comme l'offre recommandée des tarifs. */
  featured?: boolean;
}

/**
 * Formate les statistiques pour éviter les gros chiffres bruts.
 * 1200 -> 1.2K+ · 1000 -> 1K+ · 0 -> —
 */
function formatStat(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}K+`;
  if (n === 0) return '—';
  return n.toString();
}

/** Anneau de focus clavier, identique partout dans la direction A. */
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss';

const features: FeatureItem[] = [
  {
    id: 'circle',
    // Icône maison de la marque, pas une icône générique : le Circle of Six
    // est la fonctionnalité signature, elle garde son hexagone.
    icon: HexagonSix,
    title: 'Circle of Six',
    description: 'Des liens choisis, pas des milliers de swipes.',
    details:
      "Chaque semaine, notre algorithme te présente 6 profils qui correspondent à tes valeurs et à tes intérêts. Une approche qualitative pour des rencontres plus authentiques.",
    benefits: [
      '6 profils par semaine',
      'Compatibilité optimisée',
      'Moins de fatigue du swipe',
    ],
    link: '/circle',
    featured: true,
  },
  {
    id: 'ghost',
    icon: Ghost,
    title: 'Mode Fantôme',
    description: 'Discrétion assurée, photos floutées, pseudonymes.',
    details:
      'Protège ton intimité avec des photos floutées et un pseudonyme. Tu décides quand et à qui révéler ton identité.',
    benefits: ['Contrôle total', 'Anonymat renforcé', 'Activation rapide'],
    link: '/mode-fantome',
  },
  {
    id: 'vibesphere',
    icon: Compass,
    title: 'VibeSphere',
    description: 'Exprime ta vibe dans ton espace personnalisé.',
    details:
      "Crée ton univers digital avec des playlists personnalisées, un journal émotionnel et des avatars d'humeur.",
    benefits: [
      'Journal émotionnel',
      'Playlists personnalisées',
      "Avatars d'humeur",
    ],
    link: '/vibesphere',
  },
  {
    id: 'vibeplanner',
    icon: Lightbulb,
    title: 'VibePlanner',
    description: 'Des idées de rendez-vous qui vous rassemblent, toi et l’autre.',
    details:
      "Plus jamais de « On fait quoi ? ». Des suggestions créatives basées sur vos intérêts communs à tous les deux.",
    benefits: ['Idées personnalisées', 'Adapté aux budgets', 'Planning intégré'],
    link: '/vibeplanner',
  },
  {
    id: 'events',
    icon: CalendarDays,
    title: 'Événements Solys',
    description: 'Participe à des moments inoubliables.',
    details:
      "Rejoins la communauté lors d'événements exclusifs, en ligne et en présentiel.",
    benefits: [
      'Événements mensuels',
      'Communauté bienveillante',
      'Rencontres organisées',
    ],
    link: '/evenements',
  },
  {
    id: 'coaching',
    icon: GraduationCap,
    title: 'VibeMentor',
    description: 'Sois accompagné avec exigence et bienveillance.',
    details:
      'Accompagnement personnalisé pour naviguer dans tes relations et ton développement personnel.',
    benefits: [
      'Coaching individuel',
      'Ateliers thématiques',
      'Ressources exclusives',
    ],
    link: '/vibementor',
  },
  {
    id: 'security',
    icon: ShieldCheck,
    title: 'Sécurité totale',
    description: 'Un espace protégé et bienveillant.',
    details:
      'Modération, données protégées et outils de contrôle pour ton bien-être numérique. Rien à activer : ce socle est appliqué à tous les comptes, dès la vérification.',
    benefits: ['Modération active', 'Données protégées', 'Signalement rapide'],
  },
  {
    id: 'community',
    icon: MessageCircle,
    title: 'Communauté Solys',
    description: 'Rejoins un réseau bienveillant de membres vérifiés.',
    details:
      'Échange, partage et avance avec une communauté qui te comprend et te soutient.',
    benefits: [
      'Groupes thématiques',
      'Forum bienveillant',
      'Support entre membres',
    ],
    link: '/communaute',
  },
];

/** Les 3 temps du parcours, pour relier les fonctionnalités entre elles. */
const journey = [
  {
    dot: 'orange' as const,
    title: 'Découvrir',
    description:
      'Le Circle of Six te propose 6 profils par semaine, et la VibeSphere dit qui tu es sans que tu aies à te vendre.',
  },
  {
    dot: 'lime' as const,
    title: 'Échanger',
    description:
      "Le Mode Fantôme protège ton intimité le temps de la mise en confiance ; le VibePlanner règle le « on fait quoi ? » avant qu'il se pose.",
  },
  {
    dot: 'orange' as const,
    title: 'Se rencontrer',
    description:
      "Les Événements Solys et la Communauté Solys sortent la rencontre de l'écran, avec un cadre clair et des membres vérifiés.",
  },
];

/** Socle commun : ce qui s'applique à toutes les fonctionnalités. */
const foundations = [
  { icon: BadgeCheck, label: 'Identité vérifiée par document officiel' },
  { icon: Lock, label: 'Données sécurisées (RGPD)' },
  { icon: EyeOff, label: 'Tu décides ce que tu montres' },
  { icon: Flag, label: 'Signalement traité par un humain' },
];

const notes = [
  {
    question: 'Faut-il payer pour accéder aux fonctionnalités ?',
    answer:
      "La vérification d'identité, le profil, la messagerie de base, la VibeSphere et la Communauté Solys sont accessibles dès l'offre gratuite. Le Circle of Six hebdomadaire, le VibePlanner et le Mode Fantôme dépendent de l'offre choisie : le détail est sur la page Tarifs.",
  },
  {
    question: 'Le Mode Fantôme gêne-t-il la vérification ?',
    answer:
      "Non. La vérification a lieu une seule fois, à l'inscription, et elle porte sur ton dossier. Le Mode Fantôme agit ensuite sur ce que voient les autres membres, pas sur ton statut de profil vérifié.",
  },
  {
    question: 'Puis-je rester sur la communauté sans chercher de rencontre ?',
    answer:
      "Oui. Rien ne t'oblige à activer le Circle of Six. Une partie des membres commence par la Communauté Solys et les événements, puis avance à son rythme.",
  },
];

export default function FonctionnalitesPage() {
  /**
   * Sur mobile, le détail de chaque fonctionnalité est replié pour que les
   * 8 cartes restent parcourables au pouce. À partir de `sm`, tout est
   * affiché en permanence (même logique que les offres de la page Tarifs).
   */
  const [openFeature, setOpenFeature] = useState<string | null>('circle');
  const [openNoteIndex, setOpenNoteIndex] = useState<number | null>(0);
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);
  const shouldReduceMotion = useReducedMotion();

  /**
   * Statistiques dynamiques — même source que l'ancienne version, on garde
   * la fonctionnalité et on change ce qu'on en fait : une bande de chiffres
   * sobres au lieu de quatre tuiles animées à emojis.
   */
  useEffect(() => {
    fetch('/api/stats')
      .then((response) => response.json())
      .then((data) => {
        if (data.success) setSiteStats(data.stats);
      })
      .catch(() => {});
  }, []);

  const stats = [
    { value: siteStats ? formatStat(siteStats.membres) : '…', label: 'Profils vérifiés' },
    { value: siteStats ? formatStat(siteStats.matchs) : '…', label: 'Mises en relation' },
    {
      value: siteStats ? formatStat(siteStats.messages) : '…',
      label: 'Messages échangés',
    },
    {
      value: siteStats ? formatStat(siteStats.evenements) : '…',
      label: 'Événements organisés',
    },
  ];

  const fadeUp = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0 : 0.5, ease: 'easeOut' as const },
  };

  return (
    <>
      <Header />

      <main id="contenu" className="bg-abyss text-cream">
        {/* Hero */}
        <section className="border-b border-cream/8 px-4 pt-20 sm:px-6 sm:pt-24 lg:px-16 xl:pt-28">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl py-12 text-center sm:py-16">
            <span className="inline-block rounded-full border border-orange/35 bg-orange/[0.12] px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-orange">
              8 fonctionnalités · vérification incluse
            </span>

            <h1 className="font-display [font-stretch:125%] mt-5 text-[30px] font-extrabold leading-[1.15] tracking-tight text-cream sm:text-[40px]">
              Tout ce que fait Sfera&apos;Solys.
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-cream/60 sm:text-base">
              Chaque fonctionnalité répond à un moment précis : découvrir des
              profils, te protéger, échanger, puis rencontrer. Rien de
              décoratif, et rien qui se cache derrière un abonnement sans le
              dire.
            </p>

            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/commencer"
                className={`fx-btn rounded-xl bg-orange px-7 py-3.5 text-sm font-bold text-abyss transition-colors hover:bg-orange/90 ${focusRing}`}
              >
                constituer mon dossier
              </Link>

              <Link
                href="/tarifs"
                className={`fx-link inline-flex items-center gap-1.5 text-[13px] font-semibold text-orange transition-colors hover:text-orange/80 ${focusRing}`}
              >
                voir ce qui est inclus par offre
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Les 8 fonctionnalités */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-display [font-stretch:125%] mb-2 text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
              Les fonctionnalités
            </h2>

            <p className="mb-8 max-w-xl text-[15px] leading-relaxed text-cream/60">
              Toutes sont pensées pour des hommes de 28 ans et plus, et ne
              fonctionnent qu&apos;entre profils vérifiés.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                const isOpen = openFeature === feature.id;

                return (
                  <div
                    key={feature.id}
                    className={`relative flex flex-col rounded-2xl border p-5 sm:p-6 ${
                      feature.featured
                        ? 'border-orange/40 bg-[#0C222D] ring-1 ring-orange/20'
                        : 'border-cream/8 bg-[#0C222D]'
                    }`}
                  >
                    <Icon
                      size={22}
                      className={feature.featured ? 'text-orange' : 'text-cream/55'}
                    />

                    <h3 className="font-display [font-stretch:125%] mt-3 text-[17px] font-extrabold text-cream">
                      {feature.title}
                    </h3>

                    <p className="mt-1 text-[13px] leading-relaxed text-cream/55">
                      {feature.description}
                    </p>

                    {/* Bouton de dépli, mobile uniquement */}
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFeature((current) =>
                          current === feature.id ? null : feature.id
                        )
                      }
                      aria-expanded={isOpen}
                      className={`mt-4 flex items-center justify-between border-t border-cream/8 pt-3 text-[13px] font-semibold text-cream/70 sm:hidden ${focusRing}`}
                    >
                      {isOpen ? 'masquer le détail' : 'voir le détail'}
                      <ChevronDown
                        size={15}
                        className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    <div
                      className={`flex-1 border-cream/8 sm:mt-4 sm:block sm:border-t sm:pt-4 ${
                        isOpen ? 'mt-4 block' : 'hidden'
                      }`}
                    >
                      <p className="text-[13px] leading-relaxed text-cream/70">
                        {feature.details}
                      </p>

                      <ul className="mt-3 space-y-2">
                        {feature.benefits.map((benefit) => (
                          <li key={benefit} className="flex items-start gap-2">
                            <Check
                              size={14}
                              className={`mt-[3px] shrink-0 ${
                                feature.featured ? 'text-orange' : 'text-lime'
                              }`}
                            />
                            <span className="text-[13px] leading-relaxed text-cream/70">
                              {benefit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {feature.link ? (
                      <Link
                        href={feature.link}
                        className={`fx-link mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-orange transition-colors hover:text-orange/80 ${focusRing}`}
                      >
                        découvrir
                        <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <p className="mt-5 text-[13px] text-cream/55">
                        Incluse partout, sans réglage.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Comment elles s'enchaînent */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display [font-stretch:125%] mb-10 text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
              Comment elles s&apos;enchaînent
            </h2>

            <ol className="flex flex-col">
              {journey.map((step, i) => (
                <li key={step.title} className="flex gap-5">
                  <div className="flex shrink-0 flex-col items-center">
                    <span
                      className={`font-display flex h-10 w-10 items-center justify-center rounded-full text-[15px] font-extrabold ${
                        step.dot === 'orange'
                          ? 'bg-orange text-abyss'
                          : 'bg-lime text-abyss'
                      }`}
                    >
                      {i + 1}
                    </span>
                    {i < journey.length - 1 && (
                      <span className="my-1.5 w-[2px] flex-1 bg-lime/35" />
                    )}
                  </div>

                  <div className={i < journey.length - 1 ? 'pb-10' : ''}>
                    <h3 className="font-display [font-stretch:125%] mb-1.5 text-[17px] font-bold text-cream">
                      {step.title}
                    </h3>
                    <p className="max-w-md text-sm leading-relaxed text-cream/60">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Socle commun */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-display [font-stretch:125%] mb-2 text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
              Le socle commun
            </h2>

            <p className="mb-8 max-w-xl text-[15px] leading-relaxed text-cream/60">
              Ces quatre règles ne dépendent d&apos;aucune fonctionnalité ni
              d&apos;aucune offre. Elles s&apos;appliquent à tous les comptes,
              dès la validation du dossier.
            </p>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {foundations.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col gap-2.5 rounded-2xl border border-cream/8 bg-[#0C222D] p-4 sm:p-[18px]"
                >
                  <Icon size={18} className="text-orange" />
                  <span className="text-[13px] font-semibold text-cream">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Chiffres */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-display [font-stretch:125%] mb-8 text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
              Sfera&apos;Solys en chiffres
            </h2>

            <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-cream/8 bg-[#0C222D] p-4 sm:p-[18px]"
                >
                  <dd className="font-display text-[26px] font-extrabold leading-none text-cream sm:text-[30px]">
                    {stat.value}
                  </dd>
                  <dt className="mt-2 text-[13px] text-cream/55">{stat.label}</dt>
                </div>
              ))}
            </dl>

            <p className="mt-6 text-[13px] text-cream/55">
              Chiffres mis à jour en continu depuis la plateforme. Un tiret
              signifie qu&apos;un compteur n&apos;a pas encore démarré.
            </p>
          </div>
        </section>

        {/* Bon à savoir */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display [font-stretch:125%] mb-8 text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
              Bon à savoir
            </h2>

            <div className="space-y-1.5">
              {notes.map((note, index) => {
                const isOpen = openNoteIndex === index;

                return (
                  <div
                    key={note.question}
                    className="overflow-hidden rounded-2xl border border-cream/8 bg-[#0C222D]"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenNoteIndex((current) => (current === index ? null : index))
                      }
                      aria-expanded={isOpen}
                      className={`flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-semibold text-cream sm:px-5 ${focusRing}`}
                    >
                      {note.question}
                      <ChevronDown
                        size={16}
                        className={`shrink-0 text-cream/55 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
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
                          <p className="border-t border-cream/8 px-4 py-4 text-[13px] leading-relaxed text-cream/60 sm:px-5">
                            {note.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-center text-[13px] text-cream/55">
              Une autre question ?{' '}
              <Link
                href="/faq"
                className={`fx-link font-semibold text-orange hover:text-orange/80 ${focusRing}`}
              >
                voir la FAQ complète
              </Link>
            </p>
          </div>
        </section>

        {/* CTA final */}
        <section className="px-4 py-12 sm:px-6 sm:py-14 lg:px-16">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 rounded-3xl border border-orange/25 bg-[#0C222D] p-7 text-center sm:p-11 lg:flex-row lg:text-left">
            <div>
              <h2 className="font-display [font-stretch:125%] mb-1.5 text-xl font-extrabold text-cream sm:text-2xl">
                Les fonctionnalités s&apos;ouvrent après la vérification.
              </h2>
              <p className="text-sm text-cream/60">
                Constitution du dossier gratuite, sans engagement. Tu choisiras
                une offre ensuite, si tu en as envie.
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/commencer"
                className={`fx-btn rounded-xl bg-orange px-7 py-3.5 text-sm font-bold text-abyss transition-colors hover:bg-orange/90 ${focusRing}`}
              >
                constituer mon dossier
              </Link>

              <Link
                href="/tarifs"
                className={`fx-ghost rounded-xl border border-cream/15 px-7 py-3.5 text-sm font-bold text-cream/85 transition-colors hover:border-cream/30 ${focusRing}`}
              >
                voir les tarifs
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
