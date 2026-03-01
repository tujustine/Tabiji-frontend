/**
 * Tests d'intégration - Auth (login, signup)
 * Teste les flows complets avec AuthProvider réel et fetch mocké.
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginClient from "@/components/auth/LoginClient";
import SignupClient from "@/components/auth/SignupClient";
import { render } from "@/__tests__/setup/test-utils";
import { __resetAuthStateForTests } from "@/contexts/AuthContext";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

function clearCookies() {
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0].trim();
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  });
}

describe("Auth Integration", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    clearCookies();
    __resetAuthStateForTests();
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    if (typeof originalFetch === "function") {
      globalThis.fetch = originalFetch;
    }
  });

  describe("Login flow", () => {
    it("devrait connecter l'utilisateur et rediriger vers le dashboard", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "user-1",
            username: "testuser",
            email: "test@example.com",
            token: "token-123",
          }),
      });

      render(<LoginClient />);

      await userEvent.type(screen.getByLabelText(/Email/), "test@example.com");
      await userEvent.type(screen.getByLabelText(/Mot de passe/), "password123");
      await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });

      // Vérifier que fetch a été appelé avec la bonne URL
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/user/login"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            email: "test@example.com",
            password: "password123",
          }),
        })
      );
    });

    it("devrait afficher une erreur en cas d'échec de connexion", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({ ok: false });

      render(<LoginClient />);

      await userEvent.type(screen.getByLabelText(/Email/), "bad@example.com");
      await userEvent.type(screen.getByLabelText(/Mot de passe/), "wrong");
      await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));

      await waitFor(() => {
        expect(screen.getByText("Email ou mot de passe incorrect")).toBeInTheDocument();
      });
    });
  });

  describe("Signup flow", () => {
    it("devrait créer un compte et rediriger vers le dashboard", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "user-1",
            username: "newuser",
            email: "new@example.com",
            token: "token-456",
          }),
      });

      render(<SignupClient />);

      await userEvent.type(screen.getByLabelText(/Nom d'utilisateur/), "newuser");
      await userEvent.type(screen.getByLabelText(/Email/), "new@example.com");
      await userEvent.type(screen.getByLabelText(/^Mot de passe/), "password123");
      await userEvent.type(
        screen.getByLabelText(/Confirmer le mot de passe/),
        "password123"
      );
      await userEvent.click(screen.getByRole("button", { name: "Créer le compte" }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/user/signup"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            username: "newuser",
            email: "new@example.com",
            password: "password123",
          }),
        })
      );
    });

    it("devrait afficher une erreur si les mots de passe ne correspondent pas", async () => {
      render(<SignupClient />);

      await userEvent.type(screen.getByLabelText(/Nom d'utilisateur/), "newuser");
      await userEvent.type(screen.getByLabelText(/Email/), "new@example.com");
      await userEvent.type(screen.getByLabelText(/^Mot de passe/), "password123");
      await userEvent.type(
        screen.getByLabelText(/Confirmer le mot de passe/),
        "different"
      );
      await userEvent.click(screen.getByRole("button", { name: "Créer le compte" }));

      await waitFor(() => {
        expect(screen.getByText("Les mots de passe ne correspondent pas")).toBeInTheDocument();
      });

      // L'API signup ne doit pas être appelée (validation côté client)
      const fetchCalls = (globalThis.fetch as jest.Mock).mock.calls;
      const signupCalls = fetchCalls.filter((c: unknown[]) =>
        String(c[0]).includes("/user/signup")
      );
      expect(signupCalls).toHaveLength(0);
    });

    it("devrait afficher une erreur en cas d'échec d'inscription", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({ ok: false });

      render(<SignupClient />);

      await userEvent.type(screen.getByLabelText(/Nom d'utilisateur/), "newuser");
      await userEvent.type(screen.getByLabelText(/Email/), "new@example.com");
      await userEvent.type(screen.getByLabelText(/^Mot de passe/), "password123");
      await userEvent.type(
        screen.getByLabelText(/Confirmer le mot de passe/),
        "password123"
      );
      await userEvent.click(screen.getByRole("button", { name: "Créer le compte" }));

      await waitFor(() => {
        expect(screen.getByText("Erreur lors de la création du compte")).toBeInTheDocument();
      });
    });
  });
});
