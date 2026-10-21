'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

import PageLegale, { type SectionLegale } from '@/components/legal/PageLegale';
import {
  AvertissementLegal,
  CartesResume,
  GrilleNumerotee,
  ListePrestataires,
} from '@/components/legal/blocs';
import { Flag, ScanFace, Target } from 'lucide-react';

/**
 * Politique de confidentialité.
 *
 * ## Ce que cette page était avant
 *
 * Elle n'était **pas** une politique de confidentialité. Son titre était
 * « On est là pour vous 💜 » et son contenu un second formulaire de contact,
 * doublon de /contact — avec le même défaut : un envoi simulé par un
 * `setTimeout`, un écran de succès, et aucun message transmis.
 *
 * Le problème dépassait le doublon. Cette URL est référencée par le pied de
 * page, par les trois autres pages légales, par le sitemap, et surtout par
 * **la case de consentement de l'inscription**. Le site faisait donc
 * accepter une politique de confidentialité qui n'existait nulle part.
 *
 * ## Comment ce texte a été établi
 *
 * Chaque fait énoncé ici est tiré du code : les champs collectés viennent de
 * `src/models/*.ts`, les sous-traitants des dépendances réellement appelées
 * (`src/lib/db.ts`, `stripe.ts`, `cloudinary`, `pusher`, `resend`,
 * `next-auth`), les cookies de `src/hooks/useCookieConsent.ts` et de la
 * configuration NextAuth. Rien n'a été supposé.
 *
 * ## ⚠️ Ce qui manque, et qui ne pouvait pas être déduit
 *
 * Les mentions marquées « À COMPLÉTER » exigent une décision ou une
 * information que le code ne contient pas : identité juridique de
 * l'éditeur, adresse, durées de conservation, existence d'un délégué à la
 * protection des données. Elles sont volontairement visibles à l'écran
 * plutôt que remplies au hasard : un trou signalé vaut mieux qu'une
 * affirmation inventée dans un document qui engage.
 *
 * **Ce document doit être relu par un juriste avant mise en ligne.**
 */

const A_COMPLETER = (
  <strong className="rounded bg-cuivre px-1.5 py-0.5 text-nuit">
    [À COMPLÉTER]
  </strong>
);

