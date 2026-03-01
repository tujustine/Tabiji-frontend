/**
 * Tests d'intégration - Page partagée (shared)
 * Teste le chargement d'une invitation et le flow "rejoindre" avec fetch mocké.
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SharedTripPage from "@/app/shared/[token]/page";
import { render } from "@/__tests__/setup/test-utils";
import { __resetAuthStateForTests } from "@/contexts/AuthContext";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: "/shared/xxx",
    query: {},
    asPath: "/shared/xxx",
  }),
  usePathname: () => "/shared/xxx",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ token: "share-token-123" }),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

function clearCookies() {
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0].trim();
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  });
}

describe("Shared Page Integration", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    clearCookies();
    __resetAuthStateForTests();
    globalThis.fetch = jest.fn();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_API_URL: "http://localhost:4000",
      NEXT_PUBLIC_API_URL_FALLBACK: "http://localhost:4000",
    };
  });

  afterEach(() => {
    if (typeof originalFetch === "function") {
      globalThis.fetch = originalFetch;
    }
    process.env = originalEnv;
  });

  const mockShareInfo = {
    trip: {
      id: "trip-1",
      title: "Voyage à Paris",
      image: "",
      owner: {
        id: "owner-1",
        username: "alice",
        email: "alice@example.com",
      },
      shareRole: "VIEWER" as const,
    },
  };

  it("devrait afficher les informations du voyage partagé", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockShareInfo),
      headers: new Headers(),
    });

    render(<SharedTripPage />);

    await waitFor(() => {
      expect(screen.getByText("alice")).toBeInTheDocument();
      expect(
        screen.getByText(
          /souhaite partager avec vous son voyage "Voyage à Paris"/
        )
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: "Rejoindre ce voyage" })
    ).toBeInTheDocument();
  });

  it("devrait afficher 'collaborer' pour un rôle EDITOR", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          ...mockShareInfo,
          trip: { ...mockShareInfo.trip, shareRole: "EDITOR" },
        }),
      headers: new Headers(),
    });

    render(<SharedTripPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          /souhaite collaborer avec vous pour le voyage "Voyage à Paris"/
        )
      ).toBeInTheDocument();
    });
  });

  it("devrait rediriger vers login si non connecté et clic sur Rejoindre", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockShareInfo),
      headers: new Headers(),
    });

    render(<SharedTripPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Rejoindre ce voyage" })
      ).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole("button", { name: "Rejoindre ce voyage" })
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/user/login?redirect=/shared/share-token-123"
      );
    });
  });

  it("devrait appeler l'API join et rediriger vers /trips si connecté", async () => {
    document.cookie = `token=mock-token; path=/`;
    document.cookie = `user=${JSON.stringify({
      _id: "user-1",
      username: "bob",
      email: "bob@example.com",
    })}; path=/`;

    (globalThis.fetch as jest.Mock).mockImplementation(
      (url: string | URL | Request) => {
        let urlStr: string;
        if (typeof url === "string") {
          urlStr = url;
        } else if (url instanceof URL) {
          urlStr = url.toString();
        } else {
          urlStr = url.url;
        }

        if (urlStr.includes("/share/share-token-123/info")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockShareInfo),
            headers: new Headers(),
          });
        }
        if (urlStr.includes("/share/share-token-123/join")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ message: "Voyage ajouté" }),
            headers: new Headers(),
          });
        }
        if (urlStr.includes("/user/me")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                id: "user-1",
                username: "bob",
                email: "bob@example.com",
              }),
            headers: new Headers(),
          });
        }
        if (urlStr.includes("/favorites")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
            headers: new Headers(),
          });
        }
        return Promise.resolve({ ok: false });
      }
    );

    render(<SharedTripPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Rejoindre ce voyage" })
      ).toBeInTheDocument();
    });

    await userEvent.click(
      screen.getByRole("button", { name: "Rejoindre ce voyage" })
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/trips");
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/share/share-token-123/join"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer mock-token",
        }),
      })
    );
  });

  it("devrait afficher une erreur si le lien n'existe pas", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({}),
      headers: new Headers(),
    });

    render(<SharedTripPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Lien de partage non trouvé")
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("link", { name: /Retour à l'accueil/ })
    ).toHaveAttribute("href", "/");
  });
});
