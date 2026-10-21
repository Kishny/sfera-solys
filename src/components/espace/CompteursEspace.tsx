// src/components/espace/CompteursEspace.tsx

"use client";

/**
 * Compteurs de l'espace membre — source unique.
 *
 * La barre latérale portait elle-même le sondage de `/api/notifications`
 * et l'abonnement Pusher. Tant qu'elle était seule, c'était sans
 * conséquence. Avec une barre d'onglets mobile, ça ne l'était plus : les
 * deux barres restent montées dans le DOM à toutes les tailles — l'une
 * est masquée en CSS, pas démontée — donc deux sondages toutes les
 * trente secondes et deux abonnements au même canal privé.
 *
 * L'état vit donc ici, au-dessus des deux, et chacune le lit.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { clientPusherOuNull } from "@/lib/pusher-client";

export type Compteurs = {
  /** Messages non lus. */
  messages: number;
  /** Mises en relation nouvelles depuis la dernière visite. */
  matches: number;
};

const ContexteCompteurs = createContext<Compteurs>({ messages: 0, matches: 0 });

/** Les compteurs de l'espace membre. Renvoie des zéros hors du fournisseur. */
export function useCompteurs(): Compteurs {
  return useContext(ContexteCompteurs);
}

export function FournisseurCompteurs({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [compteurs, setCompteurs] = useState<Compteurs>({
    messages: 0,
    matches: 0,
  });

  const isLoggedIn = !!session?.user;

  /**
   * Sondage régulier.
   *
   * `/api/notifications` renvoie chaque compteur séparément. On lit les
   * deux qui nous intéressent plutôt que le `total`, qui mélange messages
   * non lus, nouveaux matchs et visites de profil — une visite allumait
   * autrefois la pastille de Messages, et on arrivait sur une boîte vide.
   */
  useEffect(() => {
    if (!isLoggedIn) return;

    const lire = async () => {
      try {
        const reponse = await fetch("/api/notifications", { cache: "no-store" });
        if (!reponse.ok) return;

        const donnees = await reponse.json();

        setCompteurs({
          messages: donnees.unreadMessages || 0,
          matches: donnees.newMatches || 0,
        });
      } catch {
        // Ignoré volontairement : une barre de navigation ne casse pas
        // parce qu'un compteur n'a pas pu être relu.
      }
    };

    lire();
    const minuteur = setInterval(lire, 30_000);

    /*
     * Relecture immédiate quand une page vient de marquer quelque chose
     * comme vu. Sans ça, la pastille reste allumée jusqu'au prochain
     * tour — jusqu'à trente secondes à regarder un compteur qu'on vient
     * justement de vider.
     */
    window.addEventListener("solys:notifications", lire);

    return () => {
      clearInterval(minuteur);
      window.removeEventListener("solys:notifications", lire);
    };
  }, [isLoggedIn]);

  /**
   * Temps réel pour les nouveaux matchs.
   *
   * Le canal `private-user-{id}` porte les mises en relation. Les
   * nouveaux messages passent, eux, par `private-match-{id}` : on n'y est
   * pas abonné ici, c'est la relecture toutes les trente secondes qui met
   * leur compteur à jour.
   */
  useEffect(() => {
    if (!isLoggedIn) return;

    const utilisateur = session?.user as { id?: string } | undefined;
    const userId = utilisateur?.id;
    if (!userId) return;

    const client = clientPusherOuNull();
    if (!client) return;

    const nomCanal = `private-user-${userId}`;
    const canal = client.subscribe(nomCanal);

    canal.bind("new-match", () => {
      setCompteurs((precedents) => ({
        ...precedents,
        matches: precedents.matches + 1,
      }));
    });

    return () => {
      canal.unbind_all();
      client.unsubscribe(nomCanal);
    };
  }, [isLoggedIn, session?.user]);

  return (
    <ContexteCompteurs.Provider value={compteurs}>
      {children}
    </ContexteCompteurs.Provider>
  );
}
