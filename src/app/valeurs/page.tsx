'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Eye,
  Heart,
  ImageOff,
  ShieldCheck,
  Star,
  Unlock,
  User,
  Users,
} from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  EnteteSection,
  Filet,
  Surtitre,
  focusRing,
  premierBloc,
  sectionY,
  type IconeMarque,
} from '@/components/brand/mise-en-page';

/**
 * Page « Nos valeurs » — direction « nuit cuivrée », d'après la maquette.
 *
 * ## Ce qui est repris, et ce qui ne l'est pas
 *
 * La composition vient de la maquette : héros photographique, six cartes
 * illustrées, panneau d'engagements en cinq colonnes, renvoi vers les
 * témoignages, appel à l'action.
 *
 * Le **fond** ne bouge pas. Les six principes et les cinq engagements
 * existaient déjà, et chacun avait été adossé à une fonctionnalité réelle
 * lors de la réécriture précédente — deux valeurs de la version d'origine
 * avaient alors été retirées faute d'existence (« cercles de parole,
 * méditations guidées », « ateliers de développement personnel »). Rien
 * n'a été réintroduit ici.
 *
 * Ce qui était développé en texte courant sur chaque carte est désormais
 * replié derrière la flèche : le `detail` et la `preuve` y restent. Le
 * repli se fait par la hauteur, jamais par `hidden` — le contenu demeure
 * dans le DOM, donc lisible par les moteurs de recherche et par les
 * lecteurs d'écran.
 *
 * ## Deux écarts avec la maquette
 *
 * 1. « Des photos réelles de membres vérifiés uniquement ». Aucune
 *    validation de photo n'existe dans le code : les visages déposés par
 *    les membres ne sont contrôlés nulle part. L'engagement réel, et
 *    celui qui est écrit, porte sur **les illustrations du site** : aucune
 *    photo de banque d'images n'y représente un membre.
 *
 * 2. « Une modération humaine et réactive ». « Réactive » promet un délai
 *    que rien n'engage. Ce qui est vrai : un signalement est lu par une
 *    personne, pas trié par un filtre.
 *
 * Le cadenas de la maquette, enfin, est devenu un cadenas **ouvert** :
 * il accompagne « Ta liberté avant tout », et un cadenas fermé y dit
 * l'inverse de la phrase.
 *
 * ## Les photographies des cartes sont provisoires
 *
 * Les six `image` ci-dessous viennent du jeu du guide, où elles servent
 * déjà. Elles conviennent au sujet, mais elles apparaissent alors deux
 * fois sur le site public. Elles sont regroupées dans un seul tableau
 * pour que leur remplacement tienne en six lignes.
 */

type Valeur = {
  id: string;
  icon: IconeMarque;
  titre: string;
  resume: string;
  detail: string;
  /** Ce qui, dans le produit, rend la valeur vérifiable. */
  preuve: string;
  /** Provisoire — voir l'en-tête du fichier. */
  image: string;
  alt: string;
  /**
   * Point de cadrage, quand le centre ne convient pas. Les sources sont
   * en portrait et les cartes en 16/10 : le recadrage mord en haut et en
   * bas, et sur `etape-3` un cadrage centré coupe le haut du crâne.
   */
  cadrage?: string;
  /** Le vert de validation est réservé à la vérification d'identité. */
  validation?: boolean;
};

