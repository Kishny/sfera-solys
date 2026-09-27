'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Ban, IdCard, MessageCircle, ShieldCheck, Users } from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EclipseMark from '@/components/brand/EclipseMark';

/**
 * Page « Notre histoire » — direction A (« dossier de vérification »).
 *
 * Réécriture complète, et pas une simple recoloration : la page racontait
 * encore, mot pour mot, l'histoire de la plateforme d'origine — « pourquoi
 * les femmes mériteraient moins bien », « pensée pour l'expérience
 * féminine » — avec une chronologie datée (« Printemps 2024 », « Été
 * 2024 »…) qui appartient à ce projet-là, pas à celui-ci.
 *
 * ## Ce qui a été retiré, et pourquoi
 *
 * **La chronologie datée.** Inventer des jalons (« Été 2024 : la
 * construction ») aurait été fabriquer un passé. Le récit tient donc sans
 * dates : un constat, un parti pris, et ce qu'on a refusé de faire. Le
 * porteur du projet pourra rétablir une vraie chronologie quand il y aura
 * des faits à y mettre.
 *
 * **Les quatre tuiles à emojis** (🛡️ 💜 🌙 ✨) dont l'une portait la lune,
 * symbole de la marque d'origine.
 *
 * ## Ce qui a été gardé
 *
 * Les statistiques : elles sont réelles, alimentées par `/api/stats`. Seule
 * différence, la bande ne s'affiche plus quand tous les compteurs sont à
 * zéro — avant le lancement, annoncer « 0 membre » sur la page qui raconte
 * l'histoire du site dessert plus qu'elle ne sert.
 *
 * ## À relire
 *
 * Tout le texte de cette page est une proposition. Elle ne contient aucune
 * affirmation vérifiable qui ne soit pas déjà tenue ailleurs sur le site
 * (vérification obligatoire par Stripe Identity, Circle of Six, critère
 * 28+), mais le ton et le récit appartiennent au porteur du projet.
 */

interface SiteStats {
  membres: number;
  matchs: number;
  messages: number;
  evenements: number;
}

