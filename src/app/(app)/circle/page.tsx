// src/app/(app)/circle/page.tsx

"use client";

/**
 * Circle of Six.
 *
 * ## La promesse, et ce qu'elle était
 *
 * `/valeurs` : « Le Circle of Six propose six profils le lundi, puis
 * s'arrête. » `/fonctionnalites` : « Chaque semaine, notre algorithme te
 * présente 6 profils. » C'est la fonctionnalité signature du produit, celle qui
 * justifie qu'Explorer ne soit pas un fil infini.
 *
 * En réalité, `/api/circle` recalculait le score à chaque appel et renvoyait le
 * top 6 du moment. Rien n'était figé, et la page proposait même un bouton
 * **« Actualiser »** qui relançait le tirage — l'exact contraire de « puis
 * s'arrête ». Le champ `weekOf` s'affichait en « Semaine du … » sans que rien
 * ne soit lié à cette semaine.
 *
 * La sélection est désormais écrite une fois par semaine (`CircleWeek`), et
 * « Actualiser » est remplacé par ce qui manquait vraiment : le compte à rebours
 * jusqu'au prochain tirage.
 *
 * ## L'honnêteté des cas limites
 *
 * Deux situations donnent moins de six profils, et la page le dit plutôt que
 * d'afficher quatre cartes sans un mot :
 *
 * - le vivier était trop petit au moment du tirage — six profils ne sortent pas
 *   d'un vivier de trois ;
 * - un profil tiré est devenu indisponible depuis (compte fermé, passé en
 *   invisible). Il n'est **pas remplacé** : la semaine est la semaine.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  CalendarClock,
  Flag,
  Heart,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkle,
  UserRound,
  X,
} from "lucide-react";

import ReportModal from "@/components/ReportModal";
import { usePremium } from "@/hooks/usePremium";
import { getDepartementLabel } from "@/lib/locations";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ProfilCercle {
  _id: string;
  pseudonyme?: string;
  age?: number;
  localisation?: string;
  departement?: string;
  interets?: string[];
  intentions?: string[];
  image?: string;
  identityVerified?: boolean;
}

interface Semaine {
  debut: string;
  renouvellement: string;
  nouvelle: boolean;
  tires: number;
  disparus: number;
  vivier: number;
}

// ─────────────────────────────────────────────
// Libellés
// ─────────────────────────────────────────────

const INTENTIONS: Record<string, string> = {
  "rencontre-serieuse": "Rencontre sérieuse",
  amitie: "Amitié",
  aventure: "Aventure",
  reseautage: "Réseautage",
  discussion: "Discussion",
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss";

function formaterDate(valeur: string): string {
  const date = new Date(valeur);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
}

/** « 3 jours », « 5 heures », « 12 minutes » — l'unité la plus parlante. */
function delaiRestant(cible: string): string {
  const fin = new Date(cible).getTime();
  if (Number.isNaN(fin)) return "";

  const secondes = Math.max(0, Math.round((fin - Date.now()) / 1000));

  const jours = Math.floor(secondes / 86400);
  if (jours >= 1) return `${jours} jour${jours > 1 ? "s" : ""}`;

  const heures = Math.floor(secondes / 3600);
  if (heures >= 1) return `${heures} heure${heures > 1 ? "s" : ""}`;

  const minutes = Math.max(1, Math.floor(secondes / 60));
  return `${minutes} minute${minutes > 1 ? "s" : ""}`;
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function PageCircle() {
  const { status } = useSession();
  const router = useRouter();
  const { subscription } = usePremium();
  const reduireAnimations = useReducedMotion();

  const [profils, setProfils] = useState<ProfilCercle[]>([]);
  const [semaine, setSemaine] = useState<Semaine | null>(null);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [verrouille, setVerrouille] = useState(false);

  const [likeEnCours, setLikeEnCours] = useState<string | null>(null);
  const [aimes, setAimes] = useState<Set<string>>(new Set());
  const [likesRestants, setLikesRestants] = useState<number | null>(null);

  const [match, setMatch] = useState<{ nom: string; matchId: string } | null>(
    null
  );

  const [signale, setSignale] = useState<string | null>(null);

  /** Recalculé à l'affichage : un compte à rebours figé serait faux. */
  const [tic, setTic] = useState(0);

  useEffect(() => {
    const minuteur = window.setInterval(() => setTic((n) => n + 1), 60_000);
    return () => window.clearInterval(minuteur);
  }, []);

  useEffect(() => {
    const restants = subscription?.usage?.remainingSwipes;
    if (typeof restants === "number") setLikesRestants(restants);
  }, [subscription]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth?mode=login");
  }, [status, router]);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur("");
    setVerrouille(false);

    try {
      const reponse = await fetch("/api/circle", { cache: "no-store" });
      const donnees = await reponse.json().catch(() => null);

      if (donnees?.code === "CIRCLE_NOT_IN_PLAN") {
        setVerrouille(true);
        return;
      }

      if (!reponse.ok || donnees?.success !== true) {
        setErreur(donnees?.error || "Impossible de charger ton Circle.");
        return;
      }

      setProfils(donnees.profiles ?? []);
      setSemaine(donnees.semaine ?? null);
    } catch {
      setErreur("Connexion interrompue. Réessaie dans un instant.");
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") void charger();
  }, [status, charger]);

  const aimer = async (profil: ProfilCercle) => {
    if (likeEnCours || aimes.has(profil._id)) return;

    setLikeEnCours(profil._id);
    setErreur("");

    try {
      const reponse = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: profil._id }),
      });

      const donnees = await reponse.json().catch(() => null);

      if (donnees?.quota) setLikesRestants(donnees.quota.restants ?? null);

      if (!reponse.ok || donnees?.success !== true) {
        setErreur(donnees?.error || "Ce like n’a pas pu être envoyé.");
        return;
      }

      setAimes((actuels) => new Set(actuels).add(profil._id));

      // Le serveur peut répondre « en attente » : le like compte, pas la relation.
      if (donnees.enAttente && donnees.raison) {
        setErreur(donnees.raison);
        return;
      }

      if (donnees.matched && donnees.matchId) {
        setMatch({
          nom: profil.pseudonyme || "Ce membre",
          matchId: donnees.matchId,
        });
      }
    } catch {
      setErreur("Connexion interrompue pendant le like.");
    } finally {
      setLikeEnCours(null);
    }
  };

  const compteARebours = useMemo(() => {
    if (!semaine) return "";
    // `tic` force le recalcul chaque minute sans stocker de valeur périmée.
    void tic;
    return delaiRestant(semaine.renouvellement);
  }, [semaine, tic]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-abyss">
        <Loader2 className="h-8 w-8 animate-spin text-orange" aria-hidden="true" />
        <span className="sr-only">Chargement</span>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-abyss px-4 py-6 text-cream sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto max-w-4xl">
          {/* En-tête */}
          <header className="mb-5">
            <h1 className="font-display [font-stretch:125%] text-[26px] font-extrabold leading-tight tracking-tight text-cream sm:text-[32px]">
              Circle of Six
            </h1>

            <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-cream/60 sm:text-sm">
              Six profils choisis pour toi, une fois par semaine. Pas de
              nouvelle pioche avant lundi — c’est le principe, pas une limite.
            </p>
          </header>

          {/* Accès réservé */}
          {verrouille ? (
            <div className="rounded-2xl border border-cream/10 bg-[#123243] px-6 py-16 text-center">
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange/15">
                <Lock size={20} className="text-orange" aria-hidden="true" />
              </span>

              <h2 className="font-display [font-stretch:125%] text-[19px] font-bold text-cream">
                Le Circle fait partie des offres payantes
              </h2>

              <p className="mx-auto mt-2.5 max-w-md text-[13px] leading-relaxed text-cream/60">
                La vérification d’identité, le profil, l’annuaire et la messagerie
                restent accessibles dès l’offre gratuite. Le Circle of Six
                s’ouvre à partir de l’offre Essentiel.
              </p>

              <Link
                href="/tarifs"
                className={`mt-6 inline-flex items-center gap-2 rounded-xl bg-orange px-5 py-2.5 text-[13px] font-bold text-abyss transition-colors hover:bg-orange/90 ${focusRing}`}
              >
                Voir les offres
              </Link>

              <p className="mt-4 text-[12px] text-cream/55">
                <Link
                  href="/explorer"
                  className={`underline underline-offset-2 hover:text-orange ${focusRing}`}
                >
                  Ou parcourir l’annuaire
                </Link>
              </p>
            </div>
          ) : chargement ? (
            <div className="flex flex-col items-center gap-3 py-24">
              <Loader2
                className="h-7 w-7 animate-spin text-orange"
                aria-hidden="true"
              />
              <p className="text-[13px] text-cream/55">
                Préparation de ton Circle…
              </p>
            </div>
          ) : (
            <>
              {/* Bandeau de la semaine */}
              {semaine && (
                <section className="mb-5 rounded-2xl border border-cream/10 bg-[#123243] px-4 py-3.5 sm:px-5">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-cream/80">
                    <CalendarClock
                      size={14}
                      className="shrink-0 text-orange"
                      aria-hidden="true"
                    />
                    <strong className="font-bold text-cream">
                      Semaine du {formaterDate(semaine.debut)}
                    </strong>
                    <span className="text-cream/60">
                      · prochain tirage dans {compteARebours}
                    </span>
                  </p>

                  {semaine.nouvelle && (
                    <p className="mt-2 text-[12px] leading-relaxed text-cream/70">
                      Ta sélection vient d’être tirée. Elle ne bougera plus
                      jusqu’à lundi, même si tu recharges la page.
                    </p>
                  )}

                  {semaine.disparus > 0 && (
                    <p className="mt-2 text-[12px] leading-relaxed text-cream/70">
                      {semaine.disparus === 1
                        ? "Un profil de ta sélection n’est plus disponible."
                        : `${semaine.disparus} profils de ta sélection ne sont plus disponibles.`}{" "}
                      Ils ne sont pas remplacés : la semaine est la semaine.
                    </p>
                  )}

                  {semaine.tires < 6 && semaine.vivier < 6 && (
                    <p className="mt-2 text-[12px] leading-relaxed text-cream/70">
                      Ta sélection compte moins de six profils : il n’y avait pas
                      assez de membres correspondant à tes critères au moment du
                      tirage. Elle s’étoffera à mesure que la communauté grandit.
                    </p>
                  )}
                </section>
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
                    aria-label="Fermer le message"
                    className={`shrink-0 rounded-lg p-1 text-cream/55 hover:text-cream ${focusRing}`}
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </div>
              )}

              {/* Profils */}
              {profils.length === 0 ? (
                <div className="rounded-2xl border border-cream/10 bg-[#123243] px-6 py-16 text-center">
                  <Sparkle
                    size={24}
                    className="mx-auto mb-4 text-cream/60"
                    aria-hidden="true"
                  />

                  <h2 className="font-display [font-stretch:125%] text-[18px] font-bold text-cream">
                    Aucun profil cette semaine
                  </h2>

                  <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-cream/60">
                    La communauté est encore jeune, ou tu as déjà aimé tous les
                    profils qui te correspondaient. Le prochain tirage a lieu
                    dans {compteARebours}.
                  </p>

                  <Link
                    href="/explorer"
                    className={`mt-6 inline-flex items-center gap-2 rounded-xl border border-cream/15 px-5 py-2.5 text-[13px] font-semibold text-cream transition-colors hover:border-cream/30 ${focusRing}`}
                  >
                    Parcourir l’annuaire
                  </Link>
                </div>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {profils.map((profil, index) => (
                    <CarteCercle
                      key={profil._id}
                      profil={profil}
                      rang={index + 1}
                      aime={aimes.has(profil._id)}
                      likeEnCours={likeEnCours === profil._id}
                      likesEpuises={likesRestants === 0}
                      onAimer={() => aimer(profil)}
                      onSignaler={() => setSignale(profil._id)}
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      {/* Réciprocité */}
      <AnimatePresence>
        {match && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduireAnimations ? 0 : 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titre-match-circle"
          >
            <button
              type="button"
              onClick={() => setMatch(null)}
              aria-label="Fermer"
              className="absolute inset-0 cursor-default bg-abyss/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{
                opacity: 0,
                scale: reduireAnimations ? 1 : 0.94,
                y: reduireAnimations ? 0 : 16,
              }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: reduireAnimations ? 1 : 0.96 }}
              transition={{ duration: reduireAnimations ? 0 : 0.25 }}
              className="relative z-10 w-full max-w-sm rounded-[1.75rem] border border-lime/25 bg-[#123243] p-6 text-center sm:p-8"
            >
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-lime/15">
                <Heart size={22} className="fill-lime text-lime" aria-hidden="true" />
              </span>

              <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-lime">
                Réciproque
              </p>

              <h2
                id="titre-match-circle"
                className="font-display [font-stretch:125%] mt-2 text-[22px] font-extrabold leading-tight text-cream"
              >
                {match.nom} t&apos;a aussi aimé.
              </h2>

              <div className="mt-6 flex flex-col gap-2.5">
                <Link
                  href={`/messages/${match.matchId}`}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange px-5 py-3 text-[13px] font-bold text-abyss transition-colors hover:bg-orange/90 ${focusRing}`}
                >
                  <MessageCircle size={15} aria-hidden="true" />
                  Écrire maintenant
                </Link>

                <button
                  type="button"
                  onClick={() => setMatch(null)}
                  className={`inline-flex w-full items-center justify-center rounded-xl border border-cream/15 px-5 py-3 text-[13px] font-semibold text-cream/80 transition-colors hover:border-cream/30 hover:text-cream ${focusRing}`}
                >
                  Revenir au Circle
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ReportModal
        isOpen={signale !== null}
        targetId={signale ?? ""}
        targetType="user"
        onClose={() => setSignale(null)}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// Carte
// ─────────────────────────────────────────────

function CarteCercle({
  profil,
  rang,
  aime,
  likeEnCours,
  likesEpuises,
  onAimer,
  onSignaler,
}: {
  profil: ProfilCercle;
  rang: number;
  aime: boolean;
  likeEnCours: boolean;
  likesEpuises: boolean;
  onAimer: () => void;
  onSignaler: () => void;
}) {
  const nom = profil.pseudonyme || "Membre";

  const lieu = [profil.localisation, getDepartementLabel(profil.departement)]
    .filter(Boolean)
    .join(" · ");

  const intentions = (profil.intentions ?? []).slice(0, 2);

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-cream/10 bg-[#123243]">
      <div className="relative aspect-[4/5] bg-abyss">
        {profil.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profil.image}
            alt={`Photo de ${nom}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <UserRound size={30} className="text-cream/60" aria-hidden="true" />
          </div>
        )}

        <span className="absolute left-2.5 top-2.5 rounded-full bg-abyss/80 px-2.5 py-1 text-[11px] font-bold text-cream backdrop-blur-sm">
          {rang} / 6
        </span>

        <button
          type="button"
          onClick={onSignaler}
          aria-label={`Signaler ${nom}`}
          className={`absolute right-2.5 top-2.5 rounded-lg bg-abyss/70 p-2 text-cream/60 backdrop-blur-sm transition-colors hover:text-orange ${focusRing}`}
        >
          <Flag size={14} aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-display [font-stretch:125%] min-w-0 truncate text-[16px] font-bold text-cream">
            {nom}
            {profil.age ? `, ${profil.age}` : ""}
          </h2>

          {profil.identityVerified && (
            <span
              className="flex shrink-0 items-center gap-1 rounded-full bg-lime/15 px-2 py-0.5 text-[11px] font-bold text-lime"
              title="Identité vérifiée"
            >
              <ShieldCheck size={12} aria-hidden="true" />
              Vérifié
            </span>
          )}
        </div>

        {lieu && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-cream/55">
            <MapPin size={12} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{lieu}</span>
          </p>
        )}

        {intentions.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {intentions.map((intention) => (
              <li
                key={intention}
                className="rounded-full border border-cream/12 px-2.5 py-0.5 text-[11px] text-cream/70"
              >
                {INTENTIONS[intention] ?? intention}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-center gap-2 pt-4">
          <Link
            href={`/profil/${profil._id}?from=circle`}
            className={`flex-1 rounded-xl border border-cream/15 px-3 py-2.5 text-center text-[12px] font-bold text-cream transition-colors hover:border-cream/30 ${focusRing}`}
          >
            Voir le profil
          </Link>

          <button
            type="button"
            onClick={onAimer}
            disabled={aime || likeEnCours || likesEpuises}
            aria-label={aime ? `${nom} : déjà aimé` : `Aimer ${nom}`}
            title={
              likesEpuises && !aime ? "Tu as utilisé tes likes du jour." : undefined
            }
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors disabled:cursor-not-allowed ${focusRing} ${
              aime
                ? "bg-lime/15 text-lime"
                : "bg-orange text-abyss hover:bg-orange/90 disabled:opacity-40"
            }`}
          >
            {likeEnCours ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Heart size={16} className={aime ? "fill-lime" : ""} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </li>
  );
}
