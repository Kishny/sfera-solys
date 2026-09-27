'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Compass,
  Ghost,
  Lightbulb,
  MessageCircle,
  PenLine,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

/**
 * Page Guide du débutant Sfera'Solys — direction A (« dossier de vérification »).
 *
 * Restructuration + rebranding (voir CLAUDE.md § Restructuration) :
 * cette page était restée sur l'habillage d'origine — dégradés violets
 * codés en dur, fonds clairs, orbes animées, emojis décoratifs, et
 * quelques restes de la version féminine (nom de marque dans les libellés
 * d'étapes, accords au féminin).
 *
 * Ce qui change ici : identité sombre, un seul accent (vulcanico), lime
 * réservé aux numéros d'étape et aux coches, un seul niveau de décor (zéro
 * orbe, zéro dégradé), et la copy corrigée (marque + cible hommes 28+).
 *
 * Ce qui ne change pas : les 5 étapes du parcours et tout leur détail, la
 * FAQ intégrée, les conseils de la communauté et les destinations des CTA.
 * La page reste purement présentationnelle.
 */

type Step = {
  title: string;
  duration: string;
  dot: 'orange' | 'lime';
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  content: string;
  details: string[];
  tip?: string;
};

const steps: Step[] = [
  {
    title: 'Création de ton profil Solys',
    duration: '5 à 10 minutes',
    dot: 'orange',
    icon: UserRound,
    content:
      "Commence par partager ce qui te définit vraiment. Ton profil Solys est plus qu'une photo : c'est l'expression de ta vibe intérieure.",
    details: [
      'Ajoute des photos qui te représentent authentiquement',
      'Partage tes intérêts, passions et valeurs',
      "Définis ce que tu recherches sur Sfera'Solys",
      'Configure tes préférences de confidentialité',
    ],
    tip: 'Sois toi-même : les profils authentiques reçoivent plus de réponses.',
  },
  {
    title: 'Découverte du Circle of Six',
    duration: 'à ton rythme',
    dot: 'lime',
    icon: Users,
    content:
      'Chaque semaine, notre algorithme te présente 6 profils vérifiés qui partagent tes valeurs et tes intérêts.',
    details: [
      'Reçois 6 suggestions personnalisées chaque dimanche',
      'Chaque profil est pré-sélectionné selon tes critères',
      'Prends ton temps pour découvrir chaque personne',
      'Pas de pression : tu décides du rythme',
    ],
  },
  {
    title: 'Personnalisation de ton VibeSphere',
    duration: 'en continu',
    dot: 'orange',
    icon: Compass,
    content:
      'Crée ton espace émotionnel unique pour exprimer ton humeur du jour.',
    details: [
      'Choisis ta playlist personnalisée',
      'Sélectionne tes couleurs et ambiance préférées',
      'Partage tes humeurs avec des avatars expressifs',
      'Utilise le journal émotionnel pour suivre ton évolution',
    ],
  },
  {
    title: 'Premières interactions',
    duration: 'quand tu te sens prêt',
    dot: 'lime',
    icon: MessageCircle,
    content:
      'Engage la conversation de manière authentique et bienveillante.',
    details: [
      'Utilise nos prompts de conversation pour briser la glace',
      'Partage tes intérêts communs pour créer un lien',
      'Propose un rendez-vous VibePlanner créatif',
      'Respecte toujours les limites et le consentement',
    ],
  },
  {
    title: 'Participation aux événements Solys',
    duration: 'selon tes envies',
    dot: 'orange',
    icon: CalendarDays,
    content:
      "Rejoins notre communauté lors d'événements exclusifs et enrichissants.",
    details: [
      'Participe aux rassemblements Solys, en ligne ou en présentiel',
      'Rejoins des ateliers thématiques',
      'Assiste à des conférences thématiques, y compris sur des sujets LGBTQ+',
      "Rencontre d'autres membres lors de soirées détente",
    ],
  },
];

