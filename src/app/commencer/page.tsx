'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  CreditCard,
  IdCard,
  Lock,
  MessageCircle,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

/**
 * Page /commencer Sfera'Solys — direction A (« dossier de vérification »).
 *
 * Restructuration + rebranding (voir CLAUDE.md § Restructuration) :
 * cette page n'avait jamais été rebrandée — dégradé violet plein écran,
 * orbes animées (`OrbitGlow`), parallax sur le hero, emojis décoratifs,
 * quatre dégradés différents par bloc, ancien nom de marque partout, et
 * une copy au féminin qui présumait en plus l'orientation du lecteur.
 *
 * Ce qui change ici : fond abyss, un seul accent (vulcanico), lime réservé
 * aux puces de validation, hiérarchie institutionnelle. Le survol en
 * 4 étapes reste sur la home ; ici on donne le détail concret de chaque
 * étape (onglets pilotables au clavier) et on met la vérification
 * obligatoire — Stripe Identity, immédiate, gratuite — au centre de la page.
 *
 * Ce qui ne change pas : le parcours d'inscription, les bénéfices, la FAQ,
 * le chargement de /api/stats et les destinations des CTA (l'inscription
 * elle-même se fait sur /auth?mode=register).
 */

interface SiteStats {
  membres: number;
  matchs: number;
  messages: number;
  evenements: number;
}

/**
 * Formate les gros chiffres pour un affichage plus propre.
 * 1200 => 1.2K+ · 1000 => 1K+ · 0 => —
 */
function formatStat(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K+';
  if (n === 0) return '—';
  return n.toString();
}

type JourneyStep = {
  number: number;
  title: string;
  duration: string;
  summary: string;
  details: string;
  checklist: string[];
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
};

/** Le parcours d'inscription, détaillé — l'ordre suit le stepper de la home. */
const journey: JourneyStep[] = [
  {
    number: 1,
    title: 'Créer ton profil',
    duration: '10 minutes',
    summary: 'Partage ce qui te définit vraiment.',
    details:
      "Tu renseignes tes centres d'intérêt, tes valeurs et ce que tu recherches. Pas de questionnaire interminable : dix minutes suffisent, et tu peux compléter ton profil plus tard.",
    checklist: [
      "Tes centres d'intérêt, tes valeurs et tes intentions",
      'Trois photos récentes minimum, non retouchées',
      'Ta ville et le rayon dans lequel tu cherches',
    ],
    icon: Users,
  },
  {
    number: 2,
    title: "Vérifier ton identité",
    duration: 'immédiat',
    summary: 'Document officiel et selfie en direct, comparés aussitôt.',
    details:
      "Tu photographies ta pièce d'identité, puis ton visage en direct. Stripe Identity compare les deux et répond dans la foulée : ton profil s'active sans attente. La vérification est gratuite et obligatoire — c'est elle qui rend la plateforme fiable. L'inscription est réservée aux hommes de 28 ans et plus.",
    checklist: [
      "Une pièce d'identité en cours de validité",
      'Un selfie de contrôle, jamais publié sur ton profil',
      'Une réponse immédiate, sans frais',
    ],
    icon: IdCard,
  },
  {
    number: 3,
    title: 'Découvrir ton Circle of Six',
    duration: 'chaque semaine',
    summary: 'Six profils vérifiés qui te correspondent.',
    details:
      "Dès ton dossier validé, l'algorithme d'affinité te présente six profils vérifiés alignés avec tes valeurs et ton rythme de vie. Moins de swipe, plus de sens.",
    checklist: [
      'Six profils vérifiés proposés par semaine',
      'Une sélection basée sur les valeurs, pas sur le volume',
      'Des filtres pour affiner (distance, disponibilité…)',
    ],
    icon: Sparkles,
  },
  {
    number: 4,
    title: 'Lancer la première conversation',
    duration: 'quand tu veux',
    summary: 'Un premier échange encadré, à ton rythme.',
    details:
      "Tu envoies ton premier message avec une amorce guidée, pensée pour désamorcer la gêne, ou tu rejoins un événement de la communauté Solys. Le Mode Fantôme te laisse garder la main sur ta visibilité à tout moment.",
    checklist: [
      'Une amorce de conversation guidée',
      'Les événements de la communauté Solys',
      'Le Mode Fantôme pour contrôler ta visibilité',
    ],
    icon: MessageCircle,
  },
];

