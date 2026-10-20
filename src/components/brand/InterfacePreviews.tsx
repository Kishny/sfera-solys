// src/components/brand/InterfacePreviews.tsx

import Image from 'next/image';
import { ArrowRight, Check, MapPin, SlidersHorizontal } from 'lucide-react';
import HexagonSix from '@/components/icons/HexagonSix';

/**
 * Aperçus d'interface pour les pages publiques.
 *
 * ## La règle « aucun visage » a été levée — ce qu'il faut savoir
 *
 * Ce fichier portait une règle : les avatars étaient le motif d'éclipse de
 * la marque, et l'argument écrit ici était qu'un site dont la promesse
 * unique est « chaque membre est vérifié » ne peut pas illustrer cette
 * promesse avec des visages de personnes qui n'en sont pas.
 *
 * La maquette montre des portraits, et c'est la décision retenue après
 * avoir posé le choix explicitement. Les avatars sont donc six
 * photographies générées, rangées dans `public/visuels/profils/`.
 *
 * Deux garde-fous subsistent, et ils ne sont pas décoratifs :
 *
 * 1. **La légende de chaque aperçu reste.** « Aperçu de l'interface —
 *    données d'exemple, aucun profil réel. » C'est la seule chose qui
 *    sépare une illustration d'un faux témoignage. Elle est petite, elle
 *    ne gêne rien, et elle n'a pas à sauter pour gagner douze pixels.
 * 2. **Toujours aucun prénom.** Un âge et une ville restent des attributs
 *    génériques ; un prénom accolé à un visage fabrique une personne.
 *
 * Les données affichées restent des attributs que le produit stocke
 * réellement (`age`, `localisation`, `interets`, `identityVerified` dans
 * `models/User.ts`), avec des valeurs d'exemple.
 *
 * ## Pourquoi des illustrations et pas des captures d'écran
 *
 * Les pages réelles de l'espace membre sont encore au violet SferaLuna :
 * une capture montrerait l'ancien produit. Ces aperçus montrent la
 * structure exacte de l'interface, dans la bonne palette.
 *
 * Les deux composants sont purement présentationnels (aucun hook), donc
 * utilisables aussi bien côté serveur que client.
 */

/**
 * Les six profils d'exemple, photo comprise.
 *
 * Une seule liste pour les deux aperçus, là où il y en avait deux. Elles
 * décrivaient les mêmes villes avec des âges différents — Caluire à 41 ans
 * d'un côté, 42 de l'autre. Tant que les avatars étaient abstraits, ça ne
 * se voyait pas. Avec des visages, le même homme apparaissait dans les
 * deux cartes, côte à côte, avec un an d'écart.
 *
 * Qu'on retrouve les mêmes personnes dans le Circle et dans l'annuaire est
 * au contraire cohérent : le Circle est une sélection de l'annuaire.
 *
 * L'ordre n'est pas indifférent. Les trois premiers occupent la rangée du
 * haut du Circle, la plus grande et la plus regardée : ce sont les trois
 * visages les plus distincts du lot. Les sources se ressemblent beaucoup —
 * même terrasse, même crépuscule, même chemise noire, et deux familles de
 * physionomies — donc les plus proches sont renvoyés aux vignettes de 36 px
 * de l'annuaire, où la ressemblance ne se lit plus.
 */
const PROFILS = [
  {
    photo: '/visuels/profils/profil-02.webp',
    age: 34,
    ville: 'Lyon',
    communs: 3,
    km: 3,
    tags: ['Sport', 'Voyage'],
  },
  {
    photo: '/visuels/profils/profil-03.webp',
    age: 31,
    ville: 'Villeurbanne',
    communs: 5,
    km: 6,
    tags: ['Musique', 'Lecture'],
  },
  {
    photo: '/visuels/profils/profil-04.webp',
    age: 38,
    ville: 'Écully',
    communs: 2,
    km: 8,
    tags: ['Randonnée', 'Photo'],
  },
  {
    photo: '/visuels/profils/profil-01.webp',
    age: 29,
    ville: 'Bron',
    communs: 4,
    km: 11,
    tags: ['Cuisine', 'Cinéma'],
  },
  {
    photo: '/visuels/profils/profil-05.webp',
    age: 41,
    ville: 'Caluire',
    communs: 3,
    km: 14,
    tags: ['Course', 'Design'],
  },
  {
    photo: '/visuels/profils/profil-06.webp',
    age: 33,
    ville: 'Vénissieux',
    communs: 6,
    km: 17,
    tags: ['Cinéma', 'Sport'],
  },
];

/**
 * Avatar : une des six photographies d'exemple.
 *
 * `alt=""` volontairement : la vignette est décorative, l'âge et la ville
 * juste à côté portent toute l'information. Un texte alternatif décrivant
 * un visage n'ajouterait rien et inventerait une personne à l'oreille de
 * qui ne voit pas l'image.
 *
 * `sizes` reste petit : la plus grande de ces vignettes fait environ
 * 110 px de large dans le Circle, 36 px dans l'annuaire. Sans cette borne,
 * Next servirait des variantes bien plus lourdes que nécessaire.
 */
