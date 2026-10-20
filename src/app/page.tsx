'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  IdCard,
  ShieldCheck,
  Lock,
  ArrowRight,
  ChevronDown,
  Ghost,
  CalendarDays,
  Users,
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
    /*
      Disait « avant le premier message ». Rien dans le code ne l'impose :
      `identityVerified` est lu pour afficher un badge, jamais pour bloquer
      une action. La phrase décrit maintenant ce que la vérification est,
      pas une barrière qui n'existe pas encore.
    */
    texte: 'Pièce d’identité et selfie en direct, comparés par Stripe.',
  },
  {
    icon: HexagonSix,
    titre: 'Six profils par semaine',
    texte: 'Un cercle restreint, choisi — pas un défilement sans fin.',
  },
];

/**
 * Le bandeau de garanties.
 *
 * ## Ce qui a été retiré, et pourquoi
 *
 * C'étaient quatre pastilles sans un mot d'explication. Deux ne tenaient
 * pas :
 *
 * - « Identité vérifiée » répétait mot pour mot une garantie du héros, qui
 *   l'explique, elle. Promettre deux fois la même chose, la seconde fois
 *   sans rien en dire, affaiblit les deux.
 * - « Photos authentifiées » n'existe pas. Aucune validation de photo n'est
 *   présente dans le code : la vérification Stripe compare la pièce
 *   d'identité et le selfie, rien ne compare ensuite les photos du profil à
 *   ce selfie. La pastille promettait une fonctionnalité absente.
 *
 * Restent trois promesses que le code tient, avec la phrase qui leur
 * manquait. Un bandeau qui explique vaut mieux qu'un bandeau qui rassure.
 */
const trustBadges = [
  {
    icon: IdCard,
    label: 'La vérification est gratuite',
    texte:
      'Elle ne dépend d’aucune offre. Passer au premium lève des limites d’usage, jamais le droit d’être vérifié.',
    href: '/tarifs',
    lien: 'voir les offres',
  },
  {
    icon: ShieldCheck,
    label: 'Modération humaine',
    texte:
      'Un signalement n’est pas arbitré par un algorithme : un administrateur l’examine, et un compte peut être suspendu.',
    href: null,
    lien: null,
  },
  {
    icon: Lock,
    label: 'Tes données, nommément',
    texte:
      'Notre page confidentialité nomme un par un les prestataires qui traitent tes données, et ce que chacun en fait.',
    href: '/confidentialite',
    lien: 'lire la page confidentialité',
  },
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

/**
 * Filet de séparation entre deux sections.
 *
 * Les sections étaient séparées par un `border-t` pleine largeur. Sous le
 * héros, dont la photo déborde jusqu'aux bords, cette ligne continue
 * tranchait l'écran au lieu de marquer une respiration — et une fois le
 * défaut corrigé là, les six autres bordures identiques devenaient
 * l'exception.
 *
 * Celui-ci s'arrête à la largeur du contenu et s'éteint à ses deux
 * extrémités : il sépare sans couper.
 */
function Filet() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto h-px max-w-7xl bg-gradient-to-r from-transparent via-champagne/15 to-transparent"
    />
  );
}

