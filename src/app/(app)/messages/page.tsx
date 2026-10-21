// src/app/(app)/messages/page.tsx

"use client";

/**
 * Liste des conversations.
 *
 * ## Pourquoi cette page arrive maintenant
 *
 * `Sidebar.tsx` propose « Messages » vers `/messages` depuis le début, avec
 * une pastille de non-lus. **La page n'a jamais existé** : le lien renvoyait
 * un 404. Seules les conversations individuelles étaient servies, sous
 * `/messages/[matchId]`, et on ne pouvait y entrer que depuis `/matches`,
 * `/circle`, une fiche de profil ou l'onglet Interactions. Il n'y avait aucun
 * endroit pour voir ses conversations ensemble.
 *
 * ## Ce que la page montre, et ce qu'elle ne montre pas
 *
 * `/api/matches` renvoie déjà tout ce qu'il faut : `lastMessageAt`,
 * `unreadCount`, `archivee` et `sourdineActive`. Elle ne renvoie **pas** le
 * texte du dernier message. On n'affiche donc pas d'aperçu : inventer une
 * ligne « Salut, comment vas-tu ? » serait une promesse d'interface, et aller
 * chercher le dernier message de chaque conversation demanderait une requête
 * par carte. La date suffit à retrouver une conversation ; l'aperçu viendra
 * quand la route le renverra.
 *
 * Les conversations rangées ne sont pas perdues : elles ont leur propre
 * onglet. Le rangement est un tri, pas une suppression — et une relation
 * rangée occupe toujours une place dans le plafond de mises en relation.
 */

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import EnteteEspace from "@/components/espace/EnteteEspace";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  BellOff,
  Inbox,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";

import { getDepartementLabel } from "@/lib/locations";

interface MembreMatche {
  _id: string;
  pseudonyme: string;
  age?: number;
  localisation?: string;
  departement?: string;
  image?: string;
}

interface Relation {
  matchId: string;
  createdAt: string;
  lastMessageAt: string | null;
  unreadCount?: number;
  hasUnreadMessage?: boolean;
  archivee?: boolean;
  sourdineActive?: boolean;
  user: MembreMatche | null;
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70 focus-visible:ring-offset-2 focus-visible:ring-offset-nuit";

/** Date relative, en français, sans dépendance. */
function tempsRelatif(valeur: string | null) {
  if (!valeur) return null;

  const date = new Date(valeur);
  if (Number.isNaN(date.getTime())) return null;

  const secondes = Math.floor((Date.now() - date.getTime()) / 1000);

  if (secondes < 60) return "à l’instant";
  if (secondes < 3600) return `il y a ${Math.floor(secondes / 60)} min`;
  if (secondes < 86400) return `il y a ${Math.floor(secondes / 3600)} h`;
  if (secondes < 172800) return "hier";
  if (secondes < 604800) return `il y a ${Math.floor(secondes / 86400)} j`;

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

const variantesCarte = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: Math.min(i, 8) * 0.04, duration: 0.28, ease: "easeOut" as const },
  }),
};

