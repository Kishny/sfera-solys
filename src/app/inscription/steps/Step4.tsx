// src/app/inscription/steps/Step4.tsx

"use client";

/**
 * Étape 4 du formulaire d'inscription Sfera'Solys.
 *
 * Objectif :
 * - définir une question de sécurité ;
 * - définir une réponse ;
 * - choisir 3 à 5 centres d'intérêt ;
 * - mettre à jour correctement React Hook Form pour le tableau interets.
 *
 * Important :
 * Les centres d'intérêt sont gérés ici, et uniquement ici.
 * Step5 ne doit pas les répéter, sinon la logique de validation devient confuse.
 */

import { useFormContext } from "react-hook-form";
import { Check } from "lucide-react";

/**
 * Questions de sécurité disponibles.
 */
const questionsSecurite = [
  {
    value: "nom-animal",
    label: "Quel était le nom de ton premier animal de compagnie ?",
  },
  {
    value: "ville-naissance",
    label: "Dans quelle ville es-tu né ?",
  },
  {
    value: "film-prefere",
    label: "Quel est ton film préféré ?",
  },
  {
    value: "prof-reve",
    label: "Quel était le métier de tes rêves quand tu étais enfant ?",
  },
  {
    value: "livre-prefere",
    label: "Quel est ton livre préféré ?",
  },
];

/**
 * Centres d'intérêt proposés.
 * Le schéma Zod demande 3 à 5 choix.
 */
const interetsDisponibles = [
  { value: "voyage", label: "Voyage" },
  { value: "cuisine", label: "Cuisine" },
  { value: "sport", label: "Sport" },
  { value: "musique", label: "Musique" },
  { value: "cinema", label: "Cinéma" },
  { value: "lecture", label: "Lecture" },
  { value: "art", label: "Art" },
  { value: "technologie", label: "Technologie" },
  { value: "nature", label: "Nature" },
  { value: "mode", label: "Mode" },
  { value: "gaming", label: "Jeux vidéo" },
  { value: "photographie", label: "Photographie" },
];

export default function Step4() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const reponse = watch("reponse") || "";
  const selectedInterets: string[] = watch("interets") || [];

  /**
   * Ajoute ou retire un centre d'intérêt.
   * Maximum 5 choix.
   */
  const toggleInteret = (value: string) => {
    const alreadySelected = selectedInterets.includes(value);

    if (alreadySelected) {
      const nextInterets = selectedInterets.filter((item) => item !== value);

      setValue("interets", nextInterets, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });

      return;
    }

    if (selectedInterets.length >= 5) return;

    setValue("interets", [...selectedInterets, value], {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Titre de l'étape */}
      <div>
        <h2 className="text-xl font-bold text-champagne sm:text-2xl">
          Sécurité et centres d’intérêt
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-champagne/70">
          Ajoute une question de sécurité et choisis quelques centres
          d’intérêt pour améliorer tes suggestions Sfera'Solys.
        </p>
      </div>

      {/* Bloc question de sécurité */}
      <section className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-champagne">
            Question de sécurité
          </h3>

          <p className="mt-2 text-sm text-champagne/70">
            Cette question pourra être utilisée si tu oublies ton mot de
            passe.
          </p>
        </div>

        {/* Question */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-champagne/90">
            Sélectionne une question{" "}
            <span className="text-cuivre">*</span>
          </label>

          <select
            {...register("question")}
            className="w-full rounded-xl border border-champagne/15 bg-champagne/10 px-4 py-3 text-champagne outline-none transition-all focus:border-cuivre focus:ring-2 focus:ring-cuivre/25"
          >
            <option value="" className="bg-nuit text-champagne">
              Choisis une question
            </option>

            {questionsSecurite.map((question) => (
              <option
                key={question.value}
                value={question.value}
                className="bg-nuit text-champagne"
              >
                {question.label}
              </option>
            ))}
          </select>

          {errors.question && (
            <p className="text-sm text-red-300">
              {errors.question.message as string}
            </p>
          )}
        </div>

        {/* Réponse */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-champagne/90">
            Ta réponse <span className="text-cuivre">*</span>
          </label>

          <input
            {...register("reponse")}
            type="text"
            placeholder="Ta réponse, maximum 200 caractères"
            maxLength={200}
            className="w-full rounded-xl border border-champagne/15 bg-champagne/10 px-4 py-3 text-champagne placeholder:text-champagne/55 outline-none transition-all focus:border-cuivre focus:ring-2 focus:ring-cuivre/25"
          />

          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-champagne/55">
              Cette réponse doit rester personnelle et facile à retenir.
            </p>

            <p
              className={`text-xs ${
                reponse.length > 180 ? "text-cuivre" : "text-champagne/55"
              }`}
            >
              {reponse.length}/200
            </p>
          </div>

          {errors.reponse && (
            <p className="text-sm text-red-300">
              {errors.reponse.message as string}
            </p>
          )}
        </div>
      </section>

      {/* Bloc centres d'intérêt */}
      <section className="space-y-5 border-t border-champagne/10 pt-6">
        <div>
          <h3 className="text-lg font-semibold text-champagne">
            Centres d’intérêt <span className="text-cuivre">*</span>
          </h3>

          <p className="mt-2 text-sm text-champagne/70">
            Sélectionne entre 3 et 5 centres d’intérêt pour personnaliser ton expérience.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {interetsDisponibles.map((interet) => {
            const isSelected = selectedInterets.includes(interet.value);
            const isDisabled = selectedInterets.length >= 5 && !isSelected;

            return (
              <button
                key={interet.value}
                type="button"
                onClick={() => toggleInteret(interet.value)}
                disabled={isDisabled}
                className={`rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? "border-cuivre bg-cuivre/15 text-champagne"
                    : isDisabled
                      ? "cursor-not-allowed border-champagne/10 bg-champagne/5 text-champagne/55"
                      : "border-champagne/12 bg-champagne/10 text-champagne/80 hover:border-cuivre/50 hover:bg-champagne/15"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      isSelected
                        ? "border-cuivre bg-cuivre"
                        : "border-champagne/20"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-nuit" />}
                  </div>

                  <span className="text-sm font-medium">{interet.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p
            className={`text-sm ${
              selectedInterets.length < 3 ? "text-cuivre" : "text-champagne/70"
            }`}
          >
            {selectedInterets.length}/5 sélectionnés — minimum 3
          </p>

          {selectedInterets.length >= 5 && (
            <p className="text-sm text-champagne">Maximum atteint</p>
          )}
        </div>

        {errors.interets && (
          <p className="text-sm text-red-300">
            {errors.interets.message as string}
          </p>
        )}
      </section>
    </div>
  );
}