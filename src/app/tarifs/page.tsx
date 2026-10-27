'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpDown,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Crown,
  Eye,
  Gem,
  Heart,
  Infinity as IconeInfini,
  LifeBuoy,
  Loader2,
  Lock,
  MessageCircle,
  MessageSquare,
  Minus,
  RefreshCw,
  Rocket,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Timer,
  Users,
} from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Filet,
  Surtitre,
  TuileIcone,
  focusRing,
  premierBloc,
  sectionY,
  type IconeMarque,
} from '@/components/brand/mise-en-page';
import {
  SUBSCRIPTION_PLANS,
  PLAN_ORDER,
  type PlanId,
} from '@/lib/subscription/config';
import {
  FORMULES_PAR_OFFRE,
  HORIZON_PROGRAMMATION_JOURS,
  libelleTypeBoost,
  niveauDeForce,
} from '@/lib/boosts-formules';

/**
 * Page Tarifs — direction « nuit cuivrée », d'après la maquette.
 *
 * ## Ce que la refonte change, et ce qu'elle ne touche pas
 *
 * Change : la composition. Héros photographique à gauche du cadre,
 * quatre offres en colonnes égales, bandeau de réassurance, comparatif
 * dans un panneau unique, questions fréquentes flanquées d'un panneau
 * d'aide, appel à l'action pleine largeur.
 *
 * Ne change pas : **d'où vient ce qui est écrit**. Les listes d'offres et
 * le comparatif restent dérivés de `src/lib/subscription/config.ts`, la
 * même configuration que celle appliquée par les routes serveur. Une
 * limite modifiée là-bas se voit ici sans qu'on y touche ; aucune
 * divergence n'est possible sans qu'elle saute aux yeux. C'était l'acquis
 * de la version précédente, et c'est ce qui empêche cette page de
 * recommencer à vendre ce que le code ne livre pas.
 *
 * L'appel Stripe (`/api/stripe/create-checkout-session`) est conservé tel
 * quel : c'est le seul chemin de paiement du site public.
 *
 * ## Un écart assumé avec la maquette
 *
 * La maquette dessine cinq avantages sur l'offre Elite : dix boosts, le
 * cercle privé VIP, un accès prioritaire aux événements exclusifs, une
 * mise en avant du profil et un support VIP dédié.
 *
 * Trois sont désormais tenus. `boostsPerMonth: 10` et `vipCommunity: true`
 * l'étaient déjà ; la **mise en avant du profil** l'est depuis que les
 * boosts ont une formule par offre : celle d'Elite dure une heure, passe
 * devant toutes les autres et s'affiche « À la une » sur la carte, là où
 * les offres basses s'affichent « Mis en avant ». Ce n'était pas une
 * promesse tenable tant que les quatre offres lançaient le même boost.
 *
 * Les deux derniers ne le sont toujours pas : `eventsAccess` et
 * `prioritySupport` valent `true` dès Essentiel, il n'existe ni priorité
 * d'inscription aux événements ni niveau de support distinct. Ces lignes
 * restent absentes de la carte. Ce ne seraient pas des raccourcis
 * d'écriture mais des promesses sans code derrière, à 34,99 € par mois.
 *
 * ## Ce qui reste volontairement absent
 *
 * `limits.profileVisits` est compté sans filtre de date : c'est un
 * plafond à vie, pas un quota mensuel. `limits.superLikesPerDay` décrit
 * une action qu'aucun écran ne permet d'effectuer. Ni l'un ni l'autre
 * n'est annoncé ici tant qu'il n'est pas tranché.
 */

// ─────────────────────────────────────────────
// Habillage des offres
// ─────────────────────────────────────────────

/**
 * Icône et accroche par offre. C'est tout ce que cette page ajoute à la
 * configuration : le reste — nom, prix, limites, fonctionnalités — en
 * vient directement.
 */
const habillage: Record<
  PlanId,
  { icon: IconeMarque; accroche: string; populaire: boolean }
> = {
  free: {
    icon: Users,
    accroche: "Découvrir Sfera'Solys",
    populaire: false,
  },
  'essential-monthly': {
    icon: Crown,
    accroche: 'Pour aller plus loin',
    populaire: false,
  },
  'premium-monthly': {
    icon: Gem,
    accroche: 'Une expérience plus complète',
    populaire: true,
  },
  'elite-monthly': {
    icon: Star,
    accroche: "Le meilleur de Sfera'Solys",
    populaire: false,
  },
};

/** « 5 » ou « illimité », selon que la limite est finie ou non. */
function nombreOuIllimite(valeur: number): string {
  return Number.isFinite(valeur) ? String(valeur) : 'illimité';
}

