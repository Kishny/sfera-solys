// src/app/(app)/mon-compte/page.tsx

"use client";

/**
 * Espace compte.
 *
 * ## La découpe
 *
 * Cette page était **un seul fichier de 3 344 lignes** : types, libellés,
 * helpers, orchestration, six onglets, deux modales et trois sous-composants.
 * Rien n'y était relisable isolément, et corriger un détail d'un onglet
 * imposait de faire défiler l'ensemble.
 *
 * Ce fichier ne garde plus que l'orchestration : session, chargement du profil,
 * brouillon d'édition, sauvegarde, onglets. Chaque onglet vit dans
 * `_composants/`, et ce qui est réellement partagé dans `_composants/types.ts`.
 *
 * ## Ce qui disparaît avec la refonte
 *
 * - **Le fond dégradé violet/rose** et ses trois orbes flous : la page vit
 *   maintenant dans le groupe `(app)`, sur `abyss`, avec la sidebar comme
 *   navigation. La barre du haut (logo, déconnexion) faisait doublon avec elle.
 * - **`planAccent`**, qui donnait à chaque offre sa propre teinte — un second
 *   système de couleurs superposé à celui de la marque.
 * - **La classe globale `.input-solys`** et ses keyframes injectées en
 *   `<style jsx global>` : des styles de formulaire en CSS brut au milieu d'une
 *   page Tailwind, avec un violet codé en dur dans l'anneau de focus.
 * - **Les emojis** : 68 lignes en portaient, y compris en illustration
 *   `text-4xl` dans les états vides. Remplacés par des icônes.
 *
 * ## Une barrière qui existait vraiment
 *
 * Contrairement à ce que j'avais d'abord noté dans CLAUDE.md, `identityVerified`
 * **est** utilisé comme barrière : cette page renvoie vers `/inscription` tout
 * compte dont le profil est complet mais l'identité non vérifiée. C'est une
 * garde côté client, sur une seule page — donc pas la barrière serveur que la
 * promesse « aucun accès au produit avant vérification » suppose — mais elle
 * existe et elle est conservée telle quelle.
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Eye,
  Loader2,
  MapPin,
  Pencil,
  Save,
  Shield,
  X,
} from "lucide-react";

import {
  carte,
  focusRing,
  formaterDate,
  libelleOffre,
  membreVide,
  normaliserMembre,
  offreActive,
  onglets,
  variantesOnglet,
  type MembreSolys,
  type ProfileVisibility,
  type TabId,
} from "./_composants/types";

import AnneauCompletion from "./_composants/AnneauCompletion";
import OngletAccueil from "./_composants/OngletAccueil";
import OngletProfil from "./_composants/OngletProfil";
import OngletPreferences from "./_composants/OngletPreferences";
import OngletAbonnement from "./_composants/OngletAbonnement";
import OngletSecurite from "./_composants/OngletSecurite";
import OngletInteractions from "./_composants/OngletInteractions";

function ContenuMonCompte() {
  const router = useRouter();
  const parametres = useSearchParams();
  const { data: session, status } = useSession();

  const [ongletActif, setOngletActif] = useState<TabId>("dashboard");
  const [user, setUser] = useState<MembreSolys>(membreVide);
  const [brouillon, setBrouillon] = useState<MembreSolys>(membreVide);

  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [edition, setEdition] = useState(false);

  const [erreur, setErreur] = useState("");
  const [paiementRecu, setPaiementRecu] = useState(false);

  /** Notifications non lues — pastille de l'onglet Interactions. */
  const [notifications, setNotifications] = useState(0);

  const lireNotifications = useCallback(async () => {
    try {
      const reponse = await fetch("/api/notifications", { cache: "no-store" });
      const donnees = await reponse.json().catch(() => null);

      if (reponse.ok && donnees?.success) {
        setNotifications(
          typeof donnees.total === "number" ? donnees.total : 0
        );
      }
    } catch {
      // Silencieux : une erreur de notifications ne bloque pas la page.
    }
  }, []);

  /** Marque les notifications lues — à l'ouverture de l'onglet, pas avant. */
  const marquerNotificationsLues = useCallback(async () => {
    setNotifications(0);

    try {
      await fetch("/api/notifications", { method: "POST" });
    } catch {
      // Silencieux.
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth?mode=login");
  }, [status, router]);

  const lireProfil = useCallback(async () => {
    setChargement(true);
    setErreur("");

    try {
      const reponse = await fetch("/api/users/profile", { cache: "no-store" });
      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || !donnees?.success) {
        setErreur(donnees?.error || "Impossible de récupérer ton profil.");
        return;
      }

      // L'API renvoie le profil et un bloc premium calculé : on fusionne.
      const normalise = normaliserMembre(
        { ...donnees.user, ...(donnees.premium || {}) },
        session?.user
      );

      setUser(normalise);
      setBrouillon(normalise);
    } catch {
      setErreur("Connexion interrompue.");
    } finally {
      setChargement(false);
    }
  }, [session?.user]);

  useEffect(() => {
    if (status === "authenticated") {
      void lireProfil();
      void lireNotifications();
    }
  }, [status, lireProfil, lireNotifications]);

  /**
   * Vérification d'identité obligatoire.
   *
   * Un profil complet mais non vérifié est renvoyé vers `/inscription`, qui
   * affiche l'étape de vérification. Les comptes admin en sont exemptés.
   */
  useEffect(() => {
    if (status !== "authenticated" || chargement) return;
    if (user.role === "admin") return;

    if (user.hasCompletedProfile && !user.identityVerified) {
      router.replace("/inscription");
    }
  }, [
    status,
    chargement,
    user.role,
    user.hasCompletedProfile,
    user.identityVerified,
    router,
  ]);

  /** Ouverture directe d'un onglet : /mon-compte?tab=premium */
  useEffect(() => {
    const demande = parametres.get("tab") as TabId | null;

    if (
      demande &&
      onglets.some((item) => item.id === demande) &&
      status === "authenticated"
    ) {
      setOngletActif(demande);
    }
  }, [parametres, status]);

  useEffect(() => {
    if (ongletActif === "connexions") void marquerNotificationsLues();
  }, [ongletActif, marquerNotificationsLues]);

  /**
   * Retour après paiement Stripe.
   *
   * Le retour navigateur ne prouve pas que l'abonnement est actif : le webhook
   * Stripe reste la source de vérité. Le bandeau le dit.
   */
  useEffect(() => {
    if (status !== "authenticated") return;
    if (parametres.get("payment") !== "success") return;

    setPaiementRecu(true);
    void lireProfil();
    setOngletActif("premium");

    const minuteur = window.setTimeout(() => setPaiementRecu(false), 8000);
    return () => window.clearTimeout(minuteur);
  }, [parametres, status, lireProfil]);

  const completion = useMemo(() => {
    const champs = [
      user.pseudonyme,
      user.email,
      user.age,
      user.orientation,
      user.intentions?.length,
      user.localisation,
      user.question,
      // `reponse` n'est jamais renvoyée par l'API : on lit `hasReponse`.
      user.hasReponse,
      user.interets?.length,
      user.visibilite,
    ];

    /**
     * `consentement` et `rayon` sont volontairement absents : le premier vaut
     * `true` dès l'inscription, le second a une valeur par défaut. Les compter
     * faisait démarrer le pourcentage à un niveau qu'aucun remplissage ne
     * justifiait.
     */
    return Math.round((champs.filter(Boolean).length / champs.length) * 100);
  }, [user]);

  const offre = libelleOffre(user);
  const payante = offreActive(user);
  const ongletEditable = ongletActif === "profil" || ongletActif === "preferences";

  const majBrouillon = <K extends keyof MembreSolys>(
    cle: K,
    valeur: MembreSolys[K]
  ) => {
    setBrouillon((precedent) => ({ ...precedent, [cle]: valeur }));
  };

  const versTableau = (valeur: string) =>
    valeur
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  /**
   * Sauvegarde du profil.
   *
   * Cette route ne touche jamais au plan, à `isPremium` ni au statut
   * d'abonnement : ces champs viennent du webhook Stripe.
   */
  const enregistrer = async () => {
    setEnregistrement(true);
    setErreur("");

    try {
      const reponse = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pseudonyme: brouillon.pseudonyme,
          age: brouillon.age,
          orientation: brouillon.orientation,
          intentions: brouillon.intentions,
          localisation: brouillon.localisation,
          departement: brouillon.departement,
          rayon: brouillon.rayon,
          question: brouillon.question,
          /**
           * La réponse secrète ne part que si elle a été saisie : une chaîne
           * vide ne doit jamais écraser celle déjà enregistrée.
           */
          ...(brouillon.reponse?.trim()
            ? { reponse: brouillon.reponse.trim() }
            : {}),
          interets: brouillon.interets,
          visibilite: brouillon.visibilite,
          consentement: brouillon.consentement,
          hasCompletedProfile: true,
          bio: brouillon.bio,
          image: brouillon.image,
        }),
      });

      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || !donnees?.success) {
        setErreur(donnees?.error || "Impossible d’enregistrer ces changements.");
        return;
      }

      const misAJour = normaliserMembre(
        { ...user, ...donnees.user, ...(donnees.premium || {}) },
        session?.user
      );

      setUser(misAJour);
      setBrouillon(misAJour);
      setEdition(false);
    } catch {
      setErreur("Connexion interrompue. Rien n’a été enregistré.");
    } finally {
      setEnregistrement(false);
    }
  };

  const annuler = () => {
    setBrouillon(user);
    setEdition(false);
  };

  /** Changement rapide de visibilité, sans passer par le mode édition. */
  const changerVisibilite = async (visibilite: ProfileVisibility) => {
    setErreur("");

    try {
      const reponse = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibilite }),
      });

      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || !donnees?.success) {
        setErreur(donnees?.error ?? "Impossible de changer ta visibilité.");
        return;
      }

      const misAJour = normaliserMembre(
        { ...user, ...donnees.user, ...(donnees.premium || {}) },
        session?.user
      );

      setUser(misAJour);
      setBrouillon(misAJour);
    } catch {
      setErreur("Connexion interrompue.");
    }
  };

  if (status === "loading" || chargement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-abyss">
        <div className="text-center">
          <Loader2
            className="mx-auto h-8 w-8 animate-spin text-orange"
            aria-hidden="true"
          />
          <p className="mt-3 text-[13px] text-cream/55">
            Chargement de ton espace…
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-abyss px-4 py-6 text-cream sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-3xl">
        {/* Paiement reçu */}
        <AnimatePresence>
          {paiementRecu && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-5 rounded-2xl border border-lime/25 bg-lime/10 px-4 py-3.5"
            >
              <p className="text-[13px] font-bold text-cream">
                Paiement reçu. L’activation est en cours de confirmation.
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-cream/70">
                Le retour de la page de paiement ne prouve pas à lui seul que
                l’abonnement est actif : c’est Stripe qui confirme, par webhook.
                Si rien ne bouge d’ici quelques minutes, utilise
                « Synchroniser » dans l’onglet Abonnement.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Erreur */}
        <AnimatePresence>
          {erreur && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 overflow-hidden"
            >
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border border-orange/30 bg-orange/10 px-4 py-3"
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Identité */}
        <section className={`${carte} mb-5 p-4 sm:p-6`}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="mx-auto shrink-0 sm:mx-0">
              <AnneauCompletion completion={completion} taille={88}>
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-cream/12 bg-abyss">
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.image}
                      alt={`Photo de ${user.pseudonyme}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-display [font-stretch:125%] text-[26px] font-extrabold text-cream/45">
                      {user.pseudonyme.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </AnneauCompletion>
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="font-display [font-stretch:125%] min-w-0 max-w-full truncate text-[22px] font-extrabold tracking-tight text-cream">
                  {user.pseudonyme}
                </h1>

                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    payante
                      ? "bg-orange text-abyss"
                      : "border border-cream/15 text-cream/70"
                  }`}
                >
                  {payante ? offre : "Offre gratuite"}
                </span>

                {user.identityVerified && (
                  <span className="flex items-center gap-1 rounded-full bg-lime/15 px-2.5 py-0.5 text-[11px] font-bold text-lime">
                    <Shield size={11} aria-hidden="true" />
                    Vérifié
                  </span>
                )}
              </div>

              <p className="mt-1 truncate text-[13px] text-cream/60">
                {user.email}
              </p>

              {user.localisation && (
                <p className="mt-1 flex items-center justify-center gap-1.5 text-[12px] text-cream/55 sm:justify-start">
                  <MapPin size={12} aria-hidden="true" />
                  {user.localisation}
                </p>
              )}

              <p className="mt-2 text-[11px] text-cream/55">
                Membre depuis {formaterDate(user.createdAt)} · profil complété à{" "}
                {completion} %
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-center gap-2 sm:items-end">
              {user._id && (
                <Link
                  href={`/profil/${user._id}?preview=1`}
                  target="_blank"
                  className={`inline-flex items-center gap-1.5 rounded-xl border border-cream/15 px-3.5 py-2 text-[12px] font-semibold text-cream/80 transition-colors hover:border-cream/30 hover:text-cream ${focusRing}`}
                >
                  <Eye size={13} aria-hidden="true" />
                  Voir mon profil public
                </Link>
              )}

              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className={`inline-flex items-center gap-1.5 rounded-xl border border-orange/40 px-3.5 py-2 text-[12px] font-semibold text-orange transition-colors hover:bg-orange/10 ${focusRing}`}
                >
                  Administration
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Onglets */}
        <nav
          aria-label="Sections du compte"
          className="mb-5 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {onglets.map((onglet) => {
            const actif = ongletActif === onglet.id;
            const pastille = onglet.id === "connexions" && notifications > 0;
            const Icone = onglet.icon;

            return (
              <button
                key={onglet.id}
                type="button"
                aria-current={actif ? "page" : undefined}
                onClick={() => {
                  setOngletActif(onglet.id);
                  if (edition) annuler();
                }}
                className={`relative flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[12px] font-semibold transition-colors ${focusRing} ${
                  actif
                    ? "border-orange bg-orange text-abyss"
                    : "border-cream/12 text-cream/70 hover:border-cream/25 hover:text-cream"
                }`}
              >
                <Icone size={13} aria-hidden="true" />
                {onglet.label}

                {pastille && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 text-[10px] font-bold ${
                      actif ? "bg-abyss text-orange" : "bg-orange text-abyss"
                    }`}
                  >
                    {notifications > 99 ? "99+" : notifications}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Contenu */}
        <AnimatePresence mode="wait">
          <motion.div
            key={ongletActif}
            variants={variantesOnglet}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {ongletActif === "dashboard" && (
              <OngletAccueil
                user={user}
                completion={completion}
                onOnglet={setOngletActif}
              />
            )}

            {ongletActif === "profil" && (
              <OngletProfil
                user={brouillon}
                edition={edition}
                majBrouillon={majBrouillon}
                versTableau={versTableau}
                onPhotosEnregistrees={lireProfil}
              />
            )}

            {ongletActif === "preferences" && (
              <OngletPreferences
                user={brouillon}
                edition={edition}
                majBrouillon={majBrouillon}
                versTableau={versTableau}
                onVisibilite={changerVisibilite}
              />
            )}

            {ongletActif === "premium" && (
              <OngletAbonnement
                user={user}
                router={router}
                onRafraichir={lireProfil}
              />
            )}

            {ongletActif === "securite" && <OngletSecurite user={user} />}

            {ongletActif === "connexions" && <OngletInteractions user={user} />}

            {ongletEditable && (
              <div className="mt-5 flex flex-col justify-end gap-2.5 sm:flex-row">
                {!edition ? (
                  <button
                    type="button"
                    onClick={() => setEdition(true)}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange px-5 py-2.5 text-[13px] font-bold text-abyss transition-colors hover:bg-orange/90 sm:w-auto ${focusRing}`}
                  >
                    <Pencil size={14} aria-hidden="true" />
                    Modifier
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={annuler}
                      disabled={enregistrement}
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cream/15 px-4 py-2.5 text-[13px] font-semibold text-cream/80 transition-colors hover:border-cream/30 hover:text-cream disabled:opacity-50 sm:w-auto ${focusRing}`}
                    >
                      <X size={14} aria-hidden="true" />
                      Annuler
                    </button>

                    <button
                      type="button"
                      onClick={enregistrer}
                      disabled={enregistrement}
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange px-5 py-2.5 text-[13px] font-bold text-abyss transition-colors hover:bg-orange/90 disabled:opacity-50 sm:w-auto ${focusRing}`}
                    >
                      {enregistrement ? (
                        <Loader2
                          size={14}
                          className="animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Save size={14} aria-hidden="true" />
                      )}
                      {enregistrement ? "Enregistrement…" : "Sauvegarder"}
                    </button>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function PageMonCompte() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-abyss">
          <Loader2
            className="h-8 w-8 animate-spin text-orange"
            aria-hidden="true"
          />
          <span className="sr-only">Chargement</span>
        </div>
      }
    >
      <ContenuMonCompte />
    </Suspense>
  );
}
