// src/app/(app)/mon-compte/_composants/OngletProfil.tsx

"use client";

import { useRef, useState } from "react";
import { Loader2, Pencil } from "lucide-react";

import { DEPARTEMENTS } from "@/lib/locations";

import { Champ, DelaiAnnuel } from "./Champ";
import GaleriePhotos from "./GaleriePhotos";
import { carte, champ, focusRing, type MembreSolys } from "./types";

/**
 * Onglet Profil.
 *
 * ## L'avatar, et ce qu'il annonçait
 *
 * L'envoi vers Cloudinary est réel, mais la photo n'entre dans le profil qu'au
 * « Sauvegarder » : `majBrouillon` ne touche que le brouillon. L'ancien message
 * disait « Photo mise à jour avec succès ! » — c'était faux — et le bouton
 * restait actif **hors mode édition**, donc on pouvait « réussir » un changement
 * qui n'était jamais enregistré. Le bouton est désactivé hors édition, et le
 * message dit ce qui s'est réellement passé.
 *
 * Noter la différence avec la galerie juste en dessous, qui enregistre
 * immédiatement : deux comportements pour deux routes, et chacun le dit.
 */
export default function OngletProfil({
  user,
  edition,
  majBrouillon,
  versTableau,
  onPhotosEnregistrees,
}: {
  user: MembreSolys;
  edition: boolean;
  majBrouillon: <K extends keyof MembreSolys>(
    cle: K,
    valeur: MembreSolys[K]
  ) => void;
  versTableau: (valeur: string) => string[];
  onPhotosEnregistrees: () => void;
}) {
  const [apercu, setApercu] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    texte: string;
  } | null>(null);

  const champFichier = useRef<HTMLInputElement>(null);

  const auChangement = async (
    evenement: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fichier = evenement.target.files?.[0];
    if (!fichier) return;

    setApercu(URL.createObjectURL(fichier));
    setMessage(null);
    setEnvoi(true);

    try {
      const corps = new FormData();
      corps.append("file", fichier);

      const reponse = await fetch("/api/upload/avatar", {
        method: "POST",
        body: corps,
      });

      const donnees = await reponse.json().catch(() => null);

      if (!reponse.ok || !donnees?.success) {
        setMessage({
          type: "error",
          texte: donnees?.error ?? "Cette photo n’a pas pu être envoyée.",
        });
        setApercu(null);
        return;
      }

      majBrouillon("image", donnees.imageUrl);
      setMessage({
        type: "success",
        texte: "Photo prête. Elle sera enregistrée quand tu sauvegarderas.",
      });
    } catch {
      setMessage({ type: "error", texte: "Connexion interrompue." });
      setApercu(null);
    } finally {
      setEnvoi(false);
      if (champFichier.current) champFichier.current.value = "";
    }
  };

  const image = apercu || user.image || null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display [font-stretch:125%] text-[19px] font-bold text-cream">
          Mon profil
        </h2>
        <p className="mt-1 text-[13px] text-cream/60">
          {edition
            ? "Mode édition — rien n’est enregistré tant que tu n’as pas sauvegardé."
            : "Appuie sur « Modifier » en bas de page pour éditer."}
        </p>
      </div>

      {edition && (
        <p className="flex items-start gap-2 rounded-xl border border-orange/30 bg-orange/10 px-3.5 py-2.5 text-[12px] leading-relaxed text-cream/85">
          <Pencil
            size={13}
            className="mt-0.5 shrink-0 text-orange"
            aria-hidden="true"
          />
          Tes modifications restent locales jusqu’à la sauvegarde. « Annuler »
          les abandonne sans rien envoyer.
        </p>
      )}

      {/* Avatar */}
      <section className={`${carte} p-4 sm:p-5`}>
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cream/12 bg-abyss">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={`Photo de ${user.pseudonyme}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-display [font-stretch:125%] text-[24px] font-extrabold text-cream/45">
                {user.pseudonyme.charAt(0).toUpperCase()}
              </span>
            )}

            {envoi && (
              <div className="absolute inset-0 flex items-center justify-center bg-abyss/70">
                <Loader2
                  size={18}
                  className="animate-spin text-orange"
                  aria-hidden="true"
                />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-cream">
              Photo de profil
            </p>

            <p className="mt-0.5 text-[11px] text-cream/55">
              JPG, PNG ou WebP · 5 Mo maximum · recadrée en 400 × 400.
            </p>

            {message && (
              <p
                className={`mt-2 text-[12px] ${
                  message.type === "success" ? "text-lime" : "text-orange"
                }`}
                role={message.type === "error" ? "alert" : "status"}
              >
                {message.texte}
              </p>
            )}

            <button
              type="button"
              onClick={() => champFichier.current?.click()}
              disabled={envoi || !edition}
              title={
                !edition
                  ? "Passe en mode édition pour changer ta photo."
                  : undefined
              }
              className={`mt-3 rounded-xl border border-cream/15 px-4 py-2 text-[12px] font-semibold text-cream transition-colors hover:border-cream/30 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
            >
              {envoi ? "Envoi en cours…" : "Changer la photo"}
            </button>

            <input
              ref={champFichier}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={auChangement}
              className="sr-only"
            />
          </div>
        </div>
      </section>

      {/* Galerie */}
      <section className={`${carte} p-4 sm:p-5`}>
        <GaleriePhotos
          photos={user.photos ?? []}
          onEnregistrees={onPhotosEnregistrees}
        />
      </section>

      {/* Champs */}
      <section className={`${carte} space-y-4 p-4 sm:p-5`}>
        <Champ label="Description">
          <textarea
            disabled={!edition}
            value={user.bio || ""}
            onChange={(evenement) => majBrouillon("bio", evenement.target.value)}
            className={`${champ} h-24 resize-none`}
            placeholder="Quelques mots sur toi : ce qui t’occupe, ce que tu cherches…"
            maxLength={500}
          />
          <span className="mt-1 block text-right text-[11px] text-cream/55">
            {(user.bio || "").length} / 500
          </span>
        </Champ>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Champ label="Pseudonyme">
            <input
              disabled={!edition}
              value={user.pseudonyme || ""}
              onChange={(evenement) =>
                majBrouillon("pseudonyme", evenement.target.value)
              }
              className={champ}
            />
            <DelaiAnnuel changeLe={user.pseudonymeChangedAt} />
          </Champ>

          <Champ label="Adresse e-mail">
            <input disabled value={user.email || ""} className={champ} />
            <span className="mt-1.5 block text-[11px] text-cream/55">
              L’adresse ne se change pas ici — écris-nous via la page contact.
            </span>
          </Champ>

          <Champ label="Âge">
            <input
              disabled={!edition}
              type="number"
              // Sfera'Solys est réservé aux 28 ans et plus : le minimum
              // affiché était 18, hérité du fork.
              min={28}
              max={99}
              value={user.age || 28}
              onChange={(evenement) =>
                majBrouillon("age", Number(evenement.target.value))
              }
              className={champ}
            />
          </Champ>

          <Champ label="Département">
            <select
              disabled={!edition}
              value={user.departement || ""}
              onChange={(evenement) =>
                majBrouillon("departement", evenement.target.value)
              }
              className={champ}
            >
              <option value="">Non renseigné</option>
              <optgroup label="France métropolitaine">
                {DEPARTEMENTS.filter((d) => !d.outreMer).map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code} — {d.nom}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Outre-mer">
                {DEPARTEMENTS.filter((d) => d.outreMer).map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code} — {d.nom}
                  </option>
                ))}
              </optgroup>
            </select>
          </Champ>

          <Champ label="Ville">
            <input
              disabled={!edition}
              value={user.localisation || ""}
              onChange={(evenement) =>
                majBrouillon("localisation", evenement.target.value)
              }
              className={champ}
              placeholder="Paris, Fort-de-France, Saint-Denis…"
            />
          </Champ>

          <Champ label="Portée de recherche">
            <select
              disabled={!edition}
              value={user.rayon || "departement"}
              onChange={(evenement) =>
                majBrouillon("rayon", evenement.target.value)
              }
              className={champ}
            >
              <option value="departement">Mon département</option>
              <option value="region">Ma région</option>
              <option value="france">Toute la France</option>
            </select>
          </Champ>

          <Champ label="Centres d’intérêt" className="sm:col-span-2">
            <input
              disabled={!edition}
              value={(user.interets || []).join(", ")}
              onChange={(evenement) =>
                majBrouillon("interets", versTableau(evenement.target.value))
              }
              className={champ}
              placeholder="voyage, musique, sport…"
            />
            <span className="mt-1.5 block text-[11px] text-cream/55">
              Séparés par des virgules.
            </span>
          </Champ>

          <Champ label="Question de sécurité" className="sm:col-span-2">
            <input
              disabled={!edition}
              value={user.question || ""}
              onChange={(evenement) =>
                majBrouillon("question", evenement.target.value)
              }
              className={champ}
              placeholder="Ta question secrète"
            />
          </Champ>

          <Champ label="Réponse secrète" className="sm:col-span-2">
            <input
              disabled={!edition}
              type={edition ? "text" : "password"}
              value={user.reponse || ""}
              onChange={(evenement) =>
                majBrouillon("reponse", evenement.target.value)
              }
              className={champ}
              placeholder={
                user.hasReponse && !edition
                  ? "••••••••"
                  : user.hasReponse
                    ? "Laisse vide pour conserver la réponse actuelle"
                    : "Ta réponse secrète"
              }
            />

            {user.hasReponse && (
              <span className="mt-1.5 block text-[11px] text-cream/60">
                {edition
                  ? "Laisse vide pour conserver ta réponse actuelle."
                  : "Une réponse est enregistrée. Elle ne s’affiche jamais, même pour toi."}
              </span>
            )}
          </Champ>
        </div>
      </section>
    </div>
  );
}
