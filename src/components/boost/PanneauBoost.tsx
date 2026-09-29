'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Rocket, Timer, TriangleAlert } from 'lucide-react';

/**
 * Panneau de boost de visibilité.
 *
 * ## Ce qu'il rend enfin visible
 *
 * Les boosts étaient vendus dans les offres (1, 3 ou 10 par mois selon la
 * formule) sans qu'aucun écran ne permette d'en lancer un, et sans qu'aucun
 * classement les lise. Ce panneau est le seul endroit du site où un membre
 * déclenche un boost, et il affiche trois choses que l'ancienne interface
 * taisait : combien il en reste ce mois-ci, combien de temps le boost en cours
 * durera encore, et ce que le boost fait exactement.
 *
 * ## Le décompte
 *
 * La date de fin vient du serveur ; le décompte est recalculé côté client à
 * partir d'elle, pas à partir d'un compteur qu'on décrémente. Un onglet mis en
 * veille, une horloge qui saute, un retour de mise en veille : l'affichage
 * reste juste. Quand la fenêtre se termine, on relit l'état au serveur au lieu
 * de supposer.
 *
 * ## Couleurs
 *
 * Le panneau est déjà en palette Sfera'Solys (orange pour l'action, lime pour
 * l'état validé) alors qu'Explorer est encore sur l'identité héritée. C'est
 * assumé : cette page est le prochain chantier de migration, et le panneau n'a
 * pas à être repeint deux fois.
 */

type Quota = {
  limite: number;
  utilises: number;
  restants: number;
};

type BoostActif = {
  id: string;
  type: string;
  multiplier: number;
  startsAt: string;
  endsAt: string;
  secondesRestantes: number;
};

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss';

/** `mm:ss` à partir d'un nombre de secondes. */
function formaterDuree(secondes: number): string {
  const total = Math.max(0, Math.floor(secondes));
  const minutes = Math.floor(total / 60);
  const reste = total % 60;

  return `${String(minutes).padStart(2, '0')}:${String(reste).padStart(2, '0')}`;
}

