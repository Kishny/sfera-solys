// src/app/(app)/profil/[id]/page.tsx

"use client";

/**
 * Page de profil Sfera'Solys.
 *
 * ## La façade corrigée
 *
 * Le bouton s'appelait « Liker ce profil ». Il appelait `router.back()`. Rien
 * d'autre. Le commentaire d'origine l'assumait : « Pour l'instant, je garde ta
 * logique : retour à la page précédente. Plus tard, si tu veux, on pourra le
 * connecter directement à /api/likes. » Un bouton qui annonce une action et
 * navigue à la place est pire qu'un bouton absent : il consomme une intention.
 *
 * Il like maintenant pour de vrai, avec le quota du jour, la détection de
 * réciprocité, et trois états lisibles : à aimer, déjà aimé, déjà en relation.
 * C'est `/api/profiles/[id]` qui renvoie cet état (bloc `relation`) — la page
 * ne le devine pas.
 *
 * ## La visite se compte ici, et nulle part ailleurs
 *
 * L'annuaire envoyait le `POST /api/visitors`, ce qui laissait les autres portes
 * d'entrée (messages, matchs, Circle, lien direct) sans enregistrement. La
 * visite appartient à la page visitée : elle a lieu quel que soit le chemin
 * d'arrivée. Le serveur ignore déjà les auto-visites et dédoublonne par jour,
 * donc un aller-retour ne gonfle rien.
 *
 * ## Ce qui traînait du fork
 *
 * - Les orientations étaient au féminin (« Hétérosexuelle », « Lesbienne /
 *   Homosexuelle », « Curieuse »), le badge affichait « Vérifiée », et
 *   l'initiale de secours de l'avatar était… **« L »**, pour Luna.
 * - La lune 🌙 servait d'icône aux centres d'intérêt — le symbole de la marque
 *   d'origine, sur une page de la version solaire.
 * - Le vouvoiement (« Ce profil vous intéresse ? », « continuer vos
 *   découvertes ») alors que tout le reste du site tutoie.
 * - `?from=explorer` : l'annuaire envoie `from=annuaire` depuis sa refonte. Les
 *   deux sont acceptés, les anciens liens ne doivent pas mener à un cul-de-sac.
 */

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  Camera,
  Check,
  Cpu,
  Dumbbell,
  Film,
  Gamepad2,
  Images,
  Info,
  Leaf,
  Music,
  Palette,
  Plane,
  Shirt,
  UtensilsCrossed,
  Users2,
  X,
  Eye,
  Flag,
  Heart,
  Loader2,
  MapPin,
  Maximize2,
  MessageCircle,
  Quote,
  ShieldCheck,
  Sparkle,
  Target,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import ReportModal from "@/components/ReportModal";
import VisionneusePhotos from "@/components/VisionneusePhotos";
import { getDepartementLabel } from "@/lib/locations";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Profil {
  _id: string;
  pseudonyme?: string;
  age?: number;
  localisation?: string;
  departement?: string;
  bio?: string;
  image?: string;
  photos?: string[];
  interets?: string[];
  intentions?: string[];
  orientation?: string;
  identityVerified?: boolean;
  createdAt?: string;
  /** Calculé par l'API, et tu pour un profil en visibilité restreinte. */
  vuRecemment?: boolean;
}

interface Relation {
  estMonProfil: boolean;
  dejaAime: boolean;
  estUnMatch: boolean;
  matchId: string | null;
  estFavori?: boolean;
}

/** Ce que vous avez coché tous les deux. Des intersections, pas un score. */
interface Affinites {
  interets: string[];
  intentions: string[];
}

// ─────────────────────────────────────────────
// Libellés
// ─────────────────────────────────────────────

/** Au masculin : Sfera'Solys est la version hommes. */
const ORIENTATIONS: Record<string, string> = {
  hetero: "Hétérosexuel",
  homo: "Gay",
  bi: "Bisexuel",
  pan: "Pansexuel",
  curieux: "Curieux",
  // Ancienne valeur enregistrée avant la reprise du fork.
  curieuse: "Curieux",
  other: "Autre",
};

