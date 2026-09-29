'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  ChevronDown,
  Eye,
  Heart,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

/**
 * Page « Nos valeurs » — direction A (« dossier de vérification »).
 *
 * Réécriture. L'ancienne version partait de la plateforme d'origine et
 * gardait des traces qui avaient survécu au balayage de genre : « une
 * communauté qui prend soin les unes des autres », « Elles parlent de »,
 * « Prête à rejoindre », « Sois parmi les premières ».
 *
 * ## Choix de contenu
 *
 * Chaque valeur est **adossée à une fonctionnalité réelle** du produit, et
 * la carte le dit. Une page de valeurs qui ne s'engage sur rien ne coûte
 * rien à écrire et ne vaut rien à lire ; celle-ci peut se vérifier ligne à
 * ligne sur /fonctionnalites.
 *
 * Deux valeurs de l'ancienne version ont été retirées : « cercles de
 * parole, méditations guidées et rituels » et « ateliers pour le
 * développement personnel ». Elles décrivaient des activités dont rien,
 * dans le code ni dans les autres pages, ne dit qu'elles existent.
 *
 * Le carrousel de témoignages a été retiré au profit d'un lien vers
 * /temoignages, qui fait déjà ce travail avec les vraies données.
 */

/** Anneau de focus commun à toutes les pages migrées. */
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss';

type Valeur = {
  id: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  titre: string;
  resume: string;
  detail: string;
  /** Ce qui, dans le produit, rend la valeur vérifiable. */
  preuve: string;
  /** Le lime est réservé à la validation : une seule valeur le porte. */
  validation?: boolean;
};

const valeurs: Valeur[] = [
  {
    id: 'verification',
    icon: ShieldCheck,
    titre: 'La vérification d’abord',
    resume: "Personne n'entre sans avoir prouvé qui il est.",
    detail:
      "Carte d'identité, passeport ou permis, comparés à un selfie pris en direct par Stripe Identity. Pas une photo choisie dans une galerie, pas un simple numéro de téléphone : un document officiel, ou rien.",
    preuve: 'Document officiel + selfie en direct, sans exception',
    validation: true,
  },
  {
    id: 'authenticite',
    icon: Sparkles,
    titre: 'Être soi, sans masque',
    resume: 'Des profils vrais, des intentions dites franchement.',
    detail:
      "On demande ce que tu cherches dès l'inscription, et on l'affiche. Savoir qui veut quoi évite des semaines de malentendu poli — des deux côtés.",
    preuve: 'Intentions déclarées au dossier, visibles sur le profil',
  },
  {
    id: 'controle',
    icon: Eye,
    titre: 'Ton rythme, ta visibilité',
    resume: 'Tu décides qui te voit, et quand.',
    detail:
      "Profil public, réservé à tes correspondances, priorisé ou discret : le réglage t'appartient et se change à tout moment. Le mode fantôme permet de rester sur la plateforme sans apparaître.",
    preuve: 'Quatre niveaux de visibilité · mode fantôme',
  },
  {
    id: 'ouverture',
    icon: Users,
    titre: 'Tous les hommes',
    resume: 'Toutes les relations, toutes les histoires.',
    detail:
      "Hétérosexuel, gay, bisexuel, pansexuel ou en questionnement : le critère d'entrée porte sur l'âge et l'identité vérifiée, jamais sur l'orientation ni sur le genre des personnes que tu cherches.",
    preuve: "Aucun filtre d'orientation à l'inscription",
  },
  {
    id: 'respect',
    icon: Heart,
    titre: 'Un signalement lu par quelqu’un',
    resume: 'Un signalement est lu par une personne, pas trié par un filtre.',
    detail:
      "Un signalement n'est pas trié par un filtre automatique : une personne le lit et répond. Le consentement se retire aussi facilement qu'il se donne, et une conversation se coupe sans se justifier.",
    preuve: 'Signalement traité par un humain',
  },
  {
    id: 'rythme',
    icon: MessageCircle,
    titre: 'Choisir, pas consommer',
    resume: 'Six profils par semaine, et un annuaire pour chercher.',
    detail:
      "Le Circle of Six propose six profils le lundi, puis s'arrête. À côté, l'annuaire permet de chercher par soi-même. Aucune des deux vues ne défile à l'infini : ce n'est pas un oubli, c'est le produit.",
    preuve: 'Circle of Six hebdomadaire · vue annuaire',
  },
];

