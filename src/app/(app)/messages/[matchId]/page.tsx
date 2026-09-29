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
  Send,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import { getPusherClient } from "@/lib/pusher-client";
import ReportModal from "@/components/ReportModal";
import { usePremium } from "@/hooks/usePremium";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Message {
  _id: string;
  matchId: string;
  senderId: string;
  content: string;
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss";

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

    if (!contenu || envoi || messagesRestants === 0) return;

    setEnvoi(true);
    setErreur("");

    const provisoire: Message = {
      _id: `provisoire-${Date.now()}`,
      matchId: String(matchId),
      senderId: monId,
      content: contenu,
      readAt: null,
      createdAt: new Date().toISOString(),
    };

    setMessages((actuels) => [...actuels, provisoire]);
    setSaisie("");
    window.setTimeout(() => versLeBas(), 40);

    try {
      const reponse = await fetch(`/api/messages/${matchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: contenu }),
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
      setErreur("Connexion interrompue. Ton message n’est pas parti.");
    } finally {
      setEnvoi(false);
    }
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

  const nom = interlocuteur?.pseudonyme ?? "Ce membre";
  const quotaAtteint = messagesRestants === 0;

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
      <div className="flex min-h-screen flex-col bg-abyss text-cream">
        {/* ─────────────────────────────
            En-tête
        ───────────────────────────── */}
        <header className="border-b border-cream/10 bg-[#123243] px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/matches")}
              aria-label="Revenir aux mises en relation"
              className={`shrink-0 rounded-xl border border-cream/12 p-2 text-cream/75 transition-colors hover:border-cream/25 hover:text-cream ${focusRing}`}
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </button>

            {interlocuteur ? (
              <>
                <Link
                  href={`/profil/${interlocuteur._id}?from=messages`}
                  className={`h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-cream/12 bg-abyss ${focusRing}`}
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
                        className="text-cream/55"
                        aria-hidden="true"
                      />
                    </span>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/profil/${interlocuteur._id}?from=messages`}
                      className={`font-display [font-stretch:125%] min-w-0 truncate text-[15px] font-bold text-cream hover:text-orange ${focusRing}`}
                    >
                      {nom}
                      {interlocuteur.age ? `, ${interlocuteur.age}` : ""}
                    </Link>

                    {interlocuteur.identityVerified && (
                      <ShieldCheck
                        size={13}
                        className="shrink-0 text-lime"
                        aria-label="Identité vérifiée"
                      />
                    )}
                  </div>

                  {interlocuteur.localisation && (
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-cream/55">
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
                <p className="text-[14px] font-semibold text-cream/70">
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
                    ? "border-orange/40 text-orange"
                    : "border-cream/12 text-cream/60 hover:border-cream/25 hover:text-cream"
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
                    ? "border-orange/40 text-orange"
                    : "border-cream/12 text-cream/60 hover:border-cream/25 hover:text-cream"
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
                  className={`rounded-xl border border-cream/12 p-2 text-cream/60 transition-colors hover:border-orange/40 hover:text-orange ${focusRing}`}
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
                    className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-xl border border-cream/12 bg-[#123243] shadow-xl"
                  >
                    <p className="border-b border-cream/10 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-cream/70">
                      Couper les notifications
                    </p>

                    <ul>
                      {DUREES_SOURDINE.map((duree) => (
                        <li key={duree.minutes}>
                          <button
                            type="button"
                            onClick={() => reglerSourdine(duree.minutes)}
                            className={`block w-full px-3.5 py-2.5 text-left text-[13px] text-cream/80 transition-colors hover:bg-cream/5 hover:text-cream ${focusRing}`}
                          >
                            {duree.label}
                          </button>
                        </li>
                      ))}

                      {sourdineActive && (
                        <li className="border-t border-cream/10">
                          <button
                            type="button"
                            onClick={() => reglerSourdine(0)}
                            className={`block w-full px-3.5 py-2.5 text-left text-[13px] font-semibold text-cream transition-colors hover:bg-cream/5 ${focusRing}`}
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
          <div className="border-b border-cream/10 bg-abyss px-4 py-2.5 sm:px-6">
            <div className="mx-auto max-w-3xl space-y-1.5">
              {!tempsReel && (
                <p className="text-[12px] leading-relaxed text-cream/60">
                  Mise à jour automatique indisponible : les nouveaux messages
                  apparaîtront au rechargement de la page.
                </p>
              )}

              {sourdineActive && (
                <p className="text-[12px] leading-relaxed text-cream/60">
                  Notifications coupées pour cette conversation. Les messages
                  arrivent toujours.
                </p>
              )}

              {rangee && (
                <p className="text-[12px] leading-relaxed text-cream/60">
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
        <div
          ref={conteneurRef}
          className="flex-1 overflow-y-auto px-4 py-5 sm:px-6"
        >
          <div className="mx-auto max-w-3xl">
            {chargement ? (
              <div className="flex flex-col items-center gap-3 py-24">
                <Loader2
                  className="h-7 w-7 animate-spin text-orange"
                  aria-hidden="true"
                />
                <p className="text-[13px] text-cream/55">
                  Chargement de la conversation…
                </p>
              </div>
            ) : erreur && messages.length === 0 ? (
              <div className="rounded-2xl border border-cream/10 bg-[#123243] px-6 py-16 text-center">
                <AlertCircle
                  size={22}
                  className="mx-auto mb-4 text-orange"
                  aria-hidden="true"
                />

                <p className="font-display [font-stretch:125%] text-[17px] font-bold text-cream">
                  Conversation inaccessible
                </p>

                <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-cream/60">
                  {erreur}
                </p>

                <Link
                  href="/matches"
                  className={`mt-6 inline-flex items-center gap-2 rounded-xl border border-cream/15 px-5 py-2.5 text-[13px] font-semibold text-cream transition-colors hover:border-cream/30 ${focusRing}`}
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
                      className={`inline-flex items-center gap-2 rounded-xl border border-cream/12 px-4 py-2 text-[12px] font-semibold text-cream/75 transition-colors hover:border-cream/25 hover:text-cream disabled:opacity-50 ${focusRing}`}
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
                    <p className="font-display [font-stretch:125%] text-[17px] font-bold text-cream">
                      Rien encore
                    </p>

                    <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-cream/60">
                      Vous êtes en relation, personne n’a écrit. Une question
                      précise marche mieux qu’un salut.
                    </p>
                  </div>
                ) : (
                  parJour.map((groupe) => (
                    <section key={groupe.jour} className="mb-5">
                      <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-wide text-cream/55">
                        {groupe.jour}
                      </p>

                      <ul className="space-y-2">
                        {groupe.messages.map((message) => {
                          const deMoi = message.senderId === monId;
                          const provisoire =
                            message._id.startsWith("provisoire-");

                          return (
                            <li
                              key={message._id}
                              className={`flex ${deMoi ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`group max-w-[85%] rounded-2xl px-3.5 py-2.5 sm:max-w-[70%] ${
                                  deMoi
                                    ? "bg-orange text-abyss"
                                    : "border border-cream/10 bg-[#123243] text-cream"
                                } ${provisoire ? "opacity-60" : ""}`}
                              >
                                <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed">
                                  {message.content}
                                </p>

                                <p
                                  className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                                    // abyss/70 sur orange plein = 3,80:1.
                                    // abyss/90 = 4,93:1, au-dessus du seuil.
                                    deMoi ? "text-abyss/90" : "text-cream/55"
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
                                      className={`ml-1 text-cream/60 opacity-0 transition-opacity hover:text-orange focus-visible:opacity-100 group-hover:opacity-100 ${focusRing}`}
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
        <div className="border-t border-cream/10 bg-[#123243] px-4 py-3 sm:px-6">
          <div className="mx-auto max-w-3xl">
            {erreur && messages.length > 0 && (
              <div
                role="alert"
                className="mb-3 flex items-start gap-2.5 rounded-xl border border-orange/30 bg-orange/10 px-3.5 py-2.5"
              >
                <AlertCircle
                  size={14}
                  className="mt-0.5 shrink-0 text-orange"
                  aria-hidden="true"
                />
                <p className="flex-1 text-[12px] leading-relaxed text-cream/85">
                  {erreur}
                </p>
                <button
                  type="button"
                  onClick={() => setErreur("")}
                  aria-label="Fermer le message"
                  className={`shrink-0 text-cream/55 hover:text-cream ${focusRing}`}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            )}

            {quotaAtteint ? (
              <div className="rounded-xl border border-orange/30 bg-orange/10 px-4 py-3">
                <p className="text-[13px] leading-relaxed text-cream/85">
                  Tu as envoyé tous tes messages du jour. Le compteur repart à
                  minuit, ou{" "}
                  <Link
                    href="/tarifs"
                    className={`font-semibold text-cream underline underline-offset-2 hover:text-orange ${focusRing}`}
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
                className="flex items-end gap-2.5"
              >
                <div className="min-w-0 flex-1">
                  <label htmlFor="message" className="sr-only">
                    Ton message
                  </label>

                  <textarea
                    id="message"
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
                    className={`max-h-32 w-full resize-y rounded-xl border border-cream/12 bg-abyss px-3.5 py-2.5 text-[14px] text-cream placeholder:text-cream/55 ${focusRing}`}
                  />

                  <p className="mt-1.5 flex flex-wrap items-center gap-x-3 text-[11px] text-cream/55">
                    <span>Entrée pour envoyer, Maj+Entrée pour aller à la ligne.</span>

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
                </div>

                <button
                  type="submit"
                  disabled={!saisie.trim() || envoi}
                  aria-label="Envoyer"
                  className={`shrink-0 rounded-xl bg-orange p-3 text-abyss transition-colors hover:bg-orange/90 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
                >
                  {envoi ? (
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Send size={16} aria-hidden="true" />
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={signale !== null}
        targetId={signale?.id ?? ""}
        targetType={signale?.type ?? "user"}
        onClose={() => setSignale(null)}
      />
    </>
  );
}
