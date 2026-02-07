/**
 * Tests unitaires pour SignupClient
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupClient from "@/components/auth/SignupClient";
import { render as customRender } from "@/__tests__/setup/test-utils";
import { __resetAuthStateForTests } from "@/contexts/AuthContext";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), prefetch: jest.fn(), back: jest.fn(), pathname: "/", query: {}, asPath: "/" }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

describe("SignupClient", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    document.cookie = "";
    __resetAuthStateForTests();
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("devrait afficher le formulaire avec tous les champs", () => {
    customRender(<SignupClient />);

    expect(screen.getByRole("heading", { name: "Inscription" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom d'utilisateur/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Votre mot de passe")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirmez votre mot de passe")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Créer le compte" })).toBeInTheDocument();
  });

  it("devrait afficher le lien vers la page de connexion", () => {
    customRender(<SignupClient />);

    const link = screen.getByRole("link", { name: "connectez-vous à votre compte existant" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/user/login");
  });

  it("devrait afficher une erreur si les mots de passe ne correspondent pas", async () => {
    customRender(<SignupClient />);

    await userEvent.type(screen.getByLabelText(/Nom d'utilisateur/), "testuser");
    await userEvent.type(screen.getByLabelText(/Email/), "test@example.com");
    await userEvent.type(screen.getByPlaceholderText(/^Votre mot de passe$/), "password123");
    await userEvent.type(screen.getByPlaceholderText(/Confirmez votre mot de passe/), "different");
    await userEvent.click(screen.getByRole("button", { name: "Créer le compte" }));

    await waitFor(() => {
      expect(screen.getByText("Les mots de passe ne correspondent pas")).toBeInTheDocument();
    });
  });

  it("devrait soumettre le formulaire et rediriger après inscription réussie", async () => {
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

    customRender(<SignupClient />);

    await userEvent.type(screen.getByLabelText(/Nom d'utilisateur/), "testuser");
    await userEvent.type(screen.getByLabelText(/Email/), "test@example.com");
    await userEvent.type(screen.getByPlaceholderText(/^Votre mot de passe$/), "password123");
    await userEvent.type(screen.getByPlaceholderText(/Confirmez votre mot de passe/), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Créer le compte" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("devrait afficher une erreur en cas d'échec d'inscription", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({ ok: false });

    customRender(<SignupClient />);

    await userEvent.type(screen.getByLabelText(/Nom d'utilisateur/), "testuser");
    await userEvent.type(screen.getByLabelText(/Email/), "test@example.com");
    await userEvent.type(screen.getByPlaceholderText(/^Votre mot de passe$/), "password123");
    await userEvent.type(screen.getByPlaceholderText(/Confirmez votre mot de passe/), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Créer le compte" }));

    await waitFor(() => {
      expect(screen.getByText("Erreur lors de la création du compte")).toBeInTheDocument();
    });
  });
});