type DetailOffre = {
  /** « Tout ce qui est inclus dans Essentiel, plus : », ou rien. */
  heritage: string | null;
  lignes: string[];
};

/**
 * La liste affichée d'une offre, construite à partir de ses limites et de
 * ses drapeaux.
 *
 * Les offres payantes héritent de la précédente : on n'y répète donc que
 * **ce qui s'ajoute**. Une ligne n'apparaît qu'au palier où elle arrive —
 * « Mode Fantôme » sur Premium parce que `ghostMode` y passe de `false` à
 * `true`, jamais sur Elite où il vaut déjà `true`.
 */
function lignesOffre(id: PlanId): DetailOffre {
  const { limits, features } = SUBSCRIPTION_PLANS[id];

  if (id === 'free') {
    return {
      heritage: null,
      lignes: [
        'Profil et vérification d’identité',
        `${limits.dailyLikes} likes / jour`,
        `${limits.maxMatches} matchs simultanés`,
        `${limits.dailyMessages} messages / jour`,
      ],
    };
  }

  const precedente = SUBSCRIPTION_PLANS[PLAN_ORDER[PLAN_ORDER.indexOf(id) - 1]];
  const lignes: string[] = [];

  // Les illimités, un par un : la maquette les détaille plutôt que de les
  // regrouper sur une seule ligne.
  if (
    !Number.isFinite(limits.dailyLikes) &&
    Number.isFinite(precedente.limits.dailyLikes)
  ) {
    lignes.push('Likes illimités');
  }

  if (
    !Number.isFinite(limits.dailyMessages) &&
    Number.isFinite(precedente.limits.dailyMessages)
  ) {
    lignes.push('Messages illimités');
  }

  if (
    !Number.isFinite(limits.maxMatches) &&
    Number.isFinite(precedente.limits.maxMatches)
  ) {
    lignes.push('Matchs illimités');
  }

  /**
   * Les boosts, avec leur durée.
   *
   * Annoncer « 3 boosts / mois » sans dire ce que dure un boost cachait la
   * moitié de ce qui change d'une offre à l'autre : la durée, la force et le
   * type viennent de `FORMULES_PAR_OFFRE`, pas du nombre.
   */
  const formule = FORMULES_PAR_OFFRE[id];
  const formulePrecedente = FORMULES_PAR_OFFRE[PLAN_ORDER[PLAN_ORDER.indexOf(id) - 1]];

  if (limits.boostsPerMonth !== precedente.limits.boostsPerMonth) {
    const n = limits.boostsPerMonth;
    lignes.push(
      `${nombreOuIllimite(n)} boost${Number.isFinite(n) && n <= 1 ? '' : 's'} de ${formule.dureeMinutes} min / mois`
    );
  } else if (formule.dureeMinutes !== formulePrecedente.dureeMinutes) {
    lignes.push(`Boosts de ${formule.dureeMinutes} min`);
  }

  if (formule.type !== formulePrecedente.type) {
    lignes.push(`Mise en avant « ${libelleTypeBoost(formule.type)} »`);
  }

  if (formule.force > formulePrecedente.force) {
    lignes.push(`Priorité ${niveauDeForce(formule)} sur les autres boosts`);
  }

  if (formule.programmable && !formulePrecedente.programmable) {
    lignes.push(
      `Boost programmable jusqu’à ${HORIZON_PROGRAMMATION_JOURS} jours à l’avance`
    );
  }

  const nouveautes: Array<[boolean, boolean, string]> = [
    [
      features.circleOfSix,
      precedente.features.circleOfSix,
      'Circle of Six hebdomadaire',
    ],
    [features.ghostMode, precedente.features.ghostMode, 'Mode Fantôme'],
    [
      features.profileVisitors,
      precedente.features.profileVisitors,
      'Voir qui a visité ton profil',
    ],
    [
      features.premiumFilters,
      precedente.features.premiumFilters,
      'Filtres avancés',
    ],
    [
      features.eventsAccess,
      precedente.features.eventsAccess,
      'Accès aux événements',
    ],
    [features.vipCommunity, precedente.features.vipCommunity, 'Cercle privé VIP'],
    [
      features.prioritySupport,
      precedente.features.prioritySupport,
      'Support prioritaire',
    ],
  ];

  for (const [actuel, avant, libelle] of nouveautes) {
    if (actuel && !avant) lignes.push(libelle);
  }

  return {
    heritage: `Tout ce qui est inclus dans ${precedente.name}, plus :`,
    lignes,
  };
}

// ─────────────────────────────────────────────
// Comparatif
// ─────────────────────────────────────────────

type LigneComparatif = {
  icon: IconeMarque;
  feature: string;
  values: string[];
};

