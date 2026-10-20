// src/components/brand/mise-en-page.tsx

/**
 * Les éléments de composition partagés par les pages publiques.
 *
 * Ils sont nés dans `app/page.tsx`, où ils étaient définis en local. Tant
 * qu'une seule page suivait la direction « nuit cuivrée », ça allait ; dès
 * la deuxième, les copier revenait à garantir qu'elles divergeraient — un
 * resserrage fait sur l'une, oublié sur l'autre, et le rythme se perd.
 *
 * Tout ce qui est ici est de la **composition**, pas du contenu : un
 * rythme vertical, un anneau de focus, un surtitre, un filet, une tuile
 * d'icône. Une page qui a besoin d'autre chose l'écrit chez elle ; ce qui
 * se répète sur deux pages vient ici.
 */

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

/**
 * Une icône posable dans une tuile.
 *
 * `LucideIcon` ne suffit pas : la marque a ses propres pictogrammes —
 * `HexagonSix` pour le Circle of Six — qui ne sont pas des `forwardRef`
 * lucide. Et l'inverse ne suffit pas non plus : une signature réduite à
 * `size` refuse les icônes lucide, dont le type porte une référence SVG.
 *
 * L'union accepte les deux, et `size` étant commun aux deux, l'appel reste
 * valide quel que soit le composant passé.
 */
export type IconeMarque =
  | LucideIcon
  | React.ComponentType<{ size?: number | string; className?: string }>;

/**
 * Rythme vertical des sections.
 *
 * Trois passes de resserrage depuis le début de la refonte :
 * `py-16 sm:py-24` au départ, soit 192 px entre deux sections sur grand
 * écran — à cette distance chaque section se lit isolée, et la page se
 * parcourt par à-coups. Puis 128 px. Puis 96 px, la valeur actuelle.
 *
 * 96 px séparent encore nettement. En dessous, le rythme commencerait à se
 * perdre et les sections à se confondre — ce serait alors le nombre de
 * sections qu'il faudrait revoir, pas leur hauteur.
 *
 * C'est le seul endroit à toucher pour resserrer ou aérer l'ensemble du
 * site public.
 */
export const sectionY = 'py-8 sm:py-10 lg:py-12';

/**
 * Dégagement sous l'en-tête fixe, pour le premier bloc d'une page.
 *
 * L'en-tête ne fait pas la même hauteur partout : `h-14` (56 px),
 * `sm:h-16` (64) puis `xl:h-20` (80). Le padding haut doit donc suivre ces
 * paliers-là, et non ceux de la grille — c'est l'erreur qui avait collé le
 * surtitre du héros à la bordure de l'en-tête au-delà de 1280 px.
 *
 * Résultat : environ 48 px de dégagement à toutes les largeurs.
 */
export const premierBloc = 'pt-24 sm:pt-28 xl:pt-32';

/** Anneau de focus clavier, identique partout. */
export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70 focus-visible:ring-offset-2 focus-visible:ring-offset-nuit';

/**
 * Surtitre en petites capitales, précédé d'un filet cuivré.
 *
 * Il nomme la section d'un mot avant que le titre ne la développe. Posé
 * au-dessus de chaque `h2`, c'est lui qui donne au défilement son rythme
 * éditorial.
 */
export function Surtitre({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        'flex items-center gap-3 text-[11px] font-semibold uppercase tracking-surtitre text-champagne/60',
        className
      )}
    >
      <span aria-hidden="true" className="h-px w-8 bg-cuivre" />
      {children}
    </p>
  );
}

/**
 * Filet de séparation entre deux sections.
 *
 * Les sections étaient séparées par un `border-t` pleine largeur. Sous une
 * section dont la photo touche les bords, cette ligne continue tranche
 * l'écran au lieu de marquer une respiration.
 *
 * Celui-ci s'arrête à la largeur du contenu et s'éteint à ses deux
 * extrémités : il sépare sans couper. Il ne s'emploie pas autour d'une
 * section à fond photographique, dont l'image s'éteint déjà d'elle-même en
 * haut et en bas — deux marques de séparation au même endroit en font une
 * de trop.
 */
export function Filet() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto h-px max-w-7xl bg-gradient-to-r from-transparent via-champagne/15 to-transparent"
    />
  );
}

/**
 * Tuile d'icône.
 *
 * Un carré aux angles adoucis, posé à gauche du texte plutôt qu'au-dessus.
 * Le gain n'est pas décoratif : à gauche, la tuile aligne les titres sur
 * une même verticale et la carte tient en deux lignes au lieu de quatre.
 *
 * `LucideIcon` et non un `ComponentType<{ size?: number }>` écrit à la
 * main : les icônes lucide sont des `forwardRef`, et leur type porte une
 * référence SVG qu'une signature réduite à `size` refuse.
 */
export function TuileIcone({
  icon: Icon,
  className,
}: {
  icon: IconeMarque;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cuivre/30 bg-nuit/60 text-cuivre',
        className
      )}
    >
      <Icon size={20} />
    </span>
  );
}

/**
 * Titre de section : surtitre, puis `h2` en Playfair ivoire.
 *
 * Les deux allaient toujours ensemble et toujours avec les mêmes valeurs ;
 * les écrire séparément à chaque section, c'était cinq occasions de
 * diverger par page.
 */
export function TitreSection({
  surtitre,
  children,
  id,
  className,
}: {
  surtitre: string;
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Surtitre>{surtitre}</Surtitre>

      <h2
        id={id}
        className="font-display mt-4 text-[30px] font-normal leading-tight tracking-tight text-ivoire sm:text-[38px]"
      >
        {children}
      </h2>
    </div>
  );
}


/**
 * En-tête de section en deux colonnes : le titre à gauche, une phrase
 * d'introduction alignée à droite.
 *
 * C'est le motif que la maquette répète à chaque section. Il tient en une
 * hauteur ce qu'un titre suivi d'un chapô prendrait en deux, et il donne au
 * défilement une ligne de lecture constante : on sait où regarder pour le
 * titre, où regarder pour le détail.
 *
 * `items-end` cale la phrase sur la dernière ligne du titre plutôt que sur
 * sa première — sans quoi elle flotte dès que le titre passe sur deux
 * lignes, ce qui arrive à toutes les largeurs intermédiaires.
 */
export function EnteteSection({
  surtitre,
  intro,
  children,
  className,
}: {
  surtitre: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-12',
        className
      )}
    >
      <TitreSection surtitre={surtitre} className="max-w-2xl">
        {children}
      </TitreSection>

      {intro && (
        <p className="max-w-sm text-[14px] leading-relaxed text-champagne/70 lg:text-right">
          {intro}
        </p>
      )}
    </div>
  );
}