/** Les trois faits à retenir sur la vérification — le cœur de la promesse. */
const verificationFacts = [
  {
    icon: Clock,
    title: 'Quelques instants',
    description:
      "Le contrôle est automatisé : tu connais le résultat avant d'avoir quitté la page. Aucun dossier ne reste en attente.",
  },
  {
    icon: ShieldCheck,
    title: 'Un document officiel',
    description:
      "Carte d'identité, passeport ou permis, comparés à un selfie pris en direct — pas une photo choisie dans ta galerie.",
  },
  {
    icon: CreditCard,
    title: 'Gratuite, toujours',
    description:
      "Vérifié ne se paie pas. La vérification est incluse dans toutes les offres, gratuite comprise.",
  },
];

/** Bénéfices de la plateforme — repris tels quels de l'ancienne page. */
const benefits = [
  {
    icon: Shield,
    title: 'Sécurité maximale',
    description: 'Modération 24/7 et données protégées.',
  },
  {
    icon: Lock,
    title: 'Contrôle total',
    description: 'Gère ta visibilité comme tu le souhaites.',
  },
  {
    icon: Zap,
    title: 'Matching intelligent',
    description: 'Basé sur les valeurs et les vibes, pas juste les photos.',
  },
  {
    icon: Star,
    title: 'Expérience premium',
    description: 'Interface élégante et expérience fluide.',
  },
];

const faqs = [
  {
    question: "L'inscription est-elle vraiment gratuite ?",
    answer:
      "Oui. L'inscription est gratuite, vérification d'identité comprise. Le compte gratuit est limité : 5 likes par jour, 3 matchs et 10 messages par jour. Les plans payants lèvent ces limites.",
  },
  {
    question: "Combien de temps prend la vérification d'identité ?",
    answer:
      "Quelques instants. Le contrôle passe par Stripe Identity : tu photographies ta pièce d'identité puis ton visage, et la réponse arrive aussitôt. C'est gratuit, quelle que soit ton offre.",
  },
  {
    question: 'Comment fonctionne le Circle of Six ?',
    answer:
      'Chaque semaine, notre algorithme te présente 6 profils vérifiés qui correspondent à tes valeurs et intérêts. Moins de swipe, plus de sens.',
  },
  {
    question: 'Mes données sont-elles protégées ?',
    answer:
      "Oui. Sfera'Solys te donne un contrôle fort sur ta visibilité, tes informations et ton expérience sur la plateforme.",
  },
  {
    question: "Puis-je utiliser Sfera'Solys discrètement ?",
    answer:
      'Oui. Le Mode Fantôme permet de contrôler ta visibilité, de naviguer plus discrètement et de garder le contrôle sur ton rythme.',
  },
];

/** Anneau de focus clavier, identique partout dans la direction A. */
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss';

