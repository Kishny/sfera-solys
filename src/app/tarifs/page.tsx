'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import {
  Check,
  Minus,
  Star,
  Zap,
  Crown,
  Sparkles,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

/**
 * Page Tarifs Sfera'Solys — direction A (« dossier de vérification »).
 *
 * Restructuration + rebranding (voir CLAUDE.md § Restructuration) :
 * cette page était restée intégralement Sfera'Solys — violets codés en dur
 * (#8E7AB5, #9D4EDD, #FFD166...), un dégradé différent par offre, et une
 * copy adressée à des femmes (« Pour les plus engagées », « réduction
 * pour les étudiantes », « Rejoins des femmes... »).
 *
 * Ce qui change ici : identité sombre, un seul accent (vulcanico) pour
 * l'offre recommandée au lieu d'un arc-en-ciel de dégradés, lime réservé
 * au badge « recommandé », copy corrigée (marque + cible hommes 28+).
 *
 * Ce qui ne change pas : les 4 offres, leurs prix, leurs listes de
 * fonctionnalités, le tableau comparatif, la FAQ et les destinations des
 * CTA. La page reste purement présentationnelle (le paiement passe par
 * /api/stripe/create-checkout-session, déclenché ailleurs).
 */

type Plan = {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  features: string[];
  cta: string;
  ctaLink: string;
  popular: boolean;
};

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    description: "Découvre Sfera'Solys à ton rythme",
    price: 0,
    icon: Star,
    features: [
      'Profil complet',
      '5 likes par jour',
      '3 matchs maximum',
      'Messagerie limitée (10 messages/jour)',
      'Communauté Solys',
      'Support par formulaire',
    ],
    cta: 'Commencer gratuitement',
    ctaLink: '/auth?mode=register',
    popular: false,
  },
  {
    id: 'essential-monthly',
    name: 'Essentiel',
    description: 'Pour aller plus loin dans tes rencontres',
    price: 9.99,
    icon: Zap,
    features: [
      'Tout du plan Gratuit',
      'Circle of Six hebdomadaire',
      '1 boost de visibilité par mois',
      'Filtres avancés',
      'Événements exclusifs',
      'Badge Essentiel',
      'Support prioritaire 5j/7',
    ],
    cta: 'Choisir Essentiel',
    ctaLink: '/auth?mode=register',
    popular: false,
  },
  {
    id: 'premium-monthly',
    name: 'Premium',
    description: "L'expérience Sfera'Solys complète",
    price: 19.99,
    icon: Crown,
    features: [
      'Tout du plan Essentiel',
      '3 boosts de visibilité par mois',
      'Mode Fantôme',
      'Voir les visiteurs de ton profil',
      'Filtres premium (distance, actif…)',
      'Badge Premium',
      'Support prioritaire 7j/7',
    ],
    cta: 'Choisir Premium',
    ctaLink: '/auth?mode=register',
    popular: true,
  },
  {
    id: 'elite-monthly',
    name: 'Elite',
    description: 'Pour les plus engagés',
    price: 34.99,
    icon: Sparkles,
    features: [
      'Tout du plan Premium',
      '10 boosts de visibilité par mois',
      'Cercle privé VIP',
      'Accès anticipé aux nouvelles fonctionnalités',
      'Rencontres organisées exclusives',
      'Badge Elite',
      'Support dédié 7j/7',
    ],
    cta: 'Choisir Elite',
    ctaLink: '/auth?mode=register',
    popular: false,
  },
];

const comparisonRows = [
  { feature: 'Likes par jour', values: ['5/jour', 'Illimité', 'Illimité', 'Illimité'] },
  { feature: 'Matchs simultanés', values: ['3 max', 'Illimité', 'Illimité', 'Illimité'] },
  { feature: 'Messagerie', values: ['10 msg/jour', 'Illimitée', 'Illimitée', 'Illimitée'] },
  { feature: 'Circle of Six', values: ['non', '1/semaine', '1/semaine', '1/semaine'] },
  { feature: 'Mode Fantôme', values: ['non', 'non', 'oui', 'oui'] },
  { feature: 'Visiteurs du profil', values: ['non', 'non', 'oui', 'oui'] },
  { feature: 'Filtres premium', values: ['non', 'Basiques', 'Avancés', 'Complets'] },
  { feature: 'Événements', values: ['Gratuits', 'Exclusifs', 'Exclusifs', 'VIP'] },
  { feature: 'Support', values: ['Formulaire', '5j/7', '7j/7', 'Dédié 7j/7'] },
  { feature: 'Badge', values: ['non', 'Essentiel', 'Premium', 'Elite'] },
];

