// src/components/brand/InterfacePreviews.tsx

import { ArrowRight, Check, MapPin, SlidersHorizontal } from 'lucide-react';
import HexagonSix from '@/components/icons/HexagonSix';

/**
 * Aperçus d'interface pour les pages publiques.
 *
 * Pourquoi des illustrations et pas des captures d'écran : les pages réelles
 * de l'espace membre sont encore au violet SferaLuna, une capture montrerait
 * donc l'ancien produit. Ces aperçus montrent la structure exacte de
 * l'interface, dans la bonne palette.
 *
 * Règle appliquée ici, et à conserver : **aucun visage, aucune identité**.
 * Les avatars sont le motif d'éclipse de la marque décliné en plusieurs
 * phases — une illustration, que personne ne peut prendre pour la photo d'un
 * membre. Les seules données affichées sont des attributs que le produit
 * stocke réellement (`age`, `localisation`, `interets`, `identityVerified`
 * dans `models/User.ts`), avec des valeurs d'exemple, et la légende de chaque
 * aperçu le dit explicitement.
 *
 * Ce que ça exclut, et pourquoi : pas de portrait de banque d'images, pas de
 * prénom. Un site dont l'argument unique est « chaque membre est vérifié »
 * ne peut pas illustrer cette promesse avec des visages de personnes qui n'en
 * sont pas. La mention « données d'exemple » est ce qui rend le reste
 * honnête — si elle saute, la règle saute avec elle.
 *
 * Les deux composants sont purement présentationnels (aucun hook), donc
 * utilisables aussi bien côté serveur que client.
 */

/** Dégradés de fond des avatars, alternés pour que six vignettes ne soient pas six fois la même. */
const TEINTES = [
  'from-orange/30 via-rust/30 to-abyss',
  'from-rust/40 via-abyss to-abyss',
  'from-orange/20 via-abyss to-rust/25',
  'from-rust/25 via-orange/15 to-abyss',
];

/**
 * Avatar illustré : l'éclipse de la marque, déclinée en plusieurs phases.
 *
 * **Géométrie : un occulteur plus petit que le disque, et à peine décalé.**
 * C'est la même contrainte que sur `EclipseMark`, et elle n'est pas
 * cosmétique. Deux disques de même rayon légèrement décalés produisent un
 * croissant — c'est-à-dire le symbole de SferaLuna, la marque féminine dont
 * ce projet est le pendant. Un occulteur plus petit laisse au contraire un
 * anneau complet : une éclipse annulaire, qui ne peut se lire que comme un
 * soleil. Le décalage varie d'une vignette à l'autre pour épaissir l'anneau
 * d'un côté, jamais assez pour le rompre. Ne pas augmenter `phases`
 * au-delà de ~0,3 sans regarder le rendu.
 */
function AvatarEclipse({
  index,
  className = '',
}: {
  index: number;
  className?: string;
}) {
  const phases = [0.3, -0.18, 0.12, -0.28, 0.22, -0.08];
  const d = phases[index % phases.length];

  return (
    <span
      aria-hidden="true"
      className={`relative block shrink-0 overflow-hidden rounded-lg bg-gradient-to-br ${
        TEINTES[index % TEINTES.length]
      } ${className}`}
    >
      <svg
        viewBox="0 0 40 40"
        className="absolute inset-0 h-full w-full"
        role="presentation"
      >
        {/* Couronne : ce qui achève de dire « soleil » plutôt que « disque ». */}
        <circle
          cx="20"
          cy="20"
          r="12.5"
          fill="none"
          stroke="#FF4103"
          strokeOpacity="0.22"
          strokeWidth="1"
        />
        <circle cx="20" cy="20" r="9.5" fill="#FF4103" fillOpacity="0.92" />
        <circle
          cx={20 + d * 6}
          cy={20 - d * 3}
          r="6.6"
          fill="#08202B"
          fillOpacity="0.96"
        />
      </svg>
    </span>
  );
}

/** Données d'exemple — voir la note en tête de fichier. Âges cohérents avec le critère 28+. */
const PROFILS_CIRCLE = [
  { age: 34, ville: 'Lyon', communs: 3 },
  { age: 31, ville: 'Villeurbanne', communs: 5 },
  { age: 38, ville: 'Écully', communs: 2 },
  { age: 29, ville: 'Bron', communs: 4 },
  { age: 41, ville: 'Caluire', communs: 3 },
  { age: 33, ville: 'Vénissieux', communs: 6 },
];

/**
 * Aperçu du Circle of Six : les 6 profils proposés dans la semaine.
 */
