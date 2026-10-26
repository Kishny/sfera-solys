// src/app/(app)/messages/[matchId]/page.tsx

"use client";

/**
 * Conversation.
 *
 * ## Ce que la page ne faisait pas
 *
 * **La sourdine et le rangement n'existaient que côté serveur.**
 * `PATCH /api/matches/[id]/mute` et `PATCH /api/matches/[id]/archive` étaient
 * complets, testables au curl, et **aucune interface ne les appelait**. Pire :
 * `mutedBy` et `archivedBy` n'étaient relus nulle part, donc même appelés à la
 * main ils n'auraient rien changé. Les deux ont maintenant un bouton ici, et un
 * effet : la sourdine coupe la notification push du destinataire (jamais
 * l'arrivée du message — une conversation muette reste une conversation), et le
 * rangement sort la relation de la liste principale de `/matches`.
 *
 * **La limite de 10 messages par jour de l'offre gratuite n'était pas
 * appliquée.** `/tarifs` l'annonce depuis toujours ; le compteur lisait un champ
 * `dailyMessagesCount` absent du modèle `User`, donc valait zéro en permanence.
 * Le serveur refuse maintenant au-delà du quota et renvoie ce qui reste, que la
 * zone de saisie affiche — mieux vaut savoir avant d'écrire qu'après.
 *
 * ## Le temps réel reste indispensable, et il peut manquer
 *
 * Pusher porte l'arrivée des messages et les accusés de lecture. Ses clés sont
 * optionnelles : si elles manquent, l'abonnement échoue silencieusement et la
 * conversation fonctionne quand même — elle ne se met simplement plus à jour
 * toute seule. La page le dit plutôt que de laisser croire à un blocage.
 *
 * ## Restes du fork
 *
 * Le vouvoiement (« votre match »), les emojis de décoration, et l'identité
 * violet/rose héritée de SferaLuna.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  ArrowUp,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Flag,
  Loader2,
  MapPin,
  Paperclip,
  Plus,
  Send,
  Smile,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import { getPusherClient } from "@/lib/pusher-client";
import ReportModal from "@/components/ReportModal";
import VisionneusePhotos from "@/components/VisionneusePhotos";
import MenuPlus from "@/components/messagerie/MenuPlus";
import SelecteurEmojis from "@/components/messagerie/SelecteurEmojis";
import { usePremium } from "@/hooks/usePremium";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Message {
  _id: string;
  matchId: string;
  senderId: string;
  content: string;
  imageUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

interface Interlocuteur {
  _id: string;
  pseudonyme: string;
  age?: number;
  localisation?: string;
  image?: string;
  identityVerified?: boolean;
}

// ─────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────

/** Aligné sur MAX_MESSAGE_LENGTH côté API. */
const LONGUEUR_MAX = 1000;

