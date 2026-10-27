// src/app/api/boosts/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limiter';
import { Boost } from '@/models/Boost';
import { User } from '@/models/User';
import {
  SubscriptionChecker,
  getAuthenticatedUser,
} from '@/lib/subscription/subscription-check';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription/config';
import {
  HORIZON_PROGRAMMATION_JOURS,
  boostEnVol,
  formuleBoostDe,
  formulePrioritaire,
  synchroniserStatutsBoosts,
  versPublic,
  type FormuleBoost,
} from '@/lib/boosts';
import { estFantome } from '@/lib/visibilite';

/**
 * API des boosts de visibilité.
 *
 * GET    /api/boosts  → le boost en vol, la formule de l'offre et le quota.
 * POST   /api/boosts  → lance un boost, maintenant ou à l'heure demandée.
 * DELETE /api/boosts  → annule un boost programmé qui n'a pas commencé.
 *
 * ## Ce que l'offre change
 *
 * Les offres se distinguaient par le nombre de boosts, et par rien d'autre :
 * un boost Essentiel et un boost Elite étaient le même objet. La durée, la
 * force, le type et la possibilité de choisir l'heure viennent maintenant de
 * la formule de l'offre — `formuleBoostDe` — lue au moment du lancement.
 *
 * Elle est lue **au lancement**, et ce qu'elle donne est écrit dans le
 * document. Un membre qui se désabonne pendant que son boost tourne garde la
 * fenêtre qu'il a payée jusqu'à son terme : le classement lit la force posée
 * sur le boost, jamais l'offre du moment.
 *
 * ## Le quota
 *
 * Deux réserves distinctes, et dans cet ordre.
 *
 * D'abord `boostsPerMonth`, compté au mois calendaire via
 * `canPerformAction("use_boost")` — le même compteur que celui déjà lu par
 * `/api/subscription/check`, pour qu'un membre ne voie jamais deux chiffres
 * différents selon l'écran.
 *
 * Ensuite le **boost de découverte** : un crédit à vie, offert une fois par
 * compte, qui permet à un membre gratuit de voir ce que fait un boost. On
 * dépense le quota du mois en premier et le crédit seulement après, parce que
 * le quota mensuel se périme au 1er et que le crédit, lui, attend.
 *
 * Un boost **commencé** est consommé, même si le membre s'en détourne :
 * c'est la fenêtre de visibilité qui est vendue, pas le clic. Un boost
 * programmé qui n'a pas commencé est un autre cas — rien n'a encore été
 * servi, donc `DELETE` le supprime pour de bon et rend ce qu'il avait coûté.
 * Sans cela, un clic sur la mauvaise date immobiliserait l'unique boost d'un
 * membre pendant sept jours.
 */

export const runtime = 'nodejs';

/** Tolérance sur une heure de lancement « maintenant ». */
const TOLERANCE_SECONDES = 60;

type Quota = {
  limite: number;
  utilises: number;
  restants: number;
  /** Le crédit à vie est-il encore disponible ? */
  decouverteDisponible: boolean;
};

/** Le quota de boosts de l'offre, ce qu'il en reste, et le crédit à vie. */
async function lireQuota(
  userId: string,
  decouverteUtilisee: unknown
): Promise<Quota & { autorise: boolean; raison?: string }> {
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

  const restants = Math.max(0, limite - utilises);
  const decouverteDisponible = decouverteUtilisee !== true;

  return {
    limite,
    utilises,
    restants,
    decouverteDisponible,
    autorise:
      (verification.allowed === true && restants > 0) || decouverteDisponible,
    raison: verification.reason,
  };
}

/** Compte les boosts du mois, hors boost de découverte. */
async function compterBoostsDuMois(userId: string): Promise<number> {
  const debut = new Date();
  debut.setDate(1);
  debut.setHours(0, 0, 0, 0);

  try {
    return await Boost.countDocuments({
      userId,
      createdAt: { $gte: debut },
      source: { $ne: 'discovery' },
    });
  } catch {
    return 0;
  }
}

/** Ce que le client peut lire du quota. */
function quotaPublic(quota: Quota): Quota {
  return {
    limite: quota.limite,
    utilises: quota.utilises,
    restants: quota.restants,
    decouverteDisponible: quota.decouverteDisponible,
  };
}

type DebutDemande =
  | { debut: Date; programme: boolean }
  | { refus: string; code: string };

/**
 * L'heure de lancement demandée, validée.
 *
 * Absente, c'est maintenant. Présente, elle doit tomber dans la fenêtre
 * autorisée et l'offre doit permettre de programmer — sans quoi n'importe qui
 * pourrait obtenir par l'API ce que son interface ne propose pas.
 */
