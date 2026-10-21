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
  EyeOff,
  Flag,
  Ghost,
  GraduationCap,
  Heart,
  Lock,
  MessageCircle,
  Rocket,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
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
  Surtitre,
  EnteteSection,
  TuileIcone,
} from '@/components/brand/mise-en-page';

/**
 * Page Fonctionnalités Sfera'Solys — direction A (« Sphère vérifiée »).
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
  /**
   * Photographie de la carte.
   *
   * Les trois premières reprennent celles des cartes de la page d'accueil :
   * une fonctionnalité doit avoir la même image aux deux endroits, sinon le
   * visiteur qui clique croit arriver ailleurs.
   */
  image: string;
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
    image: '/visuels/solys-06.webp',
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
    image: '/visuels/solys-07.webp',
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
    image: '/visuels/solys-08.webp',
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
    image: '/visuels/solys-05.webp',
  },
  {
    id: 'security',
    icon: ShieldCheck,
    title: 'Sécurité totale',
    description: 'Un espace protégé et bienveillant.',
    details:
      'Modération, données protégées et outils de contrôle pour ton bien-être numérique. Rien à activer : ce socle est appliqué à tous les comptes, dès la vérification.',
    benefits: ['Modération active', 'Données protégées', 'Signalement rapide'],
    image: '/visuels/solys-04.webp',
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
    image: '/visuels/solys-01.webp',
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
    image: '/visuels/solys-02.webp',
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
  { icon: Search, title: 'Découvrir', resume: 'Circle of Six et annuaire' },
  {
    icon: MessageCircle,
    title: 'Échanger',
    resume: 'Mode Fantôme et messagerie sobre',
  },
  {
    icon: Users,
    title: 'Se rencontrer',
    resume: 'Événements et Communauté Solys',
  },
];

