// src/app/admin/_composants/OngletUtilisateurs.tsx

"use client";

import { motion } from "framer-motion";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Crown,
  Loader2,
  Search,
  Shield,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react";

import {
  effectivePlan,
  formatDate,
  formatNumber,
  statusColor,
  type AdminUser,
} from "./types";

/**
 * Onglet Utilisateurs : recherche, filtres, liste paginée et actions de
 * modération.
 *
 * Les quatre boutons d'action existaient en double — une fois pour les
 * cartes mobiles, une fois pour le tableau desktop — soit huit blocs quasi
 * identiques de dix lignes. Ils sont factorisés dans `ActionsMembre`, qui
 * ne varie que par la taille.
 */

/** Bouton d'action unitaire, avec son état de chargement. */
function BoutonAction({
  titre,
  actif = false,
  enCours,
  danger = false,
  compact,
  onClick,
  children,
}: {
  titre: string;
  actif?: boolean;
  enCours: boolean;
  danger?: boolean;
  compact: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const taille = compact ? "p-1.5" : "p-2";

  const style = danger
    ? "border-rust/20 bg-rust/10 text-cream hover:bg-rust/20"
    : actif
      ? "border-orange/20 bg-orange/15 text-cream"
      : "border-cream/10 bg-cream/5 text-cream/60 hover:bg-cream/10 hover:text-cream";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={enCours}
      title={titre}
      aria-label={titre}
      className={`rounded-lg border transition disabled:opacity-50 ${taille} ${style}`}
    >
      {enCours ? (
        <Loader2
          className={`animate-spin ${compact ? "h-3.5 w-3.5" : "h-4 w-4"}`}
        />
      ) : (
        children
      )}
    </button>
  );
}

/** Les quatre actions disponibles sur un membre. */
function ActionsMembre({
  membre,
  actionLoading,
  compact,
  onAction,
  onDelete,
}: {
  membre: AdminUser;
  actionLoading: string | null;
  compact: boolean;
  onAction: (userId: string, action: string) => void;
  onDelete: (userId: string, pseudonyme: string) => void;
}) {
  const roleAction = membre.role === "admin" ? "demote" : "promote";
  const icone = compact ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <>
      <BoutonAction
        titre={membre.isPremium ? "Retirer l'accès premium" : "Rendre premium"}
        actif={membre.isPremium}
        enCours={actionLoading === membre._id + "toggle_premium"}
        compact={compact}
        onClick={() => onAction(membre._id, "toggle_premium")}
      >
        <Crown className={icone} />
      </BoutonAction>

      <BoutonAction
        titre={
          membre.role === "admin"
            ? "Rétrograder en membre"
            : "Promouvoir administrateur"
        }
        enCours={actionLoading === membre._id + roleAction}
        compact={compact}
        onClick={() => onAction(membre._id, roleAction)}
      >
        <Shield className={icone} />
      </BoutonAction>

      <BoutonAction
        titre={
          membre.identityVerified
            ? "Retirer la vérification d'identité"
            : "Valider manuellement l'identité"
        }
        actif={membre.identityVerified}
        enCours={actionLoading === membre._id + "toggle_identity_verified"}
        compact={compact}
        onClick={() => onAction(membre._id, "toggle_identity_verified")}
      >
        <ShieldCheck className={icone} />
      </BoutonAction>

      {membre.role !== "admin" && (
        <BoutonAction
          titre="Supprimer définitivement le compte"
          danger
          enCours={actionLoading === membre._id + "delete"}
          compact={compact}
          onClick={() => onDelete(membre._id, membre.pseudonyme)}
        >
          <Trash2 className={icone} />
        </BoutonAction>
      )}
    </>
  );
}

