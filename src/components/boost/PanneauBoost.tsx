'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  EyeOff,
  Gift,
  Rocket,
  Timer,
  TriangleAlert,
} from 'lucide-react';

import { libelleTypeBoost } from '@/lib/boosts-formules';

/**
 * Panneau de boost de visibilité.
 *
 * ## Ce qu'il rend visible
 *
 * Les boosts étaient vendus dans les offres sans qu'aucun écran ne permette
 * d'en lancer un, et sans qu'aucun classement les lise. Ce panneau est le seul
 * endroit du site où un membre déclenche un boost.
 *
 * Il affiche désormais ce que **sa** formule vaut, et non une durée écrite en
 * dur : les offres ne se distinguaient que par le nombre de boosts, elles se
 * distinguent maintenant par la durée, la force, le type et la possibilité de
 * choisir l'heure. Tout cela vient du serveur, dans `formule` — le panneau
 * n'en décide rien et ne duplique aucun seuil.
 *
 * ## Le décompte
 *
 * La date de fin vient du serveur ; le décompte est recalculé côté client à
 * partir d'elle, pas à partir d'un compteur qu'on décrémente. Un onglet mis en
 * veille, une horloge qui saute, un retour de mise en veille : l'affichage
 * reste juste. Quand la fenêtre se termine, on relit l'état au serveur au lieu
 * de supposer.
 *
 * Un boost programmé n'a pas encore de fin à décompter : on compte alors vers
 * son **début**, et l'étiquette le dit, pour qu'un membre ne croie pas que sa
 * mise en avant est déjà en train de s'écouler.
 *
 * ## Pourquoi aucun import de `@/lib/boosts`
 *
 * Ce fichier tournerait dans le navigateur avec Mongoose et les modèles dans
 * son paquet. Les règles arrivent donc en données — `formule`, `prioritaire`,
 * `horizonJours` — et jamais en constantes recopiées.
 *
 * `@/lib/boosts-formules` est la seule exception, et c'est pour cela qu'il
 * existe : des données et des fonctions pures, sans Mongoose. Le libellé de la
 * mise en avant en vient, pour qu'il soit le même mot ici, sur la carte du
 * profil et sur la page des tarifs.
 *
 * ## Le Mode Fantôme
 *
 * Un profil fantôme n'est pas dans l'annuaire : la requête n'y garde que les
 * visibilités `public` et `premium`. Un boost l'y classerait en tête d'une
 * liste où il ne figure pas — autant dire rien, pour un boost consommé.
 *
 * Le serveur refusait déjà. Le panneau, lui, affichait quand même un bouton
 * « Lancer un boost » et laissait découvrir le refus après le clic. Il montre
 * maintenant l'état avant, et le chemin pour en sortir : un bouton garanti
 * perdant ne devrait pas s'offrir.
 */

type Quota = {
  limite: number;
  utilises: number;
  restants: number;
  /** Le boost offert une fois par compte est-il encore disponible ? */
  decouverteDisponible: boolean;
};

type Formule = {
  type: string;
  dureeMinutes: number;
  force: number;
  programmable: boolean;
};

type BoostEnVol = {
  id: string;
  type: string;
  multiplier: number;
  startsAt: string;
  endsAt: string;
  commence: boolean;
  secondesAvantDebut: number;
  secondesRestantes: number;
};

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70 focus-visible:ring-offset-2 focus-visible:ring-offset-nuit';

/** `mm:ss` à partir d'un nombre de secondes. */
function formaterDuree(secondes: number): string {
  const total = Math.max(0, Math.floor(secondes));
  const minutes = Math.floor(total / 60);
  const reste = total % 60;

  return `${String(minutes).padStart(2, '0')}:${String(reste).padStart(2, '0')}`;
}

/** `YYYY-MM-DDTHH:mm` en heure locale, le format d'un `datetime-local`. */
function pourChampLocal(date: Date): string {
  const deuxChiffres = (valeur: number) => String(valeur).padStart(2, '0');

  return (
    `${date.getFullYear()}-${deuxChiffres(date.getMonth() + 1)}` +
    `-${deuxChiffres(date.getDate())}T${deuxChiffres(date.getHours())}` +
    `:${deuxChiffres(date.getMinutes())}`
  );
}