function lireDebutDemande(
  valeur: unknown,
  formule: FormuleBoost
): DebutDemande {
  const maintenant = new Date();

  if (valeur === undefined || valeur === null || valeur === '') {
    return { debut: maintenant, programme: false };
  }

  if (typeof valeur !== 'string') {
    return {
      refus: 'Heure de lancement illisible.',
      code: 'BOOST_SCHEDULE_INVALID',
    };
  }

  const demande = new Date(valeur);

  if (Number.isNaN(demande.getTime())) {
    return {
      refus: 'Heure de lancement illisible.',
      code: 'BOOST_SCHEDULE_INVALID',
    };
  }

  const ecart = (demande.getTime() - maintenant.getTime()) / 1000;

  // Une heure « maintenant » arrondie par le client ne doit pas être refusée.
  if (Math.abs(ecart) <= TOLERANCE_SECONDES) {
    return { debut: maintenant, programme: false };
  }

  if (!formule.programmable) {
    return {
      refus:
        'Ton offre ne permet pas de choisir l’heure de ton boost. Les offres Premium et Elite le permettent.',
      code: 'BOOST_NOT_SCHEDULABLE',
    };
  }

  if (ecart < 0) {
    return {
      refus: 'Cette heure est déjà passée.',
      code: 'BOOST_SCHEDULE_PAST',
    };
  }

  const horizon =
    maintenant.getTime() + HORIZON_PROGRAMMATION_JOURS * 24 * 60 * 60 * 1000;

  if (demande.getTime() > horizon) {
    return {
      refus: `Tu peux programmer un boost jusqu’à ${HORIZON_PROGRAMMATION_JOURS} jours à l’avance.`,
      code: 'BOOST_SCHEDULE_TOO_FAR',
    };
  }

  return { debut: demande, programme: true };
}

