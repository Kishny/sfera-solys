'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  IdCard,
  Camera,
  Check,
  MessageCircle,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

/**
 * Le parcours en 4 étapes, version « le dossier se constitue ».
 *
 * Remplace le stepper vertical qui posait deux problèmes : un rail fin et
 * plat, et une colonne étroite perdue au milieu d'un écran large. Ici, les
 * étapes tiennent la colonne de gauche et un panneau montre à droite
 * l'état du dossier à l'étape sélectionnée. La métaphore de la marque —
 * « un dossier vérifié » — est montrée au lieu d'être racontée.
 *
 * Deux règles du projet sont appliquées :
 *
 * 1. **lime = validation.** L'alternance orange/lime d'avant était
 *    décorative, une pastille sur deux. Seule l'étape 2, la vérification
 *    d'identité, est en lime : la couleur redevient une information.
 * 2. **Aucun faux membre.** Là où il y aurait des données personnelles, on
 *    met des blocs neutres. Aucun prénom, aucun âge, aucun visage inventé.
 *
 * Accessibilité : vrai `tablist` piloté au clavier (flèches, Origine, Fin),
 * `tabindex` mobile, `aria-selected` et `aria-controls`. Le panneau est un
 * `tabpanel` focusable, et les animations se coupent sous
 * `prefers-reduced-motion`.
 */

type Etape = {
  numero: number;
  titre: string;
  duree: string;
  description: string;
  /** L'étape de validation, seule à porter le lime. */
  validation?: boolean;
};

const etapes: Etape[] = [
  {
    numero: 1,
    titre: 'Créer ton profil',
    duree: '10 minutes',
    description:
      "Photos, centres d'intérêt, ce que tu cherches — sans questionnaire.",
  },
  {
    numero: 2,
    titre: "Vérification d'identité",
    duree: 'immédiat',
    description:
      "Pièce d'identité et selfie en direct, vérifiés par Stripe Identity.",
    validation: true,
  },
  {
    numero: 3,
    titre: "Algorithme d'affinité",
    duree: 'en continu',
    description:
      "On croise valeurs, rythme de vie et intentions — pas qu'une photo.",
  },
  {
    numero: 4,
    titre: 'Première mise en relation',
    duree: 'quand tu veux',
    description:
      'Un échange guidé, pour désamorcer la gêne du premier message.',
  },
];

