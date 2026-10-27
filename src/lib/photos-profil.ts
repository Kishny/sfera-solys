// src/lib/photos-profil.ts

import cloudinary from "@/lib/cloudinary";
import { livraisonFonctionne, type ModeDeLivraison } from "@/lib/medias";

/**
 * La galerie d'une fiche de profil.
 *
 * Les photos de galerie étaient servies par des adresses Cloudinary
 * publiques : qui avait le lien les récupérait sans compte, et pour
 * toujours. Ce sont les photos les plus personnelles du site — celles
 * qu'on montre sur sa fiche, pas la vignette d'une liste.
 *
 * DEUX FORMES DANS LE MÊME TABLEAU, ET POURQUOI
 * `User.photos` contient désormais, selon l'ancienneté de la photo :
 *
 * - une adresse absolue (`https://res.cloudinary.com/…`) pour tout ce
 *   qui a été déposé avant ce changement ;
 * - une référence `"<mode>|<identifiant>"` pour tout ce qui l'est
 *   depuis.
 *
 * Garder les deux évite une migration que personne ne peut lancer sans
 * accès à la base, et évite surtout de casser les photos déjà en ligne.
 * La forme se reconnaît à l'œil comme au code : une adresse commence par
 * `http`, une référence non.
 *
 * Stocker la référence plutôt que l'adresse a un second effet utile :
 * l'adresse signée est recalculée à chaque lecture, donc changer de mode
 * de livraison ne demandera jamais de réécrire une ligne.
 */

const SEPARATEUR = "|";

/** Le dossier Cloudinary des photos de galerie. */
export const DOSSIER_GALERIE = "sferasolys/photos";

/** Fabrique la référence à stocker. */
export function referencePhoto(
  publicId: string,
  mode: ModeDeLivraison
): string {
  return `${mode}${SEPARATEUR}${publicId}`;
}

/** Une entrée du tableau est-elle une adresse héritée ? */
function estUneAdresse(entree: string): boolean {
  return /^https?:\/\//i.test(entree);
}

/**
 * L'identifiant Cloudinary d'une entrée, quelle que soit sa forme.
 *
 * Sert à supprimer la photo chez Cloudinary, et à retrouver quelle
 * entrée correspond à une adresse envoyée par le client.
 */
export function identifiantDeLEntree(entree: string): string | null {
  if (!estUneAdresse(entree)) {
    const [, ...reste] = entree.split(SEPARATEUR);
    const identifiant = reste.join(SEPARATEUR);

    return identifiant || null;
  }

  return identifiantDepuisUrl(entree);
}

/**
 * L'identifiant Cloudinary contenu dans une adresse.
 *
 * Reconnaît les deux chemins de livraison, `upload` et `authenticated`,
 * et la signature que porte le second. Sans quoi la suppression d'une
 * photo authentifiée ne retrouverait pas son fichier.
 */
export function identifiantDepuisUrl(url: string): string | null {
  const trouvaille = url.match(
    /\/(?:upload|authenticated)\/(?:s--[^/]+--\/)?(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i
  );

  return trouvaille?.[1] ?? null;
}

/** Le mode de livraison d'une entrée. */
export function modeDeLEntree(entree: string): ModeDeLivraison {
  if (estUneAdresse(entree)) return "upload";

  return entree.startsWith(`authenticated${SEPARATEUR}`)
    ? "authenticated"
    : "upload";
}

/**
 * L'adresse à afficher pour une entrée.
 *
 * Une adresse héritée est rendue telle quelle ; une référence est
 * résolue, et signée si le fichier est authentifié.
 */
export function urlDeLaPhoto(entree: string): string | null {
  if (!entree) return null;
  if (estUneAdresse(entree)) return entree;

  const identifiant = identifiantDeLEntree(entree);

  if (!identifiant) return null;

  const mode = modeDeLEntree(entree);

  return cloudinary.url(identifiant, {
    resource_type: "image",
    type: mode,
    sign_url: mode === "authenticated",
    secure: true,
    analytics: false,
  });
}

/**
 * Toute la galerie, prête à être envoyée au client.
 *
 * Les entrées illisibles sont écartées plutôt que rendues vides : une
 * image cassée dans une fiche de profil est pire qu'une photo de moins.
 */
export function galeriePubliee(photos: unknown): string[] {
  if (!Array.isArray(photos)) return [];

  return photos
    .filter((entree): entree is string => typeof entree === "string")
    .map((entree) => urlDeLaPhoto(entree))
    .filter((url): url is string => Boolean(url));
}

/**
 * Dépose une photo de galerie, en préférant le mode authentifié.
 *
 * Même garde-fou que pour les médias de conversation : la livraison
 * authentifiée dépend de la configuration du compte Cloudinary, donc on
 * la vérifie au lieu de la supposer. Si elle ne répond pas, la photo est
 * redéposée en accès libre — une photo visible de trop de monde vaut
 * mieux qu'une photo que personne ne voit.
 */
export async function deposerPhotoDeGalerie(
  buffer: Buffer,
  options: {
    transformation?: Record<string, unknown>[];
    moderation?: "aws_rek" | undefined;
  } = {}
): Promise<{
  publicId: string;
  mode: ModeDeLivraison;
  url: string;
  brut: unknown;
}> {
  const deposer = (mode: ModeDeLivraison) =>
    new Promise<{ secure_url: string; public_id: string; moderation?: unknown }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: DOSSIER_GALERIE,
              resource_type: "image",
              type: mode,
              ...(options.transformation
                ? { transformation: options.transformation }
                : {}),
              ...(options.moderation ? { moderation: options.moderation } : {}),
            },
            (err, res) => {
              if (err || !res) {
                reject(err ?? new Error("Cloudinary upload failed"));
              } else {
                resolve(
                  res as {
                    secure_url: string;
                    public_id: string;
                    moderation?: unknown;
                  }
                );
              }
            }
          )
          .end(buffer);
      }
    );

  let mode: ModeDeLivraison = "authenticated";
  let resultat = await deposer(mode);

  const adresse = () =>
    cloudinary.url(resultat.public_id, {
      resource_type: "image",
      type: mode,
      sign_url: mode === "authenticated",
      secure: true,
      analytics: false,
    });

  if (!(await livraisonFonctionne(adresse()))) {
    console.warn(
      "[photos-profil] La livraison authentifiée ne répond pas sur ce compte " +
        "Cloudinary : la photo de galerie est déposée en accès libre."
    );

    await cloudinary.uploader
      .destroy(resultat.public_id, { type: mode, invalidate: true })
      .catch(() => {});

    mode = "upload";
    resultat = await deposer(mode);
  }

  return {
    publicId: resultat.public_id,
    mode,
    url: adresse(),
    brut: resultat,
  };
}