const valeurs: Valeur[] = [
  {
    id: 'verification',
    icon: ShieldCheck,
    titre: 'La vérification d’abord',
    resume:
      'Des profils authentiques grâce à la vérification d’identité : pièce officielle et selfie en direct.',
    detail:
      "Carte d'identité, passeport ou permis, comparés à un selfie pris en direct par Stripe Identity. Pas une photo choisie dans une galerie, pas un simple numéro de téléphone : un document officiel, ou rien.",
    preuve: 'Document officiel + selfie en direct, sans exception',
    image: '/visuels/guide/etape-1.webp',
    alt: 'Un homme seul sur une terrasse, téléphone en main.',
    validation: true,
  },
  {
    id: 'authenticite',
    icon: User,
    titre: 'Être soi, sans masque',
    resume:
      'Des intentions claires et des échanges honnêtes, sans pression ni jugement.',
    detail:
      "On demande ce que tu cherches dès l'inscription, et on l'affiche. Savoir qui veut quoi évite des semaines de malentendu poli — des deux côtés.",
    preuve: 'Intentions déclarées dans ta sphère, visibles sur le profil',
    image: '/visuels/guide/conseil-3.webp',
    alt: 'Un homme détendu sur un canapé, la ville illuminée derrière lui.',
  },
  {
    id: 'controle',
    icon: Eye,
    titre: 'Ton rythme, ta visibilité',
    resume:
      'Des outils pour garder le contrôle : mode fantôme, confidentialité et gestion de ta visibilité.',
    detail:
      "Profil public, réservé à tes correspondances, priorisé ou discret : le réglage t'appartient et se change à tout moment. Le mode fantôme permet de rester sur la plateforme sans apparaître.",
    preuve: 'Quatre niveaux de visibilité · mode fantôme',
    image: '/visuels/guide/etape-3.webp',
    alt: 'Un homme de profil, lunettes sombres, devant la ville au crépuscule.',
    cadrage: 'object-[50%_25%]',
  },
  {
    id: 'ouverture',
    icon: Heart,
    titre: 'Tous les hommes',
    resume:
      'Un espace ouvert à toutes les orientations, pour des rencontres vraies et respectueuses.',
    detail:
      "Hétérosexuel, gay, bisexuel, pansexuel ou en questionnement : le critère d'entrée porte sur l'âge et l'identité vérifiée, jamais sur l'orientation ni sur le genre des personnes que tu cherches.",
    preuve: "Aucun filtre d'orientation à l'inscription",
    image: '/visuels/guide/etape-5.webp',
    alt: 'Un groupe d’hommes en conversation lors d’une soirée sur un toit.',
  },
  {
    id: 'respect',
    icon: Bell,
    titre: 'Un signalement lu par quelqu’un',
    resume:
      'Une modération humaine, pas un filtre automatique, pour un environnement plus sûr.',
    detail:
      "Un signalement n'est pas trié par un filtre automatique : une personne le lit et répond. Le consentement se retire aussi facilement qu'il se donne, et une conversation se coupe sans se justifier.",
    preuve: 'Signalement traité par un humain',
    image: '/visuels/guide/conseil-2.webp',
    alt: 'Un homme assis, pensif, dans un salon éclairé à la bougie.',
  },
  {
    id: 'rythme',
    icon: Users,
    titre: 'Choisir, pas consommer',
    resume:
      'Le Circle of Six : six profils sélectionnés chaque semaine, pour des rencontres plus choisies.',
    detail:
      "Le Circle of Six propose six profils le lundi, puis s'arrête. À côté, l'annuaire permet de chercher par soi-même. Aucune des deux vues ne défile à l'infini : ce n'est pas un oubli, c'est le produit.",
    preuve: 'Circle of Six hebdomadaire · vue annuaire',
    image: '/visuels/guide/conseil-1.webp',
    alt: 'Un homme seul dans un salon, un verre posé devant lui.',
  },
];

/**
 * Les cinq engagements du panneau.
 *
 * Chacun reformule une règle déjà écrite sur cette page, et chacune se
 * constate depuis l'extérieur : c'est la condition pour y figurer.
 */
const engagements: Array<{
  icon: IconeMarque;
  titre: string;
  description: string;
}> = [
  {
    icon: ShieldCheck,
    titre: 'Vérification gratuite',
    description: "Incluse dans toutes les offres, celle à 0 € comprise.",
  },
  {
    icon: Star,
    titre: 'Boosts toujours signalés',
    description:
      'Un profil mis en avant porte la mention « Mis en avant » : la visibilité s’achète, jamais en silence.',
  },
  {
    icon: ImageOff,
    titre: 'Aucune banque d’images',
    description:
      'Aucune photo de stock ne sert à représenter un membre, nulle part sur le site.',
  },
  {
    icon: BarChart3,
    titre: 'Chiffres réels uniquement',
    description:
      'Les nombres affichés viennent de la base, jamais d’une estimation.',
  },
  {
    icon: Unlock,
    titre: 'Ta liberté avant tout',
    description:
      'Une conversation se termine sans explication, et sans conséquence.',
  },
];