function AvatarProfil({
  src,
  className = '',
}: {
  src: string;
  className?: string;
}) {
  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded-lg bg-nuit ${className}`}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes="(max-width: 640px) 120px, 200px"
        /*
          `object-[50%_42%]` et non le centre : les sources sont carrées et
          la vignette du Circle est en 6/5, donc le haut et le bas sont
          rognés. Centré, le cadre coupait le crâne et le menton et ne
          laissait qu'une bande à hauteur des yeux. Remonter le point de
          référence à 42 % garde la tête entière et les épaules.

          Sans effet sur les vignettes de l'annuaire, carrées comme les
          sources : il n'y a alors rien à rogner.
        */
        className="object-cover object-[50%_42%]"
      />
    </span>
  );
}

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
      <div className="flex flex-1 flex-col rounded-2xl border border-champagne/10 bg-minuit p-4 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.8)] sm:p-5">
        {/* En-tête */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <HexagonSix size={18} className="shrink-0" />
            <span className="font-display text-[13px] font-extrabold text-champagne">
              Circle of Six
            </span>
          </span>

          <span className="rounded-full border border-succes/30 bg-succes/[0.08] px-2 py-0.5 text-[10px] font-bold text-succes">
            Cette semaine
          </span>
        </div>

        {/* Les 6 propositions */}
        <div className="grid grid-cols-3 gap-2">
          {PROFILS.map((profil, slot) => (
            <div
              key={profil.ville}
              className={`rounded-xl border p-2 ${
                slot === 1
                  ? 'border-cuivre/40 bg-cuivre/[0.06]'
                  : 'border-champagne/8 bg-nuit/50'
              }`}
            >
              <AvatarProfil src={profil.photo} className="aspect-[6/5] w-full" />

              <span className="mt-2 block truncate text-[10px] font-semibold text-champagne/80">
                {profil.age} ans · {profil.ville}
              </span>
              <span className="block text-[9px] leading-tight text-champagne/60">
                {profil.communs} intérêts en commun
              </span>

              <span className="mt-1.5 flex items-center gap-1 text-[9px] font-bold text-succes">
                <Check size={9} strokeWidth={3} />
                Vérifié
              </span>
            </div>
          ))}
        </div>

        <p className="mt-auto border-t border-champagne/8 pt-3 text-[11px] text-champagne/55">
          <span className="block pt-1">
            6 profils, renouvelés chaque lundi. Aucun défilement infini.
          </span>
        </p>
      </div>

      <figcaption className="mt-3 text-[12px] text-champagne/55">
        Aperçu de l&apos;interface — données d&apos;exemple, aucun profil réel.
      </figcaption>
    </figure>
  );
}

/**
 * Aperçu de la vue annuaire : l'alternative posée au swipe.
 */
export function AnnuairePreview({ className = '' }: { className?: string }) {
  return (
    <figure className={`flex flex-col ${className}`}>
      <div className="flex-1 rounded-2xl border border-champagne/10 bg-minuit p-4 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.8)] sm:p-5">
        {/* En-tête : bascule annuaire / découverte */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="font-display text-[13px] font-extrabold text-champagne">
            Explorer
          </span>

          <span
            aria-hidden="true"
            className="flex items-center rounded-lg border border-champagne/10 bg-nuit/60 p-0.5"
          >
            <span className="rounded-md bg-cuivre px-2 py-1 text-[10px] font-bold text-nuit">
              Annuaire
            </span>
            <span className="px-2 py-1 text-[10px] font-semibold text-champagne/55">
              Découverte
            </span>
          </span>
        </div>

        {/* Filtres */}
        <div className="mb-3 flex items-center gap-1.5">
          <SlidersHorizontal size={11} className="shrink-0 text-champagne/55" />
          <span className="rounded-full border border-cuivre/35 bg-cuivre/[0.1] px-2 py-0.5 text-[10px] font-semibold text-champagne">
            À proximité
          </span>
          <span className="rounded-full border border-champagne/12 px-2 py-0.5 text-[10px] font-semibold text-champagne/60">
            28-35 ans
          </span>
          <span className="hidden rounded-full border border-champagne/12 px-2 py-0.5 text-[10px] font-semibold text-champagne/60 sm:inline">
            Vérifié uniquement
          </span>
        </div>

        {/* Lignes */}
        <div className="divide-y divide-champagne/8 border-t border-champagne/8">
          {PROFILS.slice(0, 5).map((row, index) => (
            <div
              key={row.ville}
              className={`flex items-center gap-3 py-2.5 ${
                index === 1 ? 'bg-cuivre/[0.04]' : ''
              }`}
            >
              <AvatarProfil src={row.photo} className="h-9 w-9" />

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-semibold text-champagne/80">
                  {row.age} ans · {row.ville}
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-[10px] text-champagne/60">
                  <MapPin size={9} className="shrink-0" />à {row.km} km
                </span>
              </span>

              <span className="hidden items-center gap-1 sm:flex">
                {row.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-champagne/12 px-2 py-0.5 text-[10px] text-champagne/60"
                  >
                    {tag}
                  </span>
                ))}
              </span>

              <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-succes">
                <Check size={10} strokeWidth={3} />
                Vérifié
              </span>

              <ArrowRight size={13} className="shrink-0 text-cuivre" />
            </div>
          ))}
        </div>
      </div>

      <figcaption className="mt-3 text-[12px] text-champagne/55">
        La vue annuaire, à côté du mode découverte — tu choisis ton rythme.
        Données d&apos;exemple.
      </figcaption>
    </figure>
  );
}
