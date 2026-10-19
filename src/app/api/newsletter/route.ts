// src/app/api/newsletter/route.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { NewsletterSubscriber } from "@/models/NewsletterSubscriber";
import { addNewsletterContact } from "@/lib/newsletter";
import { rateLimit } from "@/lib/rate-limiter";

export async function POST(req: Request) {
  try {
    // Anti-spam : 5 inscriptions max / 10 min / IP.
    const rl = await rateLimit(req, 5, 600);
    if (rl.limited) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessaie dans quelques minutes." },
        {
          status: 429,
          headers: rl.retryAfter
            ? { "Retry-After": String(rl.retryAfter) }
            : undefined,
        }
      );
    }

    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Adresse email invalide." },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await NewsletterSubscriber.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existing) {
      // On ne révèle pas si l'email existe déjà — même réponse positive
      return NextResponse.json({ success: true });
    }

    await NewsletterSubscriber.create({ email: email.toLowerCase().trim() });

    // Synchronisation vers l'Audience Resend (non bloquant).
    await addNewsletterContact(email);

    // Envoi email de bienvenue newsletter via Resend (non-bloquant)
    try {
      const { clientResend, FROM_EMAIL } = await import("@/lib/resend");
      await clientResend()?.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "Bienvenue dans la newsletter Sfera'Solys",
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #04202E;">
            <div style="background: #123243; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
              <h1 style="color: #FFEBD1; margin: 0; font-size: 28px; font-weight: 700;">Sfera<span style="color: #FF4103;">&rsquo;</span>Solys</h1>
              <p style="color: rgba(255,235,209,0.7); margin: 8px 0 0; font-size: 15px;">La newsletter de la communauté</p>
            </div>
            <h2 style="color: #FFEBD1; font-size: 20px; margin-bottom: 12px;">Tu es inscrit.</h2>
            <p style="color: rgba(255,235,209,0.75); line-height: 1.7; margin-bottom: 16px;">
              Merci. Tu recevras désormais :
            </p>
            <ul style="color: rgba(255,235,209,0.75); line-height: 2; padding-left: 20px; margin-bottom: 24px;">
              <li>Les conseils de la communauté Solys</li>
              <li>Les événements à venir</li>
              <li>Les nouvelles fonctionnalités en avant-première</li>
            </ul>
            <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,235,209,0.15); color: rgba(255,235,209,0.55); font-size: 12px;">
              &copy; ${new Date().getFullYear()} Sfera&rsquo;Solys &mdash; rencontres vérifiées, hommes de 28 ans et plus
            </div>
          </div>
        `,
      });
    } catch {
      // L'email de confirmation n'est pas critique
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Newsletter] Erreur :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue. Réessaie." },
      { status: 500 }
    );
  }
}
