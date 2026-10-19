// src/app/(app)/mon-compte/_composants/OngletInteractions.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Eye,
  Flag,
  Heart,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  Star,
  X,
} from "lucide-react";

import ReportModal from "@/components/ReportModal";
import TestimonialForm from "@/components/testimonials/TestimonialForm";
import { getDepartementLabel } from "@/lib/locations";

import {
  carte,
  focusRing,
  offreActive,
  tempsRelatif,
  variantesCarte,
  type MembreSolys,
  type RelationItem,
  type Visiteur,
} from "./types";

/**
 * Onglet Interactions : mises en relation et visiteurs.
 *
 * ## Ce qui a changé au passage
 *
 * La carte portait trois actions concurrentes — la carte entière cliquable,
 * un bouton « Voir ✨ » et un lien « Message » — dont deux menaient au même
 * endroit. Reste la carte (vers le profil), « Message » (vers la conversation)
 * et le signalement.
 *
 * L'ancienne pastille de message non lu utilisait `animate-msg-pulse`, une
 * animation déclarée dans le `<style jsx global>` de la page. Ce bloc a
 * disparu avec la migration : la classe ne correspondait plus à rien. La
 * pastille est maintenant statique, et plus lisible.
 *
 * Les visiteurs sont réservés à Premium et Elite — et c'est bien la route
 * `/api/visitors` qui le vérifie (403 sinon), pas seulement cet écran.
 */
