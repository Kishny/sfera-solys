// src/app/(app)/mon-compte/_composants/OngletAbonnement.tsx

"use client";

import { useState } from "react";
import type { useRouter } from "next/navigation";
import { Check, Loader2, RefreshCw } from "lucide-react";

import {
  carte,
  focusRing,
  formaterDate,
  libelleOffre,
  offreActive,
  subscriptionLabels,
  type MembreSolys,
  type PlanSolys,
} from "./types";

/**
 * Onglet Abonnement.
 *
 * ## Le rafraîchissement qui n'en était pas
 *
 * Les actions Stripe appelaient `router.refresh()`, sans effet ici : la page
 * charge son profil **côté client**, et un rafraîchissement de route ne relance
 * pas ce `fetch`. Pause, annulation, réactivation et synchronisation
 * réussissaient, affichaient leur message de succès, et l'écran gardait
 * l'ancien état jusqu'à un rechargement manuel. `onRafraichir` relit
 * réellement le profil.
 *
 * ## Les moyens de paiement, retirés
 *
 * Un bloc listait « Carte bancaire · PayPal · Apple Pay · Google Pay » en
 * `<span>` statiques, sans aucun lien avec les méthodes réellement activées sur
 * le compte Stripe — une promesse d'interface que rien ne vérifiait (l'un des
 * libellés avait même perdu son emoji, laissant une espace orpheline). Remplacé
 * par ce qui est vrai : le paiement passe par Stripe, et les moyens disponibles
 * sont ceux que la page de paiement propose.
 */

/** Ce que chaque offre comprend réellement, après l'inventaire des drapeaux. */
const contenuParOffre: Record<PlanSolys, string[]> = {
  free: [
    "Profil public et vérification d’identité",
    "5 likes par jour",
    "10 messages par jour",
    "3 mises en relation maximum",
    "Annuaire, Entraide et Communauté",
  ],
  "essential-monthly": [
    "Likes et messages illimités",
    "Mises en relation illimitées",
    "Circle of Six hebdomadaire",
    "1 boost de visibilité par mois",
    "Inscription aux événements",
  ],
  "premium-monthly": [
    "Tout l’Essentiel",
    "3 boosts de visibilité par mois",
    "Mode Fantôme",
    "Visiteurs de ton profil",
    "Filtres avancés de l’annuaire",
  ],
  "elite-monthly": [
    "Tout le Premium",
    "10 boosts de visibilité par mois",
    "Badge Elite",
  ],
};

/**
 * Synchronisation manuelle avec Stripe.
 *
 * Sert quand un paiement a été effectué mais que le webhook n'a pas encore
 * mis le compte à jour — ou ne l'a jamais fait.
 */
function BoutonSynchroniser({ onSucces }: { onSucces: () => void }) {
  const [enCours, setEnCours] = useState(false);
  const [resultat, setResultat] = useState<string | null>(null);

  const synchroniser = async () => {
    setEnCours(true);
    setResultat(null);

    try {
      const reponse = await fetch("/api/stripe/sync", { method: "POST" });
      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || donnees?.success === false) {
        setResultat(donnees?.error ?? "La synchronisation a échoué.");
        return;
      }

      setResultat(
        donnees?.isPremium
          ? "Abonnement activé."
          : (donnees?.message ?? "Synchronisé.")
      );

      if (donnees?.isPremium) window.setTimeout(onSucces, 1200);
    } catch {
      setResultat("Connexion interrompue.");
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={synchroniser}
        disabled={enCours}
        className={`inline-flex items-center gap-2 rounded-xl border border-cream/15 px-4 py-2.5 text-[12px] font-semibold text-cream transition-colors hover:border-cream/30 disabled:opacity-50 ${focusRing}`}
      >
        {enCours ? (
          <Loader2 size={13} className="animate-spin" aria-hidden="true" />
        ) : (
          <RefreshCw size={13} aria-hidden="true" />
        )}
        Synchroniser avec Stripe
      </button>

      {resultat && (
        <p className="mt-2 text-[12px] text-cream/70" role="status">
          {resultat}
        </p>
      )}
    </div>
  );
}