const INTENTIONS: Record<string, string> = {
  "rencontre-serieuse": "Rencontre sérieuse",
  amitie: "Amitié",
  aventure: "Aventure",
  reseautage: "Réseautage",
  discussion: "Discussion",
};

/**
 * Centres d'intérêt : du code enregistré au libellé affiché.
 *
 * La page montrait la valeur brute — « voyage », « cinema » — c'est-à-dire
 * ce que la base contient, pas ce qu'on écrit à quelqu'un. Les clés sont
 * celles de l'étape 4 de l'inscription, seule à les produire.
 */
const INTERETS: Record<string, { label: string; icone: LucideIcon }> = {
  voyage: { label: "Voyage", icone: Plane },
  cuisine: { label: "Cuisine", icone: UtensilsCrossed },
  sport: { label: "Sport", icone: Dumbbell },
  musique: { label: "Musique", icone: Music },
  cinema: { label: "Cinéma", icone: Film },
  lecture: { label: "Lecture", icone: Quote },
  art: { label: "Art", icone: Palette },
  technologie: { label: "Technologie", icone: Cpu },
  nature: { label: "Nature", icone: Leaf },
  mode: { label: "Mode", icone: Shirt },
  gaming: { label: "Jeux vidéo", icone: Gamepad2 },
  photographie: { label: "Photographie", icone: Camera },
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70 focus-visible:ring-offset-2 focus-visible:ring-offset-nuit";

/** Destination du bouton retour, selon la page d'origine. */
const RETOURS: Record<string, string> = {
  annuaire: "/explorer",
  // Ancien nom de la page, conservé pour les liens déjà en circulation.
  explorer: "/explorer",
  matches: "/matches",
  circle: "/circle",
  connexions: "/mon-compte?tab=connexions",
  visiteurs: "/mon-compte?tab=visiteurs",
};

// ─────────────────────────────────────────────
// Contenu
// ─────────────────────────────────────────────

function ContenuProfil() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const parametres = useSearchParams();
  const reduireAnimations = useReducedMotion();

  const depuis = parametres.get("from") ?? "";
  const apercu = parametres.get("preview") === "1";

  const [profil, setProfil] = useState<Profil | null>(null);
  const [relation, setRelation] = useState<Relation | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [likeEnCours, setLikeEnCours] = useState(false);
  const [erreurLike, setErreurLike] = useState("");
  const [signalementOuvert, setSignalementOuvert] = useState(false);

  /**
   * La visionneuse.
   *
   * `null` quand elle est fermée, sinon l'index de la photo regardée.
   * Les vignettes de la grille sont recadrées ; la visionneuse montre la
   * photo entière.
   */
  const [photoOuverte, setPhotoOuverte] = useState<number | null>(null);

  /**
   * Blocage.
   *
   * La route `/api/users/block` existait depuis l'origine, mais aucune
   * interface ne l'appelait : le blocage était une fonction annoncée sur
   * la page d'aide et introuvable dans le produit.
   *
   * La confirmation est délibérée. L'action est conséquente — elle retire
   * la personne de l'annuaire, du Circle, des matchs et de la messagerie,
   * dans les deux sens — et la route ne demande rien, elle exécute.
   */
  /**
   * Favori et écartement.
   *
   * Le favori est privé — rien n'est notifié. L'écartement retire le profil
   * d'Explorer et du Circle, et de là seulement : un match déjà noué et sa
   * conversation survivent.
   */
  const [estFavori, setEstFavori] = useState(false);
  const [favoriEnCours, setFavoriEnCours] = useState(false);
  const [ecarteEnCours, setEcarteEnCours] = useState(false);
  const [affinites, setAffinites] = useState<Affinites>({
    interets: [],
    intentions: [],
  });

  const basculerFavori = async () => {
    if (!profil || favoriEnCours) return;

    const cible = !estFavori;
    setFavoriEnCours(true);
    setEstFavori(cible); // Optimiste : l'étoile répond au clic.

    try {
      const reponse = await fetch("/api/users/favoris", {
        method: cible ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: profil._id }),
      });

      if (!reponse.ok) setEstFavori(!cible); // On revient en arrière.
    } catch {
      setEstFavori(!cible);
    } finally {
      setFavoriEnCours(false);
    }
  };

  const ecarter = async () => {
    if (!profil || ecarteEnCours) return;

    setEcarteEnCours(true);

    try {
      await fetch("/api/users/ecarter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: profil._id }),
      });
    } catch {
      // Sans effet visible : on repart quand même, le geste est léger.
    } finally {
      revenir();
    }
  };

  const [blocageOuvert, setBlocageOuvert] = useState(false);
  const [blocageEnCours, setBlocageEnCours] = useState(false);
  const [erreurBlocage, setErreurBlocage] = useState<string | null>(null);

  const bloquer = async () => {
    if (!profil || blocageEnCours) return;

    setBlocageEnCours(true);
    setErreurBlocage(null);

    try {
      const reponse = await fetch("/api/users/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: profil._id }),
      });

      if (!reponse.ok) {
        const donnees = await reponse.json().catch(() => null);
        setErreurBlocage(
          donnees?.error ?? "Le blocage n’a pas pu être enregistré."
        );
        setBlocageEnCours(false);
        return;
      }

      /*
       * La fiche devient inaccessible dans la foulée — l'API répond
       * désormais 403 sur un profil bloqué — donc rester dessus
       * afficherait une erreur. On repart sur l'annuaire.
       */
      router.push("/explorer");
    } catch {
      setErreurBlocage("Le blocage n’a pas pu être enregistré.");
      setBlocageEnCours(false);
    }
  };

  const revenir = useCallback(() => {
    const destination = RETOURS[depuis];

    if (destination) {
      router.push(destination);
      return;
    }

    router.back();
  }, [depuis, router]);

  useEffect(() => {
    if (!id) return;

    let annule = false;

    setChargement(true);
    setErreur("");

    fetch(`/api/profiles/${id}`, { cache: "no-store" })
      .then((reponse) => reponse.json())
      .then((donnees) => {
        if (annule) return;

        if (donnees?.success === true && donnees.profile) {
          setProfil(donnees.profile);
          setRelation(donnees.relation ?? null);
          setEstFavori(donnees.relation?.estFavori === true);
          setAffinites(
            donnees.affinites ?? { interets: [], intentions: [] }
          );
          return;
        }

        setErreur(donnees?.error || "Ce profil est introuvable.");
      })
      .catch(() => {
        if (!annule) setErreur("Impossible de charger ce profil.");
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [id]);

  /**
   * Enregistrement de la visite.
   *
   * Une seule fois, quand on sait de quel profil il s'agit. Jamais en mode
   * aperçu (on regarde son propre profil), jamais sur son propre profil — le
   * serveur l'ignorerait de toute façon, autant ne pas l'appeler.
   */
  useEffect(() => {
    if (!profil || apercu) return;
    if (relation?.estMonProfil) return;

    void fetch("/api/visitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitedUserId: profil._id }),
    }).catch(() => {});
  }, [profil, relation, apercu]);

  /** Like réel, avec le quota renvoyé par le serveur. */
  const aimer = async () => {
    if (!profil || likeEnCours || relation?.dejaAime) return;

    setLikeEnCours(true);
    setErreurLike("");

    try {
      const reponse = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: profil._id }),
      });

      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || donnees?.success !== true) {
        setErreurLike(donnees?.error || "Ce like n’a pas pu être envoyé.");
        return;
      }

      setRelation((actuel) => ({
        estMonProfil: actuel?.estMonProfil ?? false,
        dejaAime: true,
        estUnMatch: Boolean(donnees.matched),
        matchId: donnees.matchId ?? actuel?.matchId ?? null,
      }));
    } catch {
      setErreurLike("Connexion interrompue pendant le like.");
    } finally {
      setLikeEnCours(false);
    }
  };

  const nom = profil?.pseudonyme || "Ce membre";

  const lieu = profil
    ? [profil.localisation, getDepartementLabel(profil.departement)]
        .filter(Boolean)
        .join(" · ")
    : "";

  /**
   * La galerie : la photo de profil en premier, puis les autres.
   *
   * L'avatar et le tableau `photos` sont deux champs distincts, et
   * l'avatar y figure parfois déjà — d'où le dédoublonnage, sans quoi la
   * première image apparaîtrait deux fois.
   */
  const galerie: string[] = profil
    ? [...new Set([profil.image, ...(profil.photos ?? [])].filter(Boolean))] as string[]
    : [];

  const profilVide =
    profil &&
    !profil.bio &&
    (profil.intentions?.length ?? 0) === 0 &&
    (profil.interets?.length ?? 0) === 0;

  return (
    <div className="min-h-screen bg-nuit px-4 py-6 text-champagne sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-screen-2xl">
        {/* Mode aperçu */}
        {apercu && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cuivre/30 bg-cuivre/10 px-4 py-3">
            <p className="flex items-center gap-2.5 text-[13px] leading-relaxed text-champagne/85">
              <Eye size={15} className="shrink-0 text-cuivre" aria-hidden="true" />
              <span>
                <strong className="text-champagne">Aperçu</strong> — voici ton profil
                tel que les autres membres le voient.
              </span>
            </p>

            <button
              type="button"
              onClick={() => window.close()}
              className={`shrink-0 rounded-xl border border-champagne/15 px-3.5 py-1.5 text-[12px] font-semibold text-champagne/80 transition-colors hover:border-champagne/30 hover:text-champagne ${focusRing}`}
            >
              Fermer
            </button>
          </div>
        )}

        {/* Barre d'actions */}
        {!apercu && (
          <div className="mb-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={revenir}
              className={`group inline-flex items-center gap-2 rounded-xl border border-champagne/12 px-3.5 py-2 text-[13px] font-semibold text-champagne/75 transition-colors hover:border-champagne/25 hover:text-champagne ${focusRing}`}
            >
              <ArrowLeft
                size={15}
                className="transition-transform group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
              Retour
            </button>

            {profil && relation && !relation.estMonProfil && (
              <button
                type="button"
                onClick={() => setSignalementOuvert(true)}
                className={`inline-flex items-center gap-1.5 rounded-xl border border-champagne/12 px-3.5 py-2 text-[12px] font-semibold text-champagne/60 transition-colors hover:border-cuivre/40 hover:text-champagne ${focusRing}`}
              >
                <Flag size={13} aria-hidden="true" />
                Signaler
              </button>
            )}

            {profil && relation && !relation.estMonProfil && (
              <button
                type="button"
                onClick={() => {
                  setBlocageOuvert((ouvert) => !ouvert);
                  setErreurBlocage(null);
                }}
                aria-expanded={blocageOuvert}
                aria-controls="panneau-blocage"
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[12px] font-semibold transition-colors ${focusRing} ${
                  blocageOuvert
                    ? "border-erreur/45 text-erreur"
                    : "border-champagne/12 text-champagne/60 hover:border-erreur/40 hover:text-champagne"
                }`}
              >
                <Ban size={13} aria-hidden="true" />
                Bloquer
              </button>
            )}
          </div>
        )}

        {/* Confirmation du blocage */}
        {blocageOuvert && profil && (
          <div
            id="panneau-blocage"
            className="mb-6 rounded-2xl border border-erreur/30 bg-erreur/[0.06] p-5"
          >
            <h2 className="font-display text-[18px] font-normal text-ivoire">
              Bloquer {profil.pseudonyme}&nbsp;?
            </h2>

            <p className="mt-2 text-[13px] leading-relaxed text-champagne/80">
              Vous ne vous verrez plus : ni dans l’annuaire, ni dans le Circle,
              ni dans les matchs, ni dans la messagerie, ni dans la Communauté
              et l’Entraide. Le blocage vaut dans les deux sens, et{" "}
              {profil.pseudonyme} ne pourra plus t’écrire.
            </p>

            <p className="mt-2 text-[12px] leading-relaxed text-champagne/60">
              Si le comportement te paraît grave, signale-le aussi : un blocage
              te protège, un signalement prévient la modération.
            </p>

            {erreurBlocage && (
              <p
                role="alert"
                className="mt-3 flex items-start gap-2 text-[12.5px] text-erreur"
              >
                <AlertCircle
                  size={14}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                {erreurBlocage}
              </p>
            )}

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={bloquer}
                disabled={blocageEnCours}
                className={`inline-flex items-center justify-center gap-2 rounded-xl bg-erreur px-5 py-2.5 text-[13px] font-bold text-nuit transition-opacity hover:opacity-90 disabled:opacity-60 ${focusRing}`}
              >
                {blocageEnCours ? (
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Ban size={14} aria-hidden="true" />
                )}
                {blocageEnCours ? "Blocage…" : "Confirmer le blocage"}
              </button>

              <button
                type="button"
                onClick={() => setBlocageOuvert(false)}
                className={`inline-flex items-center justify-center rounded-xl border border-champagne/20 px-5 py-2.5 text-[13px] font-semibold text-champagne transition-colors hover:border-champagne/40 ${focusRing}`}
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Chargement */}
        {chargement && (
          <div className="flex flex-col items-center gap-3 py-24">
            <Loader2
              className="h-7 w-7 animate-spin text-cuivre"
              aria-hidden="true"
            />
            <p className="text-[13px] text-champagne/55">Chargement du profil…</p>
          </div>
        )}

        {/* Erreur */}
        {!chargement && erreur && (
          <div className="rounded-2xl border border-champagne/10 bg-minuit px-6 py-16 text-center">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cuivre/15">
              <AlertCircle size={22} className="text-cuivre" aria-hidden="true" />
            </span>

            <h1 className="font-display text-[19px] font-bold text-champagne">
              Profil indisponible
            </h1>

            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-champagne/60">
              {erreur}
            </p>

            <button
              type="button"
              onClick={revenir}
              className={`mt-6 inline-flex items-center gap-2 rounded-xl border border-champagne/15 px-5 py-2.5 text-[13px] font-semibold text-champagne transition-colors hover:border-champagne/30 ${focusRing}`}
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Revenir
            </button>
          </div>
        )}

        {/* Profil */}
        {!chargement && profil && (
          <motion.div
            initial={{ opacity: 0, y: reduireAnimations ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduireAnimations ? 0 : 0.35 }}
            className="space-y-4"
          >
            {/* ─── Identité ─────────────────────────────────────────── */}
            <section className="rounded-2xl border border-champagne/10 bg-minuit p-5 sm:p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start">
                  <div className="relative shrink-0 self-center sm:self-start">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-cuivre/30 bg-nuit">
                      {profil.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profil.image}
                          alt={`Photo de ${nom}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span
                          className="font-display text-[32px] font-extrabold text-champagne/55"
                          aria-hidden="true"
                        >
                          {nom.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/*
                      La pastille de présence n'apparaît que si l'API l'a
                      calculée — elle se tait pour un profil en visibilité
                      restreinte, Mode Fantôme compris.
                    */}
                    {profil.vuRecemment && (
                      <span
                        aria-label="Vu récemment"
                        title="Vu récemment"
                        className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-minuit bg-succes"
                      />
                    )}
                  </div>

                  <div className="min-w-0 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
                      <h1 className="font-display min-w-0 max-w-full truncate text-[28px] font-normal leading-tight text-ivoire sm:text-[34px]">
                        {profil.pseudonyme || "Membre"}
                      </h1>

                      {profil.identityVerified && (
                        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-succes/40 bg-succes/12 px-3 py-1 text-[12px] font-semibold text-succes">
                          <ShieldCheck size={13} aria-hidden="true" />
                          Vérifié
                        </span>
                      )}

                      {relation?.estUnMatch && (
                        <span className="shrink-0 rounded-full bg-degrade-cuivre px-3 py-1 text-[12px] font-bold text-nuit">
                          En relation
                        </span>
                      )}
                    </div>

                    <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-champagne/80 sm:justify-start">
                      {typeof profil.age === "number" && (
                        <li className="flex items-center gap-1.5">
                          <CalendarDays size={14} className="text-cuivre" aria-hidden="true" />
                          {profil.age} ans
                        </li>
                      )}

                      {lieu && (
                        <li className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-cuivre" aria-hidden="true" />
                          {lieu}
                        </li>
                      )}

                      {profil.orientation && ORIENTATIONS[profil.orientation] && (
                        <li className="flex items-center gap-1.5">
                          <UserRound size={14} className="text-cuivre" aria-hidden="true" />
                          {ORIENTATIONS[profil.orientation]}
                        </li>
                      )}

                      {profil.vuRecemment && (
                        <li className="flex items-center gap-1.5 text-succes">
                          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-succes" />
                          En ligne récemment
                        </li>
                      )}
                    </ul>

                    {profil.bio && (
                      <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-champagne/85">
                        {profil.bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions principales */}
                {!apercu && relation && !relation.estMonProfil && (
                  <div className="flex w-full shrink-0 flex-col gap-2.5 lg:w-[270px]">
                    {relation.estUnMatch && relation.matchId ? (
                      <Link
                        href={`/messages/${relation.matchId}`}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-degrade-cuivre px-6 py-3.5 text-[14px] font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
                      >
                        <MessageCircle size={16} aria-hidden="true" />
                        Ouvrir la conversation
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={aimer}
                        disabled={likeEnCours || relation.dejaAime}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-[14px] font-bold transition-opacity ${focusRing} ${
                          relation.dejaAime
                            ? "cursor-default border border-cuivre/40 bg-cuivre/10 text-champagne"
                            : "bg-degrade-cuivre text-nuit hover:opacity-90 disabled:opacity-60"
                        }`}
                      >
                        {likeEnCours ? (
                          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                        ) : (
                          <Heart
                            size={16}
                            aria-hidden="true"
                            className={relation.dejaAime ? "fill-current" : undefined}
                          />
                        )}
                        {relation.dejaAime ? "Profil aimé" : "Aimer ce profil"}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={basculerFavori}
                      disabled={favoriEnCours}
                      aria-pressed={estFavori}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3 text-[13px] font-semibold transition-colors disabled:opacity-60 ${focusRing} ${
                        estFavori
                          ? "border-cuivre/50 bg-cuivre/10 text-champagne"
                          : "border-champagne/20 text-champagne/85 hover:border-cuivre/45"
                      }`}
                    >
                      {estFavori ? (
                        <BookmarkCheck size={15} className="text-cuivre" aria-hidden="true" />
                      ) : (
                        <Bookmark size={15} aria-hidden="true" />
                      )}
                      {estFavori ? "Dans tes favoris" : "Ajouter aux favoris"}
                    </button>

                    <p className="text-center text-[11.5px] leading-relaxed text-champagne/55">
                      Un favori reste privé&nbsp;: {nom} n’en sera pas informé.
                    </p>

                    {erreurLike && (
                      <p
                        role="alert"
                        className="flex items-start gap-2 text-[12.5px] leading-relaxed text-erreur"
                      >
                        <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                        {erreurLike}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* ─── Deux colonnes ────────────────────────────────────── */}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
              {/* Photos */}
              <section className="rounded-2xl border border-champagne/10 bg-minuit p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2.5 font-display text-[20px] font-normal text-ivoire">
                    <Images size={18} className="text-cuivre" aria-hidden="true" />
                    Photos
                  </h2>

                  {/*
                    Le compte annoncé est le compte réel. La maquette en
                    affichait huit ; le produit en autorise trois au
                    maximum, et promettre davantage derrière un lien serait
                    une porte qui s'ouvre sur rien.
                  */}
                  {galerie.length > 0 && (
                    <span className="shrink-0 text-[12px] text-champagne/55">
                      {galerie.length} photo{galerie.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {galerie.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-champagne/15 px-5 py-12 text-center">
                    <Camera size={22} className="mx-auto mb-3 text-champagne/40" aria-hidden="true" />
                    <p className="text-[13px] text-champagne/60">
                      {nom} n’a pas encore ajouté de photo.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-2.5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    {/*
                      Les vignettes ouvrent la visionneuse. Ce sont des
                      boutons et non des images cliquables : l'agrandissement
                      est une action, elle doit s'atteindre au clavier et
                      s'annoncer comme telle.
                    */}
                    <button
                      type="button"
                      onClick={() => setPhotoOuverte(0)}
                      aria-label={`Voir la photo de ${nom} en grand`}
                      className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-champagne/10 bg-nuit transition hover:border-cuivre/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cuivre sm:aspect-auto sm:min-h-[320px]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={galerie[0]}
                        alt={`Photo de ${nom}`}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      />

                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-champagne/15 bg-nuit/80 px-3 py-1.5 text-[11.5px] text-champagne/85 opacity-0 backdrop-blur-sm transition group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
                      >
                        <Maximize2 size={13} />
                        Agrandir
                      </span>
                    </button>

                    {galerie.length > 1 && (
                      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-1">
                        {galerie.slice(1, 4).map((url, index) => (
                          <button
                            key={url}
                            type="button"
                            onClick={() => setPhotoOuverte(index + 1)}
                            aria-label={`Voir la photo ${index + 2} de ${nom} en grand`}
                            className="group relative aspect-square overflow-hidden rounded-xl border border-champagne/10 bg-nuit transition hover:border-cuivre/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cuivre sm:aspect-[4/3]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`Photo ${index + 2} de ${nom}`}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Colonne de droite */}
              <div className="space-y-4">
                {(profil.intentions?.length ?? 0) > 0 && (
                  <SectionProfil titre="Ce qu’il cherche" icone={Target}>
                    <ul className="flex flex-wrap gap-2">
                      {profil.intentions?.map((intention) => (
                        <li
                          key={intention}
                          className="rounded-full border border-champagne/15 bg-nuit/40 px-3.5 py-2 text-[12.5px] text-champagne/85"
                        >
                          {INTENTIONS[intention] ?? intention}
                        </li>
                      ))}
                    </ul>
                  </SectionProfil>
                )}

                {(profil.interets?.length ?? 0) > 0 && (
                  <SectionProfil titre="Centres d’intérêt" icone={Sparkle}>
                    <ul className="flex flex-wrap gap-2">
                      {profil.interets?.map((interet) => {
                        const entree = INTERETS[interet];
                        const Icone = entree?.icone;

                        return (
                          <li
                            key={interet}
                            className="flex items-center gap-2 rounded-full border border-champagne/15 bg-nuit/40 px-3.5 py-2 text-[12.5px] text-champagne/85"
                          >
                            {Icone && (
                              <Icone size={13} className="text-cuivre" aria-hidden="true" />
                            )}
                            {entree?.label ?? interet}
                          </li>
                        );
                      })}
                    </ul>
                  </SectionProfil>
                )}

                {profil.bio && (
                  <SectionProfil titre="À propos" icone={Quote}>
                    <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-champagne/80">
                      {profil.bio}
                    </p>
                  </SectionProfil>
                )}

                {/*
                  Affinités partagées.

                  Ce sont des intersections calculées par l'API : un centre
                  d'intérêt ou une intention que vous avez cochés tous les
                  deux. Pas de pourcentage — un score inventé sur cette
                  donnée serait présenté comme une mesure alors qu'il n'en
                  est pas une.
                */}
                {!apercu && relation && !relation.estMonProfil && (
                  <SectionProfil titre="Ce que vous partagez" icone={Users2}>
                    {affinites.interets.length + affinites.intentions.length === 0 ? (
                      <p className="text-[13px] leading-relaxed text-champagne/65">
                        Rien de commun dans vos centres d’intérêt ni dans vos
                        intentions pour l’instant. Ça ne dit pas grand-chose
                        d’une rencontre — ça dit seulement ce que deux
                        formulaires ont en commun.
                      </p>
                    ) : (
                      <>
                        <ul className="flex flex-wrap gap-2">
                          {affinites.intentions.map((intention) => (
                            <li
                              key={`int-${intention}`}
                              className="flex items-center gap-2 rounded-full border border-cuivre/35 bg-cuivre/10 px-3.5 py-2 text-[12.5px] text-champagne"
                            >
                              <Check size={13} className="text-cuivre" aria-hidden="true" />
                              {INTENTIONS[intention] ?? intention}
                            </li>
                          ))}

                          {affinites.interets.map((interet) => {
                            const entree = INTERETS[interet];
                            const Icone = entree?.icone;

                            return (
                              <li
                                key={`ins-${interet}`}
                                className="flex items-center gap-2 rounded-full border border-cuivre/35 bg-cuivre/10 px-3.5 py-2 text-[12.5px] text-champagne"
                              >
                                {Icone && (
                                  <Icone size={13} className="text-cuivre" aria-hidden="true" />
                                )}
                                {entree?.label ?? interet}
                              </li>
                            );
                          })}
                        </ul>

                        <p className="mt-4 flex items-start gap-2 text-[11.5px] leading-relaxed text-champagne/55">
                          <Info size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                          Ce que vous avez coché l’un et l’autre, rien de plus.
                        </p>
                      </>
                    )}
                  </SectionProfil>
                )}

                {/* Profil encore vide */}
                {profilVide && (
                  <SectionProfil titre="Profil en cours" icone={UserRound}>
                    <p className="text-[13px] leading-relaxed text-champagne/65">
                      {nom} n’a pas encore rempli sa description. L’identité,
                      elle, est vérifiée.
                    </p>
                  </SectionProfil>
                )}
              </div>
            </div>

            {/*
              Barre d'actions basse.

              Elle se décale au-dessus de la barre d'onglets mobile, qui
              occupe 68 px en bas sous `lg` : collée à zéro, elle lui
              passerait dessous et deviendrait inatteignable au pouce.
            */}
            {!apercu && relation && !relation.estMonProfil && !relation.estUnMatch && (
              <div className="sticky bottom-[calc(68px+env(safe-area-inset-bottom))] z-30 mt-4 rounded-2xl border border-champagne/12 bg-minuit/95 px-5 py-4 backdrop-blur-md lg:bottom-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-start gap-3 text-[13px] leading-relaxed text-champagne/85">
                    <Heart size={18} className="mt-0.5 shrink-0 text-cuivre" aria-hidden="true" />
                    <span>
                      <span className="font-semibold text-champagne">
                        Ce profil t’intéresse&nbsp;?
                      </span>
                      <br />
                      {nom} ne saura rien tant que ce n’est pas réciproque.
                    </span>
                  </p>

                  <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row">
                    <button
                      type="button"
                      onClick={aimer}
                      disabled={likeEnCours || relation.dejaAime}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-[13px] font-bold transition-opacity ${focusRing} ${
                        relation.dejaAime
                          ? "cursor-default border border-cuivre/40 bg-cuivre/10 text-champagne"
                          : "bg-degrade-cuivre text-nuit hover:opacity-90 disabled:opacity-60"
                      }`}
                    >
                      <Heart
                        size={15}
                        aria-hidden="true"
                        className={relation.dejaAime ? "fill-current" : undefined}
                      />
                      {relation.dejaAime ? "Profil aimé" : "Aimer ce profil"}
                    </button>

                    <button
                      type="button"
                      onClick={ecarter}
                      disabled={ecarteEnCours}
                      title="Ce profil ne te sera plus proposé dans Explorer ni dans le Circle."
                      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-champagne/20 px-6 py-3 text-[13px] font-semibold text-champagne/85 transition-colors hover:border-champagne/40 disabled:opacity-60 ${focusRing}`}
                    >
                      {ecarteEnCours ? (
                        <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                      ) : (
                        <X size={15} aria-hidden="true" />
                      )}
                      Passer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {profil && (
        <ReportModal
          isOpen={signalementOuvert}
          targetId={profil._id}
          targetType="user"
          onClose={() => setSignalementOuvert(false)}
        />
      )}

      <VisionneusePhotos
        photos={galerie}
        indexOuvert={photoOuverte}
        onFermer={() => setPhotoOuverte(null)}
        onChanger={setPhotoOuverte}
        nom={nom}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────

function SectionProfil({
  titre,
  icone: Icone,
  children,
}: {
  titre: string;
  icone: React.ComponentType<{ size?: number | string; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-champagne/10 bg-minuit p-5 sm:p-6">
      <h2 className="font-display mb-4 flex items-center gap-2.5 text-[20px] font-normal text-ivoire">
        <Icone size={18} className="text-cuivre" aria-hidden="true" />
        {titre}
      </h2>

      {children}
    </section>
  );
}

// ─────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────

export default function PageProfil() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-nuit">
          <Loader2
            className="h-7 w-7 animate-spin text-cuivre"
            aria-hidden="true"
          />
          <span className="sr-only">Chargement</span>
        </div>
      }
    >
      <ContenuProfil />
    </Suspense>
  );
}
