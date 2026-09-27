'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Heart,
  HelpCircle,
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

/**
 * Page FAQ Sfera'Solys — direction A (« dossier de vérification »).
 *
 * Refonte visuelle uniquement (voir CLAUDE.md § Restructuration) : la page
 * avait encore l'habillage d'origine du fork — dégradés violets codés en
 * dur en hero, fonds clairs, une couleur de dégradé par catégorie, un
 * motif `OrbitGlow` répété cinq fois, des emojis en pastille devant chaque
 * question.
 *
 * Ce qui change : fond sombre `abyss`, un seul accent (vulcanico), cartes
 * `#0C222D`, accordéons reprenant exactement le pattern de `/tarifs`
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
};

/** Anneau de focus clavier, identique partout dans la direction A. */
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss';

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
  {
    question: 'Comment fonctionne le Circle of Six ?',
    answer:
      'Le Circle of Six est notre système de matching unique. Chaque semaine, notre algorithme te présente 6 profils qui correspondent à tes valeurs, intérêts et préférences. Tu peux interagir avec ces 6 personnes toute la semaine, sans la pression des applications de swipe traditionnelles.',
    category: 'matching',
    popular: true,
  },
  {
    question: 'Mes données sont-elles vraiment sécurisées ?',
    answer:
      "Absolument. Nous utilisons un chiffrement sécurisé pour protéger les communications et les données sensibles. Tes photos sont stockées avec précaution et tu peux utiliser le Mode Fantôme pour mieux contrôler ta visibilité. L'équipe de modération traite les signalements et surveille les interactions.",
    category: 'security',
    popular: true,
  },
  {
    question: "Puis-je utiliser Sfera'Solys de manière anonyme ?",
    answer:
      "Oui, grâce au Mode Fantôme. Tu peux créer un profil avec un pseudonyme, flouter tes photos et contrôler précisément qui voit tes informations. Tu décides quand et à qui révéler ton identité.",
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

const helpLinks = [
  {
    href: 'mailto:contact@sferasolys.com',
    external: true,
    icon: Mail,
    title: 'Email',
    description: 'Réponse sous 24h',
  },
  {
    href: '/guide',
    external: false,
    icon: BookOpen,
    title: 'Guide complet',
    description: 'Toutes les ressources',
  },
  {
    href: '/contact',
    external: false,
    icon: MessageSquare,
    title: 'Contact',
    description: 'Formulaire détaillé',
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
  const [openQuestions, setOpenQuestions] = useState<string[]>([
    `popular::${allFAQs[0].question}`,
  ]);

  /** Catégorie active. */
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');

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

      <main id="contenu" className="bg-abyss text-cream">
        {/* Hero + recherche + filtres */}
        <section className="border-b border-cream/8 px-4 pt-20 sm:px-6 sm:pt-24 lg:px-16 xl:pt-28">
          <div className="mx-auto max-w-3xl py-12 sm:py-16">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange/35 bg-orange/[0.12] px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-orange">
                <HelpCircle size={13} />
                centre d&apos;aide
              </span>

              <h1 className="font-display [font-stretch:125%] mt-5 text-[30px] font-extrabold leading-[1.15] tracking-tight text-cream sm:text-[40px]">
                La FAQ de Sfera&apos;Solys.
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-cream/60 sm:text-base">
                Trouve rapidement les réponses à tes questions : vérification,
                compte, rencontres, offres payantes. Si la tienne n&apos;y est
                pas, notre support répond directement.
              </p>
            </div>

            {/* Recherche */}
            <div className="mt-8">
              <label htmlFor="faq-search" className="sr-only">
                Rechercher une question
              </label>

              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/55"
                  aria-hidden="true"
                />

                <input
                  id="faq-search"
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Rechercher une question…"
                  className={`w-full rounded-xl border border-cream/15 bg-[#0C222D] py-3 pl-10 pr-11 text-sm text-cream outline-none transition-colors placeholder:text-cream/55 hover:border-cream/30 focus:border-orange/50 ${focusRing}`}
                />

                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    aria-label="Effacer la recherche"
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-cream/55 transition-colors hover:text-cream ${focusRing}`}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Filtres par catégorie */}
              <div className="-mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isActive = activeCategory === category.id;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setActiveCategory(category.id)}
                      aria-pressed={isActive}
                      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12px] font-semibold transition-colors ${focusRing} ${
                        isActive
                          ? 'border-orange/40 bg-orange/[0.12] text-orange'
                          : 'border-cream/15 text-cream/70 hover:border-cream/30 hover:text-cream'
                      }`}
                    >
                      <Icon size={14} />
                      <span className="sm:hidden">{category.shortLabel}</span>
                      <span className="hidden sm:inline">{category.label}</span>
                    </button>
                  );
                })}
              </div>

              <p
                role="status"
                aria-live="polite"
                className="mt-3 text-center text-[13px] text-cream/55"
              >
                {resultLabel}
              </p>
            </div>
          </div>
        </section>

        {/* Questions populaires — seulement sans filtre actif */}
        {!isFiltering && (
          <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
            <div className="mx-auto max-w-3xl">
              <h2 className="font-display [font-stretch:125%] text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
                Questions populaires
              </h2>

              <p className="mb-8 mt-2 text-[13px] text-cream/60">
                Les réponses les plus consultées.
              </p>

              <div className="space-y-1.5">
                {popularFAQs.map((faq) => {
                  const id = `popular::${faq.question}`;

                  return (
                    <FaqItem
                      key={id}
                      id={id}
                      faq={faq}
                      isOpen={openQuestions.includes(id)}
                      isPopular
                      onToggle={toggleQuestion}
                      reduceMotion={Boolean(reduceMotion)}
                    />
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Toutes les questions */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display [font-stretch:125%] text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
              Toutes les questions
            </h2>

            <p className="mb-8 mt-2 text-[13px] text-cream/60">
              Filtre par catégorie ou utilise la recherche.
            </p>

            {searchResults.length > 0 ? (
              <div className="space-y-1.5">
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
              <div className="rounded-2xl border border-dashed border-cream/15 bg-[#0C222D] p-8 text-center sm:p-10">
                <HelpCircle
                  size={28}
                  className="mx-auto text-cream/55"
                  aria-hidden="true"
                />

                <h3 className="font-display [font-stretch:125%] mt-4 text-lg font-extrabold text-cream">
                  Aucun résultat
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-cream/60">
                  Essaie d&apos;autres mots-clés ou change de catégorie.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setActiveCategory('all');
                  }}
                  className={`fx-link mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-orange transition-colors hover:text-orange/80 ${focusRing}`}
                >
                  réinitialiser les filtres
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Aide directe */}
        <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display [font-stretch:125%] text-2xl font-extrabold tracking-tight text-cream sm:text-[26px]">
              Tu n&apos;as pas trouvé ta réponse ?
            </h2>

            <p className="mb-8 mt-2 text-[13px] leading-relaxed text-cream/60">
              Notre support peut t&apos;aider rapidement. Trois façons de nous
              joindre, au choix.
            </p>

            <div className="grid gap-2 sm:grid-cols-3">
              {helpLinks.map((link) => {
                const Icon = link.icon;

                const content = (
                  <>
                    <Icon size={18} className="shrink-0 text-orange" aria-hidden="true" />

                    <span className="block">
                      <span className="block text-sm font-semibold text-cream">
                        {link.title}
                      </span>
                      <span className="block text-[12px] text-cream/60">
                        {link.description}
                      </span>
                    </span>
                  </>
                );

                const className = `flex items-center gap-3 rounded-2xl border border-cream/8 bg-[#0C222D] px-4 py-4 transition-colors hover:border-cream/25 sm:flex-col sm:items-start ${focusRing}`;

                return link.external ? (
                  <a key={link.href} href={link.href} className={className}>
                    {content}
                  </a>
                ) : (
                  <Link key={link.href} href={link.href} className={className}>
                    {content}
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col items-center gap-3 rounded-3xl border border-orange/25 bg-[#0C222D] p-7 text-center sm:flex-row sm:justify-between sm:p-9 sm:text-left">
              <div>
                <h3 className="font-display [font-stretch:125%] text-xl font-extrabold text-cream">
                  Prêt à constituer ton dossier ?
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-cream/60">
                  L&apos;inscription et la vérification d&apos;identité sont
                  gratuites, quelle que soit l&apos;offre choisie ensuite.
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
                  href="/tarifs"
                  className={`fx-link inline-flex items-center gap-1.5 text-[13px] font-semibold text-orange transition-colors hover:text-orange/80 ${focusRing}`}
                >
                  voir les tarifs
                  <ArrowRight size={14} />
                </Link>
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
function FaqItem({
  id,
  faq,
  isOpen,
  isPopular = false,
  onToggle,
  reduceMotion,
}: {
  id: string;
  faq: Faq;
  isOpen: boolean;
  isPopular?: boolean;
  onToggle: (id: string) => void;
  reduceMotion: boolean;
}) {
  const meta = getCategoryMeta(faq.category);
  const Icon = meta.icon;

  return (
    <div className="overflow-hidden rounded-2xl border border-cream/8 bg-[#0C222D]">
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={isOpen}
        className={`flex w-full items-start justify-between gap-4 px-4 py-4 text-left sm:px-5 ${focusRing}`}
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-cream">
            {faq.question}
          </span>

          <span className="mt-1.5 flex flex-wrap items-center gap-2">
            {isPopular && (
              <span className="rounded-full bg-lime px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-abyss">
                Populaire
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-[11px] text-cream/55">
              <Icon size={12} aria-hidden="true" />
              {meta.label}
            </span>
          </span>
        </span>

        <ChevronDown
          size={16}
          className={`mt-0.5 shrink-0 text-cream/55 transition-transform ${
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
            <p className="border-t border-cream/8 px-4 py-4 text-[13px] leading-relaxed text-cream/70 sm:px-5">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
