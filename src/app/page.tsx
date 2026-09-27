'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  IdCard,
  Camera,
  ShieldCheck,
  Lock,
  ArrowRight,
  ChevronDown,
  Ghost,
  Compass,
  CalendarDays,
} from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HexagonSix from '@/components/icons/HexagonSix';
import EclipseMark from '@/components/brand/EclipseMark';
import GrainOverlay from '@/components/brand/GrainOverlay';
import VerificationSeal from '@/components/brand/VerificationSeal';
import DossierParcours from '@/components/brand/DossierParcours';
import {
  AnnuairePreview,
  CircleOfSixPreview,
} from '@/components/brand/InterfacePreviews';
import type { PublicTestimonial } from '@/components/testimonials/TestimonialCard';

/**
 * Page d'accueil Sfera'Solys — direction A (« dossier de vérification »).
 *
 * Restructuration (voir CLAUDE.md § Restructuration de l'architecture) :
 * refonte complète de la structure, pas seulement des couleurs. On quitte
 * la home très décorative héritée de Sfera'Solys (orbes, parallax, grain,
 * grille de 6 fonctionnalités, ADN en accordéon...) pour une narration
 * institutionnelle en 5 temps, sobre et orientée confiance : hero avec
 * sceau de vérification, étapes du parcours, bandeau de garanties, un
 * seul témoignage édité, un seul appel à l'action final.
 *
 * Les fonctionnalités (Circle of Six, Mode Fantôme, VibeSphere...) ne
 * disparaissent pas : elles restent accessibles depuis /fonctionnalites
 * (lien "comment ça marche" du header) plutôt que d'être toutes listées
 * ici — cf. maquette DirA-Home dans le canvas de maquettes.
 */

interface SiteStats {
  membres: number;
  matchs: number;
  messages: number;
  evenements: number;
}

function formatStat(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K+';
  if (n === 0) return '—';
  return n.toString();
}


const trustBadges = [
  { icon: IdCard, label: 'Identité vérifiée' },
  { icon: Camera, label: 'Photos authentifiées' },
  { icon: ShieldCheck, label: 'Modération active' },
  { icon: Lock, label: 'Données sécurisées (RGPD)' },
];

/**
 * Aperçu du produit. La home ne listait plus aucune fonctionnalité depuis
 * la refonte : un visiteur comprenait la promesse de vérification, mais pas
 * ce qu'il allait réellement utiliser. Quatre entrées suffisent, le reste
 * vit sur /fonctionnalites — descriptions identiques à cette page pour
 * éviter deux discours différents sur le même produit.
 */
const featureTeasers = [
  {
    icon: HexagonSix,
    title: 'Circle of Six',
    description:
      'Six profils choisis par semaine, au lieu de milliers de swipes.',
    href: '/circle',
  },
  {
    icon: Ghost,
    title: 'Mode Fantôme',
    description:
      'Photos floutées et pseudonyme : tu décides quand te révéler.',
    href: '/mode-fantome',
  },
  {
    icon: Compass,
    title: 'VibeSphere',
    description:
      'Un espace personnel pour dire qui tu es sans avoir à te vendre.',
    href: '/vibesphere',
  },
  {
    icon: CalendarDays,
    title: 'Événements Solys',
    description:
      'Des rencontres encadrées, en ligne et en présentiel.',
    href: '/evenements',
  },
];

/**
 * FAQ courte. Volontairement limitée aux trois questions qui bloquent une
 * inscription. Les réponses reprennent celles de /tarifs et /commencer, pour
 * ne pas créer de contradiction entre les pages.
 *
 * À noter : ces trois questions-là n'existent pas encore dans /faq, qui en
 * compte douze et n'aborde pas le délai de vérification — c'est pourtant
 * probablement la première question que se pose un visiteur. À arbitrer :
 * soit on les ajoute à /faq, soit on assume que /faq traite d'autres sujets.
 */
const homeFaqs = [
  {
    question: "Combien de temps prend la vérification d'identité ?",
    answer:
      "Quelques instants. Tu photographies ta pièce d'identité puis ton visage en direct, Stripe Identity compare les deux et répond aussitôt. C'est gratuit, quelle que soit ton offre.",
  },
  {
    question: "L'inscription est-elle vraiment gratuite ?",
    answer:
      "Oui, vérification comprise. Le compte gratuit est limité (5 likes par jour, 3 matchs, 10 messages par jour) et les offres payantes lèvent ces limites — mais être vérifié ne se paie jamais.",
  },
  {
    question: 'Puis-je annuler à tout moment ?',
    answer:
      "Oui, depuis ton espace Mon Compte, sans engagement. Tu conserves l'accès premium jusqu'à la fin de la période déjà payée.",
  },
];

