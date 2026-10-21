// src/app/api/cron/circle-weekly/route.ts

import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { CircleWeek } from "@/models/CircleWeek";
import { debutDeSemaine } from "@/lib/circle";
import { sendCircleHebdoPush } from "@/lib/push";

/**
 * GET /api/cron/circle-weekly
 *
 * La relance du lundi matin : « ta sélection de la semaine t'attend ».
 *
 * ## Pourquoi ce cron ne tire aucune sélection
 *
 * Le tirage du Circle est paresseux : il a lieu au premier affichage de
 * `/circle`, et la sélection est ensuite figée dans `CircleWeek` jusqu'au
 * lundi suivant. C'est un bon réglage — rien n'est calculé pour les
 * membres qui ne reviennent pas — et ce cron le laisse tel quel. Pré-tirer
 * pour tout le monde reviendrait à calculer des sélections que personne
 * n'ouvrira, et à rendre le tirage sensible à l'heure du cron plutôt qu'à
 * la définition de la semaine.
 *
 * Ce qui manquait n'était pas le calcul, c'était le signal. Il existe
 * maintenant à deux endroits : une pastille dans l'application, portée par
 * `circlePret` dans `/api/notifications` et visible même sans ce cron ; et
 * cette relance push, pour atteindre ceux qui ne sont pas revenus.
 *
 * ## Ce qu'il n'envoie pas
 *
 * Pas d'e-mail. `RESEND_API_KEY` est encore un placeholder, et
 * `lib/emails.ts` n'échoue pas sans clé : il n'envoie pas, en silence. Un
 * envoi ajouté ici donnerait l'illusion d'une relance qui n'existe pas.
 * À brancher quand le domaine sera en place.
 *
 * ## Sélection des destinataires
 *
 * Offre payante en cours, jeton push enregistré, et aucune `CircleWeek`
 * pour le lundi courant — donc sélection pas encore ouverte. Le jeton est
 * exigé par la requête : inutile de parcourir des milliers de comptes pour
 * découvrir ensuite qu'ils n'ont pas l'application.
 *
 * Sécurité : CRON_SECRET, même motif que les autres tâches planifiées.
 * Query : `?dry=1` compte les destinataires sans rien envoyer.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

/** Plafond par exécution, pour qu'un volume inattendu ne fasse pas expirer la tâche. */
const PLAFOND = 400;

function estAutorise(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;

  // Sans secret configuré, on refuse : mieux vaut un cron qui ne tourne
  // pas qu'une route ouverte à tout le monde en production.
  if (!secret) return false;

  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!estAutorise(req)) {
    return NextResponse.json(
      { success: false, error: "Non autorisé.", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const simulation = req.nextUrl.searchParams.get("dry") === "1";

  try {
    await connectDB();

    const semaine = debutDeSemaine();

    /**
     * Équivalent en requête de `planEffectif` : un abonnement résilié ou
     * en retard de paiement retombe sur l'offre gratuite, qui n'a pas le
     * Circle.
     */
    const candidats = await User.find({
      isPremium: true,
      subscriptionStatus: { $in: ["active", "trialing"] },
      plan: { $ne: "free" },
      banned: { $ne: true },
      expoPushToken: { $exists: true, $ne: null },
    })
      .select("_id")
      .limit(PLAFOND)
      .lean();

    if (candidats.length === 0) {
      return NextResponse.json(
        { success: true, candidats: 0, relances: 0, simulation },
        { status: 200 }
      );
    }

    const ids = candidats.map((candidat) => candidat._id);

    // Une seule requête pour savoir qui a déjà ouvert sa semaine.
    const dejaTires = await CircleWeek.find({
      userId: { $in: ids },
      weekStart: semaine,
    })
      .select("userId")
      .lean();

    const vus = new Set(
      dejaTires.map((ligne) => String((ligne as { userId: unknown }).userId))
    );

    const aRelancer = ids.filter((id) => !vus.has(String(id)));

    if (simulation) {
      return NextResponse.json(
        {
          success: true,
          candidats: candidats.length,
          relances: aRelancer.length,
          simulation: true,
        },
        { status: 200 }
      );
    }

    /**
     * Envois en série plutôt qu'en parallèle : l'API Expo limite le débit,
     * et une tâche qui dépasse son temps imparti vaut mieux qu'un lot
     * entier rejeté.
     */
    let envoyees = 0;

    for (const id of aRelancer) {
      try {
        await sendCircleHebdoPush({ recipientUserId: String(id) });
        envoyees += 1;
      } catch (erreur) {
        console.error("Relance Circle impossible pour", String(id), erreur);
      }
    }

    return NextResponse.json(
      {
        success: true,
        candidats: candidats.length,
        relances: aRelancer.length,
        envoyees,
        simulation: false,
      },
      { status: 200 }
    );
  } catch (erreur) {
    console.error("GET /api/cron/circle-weekly :", erreur);

    return NextResponse.json(
      { success: false, error: "Erreur serveur.", code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
