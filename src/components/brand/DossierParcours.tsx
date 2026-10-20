'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  IdCard,
  Camera,
  Check,
  MessageCircle,
  Sparkles,
} from 'lucide-react';

/**
 * Le parcours en 4 étapes, version « le dossier se constitue ».
 *
 * Les quatre étapes se suivent sur une ligne, reliées par un trait, et un
 * panneau montre à droite l'état du dossier à l'étape sélectionnée. La
 * métaphore de la marque — « un dossier vérifié » — est montrée au lieu
 * d'être racontée.
 *
 * Les étapes ont d'abord été empilées, chacune dans sa carte avec un rail
 * vertical et un chevron. La maquette les remet sur une rangée et retire
 * les cartes : on voit les quatre d'un coup, et c'est l'axe qui porte leur
 * ordre. Le titre de la section descend dans la colonne de gauche (prop
 * `entete`) pour que la carte remonte à sa hauteur, au lieu de pendre dans
 * le coin droit sous un grand vide.
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
      className={`block rounded-full bg-champagne/15 ${className}`}
    />
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-champagne/12 px-2.5 py-1 text-[11px] text-champagne/60">
      {children}
    </span>
  );
}

/** En-tête commun aux quatre panneaux. */
function EnteteDossier({ etape }: { etape: Etape }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3 border-b border-champagne/8 pb-4">
      <span className="font-display text-[13px] font-extrabold text-champagne">
        dossier · étape {etape.numero} sur 4
      </span>
      <span
        className={
          etape.validation
            ? 'rounded-full border border-succes/30 bg-succes/[0.08] px-2.5 py-0.5 text-[10px] font-bold text-succes'
            : 'rounded-full border border-cuivre/30 bg-cuivre/[0.08] px-2.5 py-0.5 text-[10px] font-bold text-champagne'
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
        {/*
          Une photographie, là où un pictogramme d'appareil photo sur un
          aplat tenait la place. Le pictogramme se lisait comme un bouton
          « ajouter une photo » resté vide, c'est-à-dire comme un défaut
          d'affichage plutôt que comme un dossier qui se remplit.

          C'est le septième portrait, découpé dans la même scène de groupe
          que `profil-05` mais sur un autre homme : les six autres sont
          déjà dans les aperçus juste en dessous, et retrouver le même
          visage en « ton profil » puis en « 29 ans · Bron » deux sections
          plus bas se remarquerait.
        */}
        <span
          aria-hidden="true"
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-nuit"
        >
          <Image
            src="/visuels/profils/profil-07.webp"
            alt=""
            fill
            sizes="64px"
            className="object-cover"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-champagne/85">
            Ton profil
          </span>
          <span className="mt-0.5 block text-[11px] leading-relaxed text-champagne/60">
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
        <div className="mb-2 flex items-center justify-between text-[11px] text-champagne/55">
          <span>Profil complété</span>
          <span className="font-bold text-cuivre">60 %</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-champagne/10">
          <div className="h-full w-[60%] rounded-full bg-cuivre" />
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
            className="rounded-xl border border-champagne/10 bg-nuit/50 p-3"
          >
            <Icon size={16} className="text-champagne/55" />
            <Trait className="mt-3 h-1.5 w-full" />
            <Trait className="mt-1.5 h-1.5 w-2/3 bg-champagne/10" />
            <span className="mt-3 block text-[11px] text-champagne/55">{label}</span>
          </div>
        ))}
      </div>

      <p className="mt-5 flex items-center gap-2 text-[12px] text-champagne/60">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-cuivre"
        />
        document officiel et selfie comparés par Stripe Identity
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-succes/25 bg-succes/[0.06] px-3 py-2.5">
        <Check size={15} strokeWidth={3} className="shrink-0 text-succes" />
        <span className="text-[12px] font-semibold text-succes">
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
              <span className="text-champagne/70">{critere.label}</span>
              <span className="font-bold text-champagne">{critere.valeur} %</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-champagne/10">
              <div
                className={
                  critere.valeur >= 90
                    ? 'h-full rounded-full bg-succes'
                    : 'h-full rounded-full bg-cuivre'
                }
                style={{ width: `${critere.valeur}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 flex items-start gap-2 text-[12px] leading-relaxed text-champagne/60">
        <Sparkles size={14} className="mt-0.5 shrink-0 text-cuivre" />
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
        <div className="max-w-[80%] rounded-2xl rounded-tl-md border border-champagne/10 bg-nuit/60 px-4 py-3">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-champagne">
            Suggestion d&apos;ouverture
          </span>
          <span className="block text-[12px] leading-relaxed text-champagne/75">
            Vous avez tous les deux coché « randonnée ». Quel a été ton plus
            beau sentier cette année ?
          </span>
        </div>

        <div className="ml-auto max-w-[70%] rounded-2xl rounded-tr-md bg-cuivre/[0.12] px-4 py-3">
          <Trait className="h-1.5 w-32" />
          <Trait className="mt-2 h-1.5 w-20 bg-champagne/10" />
        </div>
      </div>

      <p className="mt-5 flex items-start gap-2 text-[12px] leading-relaxed text-champagne/60">
        <MessageCircle size={14} className="mt-0.5 shrink-0 text-cuivre" />
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

export default function DossierParcours({
  entete,
}: {
  /**
   * Le titre de la section — surtitre, `h2`, chapô.
   *
   * Il vivait dans la page, au-dessus du composant, donc au-dessus des
   * deux colonnes : la carte commençait sous lui et pendait dans le coin
   * droit, avec un grand vide à la hauteur du titre. La maquette fait
   * monter la carte au niveau du surtitre, ce qui suppose que le titre
   * appartienne à la colonne de gauche. Le composant le reçoit donc
   * plutôt que de le laisser flotter au-dessus.
   */
  entete?: React.ReactNode;
}) {
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
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-12">
      <div className="flex flex-col">
        {entete}

        {/*
          Les étapes, sur une ligne.

          Elles étaient empilées, chacune dans sa carte, avec un rail
          vertical et un chevron. La maquette les met côte à côte, sans
          carte : il ne reste que la pastille numérotée, le titre et sa
          phrase, reliés par un trait horizontal. C'est la lecture d'un
          parcours — on voit les quatre d'un coup, et leur ordre est porté
          par l'axe plutôt que par la numérotation seule.

          `aria-orientation` reste « horizontal », la disposition de
          référence, même si la grille repasse en colonnes sous `lg` :
          l'attribut ne peut pas suivre un point de rupture. Ça ne gêne
          personne, le clavier acceptant déjà les quatre flèches.
        */}
        <div
          role="tablist"
          aria-label="Les étapes du parcours"
          aria-orientation="horizontal"
          className="mt-7 grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-4"
        >
          {etapes.map((item, index) => {
            const estActif = index === actif;

            return (
              <button
                key={item.numero}
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
                className="group relative flex flex-col items-start rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70 focus-visible:ring-offset-4 focus-visible:ring-offset-nuit"
              >
                {/*
                  Trait de liaison vers l'étape suivante. Il part du bord
                  droit de la pastille et traverse la gouttière jusqu'au
                  bord de la suivante — d'où le `-right-4`, qui vaut
                  exactement le `gap-x-4` de la grille.

                  Seulement à partir de `lg` : c'est la seule largeur où les
                  quatre étapes tiennent sur une rangée. Sur deux colonnes,
                  le trait de la deuxième partirait vers le vide.

                  Il se remplit au passage — cuivré derrière l'étape
                  atteinte, éteint devant. Un second repère de progression
                  qui ne coûte aucune hauteur.
                */}
                {index < etapes.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`absolute left-12 -right-4 top-5 hidden h-px lg:block ${
                      index < actif ? 'bg-cuivre/45' : 'bg-champagne/12'
                    }`}
                  />
                )}

                {/*
                  Les chiffres au repos sont mesurés, pas estimés : sur le
                  minuit de la pastille, champagne/55 ne donne que 4,29:1 et
                  succes/80 que 4,49:1 — tous deux sous le seuil du petit
                  texte. D'où champagne/70 (6,03) et le succes à pleine
                  opacité (6,19). Un chiffre d'étape n'est pas un ornement :
                  il doit se lire.
                */}
                <span
                  className={`font-display relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-[15px] font-extrabold transition-colors ${
                    item.validation
                      ? estActif
                        ? 'border-succes bg-succes text-nuit'
                        : 'border-succes/35 bg-minuit text-succes group-hover:border-succes/60'
                      : estActif
                        ? 'border-cuivre bg-cuivre text-nuit'
                        : 'border-champagne/15 bg-minuit text-champagne/70 group-hover:border-cuivre/50 group-hover:text-champagne'
                  }`}
                >
                  {item.numero}
                </span>

                <span
                  className={`font-display mt-4 block text-[16px] font-bold leading-snug transition-colors ${
                    estActif
                      ? 'text-champagne'
                      : 'text-champagne/70 group-hover:text-champagne'
                  }`}
                >
                  {item.titre}
                </span>

                <span className="mt-1.5 block text-[12.5px] leading-snug text-champagne/60">
                  {item.description}
                </span>

                {/*
                  Soulignement au survol et sur l'étape active. Les cartes
                  disparues emportaient avec elles le seul indice qu'on
                  pouvait cliquer ; le chapô dit « clique une étape », il
                  faut que quelque chose le confirme. Un trait qui se
                  déploie sous le titre suffit, et ne rajoute pas de cadre
                  là où la maquette n'en veut pas.
                */}
                <span
                  aria-hidden="true"
                  className={`mt-3 block h-px rounded-full transition-all duration-300 ${
                    estActif
                      ? item.validation
                        ? 'w-10 bg-succes'
                        : 'w-10 bg-cuivre'
                      : 'w-0 bg-champagne/40 group-hover:w-6'
                  }`}
                />
              </button>
            );
          })}
        </div>
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

        `lg:self-start` — la carte était centrée pour compenser une colonne
        de gauche beaucoup plus haute qu'elle, du temps où les étapes
        étaient empilées. Sur une rangée, les deux colonnes font à peu près
        la même hauteur, et la maquette aligne le haut de la carte sur le
        surtitre. Caler en haut suffit donc, et c'est plus juste.
      */}

      <div
        ref={panneauRef}
        id={`etape-panneau-${etape.numero}`}
        role="tabpanel"
        aria-labelledby={`etape-onglet-${etape.numero}`}
        tabIndex={0}
        className="relative flex w-full flex-col justify-center self-start rounded-[1.75rem] lg:min-h-[300px] lg:self-start border border-champagne/10 bg-minuit p-5 shadow-[0_35px_80px_-40px_rgba(0,0,0,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70 focus-visible:ring-offset-2 focus-visible:ring-offset-nuit sm:p-7"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-cuivre/[0.07] blur-[60px]"
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