export default function Home() {
  const [testimonial, setTestimonial] = useState<PublicTestimonial | null>(null);
  const [testimonialsLoaded, setTestimonialsLoaded] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const shouldReduceMotion = useReducedMotion();

  /*
    Le compteur « N profils vérifiés » est retiré du héros : la maquette ne
    le porte pas, et il affichait « 2 profils vérifiés » en production. Un
    chiffre honnête peut desservir — mieux vaut ne rien annoncer que
    d'annoncer deux. L'appel à /api/stats part avec lui.
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
          <div className="absolute inset-0 -z-20 lg:left-[46%]">
            <Image
              src="/visuels/solys-01-hero.webp"
              alt="Deux hommes en costume sur un rooftop, au crépuscule, la ville en contrebas."
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 56vw"
              /*
                Variante recadrée, pas la photo d'origine. Les deux sujets
                occupent le tiers droit de l'image complète, et le conteneur
                du héros est plus étroit qu'elle : même poussé au maximum,
                `object-position` ne laissait que 164 px de marge et le
                second homme restait au ras du bord. Le recadrage est donc
                fait dans le fichier — 30 % de la largeur retirés à gauche —
                ce qui rapproche vraiment les visages au lieu de déplacer
                une fenêtre trop large.
              */
              className="object-cover object-center"
            />

            {/*
              Le voile n'a qu'un travail : rendre le texte lisible là où il
              passe. Plus sombre que nécessaire, il éteint la photo — et la
              photo est ce qui porte la page.
            */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-nuit via-nuit/75 to-nuit/35 lg:bg-gradient-to-r lg:from-nuit lg:via-nuit/25 lg:to-transparent"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-nuit to-transparent"
            />
          </div>

          {/*
            Pas d'éclipse dessinée ici : la photographie en porte déjà une
            dans le ciel. Deux éclipses dans le même écran, c'est une de
            trop — et la version SVG débordait sous l'en-tête, où elle se
            lisait comme un défaut d'affichage plutôt que comme un motif.
            Elle reste sur les sections sans photo.
          */}

          <div className="mx-auto max-w-7xl px-4 pb-12 pt-24 sm:px-6 sm:pb-14 sm:pt-28 lg:px-16 lg:pb-16 lg:pt-32">
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

                {/*
                  La maquette met ici un bouton rond à triangle, qui annonce
                  une vidéo. Il n'y en a pas, et le lien mène au guide : le
                  triangle est remplacé par une flèche. Un pictogramme de
                  lecture est une promesse, pas une décoration.
                */}
                <Link
                  href="/guide"
                  className={`inline-flex items-center justify-center gap-2.5 rounded-xl border border-champagne/20 px-6 py-3.5 text-sm font-semibold text-champagne transition-colors hover:border-cuivre/50 ${focusRing}`}
                >
                  Découvrir le concept
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-champagne/25"
                  >
                    <ArrowRight size={11} />
                  </span>
                </Link>
              </div>

              {/* Les trois garanties */}
              <ul className="mt-10 grid gap-5 sm:grid-cols-3 sm:gap-4">
                {garanties.map(({ icon: Icon, titre, texte }) => (
                  <li key={titre} className="flex gap-2.5">
                    <Icon
                      size={18}
                      className="mt-0.5 shrink-0 text-cuivre"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-[13px] font-semibold text-champagne">
                        {titre}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-snug text-champagne/55">
                        {texte}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </section>

        <Filet />

        {/* ═══════════════ Aperçu du produit ═══════════════ */}
        {/*
          Pas de titre visible : la maquette enchaîne le héros et les cartes
          sans respiration éditoriale. Un `h2` reste pourtant dans le code,
          masqué à l'œil — retirer le titre d'une section la sort du plan du
          document, et un lecteur d'écran arrive alors sur trois liens sans
          savoir ce qu'ils ont en commun.
        */}
        <section
          aria-labelledby="apercu-produit"
          className="px-4 pb-16 pt-6 sm:px-6 sm:pb-20 lg:px-16 lg:pb-24 lg:pt-8"
        >
          <h2 id="apercu-produit" className="sr-only">
            Ce que tu trouveras sur Sfera&rsquo;Solys
          </h2>

          <div className="mx-auto max-w-7xl">
            <div className="grid gap-5 lg:grid-cols-3">
              {featureTeasers.map((feature) => {
                const Icon = feature.icon;

                return (
                  <Link
                    key={feature.title}
                    href={feature.href}
                    className={`group relative isolate flex min-h-[270px] overflow-hidden rounded-2xl border border-cuivre/15 bg-minuit transition-colors hover:border-cuivre/45 ${focusRing}`}
                  >
                    {/*
                      La photo couvre toute la carte, et c'est le dégradé qui
                      décide où elle commence à se voir — pas le bord d'un
                      conteneur.

                      La version précédente la logeait dans un bloc occupant
                      la moitié droite. Au survol, l'image passe sur une
                      couche de composition pour s'agrandir, et le fond de la
                      carte ne peint plus sous cette couche : le fond de page
                      apparaissait dans la couture, sous la forme d'un trait
                      noir vertical coupant la carte en deux. Sans bord, pas
                      de couture — et la transition vers le texte est plus
                      douce.
                    */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 overflow-hidden"
                    >
                      <Image
                        src={feature.image}
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        className="object-cover object-[60%_50%] transition-transform duration-700 group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-minuit from-[38%] via-minuit/40 via-[64%] to-transparent" />
                    </div>

                    <div className="relative flex flex-1 flex-col p-6">
                      <span
                        aria-hidden="true"
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-cuivre/40 text-cuivre"
                      >
                        <Icon size={20} />
                      </span>

                      <h3 className="font-display mt-6 text-[22px] font-normal leading-snug text-ivoire">
                        {feature.title}
                      </h3>

                      <p className="mt-2.5 max-w-[15rem] text-[13px] leading-relaxed text-champagne/70">
                        {feature.description}
                      </p>
                    </div>

                    <span
                      aria-hidden="true"
                      className="absolute bottom-6 right-6 flex h-9 w-9 items-center justify-center rounded-full border border-cuivre/35 bg-nuit/40 text-cuivre backdrop-blur-sm transition-colors group-hover:border-cuivre group-hover:bg-cuivre group-hover:text-nuit"
                    >
                      <ArrowRight size={15} />
                    </span>
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

        <Filet />

        {/* ═══════════════ Comment ça marche ═══════════════ */}
        {/*
          Pas de photographie derrière cette section, ni derrière la
          suivante : les deux portent une interface — le dossier qui se
          remplit, les deux aperçus d'écran. Une image sous un cadre
          d'interface donne deux profondeurs qui se disputent la même place,
          et c'est l'interface qui perd. La photo revient au témoignage,
          où il n'y a qu'une phrase à porter.
        */}
        <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-16">
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

        <Filet />

        {/* ═══════════════ À quoi ça ressemble ═══════════════ */}
        <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-16">
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

        <Filet />

        {/* ═══════════════ Bandeau confiance ═══════════════ */}
        <section
          aria-labelledby="garanties"
          className="px-4 py-16 sm:px-6 sm:py-20 lg:px-16"
        >
          {/*
            La section n'avait aucun titre, visible ou non : au lecteur
            d'écran, elle se présentait comme quatre blocs sans rien qui
            dise ce qu'ils ont en commun. Le titre est masqué à l'œil —
            la maquette n'en veut pas — mais il existe dans le plan du
            document.
          */}
          <h2 id="garanties" className="sr-only">
            Ce que Sfera&rsquo;Solys garantit
          </h2>

          {/*
            Un seul panneau divisé par des filets, plutôt que des cartes qui
            flottent côte à côte — la même logique que le filet entre les
            sections : marquer une limite sans découper.

            Les filets viennent du `gap-px` sur une grille au fond cuivré :
            les cellules, opaques, laissent apparaître ce fond dans
            l'interstice. `divide-x` aurait tracé ses traits dans l'ordre du
            DOM, donc au mauvais endroit dès que la grille repasse sur une
            colonne.
          */}
          <ul className="mx-auto grid max-w-7xl gap-px overflow-hidden rounded-2xl border border-cuivre/20 bg-cuivre/20 sm:grid-cols-3">
            {trustBadges.map(({ icon: Icon, label, texte, href, lien }) => (
              <li
                key={label}
                className="flex flex-col bg-minuit p-6 sm:p-7"
              >
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-cuivre/35 text-cuivre"
                >
                  <Icon size={18} />
                </span>

                <p className="mt-5 text-[15px] font-semibold text-champagne">
                  {label}
                </p>

                <p className="mt-2 text-[13px] leading-relaxed text-champagne/65">
                  {texte}
                </p>

                {href && lien && (
                  <Link
                    href={href}
                    className={`mt-4 inline-flex items-center gap-1.5 self-start text-[12px] font-semibold text-cuivre transition-colors hover:text-champagne ${focusRing}`}
                  >
                    {lien}
                    <ArrowRight size={13} />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>

        <Filet />

        {/* ═══════════════ Pourquoi 28 ans et plus ═══════════════ */}
        <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:px-16">
          <EclipseMark
            id="age"
            attenuation={0}
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
        {/*
          Pas de filet ni avant ni après celle-ci : la photo s'éteint
          d'elle-même en haut et en bas, ce qui sépare mieux qu'un trait.
          Deux marques de séparation au même endroit en font une de trop.

          La photographie est une terrasse vide. C'est un choix, pas le
          hasard d'un fichier disponible : à côté d'un témoignage signé d'un
          prénom et d'un âge, un portrait se lit comme la photo de cette
          personne-là. Ce serait inventer un membre — exactement ce que la
          vérification d'identité est censée rendre impossible. Une scène
          sans personne ne peut rien laisser croire.
        */}
        <section className="relative isolate overflow-hidden px-4 py-24 text-center sm:px-6 sm:py-32">
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <Image
              src="/visuels/solys-02.webp"
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
            {/*
              Deux voiles superposés. Le premier assombrit partout, assez
              pour que le champagne atténué garde ses 4,5:1 même sur la
              zone la plus claire de l'image. Le second éteint les bords
              haut et bas, pour que la photo ne se lise pas comme un
              bandeau collé entre deux sections.
            */}
            <div className="absolute inset-0 bg-nuit/80" />
            <div className="absolute inset-0 bg-gradient-to-b from-nuit via-transparent to-nuit" />
          </div>

          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
            <span aria-hidden="true" className="h-px w-12 bg-cuivre" />

            {testimonial ? (
              <>
                <p className="font-display text-[24px] font-normal italic leading-[1.45] text-ivoire sm:text-[32px]">
                  « {testimonial.content} »
                </p>
                {/*
                  champagne/70 et non /55 : sur fond plein, 55 % passait
                  (4,79:1), mais la zone la plus claire de la photo sous son
                  voile fait tomber le même texte à 4,43:1 — sous le seuil.
                */}
                <span className="text-[13px] text-champagne/70">
                  — {testimonial.authorName}
                  {testimonial.age ? `, ${testimonial.age} ans` : ''}
                  {testimonial.city ? ` · ${testimonial.city}` : ''}
                </span>
              </>
            ) : testimonialsLoaded ? (
              <p className="text-sm text-champagne/70">
                Les premiers témoignages arrivent bientôt.
              </p>
            ) : (
              <p className="text-sm text-champagne/70">Chargement…</p>
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
        <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-16">
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
            {/*
              Le voile était à 90 % puis 60 % de nuit : la photo ne se
              voyait plus, et le panneau revenait à un rectangle sombre avec
              un liseré cuivré. Il suit maintenant la logique du héros —
              opaque là où le texte se pose, dégagé là où il n'y a rien.

              La direction change avec la mise en page : en colonne, le
              texte occupe toute la largeur en haut, donc le voile descend ;
              en ligne, le texte tient la gauche, donc il traverse. Les
              valeurs gardent le petit texte au-dessus de 4,5:1 même sur la
              partie la plus claire de l'image.
            */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-br from-nuit via-nuit/85 to-nuit/40 lg:bg-gradient-to-r lg:from-nuit lg:via-nuit/75 lg:to-nuit/25"
            />

            <div className="relative flex flex-col items-start justify-between gap-7 p-8 sm:p-12 lg:flex-row lg:items-center">
              <div>
                {/*
                  Le seul autre mot cuivré de la page est dans le titre du
                  héros. Les deux se répondent d'un bout à l'autre : c'est
                  un encadrement, pas un tic — raison pour laquelle les
                  titres intermédiaires restent en ivoire.
                */}
                <h2 className="font-display text-[26px] font-normal leading-tight text-ivoire sm:text-[32px]">
                  Prêt à rencontrer{' '}
                  <span className="text-cuivre">sérieusement</span> ?
                </h2>
                <p className="mt-2 text-sm text-champagne/70">
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