/**
 * Le tableau comparatif, dérivé de la même configuration que les cartes.
 *
 * `'oui'` et `'non'` sont rendus en icônes par `ValeurComparee` ; tout le
 * reste passe en texte. La première ligne est la seule constante : la
 * vérification d'identité est incluse partout, offre gratuite comprise,
 * et ce n'est pas un drapeau de `features` mais le principe de la
 * plateforme.
 */
function lignesComparatif(): LigneComparatif[] {
  const valeur = (f: (p: PlanId) => string) => PLAN_ORDER.map(f);

  const limite = (p: PlanId) => SUBSCRIPTION_PLANS[p].limits;
  const drapeau = (p: PlanId) => SUBSCRIPTION_PLANS[p].features;
  const formule = (p: PlanId) => FORMULES_PAR_OFFRE[p];
  const ouiNon = (v: boolean) => (v ? 'oui' : 'non');
  const parJour = (v: number) => (Number.isFinite(v) ? `${v} / jour` : 'Illimités');

  return [
    {
      icon: ShieldCheck,
      feature: 'Profil et vérification d’identité',
      values: PLAN_ORDER.map(() => 'oui'),
    },
    {
      icon: Heart,
      feature: 'Likes',
      values: valeur((p) => parJour(limite(p).dailyLikes)),
    },
    {
      icon: Users,
      feature: 'Matchs simultanés',
      values: valeur((p) =>
        Number.isFinite(limite(p).maxMatches)
          ? String(limite(p).maxMatches)
          : 'Illimités'
      ),
    },
    {
      icon: MessageSquare,
      feature: 'Messages',
      values: valeur((p) => parJour(limite(p).dailyMessages)),
    },
    {
      icon: Rocket,
      feature: 'Boosts',
      values: valeur((p) =>
        limite(p).boostsPerMonth === 0
          ? 'non'
          : `${nombreOuIllimite(limite(p).boostsPerMonth)} / mois`
      ),
    },
    {
      icon: Timer,
      feature: 'Durée d’un boost',
      values: valeur((p) => `${formule(p).dureeMinutes} min`),
    },
    {
      icon: Star,
      feature: 'Mise en avant affichée',
      values: valeur((p) => libelleTypeBoost(formule(p).type)),
    },
    {
      icon: ArrowUpDown,
      feature: 'Priorité entre boosts',
      values: valeur((p) => niveauDeForce(formule(p))),
    },
    {
      icon: CalendarClock,
      feature: 'Choisir l’heure de son boost',
      values: valeur((p) => ouiNon(formule(p).programmable)),
    },
    {
      icon: RefreshCw,
      feature: 'Circle of Six hebdomadaire',
      values: valeur((p) => ouiNon(drapeau(p).circleOfSix)),
    },
    {
      icon: Lock,
      feature: 'Mode Fantôme',
      values: valeur((p) => ouiNon(drapeau(p).ghostMode)),
    },
    {
      icon: Eye,
      feature: 'Voir qui a visité ton profil',
      values: valeur((p) => ouiNon(drapeau(p).profileVisitors)),
    },
    {
      icon: SlidersHorizontal,
      feature: 'Filtres avancés',
      values: valeur((p) => ouiNon(drapeau(p).premiumFilters)),
    },
    {
      icon: CalendarDays,
      feature: 'Accès aux événements',
      values: valeur((p) => ouiNon(drapeau(p).eventsAccess)),
    },
    {
      icon: Sparkles,
      feature: 'Cercle privé VIP',
      values: valeur((p) => ouiNon(drapeau(p).vipCommunity)),
    },
    {
      icon: LifeBuoy,
      feature: 'Support prioritaire',
      values: valeur((p) => ouiNon(drapeau(p).prioritySupport)),
    },
  ];
}

// ─────────────────────────────────────────────
// Réassurance, questions, aide
// ─────────────────────────────────────────────

const reassurances: Array<{ icon: IconeMarque; libelle: string }> = [
  { icon: IconeInfini, libelle: 'Sans engagement' },
  { icon: CalendarCheck, libelle: 'Résiliation à tout moment' },
  { icon: Lock, libelle: 'Paiement sécurisé avec Stripe' },
];

/**
 * Les cinq questions de la maquette.
 *
 * Deux réponses disent explicitement ce qui n'existe pas encore — le
 * changement d'offre en ligne, et la liste des moyens de paiement, qui
 * dépend de ce qui est activé côté Stripe et non d'un paramètre du code.
 * Annoncer « carte, PayPal, Apple Pay » depuis cette page reviendrait à
 * décrire une configuration que la page ne connaît pas.
 */
