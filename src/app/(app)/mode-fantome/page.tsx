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
import Image from "next/image";
import Link from "next/link";
import EnteteEspace from "@/components/espace/EnteteEspace";
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
  Info,
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70 focus-visible:ring-offset-2 focus-visible:ring-offset-nuit";

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
      <div className="flex min-h-screen items-center justify-center bg-nuit">
        <Loader2 className="h-8 w-8 animate-spin text-cuivre" aria-hidden="true" />
        <span className="sr-only">Chargement</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nuit px-4 py-6 text-champagne sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-screen-2xl">
        <EnteteEspace
          className="mb-6"
          surtitre="Confidentialité et visibilité"
          titre="Qui peut voir ton profil&nbsp;?"
          sousTitre="Quatre options de visibilité, à ajuster librement sans perdre tes conversations."
        />

        {/*
          Panneau d'introduction.

          Voile mesuré sur `solys-06` dans la zone de texte : l'ivoire y
          tient 15,93:1, le champagne à 80 % 8,50 et le surtitre cuivré
          6,31. La photographie reste franche à droite, où rien n'est posé.
        */}
        <section className="relative isolate mb-5 overflow-hidden rounded-2xl border border-champagne/12">
          <Image
            src="/visuels/solys-06.webp"
            alt=""
            fill
            sizes="(max-width: 1280px) 100vw, 1460px"
            className="-z-10 object-cover object-center"
          />

          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(10,13,18,0.92)_0%,rgba(10,13,18,0.88)_45%,rgba(10,13,18,0.55)_70%,rgba(10,13,18,0.15)_100%)]"
          />

          <div className="p-6 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-surtitre text-cuivre/90">
              Visibilité et confidentialité
            </p>

            <h2 className="font-display mt-3.5 max-w-lg text-[24px] font-normal leading-tight text-ivoire sm:text-[30px]">
              Garde le contrôle de ta présence.
            </h2>

            <p className="mt-3.5 max-w-xl text-[13.5px] leading-relaxed text-champagne/85">
              Choisis qui peut découvrir ton profil. Tes messages et tes mises
              en relation restent accessibles, quel que soit ton réglage de
              visibilité.
            </p>

            <p className="mt-8 text-right text-[10.5px] text-champagne/70">
              Visuel de démonstration — aucun membre représenté
            </p>
          </div>
        </section>

        {/* Confirmation */}
        {confirmation && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-succes/25 bg-succes/10 px-4 py-3"
          >
            <Check
              size={16}
              className="mt-0.5 shrink-0 text-succes"
              aria-hidden="true"
            />
            <p className="flex-1 text-[13px] leading-relaxed text-champagne/85">
              {confirmation}
            </p>
            <button
              type="button"
              onClick={() => setConfirmation("")}
              aria-label="Fermer"
              className={`shrink-0 rounded-lg p-1 text-champagne/55 hover:text-champagne ${focusRing}`}
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Erreur */}
        {erreur && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-cuivre/30 bg-cuivre/10 px-4 py-3"
          >
            <AlertCircle
              size={16}
              className="mt-0.5 shrink-0 text-cuivre"
              aria-hidden="true"
            />
            <p className="flex-1 text-[13px] leading-relaxed text-champagne/85">
              {erreur}
            </p>
            <button
              type="button"
              onClick={() => setErreur("")}
              aria-label="Fermer"
              className={`shrink-0 rounded-lg p-1 text-champagne/55 hover:text-champagne ${focusRing}`}
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        )}

        {chargement ? (
          <div className="flex flex-col items-center gap-3 py-24">
            <Loader2
              className="h-7 w-7 animate-spin text-cuivre"
              aria-hidden="true"
            />
            <p className="text-[13px] text-champagne/55">
              Lecture de ton réglage actuel…
            </p>
          </div>
        ) : (
          <>
            <ul
              className="grid gap-4 lg:grid-cols-2"
              role="radiogroup"
              aria-label="Visibilité"
            >
              {NIVEAUX.map((niveau) => {
                const Icone = niveau.icone;
                const actif = visibilite === niveau.valeur;
                const verrouille = Boolean(niveau.premium) && !isPremium;
                const enCours = enregistrement === niveau.valeur;

                return (
                  <li key={niveau.valeur} className="h-full">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={actif}
                      disabled={verrouille || enregistrement !== null}
                      onClick={() => choisir(niveau)}
                      className={`flex h-full w-full flex-col rounded-2xl border p-5 text-left transition-colors sm:p-6 ${focusRing} ${
                        actif
                          ? "border-cuivre bg-cuivre/[0.07]"
                          : "border-champagne/12 bg-minuit/80 hover:border-cuivre/45"
                      } ${verrouille ? "cursor-not-allowed opacity-70" : ""} ${
                        enregistrement !== null && !enCours ? "opacity-60" : ""
                      }`}
                    >
                      {/*
                        La pastille de droite dit l'état, pas la couleur : vert
                        quand c'est le réglage en cours, cuivre quand c'est un
                        choix possible, cuivre aussi quand il demande une offre
                        — et elle porte alors le cadenas pour le distinguer.
                      */}
                      <span className="flex w-full items-start justify-between gap-4">
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-nuit/60 ${
                            actif
                              ? "border-cuivre text-cuivre"
                              : "border-cuivre/40 text-cuivre"
                          }`}
                        >
                          {enCours ? (
                            <Loader2
                              size={18}
                              className="animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <Icone size={18} aria-hidden="true" />
                          )}
                        </span>

                        {actif ? (
                          <span className="shrink-0 rounded-full border border-succes/45 bg-succes/12 px-3 py-1 text-[11.5px] font-semibold text-succes">
                            Actif
                          </span>
                        ) : verrouille ? (
                          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-cuivre/45 px-3 py-1 text-[11.5px] font-semibold text-cuivre">
                            <Lock size={11} aria-hidden="true" />
                            Premium
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full border border-cuivre/45 px-3 py-1 text-[11.5px] font-semibold text-cuivre">
                            Choisir
                          </span>
                        )}
                      </span>

                      <span className="font-display mt-5 block text-[20px] font-normal leading-snug text-ivoire">
                        {niveau.titre}
                      </span>

                      <span className="mt-2.5 block text-[13px] leading-relaxed text-champagne/85">
                        {niveau.resume}
                      </span>

                      {/*
                        La maquette s'arrête au résumé. Le détail est conservé
                        en dessous : il dit ce que le réglage fait vraiment —
                        et c'est précisément ce qui manquait quand la page
                        promettait des photos floutées qui n'existent pas.
                      */}
                      <span className="mt-2 block text-[12px] leading-relaxed text-champagne/65">
                        {niveau.detail}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {!isPremium && (
              <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-cuivre/35 bg-cuivre/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-3 text-[13px] leading-relaxed text-champagne/85">
                  <Info
                    size={16}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-cuivre"
                  />
                  Le Mode Fantôme est inclus dans les offres Premium et Elite.
                  Les trois autres réglages sont accessibles à tous.
                </p>

                <Link
                  href="/tarifs"
                  className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-degrade-cuivre px-5 py-3 text-[13px] font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
                >
                  Comparer les offres
                </Link>
              </div>
            )}

            {/* Ce que le mode ne fait pas */}
            <section className="mt-8 rounded-2xl border border-champagne/10 bg-minuit p-5 sm:p-6">
              <h2 className="font-display flex items-center gap-2 text-[15px] font-bold text-champagne">
                <EyeOff size={15} className="text-cuivre" aria-hidden="true" />
                Ce que ces réglages ne font pas
              </h2>

              <ul className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-champagne/70">
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
