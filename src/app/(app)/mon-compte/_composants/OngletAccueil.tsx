// src/app/(app)/mon-compte/_composants/OngletAccueil.tsx

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Eye, Heart, MapPin } from "lucide-react";

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
 * Onglet Accueil.
 *
 * Quatre tuiles de statistiques, la barre de complétion, trois informations de
 * profil, et l'état de l'abonnement.
 *
 * Chaque tuile portait un emoji en grand format et son propre dégradé de
 * couleur (violet, vert, jaune, bleu) — quatre familles chromatiques pour
 * quatre chiffres. Les tuiles partagent désormais la même surface, et
 * l'information est portée par le texte.
 */
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

  const tuiles = [
    { label: "Profil complété", valeur: `${completion} %` },
    {
      label: "Compte",
      valeur: user.hasCompletedProfile ? "Validé" : "À compléter",
    },
    { label: "Offre", valeur: offre },
    {
      label: "Abonnement",
      valeur: subscriptionLabels[user.subscriptionStatus] || "Inactif",
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
    },
    {
      icone: Heart,
      label: "Intentions",
      valeur:
        (user.intentions || [])
          .map((item) => intentionLabels[item] || item)
          .join(", ") || "—",
    },
    {
      icone: Eye,
      label: "Visibilité",
      valeur: visibilityLabels[user.visibilite] || user.visibilite,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display [font-stretch:125%] text-[19px] font-bold text-cream">
          Bonjour {user.pseudonyme}
        </h2>
        <p className="mt-1 text-[13px] text-cream/60">
          Un aperçu de ton espace Sfera&apos;Solys.
        </p>
      </div>

      {/* Chiffres */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {tuiles.map((tuile, index) => (
          <motion.div
            key={tuile.label}
            custom={index}
            variants={variantesCarte}
            initial="hidden"
            animate="visible"
            className={`${carte} p-3.5`}
          >
            <p className="text-[11px] text-cream/55">{tuile.label}</p>
            <p className="mt-1 truncate text-[15px] font-bold text-cream">
              {tuile.valeur}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Complétion */}
      <section className={`${carte} p-4 sm:p-5`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[13px] font-semibold text-cream">
            Complétion du profil
          </p>
          <p className="text-[13px] font-bold text-cream">{completion} %</p>
        </div>

        <div
          className="h-2 overflow-hidden rounded-full bg-cream/10"
          role="presentation"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completion}%` }}
            transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
            className={`h-full rounded-full ${
              completion >= 100 ? "bg-lime" : "bg-orange"
            }`}
          />
        </div>

        {completion < 100 && (
          <p className="mt-2.5 text-[12px] leading-relaxed text-cream/60">
            Un profil rempli remonte plus souvent dans l’annuaire — et donne
            surtout à quelqu’un une raison d’écrire.{" "}
            <button
              type="button"
              onClick={() => onOnglet("profil")}
              className={`font-semibold text-cream underline underline-offset-2 hover:text-orange ${focusRing}`}
            >
              Compléter mon profil
            </button>
          </p>
        )}
      </section>

      {/* Informations */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {infos.map((info) => {
          const Icone = info.icone;

          return (
            <div key={info.label} className={`${carte} p-3.5`}>
              <p className="flex items-center gap-1.5 text-[11px] text-cream/55">
                <Icone size={11} aria-hidden="true" />
                {info.label}
              </p>
              <p className="mt-1 truncate text-[13px] font-medium text-cream/85">
                {info.valeur}
              </p>
            </div>
          );
        })}
      </div>

      {/* Abonnement */}
      <section
        className={`rounded-2xl border p-4 sm:p-5 ${
          payante ? "border-lime/25 bg-lime/[0.06]" : "border-cream/10 bg-[#0C222D]"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-display [font-stretch:125%] text-[15px] font-bold text-cream">
              {payante ? `Offre ${offre} active` : "Offre gratuite"}
            </p>

            <p className="mt-1 text-[13px] leading-relaxed text-cream/65">
              {payante
                ? "Tu profites des fonctionnalités incluses dans ton abonnement."
                : "La vérification, l’annuaire, l’Entraide et la messagerie sont déjà ouverts. Les offres payantes ajoutent le Circle, les boosts et le Mode Fantôme."}
            </p>
          </div>

          <Link
            href={payante ? "/mon-compte?tab=premium" : "/tarifs"}
            className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-orange px-4 py-2.5 text-[12px] font-bold text-abyss transition-colors hover:bg-orange/90 ${focusRing}`}
          >
            {payante ? "Gérer mon abonnement" : "Voir les offres"}
            <ChevronRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