export function CircleOfSixPreview({ className = '' }: { className?: string }) {
  return (
    <figure className={`flex flex-col ${className}`}>
      {/*
        `flex flex-col` + `mt-auto` sur le pied de carte : les deux aperçus
        sont côte à côte dans une grille, donc étirés à la même hauteur. Sans
        ça, la carte la plus courte gardait une poche de vide sous son texte.
      */}
      <div className="flex flex-1 flex-col rounded-2xl border border-cream/10 bg-[#0C222D] p-4 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.8)] sm:p-5">
        {/* En-tête */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <HexagonSix size={18} className="shrink-0" />
            <span className="font-display [font-stretch:125%] text-[13px] font-extrabold text-cream">
              Circle of Six
            </span>
          </span>

          <span className="rounded-full border border-lime/30 bg-lime/[0.08] px-2 py-0.5 text-[10px] font-bold text-lime">
            Cette semaine
          </span>
        </div>

        {/* Les 6 propositions */}
        <div className="grid grid-cols-3 gap-2">
          {PROFILS_CIRCLE.map((profil, slot) => (
            <div
              key={profil.ville}
              className={`rounded-xl border p-2 ${
                slot === 1
                  ? 'border-orange/40 bg-orange/[0.06]'
                  : 'border-cream/8 bg-abyss/50'
              }`}
            >
              <AvatarEclipse index={slot} className="h-12 w-full sm:h-14" />

              <span className="mt-2 block truncate text-[10px] font-semibold text-cream/80">
                {profil.age} ans · {profil.ville}
              </span>
              <span className="block text-[9px] leading-tight text-cream/50">
                {profil.communs} intérêts en commun
              </span>

              <span className="mt-1.5 flex items-center gap-1 text-[9px] font-bold text-lime">
                <Check size={9} strokeWidth={3} />
                Vérifié
              </span>
            </div>
          ))}
        </div>

        <p className="mt-auto border-t border-cream/8 pt-3 text-[11px] text-cream/55">
          <span className="block pt-1">
            6 profils, renouvelés chaque lundi. Aucun défilement infini.
          </span>
        </p>
      </div>

      <figcaption className="mt-3 text-[12px] text-cream/55">
        Aperçu de l&apos;interface — données d&apos;exemple, aucun profil réel.
      </figcaption>
    </figure>
  );
}

/**
 * Aperçu de la vue annuaire : l'alternative posée au swipe.
 */
export function AnnuairePreview({ className = '' }: { className?: string }) {
  /** Données d'exemple — voir la note en tête de fichier. */
  const rows = [
    { age: 34, ville: 'Lyon', km: 3, tags: ['Sport', 'Voyage'], highlight: false },
    { age: 30, ville: 'Villeurbanne', km: 6, tags: ['Musique', 'Lecture'], highlight: true },
    { age: 37, ville: 'Écully', km: 8, tags: ['Randonnée', 'Photo'], highlight: false },
    { age: 29, ville: 'Bron', km: 11, tags: ['Cuisine', 'Cinéma'], highlight: false },
    { age: 42, ville: 'Caluire', km: 14, tags: ['Course', 'Design'], highlight: false },
  ];

  return (
    <figure className={`flex flex-col ${className}`}>
      <div className="flex-1 rounded-2xl border border-cream/10 bg-[#0C222D] p-4 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.8)] sm:p-5">
        {/* En-tête : bascule annuaire / découverte */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="font-display [font-stretch:125%] text-[13px] font-extrabold text-cream">
            Explorer
          </span>

          <span
            aria-hidden="true"
            className="flex items-center rounded-lg border border-cream/10 bg-abyss/60 p-0.5"
          >
            <span className="rounded-md bg-orange px-2 py-1 text-[10px] font-bold text-abyss">
              Annuaire
            </span>
            <span className="px-2 py-1 text-[10px] font-semibold text-cream/55">
              Découverte
            </span>
          </span>
        </div>

        {/* Filtres */}
        <div className="mb-3 flex items-center gap-1.5">
          <SlidersHorizontal size={11} className="shrink-0 text-cream/55" />
          <span className="rounded-full border border-orange/35 bg-orange/[0.1] px-2 py-0.5 text-[10px] font-semibold text-cream">
            À proximité
          </span>
          <span className="rounded-full border border-cream/12 px-2 py-0.5 text-[10px] font-semibold text-cream/60">
            28-35 ans
          </span>
          <span className="hidden rounded-full border border-cream/12 px-2 py-0.5 text-[10px] font-semibold text-cream/60 sm:inline">
            Vérifié uniquement
          </span>
        </div>

        {/* Lignes */}
        <div className="divide-y divide-cream/8 border-t border-cream/8">
          {rows.map((row, index) => (
            <div
              key={row.ville}
              className={`flex items-center gap-3 py-2.5 ${
                row.highlight ? 'bg-orange/[0.04]' : ''
              }`}
            >
              <AvatarEclipse index={index} className="h-9 w-9" />

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-semibold text-cream/80">
                  {row.age} ans · {row.ville}
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-[10px] text-cream/50">
                  <MapPin size={9} className="shrink-0" />à {row.km} km
                </span>
              </span>

              <span className="hidden items-center gap-1 sm:flex">
                {row.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-cream/12 px-2 py-0.5 text-[10px] text-cream/60"
                  >
                    {tag}
                  </span>
                ))}
              </span>

              <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-lime">
                <Check size={10} strokeWidth={3} />
                Vérifié
              </span>

              <ArrowRight size={13} className="shrink-0 text-orange" />
            </div>
          ))}
        </div>
      </div>

      <figcaption className="mt-3 text-[12px] text-cream/55">
        La vue annuaire, à côté du mode découverte — tu choisis ton rythme.
        Données d&apos;exemple.
      </figcaption>
    </figure>
  );
}
