'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Code, MessageCircle, Palette, ShieldCheck } from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

/**
 * Page Équipe — direction A (« dossier de vérification »).
 *
 * ## Une contrainte assumée : pas de visages
 *
 * L'ancienne page présentait quatre pôles sans personne derrière, chacun
 * marqué « Bientôt dévoilé », avec un emoji lune — le symbole de la marque
 * d'origine — et une description qui parlait de « protection des
 * utilisatrices ».
 *
 * La structure en pôles est **conservée telle quelle**, et pour une bonne
 * raison : il n'y a pas de membres d'équipe publics à montrer, et en
 * inventer serait exactement ce que le site reproche aux autres
 * plateformes. On l'écrit donc franchement plutôt que de le maquiller en
 * teasing.
 *
 * Quand de vraies personnes pourront être nommées, ce fichier est prêt à
 * les recevoir : il suffit d'ajouter `nom` et `photo` au type `Pole`.
 */

/** Anneau de focus commun à toutes les pages migrées. */
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss';

type Pole = {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  titre: string;
  mission: string;
  detail: string;
  /** Le lime est réservé à la validation : seul le pôle vérification le porte. */
  validation?: boolean;
};

const poles: Pole[] = [
  {
    icon: ShieldCheck,
    titre: 'Vérification et modération',
    mission: "Lire les signalements, trancher, faire respecter les règles.",
    detail:
      "La vérification d'identité, elle, est automatisée : Stripe Identity compare un document officiel à un selfie pris en direct, en quelques instants. Ce qui reste humain, c'est le jugement — un signalement est lu par quelqu'un, et c'est le travail du projet qui ne sera jamais confié à un filtre.",
    validation: true,
  },
  {
    icon: Palette,
    titre: 'Produit et direction artistique',
    mission: 'Décider quoi construire, et surtout quoi refuser.',
    detail:
      "Les parcours, la copy, l'identité visuelle. La plupart des décisions de ce pôle consistent à ne pas ajouter une fonctionnalité qui ferait monter les chiffres au détriment de l'expérience.",
  },
  {
    icon: Code,
    titre: 'Technique et plateforme',
    mission: "L'interface, les API, la sécurité des données.",
    detail:
      "Authentification, messagerie, paiements, hébergement des photos. Et la conformité RGPD, qui n'est pas une case à cocher mais une contrainte de conception.",
  },
  {
    icon: MessageCircle,
    titre: 'Relation membres',
    mission: 'Répondre, écouter, faire remonter.',
    detail:
      "Les messages de la page contact atterrissent ici. Les retours répétés deviennent des décisions produit — c'est le chemin le plus court entre un membre et un changement sur le site.",
  },
];

export default function EquipePage() {
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
            <span className="inline-block rounded-full border border-orange/35 bg-orange/[0.12] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-orange">
              L&apos;équipe
            </span>

            <h1 className="font-display [font-stretch:125%] mt-5 text-[30px] font-extrabold leading-[1.15] tracking-tight text-cream sm:text-[40px]">
              Qui regarde ton dossier.
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-cream/70 sm:text-base">
              La vérification d&apos;identité est automatisée, mais tout le
              reste suppose quelqu&apos;un au bout. Voici comment le travail est
              réparti — et ce qu&apos;on ne peut pas encore te montrer.
            </p>
          </motion.div>
        </section>

        {/* Les pôles */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp}>
              <h2 className="font-display [font-stretch:125%] text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
                Quatre pôles
              </h2>
              <p className="mb-10 mt-2 max-w-2xl text-[15px] leading-relaxed text-cream/60">
                Une petite structure, où chacun porte plusieurs de ces
                casquettes.
              </p>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              {poles.map((pole, index) => {
                const Icone = pole.icon;

                return (
                  <motion.article
                    key={pole.titre}
                    {...fadeUp}
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.5,
                      delay: shouldReduceMotion ? 0 : index * 0.06,
                      ease: 'easeOut',
                    }}
                    className="rounded-2xl border border-cream/10 bg-[#0C222D] p-5 sm:p-6"
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          pole.validation ? 'bg-lime/15' : 'bg-orange/15'
                        }`}
                      >
                        <Icone
                          size={18}
                          className={pole.validation ? 'text-lime' : 'text-orange'}
                          aria-hidden="true"
                        />
                      </span>

                      <div className="min-w-0">
                        <h3 className="font-display [font-stretch:125%] text-[17px] font-bold text-cream">
                          {pole.titre}
                        </h3>

                        <p className="mt-1 text-[14px] font-semibold text-cream/80">
                          {pole.mission}
                        </p>

                        <p className="mt-2.5 text-[13px] leading-relaxed text-cream/60">
                          {pole.detail}
                        </p>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pourquoi pas de visages */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl">
            <h2 className="font-display [font-stretch:125%] text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
              Pourquoi aucun visage sur cette page
            </h2>

            <p className="mt-4 text-[15px] leading-relaxed text-cream/70">
              Parce qu&apos;il n&apos;y a rien de vrai à montrer pour
              l&apos;instant. Mettre des portraits achetés et des prénoms
              inventés sur la page d&apos;une plateforme qui exige de chaque
              membre une pièce d&apos;identité serait difficile à défendre.
            </p>

            <p className="mt-4 text-[15px] leading-relaxed text-cream/70">
              Cette page se remplira de visages quand il y aura des visages —
              pas avant.
            </p>

            <p className="font-accent mt-5 text-[17px] italic leading-relaxed text-orange">
              On demande aux membres de prouver qui ils sont. Le minimum est de
              ne pas mentir sur qui nous sommes.
            </p>
          </motion.div>
        </section>

        {/* CTA */}
        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-16">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <h2 className="font-display [font-stretch:125%] text-2xl font-extrabold tracking-tight text-cream sm:text-[28px]">
              Une question pour l&apos;équipe ?
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-cream/65">
              Les messages arrivent au pôle relation membres, et repartent sous
              24 à 48 heures.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/contact"
                className={`fx-btn inline-flex items-center justify-center gap-2 rounded-xl bg-orange px-7 py-3.5 text-sm font-bold text-abyss transition-colors hover:bg-orange/90 ${focusRing}`}
              >
                Nous écrire
                <ArrowRight size={16} aria-hidden="true" />
              </Link>

              <Link
                href="/histoire"
                className={`fx-ghost inline-flex items-center justify-center rounded-xl border border-cream/15 px-7 py-3.5 text-sm font-bold text-cream transition-colors hover:border-cream/30 ${focusRing}`}
              >
                Notre histoire
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </>
  );
}