/** Bloc neutre tenant la place d'une donnée personnelle. */
function Trait({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block rounded-full bg-cream/15 ${className}`}
    />
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-cream/12 px-2.5 py-1 text-[11px] text-cream/60">
      {children}
    </span>
  );
}

/** En-tête commun aux quatre panneaux. */
function EnteteDossier({ etape }: { etape: Etape }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3 border-b border-cream/8 pb-4">
      <span className="font-display [font-stretch:125%] text-[13px] font-extrabold text-cream">
        dossier · étape {etape.numero} sur 4
      </span>
      <span
        className={
          etape.validation
            ? 'rounded-full border border-lime/30 bg-lime/[0.08] px-2.5 py-0.5 text-[10px] font-bold text-lime'
            : 'rounded-full border border-orange/30 bg-orange/[0.08] px-2.5 py-0.5 text-[10px] font-bold text-orange'
        }
      >
        {etape.duree}
      </span>
    </div>
  );
}

function PanneauProfil() {
  return (
    <>
      {/*
        Ce panneau montre le dossier de la personne qui lit, pas celui d'un
        membre : les libellés sont donc à la deuxième personne. Deux traits
        gris tenaient cette place avant — ils ressemblaient à un écran en
        cours de chargement et ne disaient pas ce que l'étape demande.
      */}
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange/35 via-orange/10 to-lime/20"
        >
          <Camera size={18} className="text-cream/75" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-cream/85">
            Ton profil
          </span>
          <span className="mt-0.5 block text-[11px] leading-relaxed text-cream/50">
            Photos, prénom, âge et ville
          </span>
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Chip>Sport</Chip>
        <Chip>Cuisine</Chip>
        <Chip>Voyage</Chip>
        <Chip>+ 4</Chip>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-[11px] text-cream/55">
          <span>Profil complété</span>
          <span className="font-bold text-orange">60 %</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-cream/10">
          <div className="h-full w-[60%] rounded-full bg-orange" />
        </div>
      </div>
    </>
  );
}

function PanneauVerification() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: IdCard, label: "Pièce d'identité" },
          { icon: Camera, label: 'Selfie de contrôle' },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="rounded-xl border border-cream/10 bg-abyss/50 p-3"
          >
            <Icon size={16} className="text-cream/55" />
            <Trait className="mt-3 h-1.5 w-full" />
            <Trait className="mt-1.5 h-1.5 w-2/3 bg-cream/10" />
            <span className="mt-3 block text-[11px] text-cream/55">{label}</span>
          </div>
        ))}
      </div>

      <p className="mt-5 flex items-center gap-2 text-[12px] text-cream/60">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-orange"
        />
        document officiel et selfie comparés par Stripe Identity
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-lime/25 bg-lime/[0.06] px-3 py-2.5">
        <Check size={15} strokeWidth={3} className="shrink-0 text-lime" />
        <span className="text-[12px] font-semibold text-lime">
          Profil activé, et gratuit quelle que soit ton offre
        </span>
      </div>
    </>
  );
}

function PanneauAffinite() {
  const criteres = [
    { label: 'Valeurs', valeur: 88 },
    { label: 'Rythme de vie', valeur: 72 },
    { label: 'Intentions', valeur: 94 },
  ];

  return (
    <>
      <div className="flex flex-col gap-4">
        {criteres.map((critere) => (
          <div key={critere.label}>
            <div className="mb-1.5 flex items-center justify-between text-[12px]">
              <span className="text-cream/70">{critere.label}</span>
              <span className="font-bold text-cream">{critere.valeur} %</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-cream/10">
              <div
                className={
                  critere.valeur >= 90
                    ? 'h-full rounded-full bg-lime'
                    : 'h-full rounded-full bg-orange'
                }
                style={{ width: `${critere.valeur}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 flex items-start gap-2 text-[12px] leading-relaxed text-cream/60">
        <Sparkles size={14} className="mt-0.5 shrink-0 text-orange" />
        Six profils par semaine, choisis sur ces critères — pas un défilement
        sans fin.
      </p>
    </>
  );
}

function PanneauRelation() {
  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="max-w-[80%] rounded-2xl rounded-tl-md border border-cream/10 bg-abyss/60 px-4 py-3">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-orange">
            Suggestion d&apos;ouverture
          </span>
          <span className="block text-[12px] leading-relaxed text-cream/75">
            Vous avez tous les deux coché « randonnée ». Quel a été ton plus
            beau sentier cette année ?
          </span>
        </div>

        <div className="ml-auto max-w-[70%] rounded-2xl rounded-tr-md bg-orange/[0.12] px-4 py-3">
          <Trait className="h-1.5 w-32" />
          <Trait className="mt-2 h-1.5 w-20 bg-cream/10" />
        </div>
      </div>

      <p className="mt-5 flex items-start gap-2 text-[12px] leading-relaxed text-cream/60">
        <MessageCircle size={14} className="mt-0.5 shrink-0 text-orange" />
        Une amorce proposée à partir de ce que vous avez en commun. Libre à toi
        de l&apos;utiliser ou non.
      </p>
    </>
  );
}

const panneaux = [
  PanneauProfil,
  PanneauVerification,
  PanneauAffinite,
  PanneauRelation,
];

