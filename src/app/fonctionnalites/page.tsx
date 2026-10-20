'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
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
  Rocket,
  ShieldCheck,
} from 'lucide-react';

import Image from 'next/image';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HexagonSix from '@/components/icons/HexagonSix';
import GrainOverlay from '@/components/brand/GrainOverlay';
import {
  sectionY,
  premierBloc,
  focusRing,
  Filet,
  TitreSection,
} from '@/components/brand/mise-en-page';

/**
 * Page Fonctionnalités Sfera'Solys — direction A (« dossier de vérification »).
 *
 * Restructuration + rebranding (voir CLAUDE.md § Restructuration) :
 * cette page était restée intégralement celle du site d'origine — un
 * dégradé différent par fonctionnalité, des orbes animées, des mockups en
 * emojis, une marque et une cible non corrigées, et une copy rédigée au
 * féminin (« Sois guidée », « Rejoins celles qui... »).
 *
 * Elle prend aussi du galon : la grille des 7 fonctionnalités a été
 * retirée de la home, donc /fonctionnalites est désormais LE point de
 * découverte du produit. La page se lit de haut en bas comme un sommaire :
 * les 7 fonctionnalités, la façon dont elles s'enchaînent, le socle
 * commun, quelques chiffres, les questions qui reviennent.
 *
 * Ce qui ne change pas : les fonctionnalités restantes, leurs titres, leurs
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
    description: 'Rester sur la plateforme sans y apparaître.',
    details:
      "Ton profil disparaît de l'annuaire et du Circle of Six tant que le mode est actif, et tu continues à consulter les profils sans laisser de trace chez les autres. Tes conversations et tes mises en relation, elles, ne bougent pas : tu ne perds aucun échange. Tu redeviens visible quand tu le décides.",
    benefits: [
      "Invisible dans l'annuaire et le Circle",
      'Navigation sans laisser de trace',
      'Conversations conservées',
    ],
    link: '/mode-fantome',
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
    title: 'Entraide',
    description: 'Poser une question à ceux qui y sont déjà passés.',
    details:
      "Un fil de questions-réponses entre membres vérifiés : comment aborder un premier message, quoi mettre dans son profil, comment poser une limite. Celui qui pose la question retient la réponse qui l'a aidé, et elle reste visible pour les suivants. Ce sont des membres qui répondent, pas des professionnels — et c'est accessible dès l'offre gratuite.",
    benefits: [
      'Questions par thème',
      'Réponses de membres vérifiés',
      'La réponse retenue reste visible',
    ],
    link: '/entraide',
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
    id: 'boost',
    icon: Rocket,
    title: 'Boost de visibilité',
    description: 'Trente minutes en tête d’Explorer, et c’est dit.',
    details:
      "Un boost remonte ton profil en tête d'Explorer pendant trente minutes, pour les membres qui peuvent déjà te voir. Le nombre de boosts dépend de l'offre — 1, 3 ou 10 par mois — et ta carte affiche « Mis en avant » pendant toute la durée : un profil poussé le dit, il ne se fait pas passer pour un hasard du classement.",
    benefits: [
      '30 minutes par boost',
      '1, 3 ou 10 par mois selon l’offre',
      'Mise en avant signalée sur la carte',
    ],
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
/*
  Les pastilles alternaient orange et lime, une sur deux, sans que la
  couleur dise rien. C'est exactement ce qui avait été corrigé dans le
  parcours de la page d'accueil : dans ce projet, le vert est réservé à la
  validation. Les trois étapes sont donc cuivrées, et le champ `dot` part
  avec l'alternance.
*/
const journey = [
  {
    title: 'Découvrir',
    description:
      'Le Circle of Six te propose 6 profils par semaine, et l’annuaire te laisse chercher par toi-même.',
  },
  {
    title: 'Échanger',
    description:
      "Le Mode Fantôme protège ton intimité le temps de la mise en confiance, et la messagerie reste sobre : pas de relances, pas de score à tenir.",
  },
  {
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
      "La vérification d'identité, le profil, la messagerie de base et la Communauté Solys sont accessibles dès l'offre gratuite. Le Circle of Six hebdomadaire, les boosts de visibilité et le Mode Fantôme dépendent de l'offre choisie : le détail est sur la page Tarifs.",
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
  const { status } = useSession();
  /*
    Tant que la session charge, on traite le visiteur comme non connecté :
    /commencer est public et sans effet de bord, alors qu'une page de
    l'espace membre renverrait sur le formulaire de connexion.
  */
  const connecte = status === 'authenticated';

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

  /*
    La section des chiffres ne s'affiche que si les quatre compteurs ont
    démarré.

    `formatStat` rend « — » pour zéro, ce qui donnait, sous un titre
    « Sfera'Solys en chiffres », quatre tirets et un seul chiffre réel.
    C'est la même raison qui avait fait retirer le compteur « N profils
    vérifiés » du héros de la page d'accueil : un chiffre honnête peut
    desservir, et quatre tirets annoncent qu'il n'y a rien à annoncer.

    Le seuil est volontairement « strictement supérieur à zéro » et non un
    nombre arbitraire : à partir de combien de membres la section devient
    flatteuse plutôt que gênante est une décision de produit, pas de code.
  */
  const chiffresPrets =
    siteStats !== null &&
    siteStats.membres > 0 &&
    siteStats.matchs > 0 &&
    siteStats.messages > 0 &&
    siteStats.evenements > 0;

  const fadeUp = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0 : 0.5, ease: 'easeOut' as const },
  };

  return (
    <>
      <Header />

      <GrainOverlay />

      <main id="contenu" className="relative bg-nuit text-champagne">
        {/* ═══════════════ Héros ═══════════════ */}
        {/*
          Voile à 86 %, mesuré sur la photographie et non choisi à l'œil : le
          texte du héros est centré, donc il passe partout sur l'image, y
          compris sur les bougies de la table. À cette valeur, le champagne à
          70 % y tient 5,60:1 et le cuivre 4,82 — l'un et l'autre au-dessus du
          seuil du petit texte, ce qui n'était pas le cas à 78 %.
        */}
        <section className="relative isolate overflow-hidden px-4 sm:px-6 lg:px-16">
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <Image
              src="/visuels/solys-05.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-nuit/86" />
            <div className="absolute inset-0 bg-gradient-to-b from-nuit via-transparent to-nuit" />
          </div>

          <motion.div
            {...fadeUp}
            className={`mx-auto max-w-3xl pb-14 text-center sm:pb-16 ${premierBloc}`}
          >
            <span className="inline-block rounded-full border border-cuivre/35 bg-nuit/50 px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-champagne backdrop-blur-sm">
              7 fonctionnalités · vérification incluse
            </span>

            <h1 className="font-display mt-6 text-[34px] font-normal leading-[1.1] tracking-tight text-ivoire sm:text-[46px]">
              Tout ce que fait{' '}
              <span className="text-cuivre">Sfera&rsquo;Solys</span>.
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-champagne/70 sm:text-base">
              Chaque fonctionnalité répond à un moment précis : découvrir des
              profils, te protéger, échanger, puis rencontrer. Rien de
              décoratif, et rien qui se cache derrière un abonnement sans le
              dire.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/commencer"
                className={`inline-flex items-center justify-center gap-2 rounded-xl bg-degrade-cuivre px-7 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
              >
                Constituer mon dossier
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/tarifs"
                className={`inline-flex items-center justify-center rounded-xl border border-champagne/25 px-6 py-3.5 text-sm font-semibold text-champagne transition-colors hover:border-cuivre/60 hover:text-ivoire ${focusRing}`}
              >
                Ce qui est inclus par offre
              </Link>
            </div>
          </motion.div>
        </section>

        <Filet />

        {/* ═══════════════ Les 7 fonctionnalités ═══════════════ */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-7xl">
            <TitreSection surtitre="Le catalogue">
              Les sept fonctionnalités
            </TitreSection>

            <p className="mb-8 mt-4 max-w-xl text-[15px] leading-relaxed text-champagne/70">
              Toutes sont pensées pour des hommes de 28 ans et plus, et ne
              fonctionnent qu&apos;entre profils vérifiés.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                const isOpen = openFeature === feature.id;

                return (
                  /*
                    `id` et `scroll-mt` : les cartes de la page d'accueil
                    renvoient ici, sur l'ancre de la fonctionnalité qu'elles
                    annoncent. Sans `scroll-mt`, l'en-tête fixe recouvrirait
                    le haut de la carte visée — 112 px, puis 128 au-delà de
                    1280 px où l'en-tête passe à `h-20`.
                  */
                  <div
                    key={feature.id}
                    id={feature.id}
                    className={`relative flex scroll-mt-28 flex-col rounded-2xl border p-5 sm:p-6 xl:scroll-mt-32 ${
                      feature.featured
                        ? 'border-cuivre/40 bg-minuit ring-1 ring-cuivre/20'
                        : 'border-cuivre/15 bg-minuit'
                    }`}
                  >
                    <Icon
                      size={22}
                      className={feature.featured ? 'text-cuivre' : 'text-champagne/55'}
                    />

                    <h3 className="font-display mt-3 text-[18px] font-normal leading-snug text-ivoire">
                      {feature.title}
                    </h3>

                    <p className="mt-1 text-[13px] leading-relaxed text-champagne/55">
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
                      className={`mt-4 flex items-center justify-between border-t border-cuivre/10 pt-3 text-[13px] font-semibold text-champagne/70 sm:hidden ${focusRing}`}
                    >
                      {isOpen ? 'masquer le détail' : 'voir le détail'}
                      <ChevronDown
                        size={15}
                        className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    <div
                      className={`flex-1 border-cuivre/10 sm:mt-4 sm:block sm:border-t sm:pt-4 ${
                        isOpen ? 'mt-4 block' : 'hidden'
                      }`}
                    >
                      <p className="text-[13px] leading-relaxed text-champagne/70">
                        {feature.details}
                      </p>

                      <ul className="mt-3 space-y-2">
                        {feature.benefits.map((benefit) => (
                          <li key={benefit} className="flex items-start gap-2">
                            <Check
                              size={14}
                              className={`mt-[3px] shrink-0 ${
                                feature.featured ? 'text-cuivre' : 'text-succes'
                              }`}
                            />
                            <span className="text-[13px] leading-relaxed text-champagne/70">
                              {benefit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/*
                      Le lien menait droit à la page de la fonctionnalité,
                      c'est-à-dire à l'espace membre — qui renvoie un visiteur
                      non connecté sur le formulaire de connexion. Il lisait
                      « découvrir » et livrait une barrière.

                      Il mène donc à l'inscription pour un visiteur, et à la
                      fonctionnalité pour un membre. Le libellé suit la
                      destination : un lien doit annoncer où il va.
                    */}
                    {feature.link ? (
                      <Link
                        href={connecte ? feature.link : '/commencer'}
                        className={`fx-link mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-champagne transition-colors ${focusRing}`}
                      >
                        {connecte ? 'ouvrir' : 'créer mon profil'}
                        <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <p className="mt-5 text-[13px] text-champagne/55">
                        Incluse partout, sans réglage.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <Filet />

        {/* ═══════════════ Comment elles s'enchaînent ═══════════════ */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-3xl">
            <TitreSection surtitre="L'ordre des choses" className="mb-10">
              Comment elles s&apos;enchaînent
            </TitreSection>

            <ol className="flex flex-col">
              {journey.map((step, i) => (
                <li key={step.title} className="flex gap-5">
                  <div className="flex shrink-0 flex-col items-center">
                    <span
                      className="font-display flex h-10 w-10 items-center justify-center rounded-full bg-cuivre text-[15px] font-extrabold text-nuit"
                    >
                      {i + 1}
                    </span>
                    {i < journey.length - 1 && (
                      <span className="my-1.5 w-px flex-1 bg-cuivre/35" />
                    )}
                  </div>

                  <div className={i < journey.length - 1 ? 'pb-10' : ''}>
                    <h3 className="font-display mb-1.5 text-[18px] font-normal text-ivoire">
                      {step.title}
                    </h3>
                    <p className="max-w-md text-sm leading-relaxed text-champagne/60">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <Filet />

        {/* ═══════════════ Socle commun ═══════════════ */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-7xl">
            <TitreSection surtitre="Sans condition">
              Le socle commun
            </TitreSection>

            <p className="mb-8 mt-4 max-w-xl text-[15px] leading-relaxed text-champagne/70">
              Ces quatre règles ne dépendent d&apos;aucune fonctionnalité ni
              d&apos;aucune offre. Elles s&apos;appliquent à tous les comptes,
              dès la validation du dossier.
            </p>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {foundations.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col gap-2.5 rounded-2xl border border-cuivre/15 bg-minuit p-4 sm:p-[18px]"
                >
                  <Icon size={18} className="text-cuivre" />
                  <span className="text-[13px] font-semibold text-champagne">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {chiffresPrets && (
        <>
        <Filet />

        {/* ═══════════════ Chiffres ═══════════════ */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-7xl">
            <TitreSection surtitre="En chiffres" className="mb-8">
              Sfera&apos;Solys aujourd&apos;hui
            </TitreSection>

            <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-cuivre/15 bg-minuit p-4 sm:p-[18px]"
                >
                  <dd className="font-display text-[30px] font-normal leading-none text-ivoire sm:text-[34px]">
                    {stat.value}
                  </dd>
                  <dt className="mt-2 text-[13px] text-champagne/55">{stat.label}</dt>
                </div>
              ))}
            </dl>

            <p className="mt-6 text-[13px] text-champagne/60">
              Chiffres mis à jour en continu depuis la plateforme.
            </p>
          </div>
        </section>
        </>
        )}

        <Filet />

        {/* ═══════════════ Bon à savoir ═══════════════ */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-3xl">
            <TitreSection surtitre="Les questions qui reviennent" className="mb-8">
              Bon à savoir
            </TitreSection>

            <div className="space-y-1.5">
              {notes.map((note, index) => {
                const isOpen = openNoteIndex === index;

                return (
                  <div
                    key={note.question}
                    className="overflow-hidden rounded-2xl border border-cuivre/15 bg-minuit"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenNoteIndex((current) => (current === index ? null : index))
                      }
                      aria-expanded={isOpen}
                      className={`flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-semibold text-champagne sm:px-5 ${focusRing}`}
                    >
                      {note.question}
                      <ChevronDown
                        size={16}
                        className={`shrink-0 text-champagne/55 transition-transform ${
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
                          <p className="border-t border-cuivre/10 px-4 py-4 text-[13px] leading-relaxed text-champagne/60 sm:px-5">
                            {note.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-center text-[13px] text-champagne/55">
              Une autre question ?{' '}
              <Link
                href="/faq"
                className={`fx-link font-semibold text-cuivre hover:text-cuivre/80 ${focusRing}`}
              >
                voir la FAQ complète
              </Link>
            </p>
          </div>
        </section>

        {/* ═══════════════ Appel final ═══════════════ */}
        {/*
          Même traitement que l'appel final de la page d'accueil : la
          photographie court derrière, et le panneau se contente d'un fond
          translucide pour qu'elle continue de se voir à travers lui.

          Pas de filet avant : la photographie s'éteint d'elle-même en haut.
        */}
        <div className="relative isolate overflow-hidden">
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <Image
              src="/visuels/solys-10.webp"
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-nuit/80" />
            <div className="absolute inset-0 bg-gradient-to-b from-nuit via-transparent to-nuit" />
          </div>

          <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-7 rounded-3xl border border-cuivre/25 bg-nuit/55 p-8 text-center backdrop-blur-md sm:p-10 lg:flex-row lg:text-left">
              <div>
                <h2 className="font-display text-[24px] font-normal leading-tight text-ivoire sm:text-[30px]">
                  Les fonctionnalités s&apos;ouvrent après la vérification.
                </h2>
                <p className="mt-2.5 max-w-md text-sm leading-relaxed text-champagne/70">
                  Constitution du dossier gratuite, sans engagement. Tu
                  choisiras une offre ensuite, si tu en as envie.
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-center gap-3 sm:flex-row">
                <Link
                  href="/commencer"
                  className={`inline-flex items-center justify-center gap-2 rounded-xl bg-degrade-cuivre px-7 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
                >
                  Constituer mon dossier
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/tarifs"
                  className={`inline-flex items-center justify-center rounded-xl border border-champagne/25 px-6 py-3.5 text-sm font-semibold text-champagne transition-colors hover:border-cuivre/60 hover:text-ivoire ${focusRing}`}
                >
                  Voir les tarifs
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
