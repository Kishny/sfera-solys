// src/app/(app)/explorer/page.tsx

"use client";

/**
 * Annuaire Sfera'Solys.
 *
 * ## Pourquoi ce n'est plus une pile de cartes
 *
 * Cette page était un swipe façon Tinder : trois cartes empilées,
 * glisser-à-droite pour liker, glisser-à-gauche pour passer, et un
 * préchargement qui allongeait la liste sans fin. Or le site affirme le
 * contraire à deux endroits. `/valeurs` : « Le Circle of Six propose six
 * profils le lundi, puis s'arrête. À côté, l'annuaire permet de chercher par
 * soi-même. Aucune des deux vues ne défile à l'infini : ce n'est pas un oubli,
 * c'est le produit. » Et `/fonctionnalites` vend « des liens choisis, pas des
 * milliers de swipes » et « moins de fatigue du swipe ».
 *
 * L'annuaire promis n'existait pas : Explorer *était* le swipe. Une promesse
 * tenue par une page qui fait l'inverse n'est pas une promesse.
 *
 * Donc : une grille, une recherche, et une **pagination explicite**. On demande
 * la page suivante, elle ne vient pas toute seule. C'est le point entier du
 * changement — le reste (grille, filtres) n'en est que la conséquence.
 *
 * ## Ce qui disparaît, et pourquoi
 *
 * - **Le glisser-pour-liker.** Un geste rapide et réversible-par-accident est
 *   exactement ce que la page prétend refuser.
 * - **Le bouton « passer ».** Dans un annuaire, on ne passe pas : on ne like
 *   pas. Rien à enregistrer, rien à consommer.
 * - **Le compteur « x profils à découvrir ».** Il comptait ce qui restait dans
 *   la pile chargée, pas les membres. L'annuaire affiche le total réel, celui
 *   que renvoie l'API.
 * - **La visite enregistrée passivement.** L'ancienne page envoyait un
 *   `POST /api/visitors` pour chaque carte affichée. En grille, ça ferait vingt
 *   visites par page feuilletée, gonflerait « qui a vu ton profil » et
 *   épuiserait le quota de visites (20 sur l'offre gratuite). La visite part
 *   maintenant au clic sur « voir le profil » — quand elle a lieu.
 *
 * ## Corrections de fond au passage
 *
 * - Les filtres d'âge partaient de **18 ans** alors que la plateforme est
 *   réservée aux 28 ans et plus (l'API corrigeait silencieusement à 28).
 * - Les orientations proposées étaient toutes au féminin, héritées de
 *   SferaLuna : « Hétérosexuelle », « Lesbienne / Homosexuelle », « Curieuse ».
 * - L'identité visuelle passe du violet/rose hérité à l'éclipse solaire.
 *   L'orange est réservé à l'action, le lime à la validation — jamais du texte
 *   fin sur ces deux fonds.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Flag,
  Heart,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import { usePremium } from "@/hooks/usePremium";
import ReportModal from "@/components/ReportModal";
import PanneauBoost from "@/components/boost/PanneauBoost";
import { DEPARTEMENTS, getDepartementLabel } from "@/lib/locations";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Profil {
  _id: string;
  pseudonyme: string;
  age?: number;
  localisation?: string;
  departement?: string;
  interets?: string[];
  intentions?: string[];
  image?: string;
  identityVerified?: boolean;
  /**
   * Le profil est remonté par un boost actif, pas par l'ordre naturel.
   * Renseigné par /api/profiles ; affiché tel quel, jamais deviné.
   */
  miseEnAvant?: boolean;
}

interface Recherche {
  ageMin: string;
  ageMax: string;
  intentions: string[];
  ville: string;
  departement: string;
  /** Filtres réservés aux offres payantes. */
  orientation: string;
  actifRecemment: boolean;
}

// ─────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────

/** Âge minimum d'inscription. L'API applique la même borne. */
const AGE_MINIMUM = 28;
const AGE_MAXIMUM = 99;

/** Profils par page. L'API plafonne à 50. */
const PAR_PAGE = 18;

