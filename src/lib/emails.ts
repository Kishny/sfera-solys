// src/lib/emails.ts
// Templates HTML pour les emails transactionnels Sfera'Solys

import { resend, FROM_EMAIL } from "./resend";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sferasolys.com";

// ─── Helpers de layout ────────────────────────────────────────────────────────

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sfera'Solys</title>
</head>
<body style="margin:0;padding:0;background:#f4f2ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ef;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#001724,#0C222D);padding:32px 40px;text-align:center;">
            <span style="font-size:28px;">☀️</span>
            <h1 style="color:#FFEBD1;margin:8px 0 0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Sfera'Solys</h1>
          </td>
        </tr>
        <!-- Content -->
        <tr><td style="padding:40px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f7f5f2;padding:24px 40px;text-align:center;border-top:1px solid #ebe8e3;">
            <p style="color:#999;font-size:12px;margin:0;">© ${new Date().getFullYear()} Sfera'Solys · Chaque rencontre commence par un dossier vérifié.</p>
            <p style="color:#bbb;font-size:11px;margin:8px 0 0;">Si tu n'es pas à l'origine de cette action, ignore cet email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function primaryButton(text: string, url: string): string {
  return `<div style="text-align:center;margin:32px 0;">
    <a href="${url}" style="display:inline-block;background:#FF4103;color:#001724;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px;">${text}</a>
  </div>`;
}

// ─── Email : vérification d'adresse email ─────────────────────────────────────

export async function sendVerificationEmail(
  to: string,
  pseudonyme: string,
  token: string
): Promise<void> {
  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;

  const html = emailWrapper(`
    <h2 style="color:#1C1C1C;font-size:22px;margin:0 0 8px;">Bienvenue sur Sfera'Solys, ${pseudonyme} ☀️</h2>
    <p style="color:#666;line-height:1.6;margin:0 0 24px;">
      Ton compte a bien été créé ! Il ne reste qu'une étape : confirmer ton adresse email pour activer ton profil.
    </p>
    ${primaryButton("Vérifier mon adresse email", verifyUrl)}
    <p style="color:#999;font-size:13px;text-align:center;margin:0;">
      Ce lien expire dans <strong>24 heures</strong>.<br/>
      Si le bouton ne fonctionne pas, copie ce lien : <br/>
      <span style="color:#6B1B02;word-break:break-all;">${verifyUrl}</span>
    </p>
  `);

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "☀️ Confirme ton adresse email — Sfera'Solys",
    html,
  });
}

// ─── Email : reset mot de passe ───────────────────────────────────────────────

export async function sendResetPasswordEmail(
  to: string,
  pseudonyme: string,
  token: string
): Promise<void> {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;

  const html = emailWrapper(`
    <h2 style="color:#1C1C1C;font-size:22px;margin:0 0 8px;">Réinitialisation de mot de passe</h2>
    <p style="color:#666;line-height:1.6;margin:0 0 8px;">Bonjour ${pseudonyme},</p>
    <p style="color:#666;line-height:1.6;margin:0 0 24px;">
      Tu as demandé à réinitialiser ton mot de passe. Clique sur le bouton ci-dessous pour choisir un nouveau mot de passe.
    </p>
    ${primaryButton("Réinitialiser mon mot de passe", resetUrl)}
    <p style="color:#999;font-size:13px;text-align:center;margin:0;">
      Ce lien expire dans <strong>1 heure</strong>.<br/>
      Si tu n'as pas fait cette demande, ignore cet email — ton compte est en sécurité.
    </p>
  `);

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "🔐 Réinitialisation de ton mot de passe — Sfera'Solys",
    html,
  });
}

// ─── Email : bienvenue après vérification ─────────────────────────────────────

export async function sendWelcomeEmail(
  to: string,
  pseudonyme: string
): Promise<void> {
  const html = emailWrapper(`
    <h2 style="color:#1C1C1C;font-size:22px;margin:0 0 8px;">Ton email est confirmé ✨</h2>
    <p style="color:#666;line-height:1.6;margin:0 0 24px;">
      Bienvenue dans la communauté Sfera'Solys, ${pseudonyme} ! Ton profil est maintenant actif.
      Complète-le pour commencer à rencontrer des profils qui te correspondent vraiment.
    </p>
    ${primaryButton("Compléter mon profil", `${APP_URL}/inscription`)}
  `);

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "✨ Bienvenue sur Sfera'Solys !",
    html,
  });
}