const faqs: Array<{ icon: IconeMarque; question: string; answer: string }> = [
  {
    icon: Lock,
    question: 'La vérification est-elle vraiment gratuite ?',
    answer:
      "Oui, sur toutes les offres, celle à 0 € comprise. Tu photographies ta pièce d'identité puis ton visage en direct, Stripe Identity compare les deux, et la réponse arrive le plus souvent en quelques instants. Ce que tu paies ensuite, c'est le confort d'usage — jamais le droit d'être vérifié.",
  },
  {
    icon: ArrowUpDown,
    question: 'Puis-je changer d’offre plus tard ?',
    answer:
      "Pas encore depuis le site. Pour l'instant, résilie ton offre actuelle depuis Ma Sphère, puis souscris la nouvelle une fois la période en cours terminée. Le changement en un clic, avec ajustement au prorata, n'est pas encore en place : nous préférons te le dire ici plutôt que de te le laisser découvrir au moment où tu en auras besoin.",
  },
  {
    icon: CalendarCheck,
    question: 'Comment fonctionne la résiliation ?',
    answer:
      "En un clic depuis Ma Sphère, sans justification ni préavis. Ton accès reste ouvert jusqu'à la fin de la période déjà payée, puis ton compte revient automatiquement à l'offre gratuite. Tu ne perds ni tes matchs ni tes conversations.",
  },
  {
    icon: CreditCard,
    question: 'Quels moyens de paiement acceptez-vous ?',
    answer:
      "Le paiement passe par Stripe Checkout, qui affiche les moyens activés sur notre compte — la carte bancaire au minimum. L'écran de paiement te montre la liste exacte avant toute validation. Les codes promotionnels y sont acceptés, même si nous n'en diffusons aucun pour le moment.",
  },
  {
    icon: ShieldCheck,
    question: 'Mes données sont-elles sécurisées ?',
    answer:
      "Aucune donnée bancaire ne transite par Sfera'Solys ni n'y est stockée : Stripe gère le paiement de bout en bout. Ta pièce d'identité est traitée par Stripe Identity, et nous n'en conservons que le résultat — vérifié ou non.",
  },
];

/** Mise en forme commune aux trois entrées du panneau d'aide. */
const classesAide = `flex w-full items-start gap-3.5 rounded-xl border border-cuivre/15 bg-nuit/40 p-4 transition-colors hover:border-cuivre/45 ${focusRing}`;