const faqs = [
  {
    question:
      'Combien de temps faut-il pour commencer à rencontrer des personnes ?',
    answer:
      'La plupart de nos membres font leur première connexion significative dans les 48h après avoir complété leur profil. Le Circle of Six te présente des suggestions chaque semaine, donc tu as toujours de nouvelles opportunités.',
  },
  {
    question: 'Dois-je révéler mon identité réelle ?',
    answer:
      "Non. Tu as le contrôle total sur ton anonymat. Le Mode Fantôme te permet d'utiliser un pseudonyme, de flouter tes photos et de ne révéler ton identité que quand tu le décides.",
  },
  {
    question: "Comment fonctionne la modération sur Sfera'Solys ?",
    answer:
      'Notre équipe de modération travaille 24h/24 pour garantir la protection de tous. Nous vérifions les profils, surveillons les interactions et agissons rapidement en cas de signalement.',
  },
  {
    question: "Puis-je utiliser Sfera'Solys si je suis en couple ?",
    answer:
      "Oui. Sfera'Solys accueille chacun, quelle que soit sa situation amoureuse. Que tu cherches des amitiés, des relations polyamoureuses ou simplement à élargir ton cercle social, tu es le bienvenu.",
  },
  {
    question:
      'Comment gérer les rencontres qui ne correspondent pas à mes attentes ?',
    answer:
      "Tu peux ajuster tes préférences, prendre une pause ou simplement passer. L'objectif est que tu gardes toujours le contrôle de ton rythme et de ton expérience.",
  },
];

const communityTips = [
  {
    tip: 'Prends le temps de remplir ton profil à 100%',
    details:
      'Un profil complet avec tes vraies passions attire des connexions bien plus alignées avec toi.',
    author: 'Conseil de la communauté',
    icon: PenLine,
  },
  {
    tip: 'Utilise le Mode Fantôme pour commencer en douceur',
    details:
      "Cela permet de s'habituer à la plateforme sans pression et de révéler ton identité quand tu te sens prêt.",
    author: 'Conseil de la communauté',
    icon: Ghost,
  },
  {
    tip: 'Participe aux événements pour rencontrer plusieurs personnes',
    details:
      "C'est souvent moins intimidant que les échanges en tête-à-tête, et l'ambiance est toujours bienveillante.",
    author: 'Conseil de la communauté',
    icon: Users,
  },
];

/**
 * Les fonctionnalités citées dans les étapes ont chacune leur page. On les
 * rassemble en fin de guide plutôt que d'envoyer le lecteur chercher dans
 * le menu — aucune nouveauté, uniquement ce que le guide vient d'évoquer.
 */
const relatedPages = [
  { label: 'Circle of Six', href: '/circle' },
  { label: 'Mode Fantôme', href: '/mode-fantome' },
  { label: 'VibeSphere', href: '/vibesphere' },
  { label: 'VibePlanner', href: '/vibeplanner' },
  { label: 'Événements Solys', href: '/evenements' },
];

/** Anneau de focus clavier, identique partout dans la direction A. */
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss';

