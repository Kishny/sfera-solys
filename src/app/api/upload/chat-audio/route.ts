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
    const resultat = await new Promise<{
      secure_url: string;
      public_id: string;
      duration?: number;
      eager?: { secure_url?: string }[];
    }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: 'sferasolys/chat-audio',
              // Cloudinary range l'audio sous `video` : c'est le même
              // pipeline, il n'existe pas de `resource_type: "audio"`.
              resource_type: 'video',
              /**
               * Le MP3 est produit maintenant, pas à la première écoute.
               *
               * Sans ça, le premier lecteur à demander l'adresse
               * déclenche le transcodage et peut recevoir une erreur
               * pendant qu'il s'exécute — et c'est précisément
               * l'expéditeur, au moment où il réécoute son propre
               * enregistrement.
               */
              eager: [{ format: 'mp3' }],
              eager_async: false,
            },
            (err, res) => {
              if (err || !res) reject(err ?? new Error('Cloudinary upload failed'));
              else
                resolve(
                  res as {
                    secure_url: string;
                    public_id: string;
                    duration?: number;
                    eager?: { secure_url?: string }[];
                  }
                );
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

    /**
     * L'URL de lecture est servie en MP3, pas dans le format d'origine.
     *
     * Chaque navigateur enregistre dans le sien : WebM/Opus sur Chrome et
     * Firefox, MP4/AAC sur Safari. Or Safari ne sait pas lire l'Opus en
     * WebM — un vocal enregistré sur Chrome serait donc muet pour la
     * moitié des destinataires, et personne n'y aurait vu autre chose
     * qu'un lecteur cassé.
     *
     * Cloudinary transcode à la première demande et garde le résultat.
     * Le MP3 est le seul format audio que tous les navigateurs lisent.
     * Le fichier d'origine reste déposé, intact, au cas où.
     */
    const urlMp3 =
      resultat.eager?.[0]?.secure_url ??
      // Si le transcodage demandé à l'envoi n'a rien renvoyé, l'adresse
      // construite à la main reste valable : Cloudinary produira le MP3
      // à la première demande.
      cloudinary.url(resultat.public_id, {
        resource_type: 'video',
        format: 'mp3',
        secure: true,
        // Sans ça, Cloudinary accroche un paramètre de suivi à l'URL.
        // Une adresse de média n'a pas à porter ça.
        analytics: false,
      });

    /**
     * Le MP3 est-il réellement servi ?
     *
     * Le transcodage dépend de la configuration du compte Cloudinary —
     * les transformations strictes, notamment, refusent une dérivée non
     * signée. Plutôt que de le supposer, on le demande.
     *
     * Si le MP3 ne répond pas, on sert le fichier d'origine. Le vocal
     * reste lisible par le navigateur qui l'a enregistré, ce qui vaut
     * mieux qu'une adresse morte ; la lecture entre navigateurs
     * différents, elle, redevient incertaine — d'où l'avertissement
     * dans les journaux, pour que ça se voie.
     */
    let urlDeLecture = urlMp3;

    try {
      const verification = await fetch(urlMp3, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });

      if (!verification.ok) {
        console.warn(
          `[upload/chat-audio] MP3 indisponible (${verification.status}) : ` +
            `le vocal est servi dans son format d'origine, ` +
            `illisible sur les navigateurs qui ne le gèrent pas.`
        );
        urlDeLecture = resultat.secure_url;
      }
    } catch {
      console.warn(
        "[upload/chat-audio] Le MP3 n'a pas pu être vérifié : " +
          "le vocal est servi dans son format d'origine."
      );
      urlDeLecture = resultat.secure_url;
    }

    return NextResponse.json({
      success: true,
      url: urlDeLecture,
      publicId: resultat.public_id,
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
