'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Camera,
  ChevronDown,
  Clock,
  CreditCard,
  Eye,
  Heart,
  IdCard,
  Lock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  UserPlus,
  Users,
} from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  EnteteSection,
  Surtitre,
  focusRing,
  premierBloc,
  sectionY,
  type IconeMarque,
} from '@/components/brand/mise-en-page';

/**
 * Page /commencer — direction « nuit cuivrée », d'après la maquette.
 *
 * ## Trois blocs de l'ancienne page disparaissent, et c'est voulu
 *
 * 1. **Le panneau à onglets.** Le parcours était un `tablist` pilotable au
 *    clavier, avec pour chaque étape un détail et une liste de contrôle.
 *    La maquette le remplace par quatre cartes plates. Les listes ne sont
 *    pas perdues : `/guide` porte le même parcours en détail, et le héros
 *    y renvoie par son second bouton. Deux endroits racontaient la même
 *    chose ; il en reste un, et c'est celui qui est fait pour ça.
 *
 * 2. **Les statistiques.** La page appelait `/api/stats` au montage pour
 *    afficher des compteurs. La maquette n'en montre aucun, l'appel est
 *    retiré avec eux — une requête réseau de moins au chargement.
 *
 * 3. **Une cinquième question.** La maquette en dessine quatre ; « Mes
 *    données sont-elles protégées ? » recoupait « Puis-je rester
 *    discret ? » et la FAQ complète, vers laquelle la section renvoie.
 *
 * ## Une correction de fond
 *
 * Les bénéfices annonçaient « Modération 24/7 ». Rien n'engage une
 * surveillance continue : ce qui est vrai, et ce qu'écrit la maquette,
 * c'est que les profils sont vérifiés et qu'une personne lit les
 * signalements. La formule de la maquette est donc reprise telle quelle,
 * et celle de l'ancienne page abandonnée.
 *
 * ## Les photographies des étapes
 *
 * Elles viennent du jeu de `/guide`, qui illustre le même parcours. La
 * maquette dessine pour l'étape 2 une pièce d'identité et un selfie à
 * l'écran : ces images n'existent pas, et une pièce d'identité fabriquée
 * sur la page qui explique la vérification serait le pire endroit du site
 * pour en poser une. `etape-2` tient la place en attendant une
 * photographie réelle — un homme tenant son téléphone devant son visage,
 * sans document lisible.
 */

type Etape = {
  numero: string;
  icon: IconeMarque;
  titre: string;
  duree: string;
  dureeIcon: IconeMarque;
  description: string;
  image: string;
  alt: string;
  cadrage?: string;
};

const etapes: Etape[] = [
  {
    numero: '01',
    icon: UserPlus,
    titre: 'Créer ton profil',
    duree: '10 minutes',
    dureeIcon: Clock,
    description:
      'Renseigne les informations essentielles et ajoute quelques photos qui te ressemblent.',
    image: '/visuels/guide/etape-1.webp',
    alt: 'Un homme seul sur une terrasse, téléphone en main.',
  },
  {
    numero: '02',
    icon: IdCard,
    titre: 'Vérifier ton identité',
    duree: 'Pièce officielle + selfie',
    dureeIcon: ShieldCheck,
    description:
      'Nous utilisons Stripe Identity pour vérifier ton identité en toute sécurité.',
    image: '/visuels/guide/etape-2.webp',
    alt: 'Un homme assis, téléphone à la main, la ville illuminée derrière lui.',
  },
  {
    numero: '03',
    icon: Users,
    titre: 'Découvrir ton Circle of Six',
    duree: '6 propositions / semaine',
    dureeIcon: Sparkles,
    description:
      'Chaque semaine, six profils vérifiés retenus selon tes valeurs et ton rythme de vie.',
    image: '/visuels/guide/etape-5.webp',
    alt: 'Un groupe d’hommes en conversation lors d’une soirée sur un toit.',
  },
  {
    numero: '04',
    icon: MessageCircle,
    titre: 'Commencer à échanger',
    duree: 'À ton rythme',
    dureeIcon: Heart,
    description:
      'Fais connaissance, discute et organise des rencontres en toute sérénité.',
    image: '/visuels/guide/etape-4.webp',
    alt: 'Deux hommes en conversation sur un canapé, la ville en contrebas.',
  },
];

/** Les trois faits de la vérification. Chacun est vérifiable dans le code. */
const faitsVerification: Array<{
  icon: IconeMarque;
  titre: string;
  description: string;
}> = [
  {
    icon: IdCard,
    titre: 'Document officiel',
    description:
      "Une pièce d'identité en cours de validité : carte d'identité, passeport ou titre de séjour.",
  },
  {
    icon: Camera,
    titre: 'Selfie en direct',
    description:
      "Un selfie de contrôle pour confirmer que c'est bien toi, réalisé via Stripe Identity. Il n'est jamais publié sur ton profil.",
  },
  {
    icon: CreditCard,
    titre: 'Gratuit pour tous',
    description:
      "La vérification est entièrement gratuite, quelle que soit l'offre choisie. Aucune carte bancaire n'est nécessaire.",
  },
];