export default function GuidePage() {
  /**
   * Sur mobile, le détail de chaque étape est repliable pour que les 5
   * étapes restent parcourables au pouce. À partir de `sm`, tout est
   * affiché en permanence.
   */
  const [openStepIndex, setOpenStepIndex] = useState<number | null>(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      <Header />

      {/* id="contenu" : cible du lien d'évitement du header. */}
      <main id="contenu" className="bg-abyss text-cream">
        {/* Hero */}
        <section className="border-b border-cream/8 px-4 pt-20 sm:px-6 sm:pt-24 lg:px-16 xl:pt-28">
          <div className="mx-auto max-w-3xl py-12 text-center sm:py-16">
            <span className="inline-block rounded-full border border-orange/35 bg-orange/[0.12] px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-orange">
              Guide du débutant · niveau débutant
            </span>

            <h1 className="font-display [font-stretch:125%] mt-5 text-[30px] font-extrabold leading-[1.15] tracking-tight text-cream sm:text-[40px]">
              Ton parcours, étape par étape.
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-cream/60 sm:text-base">
              Ce guide t&apos;accompagne dans tes premiers pas sur
              Sfera&apos;Solys. Ici, le but n&apos;est pas d&apos;aller vite,
              mais de créer des connexions qui ont du sens.
            </p>

            <p className="mt-5 inline-flex items-center gap-2 text-[13px] text-cream/55">
              <Clock size={14} className="text-orange" />
              5 étapes · environ 30 minutes de lecture
            </p>
          </div>
        </section>

        {/* Avant de commencer */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display [font-stretch:125%] mb-4 text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
              Avant de commencer
            </h2>

            <p className="text-[15px] leading-relaxed text-cream/60 sm:text-base">
              Rien ici n&apos;est un compte à rebours. Tu peux constituer ton
              dossier en une fois ou y revenir plus tard, ouvrir une étape et
              laisser les suivantes de côté. Le guide suit l&apos;ordre le plus
              simple, pas un ordre obligatoire.
            </p>

            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-cream/8 bg-[#0C222D] p-4 sm:p-5">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-orange" />
              <p className="text-[13px] leading-relaxed text-cream/70">
                Avance à ton rythme : tu gardes toujours le contrôle de ce que
                tu partages, de ce que tu montres et du moment où tu te lances.
              </p>
            </div>
          </div>
        </section>

        {/* Les 5 étapes */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display [font-stretch:125%] text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
              Ton parcours en 5 étapes
            </h2>

            <p className="mb-10 mt-2 max-w-xl text-[15px] leading-relaxed text-cream/60">
              Une progression simple, claire et sans mauvaise surprise.
            </p>

            <ol className="flex flex-col">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isOpen = openStepIndex === index;
                const isLast = index === steps.length - 1;

                return (
                  <li key={step.title} className="flex gap-4 sm:gap-5">
                    <div className="flex shrink-0 flex-col items-center">
                      <span
                        className={`font-display flex h-10 w-10 items-center justify-center rounded-full text-[15px] font-extrabold ${
                          step.dot === 'orange'
                            ? 'bg-orange text-abyss'
                            : 'bg-lime text-abyss'
                        }`}
                      >
                        {index + 1}
                      </span>

                      {!isLast && (
                        <span className="my-1.5 w-[2px] flex-1 bg-lime/35" />
                      )}
                    </div>

                    <div
                      className={
                        isLast ? 'min-w-0 flex-1' : 'min-w-0 flex-1 pb-8 sm:pb-10'
                      }
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3 className="font-display [font-stretch:125%] text-[17px] font-bold text-cream">
                          {step.title}
                        </h3>

                        <span className="inline-flex items-center gap-1.5 text-[12px] text-cream/55">
                          <Clock size={12} />
                          {step.duration}
                        </span>
                      </div>

                      <p className="mt-2 max-w-md text-sm leading-relaxed text-cream/60">
                        {step.content}
                      </p>

                      {/* Bouton de dépli, mobile uniquement */}
                      <button
                        type="button"
                        onClick={() =>
                          setOpenStepIndex((current) =>
                            current === index ? null : index
                          )
                        }
                        aria-expanded={isOpen}
                        className={`fx-link mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-orange sm:hidden ${focusRing}`}
                      >
                        {isOpen ? 'masquer le détail' : 'voir le détail'}
                        <ChevronDown
                          size={15}
                          className={`transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      <div
                        className={`mt-4 rounded-2xl border border-cream/8 bg-[#0C222D] p-4 sm:block sm:p-5 ${
                          isOpen ? 'block' : 'hidden'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon size={18} className="text-orange" />
                          <span className="text-[12px] font-semibold uppercase tracking-wide text-cream/55">
                            Ce qu&apos;il y a à faire
                          </span>
                        </div>

                        <ul className="mt-3 space-y-2">
                          {step.details.map((detail) => (
                            <li key={detail} className="flex items-start gap-2">
                              <Check
                                size={14}
                                className="mt-[3px] shrink-0 text-lime"
                              />
                              <span className="text-[13px] leading-relaxed text-cream/70">
                                {detail}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {step.tip && (
                          <div className="mt-4 rounded-xl border border-orange/25 bg-orange/[0.08] px-3.5 py-3">
                            <p className="flex items-start gap-2 text-[13px] leading-relaxed text-cream/70">
                              <Lightbulb
                                size={15}
                                className="mt-[2px] shrink-0 text-orange"
                              />
                              {step.tip}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            <Link
              href="/commencer"
              className={`fx-link mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-orange transition-colors hover:text-orange/80 ${focusRing}`}
            >
              commencer la première étape
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* FAQ intégrée */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display [font-stretch:125%] mb-8 text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
              Questions fréquentes
            </h2>

            <div className="space-y-1.5">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;

                return (
                  <div
                    key={faq.question}
                    className="overflow-hidden rounded-2xl border border-cream/8 bg-[#0C222D]"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFaqIndex((current) =>
                          current === index ? null : index
                        )
                      }
                      aria-expanded={isOpen}
                      className={`flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-semibold text-cream sm:px-5 ${focusRing}`}
                    >
                      {faq.question}
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
                            {faq.answer}
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
              className={`fx-link mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-orange transition-colors hover:text-orange/80 ${focusRing}`}
            >
              voir la FAQ complète
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* Conseils de la communauté */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-display [font-stretch:125%] text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
              Conseils de la communauté
            </h2>

            <p className="mb-8 mt-2 max-w-xl text-[15px] leading-relaxed text-cream/60">
              Trois réflexes que les membres arrivés avant toi répètent le plus
              souvent.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {communityTips.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.tip}
                    className="flex flex-col rounded-2xl border border-cream/8 bg-[#0C222D] p-5"
                  >
                    <Icon size={22} className="text-orange" />

                    <h3 className="font-display [font-stretch:125%] mt-3 text-[17px] font-extrabold text-cream">
                      {item.tip}
                    </h3>

                    <p className="mt-2 flex-1 text-[13px] leading-relaxed text-cream/70">
                      {item.details}
                    </p>

                    <span className="mt-4 text-[12px] font-semibold text-cream/55">
                      — {item.author}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pour aller plus loin */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-display [font-stretch:125%] text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
              Pour aller plus loin
            </h2>

            <p className="mb-8 mt-2 max-w-xl text-[15px] leading-relaxed text-cream/60">
              Le détail de chaque fonctionnalité citée dans le guide, sur sa
              propre page.
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  className={`flex items-center justify-between gap-3 rounded-2xl border border-cream/8 bg-[#0C222D] px-4 py-3.5 text-sm font-semibold text-cream transition-colors hover:border-orange/30 ${focusRing}`}
                >
                  {page.label}
                  <ArrowRight size={14} className="shrink-0 text-orange" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="px-4 py-12 sm:px-6 sm:py-14 lg:px-16">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 rounded-3xl border border-orange/25 bg-[#0C222D] p-7 text-center sm:p-11 lg:flex-row lg:text-left">
            <div>
              <h2 className="font-display [font-stretch:125%] mb-1.5 text-xl font-extrabold text-cream sm:text-2xl">
                Prêt à commencer ton parcours ?
              </h2>
              <p className="text-sm text-cream/60">
                Rejoins des hommes qui créent des connexions authentiques grâce
                à Sfera&apos;Solys.
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/auth?mode=register"
                className={`fx-btn rounded-xl bg-orange px-7 py-3.5 text-sm font-bold text-abyss transition-colors hover:bg-orange/90 ${focusRing}`}
              >
                commencer maintenant
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
