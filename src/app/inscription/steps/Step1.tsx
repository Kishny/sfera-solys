// src/app/inscription/steps/Step1.tsx

"use client";

/**
 * Étape 1 du formulaire d'inscription Sfera'Solys.
 *
 * Objectif :
 * - récupérer les informations de base du profil ;
 * - préremplir correctement l'email / pseudonyme si NextAuth les fournit ;
 * - garder une interface lisible sur mobile ;
 * - afficher les erreurs React Hook Form / Zod proprement.
 *
 * Important :
 * Le mot de passe est optionnel dans le schéma principal.
 * C'est normal, car un utilisateur connecté avec Google OAuth n'a pas forcément
 * besoin de définir un mot de passe ici.
 */

import { useFormContext } from "react-hook-form";

export default function Step1() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Titre de l'étape */}
      <div>
        <h2 className="text-xl font-bold text-cream sm:text-2xl">
          Informations de base
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-cream/70">
          On commence par créer ton identité Sfera'Solys. Ces informations
          seront utilisées pour configurer ton profil.
        </p>
      </div>

      <div className="space-y-5">
        {/* Pseudonyme */}
        <Field
          label="Pseudonyme"
          required
          error={errors.pseudonyme?.message as string | undefined}
        >
          <input
            {...register("pseudonyme")}
            type="text"
            autoComplete="nickname"
            className="input-step"
            placeholder="Choisis un pseudonyme unique"
          />
        </Field>

        {/* Email */}
        <Field
          label="Adresse email"
          required
          error={errors.email?.message as string | undefined}
        >
          <input
            type="email"
            {...register("email")}
            autoComplete="email"
            className="input-step"
            placeholder="prenom@email.com"
          />
        </Field>

        {/* Mot de passe optionnel */}
        <Field
          label="Mot de passe"
          helper="Optionnel si tu t’es connecté avec Google ou Apple."
          error={errors.password?.message as string | undefined}
        >
          <input
            type="password"
            {...register("password")}
            autoComplete="new-password"
            className="input-step"
            placeholder="Optionnel"
          />
        </Field>

        {/* Âge */}
        <Field
          label="Âge"
          required
          helper="Tu dois avoir au moins 28 ans."
          error={errors.age?.message as string | undefined}
        >
          <input
            type="number"
            {...register("age", { valueAsNumber: true })}
            min={28}
            max={120}
            className="input-step"
            placeholder="28"
          />
        </Field>
      </div>

      <style jsx global>{`
        .input-step {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.1);
          padding: 0.75rem 1rem;
          color: white;
          outline: none;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .input-step::placeholder {
          color: rgba(156, 163, 175, 1);
        }

        .input-step:focus {
          border-color: rgba(244, 114, 182, 1);
          box-shadow: 0 0 0 2px rgba(236, 72, 153, 0.3);
          background: rgba(255, 255, 255, 0.12);
        }

        @media (max-width: 420px) {
          .input-step {
            padding: 0.65rem 0.85rem;
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required = false,
  helper,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  helper?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-cream/90">
        {label} {required && <span className="text-orange">*</span>}
      </label>

      {children}

      {helper && <p className="mt-2 text-sm text-cream/70">{helper}</p>}

      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
