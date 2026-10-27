'use client';

import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Heart,
  HelpCircle,
  ChevronRight,
  Lightbulb,
  Lock,
  Mail,
  MessageSquare,
  Search,
  Shield,
  Users,
  X,
} from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';
import GrainOverlay from '@/components/brand/GrainOverlay';
import {
  sectionY,
  premierBloc,
  focusRing,
  Filet,
  Surtitre,
  TuileIcone,
} from '@/components/brand/mise-en-page';

/**
 * Page FAQ Sfera'Solys — direction A (« Sphère vérifiée »).
 *
 * Refonte visuelle uniquement (voir CLAUDE.md § Restructuration) : la page
 * avait encore l'habillage d'origine du fork — dégradés violets codés en
 * dur en hero, fonds clairs, une couleur de dégradé par catégorie, un
 * motif `OrbitGlow` répété cinq fois, des emojis en pastille devant chaque
 * question.
 *
 * Ce qui change : fond sombre `abyss`, un seul accent (vulcanico), cartes
 * `#1D2835`, accordéons reprenant exactement le pattern de `/tarifs`
 * (AnimatePresence + `aria-expanded` + chevron pivotant), plancher de
 * contraste `cream/55` respecté partout, `id="contenu"` sur le `<main>`.
 *
 * Ce qui ne change pas : les 12 questions et leurs réponses, les
 * 5 catégories, la recherche plein texte, la mise en avant des questions
 * populaires et les destinations des liens d'aide.
 *
 * Seul ajustement de copy : le nom de marque de l'ancien projet restait
 * accroché aux « événements » dans une question — il est retiré, comme il
 * l'a été pour les événements de /fonctionnalites.
 */

type CategoryId = 'all' | 'security' | 'account' | 'matching' | 'premium';

type IconType = React.ComponentType<{ size?: number | string; className?: string }>;

type Faq = {
  question: string;
  answer: string;
  category: Exclude<CategoryId, 'all'>;
  popular?: boolean;
  /**
   * Photographie de la carte « question populaire ».
   *
   * Seules les trois questions mises en avant en ont une : ce sont les
   * seules rendues sous forme de carte illustrée.
   */
  image?: string;
};


const categories: {
  id: CategoryId;
  label: string;
  shortLabel: string;
  icon: IconType;
}[] = [
  { id: 'all', label: 'Toutes', shortLabel: 'Tout', icon: HelpCircle },
  { id: 'security', label: 'Sécurité', shortLabel: 'Sécurité', icon: Shield },
  { id: 'account', label: 'Compte', shortLabel: 'Compte', icon: Lock },
  { id: 'matching', label: 'Rencontres', shortLabel: 'Rencontres', icon: Users },
  { id: 'premium', label: 'Premium', shortLabel: 'Premium', icon: Heart },
];

/**
 * Liste complète des questions. Ordre et contenu conservés à l'identique.
 */
