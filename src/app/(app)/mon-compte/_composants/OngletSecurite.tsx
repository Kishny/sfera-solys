// src/app/(app)/mon-compte/_composants/OngletSecurite.tsx

"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  carte,
  champ,
  focusRing,
  formaterDate,
  variantesCarte,
  type MembreSolys,
} from "./types";

/**
 * Onglet Sécurité.
 *
 * Contient la vérification d'identité (Stripe Identity) et la suppression
 * définitive du compte.
 */

/**
 * Vérification d'identité via Stripe Identity.
 *
 * La route renvoie une URL de session Stripe ; on y envoie le visiteur. Sans
 * clés Stripe configurées, l'appel échoue et le message d'erreur le dit —
 * plutôt qu'un bouton qui semble marcher et ne fait rien.
 */
function BlocVerificationIdentite({ user }: { user: MembreSolys }) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  const verifier = async () => {
    setEnCours(true);
    setErreur("");

    try {
      const reponse = await fetch("/api/identity-verification", {
        method: "POST",
      });

      const donnees = await reponse.json().catch(() => null);

      if (donnees?.url) {
        window.location.href = donnees.url;
        return;
      }

      setErreur(donnees?.error || "La vérification n’a pas pu démarrer.");
    } catch {
      setErreur("Connexion interrompue.");
    } finally {
      setEnCours(false);
    }
  };

  const etat = user.identityVerificationStatus || "unverified";

  return (
    <section
      className={`rounded-2xl border p-4 sm:p-5 ${
        user.identityVerified
          ? "border-lime/25 bg-lime/[0.06]"
          : "border-orange/25 bg-orange/[0.06]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <BadgeCheck
          size={17}
          className={user.identityVerified ? "text-lime" : "text-orange"}
          aria-hidden="true"
        />

        <h3 className="font-display [font-stretch:125%] text-[15px] font-bold text-cream">
          Vérification d’identité
        </h3>

        {user.identityVerified && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-lime/15 px-2.5 py-1 text-[11px] font-bold text-lime">
            <CheckCircle2 size={12} aria-hidden="true" />
            Vérifiée
          </span>
        )}
      </div>

      <p className="mt-2 text-[13px] leading-relaxed text-cream/70">
        Une pièce d’identité officielle, vérifiée par Stripe. C’est ce qui
        donne le badge « Profil vérifié » — et ce qui fait que les membres d’en
        face sont de vraies personnes.
      </p>

      {etat === "pending" && (
        <p className="mt-3 text-[13px] text-cream/75" role="status">
          Vérification en cours — Stripe nous prévient dès qu’elle aboutit.
        </p>
      )}

      {etat === "failed" && (
        <p className="mt-3 text-[13px] text-cream/85" role="status">
          La vérification n’a pas abouti. Tu peux recommencer.
        </p>
      )}

      {!user.identityVerified && etat !== "pending" && (
        <button
          type="button"
          onClick={verifier}
          disabled={enCours}
          className={`mt-4 inline-flex items-center gap-2 rounded-xl bg-orange px-4 py-2.5 text-[12px] font-bold text-abyss transition-colors hover:bg-orange/90 disabled:opacity-50 ${focusRing}`}
        >
          {enCours && (
            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
          )}
          {enCours ? "Ouverture…" : "Vérifier mon identité"}
        </button>
      )}

      {erreur && (
        <p className="mt-3 text-[13px] text-cream/85" role="alert">
          {erreur}
        </p>
      )}
    </section>
  );
}

/**
 * Suppression définitive du compte.
 *
 * `DELETE /api/users/me` existait depuis le début, complet — il annule
 * l'abonnement Stripe, supprime les photos Cloudinary, toutes les données
 * liées, puis le compte — et **aucune interface ne l'appelait**.
 *
 * Ce n'est pas un détail : la politique de confidentialité affirme que « la
 * plupart de ces actions se font directement depuis ton espace Mon Compte ».
 * Sans ce bouton, le droit à l'effacement était annoncé et introuvable.
 *
 * Confirmation en deux temps, sans boîte de dialogue native : on clique, le
 * bloc demande d'écrire « SUPPRIMER ». Une action irréversible mérite un geste
 * délibéré, pas un clic de plus.
 */
function SuppressionCompte() {
  const [ouvert, setOuvert] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  const supprimer = async () => {
    if (confirmation.trim().toUpperCase() !== "SUPPRIMER" || enCours) return;

    setEnCours(true);
    setErreur("");

    try {
      const reponse = await fetch("/api/users/me", { method: "DELETE" });
      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || donnees?.success === false) {
        setErreur(
          donnees?.error ??
            "La suppression n’a pas abouti. Réessaie ou écris-nous."
        );
        return;
      }

      // Le compte n'existe plus : on ferme la session et on quitte le site.
      await signOut({ redirect: false });
      window.location.href = "/";
    } catch {
      setErreur("Connexion interrompue. Ton compte n’a pas été supprimé.");
    } finally {
      setEnCours(false);
    }
  };

  return (
    <section className="rounded-2xl border border-rust/40 bg-rust/[0.12] p-4 sm:p-5">
      <p className="text-[14px] font-semibold text-cream">
        Supprimer mon compte
      </p>

      <p className="mt-1.5 text-[13px] leading-relaxed text-cream/70">
        Ton profil, tes photos, tes mises en relation et tes messages sont
        effacés définitivement. Un abonnement en cours est résilié chez Stripe.
        Cette action ne peut pas être annulée.
      </p>

      {!ouvert ? (
        <button
          type="button"
          onClick={() => setOuvert(true)}
          className={`mt-4 rounded-xl border border-cream/20 px-4 py-2.5 text-[12px] font-semibold text-cream transition-colors hover:border-cream/40 ${focusRing}`}
        >
          Supprimer mon compte
        </button>
      ) : (
        <div className="mt-4">
          <label
            htmlFor="confirmation-suppression"
            className="mb-2 block text-[13px] text-cream/75"
          >
            Écris <strong className="text-cream">SUPPRIMER</strong> pour
            confirmer.
          </label>

          <input
            id="confirmation-suppression"
            type="text"
            value={confirmation}
            onChange={(evenement) => setConfirmation(evenement.target.value)}
            autoComplete="off"
            className={champ}
          />

          {erreur && (
            <p className="mt-3 text-[13px] text-cream/85" role="alert">
              {erreur}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={supprimer}
              disabled={
                enCours || confirmation.trim().toUpperCase() !== "SUPPRIMER"
              }
              className={`rounded-xl border border-cream/25 bg-rust px-4 py-2.5 text-[12px] font-bold text-cream transition-colors hover:bg-rust/80 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
            >
              {enCours ? "Suppression…" : "Supprimer définitivement"}
            </button>

            <button
              type="button"
              onClick={() => {
                setOuvert(false);
                setConfirmation("");
                setErreur("");
              }}
              disabled={enCours}
              className={`rounded-xl border border-cream/15 px-4 py-2.5 text-[12px] font-semibold text-cream/80 transition-colors hover:border-cream/30 disabled:opacity-50 ${focusRing}`}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default function OngletSecurite({ user }: { user: MembreSolys }) {
  const verifications = [
    { ok: !!user.email, label: "Adresse email enregistrée" },
    {
      /**
       * `provider === "google"` cochait cette ligne même sans question
       * enregistrée : l'indicateur affichait une sécurité qui n'existait pas.
       * Seule la présence réelle d'une question et d'une réponse compte.
       */
      ok: !!user.question && user.hasReponse === true,
      label: "Question de sécurité définie",
    },
    ...(user.provider === "google"
      ? [{ ok: true, label: "Connexion Google sécurisée (OAuth)" }]
      : []),
    { ok: user.identityVerified === true, label: "Identité vérifiée" },
    { ok: user.hasCompletedProfile, label: "Profil complété" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display [font-stretch:125%] text-[19px] font-bold text-cream">
          Sécurité du compte
        </h2>
        <p className="mt-1 text-[13px] text-cream/60">
          Ce qui protège ton compte, et ce qui manque encore.
        </p>
      </div>

      <ul className="space-y-2">
        {verifications.map((verification, index) => (
          <motion.li
            key={verification.label}
            custom={index}
            variants={variantesCarte}
            initial="hidden"
            animate="visible"
            className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-[13px] ${
              verification.ok
                ? "border-lime/20 bg-lime/[0.05] text-cream"
                : "border-cream/10 text-cream/60"
            }`}
          >
            {verification.ok ? (
              <CheckCircle2
                size={15}
                className="shrink-0 text-lime"
                aria-hidden="true"
              />
            ) : (
              <X size={15} className="shrink-0 text-cream/35" aria-hidden="true" />
            )}
            {verification.label}
          </motion.li>
        ))}
      </ul>

      <section className={`${carte} p-4 sm:p-5`}>
        <dl className="space-y-3 text-[13px]">
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-cream/45">
              Méthode de connexion
            </dt>
            <dd className="mt-0.5 font-semibold capitalize text-cream">
              {user.provider === "google" ? "Google" : "Email et mot de passe"}
            </dd>
          </div>

          <div>
            <dt className="text-[11px] uppercase tracking-wide text-cream/45">
              Membre depuis
            </dt>
            <dd className="mt-0.5 font-semibold text-cream">
              {formaterDate(user.createdAt)}
            </dd>
          </div>

          {user.lastLoginAt && (
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-cream/45">
                Dernière connexion
              </dt>
              <dd className="mt-0.5 font-semibold text-cream">
                {formaterDate(user.lastLoginAt)}
              </dd>
            </div>
          )}
        </dl>
      </section>

      <BlocVerificationIdentite user={user} />

      {user.provider !== "google" && (
        <p className="flex items-start gap-2.5 rounded-xl border border-cream/10 px-3.5 py-3 text-[13px] leading-relaxed text-cream/70">
          <ShieldCheck
            size={15}
            className="mt-0.5 shrink-0 text-lime"
            aria-hidden="true"
          />
          Ton mot de passe est stocké sous forme de condensat chiffré (bcrypt),
          jamais en clair — personne ne peut le lire, pas même nous.
        </p>
      )}

      <SuppressionCompte />
    </div>
  );
}
