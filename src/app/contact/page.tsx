'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, Mail, ShieldCheck } from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

/**
 * Page Contact — direction A (« dossier de vérification »).
 *
 * ## Le défaut corrigé ici
 *
 * L'ancienne page **ne transmettait rien**. Son `handleSubmit` attendait
 * 1,2 s puis affichait « Message envoyé ! 🎉 », avec en commentaire « à
 * remplacer par un vrai fetch plus tard ». Tout message écrit par un
 * visiteur était perdu, et le site lui affirmait le contraire — le genre de
 * défaut qui ne se voit ni à l'œil ni à la compilation.
 *
 * Le formulaire appelle maintenant `POST /api/contact` (route créée pour
 * l'occasion), affiche les vraies erreurs renvoyées, et garde l'adresse de
 * support visible en permanence comme voie de secours.
 *
 * ⚠️ Tant que `RESEND_API_KEY` est un placeholder, la route répond 503 et la
 * page l'annonce clairement au lieu de faire semblant.
 */

/** Anneau de focus commun à toutes les pages migrées. */
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss';

const ADRESSE_SUPPORT = 'contact@sferasolys.com';

const reperes = [
  {
    icon: Mail,
    titre: 'Par email',
    valeur: ADRESSE_SUPPORT,
    detail: "Le formulaire arrive à la même adresse. Écris-nous directement si tu préfères.",
  },
  {
    icon: Clock,
    titre: 'Délai de réponse',
    valeur: 'Sous 24 à 48 h',
    detail: "Jours ouvrés. Une demande liée à la sécurité passe devant tout le reste.",
  },
  {
    icon: ShieldCheck,
    titre: 'Signalement',
    valeur: 'Traité par un humain',
    detail: "Un signalement n'est pas trié par un filtre : quelqu'un le lit et répond.",
  },
];

type Champs = { nom: string; email: string; sujet: string; message: string };

const CHAMPS_VIDES: Champs = { nom: '', email: '', sujet: '', message: '' };

export default function ContactPage() {
  const [champs, setChamps] = useState<Champs>(CHAMPS_VIDES);
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const modifier =
    (champ: keyof Champs) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const champClasses = `w-full rounded-xl border border-cream/12 bg-cream/5 px-4 py-3 text-[14px] text-cream placeholder:text-cream/40 transition-colors focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/25`;

  const fadeUp = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0 : 0.5, ease: 'easeOut' as const },
  };

  return (
    <>
      <Header />

      <main id="contenu" className="bg-abyss text-cream">
        {/* Hero */}
        <section className="border-b border-cream/8 px-4 pt-20 sm:px-6 sm:pt-24 lg:px-16 xl:pt-28">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl py-12 text-center sm:py-16">
            <span className="inline-block rounded-full border border-orange/35 bg-orange/[0.12] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-orange">
              Contact
            </span>

            <h1 className="font-display [font-stretch:125%] mt-5 text-[30px] font-extrabold leading-[1.15] tracking-tight text-cream sm:text-[40px]">
              Une question, un souci ?
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-cream/70 sm:text-base">
              Écris-nous. Une personne lit, une personne répond — sous 24 à
              48 heures en jours ouvrés.
            </p>
          </motion.div>
        </section>

        {/* Formulaire + repères */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
            {/* Le formulaire */}
            <div className="rounded-[1.75rem] border border-cream/10 bg-[#0C222D] p-6 sm:p-8">
              {envoye ? (
                <div className="py-6 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-lime/30 bg-lime/10">
                    <CheckCircle2 size={24} className="text-lime" aria-hidden="true" />
                  </span>

                  <h2 className="font-display [font-stretch:125%] mt-5 text-xl font-extrabold text-cream">
                    Message transmis
                  </h2>

                  <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-cream/65">
                    Il est arrivé à {ADRESSE_SUPPORT}. On revient vers toi sous
                    24 à 48 heures.
                  </p>

                  <button
                    type="button"
                    onClick={() => setEnvoye(false)}
                    className={`fx-ghost mt-6 rounded-xl border border-cream/15 px-5 py-2.5 text-[13px] font-bold text-cream transition-colors hover:border-cream/30 ${focusRing}`}
                  >
                    Écrire un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={envoyer} className="space-y-4" noValidate>
                  <div>
                    <label
                      htmlFor="contact-nom"
                      className="mb-1.5 block text-[13px] font-semibold text-cream/90"
                    >
                      Ton nom <span className="text-orange">*</span>
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
                      placeholder="Comment on t’appelle"
                      className={champClasses}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="mb-1.5 block text-[13px] font-semibold text-cream/90"
                    >
                      Ton email <span className="text-orange">*</span>
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      value={champs.email}
                      onChange={modifier('email')}
                      placeholder="prenom@email.com"
                      className={champClasses}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-sujet"
                      className="mb-1.5 block text-[13px] font-semibold text-cream/90"
                    >
                      Sujet <span className="text-orange">*</span>
                    </label>
                    <input
                      id="contact-sujet"
                      name="sujet"
                      type="text"
                      required
                      minLength={3}
                      maxLength={120}
                      value={champs.sujet}
                      onChange={modifier('sujet')}
                      placeholder="En quelques mots"
                      className={champClasses}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="mb-1.5 block text-[13px] font-semibold text-cream/90"
                    >
                      Ton message <span className="text-orange">*</span>
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
                      placeholder="Dis-nous tout — plus c’est précis, plus la réponse sera utile."
                      className={`${champClasses} resize-y`}
                    />
                  </div>

                  {/*
                    L'erreur est annoncée aux lecteurs d'écran : `role="alert"`
                    la fait lire dès son apparition, sans déplacer le focus.
                  */}
                  {erreur && (
                    <p
                      role="alert"
                      className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] leading-relaxed text-red-200"
                    >
                      <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                      {erreur}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={envoi}
                    className={`fx-btn flex w-full items-center justify-center gap-2 rounded-xl bg-orange px-7 py-3.5 text-sm font-bold text-abyss transition-colors hover:bg-orange/90 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
                  >
                    {envoi ? 'Envoi en cours…' : 'Envoyer le message'}
                    {!envoi && <ArrowRight size={16} aria-hidden="true" />}
                  </button>

                  <p className="text-center text-[12px] leading-relaxed text-cream/55">
                    Ton adresse ne sert qu&apos;à te répondre. Elle n&apos;est
                    ajoutée à aucune liste de diffusion.
                  </p>
                </form>
              )}
            </div>

            {/* Les repères */}
            <div className="space-y-4">
              {reperes.map((repere) => {
                const Icone = repere.icon;

                return (
                  <div
                    key={repere.titre}
                    className="rounded-2xl border border-cream/10 bg-[#0C222D] p-5 sm:p-6"
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange/15">
                        <Icone size={18} className="text-orange" aria-hidden="true" />
                      </span>

                      <div className="min-w-0">
                        <h2 className="font-display [font-stretch:125%] text-[15px] font-bold text-cream">
                          {repere.titre}
                        </h2>
                        <p className="mt-0.5 break-words text-[14px] font-semibold text-orange">
                          {repere.valeur}
                        </p>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-cream/60">
                          {repere.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="rounded-2xl border border-cream/10 bg-abyss p-5 sm:p-6">
                <p className="text-[13px] leading-relaxed text-cream/65">
                  Une question sur le fonctionnement du site ? La réponse est
                  peut-être déjà écrite.
                </p>

                <Link
                  href="/faq"
                  className={`fx-link mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-orange transition-colors hover:text-cream ${focusRing}`}
                >
                  Voir la foire aux questions
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