const sections: SectionLegale[] = [
  {
    id: 'responsable',
    titre: '1. Qui traite tes données',
    resume: "L'éditeur du site et ses coordonnées.",
    contenu: (
      <>
        <p>
          Le responsable du traitement est {A_COMPLETER} (dénomination
          sociale, forme juridique, numéro d&apos;immatriculation), dont le
          siège est situé {A_COMPLETER} (adresse postale).
        </p>
        <p>
          Pour toute question relative à tes données, écris à{' '}
          <a href="mailto:contact@sferasolys.com">contact@sferasolys.com</a> ou
          passe par la <Link href="/contact">page de contact</Link>.
        </p>
        <p>
          Délégué à la protection des données : {A_COMPLETER} (désigné ou
          non, et le cas échéant ses coordonnées).
        </p>
      </>
    ),
  },
  {
    id: 'donnees',
    titre: '2. Les données que nous collectons',
    resume: 'Champ par champ, tel que le site les enregistre.',
    contenu: (
      <>
        <p>
          <strong>À la création du compte :</strong> adresse e-mail,
          pseudonyme, mot de passe (stocké chiffré, jamais en clair) ou
          identifiant du fournisseur si tu passes par Google ou Apple, âge,
          et le consentement que tu donnes au moment de l&apos;inscription.
        </p>
        <p>
          <strong>Pour le profil :</strong> photos, description, orientation,
          intentions relationnelles, centres d&apos;intérêt, localisation
          (ville et département), rayon de recherche, niveau de visibilité
          choisi, ainsi qu&apos;une question et une réponse de sécurité.
        </p>
        <p>
          <strong>Pour la vérification d&apos;identité :</strong> la pièce
          d&apos;identité et le selfie sont transmis directement à Stripe
          Identity et ne sont pas stockés sur nos serveurs. Nous conservons
          uniquement l&apos;identifiant de la session de vérification et son
          résultat (vérifiée ou non).
        </p>
        <p>
          <strong>À l&apos;usage :</strong> likes, mises en relation,
          messages échangés, visites de profil, signalements émis ou reçus,
          témoignages soumis, participations aux événements, notes du journal
          personnel et publications communautaires.
        </p>
        <p>
          <strong>Pour l&apos;abonnement :</strong> identifiants client et
          abonnement Stripe, offre choisie, statut et dates de période. Les
          coordonnées bancaires sont saisies chez Stripe et ne transitent
          jamais par nos serveurs.
        </p>
      </>
    ),
  },
  {
    id: 'finalites',
    titre: '3. Pourquoi nous les traitons',
    resume: 'Finalités et bases légales.',
    contenu: (
      <>
        <p>
          <strong>Exécution du service</strong> (base légale : le contrat) :
          créer et afficher ton profil, proposer des profils compatibles,
          permettre les échanges, gérer ton abonnement.
        </p>
        <p>
          <strong>Sécurité et confiance</strong> (base légale : notre intérêt
          légitime, et l&apos;obligation légale pour la lutte contre les
          abus) : vérification d&apos;identité obligatoire, traitement des
          signalements, modération, journalisation des actions
          d&apos;administration.
        </p>
        <p>
          <strong>Mesure d&apos;audience</strong> (base légale : ton
          consentement) : statistiques de fréquentation, uniquement si tu
          acceptes la catégorie correspondante dans le bandeau cookies.
        </p>
        <p>
          <strong>Communication</strong> (base légale : ton consentement pour
          la newsletter, le contrat pour les e-mails liés au compte).
        </p>
      </>
    ),
  },
  {
    id: 'sous-traitants',
    titre: '4. Qui d’autre y a accès',
    resume: 'Les prestataires qui traitent des données pour nous.',
    contenu: (
      <>
        <p>
          Nous ne vendons aucune donnée. Les prestataires suivants en traitent
          pour notre compte, chacun dans son périmètre :
        </p>
        <ul>
          <li>
            <strong>MongoDB Atlas</strong> — hébergement de la base de
            données.
          </li>
          <li>
            <strong>Stripe</strong> — paiements et abonnements, ainsi que la
            vérification d&apos;identité via Stripe Identity.
          </li>
          <li>
            <strong>Cloudinary</strong> — hébergement et diffusion des photos.
          </li>
          <li>
            <strong>Pusher</strong> — acheminement des messages et
            notifications en temps réel.
          </li>
          <li>
            <strong>Resend</strong> — envoi des e-mails transactionnels et de
            la newsletter.
          </li>
          <li>
            <strong>Vercel</strong> — hébergement du site et mesure
            d&apos;audience.
          </li>
          <li>
            <strong>Google</strong> et <strong>Apple</strong> — uniquement si
            tu choisis de te connecter par leur intermédiaire.
          </li>
        </ul>
        <p>
          Régions d&apos;hébergement et transferts hors Union européenne :{' '}
          {A_COMPLETER}.
        </p>
      </>
    ),
  },
  {
    id: 'conservation',
    titre: '5. Combien de temps',
    resume: 'Durées de conservation.',
    contenu: (
      <>
        <p>
          Durées de conservation par catégorie de données : {A_COMPLETER}.
          Ces durées doivent être fixées avant la mise en ligne — le code
          n&apos;en impose aucune aujourd&apos;hui.
        </p>
        <p>
          À la suppression de ton compte, les données de profil sont
          supprimées. Certaines données peuvent être conservées plus
          longtemps lorsque la loi l&apos;impose, notamment les pièces
          comptables liées aux paiements et les éléments nécessaires au
          traitement d&apos;un signalement en cours.
        </p>
      </>
    ),
  },
  {
    id: 'droits',
    titre: '6. Tes droits',
    resume: 'Accès, rectification, effacement, opposition, portabilité.',
    contenu: (
      <>
        <p>
          Tu disposes d&apos;un droit d&apos;accès, de rectification,
          d&apos;effacement, de limitation, d&apos;opposition et de
          portabilité sur tes données, ainsi que du droit de retirer ton
          consentement à tout moment lorsque le traitement repose sur lui.
        </p>
        <p>
          La plupart de ces actions se font directement depuis ton espace
          Ma Sphère. Pour les autres, écris-nous via la{' '}
          <Link href="/contact">page de contact</Link> : nous répondons sous
          un mois, comme le prévoit le règlement.
        </p>
        <p>
          Tu peux enfin introduire une réclamation auprès de la CNIL, à
          l&apos;adresse{' '}
          <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">
            cnil.fr
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    titre: '7. Cookies et stockage local',
    resume: 'Ce qui est déposé sur ton appareil.',
    contenu: (
      <>
        <p>
          Un cookie de session, indispensable, maintient ta connexion. Tes
          préférences de consentement sont enregistrées dans le stockage
          local de ton navigateur, sous la clé{' '}
          <code>sferasolys-cookie-consent</code>.
        </p>
        <p>
          La mesure d&apos;audience n&apos;est chargée que si tu acceptes la
          catégorie correspondante : refuser la coupe réellement. Le détail
          figure sur la <Link href="/cookies">page cookies</Link>.
        </p>
      </>
    ),
  },
  {
    id: 'securite',
    titre: '8. Sécurité',
    resume: 'Les mesures en place.',
    contenu: (
      <>
        <p>
          Les mots de passe sont stockés sous forme de condensats
          cryptographiques et ne sont jamais consultables. Les échanges avec
          le site sont chiffrés. L&apos;accès aux données
          d&apos;administration est restreint et journalisé.
        </p>
        <p>
          Aucun système n&apos;est infaillible : en cas de violation de
          données susceptible d&apos;engendrer un risque pour tes droits, nous
          en informerons la CNIL et, si nécessaire, toi directement.
        </p>
      </>
    ),
  },
  {
    id: 'mineurs',
    titre: '9. Âge minimum',
    resume: 'Le service est réservé aux adultes de 28 ans et plus.',
    contenu: (
      <p>
        L&apos;inscription est réservée aux hommes âgés de 28 ans et plus.
        L&apos;âge déclaré est confronté au document officiel lors de la
        vérification d&apos;identité, qui conditionne l&apos;accès au service.
      </p>
    ),
  },
];

export default function ConfidentialitePage() {
  return (
    <PageLegale
      badge="Confidentialité"
      titre={
        <>
          Tes données, sous ton contrôle<span className="text-cuivre">.</span>
        </>
      }
      accroche="Quelles informations sont collectées, pourquoi, et comment exercer tes droits."
      chapeau="Quelles données sont collectées, pourquoi, par qui elles sont traitées, et comment reprendre la main dessus."
      miseAJour="27 septembre 2026"
      encartSommaire={{
        titre: 'Ta vie privée compte.',
        texte:
          'Chaque donnée listée ici a une raison d’être, et tu peux revenir dessus.',
      }}
      avant={
        <>
          <CartesResume
            titre="Ce que nous faisons de tes données"
            cartes={[
              {
                icone: Target,
                titre: 'Collecte ciblée',
                texte:
                  'Compte, photos, préférences, messages et informations utiles au service.',
              },
              {
                icone: ScanFace,
                titre: 'Vérification',
                texte:
                  'Pièce d’identité et selfie transmis directement à Stripe Identity.',
              },
              {
                icone: Flag,
                titre: 'Tes droits',
                texte:
                  'Accès, rectification, effacement, opposition et portabilité.',
              },
            ]}
          />

          <GrilleNumerotee
            titre="Les informations traitées"
            intro="Le détail de chaque catégorie figure dans l’article « Les données que nous collectons », plus bas."
            items={[
              {
                titre: 'Compte et profil',
                texte:
                  'E-mail, pseudonyme, âge, photos, description, intentions, centres d’intérêt et localisation.',
              },
              {
                titre: 'Utilisation',
                texte:
                  'Likes, messages, visites de profil, signalements, événements et publications.',
              },
              {
                titre: 'Abonnements',
                texte:
                  'Identifiants client et abonnement Stripe, offre et statut. La carte bancaire reste chez Stripe.',
              },
              {
                titre: 'Vérification d’identité',
                texte:
                  'Nous conservons l’identifiant de session et le résultat — ni le document, ni le selfie.',
              },
            ]}
          />

          <ListePrestataires
            titre="Nos prestataires"
            prestataires={[
              { nom: 'MongoDB Atlas', role: 'base de données' },
              { nom: 'Stripe', role: 'paiements et vérification d’identité' },
              { nom: 'Cloudinary', role: 'photos' },
              { nom: 'Pusher', role: 'messagerie en temps réel' },
              { nom: 'Resend', role: 'e-mails' },
              { nom: 'Vercel', role: 'hébergement' },
              { nom: 'Google', role: 'connexion optionnelle' },
            ]}
            note={
              <>
                Régions d’hébergement et transferts hors Union européenne&nbsp;:{' '}
                <span className="font-semibold text-cuivre">[À COMPLÉTER]</span>.
              </>
            }
          />

          <GrilleNumerotee
            titre="Exercer tes droits"
            intro="La procédure complète et les délais figurent dans l’article « Tes droits »."
            items={[
              {
                titre: 'Accès et rectification',
                texte:
                  'Consulter ou mettre à jour tes données, notamment depuis Ma Sphère.',
              },
              {
                titre: 'Effacement et opposition',
                texte:
                  'Demander la suppression de ton compte, ou t’opposer à certains traitements.',
              },
              {
                titre: 'Retrait du consentement',
                texte:
                  'Revenir sur tes choix de cookies et sur l’inscription à la lettre d’information.',
              },
              {
                titre: 'Contact et CNIL',
                texte:
                  'Écrire au support, et saisir la CNIL si la réponse ne te convient pas.',
              },
            ]}
          />

          <AvertissementLegal titre="Durées de conservation :">
            elles ne sont pas encore fixées. L&apos;article « Combien de temps »
            le dit, et le tableau correspondant reste à écrire — annoncer une
            durée qui ne serait appliquée nulle part vaudrait moins que de
            reconnaître qu&apos;elle manque.
          </AvertissementLegal>
        </>
      }
      avertissement={
        <div className="flex items-start gap-3 rounded-2xl border border-cuivre/40 bg-cuivre/[0.07] px-5 py-4">
          <AlertTriangle
            size={18}
            className="mt-0.5 shrink-0 text-cuivre"
            aria-hidden="true"
          />
          <p className="text-[13px] leading-relaxed text-champagne/80">
            <strong className="text-champagne">Document en cours de finalisation.</strong>{' '}
            Les mentions signalées <span className="text-cuivre">[À COMPLÉTER]</span>{' '}
            attendent des informations que seul l&apos;éditeur peut fournir :
            identité juridique, adresse, durées de conservation, délégué à la
            protection des données. Cette page doit être relue par un juriste
            avant la mise en ligne du service.
          </p>
        </div>
      }
      sections={sections}
    />
  );
}