const allFAQs: Faq[] = [
  /*
    En tête de liste, et pas par hasard : c'est la question qu'un visiteur
    se pose avant toutes les autres, et elle n'avait de réponse nulle part
    sur le site depuis que l'accordéon de la page d'accueil a été remplacé
    par un lien vers cette page.

    La formulation ne promet pas une réponse immédiate dans tous les cas :
    `identityVerificationStatus` connaît un état « pending », et
    l'onglet Sécurité de Ma Sphère l'affiche. Annoncer l'instantané pour
    tout le monde serait faux pour ceux qui attendent.
  */
  {
    question: "Combien de temps prend la vérification d'identité ?",
    answer:
      "Quelques instants dans la plupart des cas. Tu photographies ta pièce d'identité puis ton visage en direct, et Stripe Identity compare les deux. La réponse est le plus souvent immédiate ; il arrive qu'une vérification reste en attente le temps d'un contrôle supplémentaire. Dans tous les cas c'est gratuit, quelle que soit l'offre choisie ensuite.",
    category: 'security',
  },
  {
    question: 'Comment fonctionne le Circle of Six ?',
    image: '/visuels/solys-06.webp',
    answer:
      'Chaque lundi, six profils vérifiés sont retenus selon tes valeurs et tes centres d’intérêt. Tu as la semaine entière pour échanger avec eux, sans défilement infini ni pression.',
    category: 'matching',
    popular: true,
  },
  {
    question: 'Mes données sont-elles vraiment sécurisées ?',
    image: '/visuels/solys-04.webp',
    answer:
      "Les échanges avec le site sont chiffrés et les mots de passe sont stockés sous forme de condensats, jamais en clair. Ton document d'identité n'est pas conservé sur nos serveurs : il est transmis à Stripe, qui renvoie seulement le résultat de la vérification. Le détail de ce qui est collecté, par qui et pour combien de temps figure sur la page Confidentialité.",
    category: 'security',
    popular: true,
  },
  {
    question: "Puis-je utiliser Sfera'Solys de manière anonyme ?",
    image: '/visuels/solys-07.webp',
    answer:
      "En partie. La vérification d'identité est obligatoire, mais ton document part chez Stripe et n'apparaît jamais sur le site : les autres membres voient le pseudonyme et les photos que tu as choisis. Tu règles ensuite qui te voit — profil public, réservé à tes mises en relation, ou invisible avec le Mode Fantôme.",
    category: 'security',
    popular: true,
  },
  {
    question: 'Comment annuler mon abonnement premium ?',
    answer:
      "Tu peux annuler ton abonnement à tout moment depuis la section Abonnement de tes paramètres. L'accès premium reste actif jusqu'à la fin de la période payée, puis ton compte revient automatiquement à l'offre gratuite.",
    category: 'premium',
  },
  {
    question: 'Que faire en cas de comportement inapproprié ?',
    answer:
      "Signale immédiatement le profil ou le message via le bouton de signalement. Notre équipe de modération traite les signalements rapidement. Tu peux aussi bloquer la personne pour qu'elle ne puisse plus te contacter.",
    category: 'security',
  },
  {
    question: 'Puis-je modifier mes préférences de matching ?',
    answer:
      "Oui, tu peux ajuster tes préférences à tout moment dans les paramètres de ton compte. L'algorithme s'adapte ensuite à tes nouveaux critères pour les prochaines suggestions.",
    category: 'account',
  },
  {
    question: 'Quelle est la différence entre le compte gratuit et premium ?',
    answer:
      "Le compte gratuit permet de découvrir Sfera'Solys avec des limites. Les offres payantes débloquent davantage de likes, de messages, de filtres, le Circle of Six, le Mode Fantôme, la visibilité des visiteurs et d'autres avantages selon le plan choisi.",
    category: 'premium',
  },
  {
    question: 'Comment supprimer mon compte définitivement ?',
    answer:
      "Dans les paramètres de ton compte, tu peux demander la suppression définitive. Tes données sont ensuite supprimées selon les délais prévus par notre politique de confidentialité et les obligations légales applicables.",
    category: 'account',
  },
  {
    question: 'Comment participer aux événements de la communauté ?',
    answer:
      "Consulte la section Événements dans l'application ou sur le site. Tu peux t'inscrire aux événements en ligne ou en présentiel. Les membres premium peuvent bénéficier d'un accès anticipé selon les événements.",
    category: 'matching',
  },
  {
    question: 'Puis-je mettre mon compte en pause ?',
    answer:
      "Oui, tu peux mettre ton compte en pause depuis les paramètres. Ton profil est temporairement masqué et tu peux revenir quand tu le souhaites.",
    category: 'account',
  },
];

/** Libellé + icône lisibles pour une catégorie. */
function getCategoryMeta(category: CategoryId): { label: string; icon: IconType } {
  const found = categories.find((item) => item.id === category);

  if (!found || found.id === 'all') {
    return { label: 'Aide', icon: HelpCircle };
  }

  return { label: found.label, icon: found.icon };
}