/** Socle commun : ce qui s'applique à toutes les fonctionnalités. */
const foundations = [
  { icon: BadgeCheck, titre: 'Identité vérifiée', detail: 'par document officiel' },
  { icon: Lock, titre: 'Données sécurisées', detail: '(RGPD)' },
  { icon: EyeOff, titre: 'Tu décides', detail: 'ce que tu montres' },
  { icon: Flag, titre: 'Signalement traité', detail: 'par un humain' },
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
      "Non. La vérification a lieu une seule fois, à l'inscription, et elle porte sur Ta Sphère. Le Mode Fantôme agit ensuite sur ce que voient les autres membres, pas sur ton statut de profil vérifié.",
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
    {
      icon: UserCheck,
      value: siteStats ? formatStat(siteStats.membres) : '…',
      label: 'Profils vérifiés',
    },
    {
      icon: Heart,
      value: siteStats ? formatStat(siteStats.matchs) : '…',
      label: 'Mises en relation',
    },
    {
      icon: MessageCircle,
      value: siteStats ? formatStat(siteStats.messages) : '…',
      label: 'Messages échangés',
    },
    {
      icon: CalendarDays,
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
          Aligné à gauche et non centré, comme la maquette : le texte tient
          la moitié gauche, la photographie la droite. Même construction que
          le héros de la page d'accueil, à ceci près que l'image s'arrête
          plus tôt pour laisser la place au bandeau de vignettes.

          Le surtitre remplace la pastille arrondie d'avant. Une pastille
          annonce une étiquette ; le surtitre annonce une section, et c'est
          celui qu'emploie tout le reste du site.
        */}
        <section className="relative isolate overflow-hidden px-4 sm:px-6 lg:px-16">
          <div className="absolute inset-0 -z-20 lg:left-[44%]">
            <Image
              src="/visuels/solys-03.webp"
              alt="Un homme de profil sur une terrasse, un verre à la main, la ville en contrebas."
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover object-center"
            />

            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-nuit via-nuit/80 to-nuit/45 lg:bg-gradient-to-r lg:from-nuit lg:via-nuit/35 lg:to-nuit/15"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-nuit to-transparent"
            />
          </div>

          {/*
            Le bandeau de vignettes de la maquette : trois portraits empilés
            au bord droit. Décoratifs — pas de nom, pas d'âge, pas de badge
            « vérifié » à côté, donc rien qui puisse se lire comme un membre.
            Masqués sous `xl`, où ils mangeraient la photographie.
          */}
          <div
            aria-hidden="true"
            className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-3 xl:flex"
          >
            {['profil-02', 'profil-03', 'profil-06'].map((nom) => (
              <span
                key={nom}
                className="relative block h-20 w-16 overflow-hidden rounded-xl border border-champagne/15"
              >
                <Image
                  src={`/visuels/profils/${nom}.webp`}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </span>
            ))}
          </div>

          <motion.div
            {...fadeUp}
            className={`relative mx-auto max-w-7xl pb-16 sm:pb-20 ${premierBloc}`}
          >
            <div className="max-w-xl">
              <Surtitre>7 fonctionnalités · vérification incluse</Surtitre>

              <h1 className="font-display mt-6 text-[34px] font-normal leading-[1.08] tracking-tight text-ivoire sm:text-[46px]">
                Tout ce que fait{' '}
                <span className="text-cuivre">Sfera&rsquo;Solys</span>.
              </h1>

              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-champagne/70 sm:text-base">
                Sept fonctionnalités pensées pour chaque moment de ton
                parcours : découvrir, protéger, échanger, se rencontrer.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/commencer"
                  className={`inline-flex items-center justify-center gap-2 rounded-xl bg-degrade-cuivre px-7 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
                >
                  Ouvrir Ma Sphère
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/tarifs"
                  className={`inline-flex items-center justify-center rounded-xl border border-champagne/25 px-6 py-3.5 text-sm font-semibold text-champagne transition-colors hover:border-cuivre/60 hover:text-ivoire ${focusRing}`}
                >
                  Voir ce qui est inclus par offre
                </Link>
              </div>
            </div>

            {/*
              L'accroche manuscrite de la maquette, rendue en Playfair
              italique. Aucune police supplémentaire n'est chargée pour une
              ligne décorative : un troisième caractère coûterait une requête
              et un risque de décalage au chargement, pour un ornement.
            */}
            <p
              aria-hidden="true"
              className="font-display mt-12 hidden text-right text-[19px] italic leading-snug text-cuivre lg:block"
            >
              Des rencontres
              <br />
              qui ont du sens
            </p>
          </motion.div>
        </section>

        <Filet />

        {/* ═══════════════ Les sept fonctionnalités ═══════════════ */}
        {/*
          Quatre cartes puis trois, en deux grilles distinctes : c'est la
          disposition de la maquette, et elle a une raison. Une grille unique
          de quatre colonnes laisserait la seconde rangée à trois cartes
          calées à gauche, avec un vide à droite qui se lit comme un oubli.
          Deux grilles donnent deux rangées pleines.
        */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-7xl">
            <EnteteSection
              surtitre="Nos 7 fonctionnalités"
              intro="Chaque fonctionnalité sert un moment précis de ton parcours, du premier regard jusqu'à la rencontre."
              className="mb-10"
            >
              Des outils pensés pour des rencontres de qualité.
            </EnteteSection>

            {[features.slice(0, 4), features.slice(4)].map((rangee, r) => (
              <div
                key={r}
                className={`grid gap-5 sm:grid-cols-2 ${
                  r === 0 ? 'lg:grid-cols-4' : 'mt-5 lg:grid-cols-3'
                }`}
              >
                {rangee.map((feature) => {
                  const Icon = feature.icon;

                  return (
                    <article
                      key={feature.id}
                      id={feature.id}
                      className={`flex scroll-mt-28 flex-col overflow-hidden rounded-2xl border bg-minuit xl:scroll-mt-32 ${
                        feature.featured
                          ? 'border-cuivre/40 ring-1 ring-cuivre/20'
                          : 'border-cuivre/15'
                      }`}
                    >
                      <div className="relative aspect-[16/9] w-full overflow-hidden">
                        <Image
                          src={feature.image}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover object-center"
                        />
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-t from-minuit via-minuit/30 to-transparent"
                        />
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-start gap-3.5">
                          <TuileIcone icon={Icon} className="h-11 w-11" />

                          <div className="min-w-0">
                            <h3 className="font-display text-[18px] font-normal leading-snug text-ivoire">
                              {feature.title}
                            </h3>
                            <p className="mt-1 text-[12.5px] leading-snug text-champagne/70">
                              {feature.description}
                            </p>
                          </div>
                        </div>

                        <ul className="mt-5 space-y-2.5">
                          {feature.benefits.map((benefit) => (
                            <li key={benefit} className="flex items-start gap-2.5">
                              <span
                                aria-hidden="true"
                                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-cuivre/40 text-cuivre"
                              >
                                <Check size={9} strokeWidth={3} />
                              </span>
                              <span className="text-[12.5px] leading-snug text-champagne/70">
                                {benefit}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {/*
                          Le lien menait droit à l'espace membre, qui renvoie
                          un visiteur non connecté sur le formulaire de
                          connexion : il lisait « découvrir » et livrait une
                          barrière. Il mène à l'inscription pour un visiteur,
                          à la fonctionnalité pour un membre, et le libellé
                          suit la destination.
                        */}
                        {feature.link ? (
                          <Link
                            href={connecte ? feature.link : '/commencer'}
                            className={`mt-auto inline-flex items-center gap-1.5 pt-5 text-[13px] font-semibold text-cuivre transition-colors hover:text-champagne ${focusRing}`}
                          >
                            {connecte ? 'Ouvrir' : 'Découvrir'}
                            <ArrowRight size={14} />
                          </Link>
                        ) : (
                          <p className="mt-auto pt-5 text-[12.5px] text-champagne/55">
                            Incluse partout, sans réglage.
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        <Filet />

        {/* ═══════════════ Le parcours ═══════════════ */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-7xl">
            <EnteteSection
              surtitre="Comment elles s'enchaînent"
              intro="De la découverte à la rencontre, chaque fonctionnalité trouve sa place au bon moment."
              className="mb-10"
            >
              Un parcours simple et naturel.
            </EnteteSection>

            {/*
              Horizontal, avec une flèche entre les étapes — la maquette lit
              le parcours comme une ligne, pas comme une liste. La flèche
              disparaît sous `lg`, où les étapes s'empilent : une flèche qui
              pointe à droite entre deux blocs superposés ne veut rien dire.
            */}
            <ol className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-3">
              {journey.map((step, i) => {
                const Icone = step.icon;

                return (
                  <li
                    key={step.title}
                    className="flex flex-1 items-center gap-3"
                  >
                    <div className="flex flex-1 items-center gap-4 rounded-2xl border border-cuivre/15 bg-minuit p-4 sm:p-5">
                      <span className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cuivre text-[14px] font-extrabold text-nuit">
                        {i + 1}
                      </span>

                      <span
                        aria-hidden="true"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cuivre/30 bg-nuit/60 text-cuivre"
                      >
                        <Icone size={18} />
                      </span>

                      <span className="min-w-0">
                        <span className="block text-[15px] font-semibold text-champagne">
                          {step.title}
                        </span>
                        <span className="mt-0.5 block text-[12.5px] leading-snug text-champagne/70">
                          {step.resume}
                        </span>
                      </span>
                    </div>

                    {i < journey.length - 1 && (
                      <ArrowRight
                        aria-hidden="true"
                        size={18}
                        className="hidden shrink-0 text-cuivre/60 lg:block"
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <Filet />

        {/* ═══════════════ Le socle commun ═══════════════ */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-7xl">
            <EnteteSection
              surtitre="Le socle commun"
              intro="Ces principes s'appliquent à toutes les fonctionnalités."
              className="mb-10"
            >
              Un environnement sûr et maîtrisé.
            </EnteteSection>

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
              {foundations.map(({ icon: Icon, titre, detail }) => (
                <li
                  key={titre}
                  className="flex items-center gap-4 rounded-2xl border border-cuivre/15 bg-minuit p-5"
                >
                  <TuileIcone icon={Icon} />

                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-champagne">
                      {titre}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-champagne/70">
                      {detail}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {chiffresPrets && (
          <>
            <Filet />

            {/* ═══════════════ Les chiffres ═══════════════ */}
            <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
              <div className="mx-auto max-w-7xl">
                <EnteteSection
                  surtitre="Sfera'Solys en chiffres"
                  intro="Chiffres mis à jour en continu depuis la plateforme."
                  className="mb-10"
                >
                  Une communauté en pleine croissance.
                </EnteteSection>

                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
                  {stats.map(({ icon: Icon, value, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-4 rounded-2xl border border-cuivre/15 bg-minuit p-5"
                    >
                      <TuileIcone icon={Icon} />

                      <div className="min-w-0">
                        <dt className="text-[12.5px] text-champagne/70">
                          {label}
                        </dt>
                        <dd className="font-display mt-1 text-[26px] font-normal leading-none text-ivoire">
                          {value}
                        </dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>
            </section>
          </>
        )}

        <Filet />

        {/* ═══════════════ Bon à savoir ═══════════════ */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-7xl">
            <EnteteSection
              surtitre="Bon à savoir"
              intro="Des réponses claires pour avancer sereinement."
              className="mb-10"
            >
              Vos questions, nos réponses.
            </EnteteSection>

            {/*
              L'accordéon tient la colonne de gauche et le lien vers la FAQ
              se cale en bas à droite, comme la maquette. Il était centré
              sous les questions, où il se lisait comme une quatrième
              question plutôt que comme une sortie.
            */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:gap-10">
              <div className="flex-1 space-y-2">
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
                          setOpenNoteIndex((current) =>
                            current === index ? null : index
                          )
                        }
                        aria-expanded={isOpen}
                        className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-champagne ${focusRing}`}
                      >
                        {note.question}
                        <ChevronDown
                          size={16}
                          className={`shrink-0 text-cuivre transition-transform ${
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
                            transition={{
                              duration: shouldReduceMotion ? 0 : 0.2,
                            }}
                            className="overflow-hidden"
                          >
                            <p className="border-t border-cuivre/10 px-5 py-4 text-[13px] leading-relaxed text-champagne/70">
                              {note.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              <Link
                href="/faq"
                className={`inline-flex shrink-0 items-center gap-2.5 self-start rounded-xl border border-cuivre/40 px-6 py-3.5 text-sm font-semibold text-champagne transition-colors hover:border-cuivre hover:text-ivoire lg:self-auto ${focusRing}`}
              >
                Voir la FAQ complète
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════ Appel final ═══════════════ */}
        {/*
          Une bande pleine largeur sur la photographie, et non le panneau
          encadré d'avant : la maquette laisse l'image aller jusqu'aux bords.
          Pas de filet avant, la photographie s'éteint d'elle-même en haut.

          Voile à 80 %, mesuré sur l'image : le champagne à 70 % y tient
          5,03:1 et le cuivre 4,18.
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
            <div className="absolute inset-0 bg-gradient-to-b from-nuit via-transparent to-nuit/60" />
          </div>

          <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-16">
            <div className="mx-auto flex max-w-7xl flex-col gap-7 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
              <div>
                <h2 className="font-display text-[26px] font-normal leading-tight text-ivoire sm:text-[32px]">
                  Les fonctionnalités s&apos;ouvrent après la vérification.
                </h2>
                <p className="mt-3 max-w-md text-[14px] leading-relaxed text-champagne/70">
                  Ouverture de Ta Sphère gratuite, sans engagement.
                  <br className="hidden sm:block" /> Tu choisiras une offre
                  ensuite, si tu en as envie.
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <Link
                  href="/commencer"
                  className={`inline-flex items-center justify-center gap-2 rounded-xl bg-degrade-cuivre px-7 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
                >
                  Ouvrir Ma Sphère
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/tarifs"
                  className={`inline-flex items-center justify-center rounded-xl border border-champagne/25 bg-nuit/40 px-6 py-3.5 text-sm font-semibold text-champagne backdrop-blur-sm transition-colors hover:border-cuivre/60 hover:text-ivoire ${focusRing}`}
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
