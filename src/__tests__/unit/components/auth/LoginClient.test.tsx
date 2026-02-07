/**
 * Tests unitaires pour LoginClient
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginClient from "@/components/auth/LoginClient";
import { render as customRender } from "@/__tests__/setup/test-utils";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), prefetch: jest.fn(), back: jest.fn(), pathname: "/", query: {}, asPath: "/" }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

describe("LoginClient", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    document.cookie = "";
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("devrait afficher le formulaire avec champs email et password", () => {
    customRender(<LoginClient />);

    expect(screen.getByRole("heading", { name: "Connexion" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mot de passe/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeInTheDocument();
  });

  it("devrait afficher le lien vers la page d'inscription", () => {
    customRender(<LoginClient />);

    const link = screen.getByRole("link", { name: "créez un nouveau compte" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/user/signup");
  });

  it("devrait soumettre le formulaire et rediriger après connexion réussie", async () => {
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

    customRender(<LoginClient />);

    await userEvent.type(screen.getByLabelText(/Email/), "test@example.com");
    await userEvent.type(screen.getByLabelText(/Mot de passe/), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("devrait afficher une erreur en cas d'échec d'authentification", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({ ok: false });

    customRender(<LoginClient />);

    await userEvent.type(screen.getByLabelText(/Email/), "test@example.com");
    await userEvent.type(screen.getByLabelText(/Mot de passe/), "wrongpassword");
    await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => {
      expect(screen.getByText("Email ou mot de passe incorrect")).toBeInTheDocument();
    });
  });

  it("devrait avoir un lien vers la page signup avec href correct", () => {
    customRender(<LoginClient />);

    const link = screen.getByRole("link", { name: "créez un nouveau compte" });
    expect(link).toHaveAttribute("href", "/user/signup");
  });
});