const DUREES_SOURDINE = [
  { minutes: 60, label: "1 heure" },
  { minutes: 480, label: "8 heures" },
  { minutes: 1440, label: "24 heures" },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70 focus-visible:ring-offset-2 focus-visible:ring-offset-nuit";

function formaterHeure(valeur: string): string {
  const date = new Date(valeur);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formaterJour(valeur: string): string {
  const date = new Date(valeur);
  if (Number.isNaN(date.getTime())) return "Date inconnue";

  const aujourdhui = new Date();
  const hier = new Date(aujourdhui);
  hier.setDate(aujourdhui.getDate() - 1);

  if (date.toDateString() === aujourdhui.toDateString()) return "Aujourd’hui";
  if (date.toDateString() === hier.toDateString()) return "Hier";

  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

/** Fusionne sans doublon, en gardant l'ordre chronologique. */
function fusionner(anciens: Message[], nouveaux: Message[]): Message[] {
  const parId = new Map<string, Message>();

  for (const message of [...anciens, ...nouveaux]) {
    parId.set(message._id, message);
  }

  return [...parId.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function PageConversation() {
  const { matchId } = useParams<{ matchId: string }>();
  const router = useRouter();
  const { status } = useSession();
  const { subscription } = usePremium();
  const reduireAnimations = useReducedMotion();

  const [messages, setMessages] = useState<Message[]>([]);
  const [interlocuteur, setInterlocuteur] = useState<Interlocuteur | null>(null);
  const [monId, setMonId] = useState("");

  const [saisie, setSaisie] = useState("");
  const [envoi, setEnvoi] = useState(false);

  /**
   * Le composeur.
   *
   * `photoEnAttente` tient l'URL d'une photo déjà déposée sur Cloudinary
   * mais pas encore envoyée : on la voit en aperçu, on peut la retirer, et
   * on peut lui joindre un mot avant de partir.
   */
  const [menuPlus, setMenuPlus] = useState(false);
  const [emojis, setEmojis] = useState(false);
  const [photoEnAttente, setPhotoEnAttente] = useState<string | null>(null);
  const [envoiPhoto, setEnvoiPhoto] = useState(false);

  /** Index de la photo du fil ouverte en grand, `null` si aucune. */
  const [photoAgrandie, setPhotoAgrandie] = useState<number | null>(null);

  const ancrePlus = useRef<HTMLDivElement>(null);
  const ancreEmojis = useRef<HTMLDivElement>(null);
  const champPhoto = useRef<HTMLInputElement>(null);
  const champCamera = useRef<HTMLInputElement>(null);
  const champSaisie = useRef<HTMLTextAreaElement>(null);

  const [chargement, setChargement] = useState(true);
  const [chargementAnciens, setChargementAnciens] = useState(false);
  const [resteDesAnciens, setResteDesAnciens] = useState(false);
  const [avant, setAvant] = useState<string | null>(null);

  const [erreur, setErreur] = useState("");
  const [tempsReel, setTempsReel] = useState(true);

  /** Messages restants aujourd'hui. `null` = illimité. */
  const [messagesRestants, setMessagesRestants] = useState<number | null>(null);

  const [sourdineActive, setSourdineActive] = useState(false);
  const [rangee, setRangee] = useState(false);
  const [menuSourdine, setMenuSourdine] = useState(false);
  const [reglageEnCours, setReglageEnCours] = useState(false);

  const [signale, setSignale] = useState<{
    id: string;
    type: "user" | "message";
  } | null>(null);

  const conteneurRef = useRef<HTMLDivElement | null>(null);
  const basRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const restants = subscription?.usage?.remainingMessages;
    if (typeof restants === "number") setMessagesRestants(restants);
  }, [subscription]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth?mode=login");
  }, [status, router]);

  const versLeBas = useCallback(
    (comportement: ScrollBehavior = "smooth") => {
      basRef.current?.scrollIntoView({
        behavior: reduireAnimations ? "auto" : comportement,
        block: "end",
      });
    },
    [reduireAnimations]
  );

  /**
   * Interlocuteur et réglages de la conversation.
   *
   * On passe par `/api/matches`, qui renvoie la liste complète : c'est un
   * détour, mais c'est aussi la seule route qui expose `archivee` et
   * `sourdineActive`. Le jour où le volume le justifie, une route
   * `/api/matches/[id]` en lecture ferait mieux.
   */
  const lireRelation = useCallback(async () => {
    try {
      const reponse = await fetch("/api/matches", { cache: "no-store" });
      const donnees = await reponse.json().catch(() => null);

      if (donnees?.success !== true) return;

      const relation = (donnees.matches ?? []).find(
        (item: { matchId: string }) => item.matchId === matchId
      );

      if (!relation) return;

      setInterlocuteur(relation.user ?? null);
      setSourdineActive(relation.sourdineActive === true);
      setRangee(relation.archivee === true);
    } catch {
      // Sans ces informations, la conversation reste utilisable.
    }
  }, [matchId]);

  /** Derniers messages. */
  const lireMessages = useCallback(async () => {
    if (!matchId) return;

    setChargement(true);
    setErreur("");

    try {
      const reponse = await fetch(`/api/messages/${matchId}`, {
        cache: "no-store",
      });

      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || donnees?.success !== true) {
        setErreur(donnees?.error || "Cette conversation est inaccessible.");
        return;
      }

      setMessages(donnees.messages ?? []);
      setMonId(donnees.currentUserId ?? "");
      setResteDesAnciens(Boolean(donnees.hasMore));
      setAvant(donnees.pagination?.nextBefore ?? null);

      // Laisse le DOM se peindre avant de descendre.
      window.setTimeout(() => versLeBas("auto"), 60);

      /*
       * `GET /api/messages/[matchId]` vient de poser `readAt` sur les messages
       * reçus : la pastille de la barre latérale n'a plus lieu d'être. On la
       * fait relire tout de suite plutôt que d'attendre sa relecture
       * périodique.
       */
      window.dispatchEvent(new Event("solys:notifications"));
    } catch {
      setErreur("Connexion interrompue.");
    } finally {
      setChargement(false);
    }
  }, [matchId, versLeBas]);

  useEffect(() => {
    if (status !== "authenticated") return;

    void lireRelation();
    void lireMessages();
  }, [status, lireRelation, lireMessages]);

  /**
   * Anciens messages, en préservant la position de lecture.
   *
   * Sans cette correction, ajouter des messages en haut fait sauter la vue :
   * on mémorise la hauteur avant, et on décale d'autant après.
   */
  const chargerAnciens = async () => {
    if (!avant || chargementAnciens) return;

    const conteneur = conteneurRef.current;
    const hauteurAvant = conteneur?.scrollHeight ?? 0;
    const positionAvant = conteneur?.scrollTop ?? 0;

    setChargementAnciens(true);

    try {
      const reponse = await fetch(
        `/api/messages/${matchId}?before=${encodeURIComponent(avant)}`,
        { cache: "no-store" }
      );

      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || donnees?.success !== true) {
        setErreur(donnees?.error || "Impossible de charger l’historique.");
        return;
      }

      setMessages((actuels) => fusionner(donnees.messages ?? [], actuels));
      setResteDesAnciens(Boolean(donnees.hasMore));
      setAvant(donnees.pagination?.nextBefore ?? null);

      window.setTimeout(() => {
        const maintenant = conteneurRef.current;
        if (!maintenant) return;

        maintenant.scrollTop =
          positionAvant + (maintenant.scrollHeight - hauteurAvant);
      }, 0);
    } catch {
      setErreur("Connexion interrompue.");
    } finally {
      setChargementAnciens(false);
    }
  };

  /** Temps réel : arrivée des messages et accusés de lecture. */
  useEffect(() => {
    if (!matchId || status !== "authenticated") return;

    let client: ReturnType<typeof getPusherClient> | null = null;
    const canal = `private-match-${matchId}`;

    try {
      client = getPusherClient();
      const abonnement = client.subscribe(canal);

      abonnement.bind("new-message", (message: Message) => {
        setMessages((actuels) => fusionner(actuels, [message]));

        const conteneur = conteneurRef.current;
        const prochePdBas =
          !conteneur ||
          conteneur.scrollHeight - conteneur.scrollTop - conteneur.clientHeight <
            160;

        if (prochePdBas) window.setTimeout(() => versLeBas(), 40);
      });

      abonnement.bind(
        "messages-read",
        ({ readerId, readAt }: { readerId: string; readAt: string }) => {
          // Mes messages viennent d'être lus par l'autre.
          if (readerId === monId) return;

          setMessages((actuels) =>
            actuels.map((message) =>
              message.senderId === monId && message.readAt === null
                ? { ...message, readAt }
                : message
            )
          );
        }
      );

      return () => {
        abonnement.unbind_all();
        client?.unsubscribe(canal);
      };
    } catch {
      /**
       * Clés Pusher absentes ou invalides : la conversation reste utilisable,
       * simplement sans mise à jour automatique. On le dit à l'écran.
       */
      setTempsReel(false);
      return undefined;
    }
  }, [matchId, status, monId, versLeBas]);

  /** Envoi, avec affichage optimiste. */
  const envoyer = async () => {
    const contenu = saisie.trim();
    const photo = photoEnAttente;

    // Un mot, une photo, ou les deux. Pas rien.
    if ((!contenu && !photo) || envoi || envoiPhoto || messagesRestants === 0) {
      return;
    }

    setEnvoi(true);
    setErreur("");

    const provisoire: Message = {
      _id: `provisoire-${Date.now()}`,
      matchId: String(matchId),
      senderId: monId,
      content: contenu,
      imageUrl: photo,
      readAt: null,
      createdAt: new Date().toISOString(),
    };

    setMessages((actuels) => [...actuels, provisoire]);
    setSaisie("");
    setPhotoEnAttente(null);
    window.setTimeout(() => versLeBas(), 40);

    try {
      const reponse = await fetch(`/api/messages/${matchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contenu, imageUrl: photo }),
      });

      const donnees = await reponse.json().catch(() => null);

      if (donnees?.quota) {
        setMessagesRestants(donnees.quota.restants ?? null);
      }

      if (!reponse.ok || donnees?.success !== true) {
        // On retire le message provisoire et on rend le texte à la saisie.
        setMessages((actuels) =>
          actuels.filter((message) => message._id !== provisoire._id)
        );
        setSaisie(contenu);
        setPhotoEnAttente(photo);
        setErreur(donnees?.error || "Ce message n’a pas été envoyé.");
        return;
      }

      setMessages((actuels) =>
        fusionner(
          actuels.filter((message) => message._id !== provisoire._id),
          [donnees.message]
        )
      );
    } catch {
      setMessages((actuels) =>
        actuels.filter((message) => message._id !== provisoire._id)
      );
      setSaisie(contenu);
      setPhotoEnAttente(photo);
      setErreur("Connexion interrompue. Ton message n’est pas parti.");
    } finally {
      setEnvoi(false);
    }
  };

  /**
   * Dépose une photo sur Cloudinary.
   *
   * L'envoi du message est une seconde étape : on voit d'abord ce qu'on
   * s'apprête à montrer, et on peut encore se raviser. La modération
   * automatique se fait côté serveur, dans `/api/upload/chat-image` —
   * une image refusée ne revient jamais jusqu'ici.
   */
  const televerserPhoto = async (fichier: File | null | undefined) => {
    if (!fichier) return;

    setEnvoiPhoto(true);
    setErreur("");
    setMenuPlus(false);

    try {
      const formulaire = new FormData();
      formulaire.append("file", fichier);

      const reponse = await fetch("/api/upload/chat-image", {
        method: "POST",
        body: formulaire,
      });

      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || donnees?.success !== true || !donnees?.url) {
        setErreur(donnees?.error || "Cette photo n’a pas pu être envoyée.");
        return;
      }

      setPhotoEnAttente(donnees.url as string);
      champSaisie.current?.focus();
    } catch {
      setErreur("Connexion interrompue. La photo n’est pas partie.");
    } finally {
      setEnvoiPhoto(false);
    }
  };

  /**
   * Insère un texte à la position du curseur.
   *
   * Un émoji ajouté au bout d'une phrase déjà écrite serait une surprise
   * désagréable ; il se pose là où on écrivait.
   */
  const inserer = (texte: string) => {
    const champ = champSaisie.current;

    if (!champ) {
      setSaisie((actuelle) => (actuelle + texte).slice(0, LONGUEUR_MAX));
      return;
    }

    const debut = champ.selectionStart ?? champ.value.length;
    const fin = champ.selectionEnd ?? debut;

    const nouvelle = (
      champ.value.slice(0, debut) +
      texte +
      champ.value.slice(fin)
    ).slice(0, LONGUEUR_MAX);

    setSaisie(nouvelle);

    // Le curseur se replace après ce qu'on vient d'insérer.
    window.requestAnimationFrame(() => {
      champ.focus();
      const position = Math.min(debut + texte.length, nouvelle.length);
      champ.setSelectionRange(position, position);
    });
  };

  /** Sourdine : `minutes: 0` la lève. */
  const reglerSourdine = async (minutes: number) => {
    setReglageEnCours(true);
    setMenuSourdine(false);

    try {
      const reponse = await fetch(`/api/matches/${matchId}/mute`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes }),
      });

      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || donnees?.success !== true) {
        setErreur(donnees?.error || "La sourdine n’a pas pu être modifiée.");
        return;
      }

      setSourdineActive(Boolean(donnees.mutedUntil));
    } catch {
      setErreur("Connexion interrompue.");
    } finally {
      setReglageEnCours(false);
    }
  };

  /** Rangement : la route bascule, elle ne prend pas d'état en entrée. */
  const basculerRangement = async () => {
    setReglageEnCours(true);

    try {
      const reponse = await fetch(`/api/matches/${matchId}/archive`, {
        method: "PATCH",
      });

      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || donnees?.success !== true) {
        setErreur(donnees?.error || "Le rangement n’a pas pu être modifié.");
        return;
      }

      setRangee(donnees.archived === true);
    } catch {
      setErreur("Connexion interrompue.");
    } finally {
      setReglageEnCours(false);
    }
  };

  /** Messages groupés par jour. */
  const parJour = useMemo(() => {
    const groupes: Array<{ jour: string; messages: Message[] }> = [];

    for (const message of messages) {
      const jour = formaterJour(message.createdAt);
      const dernier = groupes[groupes.length - 1];

      if (dernier && dernier.jour === jour) dernier.messages.push(message);
      else groupes.push({ jour, messages: [message] });
    }

    return groupes;
  }, [messages]);

  /**
   * Les photos du fil, dans l'ordre.
   *
   * La visionneuse navigue d'une photo à l'autre : elle a besoin de la
   * liste complète, pas seulement de celle sur laquelle on a cliqué.
   * Les messages provisoires en sont exclus — leur photo est déjà en
   * ligne, mais tant que le message n'est pas confirmé, l'index
   * changerait sous les doigts.
   */
  const photosDuFil = useMemo(
    () =>
      messages
        .filter((message) => !message._id.startsWith("provisoire-"))
        .map((message) => message.imageUrl)
        .filter((url): url is string => Boolean(url)),
    [messages]
  );

  const nom = interlocuteur?.pseudonyme ?? "Ce membre";
  const quotaAtteint = messagesRestants === 0;

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
      <div className="flex min-h-screen flex-col bg-nuit text-champagne">
        {/* ─────────────────────────────
            En-tête
        ───────────────────────────── */}
        <header className="border-b border-champagne/10 bg-minuit px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/matches")}
              aria-label="Revenir aux mises en relation"
              className={`shrink-0 rounded-xl border border-champagne/12 p-2 text-champagne/75 transition-colors hover:border-champagne/25 hover:text-champagne ${focusRing}`}
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </button>

            {interlocuteur ? (
              <>
                <Link
                  href={`/profil/${interlocuteur._id}?from=messages`}
                  className={`h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-champagne/12 bg-nuit ${focusRing}`}
                >
                  {interlocuteur.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={interlocuteur.image}
                      alt={`Photo de ${nom}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <UserRound
                        size={16}
                        className="text-champagne/55"
                        aria-hidden="true"
                      />
                    </span>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/profil/${interlocuteur._id}?from=messages`}
                      className={`font-display min-w-0 truncate text-[15px] font-bold text-champagne hover:text-cuivre ${focusRing}`}
                    >
                      {nom}
                      {interlocuteur.age ? `, ${interlocuteur.age}` : ""}
                    </Link>

                    {interlocuteur.identityVerified && (
                      <ShieldCheck
                        size={13}
                        className="shrink-0 text-succes"
                        aria-label="Identité vérifiée"
                      />
                    )}
                  </div>

                  {interlocuteur.localisation && (
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-champagne/55">
                      <MapPin size={10} aria-hidden="true" />
                      <span className="truncate">
                        {interlocuteur.localisation}
                      </span>
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-champagne/70">
                  Conversation
                </p>
              </div>
            )}

            {/* Réglages */}
            <div className="relative flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => setMenuSourdine((ouvert) => !ouvert)}
                disabled={reglageEnCours}
                aria-expanded={menuSourdine}
                aria-label={
                  sourdineActive
                    ? "Sourdine active — modifier"
                    : "Mettre en sourdine"
                }
                className={`rounded-xl border p-2 transition-colors disabled:opacity-50 ${focusRing} ${
                  sourdineActive
                    ? "border-cuivre/40 text-cuivre"
                    : "border-champagne/12 text-champagne/60 hover:border-champagne/25 hover:text-champagne"
                }`}
              >
                {sourdineActive ? (
                  <BellOff size={15} aria-hidden="true" />
                ) : (
                  <Bell size={15} aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={basculerRangement}
                disabled={reglageEnCours}
                aria-pressed={rangee}
                aria-label={rangee ? "Sortir du rangement" : "Ranger"}
                className={`rounded-xl border p-2 transition-colors disabled:opacity-50 ${focusRing} ${
                  rangee
                    ? "border-cuivre/40 text-cuivre"
                    : "border-champagne/12 text-champagne/60 hover:border-champagne/25 hover:text-champagne"
                }`}
              >
                <Archive size={15} aria-hidden="true" />
              </button>

              {interlocuteur && (
                <button
                  type="button"
                  onClick={() =>
                    setSignale({ id: interlocuteur._id, type: "user" })
                  }
                  aria-label={`Signaler ${nom}`}
                  className={`rounded-xl border border-champagne/12 p-2 text-champagne/60 transition-colors hover:border-cuivre/40 hover:text-cuivre ${focusRing}`}
                >
                  <Flag size={15} aria-hidden="true" />
                </button>
              )}

              {/* Menu sourdine */}
              <AnimatePresence>
                {menuSourdine && (
                  <motion.div
                    initial={{ opacity: 0, y: reduireAnimations ? 0 : -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reduireAnimations ? 0 : -6 }}
                    transition={{ duration: reduireAnimations ? 0 : 0.15 }}
                    className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-xl border border-champagne/12 bg-minuit shadow-xl"
                  >
                    <p className="border-b border-champagne/10 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-champagne/70">
                      Couper les notifications
                    </p>

                    <ul>
                      {DUREES_SOURDINE.map((duree) => (
                        <li key={duree.minutes}>
                          <button
                            type="button"
                            onClick={() => reglerSourdine(duree.minutes)}
                            className={`block w-full px-3.5 py-2.5 text-left text-[13px] text-champagne/80 transition-colors hover:bg-champagne/5 hover:text-champagne ${focusRing}`}
                          >
                            {duree.label}
                          </button>
                        </li>
                      ))}

                      {sourdineActive && (
                        <li className="border-t border-champagne/10">
                          <button
                            type="button"
                            onClick={() => reglerSourdine(0)}
                            className={`block w-full px-3.5 py-2.5 text-left text-[13px] font-semibold text-champagne transition-colors hover:bg-champagne/5 ${focusRing}`}
                          >
                            Réactiver les notifications
                          </button>
                        </li>
                      )}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Bandeaux d'état */}
        {(!tempsReel || sourdineActive || rangee) && (
          <div className="border-b border-champagne/10 bg-nuit px-4 py-2.5 sm:px-6">
            <div className="mx-auto max-w-3xl space-y-1.5">
              {!tempsReel && (
                <p className="text-[12px] leading-relaxed text-champagne/60">
                  Mise à jour automatique indisponible : les nouveaux messages
                  apparaîtront au rechargement de la page.
                </p>
              )}

              {sourdineActive && (
                <p className="text-[12px] leading-relaxed text-champagne/60">
                  Notifications coupées pour cette conversation. Les messages
                  arrivent toujours.
                </p>
              )}

              {rangee && (
                <p className="text-[12px] leading-relaxed text-champagne/60">
                  Conversation rangée : elle est masquée dans tes relations, mais
                  occupe toujours une place.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ─────────────────────────────
            Messages
        ───────────────────────────── */}
        {/* ─────────────────────────────
            La conversation, posée sur un décor

            Le fond uni laissait la messagerie plus froide que le reste
            du site. L'image passe dessous, et un voile la retient.

            Le voile est à 70 %, et ce chiffre est mesuré, pas choisi à
            l'œil : `solys-02` est déjà une photo de nuit, dont seules
            les bougies et l'éclipse sont claires. À 70 %, le pixel le
            plus clair de l'image laisse encore 5,3:1 au champagne — au
            -dessus du seuil AA — alors qu'un voile plus épais effacerait
            le décor sans rien gagner de lisible.
        ───────────────────────────── */}
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/visuels/solys-02.webp"
              alt=""
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-nuit/70" />

            {/* Les deux extrémités s'enfoncent dans le noir, pour que
                l'en-tête et le composeur ne flottent pas sur une
                découpe nette. */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-nuit to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-nuit/85 to-transparent" />
          </div>

          <div
            ref={conteneurRef}
            className="relative flex-1 overflow-y-auto px-4 py-5 sm:px-6"
          >
            <div className="mx-auto max-w-3xl">
              {chargement ? (
                <div className="flex flex-col items-center gap-3 py-24">
                  <Loader2
                    className="h-7 w-7 animate-spin text-cuivre"
                    aria-hidden="true"
                  />
                  <p className="text-[13px] text-champagne/55">
                    Chargement de la conversation…
                  </p>
                </div>
              ) : erreur && messages.length === 0 ? (
                <div className="rounded-2xl border border-champagne/10 bg-minuit px-6 py-16 text-center">
                  <AlertCircle
                    size={22}
                    className="mx-auto mb-4 text-cuivre"
                    aria-hidden="true"
                  />

                  <p className="font-display text-[17px] font-bold text-champagne">
                    Conversation inaccessible
                  </p>

                  <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-champagne/60">
                    {erreur}
                  </p>

                  <Link
                    href="/matches"
                    className={`mt-6 inline-flex items-center gap-2 rounded-xl border border-champagne/15 px-5 py-2.5 text-[13px] font-semibold text-champagne transition-colors hover:border-champagne/30 ${focusRing}`}
                  >
                    <ArrowLeft size={14} aria-hidden="true" />
                    Mes relations
                  </Link>
                </div>
              ) : (
                <>
                  {resteDesAnciens && (
                    <div className="mb-5 flex justify-center">
                      <button
                        type="button"
                        onClick={chargerAnciens}
                        disabled={chargementAnciens}
                        className={`inline-flex items-center gap-2 rounded-xl border border-champagne/12 px-4 py-2 text-[12px] font-semibold text-champagne/75 transition-colors hover:border-champagne/25 hover:text-champagne disabled:opacity-50 ${focusRing}`}
                      >
                        {chargementAnciens ? (
                          <Loader2
                            size={13}
                            className="animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <ArrowUp size={13} aria-hidden="true" />
                        )}
                        Messages plus anciens
                      </button>
                    </div>
                  )}

                  {messages.length === 0 ? (
                    <div className="py-20 text-center">
                      <p className="font-display text-[17px] font-bold text-champagne">
                        Rien encore
                      </p>

                      <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-champagne/60">
                        Vous êtes en relation, personne n’a écrit. Une question
                        précise marche mieux qu’un salut.
                      </p>
                    </div>
                  ) : (
                    parJour.map((groupe) => (
                      <section key={groupe.jour} className="mb-5">
                        {/*
                          Une pastille, et non un texte nu : posé
                          directement sur la photo, le libellé du jour
                          se perdait dans le décor.
                        */}
                        <p className="mb-3 text-center">
                          <span className="inline-block rounded-full border border-champagne/10 bg-nuit/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-champagne/60 backdrop-blur-sm">
                            {groupe.jour}
                          </span>
                        </p>

                        <ul className="space-y-2">
                          {groupe.messages.map((message) => {
                            const deMoi = message.senderId === monId;
                            const provisoire =
                              message._id.startsWith("provisoire-");

                            // Rang de la photo dans le fil, pour que la
                            // visionneuse s'ouvre sur la bonne.
                            const rangPhoto = message.imageUrl
                              ? photosDuFil.indexOf(message.imageUrl)
                              : -1;

                            /**
                             * Une photo sans légende se passe de bulle.
                             *
                             * Entourée de cuivre, elle devenait un cadre
                             * autour d'une image — lourd, et la couleur
                             * tirait l'œil avant la photo. Nue, avec
                             * l'heure posée dessus dans une pastille
                             * sombre, c'est la photo qu'on regarde.
                             */
                            const photoSeule = Boolean(
                              message.imageUrl && !message.content
                            );

                            return (
                              <li
                                key={message._id}
                                className={`flex ${deMoi ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`group relative max-w-[85%] overflow-hidden rounded-2xl sm:max-w-[70%] ${
                                    photoSeule
                                      ? ""
                                      : message.imageUrl
                                        ? "p-1.5"
                                        : "px-3.5 py-2.5"
                                  } ${
                                    photoSeule
                                      ? "border border-champagne/10"
                                      : deMoi
                                        ? "bg-cuivre text-nuit"
                                        : "border border-champagne/10 bg-minuit text-champagne"
                                  } ${provisoire ? "opacity-60" : ""}`}
                                >
                                  {message.imageUrl && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        rangPhoto >= 0 &&
                                        setPhotoAgrandie(rangPhoto)
                                      }
                                      disabled={rangPhoto < 0}
                                      aria-label="Voir la photo en grand"
                                      className={`block w-full overflow-hidden disabled:cursor-default ${
                                        photoSeule ? "" : "rounded-xl"
                                      } ${focusRing}`}
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={message.imageUrl}
                                        alt="Photo envoyée dans la conversation"
                                        className="max-h-80 w-full object-cover"
                                      />
                                    </button>
                                  )}

                                  {message.content && (
                                    <p
                                      className={`whitespace-pre-wrap break-words text-[14px] leading-relaxed ${
                                        message.imageUrl ? "px-2 pt-2" : ""
                                      }`}
                                    >
                                      {message.content}
                                    </p>
                                  )}

                                  <p
                                    className={`flex items-center justify-end gap-1 text-[10px] ${
                                      photoSeule
                                        ? // Posée sur la photo : la pastille
                                          // sombre garantit la lecture quelle
                                          // que soit l'image dessous.
                                          "absolute bottom-2 right-2 rounded-full bg-nuit/75 px-2 py-1 text-champagne/90 backdrop-blur-sm"
                                        : message.imageUrl
                                          ? "mt-1 px-2 pb-0.5"
                                          : "mt-1"
                                    } ${
                                      photoSeule
                                        ? ""
                                        : // abyss/70 sur orange plein = 3,80:1.
                                          // abyss/90 = 4,93:1, au-dessus du seuil.
                                          deMoi
                                          ? "text-nuit/90"
                                          : "text-champagne/55"
                                    }`}
                                  >
                                    {formaterHeure(message.createdAt)}

                                    {deMoi &&
                                      !provisoire &&
                                      (message.readAt ? (
                                        <CheckCheck
                                          size={12}
                                          aria-label="Lu"
                                        />
                                      ) : (
                                        <Check size={12} aria-label="Envoyé" />
                                      ))}

                                    {!deMoi && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setSignale({
                                            id: message._id,
                                            type: "message",
                                          })
                                        }
                                        aria-label="Signaler ce message"
                                        className={`ml-1 text-champagne/60 opacity-0 transition-opacity hover:text-cuivre focus-visible:opacity-100 group-hover:opacity-100 ${focusRing}`}
                                      >
                                        <Flag size={11} aria-hidden="true" />
                                      </button>
                                    )}
                                  </p>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    ))
                  )}

                  <div ref={basRef} />
                </>
              )}
            </div>
          </div>

          {/* ─────────────────────────────
              Saisie
          ───────────────────────────── */}
          {/*
            Le composeur flotte sur le décor au lieu de le trancher par
            un bandeau opaque. Le voile propre à la barre (`bg-minuit/85`
            et un flou) garde la saisie lisible quoi qu'il y ait derrière.
          */}
          <div className="relative px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-1 sm:px-6 sm:pb-4">
            <div className="mx-auto max-w-3xl">
              {erreur && messages.length > 0 && (
                <div
                  role="alert"
                  className="mb-3 flex items-start gap-2.5 rounded-xl border border-cuivre/30 bg-cuivre/10 px-3.5 py-2.5"
                >
                  <AlertCircle
                    size={14}
                    className="mt-0.5 shrink-0 text-cuivre"
                    aria-hidden="true"
                  />
                  <p className="flex-1 text-[12px] leading-relaxed text-champagne/85">
                    {erreur}
                  </p>
                  <button
                    type="button"
                    onClick={() => setErreur("")}
                    aria-label="Fermer le message"
                    className={`shrink-0 text-champagne/55 hover:text-champagne ${focusRing}`}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              )}

              {quotaAtteint ? (
                <div className="rounded-xl border border-cuivre/30 bg-cuivre/10 px-4 py-3">
                  <p className="text-[13px] leading-relaxed text-champagne/85">
                    Tu as envoyé tous tes messages du jour. Le compteur repart à
                    minuit, ou{" "}
                    <Link
                      href="/tarifs"
                      className={`font-semibold text-champagne underline underline-offset-2 hover:text-cuivre ${focusRing}`}
                    >
                      vois les offres sans limite
                    </Link>
                    .
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(evenement) => {
                    evenement.preventDefault();
                    void envoyer();
                  }}
                  className="rounded-[26px] border border-champagne/12 bg-minuit/90 p-2 shadow-[0_18px_50px_-22px_rgba(0,0,0,0.95)] backdrop-blur-xl"
                >
                  {/*
                    L'aperçu de la photo en attente.

                    Une photo est déjà en ligne quand elle apparaît ici,
                    mais pas encore envoyée : on la voit, on peut lui
                    joindre un mot, et on peut la retirer.
                  */}
                  {photoEnAttente && (
                    <div className="mb-2 flex items-center gap-3 rounded-2xl border border-champagne/10 bg-nuit/60 p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoEnAttente}
                        alt="Photo à envoyer"
                        className="h-14 w-14 shrink-0 rounded-xl object-cover"
                      />

                      <p className="min-w-0 flex-1 text-[12px] leading-relaxed text-champagne/70">
                        Photo prête. Ajoute un mot si tu veux, puis envoie.
                      </p>

                      <button
                        type="button"
                        onClick={() => setPhotoEnAttente(null)}
                        aria-label="Retirer la photo"
                        className={`shrink-0 rounded-full p-2 text-champagne/60 transition hover:text-champagne ${focusRing}`}
                      >
                        <X size={15} aria-hidden="true" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    {/* ─── Le « + » ──────────────────────────────── */}
                    <div ref={ancrePlus} className="relative shrink-0">
                      <MenuPlus
                        ancre={ancrePlus}
                        ouvert={menuPlus}
                        onFermer={() => setMenuPlus(false)}
                        onPhoto={() => champPhoto.current?.click()}
                        onCamera={() => champCamera.current?.click()}
                        onQuestion={(question) => {
                          setMenuPlus(false);
                          inserer(question);
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => {
                          setEmojis(false);
                          setMenuPlus((ouvert) => !ouvert);
                        }}
                        aria-label="Ajouter au message"
                        aria-expanded={menuPlus}
                        className={`rounded-full border border-champagne/15 p-2.5 text-champagne/75 transition hover:border-champagne/30 hover:text-champagne ${focusRing}`}
                      >
                        <Plus
                          size={18}
                          aria-hidden="true"
                          className={`transition-transform duration-200 motion-reduce:transition-none ${
                            menuPlus ? "rotate-45" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* ─── La saisie ─────────────────────────────── */}
                    <div className="flex min-w-0 flex-1 items-end gap-1 rounded-[20px] border border-champagne/12 bg-nuit/65 pl-3.5 pr-1.5">
                      <label htmlFor="message" className="sr-only">
                        Ton message
                      </label>

                      <textarea
                        id="message"
                        ref={champSaisie}
                        value={saisie}
                        onChange={(evenement) =>
                          setSaisie(evenement.target.value.slice(0, LONGUEUR_MAX))
                        }
                        onKeyDown={(evenement) => {
                          if (evenement.key === "Enter" && !evenement.shiftKey) {
                            evenement.preventDefault();
                            void envoyer();
                          }
                        }}
                        rows={1}
                        placeholder="Écris ton message…"
                        className="max-h-32 min-w-0 flex-1 resize-y border-0 bg-transparent py-2.5 text-[14px] text-champagne placeholder:text-champagne/55 focus:outline-none"
                      />

                      {/* ─── Les émojis ──────────────────────────── */}
                      <div ref={ancreEmojis} className="relative shrink-0">
                        <SelecteurEmojis
                          ancre={ancreEmojis}
                          ouvert={emojis}
                          onFermer={() => setEmojis(false)}
                          onChoisir={(emoji) => inserer(emoji)}
                        />

                        <button
                          type="button"
                          onClick={() => {
                            setMenuPlus(false);
                            setEmojis((ouvert) => !ouvert);
                          }}
                          aria-label="Choisir un émoji"
                          aria-expanded={emojis}
                          className={`rounded-full p-2 text-champagne/65 transition hover:text-champagne ${focusRing}`}
                        >
                          <Smile size={17} aria-hidden="true" />
                        </button>
                      </div>

                      {/*
                        Le trombone est un raccourci direct vers la
                        photothèque, pas un second menu : il mènerait
                        exactement où mène déjà « Photo ». Il ouvrira un
                        menu le jour où les fichiers et les liens
                        existeront.
                      */}
                      <button
                        type="button"
                        onClick={() => champPhoto.current?.click()}
                        disabled={envoiPhoto}
                        aria-label="Joindre une photo"
                        className={`shrink-0 rounded-full p-2 text-champagne/65 transition hover:text-champagne disabled:opacity-40 ${focusRing}`}
                      >
                        {envoiPhoto ? (
                          <Loader2
                            size={17}
                            className="animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Paperclip size={17} aria-hidden="true" />
                        )}
                      </button>
                    </div>

                    {/* ─── Envoyer ───────────────────────────────── */}
                    <button
                      type="submit"
                      disabled={
                        (!saisie.trim() && !photoEnAttente) || envoi || envoiPhoto
                      }
                      aria-label="Envoyer"
                      className={`shrink-0 rounded-full bg-degrade-cuivre p-3 text-nuit transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
                    >
                      {envoi ? (
                        <Loader2
                          size={18}
                          className="animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Send size={18} aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  <p className="mt-1.5 flex flex-wrap items-center gap-x-3 px-2 text-[11px] text-champagne/65">
                    <span className="hidden sm:inline">
                      Entrée pour envoyer, Maj+Entrée pour aller à la ligne.
                    </span>

                    {messagesRestants !== null && (
                      <span>
                        {messagesRestants} message
                        {messagesRestants > 1 ? "s" : ""} aujourd’hui
                      </span>
                    )}

                    {saisie.length > LONGUEUR_MAX - 100 && (
                      <span>
                        {saisie.length} / {LONGUEUR_MAX}
                      </span>
                    )}
                  </p>

                  {/*
                    Les deux champs de fichier, invisibles.

                    `capture` fait ouvrir l'appareil photo sur mobile ; sur
                    un ordinateur l'attribut est ignoré et c'est la
                    photothèque qui s'ouvre, ce qui reste un comportement
                    acceptable.
                  */}
                  <input
                    ref={champPhoto}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(evenement) => {
                      void televerserPhoto(evenement.target.files?.[0]);
                      evenement.target.value = "";
                    }}
                  />

                  <input
                    ref={champCamera}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(evenement) => {
                      void televerserPhoto(evenement.target.files?.[0]);
                      evenement.target.value = "";
                    }}
                  />
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={signale !== null}
        targetId={signale?.id ?? ""}
        targetType={signale?.type ?? "user"}
        onClose={() => setSignale(null)}
      />

      <VisionneusePhotos
        photos={photosDuFil}
        indexOuvert={photoAgrandie}
        onFermer={() => setPhotoAgrandie(null)}
        onChanger={setPhotoAgrandie}
        nom={nom}
      />
    </>
  );
}