/** Anneau de focus clavier, identique partout dans la direction A. */
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss';

export default function Home() {
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);
  const [testimonial, setTestimonial] = useState<PublicTestimonial | null>(null);
  const [testimonialsLoaded, setTestimonialsLoaded] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const shouldReduceMotion = useReducedMotion();

  /**
   * Statistiques dynamiques (nombre de membres) — même source que
   * l'ancienne home, on garde la fonctionnalité, on change juste ce
   * qu'on en affiche (un seul chiffre, dans le hero, pas 4 tuiles).
   */
  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSiteStats(d.stats);
      })
      .catch(() => {});
  }, []);

  /**
   * Un seul témoignage mis en avant : on privilégie un témoignage
   * "à la une" s'il y en a un, sinon le premier de la liste. Le reste
   * de la fonctionnalité (grille complète, carrousel) reste disponible
   * sur /temoignages.
   */
  useEffect(() => {
    fetch('/api/testimonials')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.testimonials) && d.testimonials.length > 0) {
          const featured = d.testimonials.find((t: PublicTestimonial) => t.featured);
          setTestimonial(featured || d.testimonials[0]);
        }
      })
      .catch(() => {})
      .finally(() => setTestimonialsLoaded(true));
  }, []);

  const fadeUp = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0 : 0.5, ease: 'easeOut' as const },
  };

  return (
    <>
      <Header />

      {/* id="contenu" : cible du lien d'évitement du header. À reprendre
          sur chaque page au fur et à mesure de leur migration. */}
      <GrainOverlay />

      <main id="contenu" className="relative bg-abyss text-cream">
        {/* Hero institutionnel */}
        <section className="relative overflow-hidden border-b border-cream/8 px-4 pt-20 sm:px-6 sm:pt-24 lg:px-16 xl:pt-28">
          {/* Décor : éclipse de marque + halo, derrière le contenu */}
          <EclipseMark
            id="hero"
            withCorona
            className="pointer-events-none absolute -right-16 -top-8 h-[240px] w-[240px] text-orange/[0.08] sm:-right-10 sm:h-[340px] sm:w-[340px] lg:right-[7%] lg:top-4 lg:h-[460px] lg:w-[460px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 h-[340px] w-[680px] -translate-x-1/2 rounded-full bg-orange/[0.06] blur-[110px]"
          />

          <div className="relative mx-auto flex max-w-7xl flex-col-reverse items-center gap-10 py-12 sm:gap-14 sm:py-16 lg:flex-row lg:gap-10 lg:py-20">
            {/*
              `items-center lg:items-start` : en colonne flex, `items-start`
              seul faisait rétrécir chaque bloc à la largeur de son contenu
              tout en centrant le texte à l'intérieur — d'où des blocs de
              largeurs irrégulières sur mobile. On centre vraiment sur
              mobile, on aligne à gauche à partir de lg.
            */}
            <motion.div
              {...fadeUp}
              className="flex w-full max-w-xl flex-1 flex-col items-center gap-5 text-center lg:items-start lg:text-left"
            >
              <span className="w-fit rounded-full border border-orange/35 bg-orange/[0.12] px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-orange">
                Vérification immédiate · hommes 28+
              </span>

              <h1 className="font-display [font-stretch:125%] text-[32px] font-extrabold leading-[1.15] tracking-tight text-cream sm:text-[40px] lg:text-[46px]">
                Un dossier vérifié avant chaque rencontre.
              </h1>

              <p className="max-w-md text-[15px] leading-relaxed text-cream/60 sm:text-base">
                Pièce d'identité et selfie en direct, vérifiés par Stripe
                Identity avant le premier message. Pas de faux comptes, et
                aucune attente : le résultat tombe dans la minute.
              </p>

              <div className="mt-1 flex flex-col items-center gap-3 sm:flex-row">
                <Link
                  href="/commencer"
                  className="rounded-xl bg-orange px-7 py-3.5 text-sm font-bold text-abyss transition-colors hover:bg-orange/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss"
                >
                  Constituer mon dossier
                </Link>

                <span className="text-[13px] text-cream/55">
                  {siteStats
                    ? `${formatStat(siteStats.membres)} profils vérifiés`
                    : 'des centaines de profils vérifiés'}
                </span>
              </div>
            </motion.div>

            {/*
              Photo d'ambiance. Trois couches par-dessus l'image, et chacune
              a une raison d'être :
              — un halo vulcanico derrière, pour que le bloc ne soit pas une
                vignette posée sur du vide ;
              — un dégradé vers `abyss` en bas, pour que la photo se fonde
                dans la page au lieu d'y coller un rectangle net ;
              — un voile orange très léger en `mix-blend-overlay`, qui tire
                les ors déjà présents dans la photo vers la palette.

              Le sceau de vérification passe en tampon sur l'angle : c'est la
              marque qui se pose sur l'image, pas une étiquette sur l'homme
              photographié — la règle « aucun faux membre » tient toujours.
            */}
            <motion.div
              initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: 'easeOut' }}
              className="relative flex w-full flex-1 justify-center lg:justify-end"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-8 rounded-[3rem] bg-orange/[0.10] blur-[70px]"
              />

              <figure className="relative w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[510px]">
                <div className="relative overflow-hidden rounded-[2rem] border border-cream/10 shadow-[0_45px_100px_-35px_rgba(0,0,0,0.95)]">
                  <Image
                    src="/images/hero-img.png"
                    alt="Un homme en costume, accoudé au bar d'un établissement feutré, un verre à la main."
                    width={1122}
                    height={1402}
                    priority
                    sizes="(max-width: 640px) 85vw, (max-width: 1024px) 400px, 510px"
                    className="h-full w-full object-cover"
                  />

                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-abyss via-abyss/25 to-transparent"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange/15 via-transparent to-transparent mix-blend-overlay"
                  />
                </div>

                <div className="absolute -bottom-6 -left-4 flex h-[86px] w-[86px] items-center justify-center rounded-full border border-cream/10 bg-abyss shadow-[0_18px_40px_-12px_rgba(0,0,0,0.9)] sm:-left-6 sm:h-[104px] sm:w-[104px]">
                  <VerificationSeal className="h-[62px] w-[62px] sm:h-[76px] sm:w-[76px]" />
                </div>
              </figure>
            </motion.div>
          </div>
        </section>

        {/* Comment ça marche : le dossier se constitue */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-display [font-stretch:125%] text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
              Comment ça marche
            </h2>

            <p className="mb-6 mt-2 max-w-2xl text-[15px] leading-relaxed text-cream/60">
              Quatre étapes, et un dossier qui se remplit à mesure.{' '}
              <span className="text-cream/75">Clique une étape</span> pour voir
              l&apos;état du dossier à ce moment-là.
            </p>

            <DossierParcours />
          </div>
        </section>

        {/* Aperçu du produit */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-display [font-stretch:125%] text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
              Et une fois vérifié ?
            </h2>

            <p className="mb-8 mt-2 max-w-xl text-[15px] leading-relaxed text-cream/60">
              La vérification n&apos;est que la porte d&apos;entrée. Derrière,
              un produit pensé pour éviter le défilement sans fin.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featureTeasers.map((feature) => {
                const Icon = feature.icon;

                return (
                  <Link
                    key={feature.title}
                    href={feature.href}
                    className={`group flex flex-col rounded-2xl border border-cream/8 bg-[#0C222D] p-5 transition-colors hover:border-orange/30 ${focusRing}`}
                  >
                    <Icon size={22} className="text-orange" />

                    <h3 className="font-display [font-stretch:125%] mt-3 text-[17px] font-extrabold text-cream">
                      {feature.title}
                    </h3>

                    <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-cream/60">
                      {feature.description}
                    </p>

                    <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-orange">
                      en savoir plus
                      <ArrowRight size={13} />
                    </span>
                  </Link>
                );
              })}
            </div>

            <Link
              href="/fonctionnalites"
              className={`mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-orange transition-colors hover:text-orange/80 ${focusRing}`}
            >
              voir toutes les fonctionnalités
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* À quoi ressemble l'espace membre */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-display [font-stretch:125%] text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
              À quoi ça ressemble
            </h2>

            <p className="mb-9 mt-2 max-w-xl text-[15px] leading-relaxed text-cream/60">
              Deux façons de parcourir les profils, au choix : six propositions
              par semaine, ou l&apos;annuaire complet quand tu veux prendre le
              temps.
            </p>

            <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
              <motion.div
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: 'easeOut' }}
              >
                <CircleOfSixPreview />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.5,
                  delay: shouldReduceMotion ? 0 : 0.1,
                  ease: 'easeOut',
                }}
              >
                <AnnuairePreview />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Bandeau confiance */}
        <section className="border-b border-cream/8 px-4 py-12 sm:px-6 sm:py-14 lg:px-16">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {trustBadges.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col gap-2.5 rounded-2xl border border-cream/8 bg-[#0C222D] p-4 sm:p-[18px]"
              >
                <Icon size={18} className="text-orange" />
                <span className="text-[13px] font-semibold text-cream">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Pourquoi 28 ans et plus */}
        <section className="relative overflow-hidden border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <EclipseMark
            id="age"
            className="pointer-events-none absolute -left-32 bottom-[-18%] h-[380px] w-[380px] rotate-[200deg] text-lime/[0.05] lg:left-[-6%] lg:h-[460px] lg:w-[460px]"
          />

          <div className="relative mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
            <div>
              <h2 className="font-display [font-stretch:125%] text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
                Pourquoi 28 ans et plus ?
              </h2>

              <p className="mt-4 text-[15px] leading-relaxed text-cream/60 sm:text-base">
                Parce qu&apos;une plateforme qui accepte tout le monde finit
                par ne convenir à personne. À partir de 28 ans, on ne cherche
                plus la même chose qu&apos;à 20 : on a un métier, un rythme,
                une idée assez claire de ce qu&apos;on veut construire — et
                peu de patience pour les profils qui ne mènent nulle part.
              </p>

              <p className="mt-3 text-[15px] leading-relaxed text-cream/60 sm:text-base">
                Ce critère d&apos;âge n&apos;est pas un filtre de prestige.
                C&apos;est ce qui permet à tout le monde ici d&apos;arriver
                avec les mêmes attentes.
              </p>
            </div>

            <ul className="flex flex-col gap-3">
              {[
                {
                  title: 'Des intentions dites franchement',
                  text: 'Chaque profil précise ce qu’il cherche. Personne n’a à deviner.',
                },
                {
                  title: 'Un rythme d’adulte',
                  text: 'Pas de notifications qui harcèlent, pas de score à entretenir tous les jours.',
                },
                {
                  title: 'Une porte, pas un tourniquet',
                  text: 'Devoir prouver son identité décourage ceux qui passaient juste pour voir.',
                },
              ].map((item) => (
                <li
                  key={item.title}
                  className="rounded-2xl border border-cream/8 bg-[#0C222D] p-4 sm:p-5"
                >
                  <p className="flex items-start gap-2 text-sm font-semibold text-cream">
                    <span
                      aria-hidden="true"
                      className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-lime"
                    />
                    {item.title}
                  </p>
                  <p className="mt-1.5 pl-[14px] text-[13px] leading-relaxed text-cream/60">
                    {item.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Témoignage éditorial unique */}
        <section className="border-b border-cream/8 px-4 py-16 text-center sm:px-6 sm:py-20">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-5">
            <span className="h-[2px] w-10 bg-orange" />

            {testimonial ? (
              <>
                <p className="font-accent text-[22px] italic leading-[1.5] text-cream sm:text-[26px]">
                  « {testimonial.content} »
                </p>
                <span className="text-[13px] text-cream/55">
                  — {testimonial.authorName}
                  {testimonial.age ? `, ${testimonial.age} ans` : ''}
                  {testimonial.city ? ` · ${testimonial.city}` : ''}
                </span>
              </>
            ) : testimonialsLoaded ? (
              <p className="text-sm text-cream/55">
                Les premiers témoignages arrivent bientôt.
              </p>
            ) : (
              <p className="text-sm text-cream/55">Chargement…</p>
            )}

            <Link
              href="/temoignages"
              className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-semibold text-orange transition-colors hover:text-orange/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss"
            >
              voir tous les témoignages
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* FAQ courte */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display [font-stretch:125%] mb-8 text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
              Les trois questions qu&apos;on nous pose
            </h2>

            <div className="space-y-1.5">
              {homeFaqs.map((faq, index) => {
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
              className={`mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-orange transition-colors hover:text-orange/80 ${focusRing}`}
            >
              voir la FAQ complète
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* CTA final */}
        <section className="relative overflow-hidden px-4 py-12 sm:px-6 sm:py-14 lg:px-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-1/2 h-[280px] w-[620px] -translate-x-1/2 rounded-full bg-orange/[0.07] blur-[100px]"
          />

          <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 overflow-hidden rounded-3xl border border-orange/25 bg-[#0C222D] p-7 text-center sm:p-11 lg:flex-row lg:text-left">
            <EclipseMark
              id="cta"
              className="pointer-events-none absolute -right-10 -top-16 h-[240px] w-[240px] text-orange/[0.06]"
            />

            <div>
              <h3 className="font-display [font-stretch:125%] mb-1.5 text-xl font-extrabold text-cream sm:text-2xl">
                Prêt à rencontrer sérieusement ?
              </h3>
              <p className="text-sm text-cream/60">
                Constitution du dossier gratuite, sans engagement.
              </p>
            </div>

            <Link
              href="/commencer"
              className="shrink-0 rounded-xl bg-orange px-7 py-3.5 text-sm font-bold text-abyss transition-colors hover:bg-orange/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss"
            >
              commencer
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
