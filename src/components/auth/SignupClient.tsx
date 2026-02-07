/**
 * Composant client de la page d'inscription
 */

"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import FormInput from "@/components/form/FormInput";
import FormButton from "@/components/form/FormButton";
import FormError from "@/components/form/FormError";

/**
 * Composant principal de la page d'inscription
 * Gère le formulaire de création de compte
 */
export default function SignupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const { signup, isLoading, user } = useAuth();
  const [state, formAction] = useActionState(
    async (
      prevState: { success: boolean; error: string | null },
      formData: FormData
    ) => {
      const username = formData.get("username") as string;
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      if (password !== confirmPassword) {
        return {
          success: false,
          error: "Les mots de passe ne correspondent pas",
        };
      }

      try {
        await signup(username, email, password);
        return { success: true, error: null };
      } catch {
        return {
          success: false,
          error: "Erreur lors de la création du compte",
        };
      }
    },
    { success: false, error: null }
  );

  // Redirection après inscription réussie
  useEffect(() => {
    if (state.success && user) {
      router.push(redirectTo);
    }
  }, [state.success, user, router, redirectTo]);

  return (
    <div className="min-h-screen bg-[#f6e6d1] flex flex-col justify-center sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md font-bagel">
        <h2 className="text-center text-4xl text-gray-900 font-bagel">
          Inscription
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          ou{" "}
          <Link
            href={`/user/login${
              redirectTo !== "/dashboard"
                ? `?redirect=${encodeURIComponent(redirectTo)}`
                : ""
            }`}
            className="font-medium text-orange-900 hover:text-orange-950"
          >
            connectez-vous à votre compte existant
          </Link>
        </p>
      </div>

      {/* Formulaire d'inscription */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" action={formAction}>
            <FormError error={state.error} />

            <FormInput
              label="Nom d'utilisateur"
              id="username"
              name="username"
              type="text"
              required
              placeholder="Votre nom d'utilisateur"
            />

            <FormInput
              label="Email"
              id="email"
              name="email"
              type="email"
              required
              placeholder="votre@email.com"
            />

            <FormInput
              label="Mot de passe"
              id="password"
              name="password"
              type="password"
              required
              placeholder="Votre mot de passe"
            />

            <FormInput
              label="Confirmer le mot de passe"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              placeholder="Confirmez votre mot de passe"
            />

            <FormButton
              type="submit"
              disabled={isLoading}
              isLoading={isLoading}
              className="w-full"
            >
              {isLoading ? "Création..." : "Créer le compte"}
            </FormButton>
          </form>
        </div>
      </div>
    </div>
  );
}
