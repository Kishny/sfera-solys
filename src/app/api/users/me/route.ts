/**
 * DELETE /api/users/me — Suppression définitive du compte connecté.
 *
 * Obligatoire App Store Apple (guideline 5.1.1). Processus :
 * 1. Annule l'abonnement Stripe actif (en fin de période, sans remboursement)
 * 2. Supprime les photos Cloudinary (avatar + galerie)
 * 3. Supprime toutes les données liées (likes, matches, messages, visites, vibes…)
 * 4. Supprime le document User
 *
 * Authentification : session NextAuth obligatoire.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Like } from '@/models/Like';
import { Match } from '@/models/Match';
import { Message } from '@/models/Message';
import { ProfileVisit } from '@/models/ProfileVisit';
import { CommunityPost } from '@/models/CommunityPost';
import { MentorPost } from '@/models/MentorPost';
import { stripe } from '@/lib/stripe';
import { v2 as cloudinary } from 'cloudinary';
import { identifiantDeLEntree, modeDeLEntree } from "@/lib/photos-profil";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const userId = session.user.id;
  await connectDB();

  const user = await User.findById(userId).select(
    'stripeSubscriptionId stripeCustomerId image photos'
  );
  if (!user) {
    return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
  }

  // ── 1. Annuler l'abonnement Stripe (fin de période, pas de remboursement) ──
  /*
   * Stripe absent n'empêche pas la suppression : le droit à l'effacement ne
   * dépend pas d'un service tiers. On saute simplement la résiliation.
   */
  if (user.stripeSubscriptionId && stripe) {
    try {
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    } catch {
      // Non bloquant — on continue la suppression même si Stripe échoue
    }
  }

  // ── 2. Supprimer les photos Cloudinary ────────────────────────────────────
  /**
   * Avatar et galerie n'ont plus la même forme.
   *
   * L'avatar reste une adresse ; la galerie contient des références. Et
   * une photo authentifiée ne se détruit qu'en précisant son mode, sans
   * quoi Cloudinary cherche au mauvais endroit et le fichier survit à la
   * suppression du compte.
   */
  const aSupprimer: { publicId: string; mode: "upload" | "authenticated" }[] = [];

  for (const entree of [user.image, ...(user.photos ?? [])]) {
    if (!entree) continue;

    const publicId = identifiantDeLEntree(entree);

    if (publicId) aSupprimer.push({ publicId, mode: modeDeLEntree(entree) });
  }

  await Promise.allSettled(
    aSupprimer.map(({ publicId, mode }) =>
      cloudinary.uploader.destroy(publicId, { type: mode, invalidate: true })
    )
  );

  // ── 3. Supprimer toutes les données liées ─────────────────────────────────
  await Promise.allSettled([
    Like.deleteMany({ $or: [{ fromUserId: userId }, { toUserId: userId }] }),
    Match.deleteMany({ $or: [{ user1Id: userId }, { user2Id: userId }] }),
    Message.deleteMany({ senderId: userId }),
    ProfileVisit.deleteMany({ $or: [{ visitorId: userId }, { visitedId: userId }] }),
    CommunityPost.deleteMany({ userId }),
    MentorPost.deleteMany({ userId }),
  ]);

  // ── 4. Supprimer le document User ─────────────────────────────────────────
  await User.findByIdAndDelete(userId);

  return NextResponse.json({ success: true });
}