// ─── Helpers abonnement ───────────────────────────────────────────────────────

function formatDateFr(date?: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const ACCOUNT_URL = `${APP_URL}/mon-compte?tab=premium`;

// ─── Email : paiement / renouvellement confirmé ───────────────────────────────

export async function sendPaymentSuccessEmail(
  to: string,
  pseudonyme: string,
  planLabel: string,
  periodEnd?: Date | string | null
): Promise<void> {
  const nextDate = formatDateFr(periodEnd);

  const html = emailWrapper(`
    <h2 style="color:#1C1C1C;font-size:22px;margin:0 0 8px;">Paiement confirmé 🧡</h2>
    <p style="color:#666;line-height:1.6;margin:0 0 16px;">Bonjour ${pseudonyme},</p>
    <p style="color:#666;line-height:1.6;margin:0 0 16px;">
      Ton abonnement <strong>${planLabel}</strong> est actif. Merci de faire partie de la communauté Sfera'Solys !
    </p>
    ${
      nextDate
        ? `<p style="color:#666;line-height:1.6;margin:0 0 8px;">
            🔄 Prochain renouvellement automatique : <strong>${nextDate}</strong>.
          </p>`
        : ""
    }
    <p style="color:#999;font-size:13px;line-height:1.6;margin:0 0 8px;">
      Tu peux gérer, mettre en pause ou résilier ton abonnement à tout moment depuis ton compte.
    </p>
    ${primaryButton("Gérer mon abonnement", ACCOUNT_URL)}
  `);

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "🧡 Ton abonnement Sfera'Solys est confirmé",
    html,
  });
}

// ─── Email : échec de paiement ────────────────────────────────────────────────

export async function sendPaymentFailedEmail(
  to: string,
  pseudonyme: string
): Promise<void> {
  const html = emailWrapper(`
    <h2 style="color:#1C1C1C;font-size:22px;margin:0 0 8px;">Souci avec ton paiement ⚠️</h2>
    <p style="color:#666;line-height:1.6;margin:0 0 16px;">Bonjour ${pseudonyme},</p>
    <p style="color:#666;line-height:1.6;margin:0 0 16px;">
      Nous n'avons pas pu prélever le renouvellement de ton abonnement Sfera'Solys. Cela arrive souvent
      pour une carte expirée ou un plafond atteint.
    </p>
    <p style="color:#666;line-height:1.6;margin:0 0 8px;">
      Pour ne pas perdre ton accès Premium, mets à jour ton moyen de paiement depuis ton compte.
      Un nouvel essai de prélèvement sera effectué automatiquement.
    </p>
    ${primaryButton("Mettre à jour mon paiement", ACCOUNT_URL)}
  `);

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "⚠️ Paiement de ton abonnement Sfera'Solys — action requise",
    html,
  });
}

// ─── Email : résiliation confirmée ────────────────────────────────────────────

export async function sendSubscriptionCanceledEmail(
  to: string,
  pseudonyme: string,
  accessUntil?: Date | string | null
): Promise<void> {
  const untilDate = formatDateFr(accessUntil);

  const html = emailWrapper(`
    <h2 style="color:#1C1C1C;font-size:22px;margin:0 0 8px;">Résiliation prise en compte</h2>
    <p style="color:#666;line-height:1.6;margin:0 0 16px;">Bonjour ${pseudonyme},</p>
    <p style="color:#666;line-height:1.6;margin:0 0 16px;">
      Ton abonnement Sfera'Solys ne se renouvellera plus.
      ${
        untilDate
          ? `Tu conserves l'accès Premium jusqu'au <strong>${untilDate}</strong>.`
          : "Tu conserves l'accès Premium jusqu'à la fin de ta période en cours."
      }
    </p>
    <p style="color:#666;line-height:1.6;margin:0 0 8px;">
      Tu changes d'avis ? Tu peux réactiver ton abonnement à tout moment, sans rien reperdre.
    </p>
    ${primaryButton("Réactiver mon abonnement", ACCOUNT_URL)}
  `);

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Ton abonnement Sfera'Solys a été résilié",
    html,
  });
}

// ─── Email : rappel avant renouvellement (J-3) ────────────────────────────────

