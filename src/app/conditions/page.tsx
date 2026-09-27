'use client';

import { AlertTriangle } from 'lucide-react';

import PageLegale, { type SectionLegale } from '@/components/legal/PageLegale';

/**
 * Conditions générales d'utilisation.
 *
 * Migration visuelle vers la direction A. **Le texte juridique est repris
 * octet pour octet** depuis la version précédente : il a été extrait du
 * fichier source par script, jamais retapé, et seules les clés de structure
 * ont été renommées. Une coquille introduite par une migration de mise en
 * page dans un document qui engage serait difficile à défendre.
 *
 * ⚠️ Deux points restent à valider par le porteur du projet, déjà signalés
 * dans CLAUDE.md :
 * - l'âge minimum est passé de 18 à 28 ans pour coller au critère produit.
 *   C'est une modification de fond d'un texte contractuel ;
 * - la date de dernière mise à jour affichait « juin 2025 », héritée du
 *   projet d'origine, alors que le texte a été modifié depuis. Elle porte
 *   maintenant la date réelle de la dernière modification.
 */

const sections: SectionLegale[] = [
    {
      id: "objet",
      titre: "1. Objet",
      resume: "Cadre général d’utilisation de Sfera'Solys.",
      contenu: (
        <p>
          Les présentes Conditions Générales d&apos;Utilisation, appelées CGU,
          régissent l&apos;utilisation de la plateforme Sfera'Solys, accessible à
          l&apos;adresse sferasolys.com. En créant un compte, vous acceptez
          pleinement et sans réserve les présentes CGU.
        </p>
      ),
    },
    {
      id: "acces-au-service",
      titre: "2. Accès au service",
      resume: "Plateforme réservée aux personnes majeures.",
      contenu: (
        <p>
          Sfera'Solys est une plateforme de rencontre destinée aux hommes âgés de
          28 ans et plus. L&apos;inscription est réservée aux personnes majeures.
          Toute inscription implique de fournir des informations exactes et à
          jour. Sfera'Solys se réserve le droit de suspendre ou supprimer tout
          compte contenant de fausses informations.
        </p>
      ),
    },
    {
      id: "comportement-attendu",
      titre: "3. Comportement attendu",
      resume: "Respect, sécurité et bienveillance obligatoires.",
      contenu: (
        <>
          <p>Les utilisateurs s&apos;engagent à :</p>

          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Respecter les autres membres en toutes circonstances</li>
            <li>Ne pas publier de contenu offensant, illégal ou trompeur</li>
            <li>Ne pas harceler ou intimider d&apos;autres utilisateurs</li>
            <li>
              Ne pas utiliser la plateforme à des fins commerciales sans accord
            </li>
            <li>
              Signaler tout comportement inapproprié via les outils prévus
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "abonnements-et-paiements",
      titre: "4. Abonnements et paiements",
      resume: "Paiements Stripe, renouvellement et annulation.",
      contenu: (
        <p>
          Sfera'Solys propose des abonnements payants : Essentiel, Premium et
          Elite. Les paiements sont gérés via Stripe. Les abonnements sont
          renouvelés automatiquement chaque mois. Vous pouvez annuler à tout
          moment depuis votre espace « Mon compte ». Aucun remboursement
          n&apos;est effectué pour les périodes entamées, sauf obligation
          légale.
        </p>
      ),
    },
    {
      id: "propriete-intellectuelle",
      titre: "5. Propriété intellectuelle",
      resume: "Logo, design, textes et code protégés.",
      contenu: (
        <p>
          L&apos;ensemble des contenus de Sfera'Solys, notamment le logo, le
          design, les textes et le code, est protégé par le droit de la propriété
          intellectuelle. Toute reproduction sans autorisation est interdite.
        </p>
      ),
    },
    {
      id: "resiliation",
      titre: "6. Résiliation",
      resume: "Suppression de compte ou suspension en cas d’abus.",
      contenu: (
        <p>
          Vous pouvez supprimer votre compte à tout moment depuis votre espace
          personnel. Sfera'Solys peut également résilier un compte en cas de
          non-respect des présentes CGU, sans préavis.
        </p>
      ),
    },
    {
      id: "limitation-de-responsabilite",
      titre: "7. Limitation de responsabilité",
      resume: "La plateforme encadre, mais ne contrôle pas tout.",
      contenu: (
        <p>
          Sfera'Solys ne peut être tenue responsable des interactions entre
          utilisateurs. La plateforme met en œuvre des moyens raisonnables pour
          assurer la sécurité des échanges, mais ne peut garantir
          l&apos;absence totale de comportements malveillants.
        </p>
      ),
    },
    {
      id: "droit-applicable",
      titre: "8. Droit applicable",
      resume: "CGU soumises au droit français.",
      contenu: (
        <p>
          Les présentes CGU sont soumises au droit français. En cas de litige,
          les parties s&apos;engagent à rechercher une solution amiable avant
          tout recours judiciaire. À défaut, le tribunal compétent sera celui du
          ressort du siège social de Sfera'Solys.
        </p>
      ),
    },
    {
      id: "contact",
      titre: "9. Contact",
      resume: "Adresse dédiée aux questions juridiques.",
      contenu: (
        <p>
          Pour toute question relative aux présentes CGU :{" "}
          <a
            href="mailto:contact@sferasolys.com"
            className="font-medium text-[#8E7AB5] underline-offset-2 hover:underline"
          >
            contact@sferasolys.com
          </a>
        </p>
      ),
    },
  ];

export default function ConditionsPage() {
  return (
    <PageLegale
      badge="Conditions"
      titre="Les règles du jeu."
      chapeau="Ce que tu acceptes en créant un compte, et ce à quoi la plateforme s'engage en retour."
      miseAJour="27 septembre 2026"
      avertissement={
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-orange/30 bg-orange/10 px-5 py-4">
          <AlertTriangle
            size={18}
            className="mt-0.5 shrink-0 text-orange"
            aria-hidden="true"
          />
          <p className="text-[13px] leading-relaxed text-cream/80">
            <strong className="text-cream">Document à faire relire.</strong> Ces
            conditions ont été adaptées au service actuel, notamment l'âge
            minimum porté à 28 ans. Une relecture juridique est nécessaire avant
            la mise en ligne.
          </p>
        </div>
      }
      sections={sections}
    />
  );
}
