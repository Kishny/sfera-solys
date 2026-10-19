'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  Crown,
  Loader2,
  Minus,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SUBSCRIPTION_PLANS, PLAN_ORDER, type PlanId } from '@/lib/subscription/config';

/**
 * Page Tarifs Sfera'Solys — direction A (« dossier de vérification »).
 *
 * ## Pourquoi cette page a été réécrite
 *
 * Elle avait deux défauts qu'on ne voyait pas en la regardant.
 *
 * **1. Elle ne menait nulle part.** Les quatre boutons — « Choisir Elite »
 * compris — pointaient vers `/auth?mode=register`. La seule page qui appelait
 * `/api/stripe/create-checkout-session` était `/paiement`, atteignable par un
 * unique lien enfoui dans un onglet de `/mon-compte`. Un visiteur décidé à
 * payer n'avait aucun chemin pour le faire. `/paiement` a été supprimée et
 * son appel Stripe vit désormais ici.
 *
 * **2. Elle promettait ce que le code ne livre pas.** Les listes étaient
 * écrites à la main, à côté de `src/lib/subscription/config.ts` qui est la
 * source de vérité appliquée par les routes serveur. Elles annonçaient la
 * Communauté Solys sur l'offre gratuite (`vipCommunity: false`), des filtres
 * avancés sur Essentiel (`premiumFilters: false`), et un « Badge Essentiel /
 * Premium / Elite » qui n'existe nulle part dans l'interface utilisateur —
 * `planBadgeColor` ne vit que dans la console d'administration.
 *
 * Désormais tout ce que la page affiche est **dérivé de `SUBSCRIPTION_PLANS`**
 * (voir `lignesOffre` et `lignesComparatif`). Changer une limite dans la
 * configuration change la page ; aucune divergence n'est plus possible sans
 * qu'elle se voie à la compilation.
 *
 * ## Ce qui n'est volontairement pas affiché
 *
 * `limits.profileVisits` est compté par `ProfileVisit.countDocuments({
 * visitorId })` dans `/api/subscription/status`, **sans filtre de date** : ce
 * n'est pas un quota mensuel mais un plafond à vie (20 profils en gratuit,
 * 100 en Essentiel). C'est vraisemblablement involontaire. Plutôt que
 * d'annoncer un chiffre faux ou un chiffre absurde, la page n'en parle pas.
 *
 * `limits.superLikesPerDay` non plus : la configuration prévoit 3, 10 puis un
 * nombre illimité de super-likes, mais aucun moyen d'en envoyer un n'existe.
 * `subscription-check.ts` le dit lui-même — « pas de `SuperLike.ts`, et
 * `Like.ts` ne distingue pas les deux ». Tant que l'action n'est pas écrite,
 * c'est une ligne de configuration, pas une fonctionnalité.
 *
 * Ces deux points sont à trancher séparément.
 */

// ─────────────────────────────────────────────
// Présentation des offres, dérivée de la config
// ─────────────────────────────────────────────

/** Habillage propre à la page : icône et accroche par offre. */
const habillage: Record<
  PlanId,
  {
    icon: React.ComponentType<{ size?: number | string; className?: string }>;
    accroche: string;
    populaire: boolean;
  }
> = {
  free: {
    icon: Star,
    accroche: "Découvre Sfera'Solys à ton rythme",
    populaire: false,
  },
  'essential-monthly': {
    icon: Zap,
    accroche: 'Pour aller plus loin dans tes rencontres',
    populaire: false,
  },
  'premium-monthly': {
    icon: Crown,
    accroche: "L'expérience Sfera'Solys complète",
    populaire: true,
  },
  'elite-monthly': {
    icon: Sparkles,
    accroche: 'Pour les plus engagés',
    populaire: false,
  },
};

/** « 5 » ou « illimité », selon que la limite est finie ou non. */
function nombreOuIllimite(valeur: number): string {
  return Number.isFinite(valeur) ? String(valeur) : 'illimité';
}

/**
 * Construit la liste affichée d'une offre à partir de ses limites et de ses
 * drapeaux. Les offres payantes héritent de la précédente, donc on n'y répète
 * que ce qui s'ajoute.
 */
