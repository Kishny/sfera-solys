'use client';

import Link from 'next/link';

import PageLegale, { type SectionLegale } from '@/components/legal/PageLegale';

/**
 * Mentions légales.
 *
 * Cette page était liée depuis le pied de page mais n'existait pas : le lien
 * renvoyait une 404. Pour un site commercial français, les mentions légales
 * doivent être accessibles en permanence — l'absence n'était donc pas un
 * simple lien cassé.
 *
 * **Ce document est un gabarit et doit être complété avant toute mise en
 * ligne.** Les champs marqués `[À COMPLÉTER]` demandent des informations
 * qu'aucun fichier du projet ne contient : dénomination sociale, forme
 * juridique, capital, siège, numéro RCS, TVA intracommunautaire, directeur
 * de la publication. Elles ne peuvent pas être déduites, et une mention
 * légale inventée est pire qu'absente.
 *
 * Même réserve que les autres pages légales : **à relire par un juriste**.
 */

const A_COMPLETER = (
  <strong className="rounded bg-cuivre px-1.5 py-0.5 text-nuit">
    [À COMPLÉTER]
  </strong>
);

const sections: SectionLegale[] = [
  {
    id: 'editeur',
    titre: "1. L'éditeur du site",
    resume: 'Qui publie Sfera’Solys.',
    contenu: (
      <>
        <p>
          Le site Sfera&rsquo;Solys est édité par {A_COMPLETER} (dénomination
          sociale), {A_COMPLETER} (forme juridique) au capital de{' '}
          {A_COMPLETER}, dont le siège social est situé {A_COMPLETER} (adresse
          postale complète).
        </p>
        <p>
          Immatriculation au registre du commerce et des sociétés :{' '}
          {A_COMPLETER}. Numéro de TVA intracommunautaire : {A_COMPLETER}.
        </p>
        <p>
          Contact :{' '}
          <Link href="/contact" className="text-cuivre underline">
            formulaire de contact
          </Link>
          , ou {A_COMPLETER} (adresse électronique) et {A_COMPLETER} (numéro de
          téléphone).
        </p>
      </>
    ),
  },
  {
    id: 'publication',
    titre: '2. Directeur de la publication',
    resume: 'La personne responsable du contenu publié.',
    contenu: (
      <p>
        Le directeur de la publication est {A_COMPLETER} (nom et prénom), en sa
        qualité de {A_COMPLETER} (fonction).
      </p>
    ),
  },
  {
    id: 'hebergeur',
    titre: "3. L'hébergeur",
    resume: 'Où le site est hébergé.',
    contenu: (
      <>
        <p>
          Le site est hébergé par <strong>Vercel Inc.</strong>, dont l&apos;
          adresse postale et le numéro de téléphone sont à renseigner ici :{' '}
          {A_COMPLETER}. Ces coordonnées doivent être vérifiées auprès de
          Vercel plutôt que recopiées, elles changent.
        </p>
        <p>
          La base de données est hébergée par <strong>MongoDB Atlas</strong> et
          les photographies par <strong>Cloudinary</strong>. La liste complète
          des prestataires qui traitent des données figure dans la{' '}
          <Link href="/confidentialite" className="text-cuivre underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    id: 'propriete',
    titre: '4. Propriété intellectuelle',
    resume: 'Ce qui appartient au site, et ce qui appartient aux membres.',
    contenu: (
      <>
        <p>
          La marque Sfera&rsquo;Solys, son identité visuelle, les textes, la
          charte graphique et le code du site sont protégés. Toute
          reproduction, même partielle, sans autorisation écrite préalable est
          interdite.
        </p>
        <p>
          Les photographies et les textes publiés par les membres sur leur
          profil restent la propriété de leurs auteurs. En les publiant, le
          membre accorde à Sfera&rsquo;Solys le droit de les afficher aux
          autres membres dans le cadre du service — rien de plus. Le détail
          figure dans les{' '}
          <Link href="/conditions" className="text-cuivre underline">
            conditions d&apos;utilisation
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    id: 'mediation',
    titre: '5. Médiation de la consommation',
    resume: 'Le recours en cas de litige non résolu.',
    contenu: (
      <>
        <p>
          Tout professionnel vendant à des consommateurs en France doit
          désigner un médiateur de la consommation et en communiquer les
          coordonnées. Médiateur désigné : {A_COMPLETER} (nom, adresse postale
          et adresse du site).
        </p>
        <p>
          La plateforme européenne de règlement en ligne des litiges est
          accessible à l&apos;adresse{' '}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cuivre underline"
          >
            ec.europa.eu/consumers/odr
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: 'signalement',
    titre: '6. Signaler un contenu',
    resume: 'Comment nous alerter sur un contenu illicite.',
    contenu: (
      <p>
        Tout contenu manifestement illicite peut être signalé depuis le profil
        concerné, ou via le{' '}
        <Link href="/contact" className="text-cuivre underline">
          formulaire de contact
        </Link>
        . Chaque signalement est examiné par un administrateur, et un compte
        peut être suspendu. Les signalements ne sont pas arbitrés
        automatiquement.
      </p>
    ),
  },
];

export default function MentionsLegalesPage() {
  return (
    <PageLegale
      badge="Mentions légales"
      titre="Qui édite ce site."
      chapeau="L'éditeur, le directeur de la publication, l'hébergeur et les recours. Informations obligatoires pour un site commercial français."
      sections={sections}
      avertissement={
        <p>
          <strong>Ce document est un gabarit incomplet.</strong> Les champs{' '}
          <span className="rounded bg-cuivre px-1.5 py-0.5 text-nuit">
            [À COMPLÉTER]
          </span>{' '}
          demandent des informations d&apos;état civil et d&apos;immatriculation
          que le code du projet ne contient pas. Il doit être complété puis relu
          par un juriste avant toute mise en ligne — des mentions légales
          absentes ou fausses engagent la responsabilité de l&apos;éditeur.
        </p>
      }
    />
  );
}
