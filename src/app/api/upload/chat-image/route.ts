/**
 * POST /api/upload/chat-image
 *
 * Upload une image envoyée dans le chat.
 * Accepte un fichier multipart/form-data (champ "file").
 * Vérifie que l'utilisateur est authentifié.
 * Retourne { success: true, url: string }
 *
 * Contraintes :
 * - Formats : JPG, PNG, WebP, GIF
 * - Taille max : 8 Mo
 * - Redimensionnement : max 1200px côté le plus long, qualité 80
 * - Dossier Cloudinary : sferasolys/chat
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { ModerationLog } from '@/models/ModerationLog';
import cloudinary, { verifierCloudinary, CLOUDINARY_INDISPONIBLE } from '@/lib/cloudinary';
import {
  livraisonFonctionne,
  urlCloudinary,
  type ModeDeLivraison,
} from '@/lib/medias';
import {
  getModerationUploadOption,
  evaluateModeration,
  MODERATION_REJECTION_MESSAGE,
} from '@/lib/moderation';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 8 * 1024 * 1024; // 8 Mo

export async function POST(req: NextRequest) {
  // Sans clés Cloudinary, il n'y a nulle part où déposer l'image.
  if (!verifierCloudinary()) {
    return NextResponse.json(
      { success: false, error: CLOUDINARY_INDISPONIBLE, code: "UPLOAD_UNAVAILABLE" },
      { status: 503 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ success: false, error: 'Requête invalide.' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ success: false, error: 'Aucun fichier fourni.' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { success: false, error: 'Format non supporté. Utilisez JPG, PNG, WebP ou GIF.' },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { success: false, error: 'Fichier trop lourd (max 8 Mo).' },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  /**
   * Le dépôt, dans un mode donné.
   *
   * Isolé dans une fonction parce qu'il peut être rejoué : si la
   * livraison authentifiée ne répond pas sur ce compte, on redépose en
   * accès libre plutôt que de laisser une photo muette dans le fil.
   */
  const deposer = (mode: ModeDeLivraison) =>
    new Promise<{ secure_url: string; public_id: string; moderation?: unknown }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: 'sferasolys/chat',
              transformation: [
                { width: 1200, height: 1200, crop: 'limit', quality: 80 },
              ],
              resource_type: 'image',
              type: mode,
              moderation: getModerationUploadOption(),
            },
            (err, res) => {
              if (err || !res) reject(err ?? new Error('Cloudinary upload failed'));
              else resolve(res as { secure_url: string; public_id: string; moderation?: unknown });
            }
          )
          .end(buffer);
      }
    );

  try {
    /**
     * Déposé en mode authentifié : l'adresse ne se devine pas, même en
     * connaissant l'identifiant. La route de média la signe à chaque
     * lecture, pour qui a le droit de voir la conversation.
     */
    let mode: ModeDeLivraison = 'authenticated';
    let result = await deposer(mode);

    /**
     * La livraison authentifiée répond-elle vraiment ?
     *
     * Elle dépend de la configuration du compte. Si elle ne répond pas,
     * on redépose en accès libre : une photo lisible par trop de monde
     * vaut mieux qu'une photo que personne ne voit, et l'avertissement
     * dit quoi corriger.
     */
    if (!(await livraisonFonctionne(
      urlCloudinary(result.public_id, { resourceType: 'image', mode })
    ))) {
      console.warn(
        '[upload/chat-image] La livraison authentifiée ne répond pas sur ce ' +
          'compte Cloudinary : la photo est déposée en accès libre. ' +
          'Les médias de conversation ne sont alors protégés que par la route ' +
          'de média, pas par Cloudinary lui-même.'
      );

      await cloudinary.uploader
        .destroy(result.public_id, { type: 'authenticated' })
        .catch(() => {});

      mode = 'upload';
      result = await deposer(mode);
    }

    // Modération automatique : rejet → suppression Cloudinary, image jamais envoyée dans le chat.
    const verdict = evaluateModeration(result);
    if (!verdict.approved) {
      await cloudinary.uploader
        .destroy(result.public_id, { type: mode })
        .catch(() => {});
      try {
        await connectDB();
        const user = await User.findOne({ email: session.user.email.toLowerCase().trim() }).select('_id');
        if (user) {
          await ModerationLog.create({
            userId: user._id,
            context: 'chat_image',
            reason: verdict.reason ?? 'Contenu rejeté',
          });
        }
      } catch {
        // Le log de modération ne doit jamais empêcher de répondre à l'utilisateur.
      }
      return NextResponse.json(
        { success: false, error: MODERATION_REJECTION_MESSAGE },
        { status: 400 }
      );
    }

    /**
     * L'identifiant part avec l'adresse.
     *
     * C'est lui qui est stocké sur le message : l'adresse n'est plus
     * qu'un aperçu immédiat pour celui qui vient de déposer la photo.
     */
    return NextResponse.json({
      success: true,
      // L'aperçu immédiat pour celui qui vient de déposer : signé quand
      // le fichier est authentifié, sans quoi il ne verrait rien.
      url: urlCloudinary(result.public_id, { resourceType: 'image', mode }),
      publicId: result.public_id,
      mediaType: mode,
    });
  } catch (err) {
    console.error('[upload/chat-image]', err);
    return NextResponse.json(
      { success: false, error: "Échec de l'upload. Réessayez." },
      { status: 500 }
    );
  }
}
