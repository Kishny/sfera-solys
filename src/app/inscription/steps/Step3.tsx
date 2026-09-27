// src/app/inscription/steps/Step3.tsx

"use client";

/**
 * Étape 3 du formulaire d'inscription Sfera'Solys.
 *
 * Objectif :
 * - choisir son département (métropole ou outre-mer) ;
 * - préciser sa ville ;
 * - définir la portée de recherche ;
 * - garder une UX fluide sur mobile.
 */

import { useFormContext } from "react-hook-form";
import {
  DEPARTEMENTS,
  getVillesPourDepartement,
  isOutreMer,
} from "@/lib/locations";

/**
 * Portée de recherche proposée.
 * Le « rayon » historique en km n'avait pas de sens entre territoires
 * éloignés (métropole ↔ outre-mer) : on raisonne par bassin géographique.
 */
const portees = [
  { value: "departement", label: "Mon département" },
  { value: "region", label: "Ma région" },
  { value: "france", label: "Toute la France" },
];

export default function Step3() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const selectedLocalisation = watch("localisation") || "";
  const selectedDepartement = watch("departement") || "";
  const selectedRayon = watch("rayon") || "";

  const villesSuggerees = getVillesPourDepartement(selectedDepartement);

  const handleLocalisationClick = (ville: string) => {
    setValue("localisation", ville, {
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
          Localisation
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-cream/70">
          Indique ton département et ta ville pour recevoir des
          suggestions cohérentes — métropole comme outre-mer.
        </p>
      </div>

      {/* Département */}
      <section className="space-y-4">
        <label className="block text-sm font-semibold text-cream/90">
          Ton département <span className="text-orange">*</span>
        </label>

        <select
          {...register("departement")}
          className="w-full rounded-xl border border-cream/15 bg-cream/10 px-4 py-3 text-cream outline-none transition-all focus:border-orange focus:ring-2 focus:ring-orange/25"
        >
          <option value="" className="bg-[#001724] text-cream/70">
            Sélectionne ton département…
          </option>

          <optgroup label="France métropolitaine" className="bg-[#001724]">
            {DEPARTEMENTS.filter((d) => !d.outreMer).map((d) => (
              <option
                key={d.code}
                value={d.code}
                className="bg-[#001724] text-cream"
              >
                {d.code} — {d.nom}
              </option>
            ))}
          </optgroup>

          <optgroup label="Outre-mer" className="bg-[#001724]">
            {DEPARTEMENTS.filter((d) => d.outreMer).map((d) => (
              <option
                key={d.code}
                value={d.code}
                className="bg-[#001724] text-cream"
              >
                {d.code} — {d.nom}
              </option>
            ))}
          </optgroup>
        </select>

        {selectedDepartement && isOutreMer(selectedDepartement) && (
          <p className="text-xs text-cream/90">
            🌴 Territoire d&apos;outre-mer — tes suggestions resteront dans ton
            bassin local.
          </p>
        )}
      </section>

      {/* Ville */}
      <section className="space-y-4">
        <label className="block text-sm font-semibold text-cream/90">
          Ta ville <span className="text-orange">*</span>
        </label>

        <input
          {...register("localisation")}
          type="text"
          placeholder="Saisis ta ville"
          className="w-full rounded-xl border border-cream/15 bg-cream/10 px-4 py-3 text-cream placeholder:text-cream/55 outline-none transition-all focus:border-orange focus:ring-2 focus:ring-orange/25"
        />

        <div>
          <p className="mb-3 text-sm text-cream/70">Villes principales :</p>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {villesSuggerees.map((ville) => {
              const isSelected = selectedLocalisation === ville;

              return (
                <button
                  key={ville}
                  type="button"
                  onClick={() => handleLocalisationClick(ville)}
                  className={`rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
                    isSelected
                      ? "border-orange bg-orange/15 text-cream shadow-lg shadow-orange/10"
                      : "border-cream/15 bg-cream/5 text-cream/90 hover:border-orange/50 hover:bg-cream/10"
                  }`}
                >
                  {ville}
                </button>
              );
            })}
          </div>
        </div>

        {errors.localisation && (
          <p className="text-sm text-red-300">
            {errors.localisation.message as string}
          </p>
        )}
      </section>

      {/* Portée de recherche */}
      <section className="space-y-4">
        <label className="block text-sm font-semibold text-cream/90">
          Portée de recherche <span className="text-orange">*</span>
        </label>

        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
          {portees.map((portee) => {
            const isSelected = selectedRayon === portee.value;

            return (
              <label
                key={portee.value}
                className={`flex cursor-pointer items-center rounded-xl border p-3 transition-all sm:p-4 ${
                  isSelected
                    ? "border-orange bg-orange/15 shadow-lg shadow-orange/10"
                    : "border-cream/15 bg-cream/5 hover:border-orange/50 hover:bg-cream/10"
                }`}
              >
                <input
                  type="radio"
                  {...register("rayon")}
                  value={portee.value}
                  className="h-4 w-4 accent-orange"
                />

                <span
                  className={`ml-3 text-sm font-medium ${
                    isSelected ? "text-cream" : "text-cream/90"
                  }`}
                >
                  {portee.label}
                </span>
              </label>
            );
          })}
        </div>

        <p className="text-sm text-cream/70">
          Cette portée définit l&apos;étendue de tes suggestions de profils.
        </p>

        {errors.rayon && (
          <p className="text-sm text-red-300">
            {errors.rayon.message as string}
          </p>
        )}
      </section>
    </div>
  );
}
