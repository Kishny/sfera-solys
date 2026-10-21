'use client';

import Link from 'next/link';

import PageLegale, { type SectionLegale } from '@/components/legal/PageLegale';

/**
 * Gestion des données personnelles.
 *
 * Nouvelle page, liée depuis le pied de page. Elle ne double pas la
 * politique de confidentialité : celle-ci décrit ce qui est collecté et par
 * qui, celle-là décrit **ce que la personne peut faire** de ses données, et
 * comment le faire depuis son compte.
 *
 * Ce qui est affirmé ici a été vérifié dans le code, pas supposé :
 *
 * - La suppression du compte existe réellement — `DELETE /api/users/me`,
 *   déclenchée depuis Ma Sphère, onglet Sécurité. Elle résilie
 *   l'abonnement Stripe, supprime les photographies chez Cloudinary puis
 *   les likes, matchs, messages, visites et publications.
 * - La vérification d'identité passe par Stripe Identity : la pièce
 *   d'identité est transmise à Stripe, pas stockée par le site.
 *
 * Ce qui n'est **pas** affirmé, faute de pouvoir l'être : les durées de
 * conservation. Aucune n'est imposée par le code aujourd'hui, et la
 * politique de confidentialité le reconnaît déjà. Le dire ici serait
 * inventer une garantie.
 */

const A_COMPLETER = (
  <strong className="rounded bg-cuivre px-1.5 py-0.5 text-nuit">
    [À COMPLÉTER]
  </strong>
);

const sections: SectionLegale[] = [
  {
    id: 'droits',
    titre: '1. Tes droits',
    resume: 'Ce que le RGPD te garantit sur tes données.',
    contenu: (
      <>
        <p>
          Le règlement européen sur la protection des données te donne six
          droits sur les informations que nous détenons à ton sujet :
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Accès</strong> — savoir quelles données nous détenons et en
            obtenir une copie.
          </li>
          <li>
            <strong>Rectification</strong> — corriger une information inexacte.
          </li>
          <li>
            <strong>Effacement</strong> — demander la suppression de ton compte
            et de ses données.
          </li>
          <li>
            <strong>Limitation</strong> — demander que nous cessions d&apos;
            utiliser certaines données sans les supprimer.
          </li>
          <li>
            <strong>Portabilité</strong> — récupérer tes données dans un format
            lisible par une machine.
          </li>
          <li>
            <strong>Opposition</strong> — t&apos;opposer à un traitement, par
            exemple à la réception de la newsletter.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'depuis-ton-compte',
    titre: '2. Ce que tu fais toi-même',
    resume: 'Sans passer par nous.',
    contenu: (
      <>
        <p>
          Trois de ces droits s&apos;exercent directement depuis ton espace,
          sans demande ni délai :
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Corriger tes informations</strong> — profil, photographies,
            centres d&apos;intérêt et intentions se modifient depuis{' '}
            <Link href="/mon-compte" className="text-cuivre underline">
              Ma Sphère
            </Link>
            .
          </li>
          <li>
            <strong>Te désabonner de la newsletter</strong> — un lien figure au
            bas de chaque envoi.
          </li>
          <li>
            <strong>Supprimer ton compte</strong> — depuis{' '}
            <Link href="/mon-compte" className="text-cuivre underline">
              Ma Sphère
            </Link>
            , onglet Sécurité. La suppression résilie ton abonnement en cours,
            efface tes photographies, puis tes likes, matchs, messages, visites
            de profil et publications.
          </li>
        </ul>
        <p>
          La suppression est définitive et ne demande aucune validation de
          notre part. Elle n&apos;est pas réversible : si tu veux conserver une
          trace de tes échanges, demande-nous une copie avant.
        </p>
      </>
    ),
  },
  {
    id: 'nous-ecrire',
    titre: '3. Ce qui passe par une demande',
    resume: 'Accès, portabilité, limitation, opposition.',
    contenu: (
      <>
        <p>
          Pour obtenir une copie de tes données, les récupérer dans un format
          exploitable, ou t&apos;opposer à un traitement, écris-nous depuis le{' '}
          <Link href="/contact" className="text-cuivre underline">
            formulaire de contact
          </Link>{' '}
          avec l&apos;adresse électronique de ton compte.
        </p>
        <p>
          Nous répondons dans un délai d&apos;un mois, prolongeable de deux
          mois si la demande est complexe — nous t&apos;en informons alors avant
          la fin du premier mois. Nous pouvons te demander de justifier ton
          identité si un doute raisonnable existe sur l&apos;auteur de la
          demande.
        </p>
      </>
    ),
  },
  {
    id: 'verification',
    titre: '4. Ta pièce d’identité',
    resume: 'Elle ne nous est pas transmise.',
    contenu: (
      <>
        <p>
          La vérification d&apos;identité passe par <strong>Stripe Identity</strong>
          . Tu photographies ta pièce d&apos;identité et ton visage sur
          l&apos;interface de Stripe ; c&apos;est Stripe qui compare les deux et
          nous renvoie le seul résultat de cette comparaison.
        </p>
        <p>
          Les traitements opérés par Stripe sur ces documents relèvent de sa
          propre politique de confidentialité, et les demandes qui les
          concernent doivent lui être adressées.
        </p>
      </>
    ),
  },
  {
    id: 'conservation',
    titre: '5. Combien de temps',
    resume: 'Le point à arbitrer avant la mise en ligne.',
    contenu: (
      <>
        <p>
          Durées de conservation par catégorie de données : {A_COMPLETER}.
        </p>
        <p>
          Ces durées restent à fixer, et nous préférons le dire plutôt
          qu&apos;annoncer un délai que rien n&apos;applique. Le code n&apos;en
          impose aucune aujourd&apos;hui : la suppression d&apos;un compte
          efface bien ses données, mais rien ne purge automatiquement un compte
          laissé inactif. C&apos;est une décision à prendre avant
          l&apos;ouverture du service, pas une formalité de rédaction.
        </p>
        <p>
          Certaines données peuvent être conservées plus longtemps lorsque la
          loi l&apos;impose, notamment les pièces comptables liées aux
          paiements et les éléments nécessaires au traitement d&apos;un
          signalement en cours.
        </p>
      </>
    ),
  },
  {
    id: 'reclamation',
    titre: '6. Si notre réponse ne te convient pas',
    resume: 'Le recours auprès de la CNIL.',
    contenu: (
      <p>
        Tu peux à tout moment introduire une réclamation auprès de la
        Commission nationale de l&apos;informatique et des libertés, 3 place de
        Fontenoy, 75007 Paris, ou en ligne sur{' '}
        <a
          href="https://www.cnil.fr"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cuivre underline"
        >
          cnil.fr
        </a>
        . Tu n&apos;as pas à nous avoir écrit d&apos;abord, même si c&apos;est
        souvent plus rapide.
      </p>
    ),
  },
];

export default function GestionDonneesPage() {
  return (
    <PageLegale
      badge="Gestion des données"
      titre="Tes données t’appartiennent."
      chapeau="Ce que tu peux faire de tes informations : les corriger, les récupérer, les effacer. Ce qui se règle depuis ton compte, et ce qui passe par une demande."
      sections={sections}
      avertissement={
        <p>
          Une durée de conservation reste à fixer avant la mise en ligne : le
          code n&apos;en impose aucune aujourd&apos;hui. Le reste de cette page
          décrit des mécanismes qui existent réellement — la suppression de
          compte, notamment, est effective et irréversible.
        </p>
      }
    />
  );
}
