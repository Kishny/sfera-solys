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
  Users,
  Play,
} from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HexagonSix from '@/components/icons/HexagonSix';
import EclipseMark from '@/components/brand/EclipseMark';
import GrainOverlay from '@/components/brand/GrainOverlay';
import DossierParcours from '@/components/brand/DossierParcours';
import {
  AnnuairePreview,
  CircleOfSixPreview,
} from '@/components/brand/InterfacePreviews';
import type { PublicTestimonial } from '@/components/testimonials/TestimonialCard';

/**
 * Page d'accueil Sfera'Solys — direction « nuit cuivrée ».
 *
 * ## Ce qui change par rapport à l'éclipse solaire
 *
 * La passe de fondations avait remplacé les couleurs et la typographie sans
 * toucher à la mise en page. Celle-ci reprend la page d'après la maquette :
 *
 * - **La photo porte le héros.** Elle occupait un cadre arrondi posé dans la
 *   colonne de droite ; elle déborde maintenant jusqu'aux bords, et c'est un
 *   voile dégradé qui rend le texte lisible par-dessus. Un cadre arrondi
 *   affiche une photo ; un débord met le lecteur dedans.
 * - **Les titres passent en serif à grande échelle.** Playfair était déjà
 *   chargé, mais toujours appelé avec `font-extrabold` hérité d'Archivo — un
 *   serif à fort contraste en graisse maximale devient une masse noire. Les
 *   titres sont en graisse normale, à des tailles beaucoup plus grandes.
 * - **Les cartes de fonctionnalités ont une image.** Elles étaient quatre
 *   aplats avec une icône. Le filet cuivré règle au passage le problème noté
 *   dans tailwind.config.js : `minuit` sur `nuit` ne donne que 1,30:1, une
 *   carte ne peut pas se détacher par son seul remplissage.
 *
 * ## Un arbitrage de copy, signalé
 *
 * La maquette titre « Des rencontres qui ont du sens ». C'est le titre
 * retenu, mais il pourrait servir à n'importe quelle plateforme : il ne dit
 * pas ce qui distingue Solys. Le surtitre porte donc la vérification
 * d'identité, qui est la promesse sur laquelle le reste du site est
 * construit — sans quoi la page d'accueil raconterait autre chose que les
 * cinq suivantes.
 *
 * ## Les photographies
 *
 * Elles viennent de `public/visuels/` (voir son LISEZMOI). Ce sont des
 * images d'ambiance, pas des membres : les textes alternatifs décrivent une
 * scène, jamais une personne vérifiée. La règle « aucun faux membre » vaut
 * aussi pour l'illustration.
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

/** Les trois garanties du héros, reprises de la maquette. */
const garanties = [
  {
    icon: Users,
    titre: '28 ans et plus',
    texte: 'Une communauté mature, un critère d’entrée assumé.',
  },
  {
    icon: ShieldCheck,
    titre: 'Identité vérifiée',
    texte: 'Pièce d’identité et selfie en direct, avant le premier message.',
  },
  {
    icon: HexagonSix,
    titre: 'Six profils par semaine',
    texte: 'Un cercle restreint, choisi — pas un défilement sans fin.',
  },
];

const trustBadges = [
  { icon: IdCard, label: 'Identité vérifiée' },
  { icon: Camera, label: 'Photos authentifiées' },
  { icon: ShieldCheck, label: 'Modération active' },
  { icon: Lock, label: 'Données sécurisées (RGPD)' },
];

/**
 * Aperçu du produit. Quatre entrées suffisent, le reste vit sur
 * /fonctionnalites — descriptions identiques à cette page pour éviter deux
 * discours différents sur le même produit.
 */
const featureTeasers = [
  {
    icon: HexagonSix,
    title: 'Circle of Six',
    description:
      'Six profils choisis par semaine, au lieu de milliers de swipes.',
    href: '/circle',
    image: '/visuels/solys-06.webp',
    alt: "Épaule et nuque d'un homme, en contre-jour doré.",
  },
  {
    icon: Ghost,
    title: 'Mode Fantôme',
    description: "Disparais de l'annuaire sans perdre tes conversations.",
    href: '/mode-fantome',
    image: '/visuels/solys-07.webp',
    alt: "Silhouette d'un homme de dos devant une baie vitrée, à la nuit tombée.",
  },
  {
    icon: Compass,
    title: 'Annuaire',
    description:
      'Un espace personnel pour dire qui tu es sans avoir à te vendre.',
    href: '/fonctionnalites',
    image: '/visuels/solys-03.webp',
    alt: 'Un homme seul sur une terrasse, face aux lumières de la ville.',
  },
  {
    icon: CalendarDays,
    title: 'Événements Solys',
    description: 'Des rencontres encadrées, en ligne et en présentiel.',
    href: '/evenements',
    image: '/visuels/solys-08.webp',
    alt: 'Une réception au bord d’une piscine, lanternes allumées au crépuscule.',
  },
];

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