/**
 * Les bénéfices.
 *
 * « Modération 24/7 » a sauté : rien n'engage une surveillance continue.
 * Ce qui tient, c'est que les profils sont vérifiés et qu'un signalement
 * est lu par une personne.
 */
const benefices: Array<{
  icon: IconeMarque;
  titre: string;
  description: string;
}> = [
  {
    icon: ShieldCheck,
    titre: 'Sécurité et modération',
    description:
      'Des profils vérifiés et une communauté encadrée, pour des échanges plus sereins.',
  },
  {
    icon: Eye,
    titre: 'Confidentialité et visibilité',
    description:
      'Tu restes maître de ce que tu partages et de ta visibilité sur la plateforme.',
  },
  {
    icon: Heart,
    titre: 'Des affinités réelles',
    description:
      'Des profils sélectionnés selon tes valeurs et tes centres d’intérêt.',
  },
  {
    icon: Star,
    titre: 'Une expérience simple et premium',
    description:
      'Un parcours fluide, sans frais cachés, pensé pour des rencontres de qualité.',
  },
];

const faqs = [
  {
    question: 'L’inscription est-elle gratuite ?',
    answer:
      "Oui, vérification d'identité comprise. Le compte gratuit est limité — 5 likes et 10 messages par jour, 3 matchs simultanés — et les offres payantes lèvent ces limites. Mais rien ne te sera demandé pour t'inscrire et faire vérifier ton identité.",
  },
  {
    question: 'Combien de temps prend la vérification ?',
    answer:
      "Quelques instants dans la plupart des cas. Tu photographies ta pièce d'identité puis ton visage en direct, et Stripe Identity compare les deux. La réponse est le plus souvent immédiate ; il arrive qu'une vérification reste en attente le temps d'un contrôle supplémentaire.",
  },
  {
    question: 'Comment fonctionne le Circle of Six ?',
    answer:
      "Chaque lundi, six profils vérifiés sont retenus selon tes valeurs et tes centres d'intérêt. La sélection est figée jusqu'au lundi suivant : pas de défilement infini, et c'est volontaire. À côté, l'annuaire reste accessible pour chercher par toi-même.",
  },
  {
    question: 'Puis-je rester discret ?',
    answer:
      "Oui. Quatre niveaux de visibilité te laissent choisir qui voit ton profil, et le mode fantôme permet de rester sur la plateforme sans y apparaître. Le réglage se change à tout moment.",
  },
];

/** Les trois gages du héros. */
const gages: Array<{ icon: IconeMarque; libelle: string }> = [
  { icon: Users, libelle: 'Gratuit pour tous' },
  { icon: CreditCard, libelle: 'Aucune carte bancaire' },
  { icon: Lock, libelle: 'Données sécurisées' },
];