export async function sendRenewalReminderEmail(
  to: string,
  pseudonyme: string,
  planLabel: string,
  renewalDate?: Date | string | null
): Promise<void> {
  const dateStr = formatDateFr(renewalDate);

  const html = emailWrapper(`
    <h2 style="color:#1C1C1C;font-size:22px;margin:0 0 8px;">Ton abonnement se renouvelle bientôt 🔄</h2>
    <p style="color:#666;line-height:1.6;margin:0 0 16px;">Bonjour ${pseudonyme},</p>
    <p style="color:#666;line-height:1.6;margin:0 0 16px;">
      Petit rappel amical : ton abonnement <strong>${planLabel}</strong> sera renouvelé automatiquement
      ${dateStr ? `le <strong>${dateStr}</strong>` : "très bientôt"}.
    </p>
    <p style="color:#666;line-height:1.6;margin:0 0 8px;">
      Tu n'as rien à faire pour continuer à profiter de Sfera'Solys. Si tu préfères ne pas renouveler,
      tu peux résilier en un clic depuis ton compte avant cette date.
    </p>
    ${primaryButton("Gérer mon abonnement", ACCOUNT_URL)}
  `);

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "🔄 Ton abonnement Sfera'Solys se renouvelle bientôt",
    html,
  });
}

// ─── Email : relance membre inactif ───────────────────────────────────────────

export async function sendReengagementEmail(
  to: string,
  pseudonyme: string
): Promise<void> {
  const html = emailWrapper(`
    <h2 style="color:#1C1C1C;font-size:22px;margin:0 0 8px;">Tu nous manques, ${pseudonyme} ☀️</h2>
    <p style="color:#666;line-height:1.6;margin:0 0 16px;">
      La communauté Sfera'Solys continue de grandir et de nouvelles personnes t'attendent peut-être.
    </p>
    <p style="color:#666;line-height:1.6;margin:0 0 24px;">
      Reviens jeter un œil : de nouveaux profils, de nouvelles affinités, et toujours le même espace sûr et bienveillant.
    </p>
    ${primaryButton("Revenir sur Sfera'Solys", `${APP_URL}/explorer`)}
    <p style="color:#999;font-size:13px;text-align:center;margin:0;">À très vite 🧡</p>
  `);

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "☀️ On t'a gardé une place sur Sfera'Solys",
    html,
  });
}

// ─── Email : relance paiement en échec (dunning) ──────────────────────────────

export async function sendDunningEmail(
  to: string,
  pseudonyme: string
): Promise<void> {
  const html = emailWrapper(`
    <h2 style="color:#1C1C1C;font-size:22px;margin:0 0 8px;">Un souci avec ton paiement, ${pseudonyme}</h2>
    <p style="color:#666;line-height:1.6;margin:0 0 16px;">
      Le renouvellement de ton abonnement Sfera'Solys n'a pas pu être prélevé. Ton accès premium risque d'être suspendu.
    </p>
    <p style="color:#666;line-height:1.6;margin:0 0 24px;">
      Mets à jour ton moyen de paiement en quelques secondes pour ne rien perdre.
    </p>
    ${primaryButton("Mettre à jour mon paiement", `${APP_URL}/mon-compte`)}
    <p style="color:#999;font-size:13px;text-align:center;margin:0;">
      Si c'est déjà réglé, ignore cet email.
    </p>
  `);

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "⚠️ Ton paiement Sfera'Solys n'a pas abouti",
    html,
  });
}

// ─── Email : win-back abonnement résilié ──────────────────────────────────────

export async function sendWinbackEmail(
  to: string,
  pseudonyme: string
): Promise<void> {
  const html = emailWrapper(`
    <h2 style="color:#1C1C1C;font-size:22px;margin:0 0 8px;">Et si on se retrouvait, ${pseudonyme} ?</h2>
    <p style="color:#666;line-height:1.6;margin:0 0 16px;">
      Ton abonnement premium s'est terminé, mais ta place dans la communauté Sfera'Solys reste ouverte.
    </p>
    <p style="color:#666;line-height:1.6;margin:0 0 24px;">
      Réactive ton accès premium quand tu veux pour retrouver toutes tes fonctionnalités : visibilité, mode fantôme, et bien plus.
    </p>
    ${primaryButton("Réactiver mon premium", `${APP_URL}/tarifs`)}
    <p style="color:#999;font-size:13px;text-align:center;margin:0;">On serait ravies de te revoir 🧡</p>
  `);

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "🧡 Ta place t'attend sur Sfera'Solys",
    html,
  });
}
