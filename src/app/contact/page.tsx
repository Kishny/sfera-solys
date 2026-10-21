'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Lock,
  Mail,
  Send,
  ShieldCheck,
} from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Surtitre,
  focusRing,
  premierBloc,
  sectionY,
  type IconeMarque,
} from '@/components/brand/mise-en-page';

/**
 * Page Contact — direction « nuit cuivrée », d'après la maquette.
 *
 * ## Ce qui ne doit surtout pas bouger
 *
 * Le formulaire appelle `POST /api/contact`. Avant la réécriture
 * précédente, son `handleSubmit` attendait 1,2 s puis affichait
 * « Message envoyé ! » sans rien transmettre : tout message écrit par un
 * visiteur était perdu, et le site lui affirmait le contraire. La route
 * existe désormais, les erreurs qu'elle renvoie sont affichées telles
 * quelles, et l'adresse de support reste visible comme voie de secours.
 *
 * ⚠️ Tant que `RESEND_API_KEY` vaut `A_REMPLACER…`, la route répond 503 et
 * la page l'annonce au lieu de faire semblant. Rien ici ne masque cet
 * état.
 *
 * ## Le champ « Sujet » devient une liste
 *
 * La maquette le dessine en menu déroulant (« Choisis un sujet »). La
 * route attend une chaîne de 3 à 120 caractères, sans liste fermée : les
 * options ci-dessous passent donc sa validation telles quelles, et
 * l'objet de l'e-mail reçu reste lisible (`[Contact] <sujet>`).
 *
 * Un intérêt accessoire, mais réel : un sujet choisi dans une liste se
 * trie, là où un champ libre produit autant de formulations que
 * d'expéditeurs.
 *
 * ## L'adresse de support
 *
 * `contact@sferasolys.com` est affichée ici et dans neuf autres fichiers,
 * mais le domaine n'est pas déposé. Tant qu'il ne l'est pas, ni le
 * formulaire ni l'adresse directe ne mènent nulle part — c'est le même
 * préalable que `RESEND_API_KEY`, et il se règle une seule fois.
 */

const ADRESSE_SUPPORT = 'contact@sferasolys.com';

/**
 * Les sujets proposés. Ils reprennent les familles de la FAQ, pour que
 * les demandes arrivent déjà triées selon les mêmes catégories.
 */
const SUJETS = [
  'Ma sphère',
  "Vérification d'identité",
  'Abonnement et paiement',
  'Signalement ou sécurité',
  'Suggestion ou retour',
  'Autre',
];

const reperes: Array<{
  icon: IconeMarque;
  titre: string;
  valeur?: string;
  detail: string;
  lien: string;
  libelleLien: string;
}> = [
  {
    icon: Mail,
    titre: 'Par email',
    valeur: ADRESSE_SUPPORT,
    detail: 'Une question, une remarque ou une suggestion ?',
    lien: `mailto:${ADRESSE_SUPPORT}`,
    libelleLien: 'Écrire directement à l’adresse de support',
  },
  {
    icon: Clock,
    titre: 'Délai de réponse',
    detail:
      'Sous 24 à 48 h, en jours ouvrés. Une demande liée à la sécurité passe devant.',
    lien: '/faq',
    libelleLien: 'Consulter la foire aux questions',
  },
  {
    icon: ShieldCheck,
    titre: 'Signalement',
    detail:
      "Une situation préoccupante ? Les demandes de sécurité sont lues par une personne et traitées en priorité.",
    lien: '/valeurs#principes',
    libelleLien: 'Lire nos principes de modération',
  },
];

type Champs = { nom: string; email: string; sujet: string; message: string };

const CHAMPS_VIDES: Champs = { nom: '', email: '', sujet: '', message: '' };

