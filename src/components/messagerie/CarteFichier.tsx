// src/components/messagerie/CarteFichier.tsx

"use client";

/**
 * Un fichier joint dans le fil.
 *
 * Le lien ouvre dans un onglet plutôt que de télécharger : un PDF
 * s'affiche dans la visionneuse du navigateur, qui n'exécute rien, là où
 * un téléchargement le dépose sur la machine pour être ouvert par une
 * application qui, elle, peut exécuter.
 *
 * Le nom est affiché tel que la route l'a nettoyé — sans séparateurs de
 * chemin ni marques de sens d'écriture, qui servent à faire passer un
 * fichier pour un autre.
 */

import { FileText } from "lucide-react";

interface CarteFichierProps {
  fichier: { url: string; nom: string; poids: number };
  /** Vrai dans une bulle cuivrée : les couleurs s'inversent. */
  surFondClair: boolean;
}

function formaterPoids(octets: number): string {
  if (!Number.isFinite(octets) || octets <= 0) return "";

  if (octets < 1024 * 1024) {
    return `${Math.max(1, Math.round(octets / 1024))} Ko`;
  }

  return `${(octets / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}

export default function CarteFichier({
  fichier,
  surFondClair,
}: CarteFichierProps) {
  const teinte = surFondClair ? "text-nuit" : "text-champagne";
  const teinteDouce = surFondClair ? "text-nuit/70" : "text-champagne/60";
  const pastille = surFondClair ? "bg-nuit/15" : "bg-cuivre/20";
  const accent = surFondClair ? "text-nuit" : "text-cuivre";

  const poids = formaterPoids(fichier.poids);

  return (
    <a
      href={fichier.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex min-w-[13rem] max-w-[17rem] items-center gap-3 rounded-xl p-1 transition hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cuivre`}
    >
      <span
        aria-hidden="true"
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${pastille} ${accent}`}
      >
        <FileText size={17} />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-[13px] font-medium ${teinte}`}
          title={fichier.nom}
        >
          {fichier.nom}
        </span>

        <span className={`mt-0.5 block text-[11px] ${teinteDouce}`}>
          PDF{poids ? ` · ${poids}` : ""} · Ouvrir
        </span>
      </span>
    </a>
  );
}
