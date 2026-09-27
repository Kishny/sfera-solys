'use client';

import PageLegale, { type SectionLegale } from '@/components/legal/PageLegale';

/**
 * Politique des cookies.
 *
 * Migration visuelle vers la direction A. **Le texte est repris octet pour
 * octet** depuis les tableaux du fichier d'origine.
 *
 * Doublon supprimé au passage : l'ancienne page écrivait deux fois le même
 * contenu — une version bureau en JSX à la main, une version mobile
 * construite depuis `policySections`. Seuls les tableaux sont conservés, ce
 * qui supprime le risque de voir les deux versions diverger.
 *
 * À savoir : la description de la catégorie « analytics » est désormais
 * exacte. Avant le 27/09/2026, refuser cette catégorie n'empêchait rien —
 * la mesure d'audience Vercel était montée sans condition. Voir
 * `src/components/AnalytiqueConsentie.tsx`.
 */

const sections: SectionLegale[] = [
  {
    id: "definition",
    titre: "Qu'est-ce qu'un cookie ?",
    contenu:
      <p>{"Un cookie est un petit fichier texte stocké sur votre appareil lors de votre visite sur Sfera'Solys. Il permet de mémoriser certaines informations pour améliorer votre expérience, sécuriser votre session et simplifier votre navigation."}</p>,
  },
  {
    id: "gestion",
    titre: "Gestion des cookies",
    contenu:
      <p>{"Vous pouvez configurer votre navigateur pour refuser les cookies ou être alerté de leur dépôt. Cependant, certaines fonctionnalités de Sfera'Solys, notamment la connexion, nécessitent des cookies essentiels pour fonctionner correctement."}</p>,
  },
  {
    id: "navigateurs",
    titre: "Réglages navigateur",
    contenu:
      <p>{"Chrome : Paramètres → Confidentialité et sécurité → Cookies. Firefox : Options → Vie privée et sécurité. Safari : Préférences → Confidentialité."}</p>,
  },
  {
    id: "contact",
    titre: "Contact",
    contenu:
      <p>{"Pour toute question liée aux cookies ou à la confidentialité, vous pouvez nous contacter à l'adresse contact@sferasolys.com."}</p>,
  },
];

/** Cookies effectivement déposés, repris tel quel du fichier d'origine. */
const cookiesUtilises = [
  {
    emoji: "🔐",
    name: "Cookies d'authentification",
    desc: "Gèrent votre session de connexion avec NextAuth. Ils sont indispensables au fonctionnement sécurisé du site.",
    type: "Essentiels",
    duree: "Session",
  },
  {
    emoji: "⚙️",
    name: "Cookies de préférences",
    desc: "Mémorisent vos paramètres comme la langue, les préférences d'affichage ou certains choix d'interface.",
    type: "Fonctionnels",
    duree: "1 an",
  },
  {
    emoji: "📊",
    name: "Cookies analytiques",
    desc: "Nous aident à comprendre comment Sfera'Solys est utilisé : pages visitées, temps passé, navigation globale. Ces données sont anonymisées.",
    type: "Analytiques",
    duree: "6 mois",
  },
];

export default function CookiesPage() {
  return (
    <PageLegale
      badge="Cookies"
      titre="Ce que nous déposons sur ton appareil."
      chapeau="Les catégories, leur durée, et ce que change concrètement ton choix dans le bandeau."
      miseAJour="27 septembre 2026"
      sections={sections}
      apres={
        <div className="mt-8">
          <h2 className="font-display [font-stretch:125%] text-[17px] font-bold text-cream">
            Cookies utilisés
          </h2>

          <dl className="mt-4 space-y-3">
            {cookiesUtilises.map((cookie) => (
              <div
                key={cookie.name}
                className="rounded-2xl border border-cream/10 bg-[#0C222D] px-5 py-4"
              >
                <dt className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-semibold text-cream">
                    {cookie.name}
                  </span>
                  <span className="rounded-full border border-orange/30 bg-orange/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange">
                    {cookie.type}
                  </span>
                  <span className="text-[11px] text-cream/50">
                    Durée : {cookie.duree}
                  </span>
                </dt>
                <dd className="mt-1.5 text-[13px] leading-relaxed text-cream/65">
                  {cookie.desc}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      }
    />
  );
}