export default function ContactPage() {
  const [champs, setChamps] = useState<Champs>(CHAMPS_VIDES);
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const modifier =
    (champ: keyof Champs) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      setChamps((precedent) => ({ ...precedent, [champ]: event.target.value }));
    };

  const envoyer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (envoi) return;

    setEnvoi(true);
    setErreur(null);

    try {
      const reponse = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(champs),
      });

      const donnees = await reponse.json().catch(() => ({}));

      if (!reponse.ok) {
        setErreur(
          donnees?.error ??
            `Le message n'a pas pu être envoyé. Écris-nous à ${ADRESSE_SUPPORT}.`
        );
        return;
      }

      setEnvoye(true);
      setChamps(CHAMPS_VIDES);
    } catch {
      setErreur(
        `Connexion impossible. Vérifie ton réseau, ou écris-nous à ${ADRESSE_SUPPORT}.`
      );
    } finally {
      setEnvoi(false);
    }
  };

  const champClasses =
    'w-full rounded-xl border border-champagne/15 bg-nuit/60 px-4 py-3 text-[14px] text-champagne placeholder:text-champagne/60 transition-colors focus:border-cuivre focus:outline-none focus:ring-2 focus:ring-cuivre/25';

  const labelClasses =
    'mb-1.5 block text-[13px] font-semibold text-champagne/90';

  return (
    <>
      <Header />

      <main id="contenu" className="bg-nuit text-champagne">
        {/*
          Héros. Voile vertical sous `lg` : 93 % au milieu, 75 % en haut —
          les valeurs mesurées sur `solys-01` (5,78:1 pour le champagne à
          70 %, 4,67 pour le surtitre à 60 %).
        */}
        <section className="relative isolate overflow-hidden px-4 sm:px-6 lg:px-16">
          <div className="absolute inset-0 -z-20 lg:left-[40%]">
            <Image
              src="/visuels/solys-01.webp"
              alt="Deux hommes en conversation sur une terrasse, la ville illuminée derrière eux."
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover object-[70%_30%]"
            />

            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-nuit via-nuit/93 to-nuit/75 lg:bg-gradient-to-r lg:from-nuit lg:via-nuit/30 lg:to-transparent"
            />

            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-nuit to-transparent"
            />
          </div>

          <div className={`relative mx-auto max-w-7xl pb-12 sm:pb-14 ${premierBloc}`}>
            <div className="max-w-xl">
              <Surtitre>Contact</Surtitre>

              <h1 className="font-display mt-6 text-[34px] font-normal leading-[1.08] tracking-tight text-ivoire sm:text-[48px]">
                Une question&nbsp;?
                <br />
                <span className="italic text-cuivre">Parlons-en.</span>
              </h1>

              <p className="mt-5 text-[16px] font-semibold leading-snug text-champagne sm:text-[18px]">
                Une personne lit, une personne répond.
              </p>

              <p className="mt-3 max-w-md text-[14px] leading-relaxed text-champagne/80 sm:text-[15px]">
                Notre équipe est à ton écoute pour toute question, remarque ou
                suggestion. Nous te répondons sous 24 à 48 h, en jours ouvrés.
              </p>
            </div>
          </div>
        </section>

        {/* Formulaire et repères */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            {/* Le formulaire */}
            <div className="rounded-3xl border border-champagne/12 bg-minuit/80 p-6 sm:p-8">
              {envoye ? (
                <div className="py-8 text-center">
                  <span
                    aria-hidden="true"
                    className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-succes/40 bg-succes/10"
                  >
                    <CheckCircle2 size={24} className="text-succes" />
                  </span>

                  <h2 className="font-display mt-5 text-[24px] font-normal text-ivoire">
                    Message transmis
                  </h2>

                  <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-champagne/75">
                    Il est arrivé à {ADRESSE_SUPPORT}. On revient vers toi sous
                    24 à 48 h.
                  </p>

                  <button
                    type="button"
                    onClick={() => setEnvoye(false)}
                    className={`mt-7 rounded-xl border border-champagne/25 px-5 py-2.5 text-[13px] font-semibold text-champagne transition-colors hover:border-champagne/50 ${focusRing}`}
                  >
                    Écrire un autre message
                  </button>
                </div>
              ) : (
                <>
                  <Surtitre>Envoie-nous un message</Surtitre>

                  <h2 className="font-display mt-5 text-[28px] font-normal leading-tight text-ivoire sm:text-[32px]">
                    Formulaire de contact
                  </h2>

                  <form onSubmit={envoyer} className="mt-7 space-y-4" noValidate>
                    <div>
                      <label htmlFor="contact-nom" className={labelClasses}>
                        Ton nom <span className="text-cuivre">*</span>
                      </label>
                      <input
                        id="contact-nom"
                        name="nom"
                        type="text"
                        required
                        minLength={2}
                        maxLength={80}
                        value={champs.nom}
                        onChange={modifier('nom')}
                        placeholder="Ton nom"
                        className={champClasses}
                      />
                    </div>

                    <div>
                      <label htmlFor="contact-email" className={labelClasses}>
                        Ton email <span className="text-cuivre">*</span>
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        required
                        value={champs.email}
                        onChange={modifier('email')}
                        placeholder="Ton email"
                        className={champClasses}
                      />
                    </div>

                    <div>
                      <label htmlFor="contact-sujet" className={labelClasses}>
                        Sujet <span className="text-cuivre">*</span>
                      </label>

                      {/*
                        `text-champagne/60` sur l'option vide : elle sert de
                        placeholder, et un placeholder qui se lit comme une
                        valeur choisie induit en erreur. `required` empêche
                        de la soumettre.
                      */}
                      <select
                        id="contact-sujet"
                        name="sujet"
                        required
                        value={champs.sujet}
                        onChange={modifier('sujet')}
                        className={`${champClasses} appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10 ${
                          champs.sujet ? '' : 'text-champagne/60'
                        }`}
                        style={{
                          backgroundImage:
                            "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23EAD9BD' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                        }}
                      >
                        <option value="" disabled>
                          Choisis un sujet
                        </option>

                        {SUJETS.map((sujet) => (
                          <option key={sujet} value={sujet} className="bg-minuit">
                            {sujet}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="contact-message" className={labelClasses}>
                        Ton message <span className="text-cuivre">*</span>
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        required
                        minLength={10}
                        maxLength={4000}
                        rows={6}
                        value={champs.message}
                        onChange={modifier('message')}
                        placeholder="Écris ton message ici…"
                        className={`${champClasses} resize-y`}
                      />
                    </div>

                    {/*
                      `role="alert"` fait lire l'erreur dès son apparition,
                      sans déplacer le focus. La teinte vient de la charte
                      (`erreur`), pas de la palette Tailwind par défaut.
                    */}
                    {erreur && (
                      <p
                        role="alert"
                        className="flex items-start gap-2 rounded-xl border border-erreur/50 bg-erreur/20 px-4 py-3 text-[13px] leading-relaxed text-champagne"
                      >
                        <AlertCircle
                          size={15}
                          className="mt-0.5 shrink-0"
                          aria-hidden="true"
                        />
                        {erreur}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={envoi}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl bg-degrade-cuivre px-7 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
                    >
                      {!envoi && <Send size={16} aria-hidden="true" />}
                      {envoi ? 'Envoi en cours…' : 'Envoyer le message'}
                    </button>

                    <p className="flex items-center justify-center gap-2 text-[12px] leading-relaxed text-champagne/70">
                      <Lock size={13} aria-hidden="true" className="shrink-0" />
                      Ton adresse sert uniquement à te répondre, sans ajout à
                      une liste de diffusion.
                    </p>
                  </form>
                </>
              )}
            </div>

            {/* Les repères */}
            <div className="space-y-4">
              {reperes.map(
                ({ icon: Icone, titre, valeur, detail, lien, libelleLien }) => {
                  const externe = lien.startsWith('mailto:');

                  const contenu = (
                    <ArrowRight size={16} aria-hidden="true" />
                  );

                  const classesLien = `flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cuivre/45 text-cuivre transition-colors hover:border-cuivre hover:bg-cuivre/10 ${focusRing}`;

                  return (
                    <div
                      key={titre}
                      className="flex items-center gap-4 rounded-2xl border border-champagne/12 bg-minuit/80 p-5 sm:p-6"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-cuivre/40 bg-nuit/60 text-cuivre"
                      >
                        <Icone size={20} />
                      </span>

                      <div className="min-w-0 flex-1">
                        <h2 className="font-display text-[19px] font-normal leading-snug text-ivoire">
                          {titre}
                        </h2>

                        <p className="mt-1.5 text-[12.5px] leading-relaxed text-champagne/75">
                          {detail}
                        </p>

                        {valeur && (
                          <p className="mt-2 break-words text-[13px] font-semibold text-cuivre">
                            {valeur}
                          </p>
                        )}
                      </div>

                      {externe ? (
                        <a href={lien} className={classesLien}>
                          <span className="sr-only">{libelleLien}</span>
                          {contenu}
                        </a>
                      ) : (
                        <Link href={lien} className={classesLien}>
                          <span className="sr-only">{libelleLien}</span>
                          {contenu}
                        </Link>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/*
          Renvoi vers la FAQ. Voile mesuré sur `solys-11` dans les 45 % de
          gauche : 6,41:1 pour le champagne à 70 %, 5,09 pour le surtitre.
        */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-3xl border border-champagne/12">
            <Image
              src="/visuels/solys-11.webp"
              alt=""
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="-z-10 object-cover object-center"
            />

            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(10,13,18,0.92)_0%,rgba(10,13,18,0.88)_45%,rgba(10,13,18,0.55)_70%,rgba(10,13,18,0.15)_100%)]"
            />

            <div className="p-7 sm:p-9 lg:p-10">
              <Surtitre>Questions fréquentes</Surtitre>

              <h2 className="font-display mt-5 max-w-md text-[24px] font-normal leading-tight text-ivoire sm:text-[30px]">
                Une réponse existe
                <br />
                peut-être déjà.
              </h2>

              <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-champagne/80">
                Consulte la FAQ pour trouver rapidement une réponse aux
                questions les plus courantes.
              </p>

              <Link
                href="/faq"
                className={`mt-6 inline-flex items-center gap-2 rounded-xl border border-cuivre/55 bg-cuivre/10 px-6 py-3 text-sm font-bold text-champagne transition-colors hover:bg-cuivre/20 ${focusRing}`}
              >
                Consulter la FAQ
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/*
          Appel à l'action, pleine largeur. Voile mesuré sur `solys-03` :
          5,95:1 pour le champagne à 70 % dans la zone de texte.
        */}
        <div className="relative isolate overflow-hidden">
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <Image
              src="/visuels/solys-03.webp"
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-[70%_40%]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(10,13,18,0.92)_0%,rgba(10,13,18,0.88)_45%,rgba(10,13,18,0.55)_70%,rgba(10,13,18,0.15)_100%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-nuit via-transparent to-nuit/60" />
          </div>

          <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-16">
            <div className="mx-auto max-w-7xl">
              <Surtitre>Rejoins la communauté</Surtitre>

              <h2 className="font-display mt-5 text-[28px] font-normal leading-tight text-ivoire sm:text-[36px]">
                Découvre Sfera&rsquo;Solys.
              </h2>

              <p className="mt-4 max-w-md text-[14px] leading-relaxed text-champagne/80">
                Des rencontres authentiques, dans un cadre sûr et respectueux.
              </p>

              <Link
                href="/commencer"
                className={`mt-7 inline-flex items-center gap-2 rounded-xl bg-degrade-cuivre px-7 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
              >
                Créer mon profil
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