export default function PanneauBoost({
  onBoostLance,
}: {
  /** Appelé après un boost lancé, pour que la page relise son classement. */
  onBoostLance?: () => void;
}) {
  const [boost, setBoost] = useState<BoostActif | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [dureeMinutes, setDureeMinutes] = useState(30);
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [secondes, setSecondes] = useState(0);

  /** Évite un setState après démontage. */
  const monte = useRef(true);

  useEffect(() => {
    monte.current = true;
    return () => {
      monte.current = false;
    };
  }, []);

  const lireEtat = useCallback(async () => {
    try {
      const reponse = await fetch('/api/boosts', { cache: 'no-store' });
      const donnees = await reponse.json();

      if (!monte.current) return;

      if (!reponse.ok || donnees?.success !== true) {
        // Un membre non connecté ou une erreur serveur : le panneau se retire.
        setQuota(null);
        setBoost(null);
        return;
      }

      setBoost(donnees.boost ?? null);
      setQuota(donnees.quota ?? null);
      setDureeMinutes(donnees.dureeMinutes ?? 30);
    } catch {
      if (monte.current) {
        setQuota(null);
        setBoost(null);
      }
    } finally {
      if (monte.current) setChargement(false);
    }
  }, []);

  useEffect(() => {
    void lireEtat();
  }, [lireEtat]);

  /**
   * Décompte recalculé depuis `endsAt`, jamais décrémenté à l'aveugle.
   * À l'échéance, on relit l'état côté serveur.
   */
  useEffect(() => {
    if (!boost) {
      setSecondes(0);
      return;
    }

    const fin = new Date(boost.endsAt).getTime();

    const rafraichir = () => {
      const restant = Math.max(0, Math.round((fin - Date.now()) / 1000));
      setSecondes(restant);

      if (restant === 0) void lireEtat();
    };

    rafraichir();
    const minuteur = window.setInterval(rafraichir, 1000);

    return () => window.clearInterval(minuteur);
  }, [boost, lireEtat]);

  const lancer = async () => {
    setEnvoi(true);
    setErreur('');

    try {
      const reponse = await fetch('/api/boosts', { method: 'POST' });
      const donnees = await reponse.json();

      if (!reponse.ok || donnees?.success !== true) {
        setErreur(donnees?.error || 'Le boost n’a pas pu être lancé.');

        // Le serveur renvoie l'état à jour même en cas de refus : on le prend.
        if (donnees?.quota) setQuota(donnees.quota);
        if (donnees?.boost) setBoost(donnees.boost);

        return;
      }

      setBoost(donnees.boost ?? null);
      if (donnees.quota) setQuota(donnees.quota);

      onBoostLance?.();
    } catch {
      setErreur('Connexion interrompue. Réessaie dans un instant.');
    } finally {
      if (monte.current) setEnvoi(false);
    }
  };

  // Rien à afficher tant qu'on ne sait pas, ni si le membre n'est pas lisible.
  if (chargement || !quota) return null;

  const actif = boost !== null && secondes > 0;
  const progression = actif
    ? Math.min(100, Math.max(0, (1 - secondes / (dureeMinutes * 60)) * 100))
    : 0;

  return (
    <section
      aria-labelledby="titre-boost"
      className="mb-3 rounded-2xl border border-cream/10 bg-[#123243] p-4 sm:mb-5 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2
            id="titre-boost"
            className="font-display [font-stretch:125%] flex items-center gap-2 text-[15px] font-bold text-cream"
          >
            <Rocket
              size={16}
              className={actif ? 'text-lime' : 'text-orange'}
              aria-hidden="true"
            />
            Boost de visibilité
          </h2>

          <p className="mt-1 max-w-md text-[13px] leading-relaxed text-cream/60">
            {actif
              ? 'Ton profil passe devant les autres dans Explorer pendant toute la durée du boost.'
              : `Pendant ${dureeMinutes} minutes, ton profil remonte en tête d’Explorer pour les membres qui peuvent te voir.`}
          </p>
        </div>

        <div className="shrink-0">
          {actif ? (
            <p
              className="flex items-center gap-2 rounded-xl bg-lime/15 px-3.5 py-2.5 text-[13px] font-bold text-lime"
              role="timer"
              aria-live="off"
            >
              <Timer size={15} aria-hidden="true" />
              <span className="tabular-nums">{formaterDuree(secondes)}</span>
              <span className="sr-only">restantes</span>
            </p>
          ) : quota.limite <= 0 ? (
            <Link
              href="/tarifs"
              className={`inline-flex items-center justify-center rounded-xl border border-orange/40 px-4 py-2.5 text-[13px] font-bold text-cream transition-colors hover:bg-orange/10 ${focusRing}`}
            >
              Voir les offres
            </Link>
          ) : (
            <button
              type="button"
              onClick={lancer}
              disabled={envoi || quota.restants <= 0}
              className={`inline-flex items-center justify-center rounded-xl bg-orange px-4 py-2.5 text-[13px] font-bold text-abyss transition-colors hover:bg-orange/90 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
            >
              {envoi ? 'Lancement…' : 'Lancer un boost'}
            </button>
          )}
        </div>
      </div>

      {actif && (
        <div
          className="mt-4 h-1 overflow-hidden rounded-full bg-cream/10"
          role="presentation"
        >
          <div
            className="h-full rounded-full bg-lime transition-[width] duration-1000 ease-linear"
            style={{ width: `${progression}%` }}
          />
        </div>
      )}

      <p className="mt-3 text-[12px] text-cream/60" aria-live="polite">
        {quota.limite <= 0
          ? 'Ton offre actuelle ne comprend pas de boost. Les offres payantes en incluent 1, 3 ou 10 par mois.'
          : quota.restants > 0
            ? `${quota.restants} boost${quota.restants > 1 ? 's' : ''} sur ${quota.limite} restant${quota.restants > 1 ? 's' : ''} ce mois-ci.`
            : `Tes ${quota.limite} boost${quota.limite > 1 ? 's' : ''} du mois sont utilisés. Le compteur repart le 1er.`}
      </p>

      {erreur && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-orange/30 bg-orange/10 px-3.5 py-2.5 text-[12px] leading-relaxed text-cream/80">
          <TriangleAlert
            size={14}
            className="mt-0.5 shrink-0 text-orange"
            aria-hidden="true"
          />
          {erreur}
        </p>
      )}
    </section>
  );
}
