/* src/app/auth/page.tsx */

"use client";

/**
 * Page d'authentification Sfera'Solys.
 *
 * ## La carte qui bascule
 *
 * Connexion et inscription ne sont plus deux onglets qui se remplacent, mais
 * deux moitiés d'une même carte. Le panneau solaire glisse d'un côté à
 * l'autre et découvre le formulaire qu'il cachait ; le discours qu'il porte
 * s'échange avec lui. La géométrie vit dans `auth.module.css`, pas ici.
 *
 * ## Ce qui a été corrigé au passage
 *
 * - **Le mot de passe était validé à 6 caractères côté page et à 8 côté
 *   serveur.** Un mot de passe de 6 ou 7 caractères passait la validation,
 *   partait au serveur, et revenait refusé. La page exige maintenant 8,
 *   comme `POST /api/auth/register`.
 * - **Les boutons Google et Apple s'affichaient toujours**, alors que les
 *   providers ne sont enregistrés côté NextAuth que si leurs variables
 *   d'environnement existent. Sans clés, le bouton menait à une page
 *   d'erreur. On lit maintenant `/api/auth/providers` — la route que NextAuth
 *   expose déjà — et on n'affiche que ce qui est réellement branché.
 * - **La liste d'arguments vantait « Cadeaux premium », « Événements VIP »,
 *   « App mobile exclusive » et un « Support 24h »** : rien de tout cela
 *   n'existe dans le code. Remplacée par les deux faits vérifiables de cette
 *   page — la vérification d'identité et le critère d'âge.
 */

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  AtSign,
  BadgeCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";

import styles from "./auth.module.css";

type SessionSolys = {
  id?: string;
  email?: string | null;
  role?: string;
  hasCompletedProfile?: boolean;
  identityVerified?: boolean;
};

/**
 * Les deux moitiés restent dans le DOM pendant qu'elles glissent : sans
 * précaution, la tabulation emmène dans le formulaire caché, et un lecteur
 * d'écran annonce deux champs « mot de passe ». `inert` retire toute une
 * branche du parcours clavier et de l'arbre d'accessibilité — l'attribut est
 * reconnu par les navigateurs, mais pas encore typé par React 18.
 */
function auRepos(actif: boolean) {
  /*
   * `inert=""` ne marche pas : React 18 traite la chaîne vide comme `false`
   * et n'écrit pas l'attribut du tout — il le dit même dans la console. Il
   * faut une chaîne non vide ; le navigateur, lui, ne regarde que la présence
   * de l'attribut.
   */
  return (actif ? {} : { inert: "true" }) as React.HTMLAttributes<HTMLDivElement>;
}

const messagesOAuth: Record<string, string> = {
  OAuthSignin: "La connexion n’a pas pu démarrer.",
  OAuthCallback: "Le retour du fournisseur a échoué.",
  OAuthCreateAccount: "Impossible de créer le compte avec ce fournisseur.",
  EmailCreateAccount: "Impossible de créer le compte avec cet email.",
  Callback: "Le retour du fournisseur a échoué.",
  OAuthAccountNotLinked:
    "Cet email est déjà rattaché à une autre méthode de connexion.",
  SessionRequired: "Connecte-toi pour accéder à cette page.",
  Default: "La connexion n’a pas abouti.",
};

/**
 * L'éclipse : le disque solaire, mordu par une ombre qui tourne autour.
 *
 * La morsure est un masque SVG, pas un disque sombre posé par-dessus. La
 * différence se voit : avec un disque, l'ombre était plus foncée que le
 * panneau et se lisait comme une seconde boule ; avec un masque, le soleil
 * est réellement découpé et c'est le dégradé du panneau — et la couronne —
 * qui apparaissent dans l'échancrure.
 */
