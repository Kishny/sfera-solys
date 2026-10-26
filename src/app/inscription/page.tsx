/* src/app/inscription/page.tsx */

"use client";

/**
 * Page d'onboarding / inscription profil Sfera'Solys.
 *
 * Cette page gère :
 * - la complétion du profil après inscription ou connexion OAuth ;
 * - un formulaire multi-étapes avec React Hook Form ;
 * - la validation Zod ;
 * - l'enregistrement du profil via /api/users/update-profile ;
 * - la redirection vers /tarifs après profil complet ;
 * - un écran final avant les offres Premium.
 *
 * Correction importante :
 * L'ancien code validait seulement un champ par étape.
 * Maintenant chaque étape valide son groupe de champs dédié.
 */

import { Suspense, useEffect, useMemo, useState } from "react";
import {
  useForm,
  FormProvider,
  type FieldPath,
  type Resolver,
  type SubmitErrorHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, useSession } from "next-auth/react";

import { Logo } from "@/components/ui/Logo";

import Step1 from "./steps/Step1";
import Step2 from "./steps/Step2";
import Step3 from "./steps/Step3";
import Step4 from "./steps/Step4";
import Step5 from "./steps/Step5";

import {
  ArrowLeft,
  Check,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
  AlertCircle,
} from "lucide-react";

/**
 * Helper pour rendre un champ texte optionnel.
 *
 * Exemple :
 * - "" devient undefined ;
 * - "texte" reste "texte".
 *
 * Ici, il sert surtout pour password, car un utilisateur Google
 * n'a pas forcément besoin de créer un mot de passe à cette étape.
 */
const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional()
);

/**
 * Schéma principal du formulaire d'inscription Sfera'Solys.
 *
 * Important :
 * - cette page ne gère plus le choix du plan Stripe ;
 * - le choix Essentiel / Premium / Elite se fait uniquement sur /tarifs ;
 * - ici, on complète seulement le profil utilisateur.
 */
const formSchema = z.object({
  pseudonyme: z
    .string()
    .min(3, "Le pseudonyme doit contenir au moins 3 caractères")
    .max(50, "Le pseudonyme ne doit pas dépasser 50 caractères"),

  email: z.string().email("Adresse email invalide"),

  password: optionalString,

  age: z.coerce
    .number({
      message: "L'âge est obligatoire",
    })
    .min(28, "Tu dois avoir au moins 28 ans")
    .max(120, "Âge invalide"),

  orientation: z.string().min(1, "Sélectionne ton orientation"),

  intentions: z
    .array(z.string())
    .min(1, "Choisis au moins une intention"),

  localisation: z.string().min(2, "Renseigne ta localisation"),

  departement: z.string().optional(),

  rayon: z.string().min(1, "Choisis un rayon de recherche"),

  question: z.string().min(1, "Choisis une question de sécurité"),

  reponse: z
    .string()
    .min(2, "Ta réponse est trop courte")
    .max(200, "Ta réponse ne doit pas dépasser 200 caractères"),

  interets: z
    .array(z.string())
    .min(3, "Choisis au moins 3 centres d'intérêt")
    .max(5, "Choisis au maximum 5 centres d'intérêt"),

  visibilite: z.string().min(1, "Choisis une visibilité"),

  consentement: z.boolean().refine((val) => val === true, {
    message: "Le consentement est obligatoire.",
  }),
});

type FormData = z.infer<typeof formSchema>;

/**
 * Liste des composants d'étapes.
 *
 * step = 0 → Step1
 * step = 1 → Step2
 * step = 2 → Step3
 * step = 3 → Step4
 * step = 4 → Step5
 * step = 5 → écran final "profil prêt"
 */
const steps = [Step1, Step2, Step3, Step4, Step5];

/** Anneau de focus clavier, identique au reste du site public. */
const anneauFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70 focus-visible:ring-offset-2 focus-visible:ring-offset-nuit";

/**
 * Champs à valider par étape.
 *
 * Correction clé :
 * Chaque étape valide maintenant les bons champs,
 * au lieu de valider seulement un champ isolé.
 */
const stepFields: FieldPath<FormData>[][] = [
  ["pseudonyme", "email", "age"],
  ["orientation", "intentions"],
  ["localisation", "departement", "rayon"],
  ["question", "reponse", "interets"],
  ["visibilite", "consentement"],
];

/**
 * Liste complète des champs du profil.
 * Elle sert à valider tout le formulaire avant la redirection vers /tarifs.
 */
