// src/app/inscription/steps/Step2.tsx

"use client";

/**
 * Étape 2 du formulaire d'inscription Sfera'Solys.
 *
 * Objectif :
 * - choisir une orientation ;
 * - choisir une ou plusieurs intentions relationnelles ;
 * - mettre à jour React Hook Form avec setValue pour les tableaux ;
 * - afficher clairement les erreurs de validation.
 */

import { useFormContext } from "react-hook-form";
import { Check } from "lucide-react";

/**
 * Liste des orientations proposées.
 * Les values sont celles envoyées dans MongoDB.
 */
const orientations = [
  { value: "hetero", label: "Hétérosexuelle" },
  { value: "homo", label: "Lesbienne / Homosexuelle" },
  { value: "bi", label: "Bisexuelle" },
  { value: "pan", label: "Pansexuelle" },
  { value: "curieuse", label: "Curieuse — je souhaite découvrir" },
  { value: "other", label: "Autre" },
];

/**
 * Liste des intentions relationnelles.
 * L'utilisateur peut en sélectionner plusieurs.
 */
const intentions = [
  { value: "rencontre-serieuse", label: "Rencontre sérieuse" },
  { value: "amitie", label: "Amitié" },
  { value: "aventure", label: "Aventure" },
  { value: "reseautage", label: "Réseautage" },
  { value: "discussion", label: "Discussion" },
];

export default function Step2() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const selectedOrientation = watch("orientation");
  const selectedIntentions: string[] = watch("intentions") || [];

  /**
   * Ajoute ou retire une intention du tableau.
   */
  const toggleIntention = (value: string) => {
    const nextIntentions = selectedIntentions.includes(value)
      ? selectedIntentions.filter((item) => item !== value)
      : [...selectedIntentions, value];

    setValue("intentions", nextIntentions, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Titre de l'étape */}
      <div>
        <h2 className="text-xl font-bold text-cream sm:text-2xl">
          Orientation et intentions
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-cream/70">
          Ces informations nous aident à proposer des rencontres plus
          compatibles avec tes attentes.
        </p>
      </div>

      {/* Bloc orientation */}
      <section className="space-y-4">
        <label className="block text-sm font-semibold text-cream/90">
          Orientation <span className="text-orange">*</span>
        </label>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {orientations.map((orientation) => {
            const isSelected = selectedOrientation === orientation.value;

            return (
              <label
                key={orientation.value}
                className={`flex cursor-pointer items-center rounded-xl border p-3 transition-all sm:p-4 ${
                  isSelected
                    ? "border-orange bg-orange/15 shadow-lg shadow-orange/10"
                    : "border-cream/15 bg-cream/5 hover:border-orange/50 hover:bg-cream/10"
                }`}
              >
                <input
                  type="radio"
                  {...register("orientation")}
                  value={orientation.value}
                  className="h-4 w-4 accent-orange"
                />

                <span
                  className={`ml-3 text-sm font-medium ${
                    isSelected ? "text-cream" : "text-cream/90"
                  }`}
                >
                  {orientation.label}
                </span>
              </label>
            );
          })}
        </div>

        {errors.orientation && (
          <p className="text-sm text-red-300">
            {errors.orientation.message as string}
          </p>
        )}
      </section>

      {/* Bloc intentions */}
      <section className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-cream/90">
            Quelles sont tes intentions ?{" "}
            <span className="text-orange">*</span>
          </label>

          <p className="mt-2 text-sm text-cream/70">
            Sélectionne une ou plusieurs options.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {intentions.map((intention) => {
            const isSelected = selectedIntentions.includes(intention.value);

            return (
              <button
                key={intention.value}
                type="button"
                onClick={() => toggleIntention(intention.value)}
                className={`rounded-xl border p-3 text-left transition-all sm:p-4 ${
                  isSelected
                    ? "border-orange bg-orange/15 shadow-lg shadow-orange/10"
                    : "border-cream/15 bg-cream/5 hover:border-orange/50 hover:bg-cream/10"
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`mr-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      isSelected
                        ? "border-orange bg-orange"
                        : "border-cream/15 bg-cream/5"
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 text-abyss" />}
                  </div>

                  <span
                    className={`text-sm font-medium ${
                      isSelected ? "text-cream" : "text-cream/90"
                    }`}
                  >
                    {intention.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {errors.intentions && (
          <p className="text-sm text-red-300">
            {errors.intentions.message as string}
          </p>
        )}
      </section>
    </div>
  );
}