function lignesOffre(id: PlanId): string[] {
  const offre = SUBSCRIPTION_PLANS[id];
  const { limits, features } = offre;
  const lignes: string[] = [];

  if (id === 'free') {
    lignes.push('Profil complet et vérification d’identité');
    lignes.push(`${limits.dailyLikes} likes par jour`);
    lignes.push(`${limits.maxMatches} matchs simultanés`);
    lignes.push(`${limits.dailyMessages} messages par jour`);

    return lignes;
  }

  const rangPrecedent = PLAN_ORDER[PLAN_ORDER.indexOf(id) - 1];
  const precedente = SUBSCRIPTION_PLANS[rangPrecedent];

  lignes.push(`Tout du plan ${precedente.name}`);

  // Les illimités n'apparaissent qu'au moment où ils arrivent.
  const passeEnIllimite =
    !Number.isFinite(limits.dailyLikes) &&
    Number.isFinite(precedente.limits.dailyLikes);

  if (passeEnIllimite) {
    lignes.push('Likes, messages et matchs illimités');
  }

  if (limits.boostsPerMonth !== precedente.limits.boostsPerMonth) {
    const n = limits.boostsPerMonth;
    lignes.push(
      n === 1
        ? '1 boost de visibilité par mois'
        : `${nombreOuIllimite(n)} boosts de visibilité par mois`
    );
  }

  const nouveautes: Array<[boolean, boolean, string]> = [
    [features.circleOfSix, precedente.features.circleOfSix, 'Circle of Six chaque semaine'],
    [features.ghostMode, precedente.features.ghostMode, 'Mode Fantôme'],
    [features.profileVisitors, precedente.features.profileVisitors, 'Voir les visiteurs de ton profil'],
    [features.premiumFilters, precedente.features.premiumFilters, 'Filtres avancés'],
    [features.eventsAccess, precedente.features.eventsAccess, 'Accès aux événements'],
    [features.vipCommunity, precedente.features.vipCommunity, 'Cercle privé VIP'],
    [features.prioritySupport, precedente.features.prioritySupport, 'Support prioritaire'],
  ];

  for (const [actuel, avant, libelle] of nouveautes) {
    if (actuel && !avant) lignes.push(libelle);
  }

  return lignes;
}

/**
 * Tableau comparatif, lui aussi dérivé. Chaque ligne lit la même
 * configuration que les routes serveur qui appliquent la règle.
 */
function lignesComparatif() {
  const ids = PLAN_ORDER;
  const valeur = (f: (p: PlanId) => string) => ids.map(f);

  const limite = (p: PlanId) => SUBSCRIPTION_PLANS[p].limits;
  const drapeau = (p: PlanId) => SUBSCRIPTION_PLANS[p].features;
  const ouiNon = (v: boolean) => (v ? 'oui' : 'non');

  return [
    {
      feature: 'Likes par jour',
      values: valeur((p) => nombreOuIllimite(limite(p).dailyLikes)),
    },
    {
      feature: 'Matchs simultanés',
      values: valeur((p) => nombreOuIllimite(limite(p).maxMatches)),
    },
    {
      feature: 'Messages par jour',
      values: valeur((p) => nombreOuIllimite(limite(p).dailyMessages)),
    },
    {
      feature: 'Boosts par mois',
      values: valeur((p) =>
        limite(p).boostsPerMonth === 0
          ? 'non'
          : nombreOuIllimite(limite(p).boostsPerMonth)
      ),
    },
    { feature: 'Circle of Six', values: valeur((p) => ouiNon(drapeau(p).circleOfSix)) },
    { feature: 'Mode Fantôme', values: valeur((p) => ouiNon(drapeau(p).ghostMode)) },
    {
      feature: 'Visiteurs du profil',
      values: valeur((p) => ouiNon(drapeau(p).profileVisitors)),
    },
    {
      feature: 'Filtres avancés',
      values: valeur((p) => ouiNon(drapeau(p).premiumFilters)),
    },
    { feature: 'Événements', values: valeur((p) => ouiNon(drapeau(p).eventsAccess)) },
    { feature: 'Cercle privé VIP', values: valeur((p) => ouiNon(drapeau(p).vipCommunity)) },
    {
      feature: 'Support prioritaire',
      values: valeur((p) => ouiNon(drapeau(p).prioritySupport)),
    },
  ];
}

// ─────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────

/**
 * Deux réponses ont été corrigées parce qu'elles décrivaient des
 * fonctionnalités absentes :
 *
 * - « réduction de 30 % pour les étudiants » : aucun coupon, aucun dispositif
 *   de vérification du statut étudiant n'existe dans le code ;
 * - « changer de forfait, ajusté au prorata » : seules les routes `cancel`,
 *   `pause` et `reactivate` existent. Aucun changement de forfait n'est
 *   implémenté.
 */