const allProfileFields: FieldPath<FormData>[] = stepFields.flat();


/**
 * Cartes affichées sur l'écran final avant /tarifs.
 */
const finalHighlights = [
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Profil prêt",
    description:
      "Ton profil est configuré pour recevoir de meilleures suggestions.",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Rencontres ciblées",
    description:
      "Tes intentions et préférences servent à améliorer la compatibilité.",
  },
  {
    icon: <Lock className="h-5 w-5" />,
    title: "Sécurité renforcée",
    description: "Ton compte est associé à ta session sécurisée.",
  },
  {
    icon: <Star className="h-5 w-5" />,
    title: "Offres flexibles",
    description: "Tu choisis ensuite Essentiel, Premium ou Elite.",
  },
];

/**
 * Retourne l'étape à afficher selon la première erreur trouvée.
 */
function getStepFromErrors(errors: Partial<Record<keyof FormData, unknown>>) {
  if (errors.pseudonyme || errors.email || errors.age) return 0;
  if (errors.orientation || errors.intentions) return 1;
  if (errors.localisation || errors.rayon) return 2;
  if (errors.question || errors.reponse || errors.interets) return 3;
  if (errors.visibilite || errors.consentement) return 4;

  return 0;
}

type IdentityVerificationStatus = "unverified" | "pending" | "verified" | "failed";


/**
 * Palette tournante pour les cartes "finalHighlights" de l'écran final.
 */
const highlightBars = [
  "from-[#BD9365] to-[#BD9365]",
  "from-[#83B28C] to-[#83B28C]",
  "from-[#BD9365] to-[#BD9365]",
  "from-minuit to-[#CB7871]",
];

function InscriptionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  /**
   * step de navigation.
   *
   * 0 à 4 : étapes du profil
   * 5 : écran final avant redirection vers /tarifs
   */
  const [step, setStep] = useState(0);

  /**
   * Erreur globale affichée dans la carte principale.
   */
  const [submitError, setSubmitError] = useState("");

  /**
   * Loader pendant l'enregistrement du profil.
   */
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  /**
   * Profil déjà enregistré en base (hasCompletedProfile).
   * Permet de savoir si l'utilisateur revient sur cette page
   * uniquement pour finaliser la vérification d'identité.
   */
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  /**
   * Statut de vérification d'identité — obligatoire pour accéder au compte.
   */
  const [identityStatus, setIdentityStatus] =
    useState<IdentityVerificationStatus>("unverified");
  const [isCheckingIdentity, setIsCheckingIdentity] = useState(false);
  const [isLaunchingVerification, setIsLaunchingVerification] = useState(false);

  /**
   * Détection d'un navigateur intégré à une app (webview Instagram, Facebook,
   * TikTok, Snapchat, etc.). Ces navigateurs bloquent souvent l'accès à la
   * caméra, ce qui fait échouer la vérification d'identité Stripe. On avertit
   * la personne d'ouvrir la page dans Safari ou Chrome.
   */
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;

    const ua = navigator.userAgent || "";

    // Tokens typiques des webviews intégrés aux applications.
    const inAppPatterns =
      /(FBAN|FBAV|FB_IAB|Instagram|Line\/|Twitter|TikTok|musical_ly|BytedanceWebview|Trill|Snapchat|LinkedInApp|Pinterest\/|WhatsApp|Messenger|GSA\/)/i;

    setIsInAppBrowser(inAppPatterns.test(ua));
  }, []);



  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema) as Resolver<FormData>,
    mode: "onTouched",
    defaultValues: {
      pseudonyme: "",
      email: "",
      password: "",
      age: 28,
      orientation: "",
      intentions: [],
      localisation: "",
      departement: "",
      rayon: "departement",
      question: "",
      reponse: "",
      interets: [],
      visibilite: "public",
      consentement: false,
    },
  });

  const {
    trigger,
    setValue,
    setFocus,
    formState: { errors },
  } = methods;

  /**
   * Composant de l'étape actuelle.
   * Si step = 5, StepComponent sera undefined et on affiche l'écran final.
   */
  const StepComponent = steps[step];

  /**
   * Préremplissage depuis NextAuth.
   *
   * Après connexion Google :
   * - email Google → champ email ;
   * - nom Google → pseudonyme par défaut.
   */
  useEffect(() => {
    if (session?.user?.email) {
      setValue("email", session.user.email, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    if (session?.user?.name) {
      setValue("pseudonyme", session.user.name, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [session, setValue]);

  /**
   * Récupère le statut de vérification d'identité depuis l'API.
   * Source de vérité : MongoDB (mis à jour par le webhook Stripe Identity),
   * plus fiable que la session NextAuth qui peut être en cache.
   */
  const refreshIdentityStatus = async () => {
    setIsCheckingIdentity(true);

    try {
      const res = await fetch("/api/identity-verification", {
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.identityVerificationStatus) {
        setIdentityStatus(data.identityVerificationStatus);
      }
    } catch {
      /* on garde le statut précédent en cas d'erreur réseau */
    } finally {
      setIsCheckingIdentity(false);
    }
  };

  /**
   * Garde de session.
   *
   * La page ne traitait que `status === "loading"` : sans session, elle
   * s'affichait quand même. On pouvait donc remplir les cinq étapes et ne
   * l'apprendre qu'au tout dernier bouton, sous la forme d'un 401 brut de
   * `POST /api/users/update-profile` — la route faisait son travail, c'est
   * l'écran qui laissait avancer. On repart vers /auth avant la première
   * question.
   */
  useEffect(() => {
    if (status !== "unauthenticated") return;

    let vivant = true;

    /*
     * On ne renvoie pas sur la foi du seul `status`. Après un `signIn` sans
     * redirection, le SessionProvider garde l'état qu'il avait avant la
     * connexion tant qu'il n'a pas relu le cookie : une arrivée ici par
     * navigation côté client lit donc un « unauthenticated » périmé, et la
     * garde renvoyait aussitôt vers /auth — en boucle, sans message.
     *
     * `getSession()` relit le cookie et met le fournisseur à jour. On ne
     * conclut qu'après.
     */
    getSession().then((fraiche) => {
      if (!vivant) return;
      if (fraiche?.user) return;
      router.replace("/auth?mode=login");
    });

    return () => {
      vivant = false;
    };
  }, [status, router]);

  /**
   * Si l'utilisateur a déjà un profil complété (ex: retour après
   * vérification d'identité), on l'amène directement à l'écran final
   * au lieu de lui refaire remplir les 5 étapes.
   */
  useEffect(() => {
    if (status !== "authenticated") return;

    const currentUser = session?.user as
      | { hasCompletedProfile?: boolean; identityVerified?: boolean }
      | undefined;

    if (currentUser?.hasCompletedProfile) {
      setIsProfileSaved(true);
      setStep(steps.length);
    }

    if (currentUser?.identityVerified) {
      setIdentityStatus("verified");
    }
  }, [status, session]);

  /**
   * Vérifie le statut de vérification d'identité :
   * - au chargement de l'écran final ;
   * - au retour depuis Stripe Identity (?verification=success).
   */
  useEffect(() => {
    if (status !== "authenticated") return;
    if (step !== steps.length) return;

    refreshIdentityStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, step, searchParams?.get("verification")]);


  /**
   * Progression visuelle.
   * Total = 5 étapes + 1 écran final.
   */
  const totalScreens = steps.length + 1;

  const progress = useMemo(() => {
    return ((step + 1) / totalScreens) * 100;
  }, [step, totalScreens]);

  /**
   * Bouton Continuer.
   *
   * Valide uniquement les champs de l'étape affichée.
   */
  const onNext = async () => {
    setSubmitError("");

    const fieldsToValidate = stepFields[step];

    if (!fieldsToValidate) return;

    const isValid = await trigger(fieldsToValidate, {
      shouldFocus: true,
    });

    if (!isValid) {
      setSubmitError(
        "Complète les champs obligatoires de cette étape."
      );
      return;
    }

    setStep((currentStep) => Math.min(currentStep + 1, steps.length));
  };

  /**
   * Bouton Retour.
   */
  const onBack = () => {
    setSubmitError("");
    setStep((currentStep) => Math.max(currentStep - 1, 0));
  };

  /**
   * Gestion des erreurs de validation finale.
   *
   * Si React Hook Form bloque la soumission finale,
   * cette fonction affiche un message au lieu de laisser l'utilisateur bloqué.
   */
  const onInvalid: SubmitErrorHandler<FormData> = (formErrors) => {
    const firstErrorKey = Object.keys(formErrors)[0] as
      | FieldPath<FormData>
      | undefined;

    setSubmitError(
      "Certains champs du profil sont incomplets ou invalides. Reviens aux étapes précédentes pour les corriger."
    );

    if (firstErrorKey) {
      try {
        setFocus(firstErrorKey);
      } catch {
        /**
         * Certains champs comme les tableaux ne peuvent pas toujours recevoir le focus.
         */
      }
    }
  };

  /**
   * Soumission finale.
   *
   * Cette fonction :
   * - enregistre le profil dans MongoDB via /api/users/update-profile ;
   * - marque hasCompletedProfile à true.
   *
   * Important : elle ne redirige plus automatiquement vers /tarifs.
   * La vérification d'identité est désormais obligatoire avant tout accès
   * au compte (gratuit ou payant) — l'utilisateur reste sur cet écran
   * pour la réaliser.
   */
  const onSubmit = async (data: FormData) => {
    setSubmitError("");
    setIsSubmittingProfile(true);

    try {
      const res = await fetch("/api/users/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          hasCompletedProfile: true,
        }),
      });

      const responseData = await res.json().catch(() => null);

      /**
       * 401 : la session a disparu entre l'ouverture de la page et l'envoi
       * (cookie expiré, déconnexion dans un autre onglet). Le message par
       * défaut de la route est « Non autorisé » — exact, mais sans suite
       * possible. On dit ce qu'il faut faire, et on y emmène.
       */
      if (res.status === 401) {
        setSubmitError(
          "Ta session a expiré. On te renvoie à la connexion — ton profil sera à ressaisir."
        );
        window.setTimeout(() => router.replace("/auth?mode=login"), 2200);
        return;
      }

      if (!res.ok || !responseData?.success) {
        setSubmitError(
          responseData?.error ||
            "Une erreur est survenue lors de l'enregistrement du profil."
        );
        return;
      }

      setIsProfileSaved(true);
      await refreshIdentityStatus();
    } catch {
      setSubmitError("Erreur de connexion au serveur.");
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  /**
   * Bouton "Enregistrer mon profil" sur l'écran final.
   *
   * Cette fonction évite le blocage silencieux.
   * Elle :
   * 1. valide tout le profil ;
   * 2. si erreur, renvoie vers l'étape concernée ;
   * 3. si tout est bon, enregistre le profil.
   *
   * L'accès au compte (gratuit ou payant) n'est débloqué qu'après
   * vérification d'identité — gérée plus bas sur le même écran.
   */
  const handleSaveProfile = async () => {
    setSubmitError("");

    const isValid = await trigger(allProfileFields, {
      shouldFocus: true,
    });

    if (!isValid) {
      const currentErrors = methods.formState.errors;
      setStep(getStepFromErrors(currentErrors));

      setSubmitError(
        "Certains champs sont incomplets. Corrige l’étape indiquée puis réessaie."
      );

      return;
    }

    const data = methods.getValues();
    await onSubmit(data);
  };

  /**
   * Lance la session Stripe Identity.
   */
  const handleStartIdentityVerification = async () => {
    setSubmitError("");
    setIsLaunchingVerification(true);

    try {
      const res = await fetch("/api/identity-verification", {
        method: "POST",
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.url) {
        setSubmitError(
          data?.error || "Impossible de lancer la vérification d'identité."
        );
        return;
      }

      setIdentityStatus("pending");
      window.location.href = data.url;
    } catch {
      setSubmitError("Impossible de lancer la vérification d'identité.");
    } finally {
      setIsLaunchingVerification(false);
    }
  };

  /**
   * Accès au compte gratuit — uniquement possible une fois l'identité
   * vérifiée. Le paiement reste optionnel et accessible plus tard depuis
   * Ma Sphère.
   */
  const handleAccessFreeAccount = () => {
    if (identityStatus !== "verified") return;
    router.push("/mon-compte");
  };

  /**
   * Accès aux offres Premium — également conditionné à la vérification
   * d'identité.
   */
  const handleGoToOffers = () => {
    if (identityStatus !== "verified") return;
    router.push("/tarifs");
  };

  /**
   * Loader pendant le chargement de session NextAuth.
   */
  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-nuit px-4 text-champagne">
        <div className="text-center">
          <p className="text-[15px] font-semibold">Vérification de ta session…</p>
          <p className="mt-1.5 text-[13px] text-champagne/60">
            Si tu n’es pas connecté, on t’emmène à la page de connexion.
          </p>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-nuit px-4 text-champagne">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-champagne/20 border-t-cuivre" />
          <p className="text-sm text-champagne/70 sm:text-base">
            Chargement de ton espace Sfera'Solys...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-nuit font-sans text-champagne">
      {/*
        Colonne photographique, à partir de `lg`.

        Elle est `fixed` plutôt que posée dans le flux : le formulaire est
        long — cinq étapes, puis l'écran de vérification — et une colonne
        d'image qui défile avec lui laisserait du vide sous la photo dès la
        deuxième étape. Fixée, elle tient tout le défilement.

        Les blobs flous, les `OrbitGlow` et le champ d'étoiles de l'ancienne
        version disparaissent avec elle : c'était le décor de la charte
        précédente, et la photographie fait ce travail-là mieux qu'eux.
      */}
      <div
        aria-hidden="true"
        className="fixed inset-y-0 left-0 hidden w-[42%] lg:block"
      >
        <Image
          src="/visuels/solys-03.webp"
          alt=""
          fill
          priority
          sizes="42vw"
          className="object-cover object-[60%_40%]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-nuit via-nuit/45 to-nuit/70" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-r from-transparent to-nuit" />

        <div className="absolute inset-x-0 top-0 p-8 xl:p-10">
          <Logo
            href={null}
            size="lg"
            withMark
            markId="inscription-marque"
            tagline="Rencontres sérieuses pour hommes exigeants"
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-8 xl:p-10">
          <p className="font-display max-w-md text-[32px] font-normal leading-[1.12] text-ivoire xl:text-[40px]">
            Des rencontres à la hauteur
            <br />
            <span className="italic text-cuivre">de ton parcours.</span>
          </p>

          <span
            aria-hidden="true"
            className="mt-6 block h-px w-16 bg-cuivre"
          />

          <p className="mt-6 max-w-sm text-[13.5px] leading-relaxed text-champagne/80">
            Sfera&rsquo;Solys, la plateforme de rencontres pensée pour les
            hommes de 28 ans et plus qui souhaitent des relations
            authentiques et durables.
          </p>
        </div>
      </div>

      {/*
        `lg:w-auto` n'est pas décoratif : il supprime un débordement.

        La colonne photographique est `fixed w-[42%]`, et cette colonne-ci
        se décale d'autant par `lg:ml-[42%]`. Mais `w-full` vaut
        `width: 100%` de la page, et une marge gauche s'ajoute à la largeur
        au lieu de la réduire : le bloc occupait donc 142 % de l'écran, d'où
        42 % de défilement horizontal à partir de `lg`.

        `width: auto` sur un bloc fait exactement ce qu'on veut — il remplit
        ce que la marge laisse, ni plus ni moins. En dessous de `lg`,
        `w-full` reste nécessaire pour que `max-w-2xl` s'applique.
      */}
      <div className="relative mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8 lg:ml-[42%] lg:mr-0 lg:w-auto lg:max-w-none lg:px-10 xl:px-16">
        {/*
          Le logo n'apparaît ici qu'en dessous de `lg` : au-delà, il est
          posé sur la colonne photographique, et deux logos sur un même
          écran se contredisent.
        */}
        <div className="mb-7 flex items-center justify-between gap-4">
          <Logo
            href="/"
            size="sm"
            withMark
            markId="inscription-marque-mobile"
            className="lg:hidden"
          />

          <button
            type="button"
            onClick={() => router.push("/")}
            className={`group ml-auto flex items-center gap-2 text-[13px] font-semibold text-champagne/80 transition-colors hover:text-champagne ${anneauFocus}`}
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            Retour à l&apos;accueil
          </button>
        </div>

        {/* En-tête du panneau */}
        <section className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-surtitre text-champagne/70">
            Créer un compte
          </p>

          <h1 className="font-display mt-4 text-[30px] font-normal leading-tight text-ivoire sm:text-[38px]">
            Faisons connaissance.
          </h1>

          <p className="mx-auto mt-3 max-w-md text-[13.5px] leading-relaxed text-champagne/80">
            Complète ton profil, puis choisis l&apos;offre qui correspond à
            ton expérience.
          </p>
        </section>

        {/*
          Progression en pastilles reliées, comme la maquette. Le
          pourcentage disparaît : sur six écrans, une pastille dit la même
          chose en se lisant d'un coup d'œil. `progress` reste calculé en
          amont et sert encore à la largeur du trait rempli.
        */}
        <section className="mt-7" aria-label="Progression de l&apos;inscription">
          <ol className="relative mx-auto flex max-w-xs items-center justify-between">
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-champagne/20"
            />

            <span
              aria-hidden="true"
              className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-cuivre transition-all duration-300"
              style={{ width: `${progress}%` }}
            />

            {Array.from({ length: totalScreens }).map((_, index) => {
              const atteinte = index <= step;

              return (
                <li
                  key={index}
                  aria-current={index === step ? "step" : undefined}
                  className={`relative h-3 w-3 rounded-full border transition-colors ${
                    atteinte
                      ? "border-cuivre bg-cuivre"
                      : "border-champagne/35 bg-nuit"
                  }`}
                >
                  <span className="sr-only">
                    Étape {index + 1} sur {totalScreens}
                  </span>
                </li>
              );
            })}
          </ol>

          <p className="mt-3 text-center text-[12.5px] text-champagne/75">
            Étape {step + 1} sur {totalScreens}
          </p>
        </section>

        <section className="mt-7">
          <div>
            <div className="rounded-3xl border border-champagne/12 bg-minuit/80 p-5 sm:p-7">
              {/* Erreur globale */}
              {submitError && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-erreur/50 bg-erreur/20 px-4 py-3 text-sm text-champagne sm:mb-6">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {step < steps.length && StepComponent ? (
                <FormProvider {...methods}>
                  <form
                    onSubmit={(event) => event.preventDefault()}
                    className="space-y-5 sm:space-y-6"
                  >
                    {/* Badge étape */}
                    <div className="mb-4 sm:mb-6">
                      <div className="inline-flex items-center gap-2 rounded-full border border-cuivre/35 bg-cuivre/10 px-4 py-1.5">
                        <Star className="h-3.5 w-3.5 text-cuivre" />
                        <span className="text-[12px] font-semibold text-champagne">
                          Étape profil
                        </span>
                      </div>
                    </div>

                    <StepComponent />

                    {/* Navigation entre étapes */}
                    <div className="mt-6 flex flex-col-reverse gap-3 border-t border-champagne/10 pt-5 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
                      {step > 0 ? (
                        <button
                          type="button"
                          onClick={onBack}
                          className={`flex w-full items-center justify-center gap-2 rounded-xl border border-champagne/25 px-6 py-3.5 text-sm font-semibold text-champagne transition-colors hover:border-champagne/50 sm:w-auto ${anneauFocus}`}
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Retour
                        </button>
                      ) : (
                        <div className="hidden sm:block" />
                      )}

                      <button
                        type="button"
                        onClick={onNext}
                        className={`w-full rounded-xl bg-degrade-cuivre px-8 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 sm:w-auto ${anneauFocus}`}
                      >
                        Continuer
                      </button>
                    </div>
                  </form>
                </FormProvider>
              ) : (
                <FormProvider {...methods}>
                  <div className="space-y-6 sm:space-y-8">
                    <div className="text-center">
                      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-succes/30 bg-succes/10">
                        <Check className="h-8 w-8 text-succes" />
                      </div>

                      <h2 className="mb-3 text-2xl font-bold text-champagne sm:text-3xl">
                        Ton profil est prêt
                      </h2>

                      <p className="text-sm leading-relaxed text-champagne/70 sm:text-base">
                        Dernière étape : enregistre ton profil, puis
                        vérifie ton identité. C&apos;est obligatoire pour
                        accéder à ton compte — gratuit ou payant.
                      </p>
                    </div>

                    {/* Cartes de résumé */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {finalHighlights.map((item, index) => {
                        const bar = highlightBars[index % highlightBars.length];

                        return (
                          <div
                            key={item.title}
                            className="relative overflow-hidden rounded-xl border border-champagne/10 bg-champagne/5 p-5"
                          >
                            <div
                              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${bar}`}
                            />

                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cuivre/15 to-cuivre-sombre/15">
                              <div className="text-champagne">{item.icon}</div>
                            </div>

                            <h3 className="font-bold text-champagne">
                              {item.title}
                            </h3>

                            <p className="mt-1 text-sm text-champagne/55">
                              {item.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Vérification d'identité — obligatoire */}
                    <div
                      className={`rounded-xl border p-5 sm:p-6 ${
                        identityStatus === "verified"
                          ? "border-succes/30 bg-gradient-to-r from-succes/[0.06] to-succes/[0.03]"
                          : "border-cuivre/25 bg-gradient-to-r from-cuivre-sombre/20 to-cuivre/10"
                      }`}
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cuivre/15 text-xl">
                          🪪
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-champagne">
                            Vérification d&apos;identité
                          </h3>

                          <p className="text-xs font-semibold text-champagne">
                            Obligatoire — requise pour accéder à ton compte
                          </p>
                        </div>
                      </div>

                      {/* Avertissement navigateur in-app (Instagram, Facebook,
                          TikTok…) : la caméra y est souvent bloquée. */}
                      {isInAppBrowser && identityStatus !== "verified" && (
                        <div className="mb-4 flex items-start gap-2 rounded-lg border border-cuivre/30 bg-cuivre/10 px-4 py-3 text-sm text-champagne/80">
                          <span className="shrink-0 text-base">⚠️</span>
                          <span>
                            Tu sembles naviguer depuis l&apos;application
                            d&apos;un réseau social. La caméra peut y être
                            bloquée et faire échouer la vérification.{" "}
                            <strong className="font-semibold">
                              Ouvre plutôt cette page dans Safari ou Chrome
                            </strong>{" "}
                            (menu « … » → « Ouvrir dans le navigateur ») avant de
                            lancer la vérification.
                          </span>
                        </div>
                      )}

                      {identityStatus === "verified" ? (
                        <div className="flex items-center gap-2 rounded-lg border border-succes/30 bg-succes/10 px-4 py-3 text-sm text-succes">
                          <Check className="h-4 w-4 shrink-0" />
                          <span>
                            Identité vérifiée. Tu peux maintenant accéder
                            à ton compte.
                          </span>
                        </div>
                      ) : identityStatus === "pending" ? (
                        <>
                          <div className="mb-4 flex items-center gap-2 rounded-lg border border-cuivre/30 bg-cuivre/10 px-4 py-3 text-sm text-champagne/80">
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                            <span>
                              Vérification en cours de traitement. Cela peut
                              prendre quelques minutes.
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={refreshIdentityStatus}
                            disabled={isCheckingIdentity}
                            className="w-full rounded-xl border border-champagne/12 bg-champagne/5 py-3 text-sm font-semibold text-champagne transition hover:bg-champagne/10 disabled:opacity-60"
                          >
                            {isCheckingIdentity
                              ? "Vérification du statut..."
                              : "Rafraîchir le statut"}
                          </button>

                          {/* Filet de sécurité : permettre de relancer une
                              nouvelle vérification si la personne est bloquée
                              (page fermée, caméra refusée, souci technique…). */}
                          <div className="mt-3 border-t border-champagne/10 pt-3">
                            <p className="mb-2 text-center text-xs text-champagne/55">
                              Un problème, une fenêtre fermée ou un blocage
                              technique pendant la vérification ?
                            </p>

                            <button
                              type="button"
                              onClick={handleStartIdentityVerification}
                              disabled={isLaunchingVerification}
                              className="w-full rounded-xl border border-cuivre/40 bg-cuivre/12 py-3 text-sm font-semibold text-champagne/90 transition hover:bg-cuivre/20 disabled:opacity-60"
                            >
                              {isLaunchingVerification
                                ? "Préparation..."
                                : "↻ Recommencer la vérification"}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="mb-4 text-sm leading-relaxed text-champagne/70">
                            Pour la sécurité de tous les membres,
                            Sfera'Solys exige une pièce d&apos;identité officielle
                            et une photo prise en direct correspondant au
                            visage sur la pièce. Sans cette vérification,
                            l&apos;inscription n&apos;est pas validée et l&apos;accès au
                            compte reste bloqué.
                            {identityStatus === "failed" && (
                              <span className="mt-2 block font-medium text-red-300">
                                La vérification précédente n&apos;a pas pu être
                                validée. Merci de réessayer.
                              </span>
                            )}
                          </p>

                          <button
                            type="button"
                            onClick={handleStartIdentityVerification}
                            disabled={isLaunchingVerification || !isProfileSaved}
                            className="fx-btn w-full rounded-xl bg-cuivre py-3 text-sm font-bold text-nuit transition-colors hover:bg-cuivre/90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isLaunchingVerification
                              ? "Préparation..."
                              : identityStatus === "failed"
                                ? "↻ Recommencer la vérification d'identité"
                                : "Vérifier mon identité maintenant"}
                          </button>

                          {!isProfileSaved && (
                            <p className="mt-2 text-center text-xs text-champagne/55">
                              Enregistre d&apos;abord ton profil ci-dessous
                              pour lancer la vérification.
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Bloc Stripe — paiement optionnel, possible plus tard */}
                    <div className="rounded-xl border border-champagne/10 bg-gradient-to-r from-minuit to-cuivre-sombre/20 p-5 sm:p-6">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-champagne/10">
                          <ShieldCheck className="h-5 w-5 text-champagne/70" />
                        </div>

                        <h3 className="text-lg font-bold text-champagne">
                          Paiement — facultatif pour le moment
                        </h3>
                      </div>

                      <p className="text-sm leading-relaxed text-champagne/70 sm:text-base">
                        Une fois ton identité vérifiée, tu peux accéder
                        gratuitement à ton compte avec les fonctionnalités
                        de base. Tu pourras choisir une offre Essentiel,
                        Premium ou Elite à tout moment depuis Ma Sphère.
                      </p>
                    </div>

                    {/* Boutons finaux */}
                    <div className="flex flex-col gap-3 border-t border-champagne/10 pt-5 sm:pt-6">
                      {!isProfileSaved ? (
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <button
                            type="button"
                            onClick={() => setStep(steps.length - 1)}
                            disabled={isSubmittingProfile}
                            className={`flex w-full items-center justify-center gap-2 rounded-xl border border-champagne/25 px-6 py-3.5 text-sm font-semibold text-champagne transition-colors hover:border-champagne/50 disabled:opacity-50 sm:w-auto ${anneauFocus}`}
                          >
                            <ArrowLeft className="h-4 w-4" />
                            Retour
                          </button>

                          <button
                            type="button"
                            onClick={handleSaveProfile}
                            disabled={isSubmittingProfile}
                            className={`flex w-full items-center justify-center gap-2 rounded-xl bg-degrade-cuivre px-8 py-4 text-base font-bold text-nuit transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${anneauFocus}`}
                          >
                            {isSubmittingProfile ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Enregistrement...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-5 w-5" />
                                Enregistrer mon profil
                              </>
                            )}
                          </button>
                        </div>
                      ) : identityStatus === "verified" ? (
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <button
                            type="button"
                            onClick={handleGoToOffers}
                            className={`flex w-full items-center justify-center gap-2 rounded-xl border border-champagne/25 px-6 py-3.5 text-sm font-semibold text-champagne transition-colors hover:border-champagne/50 sm:w-auto ${anneauFocus}`}
                          >
                            <Star className="h-4 w-4" />
                            Voir les offres Premium
                          </button>

                          <button
                            type="button"
                            onClick={handleAccessFreeAccount}
                            className={`flex w-full items-center justify-center gap-2 rounded-xl bg-degrade-cuivre px-8 py-4 text-base font-bold text-nuit transition-opacity hover:opacity-90 sm:w-auto ${anneauFocus}`}
                          >
                            <Sparkles className="h-5 w-5" />
                            Accéder à mon compte gratuit
                          </button>
                        </div>
                      ) : (
                        <p className="text-center text-sm text-champagne/55">
                          Vérifie ton identité ci-dessus pour débloquer
                          l&apos;accès à ton compte.
                        </p>
                      )}
                    </div>
                  </div>
                </FormProvider>
              )}
            </div>
          </div>

        </section>

        {/*
          Pied du panneau. Les trois gages de l'ancienne version
          (« Paiement 100% sécurisé », « Annulation à tout moment »,
          « Données protégées ») ont sauté avec la colonne latérale : deux
          d'entre eux parlaient de paiement, sur un écran où rien n'est
          payant. Reste la seule phrase que la maquette garde.
        */}
        <footer className="mt-7 space-y-4 text-center">
          <p className="text-[13px] text-champagne/80">
            Déjà membre&nbsp;?{" "}
            <button
              type="button"
              onClick={() => router.push("/auth?mode=login")}
              className={`font-semibold text-cuivre transition-colors hover:text-champagne ${anneauFocus}`}
            >
              Connexion
            </button>
          </p>

          <p className="flex items-center justify-center gap-2 text-[12.5px] text-champagne/70">
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Tes informations restent confidentielles.
          </p>
        </footer>
      </div>
    </main>
  );
}

export default function InscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-nuit px-4 text-champagne">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-champagne/20 border-t-cuivre" />
            <p className="text-sm text-champagne/70 sm:text-base">
              Chargement de ton espace Sfera'Solys...
            </p>
          </div>
        </div>
      }
    >
      <InscriptionPageContent />
    </Suspense>
  );
}