export default function TarifsPage() {
  const router = useRouter();
  const { status } = useSession();
  const reduceMotion = useReducedMotion();

  /**
   * Sur mobile, la liste de chaque offre est repliable pour que les
   * quatre cartes restent parcourables au pouce. À partir de `sm`, tout
   * est affiché en permanence.
   */
  const [offreDepliee, setOffreDepliee] = useState<string | null>(
    'premium-monthly'
  );
  const [questionOuverte, setQuestionOuverte] = useState<number | null>(2);
  const [ligneOuverte, setLigneOuverte] = useState<number | null>(0);

  /** Offre dont on attend la redirection Stripe. */
  const [planEnCours, setPlanEnCours] = useState<PlanId | null>(null);
  const [erreur, setErreur] = useState('');

  const offres = useMemo(
    () =>
      PLAN_ORDER.map((id) => ({
        id,
        nom: SUBSCRIPTION_PLANS[id].name,
        prix: SUBSCRIPTION_PLANS[id].price,
        ...lignesOffre(id),
        ...habillage[id],
      })),
    []
  );

  const comparatif = useMemo(() => lignesComparatif(), []);

  const transition = reduceMotion ? { duration: 0 } : { duration: 0.2 };

  /**
   * Ouvre une question et amène l'œil dessus. Sert au panneau d'aide, dont
   * la troisième entrée pointe vers une réponse de cette même page plutôt
   * que vers une destination qui n'existe pas.
   */
  const ouvrirQuestion = (index: number) => {
    setQuestionOuverte(index);

    requestAnimationFrame(() => {
      document
        .getElementById(`tarifs-question-${index}`)
        ?.scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth',
          block: 'center',
        });
    });
  };

  /**
   * Lance Stripe Checkout pour une offre payante.
   *
   * Le serveur ne reçoit qu'un identifiant de plan — jamais un prix. Il
   * choisit lui-même le `price_…` correspondant. Un visiteur non connecté
   * est envoyé vers l'inscription : `create-checkout-session` exige une
   * session.
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
        {/*
          Héros.

          `solys-01` est la photographie complète — les deux hommes et la
          skyline. La page d'accueil en utilise le recadrage serré
          (`solys-01-hero`) ; ici la maquette montre la version large, le
          texte posé sur l'aplat sombre de gauche.

          Le voile n'est pas un `bg-gradient-to-r` standard. Avec ses arrêts
          imposés à 0 / 50 / 100 %, la zone de texte tombait sur la partie
          déjà claire du dégradé : mesuré sur l'image, le champagne à 70 %
          n'y tenait que 3,83:1 et le surtitre à 60 % 3,26 — sous le seuil
          de 4,5.

          Le dégradé explicite ci-dessous garde `nuit` plein jusqu'à 35 %,
          puis descend à 85 % à mi-largeur et 20 % au bord droit. Le texte
          y tient 6,22:1 (champagne 70 %) et 4,97 (surtitre 60 %), et les
          deux hommes restent moins voilés qu'avec la version standard
          (0,54 de moyenne contre 0,61).

          Sous `lg`, le texte passe au-dessus de l'image : voile vertical,
          93 % au milieu et 75 % en haut — 5,78:1 et 4,67.
        */}
        <section className="relative isolate overflow-hidden px-4 sm:px-6 lg:px-16">
          <div className="absolute inset-0 -z-20">
            <Image
              src="/visuels/solys-01.webp"
              alt="Deux hommes en conversation sur un rooftop, la ville illuminée derrière eux."
              fill
              priority
              sizes="100vw"
              className="object-cover object-[65%_30%]"
            />

            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-nuit via-nuit/93 to-nuit/75 lg:bg-[linear-gradient(to_right,#0A0D12_0%,#0A0D12_35%,rgba(10,13,18,0.85)_55%,rgba(10,13,18,0.20)_100%)]"
            />

            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-nuit to-transparent"
            />
          </div>

          <div className={`relative mx-auto max-w-7xl pb-12 sm:pb-14 ${premierBloc}`}>
            <div className="max-w-xl">
              <Surtitre>Nos offres</Surtitre>

              <h1 className="font-display mt-6 text-[34px] font-normal leading-[1.08] tracking-tight text-ivoire sm:text-[48px]">
                Des tarifs clairs,
                <br />
                <span className="italic text-cuivre">rien de caché.</span>
              </h1>

              <p className="mt-5 text-[16px] font-semibold leading-snug text-champagne sm:text-[18px]">
                Vérification gratuite, quelle que soit l&apos;offre.
              </p>

              <p className="mt-3 max-w-md text-[14px] leading-relaxed text-champagne/70 sm:text-[15px]">
                Choisis l&apos;offre qui correspond à ton rythme et profite
                d&apos;une expérience de rencontre authentique et respectueuse.
              </p>
            </div>
          </div>
        </section>

        {/* Les quatre offres */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-7xl">
            {erreur && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-2xl border border-erreur/50 bg-erreur/20 px-4 py-3.5 text-[13px] leading-relaxed text-champagne"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-champagne" />
                <p>{erreur}</p>
              </div>
            )}

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {offres.map((offre) => {
                const Icon = offre.icon;
                const depliee = offreDepliee === offre.id;
                const estGratuit = offre.id === 'free';
                const enCours = planEnCours === offre.id;

                /**
                 * Trois traitements de bouton, comme la maquette : le
                 * dégradé plein sur l'offre recommandée, un cuivre discret
                 * sur les autres offres payantes, une bordure neutre sur
                 * l'offre gratuite qui n'est pas un achat.
                 */
                const classesCta = `mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-center text-[13px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${focusRing} ${
                  offre.populaire
                    ? 'bg-degrade-cuivre text-nuit hover:opacity-90'
                    : estGratuit
                      ? 'border border-champagne/20 text-champagne hover:border-champagne/45'
                      : 'border border-cuivre/55 bg-cuivre/10 text-champagne hover:bg-cuivre/20'
                }`;

                return (
                  <li
                    key={offre.id}
                    className={`relative flex h-full flex-col rounded-2xl border p-5 sm:p-6 ${
                      offre.populaire
                        ? 'border-cuivre/55 bg-minuit ring-1 ring-cuivre/25'
                        : 'border-champagne/12 bg-minuit/80'
                    }`}
                  >
                    {offre.populaire && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-cuivre/60 bg-nuit px-3.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-cuivre">
                        Recommandé
                      </span>
                    )}

                    <div className="flex items-center gap-3">
                      <TuileIcone
                        icon={Icon}
                        className={`h-10 w-10 ${
                          offre.populaire ? 'border-cuivre/50' : ''
                        }`}
                      />

                      <div className="min-w-0">
                        <h2 className="font-display text-[19px] font-normal leading-tight text-ivoire">
                          {offre.nom}
                        </h2>
                        <p className="mt-0.5 text-[12px] leading-snug text-champagne/70">
                          {offre.accroche}
                        </p>
                      </div>
                    </div>

                    <p className="mt-5 flex items-baseline gap-1.5">
                      <span className="font-display text-[34px] font-normal leading-none text-ivoire">
                        {offre.prix.toFixed(2).replace('.', ',').replace(',00', '')}
                        {' €'}
                      </span>

                      {!estGratuit && (
                        <span className="text-[13px] text-champagne/70">/ mois</span>
                      )}
                    </p>

                    {/* Dépli, mobile uniquement */}
                    <button
                      type="button"
                      onClick={() =>
                        setOffreDepliee((actuelle) =>
                          actuelle === offre.id ? null : offre.id
                        )
                      }
                      aria-expanded={depliee}
                      className={`mt-5 flex items-center justify-between border-t border-champagne/12 pt-3 text-[13px] font-semibold text-champagne/80 sm:hidden ${focusRing}`}
                    >
                      {depliee ? 'Masquer le détail' : 'Voir le détail'}
                      <ChevronDown
                        size={15}
                        aria-hidden="true"
                        className={`transition-transform ${depliee ? 'rotate-180' : ''}`}
                      />
                    </button>

                    <div
                      className={`flex-1 sm:mt-5 sm:block sm:border-t sm:border-champagne/12 sm:pt-5 ${
                        depliee ? 'mt-5 block' : 'hidden'
                      }`}
                    >
                      {offre.heritage && (
                        <p className="mb-3 text-[12.5px] leading-snug text-champagne/70">
                          {offre.heritage}
                        </p>
                      )}

                      <ul className="space-y-2.5">
                        {offre.lignes.map((ligne) => (
                          <li key={ligne} className="flex items-start gap-2.5">
                            <Check
                              size={14}
                              aria-hidden="true"
                              className={`mt-[3px] shrink-0 ${
                                offre.populaire ? 'text-cuivre' : 'text-succes'
                              }`}
                            />
                            <span className="text-[13px] leading-relaxed text-champagne/80">
                              {ligne}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {estGratuit ? (
                      <Link href="/commencer" className={classesCta}>
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
                            Redirection…
                          </>
                        ) : (
                          `Choisir ${offre.nom}`
                        )}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Bandeau de réassurance */}
            <ul className="mt-7 flex flex-col items-center justify-center gap-4 text-[13px] text-champagne/80 sm:flex-row sm:gap-0 sm:divide-x sm:divide-champagne/20">
              {reassurances.map(({ icon: Icon, libelle }) => (
                <li
                  key={libelle}
                  className="flex items-center gap-2.5 px-0 sm:px-7"
                >
                  <Icon size={16} aria-hidden="true" className="text-cuivre" />
                  {libelle}
                </li>
              ))}
            </ul>

            <p className="mt-5 text-center text-[12.5px] leading-relaxed text-champagne/60">
              Résiliation depuis Ma Sphère, à tout moment. TVA non applicable,
              article 293 B du CGI.
            </p>
          </div>
        </section>

        <Filet />

        {/* Comparatif */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-7xl">
            {/*
              Grand écran : un seul panneau, le titre occupant la première
              cellule d'en-tête. Il y tient son rôle : c'est bien lui qui
              nomme la colonne des fonctionnalités.
            */}
            <div className="hidden overflow-hidden rounded-2xl border border-champagne/12 bg-minuit/70 lg:block">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">
                  Comparatif des quatre offres Sfera&rsquo;Solys
                </caption>

                <thead>
                  <tr className="border-b border-champagne/12">
                    <th
                      scope="col"
                      className="w-[38%] px-6 py-7 align-bottom font-normal"
                    >
                      <h2 className="font-display text-[26px] font-normal leading-tight text-ivoire">
                        Comparatif des offres
                      </h2>
                      <p className="mt-1.5 text-[13px] font-normal leading-relaxed text-champagne/70">
                        Un aperçu simple pour choisir l&apos;offre qui te
                        correspond.
                      </p>
                    </th>

                    {offres.map((offre) => {
                      const Icon = offre.icon;

                      return (
                        <th
                          key={offre.id}
                          scope="col"
                          className="px-4 py-7 text-center align-bottom"
                        >
                          <Icon
                            size={18}
                            aria-hidden="true"
                            className={`mx-auto ${
                              offre.populaire ? 'text-cuivre' : 'text-champagne/70'
                            }`}
                          />

                          <span
                            className={`mt-2 block text-[13.5px] font-bold ${
                              offre.populaire ? 'text-cuivre' : 'text-champagne'
                            }`}
                          >
                            {offre.nom}
                          </span>

                          <span className="mt-0.5 block text-[11.5px] font-normal text-champagne/65">
                            {offre.prix === 0
                              ? '0 €'
                              : `${offre.prix.toFixed(2).replace('.', ',')} € / mois`}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {comparatif.map((ligne) => {
                    const Icon = ligne.icon;

                    return (
                      <tr
                        key={ligne.feature}
                        className="border-t border-champagne/10"
                      >
                        <th
                          scope="row"
                          className="px-6 py-3.5 text-[13px] font-normal text-champagne/85"
                        >
                          <span className="flex items-center gap-3">
                            <Icon
                              size={15}
                              aria-hidden="true"
                              className="shrink-0 text-cuivre/80"
                            />
                            {ligne.feature}
                          </span>
                        </th>

                        {ligne.values.map((valeur, i) => (
                          <td
                            key={`${ligne.feature}-${PLAN_ORDER[i]}`}
                            className="px-4 py-3.5 text-center text-[13px]"
                          >
                            <ValeurComparee valeur={valeur} />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile et tablette : une ligne du comparatif par accordéon */}
            <div className="lg:hidden">
              <h2 className="font-display text-[26px] font-normal leading-tight text-ivoire">
                Comparatif des offres
              </h2>

              <p className="mt-1.5 text-[13px] leading-relaxed text-champagne/70">
                Un aperçu simple pour choisir l&apos;offre qui te correspond.
              </p>

              <div className="mt-6 space-y-1.5">
                {comparatif.map((ligne, index) => {
                  const Icon = ligne.icon;
                  const ouverte = ligneOuverte === index;

                  return (
                    <div
                      key={ligne.feature}
                      className="overflow-hidden rounded-2xl border border-champagne/12 bg-minuit"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setLigneOuverte((actuelle) =>
                            actuelle === index ? null : index
                          )
                        }
                        aria-expanded={ouverte}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-[13px] font-semibold text-champagne ${focusRing}`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon
                            size={15}
                            aria-hidden="true"
                            className="shrink-0 text-cuivre/80"
                          />
                          {ligne.feature}
                        </span>

                        <ChevronDown
                          size={15}
                          aria-hidden="true"
                          className={`shrink-0 transition-transform ${
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
                            <dl className="grid grid-cols-2 gap-px border-t border-champagne/12 bg-champagne/[0.06]">
                              {offres.map((offre, i) => (
                                <div
                                  key={offre.id}
                                  className="flex items-center justify-between gap-2 bg-minuit px-4 py-2.5"
                                >
                                  <dt
                                    className={`text-[12px] font-semibold ${
                                      offre.populaire
                                        ? 'text-cuivre'
                                        : 'text-champagne/70'
                                    }`}
                                  >
                                    {offre.nom}
                                  </dt>
                                  <dd className="text-[12px]">
                                    <ValeurComparee valeur={ligne.values[i]} />
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
          </div>
        </section>

        <Filet />

        {/* Questions fréquentes et panneau d'aide */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-8">
            <div>
              <h2 className="font-display text-[26px] font-normal leading-tight tracking-tight text-ivoire sm:text-[32px]">
                Questions fréquentes
              </h2>

              <p className="mt-1.5 text-[13px] leading-relaxed text-champagne/70">
                Tout ce que tu dois savoir sur nos tarifs.
              </p>

              <div className="mt-6 space-y-2">
                {faqs.map((faq, index) => {
                  const Icon = faq.icon;
                  const ouverte = questionOuverte === index;

                  return (
                    <div
                      key={faq.question}
                      id={`tarifs-question-${index}`}
                      className="scroll-mt-28 overflow-hidden rounded-2xl border border-champagne/12 bg-minuit xl:scroll-mt-32"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setQuestionOuverte((actuelle) =>
                            actuelle === index ? null : index
                          )
                        }
                        aria-expanded={ouverte}
                        className={`flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5 ${focusRing}`}
                      >
                        <span className="flex items-center gap-3.5">
                          <Icon
                            size={16}
                            aria-hidden="true"
                            className="shrink-0 text-cuivre"
                          />
                          <span className="text-[14px] font-semibold text-champagne">
                            {faq.question}
                          </span>
                        </span>

                        <span
                          aria-hidden="true"
                          className="shrink-0 text-champagne/60"
                        >
                          {ouverte ? (
                            <Minus size={16} />
                          ) : (
                            <span className="block text-[18px] leading-none">+</span>
                          )}
                        </span>
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
                            <p className="border-t border-champagne/12 px-4 py-4 text-[13px] leading-relaxed text-champagne/75 sm:px-5">
                              {faq.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              <p className="mt-5 text-[13px] text-champagne/70">
                Une autre question&nbsp;?{' '}
                <Link
                  href="/faq"
                  className={`font-semibold text-cuivre transition-colors hover:text-champagne ${focusRing}`}
                >
                  Voir la FAQ complète
                </Link>
              </p>
            </div>

            {/*
              Panneau d'aide. La troisième entrée n'est pas un lien : il n'y
              a pas de page « paiement sécurisé » à ouvrir. Elle déplie la
              réponse correspondante, juste à gauche — le chevron de la
              maquette garde ainsi une destination réelle.
            */}
            <aside className="h-fit rounded-2xl border border-cuivre/15 bg-minuit p-5 sm:p-6">
              <h2 className="font-display text-[22px] font-normal leading-tight text-ivoire">
                Besoin d&rsquo;aide&nbsp;?
              </h2>

              <p className="mt-1.5 text-[13px] leading-relaxed text-champagne/70">
                Notre équipe est là pour t&apos;accompagner.
              </p>

              <ul className="mt-5 space-y-3">
                <li>
                  <Link href="/aide" className={classesAide}>
                    <ContenuAide
                      icon={BookOpen}
                      titre="Centre d'aide"
                      description="Consulte nos guides et réponses aux questions."
                    />
                  </Link>
                </li>

                <li>
                  <Link href="/contact" className={classesAide}>
                    <ContenuAide
                      icon={MessageCircle}
                      titre="Nous contacter"
                      description="Une question ? Discute avec notre équipe."
                    />
                  </Link>
                </li>

                <li>
                  <button
                    type="button"
                    onClick={() => ouvrirQuestion(4)}
                    className={`${classesAide} w-full text-left`}
                  >
                    <ContenuAide
                      icon={ShieldCheck}
                      titre="Paiement sécurisé"
                      description="Toutes les transactions sont protégées par Stripe."
                    />
                  </button>
                </li>
              </ul>
            </aside>
          </div>
        </section>

        {/*
          Appel à l'action, pleine largeur.

          La maquette laisse l'image aller jusqu'aux bords : pas de carte
          arrondie, pas de filet avant — la photographie s'éteint d'elle-même
          en haut et en bas.

          Voile à 78 % puis dégradé horizontal. Mesuré sur `solys-03` dans la
          zone de texte : titre ivoire 15,5:1, « carte bancaire » en cuivre
          6,14 et le paragraphe à 80 % 8,32. Large marge — l'image y est
          sombre d'elle-même.
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
            <div className="absolute inset-0 bg-nuit/78" />
            <div className="absolute inset-0 bg-gradient-to-r from-nuit via-nuit/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-nuit via-transparent to-nuit/70" />
          </div>

          <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-16">
            <div className="mx-auto max-w-7xl">
              <h2 className="font-display max-w-xl text-[28px] font-normal leading-[1.15] text-ivoire sm:text-[36px]">
                Commence par Ta Sphère,
                <br />
                pas par la{' '}
                <span className="italic text-cuivre">carte bancaire.</span>
              </h2>

              <p className="mt-4 max-w-md text-[14px] leading-relaxed text-champagne/80">
                Crée ton profil gratuitement, fais vérifier ton identité, et
                découvre la communauté à ton rythme.
              </p>

              <Link
                href="/commencer"
                className={`mt-7 inline-flex items-center gap-2 rounded-xl bg-degrade-cuivre px-7 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
              >
                Ouvrir Ma Sphère
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

// ─────────────────────────────────────────────
// Petits composants
// ─────────────────────────────────────────────

function ContenuAide({
  icon,
  titre,
  description,
}: {
  icon: IconeMarque;
  titre: string;
  description: string;
}) {
  return (
    <>
      <TuileIcone icon={icon} className="h-11 w-11" />

      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold text-champagne">
          {titre}
        </span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-champagne/70">
          {description}
        </span>
      </span>

      <ChevronRight
        size={16}
        aria-hidden="true"
        className="mt-1 shrink-0 text-champagne/55"
      />
    </>
  );
}

/**
 * Une valeur du comparatif : « oui » et « non » deviennent des icônes, le
 * reste reste du texte.
 *
 * Le `Minus` est à `champagne/70` et non `/55` : sur `minuit`, 55 % tombe
 * à 4,29:1, sous le seuil. C'est la même correction que sur le parcours de
 * la page d'accueil.
 */
function ValeurComparee({ valeur }: { valeur: string }) {
  if (valeur === 'oui') {
    return <Check size={16} className="mx-auto text-succes" aria-label="Inclus" />;
  }

  if (valeur === 'non') {
    return (
      <Minus
        size={16}
        className="mx-auto text-champagne/70"
        aria-label="Non inclus"
      />
    );
  }

  return <span className="text-champagne/85">{valeur}</span>;
}
