/**
 * POST /api/upload/chat-audio
 *
 * Dépose un message vocal enregistré dans la messagerie.
 * Accepte un fichier multipart/form-data (champ "file").
 * Retourne { success: true, url: string }
 *
 * Contraintes :
 * - Formats : ceux que produit MediaRecorder selon le navigateur
 *   (WebM/Opus sur Chrome et Firefox, MP4/AAC sur Safari) ;
 * - Taille max : 10 Mo, ce qui laisse très largement les deux minutes
 *   que le composeur autorise ;
 * - Dossier Cloudinary : sferasolys/chat-audio.
 *
 * AUCUNE MODÉRATION AUTOMATIQUE N'EST POSSIBLE ICI.
 * Le texte passe par `moderateText`, les images par la modération
 * Cloudinary ; rien ne sait écouter un vocal. Le signalement reste le
 * seul recours, et il fonctionne : un vocal est un message comme un
 * autre, donc signalable depuis le fil.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import cloudinary, { verifierCloudinary, CLOUDINARY_INDISPONIBLE } from '@/lib/cloudinary';

/**
 * Les types produits par MediaRecorder.
 *
 * Le navigateur ajoute souvent un suffixe de codec (« audio/webm;codecs=opus »),
 * d'où la comparaison sur le préfixe plutôt que sur l'égalité.
 */
const TYPES_AUTORISES = [
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/aac',
  'audio/wav',
];

const POIDS_MAX = 10 * 1024 * 1024; // 10 Mo

/** Deux minutes, plus une marge pour l'imprécision du découpage. */
const DUREE_MAX_SECONDES = 130;

export async function POST(req: NextRequest) {
  if (!verifierCloudinary()) {
    return NextResponse.json(
      { success: false, error: CLOUDINARY_INDISPONIBLE, code: 'UPLOAD_UNAVAILABLE' },
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
    return NextResponse.json({ success: false, error: 'Aucun enregistrement fourni.' }, { status: 400 });
  }

  const typeDeBase = (file.type || '').split(';')[0].trim().toLowerCase();

  if (!TYPES_AUTORISES.includes(typeDeBase)) {
    return NextResponse.json(
      { success: false, error: "Ce format d'enregistrement n'est pas accepté." },
      { status: 400 }
    );
  }

  if (file.size > POIDS_MAX) {
    return NextResponse.json(
      { success: false, error: 'Enregistrement trop lourd (max 10 Mo).' },
      { status: 400 }
    );
  }

  /**
   * La durée annoncée par le client.
   *
   * Elle sert à afficher « 0:34 » dans le fil sans charger le fichier.
   * Elle n'est pas de confiance — c'est le client qui l'envoie — donc
   * elle est bornée, et elle ne sert qu'à l'affichage.
   */
  const dureeBrute = Number(formData.get('duree'));
  const duree =
    Number.isFinite(dureeBrute) && dureeBrute > 0
      ? Math.min(Math.round(dureeBrute), DUREE_MAX_SECONDES)
      : null;

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const resultat = await new Promise<{ secure_url: string; duration?: number }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: 'sferasolys/chat-audio',
              // Cloudinary range l'audio sous `video` : c'est le même
              // pipeline, il n'existe pas de `resource_type: "audio"`.
              resource_type: 'video',
            },
            (err, res) => {
              if (err || !res) reject(err ?? new Error('Cloudinary upload failed'));
              else resolve(res as { secure_url: string; duration?: number });
            }
          )
          .end(buffer);
      }
    );

    /**
     * Cloudinary sait lire la durée réelle du fichier. Quand il la donne,
     * elle prime sur celle annoncée par le client.
     */
    const dureeReelle =
      typeof resultat.duration === 'number' && resultat.duration > 0
        ? Math.min(Math.round(resultat.duration), DUREE_MAX_SECONDES)
        : duree;

    return NextResponse.json({
      success: true,
      url: resultat.secure_url,
      duree: dureeReelle,
    });
  } catch (err) {
    console.error('[upload/chat-audio]', err);
    return NextResponse.json(
      { success: false, error: "Échec de l'envoi. Réessaie." },
      { status: 500 }
    );
  }
}