export default function DossierParcours() {
  const [actif, setActif] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  /** Un bouton par étape : nécessaire pour redonner le focus au clavier. */
  const ongletsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const panneauRef = useRef<HTMLDivElement | null>(null);

  /**
   * Sélection d'une étape.
   *
   * Sur mobile le panneau est sous la liste : sans ce rappel à l'écran,
   * toucher une étape modifierait quelque chose d'invisible, et rien ne
   * signalerait que l'action a eu un effet. `block: "nearest"` ne défile
   * que du strict nécessaire — si le panneau est déjà visible, rien ne
   * bouge. Sur grand écran tout tient dans la même vue, donc on ne touche
   * pas au défilement.
   */
  const choisir = (index: number) => {
    setActif(index);

    if (typeof window === 'undefined') return;
    if (window.matchMedia('(min-width: 1024px)').matches) return;

    requestAnimationFrame(() => {
      panneauRef.current?.scrollIntoView({
        block: 'nearest',
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
      });
    });
  };

  /** Flèches, Origine et Fin déplacent la sélection, comme attendu d'un tablist. */
  const auClavier = (event: React.KeyboardEvent, index: number) => {
    const touches: Record<string, number> = {
      ArrowDown: (index + 1) % etapes.length,
      ArrowRight: (index + 1) % etapes.length,
      ArrowUp: (index - 1 + etapes.length) % etapes.length,
      ArrowLeft: (index - 1 + etapes.length) % etapes.length,
      Home: 0,
      End: etapes.length - 1,
    };

    const cible = touches[event.key];
    if (cible === undefined) return;

    event.preventDefault();
    choisir(cible);
    ongletsRef.current[cible]?.focus();
  };

  const etape = etapes[actif];
  const Panneau = panneaux[actif];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] lg:gap-12">
      {/* Les étapes */}
      <div
        role="tablist"
        aria-label="Les étapes du parcours"
        aria-orientation="vertical"
        className="flex flex-col lg:block"
      >
        {etapes.map((item, index) => {
          const estActif = index === actif;

          return (
            /*
              `role="presentation"` : cette enveloppe ne porte que
              l'espacement et le trait de liaison. Sans ce rôle, elle
              s'intercalerait entre le tablist et ses onglets dans l'arbre
              d'accessibilité, ce qui casse la relation attendue.
            */
            <div
              key={item.numero}
              role="presentation"
              /*
                `py-1` symétrique : la carte reste centrée dans son
                enveloppe, ce qui permet au trait de liaison de démarrer et
                de s'arrêter exactement au niveau des pastilles (`top-1/2`
                et `bottom-1/2` sur la première et la dernière). Ces 8px
                de part et d'autre suffisent à laisser voir le trait entre
                deux cartes sans étirer la section.
              */
              className="relative py-1"
            >
              {/*
                Trait de liaison. Sans lui, les quatre cartes se lisent
                comme une liste ; avec lui, comme un chemin. Il se remplit
                au passage : plein derrière l'étape atteinte, en dégradé sur
                l'étape courante, éteint devant. C'est un second repère de
                progression, lisible d'un coup d'œil, qui ne coûte aucune
                hauteur supplémentaire.

                Il est calé sur le centre des pastilles (padding gauche +
                demi-pastille), passe derrière elles, et s'arrête au niveau
                de la première et de la dernière au lieu de déborder.
              */}
              <span
                aria-hidden="true"
                className={`absolute left-[40px] w-px -translate-x-1/2 ${
                  index === 0 ? 'top-1/2' : 'top-0'
                } ${index === etapes.length - 1 ? 'bottom-1/2' : 'bottom-0'} ${
                  index < actif
                    ? 'bg-orange/45'
                    : index === actif
                      ? 'bg-gradient-to-b from-orange/45 to-cream/10'
                      : 'bg-cream/10'
                }`}
              />

            <button
              ref={(node) => {
                ongletsRef.current[index] = node;
              }}
              id={`etape-onglet-${item.numero}`}
              data-index={index}
              role="tab"
              type="button"
              aria-selected={estActif}
              aria-controls={`etape-panneau-${item.numero}`}
              tabIndex={estActif ? 0 : -1}
              onClick={() => choisir(index)}
              onKeyDown={(event) => auClavier(event, index)}
              className={`group relative z-10 flex w-full items-center gap-4 rounded-2xl border p-4 pl-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss ${
                estActif
                  ? 'border-cream/10 bg-[#0C222D]'
                  : 'border-transparent hover:border-cream/12 hover:bg-cream/[0.06]'
              }`}
            >
              {/*
                Barre d'accent à gauche : l'idiome des onglets verticaux.
                Pleine hauteur sur l'étape active, réduite à un trait au
                survol des autres — c'est ce qui dit « ces lignes se
                sélectionnent » avant même qu'on ait cliqué.
              */}
              <span
                aria-hidden="true"
                className={`absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-full transition-all duration-200 ${
                  estActif
                    ? item.validation
                      ? 'h-[60%] bg-lime'
                      : 'h-[60%] bg-orange'
                    : 'h-0 bg-cream/40 group-hover:h-[35%]'
                }`}
              />

              <span
                className={`font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-extrabold transition-colors ${
                  item.validation
                    ? estActif
                      ? 'bg-lime text-abyss'
                      : 'bg-lime/20 text-lime group-hover:bg-lime/30'
                    : estActif
                      ? 'bg-orange text-abyss'
                      : 'bg-orange/15 text-orange group-hover:bg-orange/25'
                }`}
              >
                {item.numero}
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={`font-display [font-stretch:125%] block text-[16px] font-bold transition-colors ${
                    estActif ? 'text-cream' : 'text-cream/70 group-hover:text-cream'
                  }`}
                >
                  {item.titre}
                </span>

                <span className="mt-0.5 block text-[13px] leading-snug text-cream/60">
                  {item.description}
                </span>
              </span>

              {/*
                Chevron : le signal le plus direct qu'il y a quelque chose à
                ouvrir. Visible en permanence, même au repos — s'il
                n'apparaissait qu'au survol, il ne servirait à rien sur
                mobile, où le survol n'existe pas.
              */}
              <ChevronRight
                aria-hidden="true"
                size={17}
                className={`shrink-0 transition-all duration-200 ${
                  estActif
                    ? 'translate-x-0.5 text-orange'
                    : 'text-cream/45 group-hover:translate-x-0.5 group-hover:text-cream'
                }`}
              />
            </button>
            </div>
          );
        })}
      </div>

      {/*
        Le dossier.

        Deux réglages tiennent l'équilibre de la colonne de droite, une fois
        le défilement retiré :

        `lg:min-h-[330px]` — les quatre panneaux ne font pas la même hauteur
        (environ 280 à 320px). Sans plancher, le bas de la carte sautait de
        près de 40px d'une étape à l'autre, juste après le clic : on voyait
        le saut plus que le changement de contenu. C'est un plancher, pas
        une hauteur fixe : si le contenu dépasse, la carte grandit.

        `lg:self-center` — la liste fait environ 550px, la carte 330. Calée
        en haut, elle laissait 220px de vide sous elle et pendait dans le
        coin. Centrée, le vide se répartit des deux côtés et les deux
        colonnes se répondent. Remplir la hauteur de la liste a été essayé :
        ça déplace le vide à l'intérieur de la carte, ce qui est pire.
      */}

      <div
        ref={panneauRef}
        id={`etape-panneau-${etape.numero}`}
        role="tabpanel"
        aria-labelledby={`etape-onglet-${etape.numero}`}
        tabIndex={0}
        className="relative flex w-full flex-col justify-center self-start rounded-[1.75rem] lg:min-h-[300px] lg:self-center border border-cream/10 bg-[#0C222D] p-5 shadow-[0_35px_80px_-40px_rgba(0,0,0,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss sm:p-7"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-orange/[0.07] blur-[60px]"
        />

        <EnteteDossier etape={etape} />

        <AnimatePresence mode="wait">
          <motion.div
            key={etape.numero}
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: 'easeOut' }}
          >
            <Panneau />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
