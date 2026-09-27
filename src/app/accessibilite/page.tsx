'use client';

import Link from 'next/link';

import PageLegale, { type SectionLegale } from '@/components/legal/PageLegale';

/**
 * Déclaration d'accessibilité.
 *
 * Migration visuelle vers la direction A. **Le texte est repris octet pour
 * octet** : extrait du fichier source par script, jamais retapé.
 *
 * Une seule modification de fond, signalée ici : le chapeau de la page
 * disait « accessible à toutes », au féminin, reste du projet d'origine. Il
 * est neutralisé — la déclaration s'adresse à toute personne.
 */

const sections: SectionLegale[] = [
    {
      id: "notre-engagement",
      titre: "Notre engagement",
      resume: "Une plateforme accessible au plus grand nombre.",
      contenu: (
        <p>
          Sfera'Solys s&apos;engage à rendre son service numérique accessible
          conformément à la loi française n° 2005-102 pour l&apos;égalité des
          droits et des chances. Nous visons la conformité avec les Règles pour
          l&apos;Accessibilité des Contenus Web, WCAG 2.1, niveau AA.
        </p>
      ),
    },
    {
      id: "mesures-prises",
      titre: "Mesures prises",
      resume: "Contrastes, clavier, textes alternatifs et lecteurs d’écran.",
      contenu: (
        <ul className="list-disc space-y-2 pl-5">
          <li>Contrastes de couleurs conformes aux recommandations WCAG 2.1</li>
          <li>Navigation au clavier sur l&apos;ensemble des interfaces</li>
          <li>Textes alternatifs sur toutes les images significatives</li>
          <li>Structure de pages sémantique avec titres et landmarks ARIA</li>
          <li>Formulaires labellisés et messages d&apos;erreur explicites</li>
          <li>Compatibilité avec les lecteurs d&apos;écran VoiceOver et NVDA</li>
        </ul>
      ),
    },
    {
      id: "limitations-connues",
      titre: "Limitations connues",
      resume: "Certaines fonctionnalités sont encore en amélioration.",
      contenu: (
        <p>
          Certaines fonctionnalités en cours de développement peuvent présenter
          des limitations d&apos;accessibilité. Nous travaillons à les améliorer
          en continu. Si vous rencontrez une difficulté, signalez-la nous.
        </p>
      ),
    },
    {
      id: "signaler-un-probleme",
      titre: "Signaler un problème",
      resume: "Contact dédié et formulaire de contact.",
      contenu: (
        <>
          <p>
            Si vous rencontrez un obstacle d&apos;accessibilité sur Sfera'Solys,
            veuillez nous contacter :
          </p>

          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Email :{" "}
              <a
                href="mailto:contact@sferasolys.com"
                className="font-medium text-[#8E7AB5] underline-offset-2 hover:underline"
              >
                contact@sferasolys.com
              </a>
            </li>
            <li>
              Via notre{" "}
              <Link
                href="/contact"
                className="font-medium text-[#8E7AB5] underline-offset-2 hover:underline"
              >
                formulaire de contact
              </Link>
            </li>
          </ul>

          <p className="mt-3">
            Nous nous engageons à vous répondre dans un délai de 5 jours
            ouvrables.
          </p>
        </>
      ),
    },
    {
      id: "voies-de-recours",
      titre: "Voies de recours",
      resume: "Que faire si la réponse n’est pas satisfaisante.",
      contenu: (
        <p>
          Si vous n&apos;obtenez pas de réponse satisfaisante, vous pouvez
          contacter le Défenseur des droits via defenseurdesdroits.fr.
        </p>
      ),
    },
  ];

export default function AccessibilitePage() {
  return (
    <PageLegale
      badge="Accessibilité"
      titre="Utilisable par le plus grand nombre."
      chapeau="Notre engagement, l'état réel de la conformité, et comment nous signaler un blocage rencontré sur le site."
      miseAJour="27 septembre 2026"
      sections={sections}
    />
  );
}
