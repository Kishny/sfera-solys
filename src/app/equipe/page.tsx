'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Code,
  MessageCircle,
  Palette,
  Settings,
  ShieldCheck,
  SquareUser,
  UserCheck,
} from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EclipseMark from '@/components/brand/EclipseMark';
import {
  EnteteSection,
  Surtitre,
  focusRing,
  premierBloc,
  sectionY,
  type IconeMarque,
} from '@/components/brand/mise-en-page';

/**
 * Page Équipe — direction « nuit cuivrée », d'après la maquette.
 *
 * ## Le fond ne bouge pas
 *
 * Les quatre pôles, leur mission et leur détail existaient déjà et
 * avaient été écrits pour être vérifiables. La refonte reprend la
 * composition de la maquette — héros photographique, quatre cartes,
 * bandeau de fonctionnement en trois temps, bloc de transparence,
 * bandeau de contact — sans rien ajouter au contenu.
 *
 * Le bandeau « Un fonctionnement clair et humain » est le seul bloc
 * nouveau, et il ne dit rien que les cartes ne disaient déjà : la
 * vérification est automatisée (Stripe Identity), les signalements sont
 * lus par une personne, les règles s'appliquent ensuite.
 *
 * ## Les quatre visuels de cartes sont volontairement abstraits
 *
 * La maquette illustre chaque pôle par une photographie de poste de
 * travail : des écrans montrant l'interface Sfera'Solys, des pièces
 * d'identité posées sur un bureau, des palettes de couleurs, du code.
 *
 * Aucune n'existe, et une image générée poserait ici un problème
 * particulier : ces écrans montreraient une interface qui n'est pas la
 * nôtre, sur la page même qui explique qu'on ne met pas de visages
 * inventés. Le reproche qu'on s'adresse plus bas vaudrait pour les
 * captures.
 *
 * D'ici à de **vraies captures d'écran du produit**, chaque carte porte
 * un panneau composé : un dégradé de la charte et le pictogramme du pôle
 * en grand, atténué. C'est assumé comme un parti pris graphique, pas
 * comme une image manquante — et le jour où les captures existent, elles
 * remplacent le panneau sans toucher au reste.
 *
 * ## Le délai de réponse
 *
 * La maquette écrit « dans les meilleurs délais », et c'est ce qui est
 * repris. À noter pour plus tard : /contact annonce « sous 24 à 48 h »
 * et /faq « réponse sous 24 h ». Les deux ne peuvent pas être vrais, et
 * aucun des deux n'est mesuré par quoi que ce soit dans le code.
 */

type Pole = {
  id: string;
  icon: IconeMarque;
  titre: string;
  description: string;
  detail: string;
  /** Le vert de validation est réservé au pôle vérification. */
  validation?: boolean;
};

const poles: Pole[] = [
  {
    id: 'verification',
    icon: ShieldCheck,
    titre: 'Vérification et modération',
    description:
      "La vérification d'identité est automatisée avec Stripe Identity. Une personne examine les signalements et applique nos règles de manière humaine et impartiale.",
    detail:
      "Ce qui reste humain, c'est le jugement. Un signalement est lu par quelqu'un, et c'est le travail du projet qui ne sera jamais confié à un filtre.",
    validation: true,
  },
  {
    id: 'produit',
    icon: Palette,
    titre: 'Produit et direction artistique',
    description:
      "Nous travaillons sur l'expérience, les contenus, l'identité graphique et les évolutions du produit, pour une plateforme claire, élégante et pensée pour toi.",
    detail:
      "La plupart des décisions de ce pôle consistent à ne pas ajouter une fonctionnalité qui ferait monter les chiffres au détriment de l'expérience.",
  },
  {
    id: 'technique',
    icon: Code,
    titre: 'Technique et plateforme',
    description:
      "Nous développons et maintenons l'interface, les API, la sécurité des données, la messagerie, les paiements et la conformité RGPD.",
    detail:
      "Authentification, messagerie, paiements, hébergement des photos. Le RGPD n'y est pas une case à cocher mais une contrainte de conception.",
  },
  {
    id: 'relation',
    icon: MessageCircle,
    titre: 'Relation membres',
    description:
      "Nous répondons à tes questions, recueillons tes retours et restons à l'écoute pour améliorer ton expérience sur Sfera'Solys.",
    detail:
      "Les messages de la page contact atterrissent ici. Les retours répétés deviennent des décisions produit — c'est le chemin le plus court entre un membre et un changement sur le site.",
  },
];

