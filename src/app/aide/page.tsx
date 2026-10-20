import Link from 'next/link';
import {
  IdCard,
  CreditCard,
  ShieldCheck,
  UserCog,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GrainOverlay from '@/components/brand/GrainOverlay';

/**
 * Centre d'aide.
 *
 * Cette page était liée depuis le pied de page sans exister : le lien
 * renvoyait une 404 depuis le début.
 *
 * Elle ne recopie pas la FAQ et ne la remplace pas. La FAQ est une liste de
 * onze questions dans l'ordre où elles ont été écrites ; ce centre d'aide
 * est une porte d'entrée par **sujet**, qui envoie au bon endroit — la FAQ,
 * le guide, les offres, le compte, ou nous.
 *
 * Chaque destination existe : les routes sont vérifiées. Si une rubrique
 * est ajoutée ici, sa page doit exister d'abord.
 */

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70 focus-visible:ring-offset-2 focus-visible:ring-offset-nuit';

const RUBRIQUES = [
  {
    icone: UserCog,
    titre: 'Créer et tenir mon profil',
    texte:
      'Photos, centres d’intérêt, intentions. Ce qu’on attend d’un profil, et ce qui le rend lisible.',
    href: '/guide',
    lien: 'Lire le guide',
  },
  {
    icone: IdCard,
    titre: 'La vérification d’identité',
    texte:
      'Comment elle se passe, ce que Stripe reçoit, ce que nous recevons. Elle est gratuite et ne dépend d’aucune offre.',
    href: '/faq',
    lien: 'Voir les réponses',
  },
  {
    icone: CreditCard,
    titre: 'Offres et paiement',
    texte:
      'Ce que lève chaque offre, comment changer, comment résilier. Sans engagement de durée.',
    href: '/tarifs',
    lien: 'Comparer les offres',
  },
  {
    icone: ShieldCheck,
    titre: 'Sécurité et signalements',
    texte:
      'Signaler un comportement, bloquer un membre, comprendre ce qu’il advient d’un signalement.',
    href: '/faq',
    lien: 'Voir les réponses',
  },
];

const RACCOURCIS = [
  { label: 'Questions fréquentes', href: '/faq' },
  { label: 'Gestion de mes données', href: '/gestion-donnees' },
  { label: 'Conditions d’utilisation', href: '/conditions' },
  { label: 'Confidentialité', href: '/confidentialite' },
  { label: 'Accessibilité', href: '/accessibilite' },
];

export default function AidePage() {
  return (
    <>
      <Header />
      <GrainOverlay />

      <main id="contenu" className="relative bg-nuit text-champagne">
        <section className="px-4 pb-14 pt-28 sm:px-6 sm:pt-32 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-surtitre text-champagne/60">
              <span aria-hidden="true" className="h-px w-8 bg-cuivre" />
              Centre d’aide
            </p>

            <h1 className="font-display mt-5 text-[34px] font-normal leading-tight tracking-tight text-ivoire sm:text-[44px]">
              Par où commencer&nbsp;?
            </h1>

            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-champagne/65 sm:text-base">
              Quatre sujets couvrent la plupart des questions. Si le tien
              n&apos;y est pas, écris-nous — une personne te répond.
            </p>

            <ul className="mt-12 grid gap-5 sm:grid-cols-2">
              {RUBRIQUES.map(({ icone: Icone, titre, texte, href, lien }) => (
                <li key={titre}>
                  <Link
                    href={href}
                    className={`group flex h-full gap-4 rounded-2xl border border-cuivre/15 bg-minuit p-5 transition-colors hover:border-cuivre/45 sm:p-6 ${focusRing}`}
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cuivre/30 bg-nuit/60 text-cuivre"
                    >
                      <Icone size={20} />
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-display text-[18px] font-normal leading-snug text-ivoire">
                        {titre}
                      </span>

                      <span className="mt-2 text-[13px] leading-relaxed text-champagne/65">
                        {texte}
                      </span>

                      <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-cuivre transition-colors group-hover:text-champagne">
                        {lien}
                        <ArrowRight size={13} />
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div
          aria-hidden="true"
          className="mx-auto h-px max-w-7xl bg-gradient-to-r from-transparent via-champagne/15 to-transparent"
        />

        <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-16">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
            <div>
              <h2 className="font-display text-[26px] font-normal leading-tight text-ivoire sm:text-[32px]">
                Rien ne correspond&nbsp;?
              </h2>

              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-champagne/65">
                Écris-nous depuis le formulaire de contact. Nous répondons sous
                deux jours ouvrés, et c&apos;est une personne qui lit, pas un
                script.
              </p>

              <Link
                href="/contact"
                className={`mt-6 inline-flex items-center gap-2 rounded-xl bg-degrade-cuivre px-7 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
              >
                <MessageCircle size={16} />
                Nous écrire
              </Link>
            </div>

            <nav aria-label="Autres pages utiles">
              <h2 className="text-[11px] font-semibold uppercase tracking-surtitre text-champagne/70">
                Aussi utile
              </h2>
              <span aria-hidden="true" className="mt-2.5 block h-px w-8 bg-cuivre" />

              <ul className="mt-5 space-y-3">
                {RACCOURCIS.map((raccourci) => (
                  <li key={raccourci.href}>
                    <Link
                      href={raccourci.href}
                      className={`text-[14px] text-champagne/65 transition-colors hover:text-ivoire ${focusRing}`}
                    >
                      {raccourci.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