export default function ValeursPage() {
  const [ouverte, setOuverte] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  /**
   * Le dépli est une transition CSS, pas une animation framer-motion : il
   * n'y a qu'une hauteur et une opacité à interpoler. `prefers-reduced-motion`
   * est honoré en annulant la durée plutôt qu'en gardant un mouvement court.
   */
  const dureeDepli = reduceMotion ? 'duration-0' : 'duration-300';

  return (
    <>
      <Header />

      <main id="contenu" className="bg-nuit text-champagne">
        {/*
          Héros. La photographie se range à droite à partir de `lg`, et le
          texte retrouve le fond `nuit` plein. En dessous, elle passe
          derrière : voile vertical à 93 % au milieu et 75 % en haut, les
          valeurs mesurées sur cette image pour /tarifs (5,78:1 pour le
          champagne à 70 %, 4,67 pour le surtitre à 60 %).
        */}
        <section className="relative isolate overflow-hidden px-4 sm:px-6 lg:px-16">
          <div className="absolute inset-0 -z-20 lg:left-[38%]">
            <Image
              src="/visuels/solys-01.webp"
              alt="Deux hommes en conversation sur une terrasse, la ville illuminée derrière eux."
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 62vw"
              className="object-cover object-[65%_30%]"
            />

            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-nuit via-nuit/93 to-nuit/75 lg:bg-gradient-to-r lg:from-nuit lg:via-nuit/30 lg:to-transparent"
            />

            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-nuit to-transparent"
            />
          </div>

          <div className={`relative mx-auto max-w-7xl pb-14 sm:pb-16 ${premierBloc}`}>
            <div className="max-w-xl">
              <Surtitre>Nos valeurs</Surtitre>

              <h1 className="font-display mt-6 text-[34px] font-normal leading-[1.08] tracking-tight text-ivoire sm:text-[48px]">
                Ce qui{' '}
                <span className="italic text-cuivre">ne se négocie pas.</span>
              </h1>

              <p className="mt-5 text-[16px] font-semibold leading-snug text-champagne sm:text-[18px]">
                Six principes, des engagements concrets.
              </p>

              <p className="mt-3 max-w-md text-[14px] leading-relaxed text-champagne/80 sm:text-[15px]">
                Sfera&rsquo;Solys est plus qu&apos;une application de
                rencontres. C&apos;est un espace pensé pour des échanges
                sincères, respectueux et alignés avec ce qui compte pour toi.
              </p>

              <Link
                href="#principes"
                className={`mt-8 inline-flex items-center gap-2 rounded-xl bg-degrade-cuivre px-7 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
              >
                Découvrir nos principes
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Les six principes */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-7xl">
            <EnteteSection
              surtitre="Nos principes"
              intro={
                <>
                  Des rencontres plus vraies, dans un cadre plus sain.
                  <br />
                  Voici ce qui guide chacune de nos décisions.
                </>
              }
            >
              <span id="principes" className="scroll-mt-28 xl:scroll-mt-32">
                Nos 6 principes
              </span>
            </EnteteSection>

            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {valeurs.map((valeur) => {
                const Icone = valeur.icon;
                const estOuverte = ouverte === valeur.id;

                return (
                  <li key={valeur.id} className="h-full">
                    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-champagne/12 bg-minuit/80">
                      <div className="relative aspect-[16/10] w-full">
                        <Image
                          src={valeur.image}
                          alt={valeur.alt}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
                          className={`object-cover ${valeur.cadrage ?? 'object-center'}`}
                        />
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-t from-minuit via-transparent to-transparent"
                        />
                      </div>

                      {/*
                        Le médaillon chevauche la photographie, mais il vit
                        dans le bloc de texte : posé dans l'image, le
                        `overflow-hidden` de celle-ci le rognerait — c'est
                        exactement ce qui était arrivé aux pastilles
                        numérotées du guide.
                      */}
                      <div className="relative flex flex-1 flex-col px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
                        <span
                          aria-hidden="true"
                          className={`absolute -top-6 left-5 flex h-12 w-12 items-center justify-center rounded-full border bg-nuit sm:left-6 ${
                            valeur.validation
                              ? 'border-succes/50 text-succes'
                              : 'border-cuivre/45 text-cuivre'
                          }`}
                        >
                          <Icone size={19} />
                        </span>

                        <h3 className="font-display mt-10 text-[19px] font-normal leading-snug text-ivoire">
                          {valeur.titre}
                        </h3>

                        <p className="mt-2.5 text-[13px] leading-relaxed text-champagne/75">
                          {valeur.resume}
                        </p>

                        {/*
                          Le détail est replié par la hauteur, jamais par
                          `hidden` : il reste dans le DOM, donc lisible par
                          les moteurs de recherche comme par les lecteurs
                          d'écran.
                        */}
                        <div
                          id={`valeur-${valeur.id}`}
                          className={`overflow-hidden transition-all ${dureeDepli} ${
                            estOuverte
                              ? 'mt-4 max-h-80 opacity-100'
                              : 'max-h-0 opacity-0'
                          }`}
                        >
                          <p className="text-[13px] leading-relaxed text-champagne/70">
                            {valeur.detail}
                          </p>

                          <p className="mt-3 flex items-start gap-2 text-[11.5px] font-semibold leading-snug text-champagne/70">
                            <span
                              aria-hidden="true"
                              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                                valeur.validation ? 'bg-succes' : 'bg-cuivre'
                              }`}
                            />
                            {valeur.preuve}
                          </p>
                        </div>

                        <div className="mt-auto flex justify-end pt-5">
                          <button
                            type="button"
                            onClick={() =>
                              setOuverte(estOuverte ? null : valeur.id)
                            }
                            aria-expanded={estOuverte}
                            aria-controls={`valeur-${valeur.id}`}
                            className={`flex h-10 w-10 items-center justify-center rounded-full border border-cuivre/45 text-cuivre transition-colors hover:border-cuivre hover:bg-cuivre/10 ${focusRing}`}
                          >
                            <span className="sr-only">
                              {estOuverte
                                ? `Replier « ${valeur.titre} »`
                                : `En savoir plus sur « ${valeur.titre} »`}
                            </span>
                            <ArrowRight
                              size={16}
                              aria-hidden="true"
                              className={`transition-transform ${
                                estOuverte ? '-rotate-90' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Les engagements */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-7xl rounded-3xl border border-champagne/12 bg-minuit/70 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
              <h2 className="font-display text-[26px] font-normal leading-tight text-ivoire sm:text-[32px]">
                Nos engagements,{' '}
                <span className="italic text-cuivre">dans les faits</span>
              </h2>

              <p className="text-[13px] leading-relaxed text-champagne/75 lg:text-right">
                Des principes concrets, appliqués au quotidien.
              </p>
            </div>

            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0 lg:divide-x lg:divide-champagne/15">
              {engagements.map(({ icon: Icone, titre, description }) => (
                <li key={titre} className="text-center lg:px-5">
                  <span
                    aria-hidden="true"
                    className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-cuivre/40 bg-nuit/60 text-cuivre"
                  >
                    <Icone size={18} />
                  </span>

                  <h3 className="mt-3.5 text-[13.5px] font-semibold text-champagne">
                    {titre}
                  </h3>

                  <p className="mx-auto mt-1.5 max-w-[26ch] text-[12.5px] leading-relaxed text-champagne/70">
                    {description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/*
          Renvoi vers les témoignages.

          Voile mesuré sur `solys-08` : dans les 45 % de gauche, le
          champagne à 70 % tient 5,97:1 et le cuivre 5,25.
        */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-3xl border border-champagne/12">
            <Image
              src="/visuels/solys-08.webp"
              alt=""
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="-z-10 object-cover object-[60%_45%]"
            />

            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(10,13,18,0.92)_0%,rgba(10,13,18,0.88)_45%,rgba(10,13,18,0.55)_70%,rgba(10,13,18,0.15)_100%)]"
            />

            <div className="p-7 sm:p-9 lg:p-10">
              <h2 className="font-display text-[24px] font-normal leading-tight text-ivoire sm:text-[30px]">
                Et en pratique&nbsp;?
              </h2>

              <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-champagne/80">
                Découvre comment ces valeurs se traduisent au quotidien sur
                Sfera&rsquo;Solys.
              </p>

              <Link
                href="/temoignages"
                className={`mt-6 inline-flex items-center gap-2 rounded-xl bg-degrade-cuivre px-6 py-3 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
              >
                Voir les témoignages
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <Filet />

        {/* Appel à l'action */}
        <div className="relative isolate overflow-hidden">
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <Image
              src="/visuels/solys-04.webp"
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-[60%_50%]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(10,13,18,0.92)_0%,rgba(10,13,18,0.88)_45%,rgba(10,13,18,0.55)_70%,rgba(10,13,18,0.15)_100%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-nuit via-transparent to-nuit/70" />
          </div>

          <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-16">
            <div className="mx-auto max-w-7xl">
              <h2 className="font-display max-w-xl text-[28px] font-normal leading-[1.15] text-ivoire sm:text-[36px]">
                Rejoindre un endroit
                <br />
                <span className="italic text-cuivre">qui tient ses règles.</span>
              </h2>

              <p className="mt-4 max-w-md text-[14px] leading-relaxed text-champagne/80">
                Des rencontres authentiques, dans un cadre sûr et respectueux.
                Ouvrir ta sphère prend dix minutes, la vérification quelques
                instants.
              </p>

              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/commencer"
                  className={`inline-flex items-center justify-center gap-2 rounded-xl bg-degrade-cuivre px-7 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
                >
                  Ouvrir ma sphère
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>

                <Link
                  href="/fonctionnalites"
                  className={`inline-flex items-center justify-center rounded-xl border border-champagne/25 px-7 py-3.5 text-sm font-semibold text-champagne transition-colors hover:border-champagne/50 ${focusRing}`}
                >
                  Voir les fonctionnalités
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