/** Les trois temps du bandeau de fonctionnement. */
const etapes: Array<{
  numero: string;
  icon: IconeMarque;
  titre: string;
  description: string;
}> = [
  {
    numero: '01',
    icon: UserCheck,
    titre: 'Vérifier',
    description:
      "La vérification d'identité est automatisée avec Stripe Identity.",
  },
  {
    numero: '02',
    icon: SquareUser,
    titre: 'Écouter',
    description:
      'Les signalements et les demandes sont examinés par une personne.',
  },
  {
    numero: '03',
    icon: Settings,
    titre: 'Agir',
    description:
      "Nous appliquons nos règles et prenons des mesures quand il le faut.",
  },
];

export default function EquipePage() {
  const [ouvert, setOuvert] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  /**
   * Le dépli est une transition CSS : il n'y a qu'une hauteur et une
   * opacité à interpoler. `prefers-reduced-motion` est honoré en annulant
   * la durée plutôt qu'en gardant un mouvement court.
   */
  const dureeDepli = reduceMotion ? 'duration-0' : 'duration-300';

  return (
    <>
      <Header />

      <main id="contenu" className="bg-nuit text-champagne">
        {/*
          Héros. `solys-10` est la plus intérieure du jeu — terrasse sombre,
          baie vitrée, bougies. Mesuré dessus : sous `lg`, où le texte passe
          sur la photographie, le voile vertical 92 % au milieu et 78 % en
          haut laisse le surtitre à 60 % tenir 4,86:1.
        */}
        <section className="relative isolate overflow-hidden px-4 sm:px-6 lg:px-16">
          <div className="absolute inset-0 -z-20 lg:left-[42%]">
            <Image
              src="/visuels/solys-10.webp"
              alt="Une terrasse éclairée à la bougie devant une baie vitrée, la ville au loin."
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover object-center"
            />

            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-nuit via-nuit/92 to-nuit/78 lg:bg-gradient-to-r lg:from-nuit lg:via-nuit/30 lg:to-transparent"
            />

            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-nuit to-transparent"
            />
          </div>

          <div className={`relative mx-auto max-w-7xl pb-14 sm:pb-16 ${premierBloc}`}>
            <div className="max-w-xl">
              <Surtitre>Notre équipe</Surtitre>

              <h1 className="font-display mt-6 text-[34px] font-normal leading-[1.08] tracking-tight text-ivoire sm:text-[48px]">
                Qui regarde
                <br />
                <span className="italic text-cuivre">ton dossier.</span>
              </h1>

              <p className="mt-5 text-[16px] font-semibold leading-snug text-champagne sm:text-[18px]">
                Derrière chaque décision, un engagement humain.
              </p>

              <p className="mt-3 max-w-md text-[14px] leading-relaxed text-champagne/80 sm:text-[15px]">
                Sfera&rsquo;Solys, c&apos;est une petite équipe qui travaille
                au quotidien à offrir un espace de rencontre sûr, respectueux
                et authentique.
              </p>

              <Link
                href="#poles"
                className={`mt-8 inline-flex items-center gap-2 rounded-xl bg-degrade-cuivre px-7 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
              >
                Découvrir nos pôles
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Les quatre pôles */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-7xl">
            <EnteteSection
              surtitre="Nos 4 pôles"
              intro={
                <>
                  Chacun a un rôle clé pour garantir une expérience de
                  qualité, du premier contact à ta vie sur la plateforme.
                </>
              }
            >
              <span id="poles" className="scroll-mt-28 xl:scroll-mt-32">
                Une équipe, quatre domaines complémentaires.
              </span>
            </EnteteSection>

            <ul className="mt-8 grid gap-4 lg:grid-cols-2">
              {poles.map((pole) => {
                const Icone = pole.icon;
                const estOuvert = ouvert === pole.id;

                return (
                  <li key={pole.id} className="h-full">
                    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-champagne/12 bg-minuit/80">
                      {/*
                        Panneau composé, en attendant de vraies captures du
                        produit. Voir l'en-tête du fichier : une capture
                        inventée serait, sur cette page précisément, la même
                        faute qu'un visage inventé.
                      */}
                      <div className="relative aspect-[16/7] w-full overflow-hidden bg-gradient-to-br from-minuit via-nuit to-minuit">
                        <EclipseMark
                          id={`equipe-${pole.id}`}
                          attenuation={0}
                          className="pointer-events-none absolute -right-10 top-1/2 h-[220px] w-[220px] -translate-y-1/2 opacity-[0.18]"
                        />

                        <Icone
                          size={76}
                          aria-hidden="true"
                          className={`absolute left-8 top-1/2 -translate-y-1/2 ${
                            pole.validation ? 'text-succes/20' : 'text-cuivre/20'
                          }`}
                        />

                        <div
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-t from-minuit via-transparent to-transparent"
                        />
                      </div>

                      {/*
                        Le médaillon chevauche le panneau mais vit dans le
                        bloc de texte : posé dans le panneau, son
                        `overflow-hidden` le rognerait.
                      */}
                      <div className="relative flex flex-1 flex-col px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
                        <span
                          aria-hidden="true"
                          className={`absolute -top-6 left-5 flex h-12 w-12 items-center justify-center rounded-full border bg-nuit sm:left-6 ${
                            pole.validation
                              ? 'border-succes/50 text-succes'
                              : 'border-cuivre/45 text-cuivre'
                          }`}
                        >
                          <Icone size={19} />
                        </span>

                        <h3 className="font-display mt-10 text-[20px] font-normal leading-snug text-ivoire">
                          {pole.titre}
                        </h3>

                        <p className="mt-2.5 text-[13px] leading-relaxed text-champagne/75">
                          {pole.description}
                        </p>

                        {/*
                          Replié par la hauteur, jamais par `hidden` : le
                          détail reste dans le DOM, donc indexable et lisible
                          au lecteur d'écran.
                        */}
                        <div
                          id={`pole-${pole.id}`}
                          className={`overflow-hidden transition-all ${dureeDepli} ${
                            estOuvert
                              ? 'mt-4 max-h-80 opacity-100'
                              : 'max-h-0 opacity-0'
                          }`}
                        >
                          <p className="border-l border-cuivre/35 pl-4 text-[13px] leading-relaxed text-champagne/70">
                            {pole.detail}
                          </p>
                        </div>

                        <div className="mt-auto flex justify-end pt-5">
                          <button
                            type="button"
                            onClick={() => setOuvert(estOuvert ? null : pole.id)}
                            aria-expanded={estOuvert}
                            aria-controls={`pole-${pole.id}`}
                            className={`flex h-10 w-10 items-center justify-center rounded-full border border-cuivre/45 text-cuivre transition-colors hover:border-cuivre hover:bg-cuivre/10 ${focusRing}`}
                          >
                            <span className="sr-only">
                              {estOuvert
                                ? `Replier « ${pole.titre} »`
                                : `En savoir plus sur « ${pole.titre} »`}
                            </span>
                            <ArrowRight
                              size={16}
                              aria-hidden="true"
                              className={`transition-transform ${
                                estOuvert ? '-rotate-90' : ''
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

        {/* Un fonctionnement clair et humain */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-7xl rounded-3xl border border-champagne/12 bg-minuit/70 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
              <h2 className="font-display text-[26px] font-normal leading-tight text-ivoire sm:text-[32px]">
                Un fonctionnement clair et humain.
              </h2>

              <p className="max-w-sm text-[13px] leading-relaxed text-champagne/75 lg:text-right">
                Une part d&apos;automatisation, une part d&apos;intervention
                humaine, pour garantir un espace sûr et respectueux.
              </p>
            </div>

            <ol className="mt-8 grid gap-7 lg:grid-cols-3 lg:gap-4">
              {etapes.map(({ numero, icon: Icone, titre, description }, index) => (
                <li key={numero} className="relative flex items-start gap-4">
                  <span className="font-display shrink-0 text-[17px] leading-none text-cuivre/70">
                    {numero}
                  </span>

                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cuivre/40 bg-nuit/60 text-cuivre"
                  >
                    <Icone size={18} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-[17px] font-normal leading-snug text-ivoire">
                      {titre}
                    </h3>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-champagne/70">
                      {description}
                    </p>
                  </div>

                  {/*
                    Le trait de liaison de la maquette. Il ne s'affiche
                    qu'entre deux étapes, et seulement là où elles sont
                    côte à côte — empilées, il pointerait dans le vide.
                  */}
                  {index < etapes.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute -right-2 top-5 hidden h-px w-4 bg-cuivre/35 lg:block"
                    />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Pourquoi aucun visage */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-3xl border border-champagne/12 bg-minuit/70 p-6 sm:p-9 lg:p-11">
            <EclipseMark
              id="equipe-transparence"
              attenuation={0}
              withCorona
              className="pointer-events-none absolute -right-20 top-1/2 h-[300px] w-[300px] -translate-y-1/2 opacity-25 lg:right-[2%] lg:h-[380px] lg:w-[380px]"
            />

            <div className="relative max-w-2xl">
              <Surtitre>Notre transparence</Surtitre>

              <h2 className="font-display mt-5 text-[26px] font-normal leading-tight text-ivoire sm:text-[32px]">
                Pourquoi aucun visage
                <br />
                sur cette page&nbsp;?
              </h2>

              <p className="mt-5 text-[14px] leading-relaxed text-champagne/80">
                Parce qu&apos;il n&apos;y a rien de vrai à montrer pour
                l&apos;instant. Mettre des portraits achetés et des prénoms
                inventés sur la page d&apos;une plateforme qui demande à
                chaque membre une pièce d&apos;identité serait difficile à
                défendre.
              </p>

              <p className="mt-4 text-[14px] leading-relaxed text-champagne/80">
                Nous préférons aussi préserver notre vie privée et rester
                concentrés sur l&apos;essentiel : ton expérience. Si des
                portraits paraissent ici un jour, ce seront ceux de vraies
                personnes de l&apos;équipe.
              </p>

              <p className="font-display mt-6 text-[17px] italic leading-relaxed text-cuivre">
                On demande aux membres de prouver qui ils sont. Le minimum est
                de ne pas mentir sur qui nous sommes.
              </p>
            </div>
          </div>
        </section>

        {/*
          Bandeau de contact : la photographie est à gauche, le texte à
          droite — c'est le seul bandeau du site dans ce sens, et la
          maquette le veut ainsi. Voile mesuré sur `solys-02` dans la zone
          de texte : 5,55:1 pour le champagne à 70 %, 4,51 pour le surtitre
          à 60 %.
        */}
        <div className="relative isolate overflow-hidden">
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <Image
              src="/visuels/solys-02.webp"
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-[35%_55%]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(10,13,18,0.15)_0%,rgba(10,13,18,0.55)_35%,rgba(10,13,18,0.90)_58%,rgba(10,13,18,0.94)_100%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-nuit via-transparent to-nuit/60" />
          </div>

          <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-16">
            <div className="mx-auto flex max-w-7xl justify-end">
              <div className="w-full lg:w-[45%]">
                <Surtitre>Contact</Surtitre>

                <h2 className="font-display mt-5 text-[26px] font-normal leading-tight text-ivoire sm:text-[32px]">
                  Une question pour l&rsquo;équipe&nbsp;?
                </h2>

                <p className="mt-4 text-[14px] leading-relaxed text-champagne/80">
                  Nous sommes à ton écoute. N&apos;hésite pas à nous écrire,
                  nous te répondrons dans les meilleurs délais.
                </p>

                <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/contact"
                    className={`inline-flex items-center justify-center gap-2 rounded-xl bg-degrade-cuivre px-6 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
                  >
                    Nous écrire
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>

                  <Link
                    href="/histoire"
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border border-champagne/25 px-6 py-3.5 text-sm font-semibold text-champagne transition-colors hover:border-champagne/50 ${focusRing}`}
                  >
                    Notre histoire
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
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
