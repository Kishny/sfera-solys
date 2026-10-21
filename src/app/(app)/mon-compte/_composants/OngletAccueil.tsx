// src/app/(app)/mon-compte/_composants/OngletAccueil.tsx

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Crown,
  Eye,
  Gift,
  Heart,
  ListChecks,
  MapPin,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

import { getDepartementLabel } from "@/lib/locations";

import {
  carte,
  focusRing,
  intentionLabels,
  libelleOffre,
  offreActive,
  subscriptionLabels,
  variantesCarte,
  visibilityLabels,
  type MembreSolys,
  type TabId,
} from "./types";

/**
 * Onglet Accueil — direction « nuit cuivrée », d'après la maquette.
 *
 * Quatre tuiles d'état, la barre de complétion, trois informations de
 * profil, et l'offre en cours. Rien n'est ajouté : chaque valeur vient
 * déjà du membre chargé par la page.
 *
 * ## Les couleurs disent quelque chose
 *
 * Les tuiles portaient chacune son dégradé — violet, vert, jaune, bleu —
 * quatre familles chromatiques pour quatre chiffres, et aucune ne voulait
 * rien dire. La maquette revient à des anneaux colorés, mais cette fois la
 * couleur est l'information : vert quand c'est acquis, cuivre quand c'est
 * neutre, rouge quand l'abonnement est inactif. Le bleu de la maquette,
 * lui, n'existe pas dans la charte ; l'offre passe en cuivre.
 *
 * ## Les tuiles mènent quelque part
 *
 * La maquette pose un chevron sur chacune. Il n'est pas décoratif : la
 * tuile ouvre l'onglet qui permet d'agir sur ce qu'elle affiche. Une
 * flèche qui ne mène nulle part est pire qu'une tuile sans flèche.
 */

type Etat = "succes" | "cuivre" | "erreur";

const ANNEAUX: Record<Etat, string> = {
  succes: "border-succes/50 text-succes",
  cuivre: "border-cuivre/50 text-cuivre",
  erreur: "border-erreur/55 text-erreur",
};

const VALEURS: Record<Etat, string> = {
  succes: "text-succes",
  cuivre: "text-champagne",
  erreur: "text-erreur",
};

