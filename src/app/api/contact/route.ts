// src/app/api/contact/route.ts

import { NextResponse } from 'next/server';
import { clientResend, FROM_EMAIL } from '@/lib/resend';
import { rateLimit } from '@/lib/rate-limiter';

/**
 * Réception des messages du formulaire de contact.
 *
 * Cette route n'existait pas. La page /contact contenait une **simulation
 * d'envoi** — un `setTimeout` de 1,2 s suivi de l'écran « Message envoyé ! »,
 * avec en commentaire « à remplacer par un vrai fetch plus tard ». Autrement
 * dit, tout message écrit par un visiteur était perdu, et le site lui
 * affirmait le contraire.
 *
 * Le message part vers l'adresse de support par Resend, avec le `replyTo`
 * positionné sur l'expéditeur pour qu'une réponse parte directement au bon
 * endroit.
 *
 * ⚠️ `RESEND_API_KEY` est encore un placeholder dans l'environnement (voir
 * CLAUDE.md § Variables d'environnement). Tant qu'elle n'est pas renseignée,
 * cette route répond 503 et la page affiche l'adresse email en repli — ce
 * qui est honnête, contrairement à l'ancien comportement.
 */

const ADRESSE_SUPPORT =
  process.env.CONTACT_EMAIL ?? 'contact@sferasolys.com';

/** Longueurs acceptées, alignées sur ce que demande le formulaire. */
const LIMITES = {
  nom: { min: 2, max: 80 },
  sujet: { min: 3, max: 120 },
  message: { min: 10, max: 4000 },
};

function estEmail(valeur: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valeur);
}

export async function POST(req: Request) {
  try {
    // Anti-spam : 5 messages max / 10 min / IP, même règle que la newsletter.
    const rl = await rateLimit(req, 5, 600);
    if (rl.limited) {
      return NextResponse.json(
        { error: 'Trop de messages envoyés. Réessaie dans quelques minutes.' },
        {
          status: 429,
          headers: rl.retryAfter ? { 'Retry-After': String(rl.retryAfter) } : undefined,
        }
      );
    }

    const corps = await req.json();
    const nom = String(corps?.nom ?? '').trim();
    const email = String(corps?.email ?? '').trim();
    const sujet = String(corps?.sujet ?? '').trim();
    const message = String(corps?.message ?? '').trim();

    if (nom.length < LIMITES.nom.min || nom.length > LIMITES.nom.max) {
      return NextResponse.json({ error: 'Nom invalide.' }, { status: 400 });
    }
    if (!estEmail(email)) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 });
    }
    if (sujet.length < LIMITES.sujet.min || sujet.length > LIMITES.sujet.max) {
      return NextResponse.json({ error: 'Sujet invalide.' }, { status: 400 });
    }
    if (message.length < LIMITES.message.min || message.length > LIMITES.message.max) {
      return NextResponse.json(
        { error: 'Le message doit faire entre 10 et 4000 caractères.' },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('A_REMPLACER')) {
      return NextResponse.json(
        {
          error:
            "L'envoi de messages n'est pas encore activé. Écris-nous directement à " +
            ADRESSE_SUPPORT +
            '.',
        },
        { status: 503 }
      );
    }

    // Le texte du visiteur part en clair : on l'échappe pour la partie HTML.
    const echappe = (t: string) =>
      t
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    /*
     * Le formulaire de contact est la seule voie de recours affichée sur le
     * site : si l'e-mail ne peut pas partir, il faut le dire à la personne
     * plutôt que d'accuser réception d'un message qui n'ira nulle part.
     */
    const client = clientResend();

    if (!client) {
      return NextResponse.json(
        {
          success: false,
          error:
            "L'envoi de messages est momentanément indisponible. Réessaie plus tard.",
        },
        { status: 503 }
      );
    }

    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to: ADRESSE_SUPPORT,
      replyTo: email,
      subject: `[Contact] ${sujet}`,
      text: `De : ${nom} <${email}>\nSujet : ${sujet}\n\n${message}`,
      html: `
        <p><strong>De :</strong> ${echappe(nom)} &lt;${echappe(email)}&gt;</p>
        <p><strong>Sujet :</strong> ${echappe(sujet)}</p>
        <hr />
        <p style="white-space:pre-wrap">${echappe(message)}</p>
      `,
    });

    if (error) {
      return NextResponse.json(
        { error: "Le message n'a pas pu être envoyé. Réessaie dans un instant." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Une erreur est survenue. Réessaie dans un instant.' },
      { status: 500 }
    );
  }
}
