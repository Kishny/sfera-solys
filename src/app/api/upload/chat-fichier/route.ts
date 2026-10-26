/**
 * POST /api/upload/chat-fichier
 *
 * Dépose un fichier joint à un message.
 *
 * POURQUOI LE PDF, ET RIEN D'AUTRE
 * Une messagerie de site de rencontre est un canal entre inconnus. Y
 * laisser circuler des fichiers quelconques, c'est ouvrir une voie à
 * l'envoi de logiciels malveillants : une archive, un document
 * bureautique à macros ou un exécutable déguisé se téléchargent et
 * s'ouvrent comme le reste.
 *
 * Le PDF est le seul format de document que tous les navigateurs
 * affichent dans leur propre visionneuse, sans rien exécuter et sans
 * passer par une application installée. C'est pour cette seule raison
 * qu'il est accepté. Élargir cette liste — .docx, .zip, .xlsx — revient
 * à ouvrir la voie décrite ci-dessus : à ne pas faire sans mesurer ce
 * qu'on échange contre quoi.
 *
 * Aucune analyse antivirus n'est faite. Un PDF peut contenir du
 * JavaScript, que les visionneuses de navigateur n'exécutent pas, mais
 * qu'un lecteur de bureau peut exécuter. Le risque est réduit, pas
 * supprimé.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import cloudinary, { verifierCloudinary, CLOUDINARY_INDISPONIBLE } from '@/lib/cloudinary';

const POIDS_MAX = 10 * 1024 * 1024; // 10 Mo

/** Les quatre premiers octets d'un PDF : « %PDF ». */
const SIGNATURE_PDF = [0x25, 0x50, 0x44, 0x46];

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
    return NextResponse.json({ success: false, error: 'Aucun fichier fourni.' }, { status: 400 });
  }

  if (file.size > POIDS_MAX) {
    return NextResponse.json(
      { success: false, error: 'Fichier trop lourd (max 10 Mo).' },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  /**
   * Le type annoncé par le navigateur ne suffit pas : il vient du client,
   * et se renomme. On lit les premiers octets du fichier, qui eux ne
   * mentent pas sur ce qu'il est.
   */
  const signature = [...buffer.subarray(0, 4)];
  const estUnPdf = SIGNATURE_PDF.every((octet, i) => signature[i] === octet);

  if (!estUnPdf) {
    return NextResponse.json(
      {
        success: false,
        error: 'Seuls les PDF sont acceptés dans la messagerie.',
      },
      { status: 400 }
    );
  }

  /**
   * Le nom affiché.
   *
   * Nettoyé de ce qui sert à tromper l'œil : les séparateurs de chemin,
   * et les marques de sens d'écriture qui permettent d'afficher
   * « facture‮gpj.pdf » là où le fichier s'appelle autrement.
   */
  const nom =
    (file.name || 'document.pdf')
      .replace(/[‪-‮⁦-⁩]/g, '')
      .replace(/[/\\]/g, '_')
      .trim()
      .slice(0, 200) || 'document.pdf';

  try {
    const resultat = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'sferasolys/chat-fichiers',
            // `raw` : Cloudinary sert le fichier tel quel, sans tenter
            // d'y voir une image ou une vidéo.
            resource_type: 'raw',
            format: 'pdf',
          },
          (err, res) => {
            if (err || !res) reject(err ?? new Error('Cloudinary upload failed'));
            else resolve(res as { secure_url: string });
          }
        )
        .end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: resultat.secure_url,
      nom,
      poids: file.size,
    });
  } catch (err) {
    console.error('[upload/chat-fichier]', err);
    return NextResponse.json(
      { success: false, error: "Échec de l'envoi. Réessaie." },
      { status: 500 }
    );
  }
}