export default function OngletAccueil({
  user,
  completion,
  onOnglet,
}: {
  user: MembreSolys;
  completion: number;
  onOnglet: (onglet: TabId) => void;
}) {
  const payante = offreActive(user);
  const offre = libelleOffre(user);
  const abonnement = subscriptionLabels[user.subscriptionStatus] || "Inactif";

  const tuiles: Array<{
    icone: typeof ScrollText;
    label: string;
    valeur: string;
    etat: Etat;
    onglet: TabId;
  }> = [
    {
      icone: ScrollText,
      label: "Profil complété",
      valeur: `${completion} %`,
      etat: completion >= 100 ? "succes" : "cuivre",
      onglet: "profil",
    },
    {
      icone: ShieldCheck,
      label: "Compte",
      valeur: user.hasCompletedProfile ? "Validé" : "À compléter",
      etat: user.hasCompletedProfile ? "succes" : "cuivre",
      onglet: "securite",
    },
    {
      icone: Gift,
      label: "Offre",
      valeur: offre,
      etat: "cuivre",
      onglet: "premium",
    },
    {
      icone: Crown,
      label: "Abonnement",
      valeur: abonnement,
      etat: payante ? "succes" : "erreur",
      onglet: "premium",
    },
  ];

  const infos = [
    {
      icone: MapPin,
      label: "Localisation",
      valeur:
        [user.localisation, getDepartementLabel(user.departement)]
          .filter(Boolean)
          .join(" · ") || "—",
      onglet: "profil" as TabId,
    },
    {
      icone: Heart,
      label: "Intentions",
      valeur:
        (user.intentions || [])
          .map((item) => intentionLabels[item] || item)
          .join(", ") || "—",
      onglet: "profil" as TabId,
    },
    {
      icone: Eye,
      label: "Visibilité",
      valeur: visibilityLabels[user.visibilite] || user.visibilite,
      onglet: "preferences" as TabId,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Salutation */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="min-w-0">
          <h2 className="font-display text-[28px] font-normal leading-tight text-ivoire sm:text-[34px]">
            Bonjour{" "}
            <span className="text-cuivre">{user.pseudonyme}</span>,
          </h2>
          <p className="mt-1.5 text-[14px] text-champagne/80">
            Un aperçu de ton espace Sfera&rsquo;Solys.
          </p>
        </div>

        <p className="font-display hidden items-center gap-4 text-right text-[14px] italic leading-snug text-champagne/75 lg:flex">
          <span aria-hidden="true" className="h-px w-12 shrink-0 bg-cuivre" />
          Des rencontres authentiques,
          <br />
          dans un cadre d&rsquo;exception.
        </p>
      </div>

      {/* Les quatre états */}
      <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {tuiles.map((tuile, index) => {
          const Icone = tuile.icone;

          return (
            <motion.li
              key={tuile.label}
              custom={index}
              variants={variantesCarte}
              initial="hidden"
              animate="visible"
            >
              <button
                type="button"
                onClick={() => onOnglet(tuile.onglet)}
                className={`${carte} flex w-full items-center gap-3.5 p-4 text-left transition-colors hover:border-cuivre/40 ${focusRing}`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 bg-nuit/60 ${ANNEAUX[tuile.etat]}`}
                >
                  <Icone size={18} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] text-champagne/75">
                    {tuile.label}
                  </span>
                  <span
                    className={`mt-0.5 block truncate text-[16px] font-bold ${VALEURS[tuile.etat]}`}
                  >
                    {tuile.valeur}
                  </span>
                </span>

                <ChevronRight
                  size={16}
                  aria-hidden="true"
                  className="shrink-0 text-champagne/55"
                />
              </button>
            </motion.li>
          );
        })}
      </ul>

      {/* Complétion */}
      <section className={`${carte} p-4 sm:p-5`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cuivre/40 bg-nuit/60 text-cuivre"
          >
            <ListChecks size={18} />
          </span>

          <div className="min-w-0 sm:w-56 sm:shrink-0">
            <p className="text-[14px] font-semibold text-champagne">
              Complétion du profil
            </p>
            <p className="mt-0.5 text-[12.5px] text-champagne/75">
              {completion >= 100
                ? "Ton profil est complet. Bravo !"
                : "Il reste quelques champs à remplir."}
            </p>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-champagne/15"
              role="presentation"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completion}%` }}
                transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  completion >= 100 ? "bg-degrade-cuivre" : "bg-cuivre"
                }`}
              />
            </div>

            <p className="font-display shrink-0 text-[18px] text-ivoire">
              {completion}&nbsp;%
            </p>
          </div>
        </div>

        {completion < 100 && (
          <p className="mt-3.5 text-[12.5px] leading-relaxed text-champagne/75">
            Un profil rempli remonte plus souvent dans l&rsquo;annuaire — et
            donne surtout à quelqu&rsquo;un une raison d&rsquo;écrire.{" "}
            <button
              type="button"
              onClick={() => onOnglet("profil")}
              className={`font-semibold text-cuivre underline underline-offset-2 hover:text-champagne ${focusRing}`}
            >
              Compléter mon profil
            </button>
          </p>
        )}
      </section>

      {/* Informations de profil */}
      <ul className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
        {infos.map((info) => {
          const Icone = info.icone;

          return (
            <li key={info.label}>
              <button
                type="button"
                onClick={() => onOnglet(info.onglet)}
                className={`${carte} flex w-full items-center gap-3.5 p-4 text-left transition-colors hover:border-cuivre/40 ${focusRing}`}
              >
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cuivre/40 bg-nuit/60 text-cuivre"
                >
                  <Icone size={18} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] text-champagne/75">
                    {info.label}
                  </span>
                  <span className="mt-0.5 block truncate text-[14px] font-semibold text-champagne">
                    {info.valeur}
                  </span>
                </span>

                <ChevronRight
                  size={16}
                  aria-hidden="true"
                  className="shrink-0 text-champagne/55"
                />
              </button>
            </li>
          );
        })}
      </ul>

      {/*
        L'offre en cours.

        Voile mesuré sur `solys-10` : dans les 45 % de gauche, le champagne
        à 70 % tient 7,18:1 et le surtitre à 60 % 5,52.
      */}
      <section className="relative isolate overflow-hidden rounded-2xl border border-champagne/12">
        <Image
          src="/visuels/solys-10.webp"
          alt=""
          fill
          sizes="(max-width: 1280px) 100vw, 1460px"
          className="-z-10 object-cover object-center"
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(10,13,18,0.92)_0%,rgba(10,13,18,0.88)_45%,rgba(10,13,18,0.55)_70%,rgba(10,13,18,0.15)_100%)]"
        />

        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-start gap-4">
            <span
              aria-hidden="true"
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 bg-nuit/60 ${
                payante ? ANNEAUX.succes : ANNEAUX.cuivre
              }`}
            >
              <Gift size={22} />
            </span>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-surtitre text-champagne/70">
                Ton offre actuelle
              </p>

              <p className="font-display mt-1.5 text-[22px] font-normal leading-tight text-ivoire">
                {payante ? `Offre ${offre}` : "Offre gratuite"}
              </p>

              <p className="mt-2 max-w-md text-[12.5px] leading-relaxed text-champagne/80">
                {payante
                  ? "Tu profites des fonctionnalités incluses dans ton abonnement."
                  : "La vérification, l’annuaire, l’Entraide et la messagerie sont déjà ouverts. Les offres payantes ajoutent le Circle, les boosts et le Mode Fantôme."}
              </p>
            </div>
          </div>

          <Link
            href={payante ? "/mon-compte?tab=premium" : "/tarifs"}
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-degrade-cuivre px-5 py-3 text-[13px] font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
          >
            {payante ? "Gérer mon abonnement" : "Voir les offres"}
            <ChevronRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