export default function OngletAbonnement({
  user,
  router,
  onRafraichir,
}: {
  user: MembreSolys;
  router: ReturnType<typeof useRouter>;
  onRafraichir: () => void;
}) {
  const payante = offreActive(user);
  const offre = libelleOffre(user);
  const offrePayanteChoisie = user.plan !== "free";

  const [action, setAction] = useState<string | null>(null);
  const [message, setMessage] = useState<{ texte: string; ok: boolean } | null>(
    null
  );

  const actionStripe = async (url: string, cle: string) => {
    setAction(cle);
    setMessage(null);

    try {
      const reponse = await fetch(url, { method: "POST" });
      const donnees = await reponse.json().catch(() => null);

      if (reponse.ok && donnees?.success) {
        setMessage({ texte: donnees.message ?? "Opération réussie.", ok: true });
        // Relecture réelle du profil, pas un router.refresh() sans effet.
        window.setTimeout(onRafraichir, 1200);
      } else {
        setMessage({
          texte: donnees?.error ?? "Cette action n’a pas abouti.",
          ok: false,
        });
      }
    } catch {
      setMessage({ texte: "Connexion interrompue.", ok: false });
    } finally {
      setAction(null);
    }
  };

  const etat = user.subscriptionPaused
    ? "En pause"
    : user.subscriptionCancelAtPeriodEnd
      ? "Annulation programmée"
      : subscriptionLabels[user.subscriptionStatus] || "—";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display [font-stretch:125%] text-[19px] font-bold text-cream">
          Mon abonnement
        </h2>
        <p className="mt-1 text-[13px] text-cream/60">
          Ton offre, son état, et ce qu’elle comprend.
        </p>
      </div>

      {/* État */}
      <section
        className={`rounded-2xl border p-4 sm:p-5 ${
          payante &&
          !user.subscriptionCancelAtPeriodEnd &&
          !user.subscriptionPaused
            ? "border-lime/25 bg-lime/[0.06]"
            : "border-cream/10 bg-[#123243]"
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-display [font-stretch:125%] text-[17px] font-bold text-cream">
              Offre {offre}
            </h3>
            <p className="mt-0.5 text-[13px] text-cream/60">{etat}</p>
          </div>

          {payante &&
            !user.subscriptionCancelAtPeriodEnd &&
            !user.subscriptionPaused && (
              <span className="flex items-center gap-1 rounded-full bg-lime/15 px-2.5 py-1 text-[11px] font-bold text-lime">
                <Check size={12} aria-hidden="true" />
                Actif
              </span>
            )}
        </div>

        {/* Alertes */}
        {user.subscriptionCancelAtPeriodEnd && user.premiumExpiresAt && (
          <p className="mt-4 rounded-xl border border-orange/30 bg-orange/10 px-3.5 py-2.5 text-[13px] leading-relaxed text-cream/85">
            Ton abonnement se termine le{" "}
            <strong className="text-cream">
              {formaterDate(user.premiumExpiresAt)}
            </strong>
            . Tu gardes l’accès jusqu’à cette date.
          </p>
        )}

        {user.subscriptionPaused && (
          <p className="mt-4 rounded-xl border border-cream/12 px-3.5 py-2.5 text-[13px] leading-relaxed text-cream/80">
            Abonnement en pause — aucun prélèvement ce mois-ci. Tu peux
            réactiver à tout moment.
          </p>
        )}

        {!payante &&
          offrePayanteChoisie &&
          !user.subscriptionCancelAtPeriodEnd && (
            <p className="mt-4 rounded-xl border border-orange/30 bg-orange/10 px-3.5 py-2.5 text-[13px] leading-relaxed text-cream/85">
              Offre sélectionnée, accès non activé. C’est Stripe qui confirme le
              paiement, par webhook. Si tu as payé, utilise « Synchroniser »
              ci-dessous.
            </p>
          )}

        {/* Dates */}
        <div className="mt-4 space-y-1 text-[13px] text-cream/70">
          {user.premiumStartedAt && (
            <p>Abonné depuis le {formaterDate(user.premiumStartedAt)}</p>
          )}
          {user.lastPaymentAt && (
            <p>Dernier paiement le {formaterDate(user.lastPaymentAt)}</p>
          )}
          {user.premiumExpiresAt &&
            payante &&
            !user.subscriptionCancelAtPeriodEnd && (
              <p>
                Prochain renouvellement le {formaterDate(user.premiumExpiresAt)}
              </p>
            )}
        </div>

        {message && (
          <p
            className={`mt-4 rounded-xl px-3.5 py-2.5 text-[13px] ${
              message.ok
                ? "border border-lime/25 bg-lime/10 text-cream/85"
                : "border border-orange/30 bg-orange/10 text-cream/85"
            }`}
            role="status"
          >
            {message.texte}
          </p>
        )}

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2.5">
          {!payante && !user.subscriptionCancelAtPeriodEnd && (
            <button
              type="button"
              onClick={() => router.push("/paiement")}
              className={`rounded-xl bg-orange px-4 py-2.5 text-[12px] font-bold text-abyss transition-colors hover:bg-orange/90 ${focusRing}`}
            >
              Choisir une offre
            </button>
          )}

          {payante &&
            !user.subscriptionCancelAtPeriodEnd &&
            !user.subscriptionPaused && (
              <>
                <button
                  type="button"
                  onClick={() => router.push("/paiement")}
                  className={`rounded-xl bg-orange px-4 py-2.5 text-[12px] font-bold text-abyss transition-colors hover:bg-orange/90 ${focusRing}`}
                >
                  Changer d’offre
                </button>

                <button
                  type="button"
                  disabled={action === "pause"}
                  onClick={() => actionStripe("/api/stripe/pause", "pause")}
                  className={`rounded-xl border border-cream/15 px-4 py-2.5 text-[12px] font-semibold text-cream/80 transition-colors hover:border-cream/30 hover:text-cream disabled:opacity-50 ${focusRing}`}
                >
                  {action === "pause" ? "Mise en pause…" : "Mettre en pause"}
                </button>

                <button
                  type="button"
                  disabled={action === "cancel"}
                  onClick={() => actionStripe("/api/stripe/cancel", "cancel")}
                  className={`rounded-xl border border-orange/30 px-4 py-2.5 text-[12px] font-semibold text-cream transition-colors hover:bg-orange/10 disabled:opacity-50 ${focusRing}`}
                >
                  {action === "cancel" ? "Annulation…" : "Annuler l’abonnement"}
                </button>
              </>
            )}

          {(user.subscriptionCancelAtPeriodEnd || user.subscriptionPaused) && (
            <button
              type="button"
              disabled={action === "reactivate"}
              onClick={() =>
                actionStripe("/api/stripe/reactivate", "reactivate")
              }
              className={`rounded-xl bg-orange px-4 py-2.5 text-[12px] font-bold text-abyss transition-colors hover:bg-orange/90 disabled:opacity-50 ${focusRing}`}
            >
              {action === "reactivate"
                ? "Réactivation…"
                : "Réactiver l’abonnement"}
            </button>
          )}

          {!payante &&
            offrePayanteChoisie &&
            !user.subscriptionCancelAtPeriodEnd && (
              <BoutonSynchroniser onSucces={onRafraichir} />
            )}
        </div>
      </section>

      {/* Contenu de l'offre */}
      <section className={`${carte} p-4 sm:p-5`}>
        <p className="mb-3 text-[13px] font-semibold text-cream">
          Ce que comprend ton offre
        </p>

        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(contenuParOffre[user.plan] || contenuParOffre.free).map((ligne) => (
            <li
              key={ligne}
              className="flex items-start gap-2 rounded-xl border border-cream/10 px-3.5 py-2.5 text-[13px] text-cream/80"
            >
              <Check
                size={13}
                className="mt-0.5 shrink-0 text-lime"
                aria-hidden="true"
              />
              {ligne}
            </li>
          ))}
        </ul>
      </section>

      {/* Paiement */}
      <section className={`${carte} p-4 sm:p-5`}>
        <p className="text-[13px] font-semibold text-cream">Paiement</p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-cream/60">
          Les paiements passent par Stripe. Les moyens disponibles sont ceux que
          la page de paiement propose — Sfera&apos;Solys ne stocke aucune donnée
          bancaire et n&apos;en voit jamais.
        </p>
      </section>
    </div>
  );
}