function Eclipse() {
  return (
    <div className={styles.eclipse} aria-hidden="true">
      <div className={styles.couronne} />

      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="solys-soleil" cx="36%" cy="32%">
            <stop offset="0%" stopColor="#FFD9BE" />
            <stop offset="42%" stopColor="#FF4103" />
            <stop offset="100%" stopColor="#B82802" />
          </radialGradient>

          <mask id="solys-morsure">
            <circle cx="100" cy="100" r="56" fill="#fff" />
            {/* L'ombre tourne autour du soleil : l'éclipse avance sans fin. */}
            <g className={styles.orbite}>
              <circle cx="150" cy="74" r="56" fill="#000" />
            </g>
          </mask>
        </defs>

        <circle
          cx="100"
          cy="100"
          r="56"
          fill="url(#solys-soleil)"
          mask="url(#solys-morsure)"
        />

        {/* Deux orbites, qui tournent en sens inverse l'une de l'autre. */}
        <circle
          cx="100"
          cy="100"
          r="78"
          fill="none"
          stroke="#FFEBD1"
          strokeOpacity="0.16"
          strokeWidth="1"
        />
        <g className={styles.contreOrbite}>
          <circle
            cx="100"
            cy="100"
            r="94"
            fill="none"
            stroke="#FFEBD1"
            strokeOpacity="0.1"
            strokeWidth="1"
            strokeDasharray="3 9"
          />
        </g>
      </svg>
    </div>
  );
}

/** Champ de saisie : icône à gauche, trait solaire au focus. */
function Champ({
  rang,
  icone,
  erreur,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  rang: number;
  icone: React.ReactNode;
  erreur?: string;
}) {
  return (
    <div className={styles.monte} style={{ "--rang": rang } as React.CSSProperties}>
      <div className={`${styles.champ} ${erreur ? styles.champErreur : ""}`}>
        <input {...props} aria-invalid={erreur ? true : undefined} />
        <span className={styles.icone}>{icone}</span>
      </div>

      {erreur && (
        <p className="mt-1.5 text-[12px] text-cream/85" role="alert">
          {erreur}
        </p>
      )}
    </div>
  );
}

/** Champ mot de passe : même chose, plus l'œil. */
function ChampSecret({
  rang,
  erreur,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  rang: number;
  erreur?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.monte} style={{ "--rang": rang } as React.CSSProperties}>
      <div className={`${styles.champ} ${erreur ? styles.champErreur : ""}`}>
        <input
          {...props}
          type={visible ? "text" : "password"}
          aria-invalid={erreur ? true : undefined}
        />
        <span className={styles.icone}>
          <Lock size={15} aria-hidden="true" />
        </span>

        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className={styles.oeil}
          aria-label={
            visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
          }
        >
          {visible ? (
            <EyeOff size={15} aria-hidden="true" />
          ) : (
            <Eye size={15} aria-hidden="true" />
          )}
        </button>
      </div>

      {erreur && (
        <p className="mt-1.5 text-[12px] text-cream/85" role="alert">
          {erreur}
        </p>
      )}
    </div>
  );
}

/** Bouton d'envoi : reprend le `.fx-btn` du site, avec son balayage. */
function BoutonEnvoi({
  enCours,
  children,
  rang,
}: {
  enCours: boolean;
  children: React.ReactNode;
  rang: number;
}) {
  return (
    <div className={styles.monte} style={{ "--rang": rang } as React.CSSProperties}>
      <button
        type="submit"
        disabled={enCours}
        className="fx-btn relative mt-1 w-full overflow-hidden rounded-full bg-orange px-6 py-3.5 font-display text-[13px] font-bold uppercase tracking-[0.12em] text-abyss [font-stretch:125%] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex items-center justify-center gap-2">
          {enCours && (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          )}
          {children}
        </span>
      </button>
    </div>
  );
}