const faqs = [
  {
    question: 'Puis-je annuler à tout moment ?',
    answer:
      "Oui, tu peux annuler ton abonnement à tout moment depuis ton espace Mon Compte. Tu conserves l'accès premium jusqu'à la fin de la période payée.",
  },
  {
    question: 'Y a-t-il un engagement minimum ?',
    answer:
      'Non, aucun engagement. Les abonnements sont mensuels et tu peux annuler quand tu veux.',
  },
  {
    question: 'Comment changer de forfait ?',
    answer:
      'Tu peux changer de forfait à tout moment depuis Mon Compte → onglet Premium. La différence sera ajustée au prorata.',
  },
  {
    question: 'Proposez-vous des tarifs étudiants ?',
    answer:
      'Oui, nous avons une réduction de 30 % pour les étudiants. Contacte notre support avec ta carte étudiante.',
  },
  {
    question: "Que se passe-t-il si j'annule mon abonnement ?",
    answer:
      'Ton compte revient automatiquement en version gratuite à la fin de la période payée. Tu ne perdras ni tes matchs ni tes messages.',
  },
  {
    question: 'Les paiements sont-ils sécurisés ?',
    answer:
      'Oui, tous les paiements sont gérés par Stripe, leader mondial du paiement en ligne. Nous ne stockons jamais tes données bancaires.',
  },
];

/** Anneau de focus clavier, identique partout dans la direction A. */
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss';

/**
 * Rend une valeur du tableau comparatif : « oui »/« non » deviennent des
 * icônes (plus sobre que les emojis ✅/❌ d'avant), le reste reste du texte.
 */
function ComparisonValue({ value }: { value: string }) {
  if (value === 'oui') {
    return <Check size={16} className="mx-auto text-lime" aria-label="Inclus" />;
  }

  if (value === 'non') {
    return (
      <Minus size={16} className="mx-auto text-cream/55" aria-label="Non inclus" />
    );
  }

  return <span className="text-cream/70">{value}</span>;
}