/*
  Les trois voies d'aide de la maquette.

  Une formulation n'est pas reprise telle quelle : « Discute avec notre
  équipe d'assistance » annonce une conversation en direct, et il n'y a pas
  de messagerie d'assistance dans ce projet — /contact est un formulaire.
  La carte garde son titre, sa description dit ce qu'elle fait.

  À surveiller : `contact@sferasolys.com` apparaît ici et dans neuf autres
  endroits du projet, mais le domaine n'est pas encore enregistré. Tant
  qu'il ne l'est pas, ce lien ouvre un brouillon vers une adresse qui
  n'existe pas.
*/
const helpLinks = [
  {
    href: 'mailto:contact@sferasolys.com',
    external: true,
    icon: Mail,
    title: 'Nous écrire',
    description: 'Une question précise ? Un e-mail direct, réponse sous 24 à 48 h.',
  },
  {
    href: '/guide',
    external: false,
    icon: BookOpen,
    title: 'Guide complet',
    description: 'Découvre tous nos conseils et modes d’emploi.',
  },
  {
    href: '/contact',
    external: false,
    icon: MessageSquare,
    title: 'Nous contacter',
    description: 'Un problème précis ? Décris-le dans le formulaire.',
  },
];

export default function FAQPage() {
  const reduceMotion = useReducedMotion();

  /** Recherche utilisateur — filtre les questions et les réponses. */
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Questions ouvertes. Les identifiants sont dérivés du libellé de la
   * question (et non de l'index) pour que l'état d'ouverture survive à un
   * changement de filtre ou de recherche.
   */
  /*
    La première question est ouverte au chargement, comme la maquette.

    L'identifiant était préfixé `popular::`, du temps où les questions
    mises en avant avaient leur propre accordéon. Ce second accordéon
    ayant disparu, la liste ne rend plus que des `all::` — et cet état
    initial ne correspondait donc à aucune question affichée : la page
    s'ouvrait entièrement repliée. Défaut introduit en retirant le
    doublon, corrigé ici.
  */
  const [openQuestions, setOpenQuestions] = useState<string[]>([
    `all::${allFAQs[0].question}`,
  ]);

  /** Catégorie active. */
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');

  /**
   * Les cartes « question populaire » renvoient vers la question dans la
   * liste complète, au lieu de la répéter dans un second accordéon.
   *
   * Elles portaient leur propre `FaqItem` : la même question s'ouvrait donc
   * à deux endroits de la page, avec deux états indépendants. La carte
   * ouvre maintenant la vraie entrée et y défile — c'est ce que sa flèche
   * promet.
   *
   * `scrollIntoView` est appelé après le rendu, sinon l'élément visé peut
   * encore être masqué par un filtre actif que le clic vient de lever.
   */
  const listeRef = useRef<HTMLDivElement | null>(null);

  const ouvrirQuestion = (question: string) => {
    const id = `all::${question}`;
    setSearchTerm('');
    setActiveCategory('all');
    setOpenQuestions((prev) => (prev.includes(id) ? prev : [...prev, id]));

    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        block: 'center',
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
    });
  };

  const toggleQuestion = (id: string) => {
    setOpenQuestions((prev) =>
      prev.includes(id)
        ? prev.filter((questionId) => questionId !== id)
        : [...prev, id]
    );
  };

  /** Filtrage par catégorie. */
  const categoryFilteredFAQs = useMemo(() => {
    if (activeCategory === 'all') return allFAQs;

    return allFAQs.filter((faq) => faq.category === activeCategory);
  }, [activeCategory]);

  /** Filtrage par recherche. */
  const searchResults = useMemo(() => {
    const cleanedSearch = searchTerm.trim().toLowerCase();

    if (!cleanedSearch) return categoryFilteredFAQs;

    return categoryFilteredFAQs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(cleanedSearch) ||
        faq.answer.toLowerCase().includes(cleanedSearch)
    );
  }, [categoryFilteredFAQs, searchTerm]);

  /** Questions populaires — masquées dès qu'un filtre est actif. */
  const popularFAQs = useMemo(() => allFAQs.filter((faq) => faq.popular), []);

  const isFiltering = Boolean(searchTerm.trim()) || activeCategory !== 'all';
  const resultLabel = `${searchResults.length} résultat${
    searchResults.length !== 1 ? 's' : ''
  } sur ${allFAQs.length} question${allFAQs.length !== 1 ? 's' : ''}`;

  return (
    <>
      <Header />

      <GrainOverlay />

      <main id="contenu" className="relative bg-nuit text-champagne">
        {/* ═══════════════ Héros ═══════════════ */}
        <section className="relative isolate overflow-hidden px-4 sm:px-6 lg:px-16">
          <div className="absolute inset-0 -z-20 lg:left-[48%]">
            <Image
              src="/visuels/solys-01.webp"
              alt="Deux hommes en conversation sur une terrasse, la ville illuminée derrière eux."
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 54vw"
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
              <Surtitre>Centre d&rsquo;aide</Surtitre>

              <h1 className="font-display mt-6 text-[34px] font-normal leading-[1.08] tracking-tight text-ivoire sm:text-[46px]">
                Une question&nbsp;?
                <br />
                <span className="text-cuivre">On a la réponse.</span>
              </h1>

              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-champagne/70 sm:text-base">
                Vérification, compte, rencontres, abonnements : trouve
                l&apos;essentiel en quelques clics.
              </p>

              {/* Recherche */}
              <div className="relative mt-8 max-w-md">
                <label htmlFor="faq-search" className="sr-only">
                  Rechercher une question
                </label>

                <Search
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-champagne/60"
                  aria-hidden="true"
                />

                <input
                  id="faq-search"
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Rechercher une question…"
                  className={`w-full rounded-full border border-champagne/20 bg-nuit/70 py-3.5 pl-11 pr-11 text-sm text-champagne outline-none backdrop-blur-sm transition-colors placeholder:text-champagne/60 hover:border-champagne/35 focus:border-cuivre/50 ${focusRing}`}
                />

                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    aria-label="Effacer la recherche"
                    className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-champagne/60 transition-colors hover:text-champagne ${focusRing}`}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <Filet />

        {/* ═══════════════ Filtres ═══════════════ */}
        {/*
          Les pastilles de catégorie quittent le héros pour une barre à
          elles, avec le compte de résultats à l'autre bout — c'est la
          disposition de la maquette, et elle sépare mieux ce qui présente
          la page de ce qui la manipule.
        */}
        <section className="px-4 pb-2 pt-8 sm:px-6 lg:px-16">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
              {categories.map((category) => {
                const isActive = activeCategory === category.id;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategory(category.id)}
                    aria-pressed={isActive}
                    className={`shrink-0 rounded-full border px-5 py-2.5 text-[13px] font-semibold transition-colors ${focusRing} ${
                      isActive
                        ? 'border-transparent bg-degrade-cuivre text-nuit'
                        : 'border-champagne/20 text-champagne/75 hover:border-cuivre/50 hover:text-champagne'
                    }`}
                  >
                    {category.shortLabel}
                  </button>
                );
              })}
            </div>

            <p
              role="status"
              aria-live="polite"
              className="text-[13px] text-champagne/70"
            >
              {resultLabel}
            </p>
          </div>
        </section>

        {/* ═══════════════ Questions populaires ═══════════════ */}
        {!isFiltering && (
          <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
            <div className="mx-auto max-w-7xl">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <h2 className="font-display text-[26px] font-normal leading-tight tracking-tight text-ivoire sm:text-[32px]">
                  Questions populaires
                </h2>

                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setActiveCategory('all');
                    listeRef.current?.scrollIntoView({
                      block: 'start',
                      behavior: reduceMotion ? 'auto' : 'smooth',
                    });
                  }}
                  className={`inline-flex items-center gap-1.5 text-[13px] font-semibold text-cuivre transition-colors hover:text-champagne ${focusRing}`}
                >
                  Voir toutes les questions
                  <ArrowRight size={14} />
                </button>
              </div>

              <ul className="grid gap-5 lg:grid-cols-3">
                {popularFAQs.map((faq) => {
                  const meta = getCategoryMeta(faq.category);
                  const Icon = meta.icon;

                  return (
                    <li key={faq.question}>
                      <button
                        type="button"
                        onClick={() => ouvrirQuestion(faq.question)}
                        className={`group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-cuivre/15 bg-minuit p-5 text-left transition-colors hover:border-cuivre/45 ${focusRing}`}
                      >
                        {faq.image && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-0 -z-10 block"
                          >
                            <Image
                              src={faq.image}
                              alt=""
                              fill
                              sizes="(max-width: 1024px) 100vw, 33vw"
                              className="object-cover object-[65%_50%] transition-transform duration-700 group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                            />
                            <span className="absolute inset-0 block bg-gradient-to-r from-minuit from-[40%] via-minuit/55 via-[70%] to-transparent" />
                          </span>
                        )}

                        <TuileIcone icon={Icon} className="h-11 w-11" />

                        <span className="mt-16 block text-[11px] font-semibold uppercase tracking-surtitre text-champagne/70">
                          {meta.label}
                        </span>

                        <span className="font-display mt-2 block max-w-[14rem] text-[19px] font-normal leading-snug text-ivoire">
                          {faq.question}
                        </span>

                        <span
                          aria-hidden="true"
                          className="absolute bottom-5 right-5 flex h-9 w-9 items-center justify-center rounded-full border border-cuivre/35 bg-nuit/50 text-cuivre backdrop-blur-sm transition-colors group-hover:border-cuivre group-hover:bg-cuivre group-hover:text-nuit"
                        >
                          <ArrowRight size={15} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}

        {/* ═══════════════ Toutes vos questions ═══════════════ */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-7xl" ref={listeRef}>
            <h2 className="font-display mb-6 text-[26px] font-normal leading-tight tracking-tight text-ivoire sm:text-[32px]">
              Toutes vos questions
            </h2>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-8">
              {/* La liste */}
              <div>
                {searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((faq) => {
                      const id = `all::${faq.question}`;

                      return (
                        <FaqItem
                          key={id}
                          id={id}
                          faq={faq}
                          isOpen={openQuestions.includes(id)}
                          onToggle={toggleQuestion}
                          reduceMotion={Boolean(reduceMotion)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-champagne/20 bg-minuit p-8 text-center sm:p-10">
                    <HelpCircle
                      size={28}
                      className="mx-auto text-champagne/60"
                      aria-hidden="true"
                    />

                    <h3 className="font-display mt-4 text-[19px] font-normal text-ivoire">
                      Aucun résultat
                    </h3>

                    <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-champagne/70">
                      Essaie d&apos;autres mots-clés ou change de catégorie.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setActiveCategory('all');
                      }}
                      className={`mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-cuivre transition-colors hover:text-champagne ${focusRing}`}
                    >
                      Réinitialiser les filtres
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Le panneau d'aide */}
              <aside className="rounded-2xl border border-cuivre/15 bg-minuit p-5 sm:p-6">
                <h2 className="font-display text-[22px] font-normal leading-tight text-ivoire">
                  Besoin d&rsquo;aide&nbsp;?
                </h2>

                <p className="mt-1.5 text-[13px] leading-relaxed text-champagne/70">
                  Notre équipe est là pour t&apos;accompagner.
                </p>

                <ul className="mt-5 space-y-3">
                  {helpLinks.map((link) => {
                    const Icon = link.icon;

                    const contenu = (
                      <>
                        <TuileIcone icon={Icon} className="h-11 w-11" />

                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-semibold text-champagne">
                            {link.title}
                          </span>
                          <span className="mt-0.5 block text-[12.5px] leading-snug text-champagne/70">
                            {link.description}
                          </span>
                        </span>

                        <ChevronRight
                          size={16}
                          aria-hidden="true"
                          className="mt-1 shrink-0 text-champagne/50"
                        />
                      </>
                    );

                    const classes = `flex items-start gap-3.5 rounded-xl border border-cuivre/15 bg-nuit/40 p-4 transition-colors hover:border-cuivre/45 ${focusRing}`;

                    return (
                      <li key={link.href}>
                        {link.external ? (
                          <a href={link.href} className={classes}>
                            {contenu}
                          </a>
                        ) : (
                          <Link href={link.href} className={classes}>
                            {contenu}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-5 flex gap-3 rounded-xl border border-cuivre/25 bg-cuivre/[0.06] p-4">
                  <Lightbulb
                    size={17}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-cuivre"
                  />

                  <p className="text-[12.5px] leading-relaxed text-champagne/75">
                    <span className="block font-semibold text-cuivre">
                      Conseil
                    </span>
                    Pense à consulter notre guide complet avant de nous
                    contacter. Tu y trouveras peut-être déjà la réponse à ta
                    question.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* ═══════════════ Appel final ═══════════════ */}
        <section className="px-4 pb-14 sm:px-6 sm:pb-16 lg:px-16">
          <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-3xl border border-cuivre/25">
            <Image
              src="/visuels/solys-03.webp"
              alt=""
              aria-hidden="true"
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="-z-10 object-cover object-center"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-gradient-to-br from-nuit via-nuit/85 to-nuit/40 lg:bg-gradient-to-r lg:from-nuit lg:via-nuit/75 lg:to-nuit/25"
            />

            <div className="p-8 sm:p-10">
              <h2 className="font-display text-[26px] font-normal leading-tight text-ivoire sm:text-[32px]">
                Prêt à ouvrir Ta Sphère&nbsp;?
              </h2>

              <p className="mt-2.5 max-w-md text-[14px] leading-relaxed text-champagne/70">
                Rejoins une communauté d&apos;hommes qui partagent les mêmes
                valeurs.
              </p>

              <div className="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/commencer"
                  className={`inline-flex items-center justify-center gap-2 rounded-xl bg-degrade-cuivre px-7 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
                >
                  Créer mon profil
                  <ArrowRight size={16} />
                </Link>

                <p className="flex items-center gap-2.5 text-[13px] text-champagne/70">
                  <Shield size={15} aria-hidden="true" className="text-cuivre" />
                  Inscription et vérification gratuites
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

/**
 * Accordéon de question — même pattern que la FAQ de /tarifs (bouton avec
 * `aria-expanded`, chevron pivotant, panneau animé par AnimatePresence),
 * enrichi de la catégorie et du marqueur « populaire ».
 */
/**
 * Une question de la liste.
 *
 * L'élément porte l'identifiant dans le DOM : c'est ce qui permet aux
 * cartes « question populaire » d'ouvrir la vraie entrée et d'y défiler,
 * plutôt que d'en afficher une copie avec son propre état.
 *
 * `scroll-mt` empêche l'en-tête fixe de recouvrir la question atteinte —
 * 112 px, puis 128 au-delà de 1280 px où l'en-tête passe à `h-20`.
 *
 * La pastille « Populaire » disparaît avec le second accordéon : la seule
 * liste restante les contient toutes, la mention n'y distinguait plus rien.
 */
function FaqItem({
  id,
  faq,
  isOpen,
  onToggle,
  reduceMotion,
}: {
  id: string;
  faq: Faq;
  isOpen: boolean;
  onToggle: (id: string) => void;
  reduceMotion: boolean;
}) {
  const meta = getCategoryMeta(faq.category);
  const Icon = meta.icon;

  return (
    <div
      id={id}
      className={`scroll-mt-28 overflow-hidden rounded-2xl border bg-minuit transition-colors xl:scroll-mt-32 ${
        isOpen ? 'border-cuivre/40' : 'border-cuivre/15'
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={isOpen}
        className={`flex w-full items-center justify-between gap-4 px-5 py-4 text-left ${focusRing}`}
      >
        <span className="flex min-w-0 items-center gap-3.5">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cuivre/25 bg-nuit/50 text-cuivre"
          >
            <Icon size={16} />
          </span>

          <span className="min-w-0 text-[14px] font-semibold text-champagne">
            {faq.question}
          </span>
        </span>

        <ChevronDown
          size={16}
          className={`mt-0.5 shrink-0 text-champagne/55 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
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
}