const faqs = [
  {
    question: 'Puis-je annuler à tout moment ?',
    answer:
      "Oui, tu peux annuler ton abonnement à tout moment depuis ton espace Mon Compte. Tu conserves l'accès premium jusqu'à la fin de la période déjà payée.",
  },
  {
    question: 'Y a-t-il un engagement minimum ?',
    answer:
      'Non, aucun engagement. Les abonnements sont mensuels et tu peux annuler quand tu veux.',
  },
  {
    question: 'Comment changer de forfait ?',
    answer:
      "Le changement de forfait depuis l'application n'est pas encore disponible. En attendant, résilie ton offre actuelle depuis Mon Compte, puis souscris la nouvelle à la fin de ta période en cours.",
  },
  {
    question: 'Proposez-vous des codes promotionnels ?',
    answer:
      "Le paiement Stripe accepte les codes promotionnels, mais nous n'en diffusons aucun pour le moment. Si cela change, tu le verras ici.",
  },
  {
    question: "Que se passe-t-il si j'annule mon abonnement ?",
    answer:
      'Ton compte revient automatiquement en version gratuite à la fin de la période payée. Tu ne perds ni tes matchs ni tes messages.',
  },
  {
    question: 'Les paiements sont-ils sécurisés ?',
    answer:
      'Oui, tous les paiements sont gérés par Stripe. Aucune donnée bancaire ne transite par Sfera’Solys ni n’y est stockée.',
  },
];

/** Anneau de focus clavier, identique partout dans la direction A. */
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70 focus-visible:ring-offset-2 focus-visible:ring-offset-nuit';

/**
 * Rend une valeur du tableau comparatif : « oui »/« non » deviennent des
 * icônes, le reste reste du texte.
 */
function ComparisonValue({ value }: { value: string }) {
  if (value === 'oui') {
    return <Check size={16} className="mx-auto text-succes" aria-label="Inclus" />;
  }

  if (value === 'non') {
    return (
      <Minus size={16} className="mx-auto text-champagne/55" aria-label="Non inclus" />
    );
  }

  return <span className="text-champagne/70">{value}</span>;
}

