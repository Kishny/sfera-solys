/**
 * POST /api/geo/inverse
 *
 * Transforme des coordonnées en un nom de quartier.
 *
 * LE PARTI PRIS DE PRÉCISION
 * Les coordonnées sont arrondies à deux décimales — environ un
 * kilomètre — avant d'être utilisées, et ce sont les coordonnées
 * arrondies qui sont renvoyées puis stockées. Sur un site de rencontre,
 * une position au mètre près est une adresse de domicile, et on ne
 * confie pas son adresse en appuyant sur un bouton. Ce qui est partagé,
 * c'est un quartier.
 *
 * L'arrondi se fait ici et non côté client : un client peut mentir, et
 * ce qui protège l'utilisateur ne doit pas dépendre de son navigateur.
 *
 * LE FOURNISSEUR
 * Nominatim (OpenStreetMap), sans clé ni compte. Sa politique d'usage
 * demande un `User-Agent` identifiable et un volume raisonnable ; les
 * deux sont respectés. Si le service ne répond pas, on renvoie un
 * libellé neutre plutôt qu'une erreur : partager « quelque part près
 * d'ici » vaut mieux que de ne rien pouvoir partager.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/** Deux décimales : ~1,1 km à l'équateur, moins encore en latitude. */
function arrondir(valeur: number): number {
  return Math.round(valeur * 100) / 100;
}

const LIBELLE_PAR_DEFAUT = 'Position approximative';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 });
  }

  let body: { lat?: unknown; lng?: unknown } | null = null;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Requête invalide.' }, { status: 400 });
  }

  const lat = Number(body?.lat);
  const lng = Number(body?.lng);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return NextResponse.json(
      { success: false, error: 'Coordonnées invalides.' },
      { status: 400 }
    );
  }

  const latArrondie = arrondir(lat);
  const lngArrondie = arrondir(lng);

  let libelle = LIBELLE_PAR_DEFAUT;

  try {
    const adresse = new URL('https://nominatim.openstreetmap.org/reverse');
    adresse.searchParams.set('format', 'jsonv2');
    adresse.searchParams.set('lat', String(latArrondie));
    adresse.searchParams.set('lon', String(lngArrondie));
    // zoom 14 ≈ quartier / arrondissement. Plus fin donnerait une rue.
    adresse.searchParams.set('zoom', '14');
    adresse.searchParams.set('accept-language', 'fr');

    const reponse = await fetch(adresse, {
      headers: {
        // La politique de Nominatim demande une identification claire.
        'User-Agent': "Sfera'Solys (https://sferasolys.com)",
      },
      // Le partage de lieu ne doit pas faire attendre : au-delà, on
      // renvoie le libellé neutre.
      signal: AbortSignal.timeout(4000),
    });

    if (reponse.ok) {
      const donnees = (await reponse.json()) as {
        address?: Record<string, string>;
        name?: string;
      };

      const a = donnees.address ?? {};

      /**
       * Du plus parlant au plus large.
       *
       * On ne prend jamais `road` ni `house_number` : ce serait rendre
       * précis ce qu'on vient volontairement de flouter.
       */
      const quartier =
        a.suburb ??
        a.city_district ??
        a.neighbourhood ??
        a.borough ??
        a.village ??
        a.town ??
        null;

      const ville = a.city ?? a.town ?? a.municipality ?? a.village ?? null;
      const departement = a.county ?? a.state ?? null;

      const morceaux = [quartier, ville, departement]
        .filter((m): m is string => Boolean(m))
        // Un même nom peut revenir deux fois (« Paris, Paris »).
        .filter((m, i, liste) => liste.indexOf(m) === i)
        .slice(0, 2);

      if (morceaux.length > 0) libelle = morceaux.join(', ');
    }
  } catch {
    // Nominatim indisponible, lent, ou format inattendu : le libellé
    // neutre fait le travail.
  }

  return NextResponse.json({
    success: true,
    lieu: {
      libelle,
      lat: latArrondie,
      lng: lngArrondie,
    },
  });
}