const INTENTIONS = [
  { value: "rencontre-serieuse", label: "Rencontre sérieuse" },
  { value: "amitie", label: "Amitié" },
  { value: "aventure", label: "Aventure" },
  { value: "reseautage", label: "Réseautage" },
  { value: "discussion", label: "Discussion" },
];

/**
 * Orientations, au masculin.
 *
 * La liste précédente était intégralement au féminin — reste du fork
 * SferaLuna. « Curieux » remplace « Curieuse », et l'entrée
 * « Lesbienne / Homosexuelle » n'avait évidemment rien à faire ici.
 */
const ORIENTATIONS = [
  { value: "hetero", label: "Hétérosexuel" },
  { value: "homo", label: "Homosexuel" },
  { value: "bi", label: "Bisexuel" },
  { value: "pan", label: "Pansexuel" },
  { value: "curieux", label: "Curieux" },
  { value: "other", label: "Autre" },
];

const RECHERCHE_VIDE: Recherche = {
  ageMin: String(AGE_MINIMUM),
  ageMax: String(AGE_MAXIMUM),
  intentions: [],
  ville: "",
  departement: "",
  orientation: "",
  actifRecemment: false,
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss";

const champ =
  "w-full rounded-xl border border-cream/12 bg-abyss/60 px-3 py-2.5 text-[13px] text-cream placeholder:text-cream/55 " +
  focusRing;

/** Libellé d'une intention, ou la valeur brute si elle est inconnue. */
function libelleIntention(valeur: string): string {
  return INTENTIONS.find((item) => item.value === valeur)?.label ?? valeur;
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function AnnuairePage() {
  const { status } = useSession();
  const router = useRouter();
  const { isPremium, subscription } = usePremium();
  const reduireAnimations = useReducedMotion();

  /** Filtres en cours d'édition, appliqués seulement à la validation. */
  const [brouillon, setBrouillon] = useState<Recherche>(RECHERCHE_VIDE);
  /** Filtres réellement envoyés à l'API. */
  const [recherche, setRecherche] = useState<Recherche>(RECHERCHE_VIDE);

  const [filtresOuverts, setFiltresOuverts] = useState(false);

  const [profils, setProfils] = useState<Profil[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [nombreDePages, setNombreDePages] = useState(1);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [likeEnCours, setLikeEnCours] = useState<string | null>(null);
  const [profilsAimes, setProfilsAimes] = useState<Set<string>>(new Set());

  /**
   * Likes restants aujourd'hui. `null` = illimité.
   *
   * Amorcé depuis `/api/subscription/status`, puis mis à jour par la réponse de
   * chaque like : l'API renvoie le quota, donc pas besoin d'un second appel.
   */
  const [likesRestants, setLikesRestants] = useState<number | null>(null);

  const [profilSignale, setProfilSignale] = useState<string | null>(null);

  const [match, setMatch] = useState<{ profil: Profil; matchId: string } | null>(
    null
  );

  useEffect(() => {
    const restants = subscription?.usage?.remainingSwipes;
    if (typeof restants === "number") setLikesRestants(restants);
  }, [subscription]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth?mode=login");
  }, [status, router]);

  /**
   * Charge une page de l'annuaire.
   *
   * Remplace toujours les résultats : une page est une page. C'est la
   * différence de fond avec l'ancienne pile, qui empilait les pages jusqu'à
   * l'épuisement de la base.
   */
  const chargerPage = useCallback(
    async (numero: number, filtres: Recherche) => {
      setChargement(true);
      setErreur("");

      try {
        const params = new URLSearchParams();

        params.set("age_min", filtres.ageMin || String(AGE_MINIMUM));
        params.set("age_max", filtres.ageMax || String(AGE_MAXIMUM));

        if (filtres.intentions.length > 0) {
          params.set("intentions", filtres.intentions.join(","));
        }

        if (filtres.ville.trim()) params.set("localisation", filtres.ville.trim());

        // "" = on laisse l'API appliquer la portée enregistrée par le membre.
        if (filtres.departement) params.set("departement", filtres.departement);

        // Les filtres payants ne partent que si l'offre les autorise.
        if (isPremium && filtres.orientation) {
          params.set("orientation", filtres.orientation);
        }
        if (isPremium && filtres.actifRecemment) {
          params.set("actif_recemment", "true");
        }

        params.set("limit", String(PAR_PAGE));
        params.set("page", String(numero));

        const reponse = await fetch(`/api/profiles?${params.toString()}`, {
          cache: "no-store",
        });

        const donnees = await reponse.json().catch(() => null);

        if (!reponse.ok || donnees?.success !== true) {
          setErreur(donnees?.error || "Impossible de charger l'annuaire.");
          setProfils([]);
          setTotal(0);
          setNombreDePages(1);
          return;
        }

        setProfils(donnees.profiles ?? []);
        setTotal(donnees.pagination?.total ?? 0);
        setNombreDePages(Math.max(1, donnees.pagination?.totalPages ?? 1));
      } catch {
        setErreur("Connexion interrompue. Réessaie dans un instant.");
        setProfils([]);
      } finally {
        setChargement(false);
      }
    },
    [isPremium]
  );

  /**
   * Un seul effet de chargement, déclenché par la page et les filtres appliqués.
   *
   * L'ancienne page en avait trois qui s'alimentaient l'un l'autre — dont un qui
   * incrémentait `page` à l'infini quand l'API échouait, jusqu'à `page=273`.
   */
  useEffect(() => {
    if (status !== "authenticated") return;
    void chargerPage(page, recherche);
  }, [status, page, recherche, chargerPage]);

  const appliquer = () => {
    setFiltresOuverts(false);
    setPage(1);
    setRecherche(brouillon);
  };

  const reinitialiser = () => {
    setBrouillon(RECHERCHE_VIDE);
    setPage(1);
    setRecherche(RECHERCHE_VIDE);
  };

  const basculerIntention = (valeur: string) => {
    setBrouillon((actuel) => ({
      ...actuel,
      intentions: actuel.intentions.includes(valeur)
        ? actuel.intentions.filter((item) => item !== valeur)
        : [...actuel.intentions, valeur],
    }));
  };

  const allerPage = (numero: number) => {
    const cible = Math.min(Math.max(1, numero), nombreDePages);
    if (cible === page) return;

    setPage(cible);
    window.scrollTo({ top: 0, behavior: reduireAnimations ? "auto" : "smooth" });
  };

  /**
   * Like d'un profil.
   *
   * Le quota est appliqué côté serveur — l'offre gratuite donne 5 likes par
   * jour, et cette limite n'était historiquement vérifiée nulle part. On se
   * contente ici d'afficher ce que le serveur répond.
   */
  const aimer = async (profil: Profil) => {
    if (likeEnCours || profilsAimes.has(profil._id)) return;

    setLikeEnCours(profil._id);
    setErreur("");

    try {
      const reponse = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: profil._id }),
      });

      const donnees = await reponse.json().catch(() => null);

      if (donnees?.quota) {
        setLikesRestants(donnees.quota.restants ?? null);
      }

      if (!reponse.ok || donnees?.success !== true) {
        setErreur(donnees?.error || "Impossible d'envoyer ce like.");
        return;
      }

      setProfilsAimes((actuel) => new Set(actuel).add(profil._id));

      if (donnees.matched && donnees.matchId) {
        setMatch({ profil, matchId: donnees.matchId });
      }
    } catch {
      setErreur("Connexion interrompue pendant le like.");
    } finally {
      setLikeEnCours(null);
    }
  };

  /**
   * Ouvre un profil, et enregistre la visite à ce moment-là.
   *
   * La navigation ne dépend pas de l'enregistrement : si la visite échoue, on
   * ouvre le profil quand même.
   */
  const ouvrirProfil = (profilId: string) => {
    void fetch("/api/visitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitedUserId: profilId }),
    }).catch(() => {});

    router.push(`/profil/${profilId}?from=annuaire`);
  };

  /** Nombre de filtres actifs, pour l'indicateur du bouton sur mobile. */
  const filtresActifs = useMemo(() => {
    let compte = 0;

    if (recherche.ageMin !== String(AGE_MINIMUM)) compte += 1;
    if (recherche.ageMax !== String(AGE_MAXIMUM)) compte += 1;
    if (recherche.intentions.length > 0) compte += 1;
    if (recherche.ville.trim()) compte += 1;
    if (recherche.departement) compte += 1;
    if (recherche.orientation) compte += 1;
    if (recherche.actifRecemment) compte += 1;

    return compte;
  }, [recherche]);

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
        <div className="mx-auto max-w-6xl">
          {/* ─────────────────────────────
              En-tête
          ───────────────────────────── */}
          <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display [font-stretch:125%] text-[26px] font-extrabold leading-tight tracking-tight text-cream sm:text-[32px]">
                Annuaire
              </h1>

              <p
                className="mt-1.5 text-[13px] leading-relaxed text-cream/60 sm:text-sm"
                aria-live="polite"
              >
                {chargement && profils.length === 0
                  ? "Recherche en cours…"
                  : total > 0
                    ? `${total} profil${total > 1 ? "s" : ""} correspondent à ta recherche. Tu avances page par page — rien ne défile à l’infini.`
                    : "Aucun profil ne correspond à cette recherche."}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {likesRestants !== null && (
                <p className="hidden rounded-xl border border-cream/12 px-3 py-2 text-[12px] text-cream/60 sm:block">
                  {likesRestants > 0
                    ? `${likesRestants} like${likesRestants > 1 ? "s" : ""} aujourd’hui`
                    : "Plus de like aujourd’hui"}
                </p>
              )}

              <button
                type="button"
                onClick={() => setFiltresOuverts((ouvert) => !ouvert)}
                aria-expanded={filtresOuverts}
                aria-controls="panneau-filtres"
                className={`inline-flex items-center gap-2 rounded-xl border border-cream/12 px-3.5 py-2.5 text-[13px] font-semibold text-cream transition-colors hover:border-cream/25 lg:hidden ${focusRing}`}
              >
                <Filter size={15} aria-hidden="true" />
                Filtres
                {filtresActifs > 0 && (
                  <span className="rounded-full bg-orange px-1.5 text-[11px] font-bold text-abyss">
                    {filtresActifs}
                  </span>
                )}
              </button>
            </div>
          </header>

          {/* ─────────────────────────────
              Boost de visibilité
          ───────────────────────────── */}
          <PanneauBoost onBoostLance={() => chargerPage(page, recherche)} />

          {/* ─────────────────────────────
              Recherche
              Dépliée en permanence à partir de lg, repliable en dessous.
          ───────────────────────────── */}
          <section
            id="panneau-filtres"
            className={`mb-5 rounded-2xl border border-cream/10 bg-[#0C222D] p-4 sm:p-5 ${
              filtresOuverts ? "block" : "hidden lg:block"
            }`}
          >
            <form
              onSubmit={(evenement) => {
                evenement.preventDefault();
                appliquer();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label
                    htmlFor="ville"
                    className="mb-1.5 block text-[12px] font-semibold text-cream/70"
                  >
                    Ville
                  </label>
                  <input
                    id="ville"
                    type="text"
                    value={brouillon.ville}
                    onChange={(evenement) =>
                      setBrouillon((actuel) => ({
                        ...actuel,
                        ville: evenement.target.value,
                      }))
                    }
                    placeholder="Lyon, Fort-de-France…"
                    className={champ}
                  />
                </div>

                <div>
                  <label
                    htmlFor="departement"
                    className="mb-1.5 block text-[12px] font-semibold text-cream/70"
                  >
                    Département
                  </label>
                  <select
                    id="departement"
                    value={brouillon.departement}
                    onChange={(evenement) =>
                      setBrouillon((actuel) => ({
                        ...actuel,
                        departement: evenement.target.value,
                      }))
                    }
                    className={champ}
                  >
                    {/*
                      Trois états distincts, et c'est voulu.

                      `/api/profiles` traite l'absence de département comme
                      « respecte la portée enregistrée par le membre » : un
                      membre réglé sur « mon département » reste dans son
                      bassin. Envoyer une valeur vide pour dire « toute la
                      France » donnerait donc l'inverse de ce qui est affiché.
                      L'API attend `all` pour lever la restriction, et c'est
                      ce que porte l'option explicite.
                    */}
                    <option value="">Selon ma préférence</option>
                    <option value="all">Toute la France</option>
                    {DEPARTEMENTS.map((departement) => (
                      <option key={departement.code} value={departement.code}>
                        {departement.nom} ({departement.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="age-min"
                    className="mb-1.5 block text-[12px] font-semibold text-cream/70"
                  >
                    Âge minimum
                  </label>
                  <input
                    id="age-min"
                    type="number"
                    inputMode="numeric"
                    min={AGE_MINIMUM}
                    max={AGE_MAXIMUM}
                    value={brouillon.ageMin}
                    onChange={(evenement) =>
                      setBrouillon((actuel) => ({
                        ...actuel,
                        ageMin: evenement.target.value,
                      }))
                    }
                    className={champ}
                  />
                  <p className="mt-1 text-[11px] text-cream/55">
                    Sfera&apos;Solys est réservé aux {AGE_MINIMUM} ans et plus.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="age-max"
                    className="mb-1.5 block text-[12px] font-semibold text-cream/70"
                  >
                    Âge maximum
                  </label>
                  <input
                    id="age-max"
                    type="number"
                    inputMode="numeric"
                    min={AGE_MINIMUM}
                    max={AGE_MAXIMUM}
                    value={brouillon.ageMax}
                    onChange={(evenement) =>
                      setBrouillon((actuel) => ({
                        ...actuel,
                        ageMax: evenement.target.value,
                      }))
                    }
                    className={champ}
                  />
                </div>
              </div>

              {/* Intentions */}
              <fieldset className="mt-4">
                <legend className="mb-2 text-[12px] font-semibold text-cream/70">
                  Intentions
                </legend>

                <div className="flex flex-wrap gap-2">
                  {INTENTIONS.map((intention) => {
                    const choisie = brouillon.intentions.includes(
                      intention.value
                    );

                    return (
                      <button
                        key={intention.value}
                        type="button"
                        onClick={() => basculerIntention(intention.value)}
                        aria-pressed={choisie}
                        className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${focusRing} ${
                          choisie
                            ? "border-orange bg-orange text-abyss"
                            : "border-cream/12 text-cream/60 hover:border-cream/25"
                        }`}
                      >
                        {intention.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Filtres payants */}
              <div className="mt-4 rounded-xl border border-cream/10 p-4">
                <p className="mb-3 flex items-center gap-2 text-[12px] font-semibold text-cream/70">
                  {isPremium ? (
                    <Sparkles size={14} className="text-orange" aria-hidden="true" />
                  ) : (
                    <Lock size={14} className="text-cream/55" aria-hidden="true" />
                  )}
                  Filtres des offres payantes
                </p>

                {isPremium ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="orientation"
                        className="mb-1.5 block text-[12px] font-semibold text-cream/70"
                      >
                        Orientation
                      </label>
                      <select
                        id="orientation"
                        value={brouillon.orientation}
                        onChange={(evenement) =>
                          setBrouillon((actuel) => ({
                            ...actuel,
                            orientation: evenement.target.value,
                          }))
                        }
                        className={champ}
                      >
                        <option value="">Peu importe</option>
                        {ORIENTATIONS.map((orientation) => (
                          <option key={orientation.value} value={orientation.value}>
                            {orientation.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <label className="flex cursor-pointer items-center gap-3 self-end rounded-xl border border-cream/12 px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={brouillon.actifRecemment}
                        onChange={(evenement) =>
                          setBrouillon((actuel) => ({
                            ...actuel,
                            actifRecemment: evenement.target.checked,
                          }))
                        }
                        className={`h-4 w-4 shrink-0 accent-orange ${focusRing}`}
                      />
                      <span className="text-[13px] text-cream/80">
                        Actif dans les 7 derniers jours
                      </span>
                    </label>
                  </div>
                ) : (
                  <p className="text-[12px] leading-relaxed text-cream/55">
                    L&apos;orientation et l&apos;activité récente sont réservées
                    aux offres payantes. Le reste de l&apos;annuaire, la
                    vérification d&apos;identité et la recherche sont
                    accessibles dès l&apos;offre gratuite.
                  </p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className={`inline-flex items-center gap-2 rounded-xl bg-orange px-5 py-2.5 text-[13px] font-bold text-abyss transition-colors hover:bg-orange/90 ${focusRing}`}
                >
                  <Search size={15} aria-hidden="true" />
                  Chercher
                </button>

                <button
                  type="button"
                  onClick={reinitialiser}
                  className={`inline-flex items-center gap-2 rounded-xl border border-cream/12 px-4 py-2.5 text-[13px] font-semibold text-cream/70 transition-colors hover:border-cream/25 hover:text-cream ${focusRing}`}
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  Réinitialiser
                </button>
              </div>
            </form>
          </section>

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
                className={`shrink-0 rounded-lg p-1 text-cream/50 hover:text-cream ${focusRing}`}
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          )}

          {/* ─────────────────────────────
              Résultats
          ───────────────────────────── */}
          {chargement ? (
            <div className="flex flex-col items-center gap-3 py-24">
              <Loader2
                className="h-7 w-7 animate-spin text-orange"
                aria-hidden="true"
              />
              <p className="text-[13px] text-cream/55">Recherche en cours…</p>
            </div>
          ) : profils.length === 0 ? (
            <div className="rounded-2xl border border-cream/10 bg-[#0C222D] px-6 py-16 text-center">
              <UserRound
                size={28}
                className="mx-auto mb-4 text-cream/30"
                aria-hidden="true"
              />

              <h2 className="font-display [font-stretch:125%] text-[18px] font-bold text-cream">
                Rien à cette adresse
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-cream/60">
                Aucun profil ne correspond à ces critères. Élargis le
                département ou la tranche d&apos;âge, ou retire une intention.
              </p>

              <button
                type="button"
                onClick={reinitialiser}
                className={`mt-6 inline-flex items-center gap-2 rounded-xl border border-cream/15 px-5 py-2.5 text-[13px] font-semibold text-cream transition-colors hover:border-cream/30 ${focusRing}`}
              >
                <RotateCcw size={14} aria-hidden="true" />
                Réinitialiser la recherche
              </button>
            </div>
          ) : (
            <>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {profils.map((profil) => (
                  <CarteProfil
                    key={profil._id}
                    profil={profil}
                    aime={profilsAimes.has(profil._id)}
                    likeEnCours={likeEnCours === profil._id}
                    likesEpuises={likesRestants === 0}
                    onAimer={() => aimer(profil)}
                    onOuvrir={() => ouvrirProfil(profil._id)}
                    onSignaler={() => setProfilSignale(profil._id)}
                  />
                ))}
              </ul>

              {/* ─────────────────────────────
                  Pagination explicite
                  Le cœur du changement : la page suivante se demande.
              ───────────────────────────── */}
              <nav
                aria-label="Pagination de l'annuaire"
                className="mt-8 flex items-center justify-center gap-3"
              >
                <button
                  type="button"
                  onClick={() => allerPage(page - 1)}
                  disabled={page <= 1}
                  className={`inline-flex items-center gap-1.5 rounded-xl border border-cream/12 px-4 py-2.5 text-[13px] font-semibold text-cream transition-colors hover:border-cream/25 disabled:cursor-not-allowed disabled:opacity-35 ${focusRing}`}
                >
                  <ChevronLeft size={15} aria-hidden="true" />
                  Précédent
                </button>

                <p className="min-w-[7.5rem] text-center text-[13px] text-cream/60">
                  Page <span className="font-bold text-cream">{page}</span> sur{" "}
                  {nombreDePages}
                </p>

                <button
                  type="button"
                  onClick={() => allerPage(page + 1)}
                  disabled={page >= nombreDePages}
                  className={`inline-flex items-center gap-1.5 rounded-xl border border-cream/12 px-4 py-2.5 text-[13px] font-semibold text-cream transition-colors hover:border-cream/25 disabled:cursor-not-allowed disabled:opacity-35 ${focusRing}`}
                >
                  Suivant
                  <ChevronRight size={15} aria-hidden="true" />
                </button>
              </nav>
            </>
          )}
        </div>
      </div>

      {/* ─────────────────────────────
          Match
      ───────────────────────────── */}
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
            aria-labelledby="titre-match"
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
              className="relative z-10 w-full max-w-sm rounded-[1.75rem] border border-lime/25 bg-[#0C222D] p-6 text-center sm:p-8"
            >
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-lime/15">
                <Heart
                  size={22}
                  className="fill-lime text-lime"
                  aria-hidden="true"
                />
              </span>

              <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-lime">
                Réciproque
              </p>

              <h2
                id="titre-match"
                className="font-display [font-stretch:125%] mt-2 text-[22px] font-extrabold leading-tight text-cream"
              >
                {match.profil.pseudonyme || "Ce membre"} t&apos;a aussi aimé.
              </h2>

              <p className="mx-auto mt-3 max-w-xs text-[13px] leading-relaxed text-cream/65">
                La conversation est ouverte. À toi de commencer, ou pas — un
                match n&apos;oblige à rien.
              </p>

              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => router.push(`/messages/${match.matchId}`)}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange px-5 py-3 text-[13px] font-bold text-abyss transition-colors hover:bg-orange/90 ${focusRing}`}
                >
                  <MessageCircle size={15} aria-hidden="true" />
                  Écrire maintenant
                </button>

                <button
                  type="button"
                  onClick={() => setMatch(null)}
                  className={`inline-flex w-full items-center justify-center rounded-xl border border-cream/15 px-5 py-3 text-[13px] font-semibold text-cream/80 transition-colors hover:border-cream/30 hover:text-cream ${focusRing}`}
                >
                  Continuer à chercher
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signalement */}
      <ReportModal
        isOpen={profilSignale !== null}
        onClose={() => setProfilSignale(null)}
        targetType="user"
        targetId={profilSignale ?? ""}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// Carte de l'annuaire
// ─────────────────────────────────────────────

function CarteProfil({
  profil,
  aime,
  likeEnCours,
  likesEpuises,
  onAimer,
  onOuvrir,
  onSignaler,
}: {
  profil: Profil;
  aime: boolean;
  likeEnCours: boolean;
  /** Plus aucun like disponible aujourd'hui : le bouton est désactivé. */
  likesEpuises: boolean;
  onAimer: () => void;
  onOuvrir: () => void;
  onSignaler: () => void;
}) {
  const lieu = [profil.localisation, getDepartementLabel(profil.departement)]
    .filter(Boolean)
    .join(" · ");

  const intentions = (profil.intentions ?? []).slice(0, 2);
  const nom = profil.pseudonyme || "Membre";

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-cream/10 bg-[#0C222D]">
      {/* Photo */}
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
            <span
              className="font-display [font-stretch:125%] flex h-20 w-20 items-center justify-center rounded-full border border-cream/10 text-[28px] font-extrabold text-cream/40"
              aria-hidden="true"
            >
              {nom.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={onSignaler}
          aria-label={`Signaler ${nom}`}
          className={`absolute right-2.5 top-2.5 rounded-lg bg-abyss/70 p-2 text-cream/60 backdrop-blur-sm transition-colors hover:text-orange ${focusRing}`}
        >
          <Flag size={14} aria-hidden="true" />
        </button>

        {/* Un profil remonté par un boost le dit, il ne se déguise pas en
            résultat naturel du classement. */}
        {profil.miseEnAvant && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-orange px-2.5 py-1 text-[11px] font-bold text-abyss">
            Mis en avant
          </span>
        )}
      </div>

      {/* Informations */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display [font-stretch:125%] min-w-0 truncate text-[16px] font-bold text-cream">
            {nom}
            {profil.age ? `, ${profil.age}` : ""}
          </h3>

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
                className="rounded-full border border-cream/12 px-2.5 py-0.5 text-[11px] text-cream/60"
              >
                {libelleIntention(intention)}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex items-center gap-2 pt-4">
          <button
            type="button"
            onClick={onOuvrir}
            className={`flex-1 rounded-xl border border-cream/15 px-3 py-2.5 text-[12px] font-bold text-cream transition-colors hover:border-cream/30 ${focusRing}`}
          >
            Voir le profil
          </button>

          <button
            type="button"
            onClick={onAimer}
            disabled={aime || likeEnCours || likesEpuises}
            aria-label={aime ? `${nom} : déjà aimé` : `Aimer ${nom}`}
            title={
              likesEpuises && !aime
                ? "Tu as utilisé tes likes du jour."
                : undefined
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
              <Heart
                size={16}
                className={aime ? "fill-lime" : ""}
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </div>
    </li>
  );
}
