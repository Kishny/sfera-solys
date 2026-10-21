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
import EnteteEspace from "@/components/espace/EnteteEspace";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  Crown,
  Flag,
  Heart,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkle,
  Sparkles,
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70 focus-visible:ring-offset-2 focus-visible:ring-offset-nuit";

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
      <div className="flex min-h-screen items-center justify-center bg-nuit">
        <Loader2 className="h-8 w-8 animate-spin text-cuivre" aria-hidden="true" />
        <span className="sr-only">Chargement</span>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-nuit px-4 py-6 text-champagne sm:px-6 sm:py-8 lg:px-10">
        <div className="mx-auto max-w-screen-2xl">
          <EnteteEspace
            className="mb-6"
            surtitre={verrouille ? "Aperçu de la fonctionnalité" : "Cercle & communauté"}
            titre="Circle of Six"
            sousTitre="Six profils choisis pour toi, une fois par semaine. Pas de défilement infini."
            action={{
              libelle: "Accès dès Essentiel",
              icone: Crown,
              ton: "cuivre",
              href: verrouille ? "/tarifs" : undefined,
            }}
          />

          {/*
            Aperçu, pour qui n'a pas encore l'accès.

            L'ancienne version tenait en un cadre centré : un cadenas, deux
            phrases, un bouton. La maquette en fait une présentation de la
            fonctionnalité — ce qu'elle est, ce qu'elle donne, comment elle
            marche — parce que c'est l'écran où quelqu'un décide de payer ou
            non. Le contenu factuel ne change pas : le Circle s'ouvre dès
            l'offre Essentiel, le reste est déjà accessible.

            Voile mesuré sur `solys-08` dans la zone de texte : l'ivoire y
            tient 13,25:1 et le champagne à 80 % 7,32.
          */}
          {verrouille ? (
            <div className="space-y-4">
              <section className="relative isolate overflow-hidden rounded-2xl border border-cuivre/25">
                <Image
                  src="/visuels/solys-08.webp"
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
                  <div className="flex flex-wrap gap-2.5">
                    <span className="flex items-center gap-2 rounded-full border border-cuivre/45 bg-nuit/60 px-3.5 py-1.5 text-[12px] font-semibold text-champagne backdrop-blur-sm">
                      <Crown size={13} aria-hidden="true" className="text-cuivre" />
                      Réservé aux offres payantes
                    </span>

                    {/*
                      La maquette affiche ici « Profil vérifié », qui
                      décrirait le membre qui regarde. Cette page ne charge
                      pas son statut de vérification, et la vérification
                      n'est pas imposée côté serveur : la pastille dit donc
                      ce qui est vrai de la plateforme, pas du visiteur.
                    */}
                    <span className="flex items-center gap-2 rounded-full border border-succes/45 bg-succes/12 px-3.5 py-1.5 text-[12px] font-semibold text-succes backdrop-blur-sm">
                      <ShieldCheck size={13} aria-hidden="true" />
                      Vérification incluse
                    </span>
                  </div>

                  <h2 className="font-display mt-6 max-w-lg text-[26px] font-normal leading-tight text-ivoire sm:text-[32px]">
                    Six belles découvertes.
                    <br />
                    <span className="text-cuivre">Chaque semaine.</span>
                  </h2>

                  <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-champagne/85">
                    Le Circle of Six te présente six profils choisis selon tes
                    valeurs et tes affinités, sans défilement infini. Il
                    s’ouvre dès l’offre Essentiel ; la vérification, le profil,
                    l’annuaire et la messagerie restent accessibles sans payer.
                  </p>

                  <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                    <Link
                      href="/tarifs"
                      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-degrade-cuivre px-6 py-3 text-[13px] font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
                    >
                      Découvrir les offres
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>

                    <Link
                      href="/explorer"
                      className={`inline-flex items-center justify-center rounded-xl border border-champagne/30 bg-nuit/50 px-6 py-3 text-[13px] font-semibold text-champagne backdrop-blur-sm transition-colors hover:border-champagne/55 ${focusRing}`}
                    >
                      Explorer gratuitement
                    </Link>
                  </div>

                  <p className="mt-8 text-right text-[10.5px] text-champagne/70">
                    Visuel de démonstration — aucun membre représenté
                  </p>
                </div>
              </section>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
                <section className="rounded-2xl border border-champagne/12 bg-minuit/70 p-5 sm:p-7">
                  <p className="text-[11px] font-semibold uppercase tracking-surtitre text-cuivre/90">
                    Aperçu de ton cercle
                  </p>

                  <h3 className="font-display mt-3 text-[22px] font-normal leading-snug text-ivoire sm:text-[26px]">
                    Une sélection pensée pour toi
                  </h3>

                  <p className="mt-2.5 text-[13px] leading-relaxed text-champagne/80">
                    Tes six profils apparaîtront ici lorsque ton offre donnera
                    accès au Circle. Nouvelle sélection chaque lundi.
                  </p>

                  <ul
                    aria-hidden="true"
                    className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
                  >
                    {[1, 2, 3, 4, 5, 6].map((rang) => (
                      <li
                        key={rang}
                        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-champagne/20 bg-nuit/40 px-2 py-7"
                      >
                        <span className="font-display text-[24px] text-champagne/45">
                          {rang}
                        </span>
                        <span className="mt-1.5 text-[11px] text-champagne/60">
                          À découvrir
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-2xl border border-champagne/12 bg-minuit/70 p-5 sm:p-7">
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-cuivre/40 bg-nuit/60 text-cuivre"
                  >
                    <Sparkles size={18} />
                  </span>

                  <h3 className="font-display mt-4 text-[22px] font-normal leading-snug text-ivoire sm:text-[26px]">
                    Comment ça marche&nbsp;?
                  </h3>

                  <ol className="mt-4 space-y-2.5 text-[13px] leading-relaxed text-champagne/80">
                    <li>1. Indique ce qui compte pour toi.</li>
                    <li>2. Découvre six propositions chaque lundi.</li>
                    <li>3. Échange librement avec celles qui t’intéressent.</li>
                  </ol>

                  <span
                    aria-hidden="true"
                    className="mt-6 block h-px w-full bg-champagne/15"
                  />

                  <Link
                    href="/fonctionnalites#circle"
                    className={`mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-cuivre underline underline-offset-4 transition-colors hover:text-champagne ${focusRing}`}
                  >
                    En savoir plus sur le concept
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </section>
              </div>

              <div className="flex flex-col gap-2 rounded-2xl border border-champagne/12 bg-minuit/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[13px] text-champagne/85">
                  <span className="font-semibold text-champagne">
                    Une approche plus sereine des rencontres
                  </span>
                  <span className="px-2 text-champagne/45" aria-hidden="true">
                    ·
                  </span>
                  Moins de profils, davantage de sens.
                </p>

                <p className="flex items-center gap-2 text-[12px] text-champagne/70">
                  <Sparkles size={13} aria-hidden="true" className="text-cuivre" />
                  Sfera&rsquo;Solys
                </p>
              </div>
            </div>
          ) : chargement ? (
            <div className="flex flex-col items-center gap-3 py-24">
              <Loader2
                className="h-7 w-7 animate-spin text-cuivre"
                aria-hidden="true"
              />
              <p className="text-[13px] text-champagne/55">
                Préparation de ton Circle…
              </p>
            </div>
          ) : (
            <>
              {/* Bandeau de la semaine */}
              {semaine && (
                <section className="mb-5 rounded-2xl border border-champagne/10 bg-minuit px-4 py-3.5 sm:px-5">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-champagne/80">
                    <CalendarClock
                      size={14}
                      className="shrink-0 text-cuivre"
                      aria-hidden="true"
                    />
                    <strong className="font-bold text-champagne">
                      Semaine du {formaterDate(semaine.debut)}
                    </strong>
                    <span className="text-champagne/60">
                      · prochain tirage dans {compteARebours}
                    </span>
                  </p>

                  {semaine.nouvelle && (
                    <p className="mt-2 text-[12px] leading-relaxed text-champagne/70">
                      Ta sélection vient d’être tirée. Elle ne bougera plus
                      jusqu’à lundi, même si tu recharges la page.
                    </p>
                  )}

                  {semaine.disparus > 0 && (
                    <p className="mt-2 text-[12px] leading-relaxed text-champagne/70">
                      {semaine.disparus === 1
                        ? "Un profil de ta sélection n’est plus disponible."
                        : `${semaine.disparus} profils de ta sélection ne sont plus disponibles.`}{" "}
                      Ils ne sont pas remplacés : la semaine est la semaine.
                    </p>
                  )}

                  {semaine.tires < 6 && semaine.vivier < 6 && (
                    <p className="mt-2 text-[12px] leading-relaxed text-champagne/70">
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
                    aria-label="Fermer le message"
                    className={`shrink-0 rounded-lg p-1 text-champagne/55 hover:text-champagne ${focusRing}`}
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </div>
              )}

              {/* Profils */}
              {profils.length === 0 ? (
                <div className="rounded-2xl border border-champagne/10 bg-minuit px-6 py-16 text-center">
                  <Sparkle
                    size={24}
                    className="mx-auto mb-4 text-champagne/60"
                    aria-hidden="true"
                  />

                  <h2 className="font-display text-[18px] font-bold text-champagne">
                    Aucun profil cette semaine
                  </h2>

                  <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-champagne/60">
                    La communauté est encore jeune, ou tu as déjà aimé tous les
                    profils qui te correspondaient. Le prochain tirage a lieu
                    dans {compteARebours}.
                  </p>

                  <Link
                    href="/explorer"
                    className={`mt-6 inline-flex items-center gap-2 rounded-xl border border-champagne/15 px-5 py-2.5 text-[13px] font-semibold text-champagne transition-colors hover:border-champagne/30 ${focusRing}`}
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
              className="absolute inset-0 cursor-default bg-nuit/80 backdrop-blur-sm"
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
              className="relative z-10 w-full max-w-sm rounded-[1.75rem] border border-succes/25 bg-minuit p-6 text-center sm:p-8"
            >
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-succes/15">
                <Heart size={22} className="fill-succes text-succes" aria-hidden="true" />
              </span>

              <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-succes">
                Réciproque
              </p>

              <h2
                id="titre-match-circle"
                className="font-display mt-2 text-[22px] font-extrabold leading-tight text-champagne"
              >
                {match.nom} t&apos;a aussi aimé.
              </h2>

              <div className="mt-6 flex flex-col gap-2.5">
                <Link
                  href={`/messages/${match.matchId}`}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cuivre px-5 py-3 text-[13px] font-bold text-nuit transition-colors hover:bg-cuivre/90 ${focusRing}`}
                >
                  <MessageCircle size={15} aria-hidden="true" />
                  Écrire maintenant
                </Link>

                <button
                  type="button"
                  onClick={() => setMatch(null)}
                  className={`inline-flex w-full items-center justify-center rounded-xl border border-champagne/15 px-5 py-3 text-[13px] font-semibold text-champagne/80 transition-colors hover:border-champagne/30 hover:text-champagne ${focusRing}`}
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
    <li className="flex flex-col overflow-hidden rounded-2xl border border-champagne/10 bg-minuit">
      <div className="relative aspect-[4/5] bg-nuit">
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
            <UserRound size={30} className="text-champagne/60" aria-hidden="true" />
          </div>
        )}

        <span className="absolute left-2.5 top-2.5 rounded-full bg-nuit/80 px-2.5 py-1 text-[11px] font-bold text-champagne backdrop-blur-sm">
          {rang} / 6
        </span>

        <button
          type="button"
          onClick={onSignaler}
          aria-label={`Signaler ${nom}`}
          className={`absolute right-2.5 top-2.5 rounded-lg bg-nuit/70 p-2 text-champagne/60 backdrop-blur-sm transition-colors hover:text-cuivre ${focusRing}`}
        >
          <Flag size={14} aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-display min-w-0 truncate text-[16px] font-bold text-champagne">
            {nom}
            {profil.age ? `, ${profil.age}` : ""}
          </h2>

          {profil.identityVerified && (
            <span
              className="flex shrink-0 items-center gap-1 rounded-full bg-succes/15 px-2 py-0.5 text-[11px] font-bold text-succes"
              title="Identité vérifiée"
            >
              <ShieldCheck size={12} aria-hidden="true" />
              Vérifié
            </span>
          )}
        </div>

        {lieu && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-champagne/55">
            <MapPin size={12} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{lieu}</span>
          </p>
        )}

        {intentions.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {intentions.map((intention) => (
              <li
                key={intention}
                className="rounded-full border border-champagne/12 px-2.5 py-0.5 text-[11px] text-champagne/70"
              >
                {INTENTIONS[intention] ?? intention}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-center gap-2 pt-4">
          <Link
            href={`/profil/${profil._id}?from=circle`}
            className={`flex-1 rounded-xl border border-champagne/15 px-3 py-2.5 text-center text-[12px] font-bold text-champagne transition-colors hover:border-champagne/30 ${focusRing}`}
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
                ? "bg-succes/15 text-succes"
                : "bg-cuivre text-nuit hover:bg-cuivre/90 disabled:opacity-40"
            }`}
          >
            {likeEnCours ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Heart size={16} className={aime ? "fill-succes" : ""} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </li>
  );
}