export default function TarifsPage() {
  /**
   * Sur mobile, la liste de fonctionnalités de chaque offre est repliable
   * pour que les 4 offres restent parcourables au pouce. À partir de `sm`,
   * tout est affiché en permanence.
   */
  const [openPlan, setOpenPlan] = useState<string | null>('premium-monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [openComparisonIndex, setOpenComparisonIndex] = useState<number | null>(0);

  return (
    <>
      <Header />

      <main id="contenu" className="bg-abyss text-cream">
        {/* Hero */}
        <section className="border-b border-cream/8 px-4 pt-20 sm:px-6 sm:pt-24 lg:px-16 xl:pt-28">
          <div className="mx-auto max-w-3xl py-12 text-center sm:py-16">
            <span className="inline-block rounded-full border border-orange/35 bg-orange/[0.12] px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-cream">
              Sans engagement · résiliable en un clic
            </span>

            <h1 className="font-display [font-stretch:125%] mt-5 text-[30px] font-extrabold leading-[1.15] tracking-tight text-cream sm:text-[40px]">
              Des tarifs clairs, rien de caché.
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-cream/60 sm:text-base">
              La vérification d&apos;identité est incluse dans toutes les
              offres, gratuite comprise. Ce que tu paies ensuite, c&apos;est le
              confort d&apos;usage — jamais le droit d&apos;être vérifié.
            </p>
          </div>
        </section>

        {/* Offres */}
        <section className="border-b border-cream/8 px-4 py-12 sm:px-6 sm:py-16 lg:px-16">
          <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isOpen = openPlan === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border p-5 sm:p-6 ${
                    plan.popular
                      ? 'border-orange/40 bg-[#123243] ring-1 ring-orange/20'
                      : 'border-cream/8 bg-[#123243]'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-2.5 left-5 rounded-full bg-lime px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-abyss">
                      Recommandé
                    </span>
                  )}

                  <Icon
                    size={22}
                    className={plan.popular ? 'text-orange' : 'text-cream/55'}
                  />

                  <h2 className="font-display [font-stretch:125%] mt-3 text-lg font-extrabold text-cream">
                    {plan.name}
                  </h2>

                  <p className="mt-1 text-[13px] leading-relaxed text-cream/55">
                    {plan.description}
                  </p>

                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="font-display text-[32px] font-extrabold leading-none text-cream">
                      {plan.price === 0
                        ? 'gratuit'
                        : plan.price.toFixed(2).replace('.', ',')}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-[13px] text-cream/55">€ / mois</span>
                    )}
                  </div>

                  {/* Bouton de dépli, mobile uniquement */}
                  <button
                    type="button"
                    onClick={() =>
                      setOpenPlan((current) => (current === plan.id ? null : plan.id))
                    }
                    aria-expanded={isOpen}
                    className={`mt-4 flex items-center justify-between border-t border-cream/8 pt-3 text-[13px] font-semibold text-cream/70 sm:hidden ${focusRing}`}
                  >
                    {isOpen ? 'masquer le détail' : 'voir le détail'}
                    <ChevronDown
                      size={15}
                      className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <ul
                    className={`mt-4 flex-1 space-y-2 border-cream/8 sm:mt-4 sm:block sm:border-t sm:pt-4 ${
                      isOpen ? 'block' : 'hidden'
                    }`}
                  >
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check
                          size={14}
                          className={`mt-[3px] shrink-0 ${
                            plan.popular ? 'text-orange' : 'text-lime'
                          }`}
                        />
                        <span className="text-[13px] leading-relaxed text-cream/70">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.ctaLink}
                    className={`fx-btn mt-5 block rounded-xl px-4 py-3 text-center text-[13px] font-bold transition-colors ${focusRing} ${
                      plan.popular
                        ? 'bg-orange text-abyss hover:bg-orange/90'
                        : 'border border-cream/15 text-cream/85 hover:border-cream/30'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="mx-auto mt-6 max-w-7xl text-center text-[13px] text-cream/55">
            Paiement géré par Stripe, sans mauvaise surprise. Résiliation
            depuis Mon Compte, à tout moment.
          </p>
        </section>

        {/* Comparatif */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-display [font-stretch:125%] mb-8 text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
              Comparer les offres
            </h2>

            {/* Desktop : tableau */}
            <div className="hidden overflow-hidden rounded-2xl border border-cream/8 lg:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#123243]">
                    <th className="px-5 py-3.5 text-left text-[13px] font-semibold text-cream/55">
                      Fonctionnalité
                    </th>
                    {plans.map((plan) => (
                      <th
                        key={plan.id}
                        className={`px-5 py-3.5 text-center text-[13px] font-bold ${
                          plan.popular ? 'text-orange' : 'text-cream/85'
                        }`}
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.feature} className="border-t border-cream/8">
                      <td className="px-5 py-3.5 text-[13px] text-cream/70">
                        {row.feature}
                      </td>
                      {row.values.map((value, i) => (
                        <td
                          key={`${row.feature}-${i}`}
                          className="px-5 py-3.5 text-center text-[13px]"
                        >
                          <ComparisonValue value={value} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / tablette : accordéons par ligne */}
            <div className="space-y-1.5 lg:hidden">
              {comparisonRows.map((row, index) => {
                const isOpen = openComparisonIndex === index;

                return (
                  <div
                    key={row.feature}
                    className="overflow-hidden rounded-2xl border border-cream/8 bg-[#123243]"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenComparisonIndex((current) =>
                          current === index ? null : index
                        )
                      }
                      aria-expanded={isOpen}
                      className={`flex w-full items-center justify-between px-4 py-3.5 text-left text-[13px] font-semibold text-cream/85 ${focusRing}`}
                    >
                      {row.feature}
                      <ChevronDown
                        size={15}
                        className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <dl className="grid grid-cols-2 gap-px border-t border-cream/8 bg-cream/[0.04]">
                            {plans.map((plan, i) => (
                              <div
                                key={plan.id}
                                className="flex items-center justify-between gap-2 bg-[#123243] px-4 py-2.5"
                              >
                                <dt
                                  className={`text-[12px] font-semibold ${
                                    plan.popular ? 'text-orange' : 'text-cream/55'
                                  }`}
                                >
                                  {plan.name}
                                </dt>
                                <dd className="text-[12px]">
                                  <ComparisonValue value={row.values[i]} />
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display [font-stretch:125%] mb-8 text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
              Questions fréquentes
            </h2>

            <div className="space-y-1.5">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;

                return (
                  <div
                    key={faq.question}
                    className="overflow-hidden rounded-2xl border border-cream/8 bg-[#123243]"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFaqIndex((current) => (current === index ? null : index))
                      }
                      aria-expanded={isOpen}
                      className={`flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-semibold text-cream sm:px-5 ${focusRing}`}
                    >
                      {faq.question}
                      <ChevronDown
                        size={16}
                        className={`shrink-0 text-cream/55 transition-transform ${
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
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="border-t border-cream/8 px-4 py-4 text-[13px] leading-relaxed text-cream/60 sm:px-5">
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-center text-[13px] text-cream/55">
              Une autre question ?{' '}
              <Link
                href="/faq"
                className={`fx-link font-semibold text-orange hover:text-orange/80 ${focusRing}`}
              >
                voir la FAQ complète
              </Link>
            </p>
          </div>
        </section>

        {/* CTA final */}
        <section className="px-4 py-12 sm:px-6 sm:py-14 lg:px-16">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 rounded-3xl border border-orange/25 bg-[#123243] p-7 text-center sm:p-11 lg:flex-row lg:text-left">
            <div>
              <h2 className="font-display [font-stretch:125%] mb-1.5 text-xl font-extrabold text-cream sm:text-2xl">
                Commence par le dossier, pas par la carte bancaire.
              </h2>
              <p className="text-sm text-cream/60">
                La constitution du dossier et la vérification sont gratuites.
                Tu choisiras une offre après, si tu en as envie.
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/auth?mode=register"
                className={`fx-btn rounded-xl bg-orange px-7 py-3.5 text-sm font-bold text-abyss transition-colors hover:bg-orange/90 ${focusRing}`}
              >
                constituer mon dossier
              </Link>

              <Link
                href="/guide"
 className={`fx-link inline-flex items-center gap-1.5 text-[13px] font-semibold text-cream transition-colors ${focusRing}`}
              >
                lire le guide
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
