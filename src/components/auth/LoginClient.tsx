/**
 * Composant client de la page de connexion
 */

"use client";

import { useActionState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import FormInput from "@/components/form/FormInput";
import FormButton from "@/components/form/FormButton";
import FormError from "@/components/form/FormError";

/**
 * Composant principal de la page de connexion
 * Gère le formulaire de connexion et la redirection après authentification
 */
export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const { login, isLoading } = useAuth();

  const [state, formAction] = useActionState(
    async (
      prevState: { success: boolean; error: string | null },
      formData: FormData
    ) => {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      try {
        await login(email, password);
        router.push(redirectTo);
        return { success: true, error: null };
      } catch {
        return { success: false, error: "Email ou mot de passe incorrect" };
      }
    },
    { success: false, error: null }
  );

  return (
    <div className="min-h-screen bg-[#f6e6d1] flex flex-col justify-center sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md font-bagel">
        <h2 className="text-center text-4xl text-gray-900 font-bagel">
          Connexion
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          ou{" "}
          <Link
            href={`/user/signup${
              redirectTo !== "/dashboard"
                ? `?redirect=${encodeURIComponent(redirectTo)}`
                : ""
            }`}
            className="font-medium text-orange-900 hover:text-orange-950"
          >
            créez un nouveau compte
          </Link>
        </p>
      </div>

      {/* Formulaire de connexion */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" action={formAction}>
            <FormError error={state.error} />

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

            <FormButton
              type="submit"
              disabled={isLoading}
              isLoading={isLoading}
              className="w-full"
            >
              {isLoading ? "Connexion..." : "Se connecter"}
            </FormButton>
          </form>
        </div>
      </div>
    </div>
  );
}