export default function OngletUtilisateurs({
  users,
  isLoading,
  totalUsers,
  page,
  totalPages,
  search,
  planFilter,
  statusFilter,
  actionLoading,
  onSearch,
  onPlanFilter,
  onStatusFilter,
  onPage,
  onAction,
  onDelete,
}: {
  users: AdminUser[];
  isLoading: boolean;
  totalUsers: number;
  page: number;
  totalPages: number;
  search: string;
  planFilter: string;
  statusFilter: string;
  actionLoading: string | null;
  onSearch: (value: string) => void;
  onPlanFilter: (value: string) => void;
  onStatusFilter: (value: string) => void;
  onPage: (updater: (p: number) => number) => void;
  onAction: (userId: string, action: string) => void;
  onDelete: (userId: string, pseudonyme: string) => void;
}) {
  return (
    <motion.section
      key="users"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-5"
    >
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:gap-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/55"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Rechercher email, pseudo…"
            aria-label="Rechercher un membre"
            className="w-full rounded-xl border border-cream/10 bg-cream/5 py-2 pl-9 pr-4 text-sm text-cream placeholder-cream/55 focus:border-orange/50 focus:outline-none"
          />
        </div>

        <select
          value={planFilter}
          onChange={(e) => onPlanFilter(e.target.value)}
          aria-label="Filtrer par offre"
          className="rounded-xl border border-cream/10 bg-[#123243] px-3 py-2 text-sm text-cream focus:outline-none"
        >
          <option value="all">Tous les plans</option>
          <option value="free">Gratuit</option>
          <option value="essential-monthly">Essentiel</option>
          <option value="premium-monthly">Premium</option>
          <option value="elite-monthly">Elite</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.target.value)}
          aria-label="Filtrer par statut d'abonnement"
          className="rounded-xl border border-cream/10 bg-[#123243] px-3 py-2 text-sm text-cream focus:outline-none"
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="trialing">Essai</option>
          <option value="inactive">Inactif</option>
          <option value="canceled">Annulé</option>
        </select>
      </div>

      <p className="text-xs text-cream/60">
        {formatNumber(totalUsers)} utilisateur{totalUsers !== 1 ? "s" : ""} trouvé
        {totalUsers !== 1 ? "s" : ""}
      </p>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cream" />
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-cream/10 bg-cream/5 py-12 text-center text-sm text-cream/60">
          Aucun utilisateur trouvé.
        </div>
      ) : (
        <>
          {/* Cartes — mobile */}
          <div className="space-y-3 md:hidden">
            {users.map((u) => {
              const ep = effectivePlan(u);

              return (
                <article
                  key={u._id}
                  className="rounded-2xl border border-cream/10 bg-cream/5 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange text-sm font-bold text-abyss">
                      {u.pseudonyme.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold">{u.pseudonyme}</p>
                        {u.hasCompletedProfile && (
                          <BadgeCheck
                            className="h-4 w-4 text-lime"
                            aria-label="Profil complet"
                          />
                        )}
                        {u.identityVerified && (
                          <ShieldCheck
                            className="h-4 w-4 text-cream"
                            aria-label="Identité vérifiée"
                          />
                        )}
                      </div>
                      <p className="truncate text-xs text-cream/60">{u.email}</p>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${ep.style}`}
                        >
                          {ep.isElite && <Crown className="h-3 w-3" />}
                          {ep.label}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-1 text-xs ${
                            statusColor[u.subscriptionStatus] ||
                            statusColor.inactive
                          }`}
                        >
                          {u.subscriptionStatus}
                        </span>
                        <span className="rounded-full border border-cream/10 bg-cream/5 px-2 py-1 text-xs text-cream/60">
                          {u.role === "admin" ? "Admin" : "Membre"}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-cream/60">
                        Inscription : {formatDate(u.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end gap-2 border-t border-cream/8 pt-3">
                    <ActionsMembre
                      membre={u}
                      actionLoading={actionLoading}
                      compact={false}
                      onAction={onAction}
                      onDelete={onDelete}
                    />
                  </div>
                </article>
              );
            })}
          </div>

          {/* Tableau — desktop */}
          <div className="hidden overflow-hidden rounded-2xl border border-cream/10 bg-cream/5 md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream/8 text-xs text-cream/60">
                    <th className="px-4 py-3 text-left font-medium">Utilisateur</th>
                    <th className="px-4 py-3 text-left font-medium">Plan</th>
                    <th className="px-4 py-3 text-left font-medium">Statut</th>
                    <th className="px-4 py-3 text-left font-medium">Inscription</th>
                    <th className="px-4 py-3 text-left font-medium">Rôle</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const ep = effectivePlan(u);

                    return (
                      <tr
                        key={u._id}
                        className="border-b border-cream/5 transition hover:bg-cream/5"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange text-xs font-bold text-abyss">
                              {u.pseudonyme.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="max-w-32 truncate font-medium">
                                {u.pseudonyme}
                              </p>
                              <p className="max-w-32 truncate text-xs text-cream/60">
                                {u.email}
                              </p>
                            </div>
                            {u.hasCompletedProfile && (
                              <BadgeCheck
                                className="h-4 w-4 shrink-0 text-lime"
                                aria-label="Profil complet"
                              />
                            )}
                            {u.identityVerified && (
                              <ShieldCheck
                                className="h-4 w-4 shrink-0 text-cream"
                                aria-label="Identité vérifiée"
                              />
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${ep.style}`}
                          >
                            {ep.isElite && <Crown className="h-3 w-3" />}
                            {ep.label}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full border px-2 py-1 text-xs ${
                              statusColor[u.subscriptionStatus] ||
                              statusColor.inactive
                            }`}
                          >
                            {u.subscriptionStatus}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-xs text-cream/60">
                          {formatDate(u.createdAt)}
                        </td>

                        <td className="px-4 py-3">
                          {u.role === "admin" ? (
                            <span className="flex items-center gap-1 text-xs text-cream">
                              <Star className="h-3 w-3" /> Admin
                            </span>
                          ) : (
                            <span className="text-xs text-cream/60">Membre</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <ActionsMembre
                              membre={u}
                              actionLoading={actionLoading}
                              compact
                              onAction={onAction}
                              onDelete={onDelete}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-cream/60">
            Page {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1 || isLoading}
              className="flex items-center gap-1 rounded-lg border border-cream/10 bg-cream/5 px-3 py-1.5 text-sm text-cream/70 transition hover:bg-cream/10 hover:text-cream disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
              Préc.
            </button>
            <button
              onClick={() => onPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages || isLoading}
              className="flex items-center gap-1 rounded-lg border border-cream/10 bg-cream/5 px-3 py-1.5 text-sm text-cream/70 transition hover:bg-cream/10 hover:text-cream disabled:opacity-30"
            >
              Suiv.
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </motion.section>
  );
}