/** Anneau de focus clavier, identique partout. */
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70 focus-visible:ring-offset-2 focus-visible:ring-offset-nuit';

/** Surtitre en petites capitales, précédé d'un filet cuivré. */
function Surtitre({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-surtitre text-champagne/60">
      <span aria-hidden="true" className="h-px w-8 bg-cuivre" />
      {children}
    </p>
  );
}

export default function Home() {
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);
  const [testimonial, setTestimonial] = useState<PublicTestimonial | null>(null);
  const [testimonialsLoaded, setTestimonialsLoaded] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSiteStats(d.stats);
      })
      .catch(() => {});
  }, []);

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
    transition: { duration: shouldReduceMotion ? 0 : 0.6, ease: 'easeOut' as const },
  };

  return (
    <>
      <Header />

      <GrainOverlay />

      <main id="contenu" className="relative bg-nuit text-champagne">
        {/* ═══════════════ Héros ═══════════════ */}
        <section className="relative isolate overflow-hidden">
          {/*
            La photo déborde. Sur grand écran elle occupe la moitié droite et
            touche les bords ; en dessous, elle passe derrière tout le bloc.
            Dans les deux cas, ce sont les voiles qui rendent le texte
            lisible, pas un recadrage.
          */}
          <div className="absolute inset-0 -z-10 lg:left-[42%]">
            <Image
              src="/visuels/solys-01.webp"
              alt="Deux hommes en costume sur un rooftop, au crépuscule, la ville en contrebas."
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover object-center"
            />

            {/* Fondu vers le fond, pour que la photo n'ait pas de bord net. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-nuit via-nuit/70 to-nuit/30 lg:bg-gradient-to-r lg:from-nuit lg:via-nuit/55 lg:to-transparent"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-nuit to-transparent"
            />
          </div>

          <EclipseMark
            id="hero"
            withCorona
            className="pointer-events-none absolute -right-20 top-4 -z-10 h-[260px] w-[260px] opacity-70 sm:h-[360px] sm:w-[360px] lg:right-[12%] lg:h-[480px] lg:w-[480px]"
          />

          <div className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 lg:px-16 lg:pb-28 lg:pt-40">
            <motion.div {...fadeUp} className="max-w-xl">
              <Surtitre>Plateforme de rencontres vérifiées</Surtitre>

              <h1 className="font-display mt-6 text-[40px] font-normal leading-[1.04] tracking-tight text-ivoire sm:text-[54px] lg:text-[66px]">
                Des rencontres
                <br />
                qui ont <span className="text-cuivre">du sens.</span>
              </h1>

              <p className="mt-5 max-w-md text-[16px] leading-relaxed text-champagne/70 sm:text-[17px]">
                Pour les hommes de 28 ans et plus qui préfèrent la qualité à la
                quantité — et qui savent avec qui ils parlent.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/commencer"
                  className={`inline-flex items-center justify-center gap-2 rounded-xl bg-degrade-cuivre px-7 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
                >
                  Créer mon profil
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/concept"
                  className={`inline-flex items-center justify-center gap-2.5 rounded-xl border border-champagne/20 px-6 py-3.5 text-sm font-semibold text-champagne transition-colors hover:border-cuivre/50 ${focusRing}`}
                >
                  Découvrir le concept
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-champagne/25"
                  >
                    <Play size={10} className="ml-[1px] fill-current" />
                  </span>
                </Link>
              </div>

              {/* Les trois garanties */}
              <ul className="mt-12 grid gap-6 sm:grid-cols-3 sm:gap-5">
                {garanties.map(({ icon: Icon, titre, texte }) => (
                  <li key={titre} className="flex gap-3">
                    <Icon
                      size={20}
                      className="mt-0.5 shrink-0 text-cuivre"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-[13px] font-semibold text-champagne">
                        {titre}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-champagne/55">
                        {texte}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <p className="mt-8 text-[13px] text-champagne/50">
                {siteStats
                  ? `${formatStat(siteStats.membres)} profils vérifiés`
                  : 'des centaines de profils vérifiés'}
              </p>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════ Aperçu du produit ═══════════════ */}
        <section className="border-t border-champagne/8 px-4 py-16 sm:px-6 sm:py-24 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <Surtitre>Ce que tu trouveras</Surtitre>

            <h2 className="font-display mt-5 max-w-2xl text-[30px] font-normal leading-tight tracking-tight text-ivoire sm:text-[38px]">
              La vérification n’est que la porte d’entrée.
            </h2>

            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-champagne/60 sm:text-base">
              Derrière, un produit pensé pour éviter le défilement sans fin.
            </p>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featureTeasers.map((feature) => {
                const Icon = feature.icon;

                return (
                  <Link
                    key={feature.title}
                    href={feature.href}
                    className={`group relative flex flex-col overflow-hidden rounded-2xl border border-cuivre/15 bg-minuit transition-colors hover:border-cuivre/45 ${focusRing}`}
                  >
                    <div className="relative h-36 overflow-hidden">
                      <Image
                        src={feature.image}
                        alt={feature.alt}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-minuit via-minuit/55 to-transparent"
                      />
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <span
                        aria-hidden="true"
                        className="-mt-11 mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-cuivre/40 bg-nuit/85 text-cuivre backdrop-blur-sm"
                      >
                        <Icon size={18} />
                      </span>

                      <h3 className="font-display text-[19px] font-normal text-ivoire">
                        {feature.title}
                      </h3>

                      <p className="mt-2 flex-1 text-[13px] leading-relaxed text-champagne/60">
                        {feature.description}
                      </p>

                      <span
                        aria-hidden="true"
                        className="mt-5 flex h-8 w-8 items-center justify-center self-end rounded-full border border-cuivre/35 text-cuivre transition-colors group-hover:border-cuivre group-hover:bg-cuivre group-hover:text-nuit"
                      >
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <Link
              href="/fonctionnalites"
              className={`mt-8 inline-flex items-center gap-1.5 text-[13px] font-semibold text-cuivre transition-colors hover:text-champagne ${focusRing}`}
            >
              voir toutes les fonctionnalités
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* ═══════════════ Comment ça marche ═══════════════ */}
        <section className="border-t border-champagne/8 px-4 py-16 sm:px-6 sm:py-24 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <Surtitre>Le parcours</Surtitre>

            <h2 className="font-display mt-5 text-[30px] font-normal leading-tight tracking-tight text-ivoire sm:text-[38px]">
              Comment ça marche
            </h2>

            <p className="mb-8 mt-4 max-w-2xl text-[15px] leading-relaxed text-champagne/60 sm:text-base">
              Quatre étapes, et un dossier qui se remplit à mesure.{' '}
              <span className="text-champagne/80">Clique une étape</span> pour
              voir l&apos;état du dossier à ce moment-là.
            </p>

            <DossierParcours />
          </div>
        </section>

        {/* ═══════════════ À quoi ça ressemble ═══════════════ */}
        <section className="border-t border-champagne/8 px-4 py-16 sm:px-6 sm:py-24 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <Surtitre>Dans l’application</Surtitre>

            <h2 className="font-display mt-5 text-[30px] font-normal leading-tight tracking-tight text-ivoire sm:text-[38px]">
              À quoi ça ressemble
            </h2>

            <p className="mb-10 mt-4 max-w-xl text-[15px] leading-relaxed text-champagne/60 sm:text-base">
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

        {/* ═══════════════ Bandeau confiance ═══════════════ */}
        <section className="border-t border-champagne/8 px-4 py-12 sm:px-6 sm:py-16 lg:px-16">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {trustBadges.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col gap-2.5 rounded-2xl border border-cuivre/15 bg-minuit p-4 sm:p-[18px]"
              >
                <Icon size={18} className="text-cuivre" aria-hidden="true" />
                <span className="text-[13px] font-semibold text-champagne">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════ Pourquoi 28 ans et plus ═══════════════ */}
        <section className="relative overflow-hidden border-t border-champagne/8 px-4 py-16 sm:px-6 sm:py-24 lg:px-16">
          <EclipseMark
            id="age"
            className="pointer-events-none absolute -left-32 bottom-[-18%] h-[380px] w-[380px] rotate-[200deg] opacity-25 lg:left-[-6%] lg:h-[460px] lg:w-[460px]"
          />

          <div className="relative mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
            <div>
              <Surtitre>Le critère d’entrée</Surtitre>

              <h2 className="font-display mt-5 text-[30px] font-normal leading-tight tracking-tight text-ivoire sm:text-[38px]">
                Pourquoi 28 ans et plus ?
              </h2>

              <p className="mt-5 text-[15px] leading-relaxed text-champagne/65 sm:text-base">
                Parce qu&apos;une plateforme qui accepte tout le monde finit par
                ne convenir à personne. À partir de 28 ans, on ne cherche plus
                la même chose qu&apos;à 20 : on a un métier, un rythme, une idée
                assez claire de ce qu&apos;on veut construire — et peu de
                patience pour les profils qui ne mènent nulle part.
              </p>

              <p className="mt-3 text-[15px] leading-relaxed text-champagne/65 sm:text-base">
                Ce critère d&apos;âge n&apos;est pas un filtre de prestige.
                C&apos;est ce qui permet à tout le monde ici d&apos;arriver avec
                les mêmes attentes.
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
                  className="rounded-2xl border border-cuivre/15 bg-minuit p-4 sm:p-5"
                >
                  <p className="flex items-start gap-2.5 text-sm font-semibold text-champagne">
                    <span
                      aria-hidden="true"
                      className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-cuivre"
                    />
                    {item.title}
                  </p>
                  <p className="mt-1.5 pl-[16px] text-[13px] leading-relaxed text-champagne/60">
                    {item.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ═══════════════ Témoignage ═══════════════ */}
        <section className="border-t border-champagne/8 px-4 py-20 text-center sm:px-6 sm:py-28">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
            <span aria-hidden="true" className="h-px w-12 bg-cuivre" />

            {testimonial ? (
              <>
                <p className="font-display text-[24px] font-normal italic leading-[1.45] text-ivoire sm:text-[32px]">
                  « {testimonial.content} »
                </p>
                <span className="text-[13px] text-champagne/55">
                  — {testimonial.authorName}
                  {testimonial.age ? `, ${testimonial.age} ans` : ''}
                  {testimonial.city ? ` · ${testimonial.city}` : ''}
                </span>
              </>
            ) : testimonialsLoaded ? (
              <p className="text-sm text-champagne/55">
                Les premiers témoignages arrivent bientôt.
              </p>
            ) : (
              <p className="text-sm text-champagne/55">Chargement…</p>
            )}

            <Link
              href="/temoignages"
              className={`mt-1 inline-flex items-center gap-1.5 text-[13px] font-semibold text-cuivre transition-colors hover:text-champagne ${focusRing}`}
            >
              voir tous les témoignages
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* ═══════════════ FAQ ═══════════════ */}
        <section className="border-t border-champagne/8 px-4 py-16 sm:px-6 sm:py-24 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <Surtitre>Avant de commencer</Surtitre>

            <h2 className="font-display mb-9 mt-5 text-[30px] font-normal leading-tight tracking-tight text-ivoire sm:text-[38px]">
              Les trois questions qu&apos;on nous pose
            </h2>

            <div className="space-y-2">
              {homeFaqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;

                return (
                  <div
                    key={faq.question}
                    className="overflow-hidden rounded-2xl border border-cuivre/15 bg-minuit"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFaqIndex((current) =>
                          current === index ? null : index
                        )
                      }
                      aria-expanded={isOpen}
                      className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-champagne ${focusRing}`}
                    >
                      {faq.question}
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
                          transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="border-t border-cuivre/10 px-5 py-4 text-[13px] leading-relaxed text-champagne/65">
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
              className={`mt-7 inline-flex items-center gap-1.5 text-[13px] font-semibold text-cuivre transition-colors hover:text-champagne ${focusRing}`}
            >
              voir la FAQ complète
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* ═══════════════ Appel final ═══════════════ */}
        <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-16">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-cuivre/25">
            <Image
              src="/visuels/solys-04.webp"
              alt=""
              aria-hidden="true"
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-nuit via-nuit/90 to-nuit/60"
            />

            <div className="relative flex flex-col items-start justify-between gap-7 p-8 sm:p-12 lg:flex-row lg:items-center">
              <div>
                <h2 className="font-display text-[26px] font-normal leading-tight text-ivoire sm:text-[32px]">
                  Prêt à rencontrer sérieusement ?
                </h2>
                <p className="mt-2 text-sm text-champagne/65">
                  Constitution du dossier gratuite, sans engagement.
                </p>
              </div>

              <Link
                href="/commencer"
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl bg-degrade-cuivre px-7 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
              >
                Créer mon profil
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