export default function OngletInteractions({ user }: { user: MembreSolys }) {
  const router = useRouter();

  const [signalement, setSignalement] = useState<string | null>(null);

  const [relations, setRelations] = useState<RelationItem[]>([]);
  const [visiteurs, setVisiteurs] = useState<Visiteur[]>([]);

  const [chargeRelations, setChargeRelations] = useState(true);
  const [chargeVisiteurs, setChargeVisiteurs] = useState(true);

  const [section, setSection] = useState<"relations" | "visiteurs">(
    "relations"
  );

  const [aTemoigne, setATemoigne] = useState<boolean | null>(null);
  const [modaleTemoignage, setModaleTemoignage] = useState(false);

  const payante = offreActive(user);

  useEffect(() => {
    setChargeRelations(true);

    fetch("/api/matches", { cache: "no-store" })
      .then((reponse) => reponse.json())
      .then((donnees) => {
        if (donnees.success) setRelations(donnees.matches ?? []);
      })
      .catch(() => {})
      .finally(() => setChargeRelations(false));
  }, []);

  useEffect(() => {
    fetch("/api/testimonials/me", { cache: "no-store" })
      .then((reponse) => reponse.json())
      .then((donnees) => {
        if (donnees?.success) setATemoigne(Boolean(donnees.hasTestimonial));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!payante) {
      setChargeVisiteurs(false);
      setVisiteurs([]);
      return;
    }

    setChargeVisiteurs(true);

    fetch("/api/visitors", { cache: "no-store" })
      .then((reponse) => reponse.json())
      .then((donnees) => {
        if (donnees.success) setVisiteurs(donnees.visitors ?? []);
      })
      .catch(() => {})
      .finally(() => setChargeVisiteurs(false));
  }, [payante]);

  // On n'invite à témoigner qu'un membre qui a vécu quelque chose ici.
  const inviterATemoigner =
    !chargeRelations && relations.length > 0 && aTemoigne === false;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-[19px] font-bold text-champagne">
            Interactions
          </h2>
          <p className="mt-1 text-[13px] text-champagne/60">
            Tes mises en relation et, avec Premium, qui est passé sur ton
            profil.
          </p>
        </div>

        <Link
          href="/explorer"
          className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-champagne/15 px-3.5 py-2 text-[12px] font-semibold text-champagne transition-colors hover:border-cuivre/50 ${focusRing}`}
        >
          Voir l’annuaire
          <ChevronRight size={13} aria-hidden="true" />
        </Link>
      </div>

      {/* Invitation à témoigner */}
      <AnimatePresence>
        {inviterATemoigner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 rounded-2xl border border-cuivre/25 bg-cuivre/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[14px] font-semibold text-champagne">
                  Ton expérience peut en rassurer d’autres
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-champagne/65">
                  Quelques lignes suffisent. Ton témoignage est relu avant
                  d’être publié.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModaleTemoignage(true)}
                className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-cuivre px-4 py-2.5 text-[12px] font-bold text-nuit transition-colors hover:bg-cuivre/90 ${focusRing}`}
              >
                <Star size={13} aria-hidden="true" />
                Témoigner
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modale témoignage */}
      <AnimatePresence>
        {modaleTemoignage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-nuit/85 p-4 backdrop-blur-sm"
            onClick={() => setModaleTemoignage(false)}
            role="presentation"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              onClick={(evenement) => evenement.stopPropagation()}
              className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setModaleTemoignage(false)}
                className={`absolute right-3 top-3 z-10 rounded-full border border-champagne/15 bg-nuit p-2 text-champagne transition-colors hover:border-champagne/35 ${focusRing}`}
                aria-label="Fermer"
              >
                <X size={14} aria-hidden="true" />
              </button>

              <TestimonialForm
                profileImage={user.image || null}
                onSuccess={() => {
                  setATemoigne(true);
                  window.setTimeout(() => setModaleTemoignage(false), 1800);
                }}
                onCancel={() => setModaleTemoignage(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bascule */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setSection("relations")}
          aria-pressed={section === "relations"}
          className={`rounded-2xl border p-4 text-left transition-colors ${focusRing} ${
            section === "relations"
              ? "border-cuivre/40 bg-cuivre/[0.08]"
              : "border-champagne/10 bg-minuit hover:border-champagne/25"
          }`}
        >
          <span className="mb-1 flex items-center gap-2">
            <Heart
              size={14}
              className={
                section === "relations" ? "text-cuivre" : "text-champagne/60"
              }
              aria-hidden="true"
            />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-champagne/55">
              Mises en relation
            </span>
          </span>

          {chargeRelations ? (
            <Loader2
              size={19}
              className="animate-spin text-champagne/60"
              aria-hidden="true"
            />
          ) : (
            <span className="font-display text-[26px] font-bold leading-none text-champagne">
              {relations.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSection("visiteurs")}
          aria-pressed={section === "visiteurs"}
          className={`rounded-2xl border p-4 text-left transition-colors ${focusRing} ${
            section === "visiteurs"
              ? "border-cuivre/40 bg-cuivre/[0.08]"
              : "border-champagne/10 bg-minuit hover:border-champagne/25"
          }`}
        >
          <span className="mb-1 flex items-center gap-2">
            <Eye
              size={14}
              className={
                section === "visiteurs" ? "text-cuivre" : "text-champagne/60"
              }
              aria-hidden="true"
            />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-champagne/55">
              Visiteurs
            </span>

            {!payante && (
              <Lock
                size={12}
                className="ml-auto text-champagne/55"
                aria-hidden="true"
              />
            )}
          </span>

          {chargeVisiteurs ? (
            <Loader2
              size={19}
              className="animate-spin text-champagne/60"
              aria-hidden="true"
            />
          ) : (
            <span
              className={`font-display text-[26px] font-bold leading-none ${
                payante ? "text-champagne" : "text-champagne/55"
              }`}
            >
              {payante ? visiteurs.length : "—"}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {section === "relations" && (
          <motion.div
            key="relations"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-2.5"
          >
            {chargeRelations ? (
              <div className="flex justify-center py-10">
                <Loader2
                  size={26}
                  className="animate-spin text-champagne/60"
                  aria-hidden="true"
                />
              </div>
            ) : relations.length === 0 ? (
              <div className={`${carte} px-5 py-10 text-center`}>
                <p className="text-[14px] text-champagne/70">
                  Aucune mise en relation pour l’instant.
                </p>

                <Link
                  href="/explorer"
                  className={`mt-4 inline-flex items-center gap-2 rounded-xl bg-cuivre px-4 py-2.5 text-[12px] font-bold text-nuit transition-colors hover:bg-cuivre/90 ${focusRing}`}
                >
                  Parcourir l’annuaire
                </Link>
              </div>
            ) : (
              relations.map((relation, index) => {
                const membre = relation.user;
                if (!membre) return null;

                const nonLu = Boolean(relation.hasUnreadMessage);
                const lieu = [
                  membre.localisation,
                  getDepartementLabel(membre.departement),
                ]
                  .filter(Boolean)
                  .join(" · ");

                const versProfil = () =>
                  router.push(`/profil/${membre._id}?from=interactions`);

                return (
                  <motion.div
                    key={relation.matchId}
                    custom={index}
                    variants={variantesCarte}
                    initial="hidden"
                    animate="visible"
                    role="button"
                    tabIndex={0}
                    onClick={versProfil}
                    onKeyDown={(evenement) => {
                      if (evenement.key === "Enter" || evenement.key === " ") {
                        evenement.preventDefault();
                        versProfil();
                      }
                    }}
                    className={`flex cursor-pointer flex-col gap-3 rounded-2xl border bg-minuit p-4 transition-colors sm:flex-row sm:items-center sm:gap-4 ${focusRing} ${
                      nonLu
                        ? "border-cuivre/40"
                        : "border-champagne/10 hover:border-champagne/25"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3 sm:flex-1">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-champagne/12 bg-nuit font-display text-[17px] font-bold text-champagne/70">
                        {membre.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={membre.image}
                            alt={membre.pseudonyme}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          membre.pseudonyme.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-champagne">
                          {membre.pseudonyme}
                          {membre.age ? (
                            <span className="text-champagne/55">
                              , {membre.age} ans
                            </span>
                          ) : null}
                        </p>

                        {lieu && (
                          <p className="mt-0.5 flex items-center gap-1 text-[12px] text-champagne/60">
                            <MapPin size={11} aria-hidden="true" />
                            {lieu}
                          </p>
                        )}

                        {nonLu ? (
                          <p className="mt-0.5 text-[12px] font-semibold text-champagne">
                            Nouveau message
                          </p>
                        ) : (
                          relation.lastMessageAt && (
                            <p className="mt-0.5 text-[12px] text-champagne/60">
                              Dernier message {tempsRelatif(relation.lastMessageAt)}
                            </p>
                          )
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 sm:flex-col sm:items-end">
                      <p className="text-[12px] text-champagne/60">
                        En relation {tempsRelatif(relation.createdAt)}
                      </p>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/messages/${relation.matchId}`}
                          onClick={(evenement) => evenement.stopPropagation()}
                          className={`relative inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold transition-colors ${focusRing} ${
                            nonLu
                              ? "bg-cuivre text-nuit hover:bg-cuivre/90"
                              : "border border-champagne/15 text-champagne hover:border-champagne/35"
                          }`}
                        >
                          <MessageCircle size={13} aria-hidden="true" />
                          Message
                          {nonLu && (relation.unreadCount ?? 0) > 0 && (
                            <span className="ml-0.5 rounded-full bg-nuit px-1.5 text-[10px] font-bold text-champagne">
                              {(relation.unreadCount ?? 0) > 9
                                ? "9+"
                                : relation.unreadCount}
                            </span>
                          )}
                        </Link>

                        <button
                          type="button"
                          onClick={(evenement) => {
                            evenement.stopPropagation();
                            setSignalement(membre._id);
                          }}
                          className={`rounded-xl border border-champagne/15 p-2 text-champagne/60 transition-colors hover:border-champagne/35 hover:text-champagne ${focusRing}`}
                          title="Signaler ce profil"
                          aria-label="Signaler ce profil"
                        >
                          <Flag size={13} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {section === "visiteurs" && (
          <motion.div
            key="visiteurs"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-2.5"
          >
            {!payante ? (
              <div className="rounded-2xl border border-cuivre/25 bg-cuivre/[0.06] p-6 text-center sm:p-8">
                <h3 className="font-display text-[17px] font-bold text-champagne">
                  Réservé à Premium et Elite
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-champagne/70">
                  Savoir qui est passé sur ton profil fait partie des offres
                  Premium et Elite.
                </p>

                <Link
                  href="/tarifs"
                  className={`mt-5 inline-flex items-center gap-2 rounded-xl bg-cuivre px-5 py-2.5 text-[12px] font-bold text-nuit transition-colors hover:bg-cuivre/90 ${focusRing}`}
                >
                  Voir les offres
                  <ChevronRight size={14} aria-hidden="true" />
                </Link>
              </div>
            ) : chargeVisiteurs ? (
              <div className="flex justify-center py-10">
                <Loader2
                  size={26}
                  className="animate-spin text-champagne/60"
                  aria-hidden="true"
                />
              </div>
            ) : visiteurs.length === 0 ? (
              <div className={`${carte} px-5 py-10 text-center`}>
                <p className="text-[14px] text-champagne/70">
                  Personne n’est encore passé sur ton profil.
                </p>
                <p className="mt-2 text-[12px] text-champagne/60">
                  Un profil complet est un profil plus visible.
                </p>
              </div>
            ) : (
              visiteurs.map(({ user: visiteur, lastVisit, visitCount }, index) => {
                if (!visiteur) return null;

                const lieu = [
                  visiteur.localisation,
                  getDepartementLabel(visiteur.departement),
                ]
                  .filter(Boolean)
                  .join(" · ");

                const versProfil = () =>
                  router.push(`/profil/${visiteur._id}?from=visiteurs`);

                return (
                  <motion.div
                    key={visiteur._id ?? index}
                    custom={index}
                    variants={variantesCarte}
                    initial="hidden"
                    animate="visible"
                    role="button"
                    tabIndex={0}
                    onClick={versProfil}
                    onKeyDown={(evenement) => {
                      if (evenement.key === "Enter" || evenement.key === " ") {
                        evenement.preventDefault();
                        versProfil();
                      }
                    }}
                    className={`flex cursor-pointer items-center gap-4 rounded-2xl border border-champagne/10 bg-minuit p-4 transition-colors hover:border-champagne/25 ${focusRing}`}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-champagne/12 bg-nuit font-display text-[17px] font-bold text-champagne/70">
                      {visiteur.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={visiteur.image}
                          alt={visiteur.pseudonyme}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        visiteur.pseudonyme.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-champagne">
                        {visiteur.pseudonyme}
                        {visiteur.age ? (
                          <span className="text-champagne/55">
                            , {visiteur.age} ans
                          </span>
                        ) : null}
                      </p>

                      {lieu && (
                        <p className="mt-0.5 flex items-center gap-1 text-[12px] text-champagne/60">
                          <MapPin size={11} aria-hidden="true" />
                          {lieu}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-[12px] text-champagne/60">
                        {tempsRelatif(lastVisit)}
                      </p>

                      {visitCount > 1 && (
                        <p className="mt-0.5 text-[12px] text-champagne/65">
                          {visitCount} visites
                        </p>
                      )}
                    </div>

                    <ChevronRight
                      size={15}
                      className="shrink-0 text-champagne/55"
                      aria-hidden="true"
                    />
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ReportModal
        isOpen={!!signalement}
        targetId={signalement ?? ""}
        targetType="user"
        onClose={() => setSignalement(null)}
      />
    </div>
  );
}
