/**
 * Wrapper React pour les tests avec les providers (AuthProvider, FavoritesProvider)
 */

import React, { ReactElement, ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { AuthProvider } from "@/contexts/AuthContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";

interface AllProvidersProps {
  readonly children: ReactNode;
}

function AllProviders({ children }: Readonly<AllProvidersProps>) {
  return (
    <AuthProvider>
      <FavoritesProvider>{children}</FavoritesProvider>
    </AuthProvider>
  );
}

function AuthOnlyProvider({ children }: Readonly<AllProvidersProps>) {
  return <AuthProvider>{children}</AuthProvider>;
}

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  wrapper?: React.ComponentType<{ children: ReactNode }>;
  withFavorites?: boolean;
}

function customRender(ui: ReactElement, options: CustomRenderOptions = {}) {
  const { withFavorites = true, wrapper: CustomWrapper, ...renderOptions } = options;

  const Wrapper = CustomWrapper ?? (withFavorites ? AllProviders : AuthOnlyProvider);

  return render(ui, {
    ...renderOptions,
    wrapper: Wrapper,
  });
}

export * from "@testing-library/react";
export { customRender as render };
