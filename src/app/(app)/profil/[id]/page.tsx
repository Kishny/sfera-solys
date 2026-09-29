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
  Eye,
  Flag,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  Quote,
  ShieldCheck,
  Sparkle,
  Target,
  UserRound,
} from "lucide-react";

import ReportModal from "@/components/ReportModal";
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
}

interface Relation {
  estMonProfil: boolean;
  dejaAime: boolean;
  estUnMatch: boolean;
  matchId: string | null;
}

// ─────────────────────────────────────────────
// Libellés
// ─────────────────────────────────────────────

/** Au masculin : Sfera'Solys est la version hommes. */
const ORIENTATIONS: Record<string, string> = {
  hetero: "Hétérosexuel",
  homo: "Homosexuel",
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

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss";

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

  const profilVide =
    profil &&
    !profil.bio &&
    (profil.intentions?.length ?? 0) === 0 &&
    (profil.interets?.length ?? 0) === 0;

  return (
    <div className="min-h-screen bg-abyss px-4 py-6 text-cream sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-3xl">
        {/* Mode aperçu */}
        {apercu && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange/30 bg-orange/10 px-4 py-3">
            <p className="flex items-center gap-2.5 text-[13px] leading-relaxed text-cream/85">
              <Eye size={15} className="shrink-0 text-orange" aria-hidden="true" />
              <span>
                <strong className="text-cream">Aperçu</strong> — voici ton profil
                tel que les autres membres le voient.
              </span>
            </p>

            <button
              type="button"
              onClick={() => window.close()}
              className={`shrink-0 rounded-xl border border-cream/15 px-3.5 py-1.5 text-[12px] font-semibold text-cream/80 transition-colors hover:border-cream/30 hover:text-cream ${focusRing}`}
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
              className={`group inline-flex items-center gap-2 rounded-xl border border-cream/12 px-3.5 py-2 text-[13px] font-semibold text-cream/75 transition-colors hover:border-cream/25 hover:text-cream ${focusRing}`}
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
                className={`inline-flex items-center gap-1.5 rounded-xl border border-cream/12 px-3.5 py-2 text-[12px] font-semibold text-cream/60 transition-colors hover:border-orange/40 hover:text-cream ${focusRing}`}
              >
                <Flag size={13} aria-hidden="true" />
                Signaler
              </button>
            )}
          </div>
        )}

        {/* Chargement */}
        {chargement && (
          <div className="flex flex-col items-center gap-3 py-24">
            <Loader2
              className="h-7 w-7 animate-spin text-orange"
              aria-hidden="true"
            />
            <p className="text-[13px] text-cream/55">Chargement du profil…</p>
          </div>
        )}

        {/* Erreur */}
        {!chargement && erreur && (
          <div className="rounded-2xl border border-cream/10 bg-[#123243] px-6 py-16 text-center">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange/15">
              <AlertCircle size={22} className="text-orange" aria-hidden="true" />
            </span>

            <h1 className="font-display [font-stretch:125%] text-[19px] font-bold text-cream">
              Profil indisponible
            </h1>

            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-cream/60">
              {erreur}
            </p>

            <button
              type="button"
              onClick={revenir}
              className={`mt-6 inline-flex items-center gap-2 rounded-xl border border-cream/15 px-5 py-2.5 text-[13px] font-semibold text-cream transition-colors hover:border-cream/30 ${focusRing}`}
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
            className="space-y-4 sm:space-y-5"
          >
            {/* Identité */}
            <section className="overflow-hidden rounded-[1.75rem] border border-cream/10 bg-[#123243]">
              <div className="flex flex-col items-center gap-5 p-5 text-center sm:flex-row sm:items-center sm:gap-6 sm:p-7 sm:text-left">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cream/12 bg-abyss sm:h-28 sm:w-28">
                  {profil.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profil.image}
                      alt={`Photo de ${nom}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span
                      className="font-display [font-stretch:125%] text-[34px] font-extrabold text-cream/60"
                      aria-hidden="true"
                    >
                      {nom.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h1 className="font-display [font-stretch:125%] min-w-0 max-w-full truncate text-[24px] font-extrabold leading-tight tracking-tight text-cream sm:text-[30px]">
                      {profil.pseudonyme || "Membre"}
                    </h1>

                    {profil.identityVerified && (
                      <span className="flex items-center gap-1 rounded-full bg-lime/15 px-2.5 py-1 text-[11px] font-bold text-lime">
                        <ShieldCheck size={12} aria-hidden="true" />
                        Vérifié
                      </span>
                    )}

                    {relation?.estUnMatch && (
                      <span className="rounded-full bg-orange px-2.5 py-1 text-[11px] font-bold text-abyss">
                        En relation
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[13px] text-cream/60 sm:justify-start">
                    {profil.age && <span>{profil.age} ans</span>}

                    {lieu && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} aria-hidden="true" />
                        {lieu}
                      </span>
                    )}

                    {profil.orientation && (
                      <span>
                        {ORIENTATIONS[profil.orientation] ?? profil.orientation}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Photos */}
            {profil.photos && profil.photos.length > 0 && (
              <section
                aria-label={`Photos de ${nom}`}
                className="rounded-2xl border border-cream/10 bg-[#123243] p-3 sm:p-4"
              >
                <ul className="flex gap-2.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {profil.photos.map((url, index) => (
                    <li
                      key={url}
                      className="aspect-[4/5] w-36 shrink-0 overflow-hidden rounded-xl border border-cream/10 bg-abyss sm:w-44"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`${nom}, photo ${index + 1} sur ${profil.photos?.length}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Bio */}
            {profil.bio && (
              <SectionProfil titre="À propos" icone={Quote}>
                <p className="whitespace-pre-line text-[14px] leading-relaxed text-cream/80">
                  {profil.bio}
                </p>
              </SectionProfil>
            )}

            {/* Intentions */}
            {(profil.intentions?.length ?? 0) > 0 && (
              <SectionProfil titre="Ce qu’il cherche" icone={Target}>
                <ul className="flex flex-wrap gap-2">
                  {profil.intentions?.map((intention) => (
                    <li
                      key={intention}
                      className="rounded-full border border-orange/35 bg-orange/[0.12] px-3 py-1.5 text-[12px] font-semibold text-cream"
                    >
                      {INTENTIONS[intention] ?? intention}
                    </li>
                  ))}
                </ul>
              </SectionProfil>
            )}

            {/* Intérêts */}
            {(profil.interets?.length ?? 0) > 0 && (
              <SectionProfil titre="Centres d’intérêt" icone={Sparkle}>
                <ul className="flex flex-wrap gap-2">
                  {profil.interets?.map((interet) => (
                    <li
                      key={interet}
                      className="rounded-full border border-cream/12 px-3 py-1.5 text-[12px] text-cream/70"
                    >
                      {interet}
                    </li>
                  ))}
                </ul>
              </SectionProfil>
            )}

            {/* Profil encore vide */}
            {profilVide && (
              <section className="rounded-2xl border border-cream/10 bg-[#123243] px-6 py-10 text-center">
                <UserRound
                  size={24}
                  className="mx-auto mb-3 text-cream/60"
                  aria-hidden="true"
                />

                <p className="font-display [font-stretch:125%] text-[16px] font-bold text-cream">
                  Profil encore discret
                </p>

                <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-cream/60">
                  {relation?.estMonProfil
                    ? "Ton profil est vérifié, mais vide. Une description et quelques intentions changent tout pour qui te découvre."
                    : "Ce membre n’a pas encore rempli sa description. L’identité, elle, est vérifiée."}
                </p>
              </section>
            )}

            {/* Action */}
            {relation && !relation.estMonProfil && (
              <section className="rounded-2xl border border-cream/10 bg-[#123243] p-5 sm:p-6">
                {relation.estUnMatch && relation.matchId ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-display [font-stretch:125%] text-[15px] font-bold text-cream">
                        Vous êtes en relation
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-cream/60">
                        La conversation est ouverte. Un match n’oblige à rien.
                      </p>
                    </div>

                    <Link
                      href={`/messages/${relation.matchId}`}
                      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-orange px-5 py-3 text-[13px] font-bold text-abyss transition-colors hover:bg-orange/90 ${focusRing}`}
                    >
                      <MessageCircle size={15} aria-hidden="true" />
                      Écrire
                    </Link>
                  </div>
                ) : relation.dejaAime ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-display [font-stretch:125%] text-[15px] font-bold text-cream">
                        Tu as aimé ce profil
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-cream/60">
                        Si c’est réciproque, la conversation s’ouvrira. Rien
                        n’est envoyé à {nom} en attendant.
                      </p>
                    </div>

                    <span className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-lime/15 px-5 py-3 text-[13px] font-bold text-lime">
                      <Heart size={15} className="fill-lime" aria-hidden="true" />
                      Aimé
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-display [font-stretch:125%] text-[15px] font-bold text-cream">
                        Ce profil t’intéresse ?
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-cream/60">
                        {nom} ne saura rien tant que ce n’est pas réciproque.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={aimer}
                      disabled={likeEnCours}
                      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-orange px-5 py-3 text-[13px] font-bold text-abyss transition-colors hover:bg-orange/90 disabled:opacity-50 ${focusRing}`}
                    >
                      {likeEnCours ? (
                        <Loader2
                          size={15}
                          className="animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Heart size={15} aria-hidden="true" />
                      )}
                      Aimer ce profil
                    </button>
                  </div>
                )}

                {erreurLike && (
                  <p
                    role="alert"
                    className="mt-4 flex items-start gap-2 rounded-xl border border-orange/30 bg-orange/10 px-3.5 py-2.5 text-[12px] leading-relaxed text-cream/85"
                  >
                    <AlertCircle
                      size={14}
                      className="mt-0.5 shrink-0 text-orange"
                      aria-hidden="true"
                    />
                    {erreurLike}
                  </p>
                )}
              </section>
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
    <section className="rounded-2xl border border-cream/10 bg-[#123243] p-5 sm:p-6">
      <h2 className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-cream/70">
        <Icone size={13} className="text-orange" aria-hidden="true" />
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
        <div className="flex min-h-screen items-center justify-center bg-abyss">
          <Loader2
            className="h-7 w-7 animate-spin text-orange"
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