export default function TarifsPage() {
  const router = useRouter();
  const { status } = useSession();

  /**
   * Sur mobile, la liste de fonctionnalités de chaque offre est repliable
   * pour que les 4 offres restent parcourables au pouce. À partir de `sm`,
   * tout est affiché en permanence.
   */
  const [openPlan, setOpenPlan] = useState<string | null>('premium-monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [openComparisonIndex, setOpenComparisonIndex] = useState<number | null>(0);

  /** Offre dont on attend la redirection Stripe. */
  const [planEnCours, setPlanEnCours] = useState<PlanId | null>(null);
  const [erreur, setErreur] = useState('');

  const offres = useMemo(
    () =>
      PLAN_ORDER.map((id) => ({
        id,
        nom: SUBSCRIPTION_PLANS[id].name,
        prix: SUBSCRIPTION_PLANS[id].price,
        lignes: lignesOffre(id),
        ...habillage[id],
      })),
    []
  );

  const comparatif = useMemo(() => lignesComparatif(), []);

  /**
   * Lance Stripe Checkout pour une offre payante.
   *
   * Le serveur ne reçoit qu'un identifiant de plan — jamais un prix. Il
   * choisit lui-même le `price_…` correspondant. Un visiteur non connecté est
   * envoyé vers l'inscription : `create-checkout-session` exige une session.
   */
  const souscrire = async (plan: PlanId) => {
    if (plan === 'free') return;
    if (planEnCours) return;

    if (status !== 'authenticated') {
      router.push('/auth?mode=register');
      return;
    }

    setPlanEnCours(plan);
    setErreur('');

    try {
      const reponse = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || !donnees?.success || !donnees?.url) {
        setErreur(
          donnees?.error ||
            "Le paiement n'a pas pu être lancé. Réessaie dans un instant."
        );
        setPlanEnCours(null);
        return;
      }

      // On ne remet pas `planEnCours` à null : la page est en train de partir.
      window.location.href = donnees.url;
    } catch {
      setErreur("Le paiement n'a pas pu être lancé. Vérifie ta connexion.");
      setPlanEnCours(null);
    }
  };

  return (
    <>
      <Header />

      <main id="contenu" className="bg-nuit text-champagne">
        {/* Hero */}
        <section className="border-b border-champagne/8 px-4 pt-20 sm:px-6 sm:pt-24 lg:px-16 xl:pt-28">
          <div className="mx-auto max-w-3xl py-12 text-center sm:py-16">
            <span className="inline-block rounded-full border border-cuivre/35 bg-cuivre/[0.12] px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-champagne">
              Sans engagement · résiliable en un clic
            </span>

            <h1 className="font-display mt-5 text-[30px] font-extrabold leading-[1.15] tracking-tight text-champagne sm:text-[40px]">
              Des tarifs clairs, rien de caché.
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-champagne/60 sm:text-base">
              La vérification d&apos;identité est incluse dans toutes les
              offres, gratuite comprise. Ce que tu paies ensuite, c&apos;est le
              confort d&apos;usage — jamais le droit d&apos;être vérifié.
            </p>
          </div>
        </section>

        {/* Offres */}
        <section className="border-b border-champagne/8 px-4 py-12 sm:px-6 sm:py-16 lg:px-16">
          {erreur && (
            <div
              role="alert"
              className="mx-auto mb-6 flex max-w-2xl items-start gap-3 rounded-2xl border border-erreur/50 bg-erreur/20 px-4 py-3.5 text-[13px] leading-relaxed text-champagne"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-champagne" />
              <p>{erreur}</p>
            </div>
          )}

          <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {offres.map((offre) => {
              const Icon = offre.icon;
              const isOpen = openPlan === offre.id;
              const estGratuit = offre.id === 'free';
              const enCours = planEnCours === offre.id;

              const classesCta = `fx-btn mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-center text-[13px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${focusRing} ${
                offre.populaire
                  ? 'bg-cuivre text-nuit hover:bg-cuivre/90'
                  : 'border border-champagne/15 text-champagne/85 hover:border-champagne/30'
              }`;

              return (
                <div
                  key={offre.id}
                  className={`relative flex flex-col rounded-2xl border p-5 sm:p-6 ${
                    offre.populaire
                      ? 'border-cuivre/40 bg-minuit ring-1 ring-cuivre/20'
                      : 'border-champagne/8 bg-minuit'
                  }`}
                >
                  {offre.populaire && (
                    <span className="absolute -top-2.5 left-5 rounded-full bg-succes px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-nuit">
                      Recommandé
                    </span>
                  )}

                  <Icon
                    size={22}
                    className={offre.populaire ? 'text-cuivre' : 'text-champagne/55'}
                  />

                  <h2 className="font-display mt-3 text-lg font-extrabold text-champagne">
                    {offre.nom}
                  </h2>

                  <p className="mt-1 text-[13px] leading-relaxed text-champagne/55">
                    {offre.accroche}
                  </p>

                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="font-display text-[32px] font-extrabold leading-none text-champagne">
                      {estGratuit
                        ? 'gratuit'
                        : offre.prix.toFixed(2).replace('.', ',')}
                    </span>
                    {!estGratuit && (
                      <span className="text-[13px] text-champagne/55">€ / mois</span>
                    )}
                  </div>

                  {/* Bouton de dépli, mobile uniquement */}
                  <button
                    type="button"
                    onClick={() =>
                      setOpenPlan((current) =>
                        current === offre.id ? null : offre.id
                      )
                    }
                    aria-expanded={isOpen}
                    className={`mt-4 flex items-center justify-between border-t border-champagne/8 pt-3 text-[13px] font-semibold text-champagne/70 sm:hidden ${focusRing}`}
                  >
                    {isOpen ? 'masquer le détail' : 'voir le détail'}
                    <ChevronDown
                      size={15}
                      className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <ul
                    className={`mt-4 flex-1 space-y-2 border-champagne/8 sm:mt-4 sm:block sm:border-t sm:pt-4 ${
                      isOpen ? 'block' : 'hidden'
                    }`}
                  >
                    {offre.lignes.map((ligne) => (
                      <li key={ligne} className="flex items-start gap-2">
                        <Check
                          size={14}
                          className={`mt-[3px] shrink-0 ${
                            offre.populaire ? 'text-cuivre' : 'text-succes'
                          }`}
                        />
                        <span className="text-[13px] leading-relaxed text-champagne/70">
                          {ligne}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {estGratuit ? (
                    <Link href="/auth?mode=register" className={classesCta}>
                      Commencer gratuitement
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => souscrire(offre.id)}
                      disabled={planEnCours !== null}
                      className={classesCta}
                    >
                      {enCours ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          redirection…
                        </>
                      ) : (
                        `Choisir ${offre.nom}`
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mx-auto mt-6 max-w-7xl text-center text-[13px] leading-relaxed text-champagne/55">
            Paiement géré par Stripe, sans mauvaise surprise. Résiliation depuis
            Mon Compte, à tout moment.
            <br />
            TVA non applicable, article 293 B du CGI.
          </p>
        </section>

        {/* Comparatif */}
        <section className="border-b border-champagne/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-display mb-8 text-2xl font-extrabold tracking-tight text-champagne sm:text-[26px]">
              Comparer les offres
            </h2>

            {/* Desktop : tableau */}
            <div className="hidden overflow-hidden rounded-2xl border border-champagne/8 lg:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-minuit">
                    <th className="px-5 py-3.5 text-left text-[13px] font-semibold text-champagne/55">
                      Fonctionnalité
                    </th>
                    {offres.map((offre) => (
                      <th
                        key={offre.id}
                        className={`px-5 py-3.5 text-center text-[13px] font-bold ${
                          offre.populaire ? 'text-cuivre' : 'text-champagne/85'
                        }`}
                      >
                        {offre.nom}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparatif.map((row) => (
                    <tr key={row.feature} className="border-t border-champagne/8">
                      <td className="px-5 py-3.5 text-[13px] text-champagne/70">
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
              {comparatif.map((row, index) => {
                const isOpen = openComparisonIndex === index;

                return (
                  <div
                    key={row.feature}
                    className="overflow-hidden rounded-2xl border border-champagne/8 bg-minuit"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenComparisonIndex((current) =>
                          current === index ? null : index
                        )
                      }
                      aria-expanded={isOpen}
                      className={`flex w-full items-center justify-between px-4 py-3.5 text-left text-[13px] font-semibold text-champagne/85 ${focusRing}`}
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
                          <dl className="grid grid-cols-2 gap-px border-t border-champagne/8 bg-champagne/[0.04]">
                            {offres.map((offre, i) => (
                              <div
                                key={offre.id}
                                className="flex items-center justify-between gap-2 bg-minuit px-4 py-2.5"
                              >
                                <dt
                                  className={`text-[12px] font-semibold ${
                                    offre.populaire ? 'text-cuivre' : 'text-champagne/55'
                                  }`}
                                >
                                  {offre.nom}
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
        <section className="border-b border-champagne/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display mb-8 text-2xl font-extrabold tracking-tight text-champagne sm:text-[26px]">
              Questions fréquentes
            </h2>

            <div className="space-y-1.5">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;

                return (
                  <div
                    key={faq.question}
                    className="overflow-hidden rounded-2xl border border-champagne/8 bg-minuit"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFaqIndex((current) => (current === index ? null : index))
                      }
                      aria-expanded={isOpen}
                      className={`flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-semibold text-champagne sm:px-5 ${focusRing}`}
                    >
                      {faq.question}
                      <ChevronDown
                        size={16}
                        className={`shrink-0 text-champagne/55 transition-transform ${
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
                          <p className="border-t border-champagne/8 px-4 py-4 text-[13px] leading-relaxed text-champagne/60 sm:px-5">
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-center text-[13px] text-champagne/55">
              Une autre question ?{' '}
              <Link
                href="/faq"
                className={`fx-link font-semibold text-cuivre hover:text-cuivre/80 ${focusRing}`}
              >
                voir la FAQ complète
              </Link>
            </p>
          </div>
        </section>

        {/* CTA final */}
        <section className="px-4 py-12 sm:px-6 sm:py-14 lg:px-16">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 rounded-3xl border border-cuivre/25 bg-minuit p-7 text-center sm:p-11 lg:flex-row lg:text-left">
            <div>
              <h2 className="font-display mb-1.5 text-xl font-extrabold text-champagne sm:text-2xl">
                Commence par le dossier, pas par la carte bancaire.
              </h2>
              <p className="text-sm text-champagne/60">
                La constitution du dossier et la vérification sont gratuites.
                Tu choisiras une offre après, si tu en as envie.
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/auth?mode=register"
                className={`fx-btn rounded-xl bg-cuivre px-7 py-3.5 text-sm font-bold text-nuit transition-colors hover:bg-cuivre/90 ${focusRing}`}
              >
                constituer mon dossier
              </Link>

              <Link
                href="/guide"
                className={`fx-link inline-flex items-center gap-1.5 text-[13px] font-semibold text-champagne transition-colors ${focusRing}`}
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
