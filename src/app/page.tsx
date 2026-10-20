'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  IdCard,
  ShieldCheck,
  Lock,
  ArrowRight,
  Ghost,
  CalendarDays,
  Users,
  Target,
  Gem,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
    label: 'Vérification gratuite',
    texte:
      'Elle ne dépend d’aucune offre. Le premium lève des limites d’usage, jamais le droit d’être vérifié.',
  },
  {
    icon: ShieldCheck,
    label: 'Modération humaine',
    texte:
      'Un signalement est examiné par un administrateur, pas par un algorithme. Un compte peut être suspendu.',
  },
  {
    icon: Lock,
    label: 'Tes données, nommément',
    texte:
      'Notre page confidentialité nomme un par un les prestataires qui les traitent, et ce que chacun en fait.',
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

/*
  L'accueil portait un accordéon de trois questions — délai de vérification,
  gratuité, résiliation. La maquette le remplace par une invitation vers
  /faq, et c'est le choix retenu.

  À surveiller : /faq couvre la résiliation (« Comment annuler mon
  abonnement premium ? ») et, en partie, la gratuité (« Quelle est la
  différence entre le compte gratuit et premium ? »). Elle ne dit rien du
  **délai de vérification** — probablement la première chose qu'un visiteur
  se demande, et qui n'a désormais de réponse nulle part sur le site. La
  question mérite d'être ajoutée là-bas.
*/

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

/**
 * Tuile d'icône.
 *
 * La maquette abandonne la pastille ronde pour un carré aux angles
 * adoucis, posé à gauche du texte plutôt qu'au-dessus. Le gain n'est pas
 * seulement décoratif : à gauche, la tuile aligne les titres sur une même
 * verticale et la carte tient en deux lignes au lieu de quatre.
 *
 * Les ronds cuivrés subsistent là où ils ne servent pas de puce — sur les
 * cartes de fonctionnalités, où la pastille porte l'icône seule au-dessus
 * d'un titre, et sur la flèche de leur coin.
 */
/*
  `LucideIcon` et non un `ComponentType<{ size?: number }>` écrit à la main :
  les icônes lucide sont des `forwardRef`, et leur type porte une référence
  SVG qu'une signature réduite à `size` refuse. Le type maison compilait à
  la lecture mais pas à l'usage.
*/
function TuileIcone({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cuivre/30 bg-nuit/60 text-cuivre"
    >
      <Icon size={20} />
    </span>
  );
}

export default function Home() {
  const [testimonial, setTestimonial] = useState<PublicTestimonial | null>(null);
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
      .catch(() => {});
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

            {/*
              L'espace avant le point d'interrogation est insécable : en
              français il est obligatoire, et une espace ordinaire laisserait
              le « ? » tomber seul en début de ligne.
            */}
            <h2 className="font-display mt-5 text-[30px] font-normal leading-tight tracking-tight text-ivoire sm:text-[38px]">
              Comment ça marche&nbsp;?
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
              À quoi ça ressemble&nbsp;?
            </h2>

            {/*
              Le lien se range sur la ligne de base du sous-titre, à l'autre
              bout. `items-end` le cale sur la dernière ligne du paragraphe
              plutôt que sur sa première — sans quoi il flotte au-dessus dès
              que le texte passe sur deux lignes.
            */}
            <div className="mb-10 mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
              <p className="max-w-xl text-[15px] leading-relaxed text-champagne/60 sm:text-base">
                Deux façons de parcourir les profils, au choix : six
                propositions par semaine, ou l&apos;annuaire complet quand tu
                veux prendre le temps.
              </p>

              <Link
                href="/fonctionnalites"
                className={`inline-flex shrink-0 items-center gap-1.5 self-start text-[13px] font-semibold text-cuivre transition-colors hover:text-champagne lg:self-auto ${focusRing}`}
              >
                Découvrir toutes les fonctionnalités
                <ArrowRight size={14} />
              </Link>
            </div>

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
        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-7xl">
            {/*
              La section n'avait aucun titre, visible ou non : au lecteur
              d'écran, elle se présentait comme des blocs sans rien qui dise
              ce qu'ils ont en commun. La maquette lui en donne un vrai, à
              l'œil comme dans le plan du document — ce qui vaut mieux que le
              titre masqué qui bouchait le trou.
            */}
            <Surtitre>Notre engagement</Surtitre>

            <h2 className="font-display mb-9 mt-5 text-[30px] font-normal leading-tight tracking-tight text-ivoire sm:text-[38px]">
              Une expérience fiable et sereine
            </h2>

            {/*
              Trois cartes distinctes, et non le panneau unique divisé par
              des filets que j'avais posé : la maquette les sépare, et sur
              une rangée de trois le panneau continu faisait lire les
              garanties comme un tableau de caractéristiques.
            */}
            <ul className="grid gap-4 lg:grid-cols-3 lg:gap-5">
              {trustBadges.map(({ icon: Icon, label, texte }) => (
                <li
                  key={label}
                  className="flex gap-4 rounded-2xl border border-cuivre/15 bg-minuit p-5 sm:p-6"
                >
                  <TuileIcone icon={Icon} />

                  <div>
                    <p className="text-[15px] font-semibold text-champagne">
                      {label}
                    </p>

                    <p className="mt-1.5 text-[13px] leading-relaxed text-champagne/65">
                      {texte}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
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
                Pourquoi 28 ans et plus&nbsp;?
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

            {/*
              Les puces rondes cèdent la place aux mêmes tuiles que la
              section précédente. Une puce ne dit rien ; une icône dit de
              quoi parle la ligne avant qu'on l'ait lue.
            */}
            <ul className="flex flex-col gap-3">
              {[
                {
                  icon: Target,
                  title: 'Des intentions dites franchement',
                  text: 'Chaque profil précise ce qu’il cherche. Personne n’a à deviner.',
                },
                {
                  icon: Users,
                  title: 'Un rythme d’adulte',
                  text: 'Pas de notifications qui harcèlent, pas de score à entretenir tous les jours.',
                },
                {
                  icon: Gem,
                  title: 'Une porte, pas un tourniquet',
                  text: 'Devoir prouver son identité décourage ceux qui passaient juste pour voir.',
                },
              ].map((item) => (
                <li
                  key={item.title}
                  className="flex gap-4 rounded-2xl border border-cuivre/15 bg-minuit p-4 sm:p-5"
                >
                  <TuileIcone icon={item.icon} />

                  <div>
                    <p className="text-sm font-semibold text-champagne">
                      {item.title}
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-champagne/60">
                      {item.text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ═══════════════ Témoignage ═══════════════ */}
        {/*
          Toute la section disparaît tant qu'aucun témoignage n'est publié —
          c'est l'état de la production aujourd'hui. Elle affichait sinon
          « Les premiers témoignages arrivent bientôt », c'est-à-dire un
          grand bloc dont le message est qu'il n'a rien à dire. Elle
          réapparaîtra seule au premier témoignage validé, sans rien à
          changer ici. La maquette, qui ne la montre pas, décrit donc
          exactement la page telle qu'elle est en ligne.

          Pas de filet ni avant ni après : la photo s'éteint d'elle-même en
          haut et en bas, ce qui sépare mieux qu'un trait.

          La photographie est une terrasse déserte. C'est un choix, pas le
          hasard d'un fichier disponible : à côté d'un témoignage signé d'un
          prénom et d'un âge, un portrait se lit comme la photo de cette
          personne-là. Ce serait inventer un membre — exactement ce que la
          vérification d'identité est censée rendre impossible. Une scène
          sans personne ne peut rien laisser croire.
        */}
        {testimonial && (
        <section className="relative isolate overflow-hidden px-4 py-24 text-center sm:px-6 sm:py-32">
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <Image
              src="/visuels/solys-04.webp"
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

            <Link
              href="/temoignages"
              className={`mt-1 inline-flex items-center gap-1.5 text-[13px] font-semibold text-cuivre transition-colors hover:text-champagne ${focusRing}`}
            >
              voir tous les témoignages
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
        )}

        {/*
          ═══════════════ Bandeau final : FAQ + appel ═══════════════

          Une seule photographie court derrière les deux dernières sections.
          C'est ce que montre la maquette, et ce n'est pas qu'une économie de
          fichier : deux images consécutives, chacune avec ses propres bords,
          auraient découpé le bas de la page en bandes. Une image continue
          fait du bas de page un seul lieu.

          Le voile est à 75 %, mesuré et non choisi à l'œil : sur la zone la
          plus claire de la terrasse, le champagne à 60 % y tient 4,79:1,
          juste au-dessus du seuil du petit texte. En dessous de ce voile,
          le surtitre serait passé sous la limite.
        */}
        <div className="relative isolate overflow-hidden">
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <Image
              src="/visuels/solys-02.webp"
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-nuit/75" />
            <div className="absolute inset-0 bg-gradient-to-b from-nuit via-transparent to-nuit" />
          </div>

        {/* ═══════════════ FAQ ═══════════════ */}
        <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-16">
          <div className="mx-auto flex max-w-7xl flex-col gap-7 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <div>
              <Surtitre>Questions fréquentes</Surtitre>

              <h2 className="font-display mt-5 text-[30px] font-normal leading-tight tracking-tight text-ivoire sm:text-[38px]">
                On répond aux questions les plus courantes
              </h2>

              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-champagne/70 sm:text-base">
                Inscription, vérification, fonctionnement… tout ce qu&apos;il
                faut savoir.
              </p>
            </div>

            <Link
              href="/faq"
              className={`inline-flex shrink-0 items-center gap-2.5 self-start rounded-xl border border-cuivre/40 bg-nuit/50 px-6 py-3.5 text-sm font-semibold text-champagne backdrop-blur-sm transition-colors hover:border-cuivre hover:text-ivoire lg:self-auto ${focusRing}`}
            >
              Voir la FAQ complète
              <span
                aria-hidden="true"
                className="flex h-6 w-6 items-center justify-center rounded-full border border-cuivre/40 text-cuivre"
              >
                <ArrowRight size={11} />
              </span>
            </Link>
          </div>
        </section>

        {/* ═══════════════ Appel final ═══════════════ */}
        {/*
          Pas de photo propre : le panneau se pose sur celle du bandeau, qui
          court derrière les deux sections. Il se contente d'un fond
          translucide et d'un flou, de sorte que la terrasse continue de se
          voir à travers lui — c'est ce que montre la maquette, et c'est ce
          qui le distingue d'un encart collé par-dessus une image.
        */}
        <section className="px-4 pb-20 sm:px-6 sm:pb-24 lg:px-16">
          <div className="mx-auto max-w-7xl rounded-3xl border border-cuivre/25 bg-nuit/55 p-8 backdrop-blur-md sm:p-10">
            <div className="flex flex-col items-start justify-between gap-7 lg:flex-row lg:items-center">
              <div>
                {/*
                  Le seul autre mot cuivré de la page est dans le titre du
                  héros. Les deux se répondent d'un bout à l'autre : c'est
                  un encadrement, pas un tic — raison pour laquelle les
                  titres intermédiaires restent en ivoire.
                */}
                <h2 className="font-display text-[26px] font-normal leading-tight text-ivoire sm:text-[32px]">
                  Prêt à rencontrer{' '}
                  <span className="text-cuivre">sérieusement</span>&nbsp;?
                </h2>
                <p className="mt-2.5 max-w-md text-sm leading-relaxed text-champagne/70">
                  Crée ton profil gratuitement et découvre une nouvelle façon
                  de rencontrer.
                </p>
              </div>

              <div className="flex flex-col items-start gap-2.5 lg:items-end">
                <Link
                  href="/commencer"
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl bg-degrade-cuivre px-7 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
                >
                  Créer mon profil
                  <ArrowRight size={16} />
                </Link>

                {/*
                  Les trois mentions de la maquette, vérifiées une à une :
                  l'inscription ne demande aucune carte (le paiement ne
                  survient qu'à l'abonnement), le compte gratuit existe, et
                  la vérification d'identité ne dépend d'aucune offre.
                */}
                <p className="text-[11px] text-champagne/60">
                  Aucune carte bancaire · Gratuit · Vérification incluse
                </p>
              </div>
            </div>
          </div>
        </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
