// src/app/api/boosts/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limiter';
import { Boost } from '@/models/Boost';
import {
  SubscriptionChecker,
  getAuthenticatedUser,
} from '@/lib/subscription/subscription-check';
import { SUBSCRIPTION_PLANS, normalizePlanId } from '@/lib/subscription/config';
import {
  DUREE_BOOST_MINUTES,
  MULTIPLICATEUR_PROFIL,
  boostEnCours,
  synchroniserStatutsBoosts,
  versPublic,
} from '@/lib/boosts';

/**
 * API des boosts de visibilité.
 *
 * GET  /api/boosts  → le boost en cours et le quota du mois.
 * POST /api/boosts  → lance un boost, si le quota le permet.
 *
 * ## Ce qui n'existait pas
 *
 * Les offres vendaient 1, 3 ou 10 boosts par mois, le modèle `Boost` était
 * prêt, le compteur de quota fonctionnait — mais **aucune route ne créait
 * jamais de boost**. Il n'y avait donc rien à compter, et rien à classer.
 * Cette route est le premier endroit du projet où un boost naît.
 *
 * ## Le quota
 *
 * Il repose sur `boostsPerMonth` de l'offre et se compte au mois calendaire,
 * via `canPerformAction("use_boost")` — le même compteur que celui déjà lu
 * par `/api/subscription/check`, pour qu'un membre ne voie jamais deux chiffres
 * différents selon l'écran.
 *
 * Un boost lancé est consommé, même si le membre l'annule : c'est la fenêtre de
 * visibilité qui est vendue, pas le clic.
 */

export const runtime = 'nodejs';

/** Le quota de boosts de l'offre, et ce qu'il en reste. */
async function lireQuota(userId: string) {
  const checker = new SubscriptionChecker(userId);
  const plan = await checker.getCurrentPlan();
  const limite = SUBSCRIPTION_PLANS[plan].limits.boostsPerMonth;

  const verification = await checker.canPerformAction('use_boost');

  /**
   * `canPerformAction` refuse d'emblée, sans chiffres, quand aucun abonnement
   * n'est actif. Pour l'affichage, on préfère alors montrer le quota réel de
   * l'offre — zéro pour la formule gratuite — plutôt qu'un champ vide.
   */
  const utilises =
    typeof verification.used === 'number'
      ? verification.used
      : await compterBoostsDuMois(userId);

  return {
    plan,
    limite,
    utilises,
    restants: Math.max(0, limite - utilises),
    autorise: verification.allowed === true && limite > 0,
    raison: verification.reason,
  };
}

/** Compte les boosts créés depuis le premier jour du mois. */
async function compterBoostsDuMois(userId: string): Promise<number> {
  const debut = new Date();
  debut.setDate(1);
  debut.setHours(0, 0, 0, 0);

  try {
    return await Boost.countDocuments({ userId, createdAt: { $gte: debut } });
  } catch {
    return 0;
  }
}

export async function GET() {
  try {
    const auth = await getAuthenticatedUser();

    if (!auth.user) {
      return (
        auth.response ??
        NextResponse.json(
          { success: false, error: 'Non authentifié.' },
          { status: 401 }
        )
      );
    }

    const user = auth.user;

    await synchroniserStatutsBoosts();

    const userId = String(user._id);

    const [actif, quota] = await Promise.all([
      boostEnCours(userId),
      lireQuota(userId),
    ]);

    return NextResponse.json(
      {
        success: true,
        boost: actif,
        quota: {
          limite: quota.limite,
          utilises: quota.utilises,
          restants: quota.restants,
        },
        dureeMinutes: DUREE_BOOST_MINUTES,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Erreur GET /api/boosts :', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Impossible de lire tes boosts pour le moment.',
        code: 'BOOSTS_READ_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Un boost par clic, pas par rafale : 10 tentatives / 10 min / IP.
    const rl = await rateLimit(req, 10, 600);

    if (rl.limited) {
      return NextResponse.json(
        {
          success: false,
          error: 'Trop de tentatives. Réessaie dans quelques minutes.',
          code: 'RATE_LIMITED',
        },
        {
          status: 429,
          headers: rl.retryAfter
            ? { 'Retry-After': String(rl.retryAfter) }
            : undefined,
        }
      );
    }

    const auth = await getAuthenticatedUser();

    if (!auth.user) {
      return (
        auth.response ??
        NextResponse.json(
          { success: false, error: 'Non authentifié.' },
          { status: 401 }
        )
      );
    }

    const user = auth.user;

    if (user.banned) {
      return NextResponse.json(
        { success: false, error: 'Compte suspendu.', code: 'ACCOUNT_BANNED' },
        { status: 403 }
      );
    }

    await connectDB();
    await synchroniserStatutsBoosts();

    const userId = String(user._id);

    /**
     * Un profil invisible ou incomplet ne peut pas être mis en avant : le
     * classement d'Explorer ne le remonterait pas, et le boost serait
     * consommé pour rien.
     */
    if (user.hasCompletedProfile !== true) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Complète ton profil avant de lancer un boost : sans profil complet, tu n’apparais pas dans Explorer.',
          code: 'PROFILE_INCOMPLETE',
        },
        { status: 409 }
      );
    }

    if (user.visibilite === 'invisible' || user.visibilite === 'matches') {
      return NextResponse.json(
        {
          success: false,
          error:
            'Ta visibilité actuelle te retire d’Explorer. Repasse en profil visible pour qu’un boost serve à quelque chose.',
          code: 'PROFILE_HIDDEN',
        },
        { status: 409 }
      );
    }

    const dejaActif = await boostEnCours(userId);

    if (dejaActif) {
      return NextResponse.json(
        {
          success: false,
          error: 'Un boost est déjà en cours.',
          code: 'BOOST_ALREADY_ACTIVE',
          boost: dejaActif,
        },
        { status: 409 }
      );
    }

    const quota = await lireQuota(userId);

    if (quota.limite <= 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Ton offre actuelle ne comprend pas de boost. Les offres payantes en incluent 1, 3 ou 10 par mois.',
          code: 'BOOST_NOT_IN_PLAN',
          quota: {
            limite: quota.limite,
            utilises: quota.utilises,
            restants: quota.restants,
          },
          upgradeUrl: '/tarifs',
        },
        { status: 403 }
      );
    }

    if (!quota.autorise) {
      return NextResponse.json(
        {
          success: false,
          error:
            quota.raison ||
            'Tu as utilisé tous tes boosts pour ce mois-ci. Le compteur repart le 1er.',
          code: 'BOOST_QUOTA_REACHED',
          quota: {
            limite: quota.limite,
            utilises: quota.utilises,
            restants: quota.restants,
          },
          upgradeUrl: '/tarifs',
        },
        { status: 403 }
      );
    }

    const debut = new Date();
    const fin = new Date(debut.getTime() + DUREE_BOOST_MINUTES * 60 * 1000);

    const boost = await Boost.create({
      userId: user._id,
      type: 'profile',
      status: 'active',
      startsAt: debut,
      endsAt: fin,
      durationMinutes: DUREE_BOOST_MINUTES,
      multiplier: MULTIPLICATEUR_PROFIL,
      targetType: 'profile',
      source: 'subscription',
    });

    return NextResponse.json(
      {
        success: true,
        boost: versPublic(boost, debut),
        quota: {
          limite: quota.limite,
          utilises: quota.utilises + 1,
          restants: Math.max(0, quota.restants - 1),
        },
      },
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Erreur POST /api/boosts :', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Impossible de lancer le boost pour le moment.',
        code: 'BOOST_CREATE_ERROR',
      },
      { status: 500 }
    );
  }
}