/** Règles d'interaction, formulées comme des engagements tenables. */
const regles = [
  "La vérification est gratuite et incluse partout, y compris dans l'offre gratuite.",
  'Un boost met un profil en tête d’Explorer pendant trente minutes, plafonné par l’offre et signalé « Mis en avant » sur la carte : la visibilité s’achète, jamais en silence.',
  "Aucune photo de banque d'images ne sert à illustrer un membre, nulle part sur le site.",
  'Les chiffres affichés viennent de la base, jamais d’une estimation.',
  'Une conversation se termine sans explication, et sans conséquence.',
];

export default function ValeursPage() {
  const [ouverte, setOuverte] = useState<string | null>('verification');
  const shouldReduceMotion = useReducedMotion();

  const fadeUp = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: shouldReduceMotion ? 0 : 0.5, ease: 'easeOut' as const },
  };

  return (
    <>
      <Header />

      <main id="contenu" className="bg-abyss text-cream">
        {/* Hero */}
        <section className="border-b border-cream/8 px-4 pt-20 sm:px-6 sm:pt-24 lg:px-16 xl:pt-28">
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: 'easeOut' }}
            className="mx-auto max-w-3xl py-12 text-center sm:py-16"
          >
            <span className="inline-block rounded-full border border-orange/35 bg-orange/[0.12] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-cream">
              Nos valeurs
            </span>

            <h1 className="font-display [font-stretch:125%] mt-5 text-[30px] font-extrabold leading-[1.15] tracking-tight text-cream sm:text-[40px]">
              Ce qui ne se négocie pas.
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-cream/70 sm:text-base">
              Six principes, et pour chacun ce qui le rend vérifiable dans le
              produit. Une valeur qui ne se traduit par aucune fonctionnalité
              n&apos;est qu&apos;une phrase.
            </p>
          </motion.div>
        </section>

        {/* Les six valeurs */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp}>
              <h2 className="font-display [font-stretch:125%] text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
                Les six principes
              </h2>
              <p className="mb-10 mt-2 max-w-2xl text-[15px] leading-relaxed text-cream/60">
                Sur petit écran, le détail est replié. Touche une carte pour
                l&apos;ouvrir.
              </p>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {valeurs.map((valeur, index) => {
                const Icone = valeur.icon;
                const estOuverte = ouverte === valeur.id;

                return (
                  <motion.article
                    key={valeur.id}
                    {...fadeUp}
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.5,
                      delay: shouldReduceMotion ? 0 : index * 0.05,
                      ease: 'easeOut',
                    }}
                    className="flex flex-col rounded-2xl border border-cream/10 bg-[#123243] p-5 sm:p-6"
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        valeur.validation ? 'bg-lime/15' : 'bg-orange/15'
                      }`}
                    >
                      <Icone
                        size={18}
                        className={valeur.validation ? 'text-lime' : 'text-orange'}
                      />
                    </span>

                    <h3 className="font-display [font-stretch:125%] mt-4 text-[17px] font-bold text-cream">
                      {valeur.titre}
                    </h3>

                    <p className="mt-2 text-[14px] leading-relaxed text-cream/70">
                      {valeur.resume}
                    </p>

                    {/*
                      Le détail est toujours dans le DOM : replié par la
                      hauteur sur mobile, ouvert en permanence à partir de
                      `sm`. Un contenu masqué par `hidden` serait invisible
                      aux moteurs de recherche comme aux lecteurs d'écran.
                    */}
                    <button
                      type="button"
                      onClick={() => setOuverte(estOuverte ? null : valeur.id)}
                      aria-expanded={estOuverte}
                      aria-controls={`valeur-${valeur.id}`}
 className={`mt-3 flex items-center gap-1.5 self-start text-[12px] font-semibold text-cream transition-colors sm:hidden ${focusRing}`}
                    >
                      {estOuverte ? 'Replier' : 'En savoir plus'}
                      <ChevronDown
                        size={13}
                        className={`transition-transform ${estOuverte ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </button>

                    <div
                      id={`valeur-${valeur.id}`}
                      className={`overflow-hidden transition-all duration-300 sm:!max-h-none sm:!opacity-100 ${
                        estOuverte ? 'mt-3 max-h-64 opacity-100' : 'max-h-0 opacity-0 sm:mt-3'
                      }`}
                    >
                      <p className="text-[13px] leading-relaxed text-cream/60">
                        {valeur.detail}
                      </p>
                    </div>

                    <p className="mt-auto flex items-center gap-2 pt-4 text-[11px] font-semibold text-cream/55">
                      <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          valeur.validation ? 'bg-lime' : 'bg-orange'
                        }`}
                      />
                      {valeur.preuve}
                    </p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Les règles */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
            <motion.div {...fadeUp}>
              <h2 className="font-display [font-stretch:125%] text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
                Nos engagements
              </h2>

              <p className="mt-3 text-[15px] leading-relaxed text-cream/65">
                Ce sont des règles, pas des intentions : chacune est une chose
                qu&apos;on s&apos;interdit ou qu&apos;on s&apos;oblige à faire,
                et qui se constate depuis l&apos;extérieur.
              </p>

              <p className="font-accent mt-5 text-[17px] italic leading-relaxed text-orange">
                Une promesse invérifiable n&apos;engage que celui qui
                l&apos;écoute.
              </p>
            </motion.div>

            <motion.ul {...fadeUp} className="space-y-3">
              {regles.map((regle) => (
                <li
                  key={regle}
                  className="flex items-start gap-3 rounded-xl border border-cream/10 bg-[#123243] px-4 py-3.5"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-orange"
                  />
                  <span className="text-[14px] leading-relaxed text-cream/75">
                    {regle}
                  </span>
                </li>
              ))}
            </motion.ul>
          </div>
        </section>

        {/* Renvoi vers les témoignages */}
        <section className="border-b border-cream/8 px-4 py-12 sm:px-6 sm:py-16 lg:px-16">
          <motion.div
            {...fadeUp}
            className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-5 rounded-[1.5rem] border border-cream/10 bg-[#123243] p-6 sm:flex-row sm:items-center sm:p-8"
          >
            <div>
              <h2 className="font-display [font-stretch:125%] text-[19px] font-bold text-cream">
                Et en pratique ?
              </h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-cream/65">
                Les témoignages des membres vérifiés sont rassemblés sur leur
                propre page, avec les vrais mots de ceux qui ont fait le
                parcours.
              </p>
            </div>

            <Link
              href="/temoignages"
              className={`fx-ghost inline-flex shrink-0 items-center gap-2 rounded-xl border border-cream/15 px-5 py-3 text-sm font-bold text-cream transition-colors hover:border-cream/30 ${focusRing}`}
            >
              Lire les témoignages
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </motion.div>
        </section>

        {/* CTA */}
        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-16">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <h2 className="font-display [font-stretch:125%] text-2xl font-extrabold tracking-tight text-cream sm:text-[28px]">
              Rejoindre un endroit qui tient ses règles.
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-cream/65">
              Le dossier prend dix minutes. La vérification, quelques
              instants. Ensuite, c&apos;est à toi de voir.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/inscription"
                className={`fx-btn inline-flex items-center justify-center gap-2 rounded-xl bg-orange px-7 py-3.5 text-sm font-bold text-abyss transition-colors hover:bg-orange/90 ${focusRing}`}
              >
                Constituer mon dossier
                <ArrowRight size={16} aria-hidden="true" />
              </Link>

              <Link
                href="/fonctionnalites"
                className={`fx-ghost inline-flex items-center justify-center rounded-xl border border-cream/15 px-7 py-3.5 text-sm font-bold text-cream transition-colors hover:border-cream/30 ${focusRing}`}
              >
                Voir les fonctionnalités
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </>
  );
}