/** « vendredi 30 octobre à 20:30 » */
function formaterMoment(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

export default function PanneauBoost({
  onBoostLance,
}: {
  /** Appelé après un boost lancé, pour que la page relise son classement. */
  onBoostLance?: () => void;
}) {
  const [boost, setBoost] = useState<BoostEnVol | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [formule, setFormule] = useState<Formule | null>(null);
  const [prioritaire, setPrioritaire] = useState(false);
  const [fantome, setFantome] = useState(false);
  const [horizonJours, setHorizonJours] = useState(7);
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [annulation, setAnnulation] = useState(false);
  const [erreur, setErreur] = useState('');
  const [secondes, setSecondes] = useState(0);

  /** Le membre a-t-il ouvert le choix de l'heure ? */
  const [programmer, setProgrammer] = useState(false);
  const [heureChoisie, setHeureChoisie] = useState('');

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
        setFormule(null);
        return;
      }

      setBoost(donnees.boost ?? null);
      setQuota(donnees.quota ?? null);
      setFormule(donnees.formule ?? null);
      setPrioritaire(donnees.prioritaire === true);
      setFantome(donnees.fantome === true);
      setHorizonJours(donnees.horizonJours ?? 7);
    } catch {
      if (monte.current) {
        setQuota(null);
        setBoost(null);
        setFormule(null);
      }
    } finally {
      if (monte.current) setChargement(false);
    }
  }, []);

  useEffect(() => {
    void lireEtat();
  }, [lireEtat]);

  /**
   * Décompte recalculé depuis la date du serveur, jamais décrémenté à
   * l'aveugle. Vers le début quand le boost est programmé, vers la fin quand
   * il a commencé. À l'échéance de l'un comme de l'autre, on relit l'état.
   */
  useEffect(() => {
    if (!boost) {
      setSecondes(0);
      return;
    }

    const cible = new Date(
      boost.commence ? boost.endsAt : boost.startsAt
    ).getTime();

    const rafraichir = () => {
      const restant = Math.max(0, Math.round((cible - Date.now()) / 1000));
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
      /**
       * Le champ donne une heure locale sans fuseau ; `new Date` la lit dans
       * le fuseau du navigateur, et on envoie l'instant en ISO. Le serveur
       * revalide de toute façon : l'offre, l'horizon et le passé.
       */
      const startsAt =
        programmer && heureChoisie
          ? new Date(heureChoisie).toISOString()
          : undefined;

      const reponse = await fetch('/api/boosts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(startsAt ? { startsAt } : {}),
      });

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

      setProgrammer(false);
      setHeureChoisie('');

      onBoostLance?.();
    } catch {
      setErreur('Connexion interrompue. Réessaie dans un instant.');
    } finally {
      if (monte.current) setEnvoi(false);
    }
  };

  const annuler = async () => {
    setAnnulation(true);
    setErreur('');

    try {
      const reponse = await fetch('/api/boosts', { method: 'DELETE' });
      const donnees = await reponse.json();

      if (!reponse.ok || donnees?.success !== true) {
        setErreur(donnees?.error || 'Le boost n’a pas pu être annulé.');

        if (donnees?.boost) setBoost(donnees.boost);

        return;
      }

      setBoost(null);
      if (donnees.quota) setQuota(donnees.quota);
    } catch {
      setErreur('Connexion interrompue. Réessaie dans un instant.');
    } finally {
      if (monte.current) setAnnulation(false);
    }
  };

  // Rien à afficher tant qu'on ne sait pas, ni si le membre n'est pas lisible.
  if (chargement || !quota || !formule) return null;

  const enCours = boost !== null && boost.commence && secondes > 0;
  const programme = boost !== null && !boost.commence;

  const progression = enCours
    ? Math.min(
        100,
        Math.max(0, (1 - secondes / (formule.dureeMinutes * 60)) * 100)
      )
    : 0;

  const maintenant = new Date();
  const horizon = new Date(
    maintenant.getTime() + horizonJours * 24 * 60 * 60 * 1000
  );

  /**
   * Ce que le panneau raconte, selon l'état.
   *
   * Sorti du rendu parce que la chaîne de conditions était arrivée à quatre
   * niveaux de ternaires imbriqués dans le JSX : correcte, et illisible. Une
   * suite de `if` se relit, et surtout se corrige sans compter les
   * parenthèses.
   */
  const phraseEtat = (() => {
    if (fantome && !enCours && !programme) {
      return (
        'Le Mode Fantôme te retire de l’annuaire. Un boost t’y remonterait en ' +
        'tête d’une liste où tu n’apparais pas : il serait consommé pour rien, ' +
        'alors il est mis en pause.'
      );
    }

    if (enCours) {
      return (
        `Ton profil passe devant les autres dans Explorer, signalé ` +
        `« ${libelleTypeBoost(formule.type)} », pendant toute la durée du boost.`
      );
    }

    if (programme && boost) {
      return (
        `Ton boost démarre ${formaterMoment(boost.startsAt)}, ` +
        `pour ${formule.dureeMinutes} minutes.`
      );
    }

    return (
      `Pendant ${formule.dureeMinutes} minutes, ton profil remonte en tête ` +
      `d’Explorer pour les membres qui peuvent te voir, signalé ` +
      `« ${libelleTypeBoost(formule.type)} ».`
    );
  })();

  /** Ce qu'il reste, et pourquoi. */
  const phraseQuota = (() => {
    if (fantome && !enCours && !programme) {
      // Le Mode Fantôme ne consomme rien : le dire évite de laisser croire
      // qu'on perd ses boosts en se rendant invisible.
      return quota.restants > 0
        ? `Tes ${quota.restants} boost${quota.restants > 1 ? 's' : ''} restants ` +
            't’attendent : rien n’est perdu, ils repartent dès que ton profil ' +
            'est visible.'
        : 'Tes boosts t’attendent : rien n’est perdu.';
    }

    if (quota.restants > 0) {
      const s = quota.restants > 1 ? 's' : '';

      return `${quota.restants} boost${s} sur ${quota.limite} restant${s} ce mois-ci.`;
    }

    if (quota.decouverteDisponible) {
      return (
        'Ton boost de découverte est disponible : offert une fois, pour voir ' +
        'ce que ça change.'
      );
    }

    if (quota.limite <= 0) {
      return (
        'Ton offre actuelle ne comprend pas de boost, et ton boost de ' +
        'découverte est utilisé.'
      );
    }

    return (
      `Tes ${quota.limite} boost${quota.limite > 1 ? 's' : ''} du mois sont ` +
      'utilisés. Le compteur repart le 1er.'
    );
  })();

  const surCredit = quota.restants <= 0 && quota.decouverteDisponible;
  const aUnBoost =
    !fantome && (quota.restants > 0 || quota.decouverteDisponible);

  return (
    <section
      aria-labelledby="titre-boost"
      className="mb-3 rounded-2xl border border-champagne/10 bg-minuit p-4 sm:mb-5 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2
            id="titre-boost"
            className="font-display flex items-center gap-2 text-[15px] font-bold text-champagne"
          >
            <Rocket
              size={16}
              className={enCours ? 'text-succes' : 'text-cuivre'}
              aria-hidden="true"
            />
            Boost de visibilité
          </h2>

          <p className="mt-1 max-w-md text-[13px] leading-relaxed text-champagne/60">
            {phraseEtat}
          </p>

          {!enCours && !programme && !fantome && prioritaire && (
            <p className="mt-1.5 max-w-md text-[12px] leading-relaxed text-cuivre">
              Ton offre te place devant les boosts des offres inférieures quand
              plusieurs membres sont mis en avant en même temps.
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {enCours ? (
            <p
              className="flex items-center gap-2 rounded-xl bg-succes/15 px-3.5 py-2.5 text-[13px] font-bold text-succes"
              role="timer"
              aria-live="off"
            >
              <Timer size={15} aria-hidden="true" />
              <span className="tabular-nums">{formaterDuree(secondes)}</span>
              <span className="sr-only">restantes</span>
            </p>
          ) : programme ? (
            <>
              <p className="flex items-center gap-2 rounded-xl bg-cuivre/15 px-3.5 py-2.5 text-[13px] font-bold text-cuivre">
                <CalendarClock size={15} aria-hidden="true" />
                Programmé
              </p>

              <button
                type="button"
                onClick={annuler}
                disabled={annulation}
                className={`inline-flex items-center justify-center rounded-xl border border-champagne/25 px-4 py-2.5 text-[13px] font-bold text-champagne/80 transition-colors hover:bg-champagne/10 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
              >
                {annulation ? 'Annulation…' : 'Annuler'}
              </button>
            </>
          ) : fantome ? (
            <Link
              href="/mon-compte?tab=preferences"
              className={`inline-flex items-center justify-center gap-2 rounded-xl border border-cuivre/40 px-4 py-2.5 text-[13px] font-bold text-champagne transition-colors hover:bg-cuivre/10 ${focusRing}`}
            >
              <EyeOff size={15} aria-hidden="true" />
              Changer ma visibilité
            </Link>
          ) : !aUnBoost ? (
            <Link
              href="/tarifs"
              className={`inline-flex items-center justify-center rounded-xl border border-cuivre/40 px-4 py-2.5 text-[13px] font-bold text-champagne transition-colors hover:bg-cuivre/10 ${focusRing}`}
            >
              Voir les offres
            </Link>
          ) : (
            <button
              type="button"
              onClick={lancer}
              disabled={envoi || (programmer && !heureChoisie)}
              className={`inline-flex items-center justify-center rounded-xl bg-cuivre px-4 py-2.5 text-[13px] font-bold text-nuit transition-colors hover:bg-cuivre/90 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
            >
              {envoi
                ? 'Lancement…'
                : programmer
                  ? 'Programmer'
                  : 'Lancer un boost'}
            </button>
          )}
        </div>
      </div>

      {enCours && (
        <div
          className="mt-4 h-1 overflow-hidden rounded-full bg-champagne/10"
          role="presentation"
        >
          <div
            className="h-full rounded-full bg-succes transition-[width] duration-1000 ease-linear"
            style={{ width: `${progression}%` }}
          />
        </div>
      )}

      {programme && (
        <p className="mt-3 text-[12px] text-champagne/60" aria-live="polite">
          Démarrage dans{' '}
          <span className="tabular-nums font-bold text-champagne/80">
            {formaterDuree(secondes)}
          </span>
          . Tu peux encore l’annuler : rien n’est consommé avant qu’il commence.
        </p>
      )}

      {/* ─────────────────────────────
          Choisir l'heure
          Réservé aux offres dont la formule le permet. Le serveur revérifie :
          l'absence du bloc n'est pas une protection.
      ───────────────────────────── */}
      {!enCours && !programme && aUnBoost && formule.programmable && (
        <div className="mt-4 border-t border-champagne/10 pt-4">
          <label
            className={`inline-flex cursor-pointer items-center gap-2 text-[13px] text-champagne/80 ${focusRing}`}
          >
            <input
              type="checkbox"
              checked={programmer}
              onChange={(evenement) => setProgrammer(evenement.target.checked)}
              className="h-4 w-4 rounded border-champagne/30 bg-nuit text-cuivre accent-cuivre"
            />
            Choisir l’heure plutôt que démarrer maintenant
          </label>

          {programmer && (
            <div className="mt-3">
              <label
                htmlFor="heure-boost"
                className="block text-[12px] font-bold text-champagne/70"
              >
                Démarrage du boost
              </label>

              <input
                id="heure-boost"
                type="datetime-local"
                value={heureChoisie}
                min={pourChampLocal(maintenant)}
                max={pourChampLocal(horizon)}
                onChange={(evenement) => setHeureChoisie(evenement.target.value)}
                className={`mt-1.5 w-full max-w-xs rounded-xl border border-champagne/20 bg-nuit px-3 py-2.5 text-[13px] text-champagne ${focusRing}`}
              />

              <p className="mt-1.5 text-[12px] text-champagne/50">
                Jusqu’à {horizonJours} jours à l’avance. Un boost placé à une
                heure creuse ne vaut pas grand-chose : vise un moment où les
                membres sont là.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────
          Ce qu'il reste
      ───────────────────────────── */}
      <p
        className="mt-3 flex items-start gap-2 text-[12px] text-champagne/60"
        aria-live="polite"
      >
        {surCredit && !enCours && !programme && (
          <Gift size={14} className="mt-0.5 shrink-0 text-cuivre" aria-hidden="true" />
        )}

        <span>{phraseQuota}</span>
      </p>

      {erreur && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-cuivre/30 bg-cuivre/10 px-3.5 py-2.5 text-[12px] leading-relaxed text-champagne/80">
          <TriangleAlert
            size={14}
            className="mt-0.5 shrink-0 text-cuivre"
            aria-hidden="true"
          />
          {erreur}
        </p>
      )}
    </section>
  );
}