/** Lit le corps JSON sans échouer quand il est vide. */
async function lireCorps(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const corps = await req.json();

    return corps && typeof corps === 'object' ? corps : {};
  } catch {
    return {};
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
    const checker = new SubscriptionChecker(userId);

    const [enVol, quota, plan] = await Promise.all([
      boostEnVol(userId),
      lireQuota(userId, user.boostDecouverteUtilise),
      checker.getCurrentPlan(),
    ]);

    const formule = formuleBoostDe(plan);

    return NextResponse.json(
      {
        success: true,
        boost: enVol,
        formule,
        prioritaire: formulePrioritaire(formule),
        quota: quotaPublic(quota),
        horizonJours: HORIZON_PROGRAMMATION_JOURS,
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

    if (estFantome(user.visibilite)) {
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

    /**
     * Un seul boost en vol : en cours **ou** programmé.
     *
     * Le contrôle ne regardait que les fenêtres déjà ouvertes. Dès que
     * l'heure de lancement est au choix du membre, cela laisserait un Elite
     * poser ses dix boosts sur les dix prochains vendredis soir et occuper la
     * tête du classement pour le mois entier.
     */
    const dejaEnVol = await boostEnVol(userId);

    if (dejaEnVol) {
      return NextResponse.json(
        {
          success: false,
          error: dejaEnVol.commence
            ? 'Un boost est déjà en cours.'
            : 'Un boost est déjà programmé. Attends qu’il soit passé pour en lancer un autre.',
          code: 'BOOST_ALREADY_ACTIVE',
          boost: dejaEnVol,
        },
        { status: 409 }
      );
    }

    const checker = new SubscriptionChecker(userId);
    const plan = await checker.getCurrentPlan();
    const formule = formuleBoostDe(plan);

    const corps = await lireCorps(req);
    const demande = lireDebutDemande(corps.startsAt, formule);

    if ('refus' in demande) {
      return NextResponse.json(
        { success: false, error: demande.refus, code: demande.code },
        { status: demande.code === 'BOOST_NOT_SCHEDULABLE' ? 403 : 400 }
      );
    }

    const quota = await lireQuota(userId, user.boostDecouverteUtilise);

    if (!quota.autorise) {
      const aucunDansLOffre = quota.limite <= 0;

      return NextResponse.json(
        {
          success: false,
          error: aucunDansLOffre
            ? 'Ton offre actuelle ne comprend pas de boost, et ton boost de découverte est déjà utilisé.'
            : quota.raison ||
              'Tu as utilisé tous tes boosts pour ce mois-ci. Le compteur repart le 1er.',
          code: aucunDansLOffre ? 'BOOST_NOT_IN_PLAN' : 'BOOST_QUOTA_REACHED',
          quota: quotaPublic(quota),
          upgradeUrl: '/tarifs',
        },
        { status: 403 }
      );
    }

    /**
     * Le quota du mois d'abord, le crédit à vie ensuite : le premier se
     * périme au 1er, le second attend aussi longtemps qu'il faut.
     */
    const surCredit = quota.restants <= 0;

    /**
     * Le crédit est réclamé **avant** la création, par une écriture
     * conditionnelle : c'est ce qui empêche un double clic de le dépenser
     * deux fois, faute de transaction. Si la création échoue ensuite, on le
     * rend. Si ce retour échoue à son tour, le membre perd son boost offert —
     * un boost de trop perdu vaut mieux qu'un crédit dépensable sans fin.
     */
    if (surCredit) {
      const reclame = await User.findOneAndUpdate(
        { _id: user._id, boostDecouverteUtilise: { $ne: true } },
        { $set: { boostDecouverteUtilise: true } }
      ).select('_id');

      if (!reclame) {
        return NextResponse.json(
          {
            success: false,
            error: 'Ton boost de découverte est déjà utilisé.',
            code: 'BOOST_QUOTA_REACHED',
            quota: quotaPublic({ ...quota, decouverteDisponible: false }),
            upgradeUrl: '/tarifs',
          },
          { status: 403 }
        );
      }
    }

    const fin = new Date(
      demande.debut.getTime() + formule.dureeMinutes * 60 * 1000
    );

    let boost;

    try {
      boost = await Boost.create({
        userId: user._id,
        type: formule.type,
        status: demande.programme ? 'scheduled' : 'active',
        startsAt: demande.debut,
        endsAt: fin,
        durationMinutes: formule.dureeMinutes,
        multiplier: formule.force,
        targetType: 'profile',
        source: surCredit ? 'discovery' : 'subscription',
      });
    } catch (erreur) {
      if (surCredit) {
        await User.updateOne(
          { _id: user._id },
          { $set: { boostDecouverteUtilise: false } }
        ).catch(() => {});
      }

      throw erreur;
    }

    return NextResponse.json(
      {
        success: true,
        boost: versPublic(boost),
        formule,
        prioritaire: formulePrioritaire(formule),
        quota: quotaPublic({
          limite: quota.limite,
          utilises: surCredit ? quota.utilises : quota.utilises + 1,
          restants: surCredit ? quota.restants : Math.max(0, quota.restants - 1),
          decouverteDisponible: surCredit ? false : quota.decouverteDisponible,
        }),
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

export async function DELETE() {
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

    await connectDB();
    await synchroniserStatutsBoosts();

    const userId = String(user._id);
    const enVol = await boostEnVol(userId);

    if (!enVol) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tu n’as aucun boost à annuler.',
          code: 'BOOST_NONE',
        },
        { status: 404 }
      );
    }

    /**
     * Un boost commencé ne s'annule pas : la mise en avant est déjà servie,
     * et l'interrompre ne rendrait pas les minutes passées.
     */
    if (enVol.commence) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Ton boost a commencé : il ne peut plus être annulé. Il se termine tout seul.',
          code: 'BOOST_ALREADY_STARTED',
          boost: enVol,
        },
        { status: 409 }
      );
    }

    /**
     * La suppression est conditionnée au fait que la fenêtre n'ait toujours
     * pas commencé : entre la lecture et l'écriture, l'heure a pu arriver.
     */
    const supprime = await Boost.findOneAndDelete({
      _id: enVol.id,
      userId: user._id,
      startsAt: { $gt: new Date() },
    }).lean<{ source?: string } | null>();

    if (!supprime) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Ton boost vient de commencer : il ne peut plus être annulé.',
          code: 'BOOST_ALREADY_STARTED',
        },
        { status: 409 }
      );
    }

    /**
     * Le crédit de découverte est rendu, puisque rien n'a été servi. Le quota
     * mensuel, lui, se rétablit de lui-même : il compte des documents, et
     * celui-ci n'existe plus.
     */
    if (supprime.source === 'discovery') {
      await User.updateOne(
        { _id: user._id },
        { $set: { boostDecouverteUtilise: false } }
      ).catch((erreur) => {
        console.error(
          'Boost de découverte annulé mais crédit non rendu :',
          erreur
        );
      });
    }

    const quota = await lireQuota(
      userId,
      supprime.source === 'discovery' ? false : user.boostDecouverteUtilise
    );

    return NextResponse.json(
      { success: true, boost: null, quota: quotaPublic(quota) },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Erreur DELETE /api/boosts :', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Impossible d’annuler le boost pour le moment.',
        code: 'BOOST_CANCEL_ERROR',
      },
      { status: 500 }
    );
  }
}