function formatStat(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}K+`;
  if (n === 0) return '—';
  return n.toString();
}

/** Anneau de focus commun à toutes les pages migrées. */
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss';

const constats = [
  {
    icon: Users,
    titre: 'Le volume tient lieu de promesse',
    texte:
      "Des milliers de profils à portée de pouce, et le sentiment tenace de n'avoir rencontré personne. La quantité ne remplace pas la certitude d'avoir en face quelqu'un de réel.",
  },
  {
    icon: ShieldCheck,
    titre: 'On ne sait pas à qui on parle',
    texte:
      "Une photo, un prénom, et rien derrière. Sur la plupart des plateformes, personne n'a jamais vérifié que la personne existe — et c'est le membre qui porte le risque.",
  },
  {
    icon: MessageCircle,
    titre: 'Personne ne dit ce qu’il cherche',
    texte:
      "Les intentions restent floues des semaines durant. On perd du temps, des deux côtés, faute d'avoir posé la question au départ.",
  },
];

const refus = [
  {
    titre: 'Le défilement sans fin',
    texte:
      'Six profils par semaine, renouvelés le lundi. Assez pour choisir, trop peu pour consommer.',
  },
  {
    titre: 'Les profils non vérifiés',
    texte:
      "Aucun accès au produit avant qu'un document officiel ait été vérifié. Sans exception, et sans possibilité de passer devant.",
  },
  {
    titre: 'La visibilité achetée en silence',
    texte:
      "Un boost remonte un profil en tête d'Explorer : ça existe, ça dure trente minutes, et c'est plafonné par l'offre. Ce qu'on refuse, c'est la place achetée que personne ne voit — la carte affiche « Mis en avant » pendant toute la durée.",
  },
  {
    titre: 'Les faux comptes de vitrine',
    texte:
      "Même les aperçus d'interface du site n'affichent aucun visage : on ne vend pas la vérification avec des profils inventés.",
  },
];

export default function HistoirePage() {
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    fetch('/api/stats')
      .then((response) => response.json())
      .then((data) => {
        if (data.success) setSiteStats(data.stats);
      })
      .catch(() => {});
  }, []);

  /**
   * Avant le lancement, tous les compteurs valent zéro. Afficher une bande
   * de tirets donnerait l'impression d'un site vide ; on la masque tant
   * qu'il n'y a rien à montrer.
   */
  const aDesChiffres =
    siteStats !== null &&
    siteStats.membres + siteStats.matchs + siteStats.messages + siteStats.evenements > 0;

  const chiffres = siteStats
    ? [
        { valeur: formatStat(siteStats.membres), label: 'Profils vérifiés' },
        { valeur: formatStat(siteStats.matchs), label: 'Mises en relation' },
        { valeur: formatStat(siteStats.messages), label: 'Messages échangés' },
        { valeur: formatStat(siteStats.evenements), label: 'Événements organisés' },
      ]
    : [];

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
              Notre histoire
            </span>

            <h1 className="font-display [font-stretch:125%] mt-5 text-[30px] font-extrabold leading-[1.15] tracking-tight text-cream sm:text-[40px]">
              Pourquoi ce site existe.
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-cream/70 sm:text-base">
              Sfera&apos;Solys n&apos;est pas né d&apos;une envie de faire une
              application de rencontre de plus. Il est né d&apos;un agacement
              précis, et d&apos;une décision qui coûte cher :{' '}
              <span className="text-cream">
                personne n&apos;entre sans avoir prouvé qui il est.
              </span>
            </p>
          </motion.div>
        </section>

        {/* Le constat */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp}>
              <h2 className="font-display [font-stretch:125%] text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
                Le constat
              </h2>
              <p className="mb-10 mt-2 max-w-2xl text-[15px] leading-relaxed text-cream/60">
                Trois choses reviennent, toujours les mêmes, dans ce que les
                gens reprochent aux applications de rencontre.
              </p>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
              {constats.map((constat, index) => {
                const Icone = constat.icon;

                return (
                  <motion.article
                    key={constat.titre}
                    {...fadeUp}
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.5,
                      delay: shouldReduceMotion ? 0 : index * 0.08,
                      ease: 'easeOut',
                    }}
                    className="rounded-2xl border border-cream/10 bg-[#0C222D] p-5 sm:p-6"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange/15">
                      <Icone size={18} className="text-orange" aria-hidden="true" />
                    </span>

                    <h3 className="font-display [font-stretch:125%] mt-4 text-[17px] font-bold text-cream">
                      {constat.titre}
                    </h3>

                    <p className="mt-2 text-[14px] leading-relaxed text-cream/65">
                      {constat.texte}
                    </p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Le parti pris */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14">
            <motion.div {...fadeUp}>
              <h2 className="font-display [font-stretch:125%] text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
                Le parti pris
              </h2>

              <p className="mt-4 text-[15px] leading-relaxed text-cream/70">
                Il n&apos;y en a qu&apos;un, et tout le reste en découle :{' '}
                <span className="text-cream">
                  aucun compte ne s&apos;ouvre sans document officiel vérifié
                </span>
                . Carte d&apos;identité, passeport ou permis, comparés à un
                selfie pris en direct — pas une photo choisie dans une galerie.
              </p>

              <p className="mt-4 text-[15px] leading-relaxed text-cream/70">
                Le contrôle passe par Stripe Identity et prend quelques
                instants. Ce qu&apos;il coûte n&apos;est donc pas du temps, mais
                des inscriptions : une partie des visiteurs referme la page au
                moment de sortir une pièce d&apos;identité. On garde
                l&apos;exigence parce que c&apos;est exactement elle qui manque
                ailleurs.
              </p>

              <p className="font-accent mt-5 text-[17px] italic leading-relaxed text-orange">
                Un site de rencontre ne vaut que ce que vaut la certitude
                d&apos;avoir en face quelqu&apos;un de réel.
              </p>
            </motion.div>

            <motion.div
              {...fadeUp}
              className="rounded-[1.75rem] border border-cream/10 bg-[#0C222D] p-6 sm:p-8"
            >
              <span className="text-[11px] font-bold uppercase tracking-wide text-cream/55">
                Ce que ça coûte
              </span>

              <dl className="mt-5 space-y-5">
                <div className="flex items-start gap-3">
                  <IdCard size={17} className="mt-0.5 shrink-0 text-orange" aria-hidden="true" />
                  <div>
                    <dt className="text-[14px] font-semibold text-cream">
                      Une pièce d&apos;identité à sortir
                    </dt>
                    <dd className="mt-1 text-[13px] leading-relaxed text-cream/60">
                      C&apos;est le vrai coût : la démarche rebute, et elle
                      écarte d&apos;emblée ceux qui ne voulaient pas être
                      identifiables. C&apos;est aussi tout l&apos;intérêt.
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users size={17} className="mt-0.5 shrink-0 text-orange" aria-hidden="true" />
                  <div>
                    <dt className="text-[14px] font-semibold text-cream">
                      Une communauté qui grandit lentement
                    </dt>
                    <dd className="mt-1 text-[13px] leading-relaxed text-cream/60">
                      Chaque vérification a un coût, à notre charge et jamais à
                      la tienne. Ça interdit la course au volume — et ça donne
                      un annuaire où chaque profil tient debout.
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ShieldCheck size={17} className="mt-0.5 shrink-0 text-lime" aria-hidden="true" />
                  <div>
                    <dt className="text-[14px] font-semibold text-cream">
                      Ce que ça rapporte
                    </dt>
                    <dd className="mt-1 text-[13px] leading-relaxed text-cream/60">
                      Une seule chose, mais elle change tout : personne
                      n&apos;a besoin de se demander si l&apos;autre existe.
                    </dd>
                  </div>
                </div>
              </dl>
            </motion.div>
          </div>
        </section>

        {/* Les refus */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <motion.div {...fadeUp}>
              <h2 className="font-display [font-stretch:125%] text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
                Ce qu&apos;on a choisi de ne pas faire
              </h2>
              <p className="mb-10 mt-2 max-w-2xl text-[15px] leading-relaxed text-cream/60">
                Un produit se définit autant par ce qu&apos;il refuse que par
                ce qu&apos;il propose.
              </p>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              {refus.map((item, index) => (
                <motion.div
                  key={item.titre}
                  {...fadeUp}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.5,
                    delay: shouldReduceMotion ? 0 : index * 0.06,
                    ease: 'easeOut',
                  }}
                  className="flex items-start gap-4 rounded-2xl border border-cream/10 bg-[#0C222D] p-5 sm:p-6"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cream/10 bg-abyss">
                    <Ban size={16} className="text-cream/55" aria-hidden="true" />
                  </span>

                  <div className="min-w-0">
                    <h3 className="font-display [font-stretch:125%] text-[16px] font-bold text-cream">
                      {item.titre}
                    </h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-cream/65">
                      {item.texte}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Le nom */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <motion.div
            {...fadeUp}
            className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center sm:flex-row sm:gap-10 sm:text-left"
          >
            {/*
              `EclipseMark` peint avec `currentColor`. Sans couleur explicite,
              il héritait du crème du `<main>` et ressortait blanc — un soleil
              délavé au lieu de la signature solaire. Ailleurs sur le site il
              sert de décor en fond à très faible opacité ; ici il est au
              premier plan, donc en orange plein.
            */}
            <EclipseMark
              id="histoire-eclipse"
              withCorona
              className="h-20 w-20 shrink-0 text-orange sm:h-24 sm:w-24"
            />

            <div>
              <h2 className="font-display [font-stretch:125%] text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
                Le nom
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-cream/70">
                <span className="text-cream">Solys</span>, pour le soleil. Le
                symbole est une éclipse : un disque qui en mord un autre et
                laisse un anneau. On y a vu ce que fait la vérification —
                cacher juste ce qu&apos;il faut pour que le reste devienne
                regardable. L&apos;apostrophe du nom est ce point solaire.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Les chiffres — uniquement s'il y a quelque chose à montrer */}
        {aDesChiffres && (
          <section className="border-b border-cream/8 px-4 py-12 sm:px-6 sm:py-16 lg:px-16">
            <div className="mx-auto max-w-6xl">
              <h2 className="font-display [font-stretch:125%] text-center text-[13px] font-bold uppercase tracking-wide text-cream/55">
                Là où on en est
              </h2>

              <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
                {chiffres.map((chiffre) => (
                  <div
                    key={chiffre.label}
                    className="rounded-2xl border border-cream/10 bg-[#0C222D] p-5 text-center"
                  >
                    <dt className="sr-only">{chiffre.label}</dt>
                    <dd>
                      <span className="font-display [font-stretch:125%] block text-2xl font-extrabold text-orange sm:text-3xl">
                        {chiffre.valeur}
                      </span>
                      <span className="mt-1 block text-[12px] text-cream/60">
                        {chiffre.label}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-16">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <h2 className="font-display [font-stretch:125%] text-2xl font-extrabold tracking-tight text-cream sm:text-[28px]">
              La suite s&apos;écrit avec ceux qui entrent.
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-cream/65">
              Le dossier prend dix minutes, la vérification quelques instants.
              Rien ne t&apos;est demandé de plus que ce qui sert à te croire sur
              parole.
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
                href="/valeurs"
                className={`fx-ghost inline-flex items-center justify-center rounded-xl border border-cream/15 px-7 py-3.5 text-sm font-bold text-cream transition-colors hover:border-cream/30 ${focusRing}`}
              >
                Nos valeurs
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </>
  );
}