export default function CommencerPage() {
  const [questionOuverte, setQuestionOuverte] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  const transition = reduceMotion ? { duration: 0 } : { duration: 0.2 };

  return (
    <>
      <Header />

      <main id="contenu" className="bg-nuit text-champagne">
        {/*
          Héros. `solys-05` est semée de bougies et d'une skyline claire :
          sous `lg`, où le texte passe sur la photographie, le voile monte
          à 95 % au milieu et 85 % en haut — c'est le minimum pour que le
          surtitre à 60 % tienne 4,52:1. Au-dessus de `lg`, l'image se range
          à droite et le texte retrouve le fond `nuit` plein.
        */}
        <section className="relative isolate overflow-hidden px-4 sm:px-6 lg:px-16">
          <div className="absolute inset-0 -z-20 lg:left-[40%]">
            <Image
              src="/visuels/solys-05.webp"
              alt="Un groupe d’hommes en conversation sur une terrasse, la ville illuminée derrière eux."
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover object-center"
            />

            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-nuit via-nuit/95 to-nuit/85 lg:bg-gradient-to-r lg:from-nuit lg:via-nuit/30 lg:to-transparent"
            />

            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-nuit to-transparent"
            />
          </div>

          <div className={`relative mx-auto max-w-7xl pb-12 sm:pb-14 ${premierBloc}`}>
            <div className="max-w-xl">
              <Surtitre>Commencer</Surtitre>

              <h1 className="font-display mt-6 text-[34px] font-normal leading-[1.08] tracking-tight text-ivoire sm:text-[48px]">
                Quatre étapes,
                <br />
                <span className="italic text-cuivre">une Sphère vérifiée.</span>
              </h1>

              <p className="mt-5 text-[16px] font-semibold leading-snug text-champagne sm:text-[18px]">
                Inscription et vérification gratuites.
                <br />
                Sans carte bancaire.
              </p>

              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/auth?mode=register"
                  className={`inline-flex items-center justify-center gap-2 rounded-xl bg-degrade-cuivre px-7 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
                >
                  Ouvrir Ma Sphère
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>

                <Link
                  href="/guide"
                  className={`inline-flex items-center justify-center rounded-xl border border-champagne/25 px-7 py-3.5 text-sm font-semibold text-champagne transition-colors hover:border-champagne/50 ${focusRing}`}
                >
                  Lire le guide
                </Link>
              </div>

              <ul className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-[12.5px] text-champagne/80">
                {gages.map(({ icon: Icone, libelle }) => (
                  <li key={libelle} className="flex items-center gap-2">
                    <Icone size={15} aria-hidden="true" className="text-cuivre" />
                    {libelle}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Le parcours en quatre étapes */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-7xl">
            <EnteteSection
              surtitre="Le parcours"
              intro={
                <>
                  Un processus simple, rapide et sécurisé pour rejoindre
                  Sfera&rsquo;Solys et commencer des rencontres authentiques.
                </>
              }
            >
              Ton parcours <span className="italic text-cuivre">en 4 étapes</span>
            </EnteteSection>

            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {etapes.map((etape, index) => {
                const Icone = etape.icon;
                const Duree = etape.dureeIcon;

                return (
                  <li key={etape.numero} className="relative h-full">
                    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-champagne/12 bg-minuit/80">
                      <div className="relative aspect-[16/11] w-full">
                        <Image
                          src={etape.image}
                          alt={etape.alt}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
                          className={`object-cover ${etape.cadrage ?? 'object-center'}`}
                        />

                        <div
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-t from-minuit via-transparent to-nuit/40"
                        />

                        <span
                          aria-hidden="true"
                          className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-cuivre/50 bg-nuit/80 text-[11.5px] font-bold text-cuivre backdrop-blur-sm"
                        >
                          {etape.numero}
                        </span>
                      </div>

                      {/*
                        Le médaillon chevauche la photographie mais vit dans
                        le bloc de texte : posé dans l'image, son
                        `overflow-hidden` le rognerait.
                      */}
                      <div className="relative flex flex-1 flex-col px-5 pb-5 pt-0">
                        <span
                          aria-hidden="true"
                          className="absolute -top-6 left-5 flex h-12 w-12 items-center justify-center rounded-full border border-cuivre/45 bg-nuit text-cuivre"
                        >
                          <Icone size={19} />
                        </span>

                        <h3 className="font-display mt-10 text-[19px] font-normal leading-snug text-ivoire">
                          {etape.titre}
                        </h3>

                        <p className="mt-2 flex items-center gap-2 text-[12px] text-champagne/75">
                          <Duree
                            size={13}
                            aria-hidden="true"
                            className="shrink-0 text-cuivre"
                          />
                          {etape.duree}
                        </p>

                        <p className="mt-3 text-[12.5px] leading-relaxed text-champagne/75">
                          {etape.description}
                        </p>
                      </div>
                    </article>

                    {/*
                      La flèche de liaison. Elle ne s'affiche qu'entre deux
                      cartes effectivement côte à côte : empilées, elle
                      pointerait dans le vide.
                    */}
                    {index < etapes.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="absolute -right-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-cuivre/45 bg-nuit text-cuivre lg:flex"
                      >
                        <ArrowRight size={14} />
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* La vérification, en clair */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-7xl rounded-3xl border border-champagne/12 bg-minuit/70 p-6 sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)] lg:gap-12">
              <div>
                <h2 className="font-display text-[26px] font-normal leading-tight text-ivoire sm:text-[32px]">
                  La vérification,{' '}
                  <span className="italic text-cuivre">en clair.</span>
                </h2>

                <p className="mt-4 text-[13.5px] leading-relaxed text-champagne/80">
                  Une vérification simple et sécurisée, pour une communauté de
                  confiance.
                </p>

                <Link
                  href="/guide"
                  className={`mt-6 inline-flex items-center gap-2 rounded-xl bg-degrade-cuivre px-6 py-3 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
                >
                  En savoir plus
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>

              <ul className="grid gap-7 sm:grid-cols-3 sm:gap-5">
                {faitsVerification.map(({ icon: Icone, titre, description }) => (
                  <li key={titre} className="text-center">
                    <span
                      aria-hidden="true"
                      className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-cuivre/40 bg-nuit/60 text-cuivre"
                    >
                      <Icone size={19} />
                    </span>

                    <h3 className="font-display mt-4 text-[17px] font-normal leading-snug text-ivoire">
                      {titre}
                    </h3>

                    <p className="mt-2 text-[12.5px] leading-relaxed text-champagne/75">
                      {description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/*
          Ce que tu y gagnes. Fond photographique pleine largeur : voile
          mesuré sur `solys-03`, 5,95:1 pour le champagne à 70 % dans la
          zone de texte, 4,78 pour le surtitre à 60 %.
        */}
        <div className="relative isolate overflow-hidden">
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <Image
              src="/visuels/solys-03.webp"
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-[70%_40%]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(10,13,18,0.92)_0%,rgba(10,13,18,0.88)_45%,rgba(10,13,18,0.55)_70%,rgba(10,13,18,0.15)_100%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-nuit via-transparent to-nuit" />
          </div>

          <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
            <div className="mx-auto max-w-7xl">
              <h2 className="font-display text-[26px] font-normal leading-tight text-ivoire sm:text-[32px]">
                Ce que tu y gagnes.
              </h2>

              <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-champagne/80">
                Un espace plus sûr, plus qualitatif et aligné avec tes
                attentes.
              </p>

              <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {benefices.map(({ icon: Icone, titre, description }) => (
                  <li
                    key={titre}
                    className="h-full rounded-2xl border border-champagne/15 bg-minuit/85 p-5 backdrop-blur-sm sm:p-6"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-cuivre/40 bg-nuit/60 text-cuivre"
                    >
                      <Icone size={18} />
                    </span>

                    <h3 className="font-display mt-4 text-[17px] font-normal leading-snug text-ivoire">
                      {titre}
                    </h3>

                    <p className="mt-2 text-[12.5px] leading-relaxed text-champagne/75">
                      {description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* Questions fréquentes */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
              <h2 className="font-display text-[26px] font-normal leading-tight tracking-tight text-ivoire sm:text-[32px]">
                Questions fréquentes
              </h2>

              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center lg:gap-6">
                <p className="max-w-xs text-[13px] leading-relaxed text-champagne/75">
                  Tu ne trouves pas la réponse à ta question&nbsp;? Consulte la
                  FAQ complète.
                </p>

                <Link
                  href="/faq"
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl border border-cuivre/55 bg-cuivre/10 px-5 py-2.5 text-[13px] font-bold text-champagne transition-colors hover:bg-cuivre/20 ${focusRing}`}
                >
                  Voir la FAQ
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="mt-7 space-y-2">
              {faqs.map((faq, index) => {
                const ouverte = questionOuverte === index;

                return (
                  <div
                    key={faq.question}
                    className="overflow-hidden rounded-2xl border border-champagne/12 bg-minuit"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setQuestionOuverte((actuelle) =>
                          actuelle === index ? null : index
                        )
                      }
                      aria-expanded={ouverte}
                      className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left ${focusRing}`}
                    >
                      <span className="text-[14px] font-semibold text-champagne">
                        {faq.question}
                      </span>

                      <ChevronDown
                        size={17}
                        aria-hidden="true"
                        className={`shrink-0 text-champagne/65 transition-transform ${
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
                          transition={transition}
                          className="overflow-hidden"
                        >
                          <p className="border-t border-champagne/12 px-5 py-4 text-[13px] leading-relaxed text-champagne/75">
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

        {/*
          Appel à l'action. Le texte reste dans les 42 % de gauche de
          `solys-07`, où l'image est sombre — 7,12:1 pour le champagne à
          70 %. Au-delà commencent les baies vitrées.
        */}
        <div className="relative isolate overflow-hidden">
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <Image
              src="/visuels/solys-07.webp"
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-[50%_25%]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(10,13,18,0.92)_0%,rgba(10,13,18,0.88)_45%,rgba(10,13,18,0.60)_70%,rgba(10,13,18,0.20)_100%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-nuit via-transparent to-nuit/60" />
          </div>

          <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-16">
            <div className="mx-auto max-w-7xl">
              <h2 className="font-display max-w-lg text-[28px] font-normal leading-[1.15] text-ivoire sm:text-[36px]">
                Ta Sphère
                <br />
                commence <span className="italic text-cuivre">maintenant.</span>
              </h2>

              <p className="mt-4 max-w-md text-[14px] leading-relaxed text-champagne/80">
                Rejoins Sfera&rsquo;Solys et vis des rencontres authentiques,
                dans un cadre sûr et respectueux.
              </p>

              <Link
                href="/auth?mode=register"
                className={`mt-7 inline-flex items-center gap-2 rounded-xl bg-degrade-cuivre px-7 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
              >
                Créer mon profil
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
