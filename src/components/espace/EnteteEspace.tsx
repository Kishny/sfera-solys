"use client";

import Link from "next/link";

import { type IconeMarque } from "@/components/brand/mise-en-page";

/**
 * En-tête commun aux pages de l'espace membre.
 *
 * Les six maquettes du tableau de bord ouvrent toutes de la même façon :
 * un surtitre en petites capitales cuivrées, un titre en Playfair, une
 * ligne de description, et une pastille d'état alignée à droite. Les pages
 * portaient déjà cet en-tête, mais chacune le réécrivait — huit copies du
 * même `h1`, à huit endroits, avec le risque habituel que l'une parte de
 * son côté au premier ajustement.
 *
 * La pastille de droite n'est pas qu'un ornement : selon la page, elle
 * rappelle une condition d'accès (« Accès dès Essentiel »), un état
 * (« Visible par tous ») ou déclenche une action (« Actualiser »). Elle
 * accepte donc un lien, un gestionnaire de clic, ou rien du tout — et
 * dans ce dernier cas elle est rendue comme un simple libellé, pas comme
 * un bouton mort.
 */

type Ton = "neutre" | "succes" | "cuivre";

const TONS: Record<Ton, string> = {
  neutre: "border-champagne/20 bg-minuit/70 text-champagne/85",
  succes: "border-succes/45 bg-succes/12 text-succes",
  cuivre: "border-cuivre/50 bg-cuivre/10 text-champagne",
};

export type ActionEntete = {
  libelle: string;
  icone?: IconeMarque;
  href?: string;
  onClick?: () => void;
  ton?: Ton;
  /** Pastille pleine avant le libellé, pour les états de visibilité. */
  pastille?: boolean;
};

export default function EnteteEspace({
  surtitre,
  titre,
  sousTitre,
  action,
  children,
  className = "",
}: {
  surtitre: string;
  titre: React.ReactNode;
  sousTitre?: string;
  action?: ActionEntete;
  /**
   * Contenu libre à droite, à la place de la pastille.
   *
   * Trois pages y gardent un bouton qui leur appartient — « Créer une
   * publication », « Poser une question », « Actualiser ». Les y laisser
   * évite de déménager une action et sa logique pour un simple alignement.
   */
  children?: React.ReactNode;
  className?: string;
}) {
  const ton = action?.ton ?? "neutre";
  const Icone = action?.icone;

  const contenuAction = action && (
    <>
      {action.pastille && (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"
        />
      )}

      {Icone && !action.pastille && <Icone size={15} aria-hidden="true" />}

      {action.libelle}
    </>
  );

  const classesAction = `inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70 focus-visible:ring-offset-2 focus-visible:ring-offset-nuit ${TONS[ton]}`;

  return (
    <header
      className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8 ${className}`}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-surtitre text-cuivre/90">
          {surtitre}
        </p>

        <h1 className="font-display mt-2.5 text-[30px] font-normal leading-tight tracking-tight text-ivoire sm:text-[40px]">
          {titre}
        </h1>

        {sousTitre && (
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-champagne/80">
            {sousTitre}
          </p>
        )}
      </div>

      {children}

      {!children && action &&
        (action.href ? (
          <Link href={action.href} className={`${classesAction} hover:border-cuivre/60`}>
            {contenuAction}
          </Link>
        ) : action.onClick ? (
          <button
            type="button"
            onClick={action.onClick}
            className={`${classesAction} hover:border-cuivre/60`}
          >
            {contenuAction}
          </button>
        ) : (
          <span className={classesAction}>{contenuAction}</span>
        ))}
    </header>
  );
}
