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
  Lock,
  Lightbulb,
  MessageCircle,
  PenLine,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';
import GrainOverlay from '@/components/brand/GrainOverlay';
import EclipseMark from '@/components/brand/EclipseMark';
import {
  sectionY,
  premierBloc,
  focusRing as anneauFocus,
  Filet,
  Surtitre,
  EnteteSection,
  TuileIcone,
} from '@/components/brand/mise-en-page';

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
  /** Libellé court, pour la frise. */
  label: string;
  title: string;
  duration: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  image: string;
  content: string;
  details: string[];
  tip?: string;
};

/*
  Le champ `dot` disparaît : il alternait orange et lime d'une étape à
  l'autre, sans que la couleur dise quoi que ce soit. Même correction que
  dans le parcours de la page d'accueil et celui de /fonctionnalites —
  dans ce projet, le vert est réservé à la validation.
*/

const steps: Step[] = [
  {
    label: 'Créer ton profil',
    title: 'Création de ton profil Solys',
    duration: '5 à 10 min',
    icon: UserRound,
    image: '/visuels/guide/etape-1.webp',
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
    label: 'Découvrir le Circle of Six',
    title: 'Découverte du Circle of Six',
    duration: 'Chaque semaine',
    icon: Users,
    image: '/visuels/guide/etape-2.webp',
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
    label: 'Régler ta visibilité',
    title: 'Réglage de ta visibilité',
    duration: 'À tout moment',
    icon: Compass,
    image: '/visuels/guide/etape-3.webp',
    content:
      'Tu choisis qui te voit, à quelle distance, et tu peux en changer à tout moment.',
    details: [
      'Profil public, réservé à tes correspondances, priorisé ou discret',
      'Rayon de recherche adapté à ton département',
      'Mode Fantôme pour rester présent sans apparaître',
      'Chaque réglage se modifie depuis Mon Compte',
    ],
  },
  {
    label: 'Premiers échanges',
    title: 'Premières interactions',
    duration: 'À ton rythme',
    icon: MessageCircle,
    image: '/visuels/guide/etape-4.webp',
    content:
      'Engage la conversation de manière authentique et bienveillante.',
    details: [
      'Utilise nos prompts de conversation pour briser la glace',
      'Partage tes intérêts communs pour créer un lien',
      'Propose une activité concrète plutôt qu’un « on verra »',
      'Respecte toujours les limites et le consentement',
    ],
  },
  {
    label: 'Participer aux événements',
    title: 'Participation aux événements Solys',
    duration: 'En ligne ou en présentiel',
    icon: CalendarDays,
    image: '/visuels/guide/etape-5.webp',
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
  /*
    La réponse annonçait : « La plupart de nos membres font leur première
    connexion significative dans les 48 h après avoir complété leur
    profil. » Ce chiffre ne vient d'aucune mesure — rien dans le code ne
    le calcule, et la base ne compte pas assez de comptes pour qu'une
    moyenne veuille dire quoi que ce soit. Une statistique inventée est le
    plus coûteux des ornements : elle est vérifiable, donc réfutable.

    La réponse décrit maintenant ce que le produit fait, ce qui se
    constate.
  */
  {
    question: 'Combien de temps pour commencer ?',
    answer:
      "L'inscription ne prend que quelques minutes. Tu peux ensuite compléter ton profil à ton rythme et commencer à découvrir des profils immédiatement. Le Circle of Six, lui, se renouvelle chaque semaine.",
  },
  {
    question: 'Dois-je révéler mon identité réelle ?',
    answer:
      "Pas aux autres membres. Ton document d'identité est transmis à Stripe pour la vérification et n'est jamais affiché sur le site : les autres voient ton pseudonyme, tes photos et ce que tu as choisi de remplir. Et le Mode Fantôme te permet de disparaître de l'annuaire et du Circle quand tu préfères te faire discret.",
  },
  {
    question: "Comment fonctionne la modération sur Sfera'Solys ?",
    answer:
      "La vérification d'identité est automatisée : Stripe Identity compare un document officiel à un selfie pris en direct. Les messages passent par un filtre qui bloque les contenus manifestement abusifs. Et un signalement est lu par une personne — c'est le seul endroit où l'humain intervient, et c'est voulu : le jugement ne se délègue pas à un filtre.",
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

/*
  La mention « Conseil de la communauté » tombe avec cette version. Elle
  attribuait ces phrases à des membres qui ne les ont pas écrites — c'est
  la rédaction du site qui parle, et la maquette ne prétend pas autre
  chose : ses cartes n'ont pas de signature.
*/
const communityTips = [
  {
    tip: 'Sois authentique',
    details:
      'Des photos récentes et une description sincère pour attirer des profils alignés avec tes valeurs.',
    icon: PenLine,
    image: '/visuels/guide/conseil-1.webp',
  },
  {
    tip: 'Préserve ta discrétion',
    details:
      'Utilise les paramètres de confidentialité et le Mode Fantôme pour garder le contrôle.',
    icon: Ghost,
    image: '/visuels/guide/conseil-2.webp',
  },
  {
    tip: 'Rencontre à ton rythme',
    details:
      'Prends le temps d’échanger et de faire connaissance avant de te rencontrer dans la vraie vie.',
    icon: Users,
    image: '/visuels/guide/conseil-3.webp',
  },
];

/** Les trois garanties du bandeau « Avant de commencer ». */
const assurances = [
  {
    icon: UserRound,
    titre: 'Inscription gratuite',
    texte: 'Crée ton profil en quelques minutes.',
  },
  {
    icon: Lock,
    titre: 'Confidentialité renforcée',
    texte: 'Tu choisis ce que tu partages.',
  },
  {
    icon: Users,
    titre: 'Une communauté respectueuse',
    texte: 'Des rencontres authentiques et bienveillantes.',
  },
];

/**
 * Les fonctionnalités citées dans les étapes ont chacune leur page. On les
 * rassemble en fin de guide plutôt que d'envoyer le lecteur chercher dans
 * le menu — aucune nouveauté, uniquement ce que le guide vient d'évoquer.
 */
/*
  Ces trois pages vivent dans le groupe `(app)` : elles affichent la barre
  latérale de l'espace membre et renvoient un visiteur non connecté sur
  `/auth?mode=login`. Le guide est public, et son lecteur type n'a pas
  encore de compte — il lisait « Circle of Six » et recevait un formulaire
  de connexion.

  Les liens visent donc les sections publiques de /fonctionnalites, qui
  décrivent ces trois fonctionnalités. Même correction que sur la page
  d'accueil.
*/
const relatedPages = [
  {
    label: 'Circle of Six',
    href: '/fonctionnalites#circle',
    resume: '6 profils sélectionnés chaque semaine.',
    image: '/visuels/solys-06.webp',
  },
  {
    label: 'Mode Fantôme',
    href: '/fonctionnalites#ghost',
    resume: 'Explore en toute discrétion.',
    image: '/visuels/solys-07.webp',
  },
  {
    label: 'Événements Solys',
    href: '/fonctionnalites#events',
    resume: 'Des expériences exclusives.',
    image: '/visuels/solys-08.webp',
  },
];


export default function GuidePage() {
  /**
   * L'étape dépliée, et la question ouverte.
   *
   * Le détail des étapes était affiché en permanence à partir de `sm` et
   * replié seulement sur mobile. Les cartes de la maquette sont trop
   * étroites pour le porter en continu : le dépli vaut désormais à toutes
   * les largeurs, et c'est la flèche de la carte qui l'ouvre.
   */
  const [etapeOuverte, setEtapeOuverte] = useState<number | null>(null);
  const [questionOuverte, setQuestionOuverte] = useState<number | null>(0);
  const reduceMotion = useReducedMotion();

  return (
    <>
      <Header />

      <GrainOverlay />

      {/* id="contenu" : cible du lien d'évitement du header. */}
      <main id="contenu" className="relative bg-nuit text-champagne">
        {/* ═══════════════ Héros ═══════════════ */}
        <section className="relative isolate overflow-hidden px-4 sm:px-6 lg:px-16">
          <div className="absolute inset-0 -z-20 lg:left-[46%]">
            <Image
              src="/visuels/solys-05.webp"
              alt="Des hommes en conversation sur une terrasse, la ville illuminée derrière eux."
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 56vw"
              className="object-cover object-center"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-nuit via-nuit/80 to-nuit/45 lg:bg-gradient-to-r lg:from-nuit lg:via-nuit/35 lg:to-nuit/10"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-nuit to-transparent"
            />
          </div>

          <div className={`relative mx-auto max-w-7xl pb-14 sm:pb-16 ${premierBloc}`}>
            <div className="max-w-xl">
              <Surtitre>5 étapes · guide du débutant</Surtitre>

              <h1 className="font-display mt-6 text-[34px] font-normal leading-[1.08] tracking-tight text-ivoire sm:text-[46px]">
                Ton parcours,
                <br />
                <span className="text-cuivre">étape par étape.</span>
              </h1>

              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-champagne/70 sm:text-base">
                Avance à ton rythme, découvre des rencontres qui ont du sens.
              </p>

              <Link
                href="/commencer"
                className={`mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-degrade-cuivre px-7 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${anneauFocus}`}
              >
                Commencer mon parcours
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <Filet />

        {/* ═══════════════ Le parcours en 5 étapes ═══════════════ */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-7xl">
            <EnteteSection
              surtitre="Le guide Sfera'Solys"
              intro="Un parcours simple et progressif pour vivre une expérience sereine et authentique."
              className="mb-10"
            >
              Ton parcours en <span className="text-cuivre">5</span> étapes
            </EnteteSection>

            {/*
              La frise résume le chemin d'un coup d'œil. Elle est
              décorative — `aria-hidden` — parce que ses libellés répètent
              mot pour mot les titres des cartes juste dessous : à un
              lecteur d'écran, elle ne dirait que deux fois la même chose.
            */}
            <div
              aria-hidden="true"
              className="relative mb-9 hidden lg:block"
            >
              <span className="absolute left-[10%] right-[10%] top-5 h-px bg-champagne/15" />

              <ol className="relative grid grid-cols-5">
                {steps.map((step, i) => (
                  <li key={step.label} className="flex flex-col items-center px-2">
                    <span
                      className={`font-display flex h-10 w-10 items-center justify-center rounded-full border text-[15px] font-extrabold ${
                        i === 0
                          ? 'border-cuivre bg-cuivre text-nuit'
                          : 'border-champagne/20 bg-minuit text-champagne/70'
                      }`}
                    >
                      {i + 1}
                    </span>

                    <span className="mt-3 max-w-[9rem] text-center text-[12.5px] leading-snug text-champagne/70">
                      {step.label}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {/*
              Les cartes de la maquette sont compactes : numéro, titre,
              durée, une phrase. Les quatre points de détail et le conseil
              de chaque étape ne tiennent pas dedans — ils sont donc
              dépliables, et c'est la flèche de la maquette qui les ouvre.

              Les supprimer aurait été l'autre lecture de « à la lettre » :
              vingt points concrets en moins dans un guide, c'est-à-dire
              l'essentiel de ce qu'un guide apporte.
            */}
            <ul className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {steps.map((step, i) => {
                const Icone = step.icon;
                const ouverte = etapeOuverte === i;

                return (
                  <li key={step.label}>
                    <div className="overflow-hidden rounded-2xl border border-cuivre/15 bg-minuit">
                      <div className="relative aspect-[4/3] w-full overflow-hidden">
                        <Image
                          src={step.image}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                          className="object-cover object-[50%_35%]"
                        />
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-t from-minuit via-minuit/25 to-transparent"
                        />

                      </div>

                      {/*
                        La pastille numérotée appartient au bloc de texte,
                        pas au conteneur de la photo.

                        Elle y était, en `-bottom-4`, et ce conteneur porte
                        `overflow-hidden` pour arrondir l'image : la moitié
                        basse de chaque pastille était donc rognée, ce qui
                        donnait cinq demi-lunes au bas des photos.

                        Rattachée au bloc de texte en `-top-[18px]`, elle
                        chevauche toujours la photo — mais rien ne la coupe,
                        la carte n'ayant pas de débordement masqué à cet
                        endroit. C'est le même procédé que les tuiles des
                        cartes de conseil, plus bas.
                      */}
                      <div className="relative p-4 pt-7">
                        <span className="font-display absolute -top-[18px] left-4 flex h-9 w-9 items-center justify-center rounded-full border border-cuivre/40 bg-nuit text-[14px] font-extrabold text-cuivre">
                          {i + 1}
                        </span>

                        <h3 className="font-display text-[16px] font-normal leading-snug text-ivoire">
                          {step.label}
                        </h3>

                        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-champagne/70">
                          <Clock size={12} aria-hidden="true" className="shrink-0 text-cuivre" />
                          {step.duration}
                        </p>

                        {/*
                          `min-h` sur la description : les textes font deux
                          ou trois lignes selon l'étape, et les cartes
                          finissaient à cinq hauteurs différentes alors que
                          la maquette les aligne. Trois lignes réservées
                          suffisent à les égaliser.

                          La grille reste en `items-start` : si elle
                          étirait les cartes, déplier une étape creuserait
                          quatre colonnes de vide à côté.
                        */}
                        <p className="mt-2.5 min-h-[3.4rem] text-[12.5px] leading-snug text-champagne/70">
                          {step.content}
                        </p>

                        <button
                          type="button"
                          onClick={() => setEtapeOuverte(ouverte ? null : i)}
                          aria-expanded={ouverte}
                          aria-label={
                            ouverte
                              ? `Replier le détail de l'étape ${i + 1}`
                              : `Voir le détail de l'étape ${i + 1}`
                          }
                          className={`mt-4 flex h-9 w-9 items-center justify-center rounded-full border border-cuivre/35 text-cuivre transition-colors hover:border-cuivre hover:bg-cuivre hover:text-nuit ${anneauFocus}`}
                        >
                          <ArrowRight
                            size={15}
                            className={`transition-transform ${ouverte ? 'rotate-90' : ''}`}
                          />
                        </button>

                        <AnimatePresence initial={false}>
                          {ouverte && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: reduceMotion ? 0 : 0.22 }}
                              className="overflow-hidden"
                            >
                              <ul className="mt-4 space-y-2 border-t border-cuivre/10 pt-4">
                                {step.details.map((detail) => (
                                  <li key={detail} className="flex items-start gap-2">
                                    <Check
                                      size={11}
                                      strokeWidth={3}
                                      aria-hidden="true"
                                      className="mt-1 shrink-0 text-cuivre"
                                    />
                                    <span className="text-[12px] leading-snug text-champagne/70">
                                      {detail}
                                    </span>
                                  </li>
                                ))}
                              </ul>

                              {step.tip && (
                                <p className="mt-3 flex gap-2 rounded-lg border border-cuivre/25 bg-cuivre/[0.06] p-2.5 text-[11.5px] leading-snug text-champagne/75">
                                  <Lightbulb
                                    size={13}
                                    aria-hidden="true"
                                    className="mt-0.5 shrink-0 text-cuivre"
                                  />
                                  {step.tip}
                                </p>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ═══════════════ Avant de commencer ═══════════════ */}
        {/*
          Le bandeau de confiance de la maquette : médaillon à gauche,
          titre, puis trois garanties séparées par des filets verticaux.
          L'éclipse en décor à droite est la même que celle du héros de
          l'accueil, en très grand et très atténuée.
        */}
        <section className="relative isolate overflow-hidden bg-minuit/60 px-4 sm:px-6 lg:px-16">
          <EclipseMark
            id="guide-confiance"
            attenuation={0}
            className="pointer-events-none absolute -right-24 top-1/2 h-[320px] w-[320px] -translate-y-1/2 opacity-20 lg:right-[-4%] lg:h-[420px] lg:w-[420px]"
          />

          <div className={`relative mx-auto max-w-7xl ${sectionY}`}>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
              <span
                aria-hidden="true"
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-cuivre/35 bg-degrade-cuivre/10 text-cuivre"
              >
                <ShieldCheck size={30} />
              </span>

              <div>
                <Surtitre>Avant de commencer</Surtitre>

                <h2 className="font-display mt-4 text-[26px] font-normal leading-tight text-ivoire sm:text-[32px]">
                  Une expérience en toute confiance
                </h2>

                <p className="mt-2.5 max-w-xl text-[14px] leading-relaxed text-champagne/70">
                  Tu restes maître de tes préférences. Aucun engagement, tu
                  avances à ton rythme.
                </p>
              </div>
            </div>

            <ul className="mt-9 flex flex-col gap-6 rounded-2xl border border-cuivre/15 bg-nuit/50 p-5 sm:flex-row sm:gap-0 sm:divide-x sm:divide-cuivre/15 sm:p-6">
              {assurances.map(({ icon: Icone, titre, texte }) => (
                <li
                  key={titre}
                  className="flex flex-1 items-center gap-4 sm:px-6 sm:first:pl-0 sm:last:pr-0"
                >
                  <TuileIcone icon={Icone} />

                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-champagne">
                      {titre}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-champagne/70">
                      {texte}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ═══════════════ Pour bien démarrer ═══════════════ */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Surtitre>Nos conseils</Surtitre>

                <h2 className="font-display mt-4 text-[26px] font-normal leading-tight tracking-tight text-ivoire sm:text-[32px]">
                  Pour bien démarrer
                </h2>
              </div>

              <Link
                href="/faq"
                className={`inline-flex shrink-0 items-center gap-2.5 rounded-xl border border-cuivre/40 px-6 py-3 text-[13px] font-semibold text-champagne transition-colors hover:border-cuivre hover:text-ivoire ${anneauFocus}`}
              >
                Voir tous les conseils
                <ArrowRight size={14} />
              </Link>
            </div>

            <ul className="grid gap-5 lg:grid-cols-3">
              {communityTips.map(({ icon: Icone, tip, details, image }) => (
                <li
                  key={tip}
                  className="overflow-hidden rounded-2xl border border-cuivre/15 bg-minuit"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden">
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover object-center"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-minuit via-minuit/25 to-transparent"
                    />
                  </div>

                  <div className="relative p-5">
                    <TuileIcone
                      icon={Icone}
                      className="absolute -top-6 left-5 h-11 w-11 bg-nuit"
                    />

                    <h3 className="font-display mt-6 text-[18px] font-normal leading-snug text-ivoire">
                      {tip}
                    </h3>

                    <p className="mt-2 max-w-[18rem] text-[12.5px] leading-relaxed text-champagne/70">
                      {details}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <Filet />

        {/* ═══════════════ Questions fréquentes ═══════════════ */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Surtitre>Questions fréquentes</Surtitre>

                <h2 className="font-display mt-4 text-[26px] font-normal leading-tight tracking-tight text-ivoire sm:text-[32px]">
                  On répond à tes questions
                </h2>
              </div>

              <Link
                href="/faq"
                className={`inline-flex shrink-0 items-center gap-2.5 rounded-xl border border-cuivre/40 px-6 py-3 text-[13px] font-semibold text-champagne transition-colors hover:border-cuivre hover:text-ivoire ${anneauFocus}`}
              >
                Voir la FAQ complète
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="space-y-2">
              {faqs.map((faq, index) => {
                const ouverte = questionOuverte === index;

                return (
                  <div
                    key={faq.question}
                    className={`overflow-hidden rounded-2xl border bg-minuit transition-colors ${
                      ouverte ? 'border-cuivre/40' : 'border-cuivre/15'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setQuestionOuverte(ouverte ? null : index)}
                      aria-expanded={ouverte}
                      className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left ${anneauFocus}`}
                    >
                      <span className="flex min-w-0 items-center gap-3.5">
                        <span
                          aria-hidden="true"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cuivre/25 bg-nuit/50 text-cuivre"
                        >
                          <Lightbulb size={16} />
                        </span>

                        <span className="min-w-0 text-[14px] font-semibold text-champagne">
                          {faq.question}
                        </span>
                      </span>

                      <ChevronDown
                        size={16}
                        className={`shrink-0 text-cuivre transition-transform ${
                          ouverte ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {ouverte && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: reduceMotion ? 0 : 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="border-t border-cuivre/10 px-5 pb-4 pl-[4.4rem] pt-4 text-[13px] leading-relaxed text-champagne/70">
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <Filet />

        {/* ═══════════════ Pour aller plus loin ═══════════════ */}
        {/*
          La maquette titre « Découvrez aussi », au vouvoiement, alors que
          toute la page tutoie — « Ton parcours », « tes questions ». Le
          titre suit le reste du site.
        */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-7xl">
            <Surtitre>Pour aller plus loin</Surtitre>

            <h2 className="font-display mb-8 mt-4 text-[26px] font-normal leading-tight tracking-tight text-ivoire sm:text-[32px]">
              Découvre aussi
            </h2>

            <ul className="grid gap-5 lg:grid-cols-3">
              {relatedPages.map((page) => (
                <li key={page.href}>
                  <Link
                    href={page.href}
                    className={`group relative flex min-h-[150px] items-end overflow-hidden rounded-2xl border border-cuivre/15 bg-minuit p-5 transition-colors hover:border-cuivre/45 ${anneauFocus}`}
                  >
                    <span aria-hidden="true" className="absolute inset-0 -z-10 block">
                      <Image
                        src={page.image}
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        className="object-cover object-[60%_50%] transition-transform duration-700 group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      />
                      <span className="absolute inset-0 block bg-gradient-to-r from-minuit from-[35%] via-minuit/50 via-[70%] to-transparent" />
                    </span>

                    <span>
                      <span className="font-display block text-[18px] font-normal leading-snug text-ivoire">
                        {page.label}
                      </span>
                      <span className="mt-1 block max-w-[13rem] text-[12.5px] leading-snug text-champagne/70">
                        {page.resume}
                      </span>
                    </span>

                    <span
                      aria-hidden="true"
                      className="absolute bottom-5 right-5 flex h-9 w-9 items-center justify-center rounded-full border border-cuivre/35 bg-nuit/50 text-cuivre backdrop-blur-sm transition-colors group-hover:border-cuivre group-hover:bg-cuivre group-hover:text-nuit"
                    >
                      <ArrowRight size={15} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ═══════════════ Appel final ═══════════════ */}
        <div className="relative isolate overflow-hidden">
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <Image
              src="/visuels/solys-11.webp"
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-nuit/80" />
            <div className="absolute inset-0 bg-gradient-to-b from-nuit via-transparent to-nuit/70" />
          </div>

          <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-16">
            <div className="mx-auto max-w-7xl">
              <h2 className="font-display text-[26px] font-normal leading-tight text-ivoire sm:text-[32px]">
                Prêt à commencer ton parcours&nbsp;?
              </h2>

              <p className="mt-2.5 max-w-md text-[14px] leading-relaxed text-champagne/70">
                Rejoins une communauté d&apos;hommes qui partagent les mêmes
                valeurs.
              </p>

              <Link
                href="/commencer"
                className={`mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-degrade-cuivre px-7 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${anneauFocus}`}
              >
                Créer mon profil
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