function Contenu() {
  const router = useRouter();
  const parametres = useSearchParams();
  const { data: session, status } = useSession();
  const mouvementReduit = useReducedMotion();

  const mode = parametres.get("mode");
  const erreurOAuth = parametres.get("error");

  const [connexion, setConnexion] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [succes, setSucces] = useState("");
  const [force, setForce] = useState(0);

  /** Fournisseurs réellement enregistrés côté NextAuth. */
  const [fournisseurs, setFournisseurs] = useState<string[]>([]);

  const carte = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === "register") setConnexion(false);
    if (mode === "login") setConnexion(true);
  }, [mode]);

  useEffect(() => {
    if (!erreurOAuth) return;
    setErreurs({
      form: messagesOAuth[erreurOAuth] ?? messagesOAuth.Default,
    });
  }, [erreurOAuth]);

  /**
   * NextAuth n'enregistre Google et Apple que si leurs variables
   * d'environnement existent. On demande la liste plutôt que de la supposer.
   */
  useEffect(() => {
    let vivant = true;

    fetch("/api/auth/providers", { cache: "no-store" })
      .then((reponse) => reponse.json())
      .then((donnees) => {
        if (!vivant || !donnees) return;
        setFournisseurs(Object.keys(donnees));
      })
      .catch(() => {});

    return () => {
      vivant = false;
    };
  }, []);

  /** Parallaxe discrète : la carte suit le curseur de quelques pixels. */
  useEffect(() => {
    const element = carte.current;
    if (!element || mouvementReduit) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const suivre = (evenement: PointerEvent) => {
      const zone = element.getBoundingClientRect();
      const x = (evenement.clientX - zone.left) / zone.width - 0.5;
      const y = (evenement.clientY - zone.top) / zone.height - 0.5;
      // Pas de transition pendant le suivi : elle ferait traîner la carte
      // derrière le curseur. Elle ne sert qu'au retour au repos.
      element.style.transition = "none";
      element.style.transform = `perspective(1400px) rotateX(${-y * 2.4}deg) rotateY(${x * 2.4}deg)`;
    };

    const relacher = () => {
      element.style.transition = "transform 0.5s cubic-bezier(0.2, 0.7, 0.3, 1)";
      element.style.transform = "";
    };

    element.addEventListener("pointermove", suivre);
    element.addEventListener("pointerleave", relacher);

    return () => {
      element.removeEventListener("pointermove", suivre);
      element.removeEventListener("pointerleave", relacher);
    };
  }, [mouvementReduit]);

  /** Redirection si la session existe déjà. */
  useEffect(() => {
    if (status !== "authenticated") return;

    const membre = session?.user as SessionSolys | undefined;
    const verifie =
      membre?.identityVerified === true || membre?.role === "admin";

    if (membre?.hasCompletedProfile === true && verifie) {
      router.replace("/mon-compte");
      return;
    }

    router.replace("/inscription");
  }, [status, session, router]);

  /**
   * Après une connexion réussie, on quitte cette page par une **vraie**
   * navigation, pas par `router.push`.
   *
   * `signIn(..., { redirect: false })` pose bien le cookie, mais le
   * `SessionProvider` de NextAuth garde en mémoire l'état qu'il avait avant —
   * « unauthenticated », puisqu'on était sur l'écran de connexion. Une
   * navigation côté client conserve cet état : la page d'arrivée lit un
   * statut périmé, sa propre garde de session conclut qu'on n'est pas
   * connecté, et renvoie ici. On revenait donc sur /auth sans le moindre
   * message d'erreur, en boucle.
   *
   * `window.location.assign` recharge l'application : le cookie est relu
   * côté serveur, la session est reconstruite, et la page d'arrivée voit la
   * vérité.
   */
  const redirigerApresConnexion = async () => {
    const reponse = await fetch("/api/auth/session", { cache: "no-store" });
    const fraiche = await reponse.json().catch(() => null);
    const membre = fraiche?.user as SessionSolys | undefined;

    const verifie =
      membre?.identityVerified === true || membre?.role === "admin";

    window.location.assign(
      membre?.hasCompletedProfile === true && verifie
        ? "/mon-compte"
        : "/inscription"
    );
  };

  const mesurerForce = (motDePasse: string) => {
    let score = 0;
    if (motDePasse.length >= 8) score += 25;
    if (/[A-Z]/.test(motDePasse)) score += 25;
    if (/[0-9]/.test(motDePasse)) score += 25;
    if (/[^A-Za-z0-9]/.test(motDePasse)) score += 25;
    setForce(score);
  };

  /**
   * Validation. Le seuil du mot de passe est à 8 caractères — celui de
   * `POST /api/auth/register`. Il était à 6 ici, donc la page laissait
   * passer des mots de passe que le serveur refusait ensuite.
   */
  const valider = (donnees: FormData, modeConnexion: boolean) => {
    const trouvees: Record<string, string> = {};

    const identifiant = String(donnees.get("email") || "").trim();
    const motDePasse = String(donnees.get("password") || "");
    const confirmation = String(donnees.get("confirmPassword") || "");
    const nom = String(donnees.get("name") || "").trim();
    const pseudonyme = String(donnees.get("pseudonyme") || "").trim();

    if (modeConnexion) {
      if (identifiant.length < 2) {
        trouvees.email = "Saisis ton email ou ton pseudonyme.";
      }

      if (!motDePasse) {
        trouvees.password = "Saisis ton mot de passe.";
      }
    } else {
      if (nom.length < 2) {
        trouvees.name = "Au moins 2 caractères.";
      }

      if (pseudonyme.length > 0) {
        if (pseudonyme.length < 2 || pseudonyme.length > 50) {
          trouvees.pseudonyme = "Entre 2 et 50 caractères.";
        } else if (!/^[a-zA-ZÀ-ÿ0-9 _-]+$/.test(pseudonyme)) {
          trouvees.pseudonyme =
            "Lettres, chiffres, espaces, tirets ou underscores.";
        }
      }

      if (!/^\S+@\S+\.\S+$/.test(identifiant)) {
        trouvees.email = "Adresse email invalide.";
      }

      if (motDePasse.length < 8) {
        trouvees.password = "Au moins 8 caractères.";
      }

      if (motDePasse !== confirmation) {
        trouvees.confirmPassword = "Les deux mots de passe diffèrent.";
      }
    }

    setErreurs(trouvees);
    return Object.keys(trouvees).length === 0;
  };

  const seConnecter = async (evenement: React.FormEvent<HTMLFormElement>) => {
    evenement.preventDefault();
    if (enCours) return;

    setEnCours(true);
    setErreurs({});
    setSucces("");

    const donnees = new FormData(evenement.currentTarget);

    if (!valider(donnees, true)) {
      setEnCours(false);
      return;
    }

    const email = String(donnees.get("email") || "")
      .toLowerCase()
      .trim();
    const password = String(donnees.get("password") || "");

    try {
      const resultat = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (!resultat?.ok) {
        setErreurs({ form: "Email ou mot de passe incorrect." });
        return;
      }

      await redirigerApresConnexion();
    } catch {
      setErreurs({ form: "Connexion interrompue." });
    } finally {
      setEnCours(false);
    }
  };

  const sInscrire = async (evenement: React.FormEvent<HTMLFormElement>) => {
    evenement.preventDefault();
    if (enCours) return;

    setEnCours(true);
    setErreurs({});
    setSucces("");

    const donnees = new FormData(evenement.currentTarget);

    if (!valider(donnees, false)) {
      setEnCours(false);
      return;
    }

    const name = String(donnees.get("name") || "").trim();
    const pseudonyme = String(donnees.get("pseudonyme") || "").trim();
    const email = String(donnees.get("email") || "")
      .toLowerCase()
      .trim();
    const password = String(donnees.get("password") || "");

    try {
      const reponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, pseudonyme, email, password }),
      });

      const resultat = await reponse.json().catch(() => null);

      if (!reponse.ok) {
        setErreurs({ form: resultat?.error || "L’inscription n’a pas abouti." });
        return;
      }

      setSucces("Compte créé. On t’emmène à la suite.");

      const connecte = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (!connecte?.ok) {
        setErreurs({
          form: "Compte créé, mais la connexion automatique a échoué. Connecte-toi à la main.",
        });
        return;
      }

      // Même raison que ci-dessus : navigation réelle, pas router.push.
      window.setTimeout(() => window.location.assign("/inscription"), 600);
    } catch {
      setErreurs({ form: "Connexion interrompue." });
    } finally {
      setEnCours(false);
    }
  };

  const viaFournisseur = async (fournisseur: "google" | "apple") => {
    if (enCours) return;
    setEnCours(true);
    setErreurs({});

    try {
      await signIn(fournisseur, { callbackUrl: "/auth", redirect: true });
    } catch {
      setErreurs({ form: "La connexion n’a pas pu démarrer." });
      setEnCours(false);
    }
  };

  const basculer = useCallback(
    (versConnexion: boolean) => {
      setConnexion(versConnexion);
      setErreurs({});
      setSucces("");
      router.replace(`/auth?mode=${versConnexion ? "login" : "register"}`, {
        scroll: false,
      });
    },
    [router]
  );

  const inscription = !connexion;

  const boutonsFournisseurs = (
    [
      { id: "google" as const, nom: "Google" },
      { id: "apple" as const, nom: "Apple" },
    ] as const
  ).filter((f) => fournisseurs.includes(f.id));

  const message = succes ? (
    <p
      className="flex items-start gap-2 rounded-xl border border-lime/25 bg-lime/[0.07] px-3.5 py-2.5 text-[12px] leading-relaxed text-cream/85"
      role="status"
    >
      <CheckCircle2
        size={14}
        className="mt-0.5 shrink-0 text-lime"
        aria-hidden="true"
      />
      {succes}
    </p>
  ) : erreurs.form ? (
    <p
      className="flex items-start gap-2 rounded-xl border border-orange/35 bg-orange/[0.08] px-3.5 py-2.5 text-[12px] leading-relaxed text-cream/85"
      role="alert"
    >
      <AlertCircle
        size={14}
        className="mt-0.5 shrink-0 text-orange"
        aria-hidden="true"
      />
      {erreurs.form}
    </p>
  ) : null;

  /**
   * Les fournisseurs tiers, affichés seulement s'ils existent vraiment.
   *
   * Ce bloc est une valeur, pas un composant défini dans le corps de la
   * fonction : un composant local serait un type neuf à chaque rendu, donc
   * remonté à chaque frappe, et son animation d'entrée repartirait de zéro.
   */
  const fournisseursRendus =
    boutonsFournisseurs.length === 0 ? null : (
      <div className={styles.monte} style={{ "--rang": 1 } as React.CSSProperties}>
        <div className="flex gap-2.5">
          {boutonsFournisseurs.map((fournisseur) => (
            <button
              key={fournisseur.id}
              type="button"
              onClick={() => viaFournisseur(fournisseur.id)}
              disabled={enCours}
              className="fx-ghost flex flex-1 items-center justify-center gap-2 rounded-xl border border-cream/12 px-3 py-2.5 text-[12px] font-semibold text-cream disabled:opacity-50"
            >
              {fournisseur.nom}
            </button>
          ))}
        </div>

        <p className="mt-3 text-center text-[11px] uppercase tracking-[0.14em] text-cream/55">
          ou avec ton email
        </p>
      </div>
    );

  return (
    <div className={styles.scene}>
      <div ref={carte} className={styles.carte}>
        {/* Le panneau solaire */}
        <div
          className={`${styles.voile} ${connexion ? styles.voileConnexion : ""}`}
          aria-hidden="true"
        >
          <Eclipse />
        </div>

        {/* Discours côté inscription : il invite à se connecter */}
        <div
          {...auRepos(inscription)}
          className={`${styles.pan} ${styles.panInscription} ${
            inscription ? styles.panActif : styles.panRepos
          }`}
        >
          <h2 className="font-display text-[30px] font-bold leading-tight [font-stretch:125%]">
            Déjà des nôtres&nbsp;?
          </h2>

          <p className="max-w-[16rem] text-[14px] leading-relaxed text-cream/80">
            Retrouve ton cercle, tes conversations et là où tu en étais.
          </p>

          <button
            type="button"
            onClick={() => basculer(true)}
            className="fx-ghost mt-2 rounded-full border border-cream/45 px-7 py-2.5 font-display text-[12px] font-bold uppercase tracking-[0.14em] text-cream [font-stretch:125%]"
          >
            Se connecter
          </button>
        </div>

        {/* Colonne inscription */}
        <div
          {...auRepos(inscription)}
          className={`${styles.colonne} ${styles.colonneInscription} ${
            inscription ? styles.colonneActive : styles.colonneRepos
          }`}
        >
          <div
            className={styles.monte}
            style={{ "--rang": 0 } as React.CSSProperties}
          >
            <h1 className="font-display text-[24px] font-bold leading-tight text-cream [font-stretch:125%]">
              Créer un compte
            </h1>
            <p className="mt-1 text-[13px] text-cream/60">
              Quelques secondes, puis on fait connaissance.
            </p>
          </div>

          {fournisseursRendus}

          <form onSubmit={sInscrire} className="flex flex-col gap-2.5">
            {message}

            <Champ
              rang={2}
              name="name"
              type="text"
              placeholder="Prénom ou nom"
              autoComplete="name"
              erreur={erreurs.name}
              icone={<User size={15} aria-hidden="true" />}
            />

            <Champ
              rang={3}
              name="pseudonyme"
              type="text"
              placeholder="Pseudonyme (facultatif)"
              autoComplete="nickname"
              erreur={erreurs.pseudonyme}
              icone={<AtSign size={15} aria-hidden="true" />}
            />

            <Champ
              rang={4}
              name="email"
              type="email"
              placeholder="Adresse email"
              autoComplete="email"
              erreur={erreurs.email}
              icone={<Mail size={15} aria-hidden="true" />}
            />

            <ChampSecret
              rang={5}
              name="password"
              placeholder="Mot de passe (8 caractères minimum)"
              autoComplete="new-password"
              erreur={erreurs.password}
              onChange={(evenement) => mesurerForce(evenement.target.value)}
            />

            {force > 0 && (
              <div
                className="h-1 overflow-hidden rounded-full bg-cream/10"
                role="presentation"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange to-lime transition-[width] duration-500"
                  style={{ width: `${force}%` }}
                />
              </div>
            )}

            <ChampSecret
              rang={6}
              name="confirmPassword"
              placeholder="Confirme le mot de passe"
              autoComplete="new-password"
              erreur={erreurs.confirmPassword}
            />

            <BoutonEnvoi rang={7} enCours={enCours}>
              Créer mon compte
            </BoutonEnvoi>
          </form>

          <p
            className={`${styles.monte} flex items-center justify-center gap-1.5 text-center text-[11px] leading-relaxed text-cream/60`}
            style={{ "--rang": 8 } as React.CSSProperties}
          >
            <BadgeCheck size={12} className="shrink-0" aria-hidden="true" />
            Identité vérifiée à l’inscription · 28 ans et plus
          </p>
        </div>

        {/* Discours côté connexion : il invite à s'inscrire */}
        <div
          {...auRepos(connexion)}
          className={`${styles.pan} ${styles.panConnexion} ${
            connexion ? styles.panActif : styles.panRepos
          }`}
        >
          <h2 className="font-display text-[30px] font-bold leading-tight [font-stretch:125%]">
            Première fois ici&nbsp;?
          </h2>

          <p className="max-w-[16rem] text-[14px] leading-relaxed text-cream/80">
            Un compte, une pièce d’identité vérifiée, et des profils qui
            existent vraiment.
          </p>

          <button
            type="button"
            onClick={() => basculer(false)}
            className="fx-ghost mt-2 rounded-full border border-cream/45 px-7 py-2.5 font-display text-[12px] font-bold uppercase tracking-[0.14em] text-cream [font-stretch:125%]"
          >
            Créer un compte
          </button>
        </div>

        {/* Colonne connexion */}
        <div
          {...auRepos(connexion)}
          className={`${styles.colonne} ${styles.colonneConnexion} ${
            connexion ? styles.colonneActive : styles.colonneRepos
          }`}
        >
          <div
            className={styles.monte}
            style={{ "--rang": 0 } as React.CSSProperties}
          >
            <h1 className="font-display text-[24px] font-bold leading-tight text-cream [font-stretch:125%]">
              Se connecter
            </h1>
            <p className="mt-1 text-[13px] text-cream/60">
              Content de te revoir.
            </p>
          </div>

          {fournisseursRendus}

          <form onSubmit={seConnecter} className="flex flex-col gap-2.5">
            {message}

            <Champ
              rang={2}
              name="email"
              type="text"
              placeholder="Email ou pseudonyme"
              autoComplete="username"
              erreur={erreurs.email}
              icone={<Mail size={15} aria-hidden="true" />}
            />

            <ChampSecret
              rang={3}
              name="password"
              placeholder="Mot de passe"
              autoComplete="current-password"
              erreur={erreurs.password}
            />

            <div
              className={styles.monte}
              style={{ "--rang": 4 } as React.CSSProperties}
            >
              <Link
                href="/auth/reset-password"
                className="fx-link text-[12px] text-cream/60 hover:text-cream"
              >
                Mot de passe oublié&nbsp;?
              </Link>
            </div>

            <BoutonEnvoi rang={5} enCours={enCours}>
              Se connecter
            </BoutonEnvoi>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function PageAuth() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-abyss font-sans text-cream">
      {/* Halos solaires, très lents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-[30rem] w-[30rem] rounded-full bg-orange/[0.09] blur-[120px]" />
        <div className="absolute bottom-[-10rem] right-1/5 h-[26rem] w-[26rem] rounded-full bg-rust/25 blur-[120px]" />
        <div className="absolute left-[-6rem] top-1/2 h-[18rem] w-[18rem] rounded-full bg-lime/[0.05] blur-[100px]" />
      </div>

      <div className="stars" />

      <Link
        href="/"
        aria-label="Retour à l’accueil"
        className="fx-ghost fixed left-4 top-4 z-40 flex items-center gap-2 rounded-full border border-cream/12 bg-abyss/70 px-3 py-2 text-[12px] font-semibold text-cream/80 backdrop-blur-xl sm:left-6 sm:top-6"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        <span className="hidden sm:inline">Retour</span>
      </Link>

      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <Loader2
              size={26}
              className="animate-spin text-orange"
              aria-hidden="true"
            />
          </div>
        }
      >
        <Contenu />
      </Suspense>
    </main>
  );
}
