// src/app/(app)/mode-fantome/page.tsx

"use client";

/**
 * Visibilité et Mode Fantôme.
 *
 * ## Ce que le Mode Fantôme est, et ce qu'on en disait
 *
 * Bonne surprise : la fonctionnalité est **réelle**. Passer en `invisible`
 * exige la feature `ghostMode` côté serveur (`/api/users/profile`), le profil
 * sort de l'annuaire et du Circle, et `/api/visitors` refuse d'enregistrer la
 * visite d'un membre invisible — donc la navigation ne laisse effectivement pas
 * de trace.
 *
 * Ce qui était faux, c'était la publicité. Cinq pages promettaient des
 * **« photos floutées »** et un dévoilement « quand et à qui tu décides » :
 * aucun floutage n'existe nulle part dans le code, et aucun état de
 * dévoilement par personne non plus. Décision : corriger la copy plutôt que
 * construire une fonctionnalité qu'on n'aurait pas pu tester (les clés
 * Cloudinary sont encore vides). `/fonctionnalites`, `/guide`, `/faq` et
 * l'accueil décrivent désormais ce que le mode fait vraiment.
 *
 * ## Les quatre niveaux, enfin accessibles
 *
 * Le modèle `User` porte quatre visibilités — `public`, `matches`, `premium`,
 * `invisible` — et l'API les accepte toutes. **La page n'en proposait que
 * deux** (public ↔ invisible) : « réservé à mes mises en relation » et
 * « réservé aux membres payants » n'étaient réglables nulle part.
 *
 * Ça devenait gênant depuis que `/api/profiles/[id]` applique réellement la
 * visibilité « mes matchs » : un réglage appliqué mais impossible à choisir. Les
 * quatre sont ici, et seul `invisible` demande une offre Premium.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  EyeOff,
  Ghost,
  Globe,
  Heart,
  Loader2,
  Lock,
  Sparkle,
  X,
} from "lucide-react";

import { usePremium } from "@/hooks/usePremium";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type Visibilite = "public" | "matches" | "premium" | "invisible";

interface Niveau {
  valeur: Visibilite;
  titre: string;
  resume: string;
  detail: string;
  icone: React.ComponentType<{ size?: number | string; className?: string }>;
  /** Réservé aux offres qui incluent le Mode Fantôme. */
  premium?: boolean;
}