export default function PageMessages() {
  const [relations, setRelations] = useState<Relation[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] = useState("");
  const [onglet, setOnglet] = useState<"actives" | "rangees">("actives");

  const lire = async () => {
    setChargement(true);
    setErreur("");

    try {
      const reponse = await fetch("/api/matches", { cache: "no-store" });
      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || !donnees?.success) {
        setErreur(
          donnees?.error ?? "Impossible de charger tes conversations."
        );
        return;
      }

      setRelations(donnees.matches ?? []);
    } catch {
      setErreur("Connexion interrompue.");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    void lire();
  }, []);

  const rangees = useMemo(
    () => relations.filter((r) => r.archivee === true),
    [relations]
  );

  const visibles = useMemo(() => {
    const base = onglet === "rangees" ? rangees : relations.filter((r) => !r.archivee);

    const terme = recherche.trim().toLowerCase();
    const filtrees = terme
      ? base.filter((r) =>
          (r.user?.pseudonyme ?? "").toLowerCase().includes(terme)
        )
      : base;

    /*
     * Les conversations entamées d'abord, de la plus récente à la plus
     * ancienne ; celles où personne n'a encore écrit ensuite, par date de
     * mise en relation. Une conversation vide n'est pas une vieille
     * conversation, c'est une conversation à commencer.
     */
    return [...filtrees].sort((a, b) => {
      if (a.lastMessageAt && b.lastMessageAt) {
        return (
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime()
        );
      }
      if (a.lastMessageAt) return -1;
      if (b.lastMessageAt) return 1;
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }, [relations, rangees, onglet, recherche]);

  const nonLus = useMemo(
    () =>
      relations
        .filter((r) => !r.archivee)
        .reduce((total, r) => total + (r.unreadCount ?? 0), 0),
    [relations]
  );

  /**
   * La conversation que le panneau de droite propose de reprendre.
   *
   * `user` peut être nul — compte supprimé ou banni — et la page ne lie
   * jamais ces conversations-là. Le panneau applique la même règle.
   */
  const premiereOuvrable = visibles.find((relation) => relation.user) ?? null;

  return (
    // Même gabarit que /matches et /circle : la marge et la largeur de
    // lecture de l'espace connecté sont communes à toutes ses pages.
    <div className="min-h-screen px-4 py-6 text-champagne sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-screen-2xl">
        <EnteteEspace
          className="mb-6"
          surtitre="Mes échanges"
          titre="Messages"
          sousTitre={
            nonLus > 0
              ? `${nonLus} message${nonLus > 1 ? "s" : ""} non lu${nonLus > 1 ? "s" : ""}. Toutes tes conversations, dans un espace sobre et confidentiel.`
              : "Toutes tes conversations, dans un espace sobre et confidentiel."
          }
        >
          <button
              type="button"
              onClick={() => void lire()}
              disabled={chargement}
              className={`fx-ghost inline-flex items-center gap-2 rounded-xl border border-champagne/15 px-3.5 py-2 text-[12px] font-semibold text-champagne disabled:opacity-50 ${focusRing}`}
            >
              <RefreshCw
                size={13}
                className={chargement ? "animate-spin" : ""}
                aria-hidden="true"
              />
              Actualiser
            </button>
        </EnteteEspace>

        {/*
          Deux colonnes, comme la maquette : la liste à gauche, le contexte
          à droite.

          La maquette dessine à droite un aperçu de conversation avec sa
          zone de saisie. Elle reconnaît elle-même n'y montrer aucun message
          privé — et pour cause : une conversation s'ouvre sur sa propre
          page, `/messages/[matchId]`, qui porte la lecture, l'envoi et le
          marquage comme lu. Reproduire ici un champ « Écris ton message… »
          qui n'enverrait rien serait le genre de faux-semblant que ce
          projet passe son temps à retirer. Le panneau dit donc où vont les
          conversations, et ouvre la dernière d'un clic.
        */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <section className="rounded-2xl border border-champagne/12 bg-minuit/70 p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="font-display text-[22px] font-normal leading-snug text-ivoire">
                Conversations
              </h2>

              <span className="shrink-0 rounded-full border border-cuivre/45 bg-cuivre/10 px-3.5 py-1.5 text-[12px] font-semibold text-champagne">
                {visibles.length}{" "}
                {visibles.length > 1 ? "conversations" : "conversation"}
              </span>
            </div>

        {/* Recherche + onglets */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-champagne/45"
              aria-hidden="true"
            />
            <input
              type="search"
              value={recherche}
              onChange={(evenement) => setRecherche(evenement.target.value)}
              placeholder="Chercher un pseudonyme"
              aria-label="Chercher une conversation"
              className={`w-full rounded-xl border border-champagne/12 bg-minuit py-2.5 pl-10 pr-3.5 text-[13px] text-champagne placeholder:text-champagne/55 ${focusRing}`}
            />
          </div>

          <div
            className="flex shrink-0 gap-1 rounded-xl border border-champagne/10 bg-minuit p-1"
            role="tablist"
            aria-label="Filtrer les conversations"
          >
            {(
              [
                { id: "actives" as const, label: "Conversations" },
                { id: "rangees" as const, label: `Rangées${rangees.length ? ` (${rangees.length})` : ""}` },
              ]
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={onglet === item.id}
                onClick={() => setOnglet(item.id)}
                className={`rounded-lg px-3.5 py-2 text-[12px] font-semibold transition-colors ${focusRing} ${
                  onglet === item.id
                    ? "bg-cuivre text-nuit"
                    : "text-champagne/70 hover:text-champagne"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {erreur && (
          <p
            className="mb-4 rounded-xl border border-cuivre/35 bg-cuivre/[0.08] px-4 py-3 text-[13px] text-champagne/85"
            role="alert"
          >
            {erreur}
          </p>
        )}

        {chargement ? (
          <div className="flex justify-center py-16">
            <Loader2
              size={26}
              className="animate-spin text-champagne/40"
              aria-hidden="true"
            />
          </div>
        ) : visibles.length === 0 ? (
          <div className="rounded-2xl border border-champagne/10 bg-minuit px-6 py-14 text-center">
            <Inbox
              size={26}
              className="mx-auto mb-3 text-champagne/35"
              aria-hidden="true"
            />

            {recherche.trim() ? (
              <p className="text-[14px] text-champagne/70">
                Aucune conversation avec ce pseudonyme.
              </p>
            ) : onglet === "rangees" ? (
              <p className="text-[14px] text-champagne/70">
                Rien de rangé. Les conversations mises de côté depuis une
                conversation atterrissent ici.
              </p>
            ) : (
              <>
                <p className="text-[14px] text-champagne/70">
                  Pas encore de conversation.
                </p>
                <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-champagne/55">
                  Une conversation s’ouvre dès qu’une mise en relation est
                  acceptée des deux côtés.
                </p>

                <Link
                  href="/explorer"
                  className={`mt-5 inline-flex items-center gap-2 rounded-xl bg-cuivre px-4 py-2.5 text-[12px] font-bold text-nuit transition-colors hover:bg-cuivre/90 ${focusRing}`}
                >
                  Parcourir l’annuaire
                </Link>
              </>
            )}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            <ul className="space-y-2.5">
              {visibles.map((relation, index) => {
                const membre = relation.user;
                const nonLu = Boolean(relation.hasUnreadMessage);
                const quand = tempsRelatif(relation.lastMessageAt);

                const lieu = membre
                  ? [membre.localisation, getDepartementLabel(membre.departement)]
                      .filter(Boolean)
                      .join(" · ")
                  : "";

                /*
                 * `user` peut être null : compte supprimé ou banni. La
                 * conversation existe toujours côté base, mais l'ouvrir n'a plus
                 * de sens — on l'affiche sans lien plutôt que de la masquer, pour
                 * que la disparition se comprenne.
                 */
                if (!membre) {
                  return (
                    <li
                      key={relation.matchId}
                      className="flex items-center gap-4 rounded-2xl border border-champagne/10 bg-minuit p-4 opacity-70"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-champagne/12 bg-nuit">
                        <UserRound
                          size={18}
                          className="text-champagne/35"
                          aria-hidden="true"
                        />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-semibold text-champagne/70">
                          Membre indisponible
                        </span>
                        <span className="mt-0.5 block text-[12px] text-champagne/50">
                          Ce compte a été supprimé ou suspendu.
                        </span>
                      </span>
                    </li>
                  );
                }

                return (
                  <motion.li
                    key={relation.matchId}
                    custom={index}
                    variants={variantesCarte}
                    initial="hidden"
                    animate="visible"
                  >
                    <Link
                      href={`/messages/${relation.matchId}`}
                      className={`flex items-center gap-4 rounded-2xl border bg-minuit p-4 transition-colors ${focusRing} ${
                        nonLu
                          ? "border-cuivre/40 hover:border-cuivre/60"
                          : "border-champagne/10 hover:border-champagne/25"
                      }`}
                    >
                      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-champagne/12 bg-nuit font-display text-[17px] font-bold text-champagne/70">
                        {membre.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={membre.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          membre.pseudonyme.charAt(0).toUpperCase()
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[14px] font-semibold text-champagne">
                            {membre.pseudonyme}
                            {membre.age ? (
                              <span className="font-normal text-champagne/55">
                                , {membre.age} ans
                              </span>
                            ) : null}
                          </span>

                          {relation.sourdineActive && (
                            <BellOff
                              size={12}
                              className="shrink-0 text-champagne/45"
                              aria-label="Conversation en sourdine"
                            />
                          )}

                          {relation.archivee && (
                            <Archive
                              size={12}
                              className="shrink-0 text-champagne/45"
                              aria-label="Conversation rangée"
                            />
                          )}
                        </span>

                        {lieu && (
                          <span className="mt-0.5 flex items-center gap-1 text-[12px] text-champagne/55">
                            <MapPin size={11} aria-hidden="true" />
                            {lieu}
                          </span>
                        )}

                        <span
                          className={`mt-0.5 block text-[12px] ${
                            nonLu ? "font-semibold text-cuivre" : "text-champagne/55"
                          }`}
                        >
                          {nonLu
                            ? `${relation.unreadCount} nouveau${(relation.unreadCount ?? 0) > 1 ? "x" : ""} message${(relation.unreadCount ?? 0) > 1 ? "s" : ""}`
                            : quand
                              ? `Dernier message ${quand}`
                              : "Pas encore de message — à toi d’ouvrir"}
                        </span>
                      </span>

                      <span className="flex shrink-0 items-center gap-2">
                        {nonLu && (
                          <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-cuivre px-1.5 text-[11px] font-bold text-nuit">
                            {(relation.unreadCount ?? 0) > 9
                              ? "9+"
                              : relation.unreadCount}
                          </span>
                        )}

                        <MessageCircle
                          size={16}
                          className="text-champagne/35"
                          aria-hidden="true"
                        />
                      </span>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </AnimatePresence>
        )}

            <p className="mt-5 text-[12px] leading-relaxed text-champagne/70">
              Tes conversations sont privées et restent accessibles depuis cet
              espace.
            </p>
          </section>

          <aside className="relative isolate flex min-h-[380px] flex-col overflow-hidden rounded-2xl border border-champagne/12">
            <Image
              src="/visuels/solys-11.webp"
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 780px"
              className="-z-10 object-cover object-center"
            />

            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-nuit/85"
            />

            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <span
                aria-hidden="true"
                className="flex h-14 w-14 items-center justify-center rounded-full border border-cuivre/40 bg-nuit/70 text-cuivre"
              >
                <MessageCircle size={22} />
              </span>

              <h2 className="font-display mt-5 text-[24px] font-normal leading-snug text-ivoire sm:text-[28px]">
                Ta conversation, à ton rythme.
              </h2>

              <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-champagne/85">
                Chaque échange s&rsquo;ouvre sur sa propre page, pour que rien
                ne s&rsquo;affiche par-dessus l&rsquo;épaule. Choisis une
                conversation à gauche, ou reprends la dernière.
              </p>

              {premiereOuvrable && (
                <Link
                  href={`/messages/${premiereOuvrable.matchId}`}
                  className={`mt-7 inline-flex items-center gap-2 rounded-xl bg-degrade-cuivre px-6 py-3 text-[13px] font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
                >
                  Reprendre avec {premiereOuvrable.user?.pseudonyme}
                </Link>
              )}

              <p className="mt-6 flex items-center gap-2 rounded-xl border border-champagne/20 bg-nuit/60 px-4 py-2.5 text-[12px] text-champagne/85">
                <Lock size={13} aria-hidden="true" className="text-cuivre" />
                Messages privés et sécurisés
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