export default function CommencerPage() {
  /**
   * Étape affichée dans le détail du parcours. L'ancienne page faisait
   * tourner cet état automatiquement toutes les 4s ; on l'a retiré (un
   * onglet qui change tout seul est ingérable au clavier et au lecteur
   * d'écran). L'utilisateur pilote, à la souris ou aux flèches.
   */
  const [step, setStep] = useState(1);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const shouldReduceMotion = useReducedMotion();

  /** Statistiques dynamiques — même source que le reste du site. */
  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSiteStats(d.stats);
      })
      .catch(() => {});
  }, []);

  const activeStep = journey.find((item) => item.number === step) ?? journey[0];
  const ActiveStepIcon = activeStep.icon;

  /** Navigation aux flèches entre les onglets d'étape (pattern tablist). */
  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = journey.length - 1;
    let target: number | null = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      target = index === last ? 0 : index + 1;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      target = index === 0 ? last : index - 1;
    } else if (event.key === 'Home') {
      target = 0;
    } else if (event.key === 'End') {
      target = last;
    }

    if (target === null) return;

    event.preventDefault();
    setStep(journey[target].number);
    tabRefs.current[target]?.focus();
  }

  return (
    <>
      <Header />

      <main id="contenu" className="bg-abyss text-cream">
        {/* Hero */}
        <section className="border-b border-cream/8 px-4 pt-20 sm:px-6 sm:pt-24 lg:px-16 xl:pt-28">
          <div className="mx-auto max-w-3xl py-12 text-center sm:py-16">
            <span className="inline-block rounded-full border border-orange/35 bg-orange/[0.12] px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-cream">
              Inscription gratuite · vérification immédiate
            </span>

            <h1 className="font-display [font-stretch:125%] mt-5 text-[30px] font-extrabold leading-[1.15] tracking-tight text-cream sm:text-[40px]">
              Quatre étapes, un dossier vérifié.
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-cream/60 sm:text-base">
              Tu constitues ton dossier, Stripe Identity vérifie ton identité
              dans la foulée, et ton profil s&apos;active. Aucun paiement demandé
              pour être vérifié — l&apos;inscription est ouverte aux hommes de
              28 ans et plus.
            </p>

            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/auth?mode=register"
                className={`fx-btn rounded-xl bg-orange px-7 py-3.5 text-sm font-bold text-abyss transition-colors hover:bg-orange/90 ${focusRing}`}
              >
                constituer mon dossier
              </Link>

              <Link
                href="/guide"
                className={`fx-ghost rounded-xl border border-cream/15 px-7 py-3.5 text-sm font-bold text-cream/85 transition-colors hover:border-cream/30 ${focusRing}`}
              >
                lire le guide
              </Link>
            </div>

            <p className="mt-5 text-[13px] text-cream/55">
              {siteStats
                ? `${formatStat(siteStats.membres)} profils vérifiés à ce jour`
                : 'des centaines de profils vérifiés à ce jour'}
            </p>
          </div>
        </section>

        {/* Le parcours, étape par étape */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-display [font-stretch:125%] text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
              Le parcours en détail
            </h2>

            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-cream/60">
              Choisis une étape pour voir exactement ce qu&apos;on te demande,
              ce qu&apos;on en fait, et combien de temps ça prend.
            </p>

            <div
              role="tablist"
              aria-label="Étapes du parcours d'inscription"
              className="mt-8 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4"
            >
              {journey.map((item, index) => {
                const isActive = item.number === step;

                return (
                  <button
                    key={item.number}
                    ref={(el) => {
                      tabRefs.current[index] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`etape-onglet-${item.number}`}
                    aria-selected={isActive}
                    aria-controls={`etape-panneau-${item.number}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => setStep(item.number)}
                    onKeyDown={(event) => handleTabKeyDown(event, index)}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${focusRing} ${
                      isActive
                        ? 'border-orange/40 bg-[#0C222D] ring-1 ring-orange/20'
                        : 'border-cream/8 bg-[#0C222D] hover:border-cream/20'
                    }`}
                  >
                    <span
                      className={`font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[14px] font-extrabold ${
                        isActive ? 'bg-orange text-abyss' : 'bg-cream/8 text-cream/55'
                      }`}
                    >
                      {item.number}
                    </span>

                    <span className="min-w-0">
                      <span
                        className={`font-display [font-stretch:125%] block text-[15px] font-bold ${
                          isActive ? 'text-cream' : 'text-cream/70'
                        }`}
                      >
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-cream/55">
                        {item.duration}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              role="tabpanel"
              id={`etape-panneau-${activeStep.number}`}
              aria-labelledby={`etape-onglet-${activeStep.number}`}
              tabIndex={0}
              className={`mt-3 rounded-2xl border border-cream/8 bg-[#0C222D] p-6 sm:p-8 ${focusRing}`}
            >
              <motion.div
                key={activeStep.number}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
                className="grid gap-7 lg:grid-cols-2 lg:gap-12"
              >
                <div>
                  <ActiveStepIcon size={20} className="text-orange" />

                  <h3 className="font-display [font-stretch:125%] mt-3 text-[17px] font-extrabold tracking-tight text-cream">
                    Étape {activeStep.number} — {activeStep.title}
                  </h3>

                  <p className="mt-1.5 text-sm font-semibold text-cream/85">
                    {activeStep.summary}
                  </p>

                  <p className="mt-3 text-[13px] leading-relaxed text-cream/70">
                    {activeStep.details}
                  </p>
                </div>

                <div className="border-t border-cream/8 pt-6 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-cream/55">
                    Concrètement
                  </p>

                  <ul className="mt-4 space-y-2.5">
                    {activeStep.checklist.map((entry) => (
                      <li key={entry} className="flex items-start gap-2.5">
                        <Check size={14} className="mt-[3px] shrink-0 text-lime" />
                        <span className="text-[13px] leading-relaxed text-cream/70">
                          {entry}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* La vérification, en clair */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-display [font-stretch:125%] text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
              La vérification, en clair
            </h2>

            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-cream/60">
              C&apos;est l&apos;étape qui prend le plus de temps, et c&apos;est
              volontaire : chaque dossier est ouvert et relu par une personne
              avant l&apos;activation du profil.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {verificationFacts.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-cream/8 bg-[#0C222D] p-5 sm:p-6"
                >
                  <Icon size={20} className="text-orange" />

                  <h3 className="font-display [font-stretch:125%] mt-3 text-[17px] font-extrabold tracking-tight text-cream">
                    {title}
                  </h3>

                  <p className="mt-2 text-[13px] leading-relaxed text-cream/70">
                    {description}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-[13px] text-cream/55">
              {siteStats
                ? `${formatStat(siteStats.matchs)} mises en relation depuis l'ouverture de la plateforme.`
                : 'Des mises en relation chaque semaine, entre profils vérifiés uniquement.'}
            </p>
          </div>
        </section>

        {/* Bénéfices */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-display [font-stretch:125%] text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
              Ce que tu y gagnes
            </h2>

            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-cream/60">
              Une plateforme de rencontres pensée pour les hommes de 28 ans et
              plus, où chaque profil en face de toi a passé le même contrôle que
              le tien.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-cream/8 bg-[#0C222D] p-5 sm:p-6"
                >
                  <Icon size={18} className="text-orange" />

                  <h3 className="font-display [font-stretch:125%] mt-3 text-[17px] font-extrabold tracking-tight text-cream">
                    {title}
                  </h3>

                  <p className="mt-2 text-[13px] leading-relaxed text-cream/70">
                    {description}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-[13px] text-cream/55">
              Besoin du détail fonctionnalité par fonctionnalité ?{' '}
              <Link
                href="/fonctionnalites"
                className={`fx-link font-semibold text-orange transition-colors hover:text-orange/80 ${focusRing}`}
              >
                Voir toutes les fonctionnalités
              </Link>
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display [font-stretch:125%] mb-8 text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
              Avant de commencer
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
                        setOpenFaqIndex((current) => (current === index ? null : index))
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
                Ton dossier commence maintenant.
              </h2>
              <p className="text-sm text-cream/60">
                Dix minutes pour le constituer, quelques instants pour la
                vérification. Gratuit, sans engagement, sans carte bancaire.
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/auth?mode=register"
                className={`fx-btn rounded-xl bg-orange px-7 py-3.5 text-sm font-bold text-abyss transition-colors hover:bg-orange/90 ${focusRing}`}
              >
                constituer mon dossier
              </Link>

              <Link
                href="/tarifs"
                className={`fx-link inline-flex items-center gap-1.5 text-[13px] font-semibold text-orange transition-colors hover:text-orange/80 ${focusRing}`}
              >
                voir les offres
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