const NIVEAUX: Niveau[] = [
  {
    valeur: "public",
    titre: "Visible par tous",
    resume: "Ton profil apparaît dans l’annuaire et dans les Circle.",
    detail:
      "Le réglage par défaut. Tous les membres vérifiés peuvent te trouver, quelle que soit leur offre.",
    icone: Globe,
  },
  {
    valeur: "premium",
    titre: "Visible par les offres payantes",
    resume: "Seuls les membres abonnés voient ton profil.",
    detail:
      "Tu restes dans l’annuaire, mais uniquement pour les membres d’une offre payante. Une façon de réduire le volume sans disparaître.",
    icone: Sparkle,
  },
  {
    valeur: "matches",
    titre: "Réservé à tes mises en relation",
    resume: "Seuls tes matchs peuvent ouvrir ton profil.",
    detail:
      "Tu sors de l’annuaire et des Circle, et même avec le lien direct, personne ne peut consulter ton profil sans être déjà en relation avec toi.",
    icone: Heart,
  },
  {
    valeur: "invisible",
    titre: "Mode Fantôme",
    resume: "Tu disparais, sans rien perdre.",
    detail:
      "Ton profil sort de l’annuaire et des Circle, et tu consultes les autres profils sans laisser de trace dans leurs visiteurs. Tes conversations et tes mises en relation restent intactes.",
    icone: Ghost,
    premium: true,
  },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss";

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function PageVisibilite() {
  const { status } = useSession();
  const router = useRouter();
  const { isPremium, isLoading: chargementOffre } = usePremium();

  const [visibilite, setVisibilite] = useState<Visibilite | null>(null);
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState<Visibilite | null>(null);

  const [erreur, setErreur] = useState("");
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth?mode=login");
  }, [status, router]);

  const lireProfil = useCallback(async () => {
    setChargement(true);

    try {
      const reponse = await fetch("/api/users/profile", { cache: "no-store" });
      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || donnees?.success !== true) {
        setErreur(donnees?.error || "Impossible de lire ton profil.");
        return;
      }

      setVisibilite((donnees.user?.visibilite as Visibilite) ?? "public");
    } catch {
      setErreur("Connexion interrompue.");
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") void lireProfil();
  }, [status, lireProfil]);

  const choisir = async (niveau: Niveau) => {
    if (enregistrement || visibilite === niveau.valeur) return;

    setEnregistrement(niveau.valeur);
    setErreur("");
    setConfirmation("");

    try {
      const reponse = await fetch("/api/users/profile", {
        // La route expose PUT, pas PATCH.
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibilite: niveau.valeur }),
      });

      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || donnees?.success !== true) {
        setErreur(
          donnees?.error ||
            "Ce réglage n’a pas pu être enregistré. Réessaie dans un instant."
        );
        return;
      }

      setVisibilite(niveau.valeur);
      setConfirmation(
        niveau.valeur === "invisible"
          ? "Mode Fantôme activé. Tu n’apparais plus nulle part."
          : `Réglage enregistré : ${niveau.titre.toLowerCase()}.`
      );
    } catch {
      setErreur("Connexion interrompue. Le réglage n’a pas été enregistré.");
    } finally {
      setEnregistrement(null);
    }
  };

  if (status === "loading" || chargementOffre) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-abyss">
        <Loader2 className="h-8 w-8 animate-spin text-orange" aria-hidden="true" />
        <span className="sr-only">Chargement</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-abyss px-4 py-6 text-cream sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <h1 className="font-display [font-stretch:125%] text-[26px] font-extrabold leading-tight tracking-tight text-cream sm:text-[32px]">
            Qui te voit
          </h1>

          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-cream/60 sm:text-sm">
            Quatre réglages, modifiables à tout moment. Aucun ne touche à tes
            conversations en cours : quoi que tu choisisses, tu ne perds aucun
            échange.
          </p>
        </header>

        {/* Confirmation */}
        {confirmation && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-lime/25 bg-lime/10 px-4 py-3"
          >
            <Check
              size={16}
              className="mt-0.5 shrink-0 text-lime"
              aria-hidden="true"
            />
            <p className="flex-1 text-[13px] leading-relaxed text-cream/85">
              {confirmation}
            </p>
            <button
              type="button"
              onClick={() => setConfirmation("")}
              aria-label="Fermer"
              className={`shrink-0 rounded-lg p-1 text-cream/55 hover:text-cream ${focusRing}`}
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Erreur */}
        {erreur && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-orange/30 bg-orange/10 px-4 py-3"
          >
            <AlertCircle
              size={16}
              className="mt-0.5 shrink-0 text-orange"
              aria-hidden="true"
            />
            <p className="flex-1 text-[13px] leading-relaxed text-cream/85">
              {erreur}
            </p>
            <button
              type="button"
              onClick={() => setErreur("")}
              aria-label="Fermer"
              className={`shrink-0 rounded-lg p-1 text-cream/55 hover:text-cream ${focusRing}`}
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        )}

        {chargement ? (
          <div className="flex flex-col items-center gap-3 py-24">
            <Loader2
              className="h-7 w-7 animate-spin text-orange"
              aria-hidden="true"
            />
            <p className="text-[13px] text-cream/55">
              Lecture de ton réglage actuel…
            </p>
          </div>
        ) : (
          <>
            <ul className="space-y-3" role="radiogroup" aria-label="Visibilité">
              {NIVEAUX.map((niveau) => {
                const Icone = niveau.icone;
                const actif = visibilite === niveau.valeur;
                const verrouille = Boolean(niveau.premium) && !isPremium;
                const enCours = enregistrement === niveau.valeur;

                return (
                  <li key={niveau.valeur}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={actif}
                      disabled={verrouille || enregistrement !== null}
                      onClick={() => choisir(niveau)}
                      className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-colors sm:p-5 ${focusRing} ${
                        actif
                          ? "border-orange bg-orange/[0.08]"
                          : "border-cream/10 bg-[#123243] hover:border-cream/25"
                      } ${verrouille ? "cursor-not-allowed opacity-60" : ""} ${
                        enregistrement !== null && !enCours ? "opacity-60" : ""
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          actif ? "bg-orange text-abyss" : "bg-cream/[0.06] text-cream/70"
                        }`}
                      >
                        {enCours ? (
                          <Loader2
                            size={17}
                            className="animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Icone size={17} aria-hidden="true" />
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-display [font-stretch:125%] text-[15px] font-bold text-cream">
                            {niveau.titre}
                          </span>

                          {actif && (
                            <span className="rounded-full bg-orange px-2 py-0.5 text-[11px] font-bold text-abyss">
                              Actif
                            </span>
                          )}

                          {verrouille && (
                            <span className="flex items-center gap-1 rounded-full border border-cream/15 px-2 py-0.5 text-[11px] font-semibold text-cream/70">
                              <Lock size={10} aria-hidden="true" />
                              Premium
                            </span>
                          )}
                        </span>

                        <span className="mt-1 block text-[13px] font-semibold text-cream/80">
                          {niveau.resume}
                        </span>

                        <span className="mt-1.5 block text-[12px] leading-relaxed text-cream/60">
                          {niveau.detail}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {!isPremium && (
              <p className="mt-5 text-[12px] leading-relaxed text-cream/60">
                Le Mode Fantôme fait partie des offres Premium et Elite.{" "}
                <Link
                  href="/tarifs"
                  className={`font-semibold text-cream underline underline-offset-2 hover:text-orange ${focusRing}`}
                >
                  Voir les offres
                </Link>
                . Les trois autres réglages sont accessibles à tous.
              </p>
            )}

            {/* Ce que le mode ne fait pas */}
            <section className="mt-8 rounded-2xl border border-cream/10 bg-[#123243] p-5 sm:p-6">
              <h2 className="font-display [font-stretch:125%] flex items-center gap-2 text-[15px] font-bold text-cream">
                <EyeOff size={15} className="text-orange" aria-hidden="true" />
                Ce que ces réglages ne font pas
              </h2>

              <ul className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-cream/70">
                <li>
                  Ils ne floutent pas tes photos. Une photo que tu as publiée
                  reste telle quelle pour ceux qui peuvent voir ton profil.
                </li>
                <li>
                  Ils ne touchent pas à tes conversations : tes mises en relation
                  restent ouvertes et tes messages arrivent normalement, quel que
                  soit le réglage.
                </li>
                <li>
                  Ils ne dispensent pas de la vérification d’identité, qui reste
                  obligatoire. Ton document part chez Stripe et n’apparaît jamais
                  sur le site.
                </li>
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
