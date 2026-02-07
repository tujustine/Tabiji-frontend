/**
 * Tests unitaires pour DashboardClient
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { render } from "@/__tests__/setup/test-utils";
import { __resetAuthStateForTests } from "@/contexts/AuthContext";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), prefetch: jest.fn(), back: jest.fn() }),
}));

const mockTrips = [
  {
    id: "trip-1",
    title: "Week-end Paris",
    startDate: "2026-03-01",
    endDate: "2026-03-03",
    image: "https://example.com/paris.jpg",
  },
  {
    id: "trip-2",
    _id: "trip-2",
    title: "Vacances Bretagne",
    startDate: "2026-01-10",
    endDate: "2026-01-17",
    image: "",
  },
];

const mockRecentTrips = [
  { id: "trip-1", viewedAt: "2026-02-01T10:00:00Z" },
  { id: "trip-2", viewedAt: "2026-02-02T10:00:00Z" },
];

// Helper functions to create mock responses
const createMockResponse = (data: unknown) => ({
  ok: true,
  json: () => Promise.resolve(data),
});

const createErrorResponse = () => ({ ok: false });

// Helper function to find POST calls
const findPostCalls = (mockCalls: unknown[][]) => {
  return mockCalls.filter((call) => {
    const options = call[1] as { method?: string } | undefined;
    return options?.method === "POST";
  });
};

describe("DashboardClient", () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    __resetAuthStateForTests();
    document.cookie = "";
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_API_URL: "http://localhost:4000",
      NEXT_PUBLIC_API_URL_FALLBACK: "http://localhost:4000",
    };
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
  });

  // Helper pour simuler un utilisateur connecté via les cookies
  const setupLoggedInUser = () => {
    const mockUser = { id: "user-1", username: "Marie", email: "marie@test.com" };
    document.cookie = `token=token-123; path=/`;
    document.cookie = `user=${JSON.stringify(mockUser)}; path=/`;

    (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/user/me")) {
        return Promise.resolve(createMockResponse(mockUser));
      }
      if (url.includes("/favorites") || url.includes("/user/favorites")) {
        return Promise.resolve(createMockResponse([]));
      }
      return Promise.resolve(createErrorResponse());
    });
  };

  describe("Affichage", () => {
    it("devrait afficher le message de bienvenue avec le nom d'utilisateur", async () => {
      setupLoggedInUser();

      (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/user/me")) {
          return Promise.resolve(createMockResponse({ id: "user-1", username: "Marie", email: "marie@test.com" }));
        }
        if (url.includes("/favorites") || url.includes("/user/favorites")) {
          return Promise.resolve(createMockResponse([]));
        }
        if (url.includes("/trips") && !url.includes("recent")) {
          return Promise.resolve(createMockResponse([]));
        }
        if (url.includes("/user/recent-trips")) {
          return Promise.resolve(createMockResponse([]));
        }
        return Promise.resolve(createErrorResponse());
      });

      render(<DashboardClient />);

      await waitFor(() => {
        expect(screen.getByText(/Bonjour @Marie/)).toBeInTheDocument();
      });
    });

    it("devrait afficher 'Utilisateur' quand l'utilisateur n'est pas connecté", () => {
      render(<DashboardClient />);

      expect(screen.getByText(/Bonjour @Utilisateur/)).toBeInTheDocument();
    });

    it("devrait afficher le bouton Nouveau voyage", async () => {
      setupLoggedInUser();

      (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/user/me")) {
          return Promise.resolve(createMockResponse({ id: "user-1", username: "Marie", email: "marie@test.com" }));
        }
        if (url.includes("/favorites") || url.includes("/user/favorites")) {
          return Promise.resolve(createMockResponse([]));
        }
        if (url.includes("/trips") && !url.includes("recent")) {
          return Promise.resolve(createMockResponse([]));
        }
        if (url.includes("/user/recent-trips")) {
          return Promise.resolve(createMockResponse([]));
        }
        return Promise.resolve(createErrorResponse());
      });

      render(<DashboardClient />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Nouveau voyage/ })).toBeInTheDocument();
      });
    });

    it("devrait afficher les trois sections (À venir, Vu récemment, Mes voyages)", async () => {
      setupLoggedInUser();

      (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/user/me")) {
          return Promise.resolve(createMockResponse({ id: "user-1", username: "Marie", email: "marie@test.com" }));
        }
        if (url.includes("/favorites") || url.includes("/user/favorites")) {
          return Promise.resolve(createMockResponse([]));
        }
        if (url.includes("/trips") && !url.includes("recent")) {
          return Promise.resolve(createMockResponse([]));
        }
        if (url.includes("/user/recent-trips")) {
          return Promise.resolve(createMockResponse([]));
        }
        return Promise.resolve(createErrorResponse());
      });

      render(<DashboardClient />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "À venir" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Vu récemment" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Mes voyages" })).toBeInTheDocument();
      });
    });
  });

  describe("Chargement des données", () => {
    it("devrait charger les voyages et les afficher dans les sections", async () => {
      setupLoggedInUser();

      (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/user/me")) {
          return Promise.resolve(createMockResponse({ id: "user-1", username: "Marie", email: "marie@test.com" }));
        }
        if (url.includes("/trips") && !url.includes("recent")) {
          return Promise.resolve(createMockResponse(mockTrips));
        }
        if (url.includes("/user/recent-trips")) {
          return Promise.resolve(createMockResponse(mockRecentTrips));
        }
        return Promise.resolve(createErrorResponse());
      });

      render(<DashboardClient />);

      await waitFor(() => {
        const parisTrips = screen.getAllByText("Week-end Paris");
        const bretagneTrips = screen.getAllByText("Vacances Bretagne");
        expect(parisTrips.length).toBeGreaterThan(0);
        expect(bretagneTrips.length).toBeGreaterThan(0);
      });
    });

    it("devrait afficher les messages vides quand il n'y a pas de voyages", async () => {
      setupLoggedInUser();

      (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/user/login")) {
          return Promise.resolve(createMockResponse({
            id: "user-1",
            username: "Marie",
            email: "marie@test.com",
            token: "token-123",
          }));
        }
        if (url.includes("/trips") && !url.includes("recent")) {
          return Promise.resolve(createMockResponse([]));
        }
        if (url.includes("/user/recent-trips")) {
          return Promise.resolve(createMockResponse([]));
        }
        return Promise.resolve({ ok: false });
      });

      render(<DashboardClient />);

      await waitFor(() => {
        expect(screen.getByText("Aucun voyage prévu pour le moment")).toBeInTheDocument();
        expect(screen.getByText("Aucun voyage récent")).toBeInTheDocument();
        expect(screen.getByText("Vous n'avez pas encore créé de voyage")).toBeInTheDocument();
      });
    });

    it("ne devrait pas appeler l'API des voyages sans token", async () => {
      render(<DashboardClient />);

      await waitFor(() => {
        expect(globalThis.fetch).not.toHaveBeenCalled();
      });
    });

    it("devrait gérer les erreurs de chargement des voyages", async () => {
      setupLoggedInUser();

      (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/user/me")) {
          return Promise.resolve(createMockResponse({ id: "user-1", username: "Marie", email: "marie@test.com" }));
        }
        if (url.includes("/trips") && !url.includes("recent")) {
          return Promise.resolve(createErrorResponse());
        }
        if (url.includes("/user/recent-trips")) {
          return Promise.resolve(createMockResponse([]));
        }
        return Promise.resolve({ ok: false });
      });

      render(<DashboardClient />);

      await waitFor(() => {
        expect(screen.getByText("Vous n'avez pas encore créé de voyage")).toBeInTheDocument();
      });
    });
  });

  describe("Création de voyage", () => {
    it("devrait créer un voyage et rediriger vers la page du voyage au clic sur Nouveau voyage", async () => {
      setupLoggedInUser();

      (globalThis.fetch as jest.Mock).mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes("/user/me")) {
          return Promise.resolve(createMockResponse({ id: "user-1", username: "Marie", email: "marie@test.com" }));
        }
        if (url.includes("/favorites") || url.includes("/user/favorites")) {
          return Promise.resolve(createMockResponse([]));
        }
        if (url.includes("/trips") && !url.includes("recent")) {
          return Promise.resolve(createMockResponse([]));
        }
        if (url.includes("/user/recent-trips")) {
          return Promise.resolve(createMockResponse([]));
        }
        if (url.endsWith("/trip") && options?.method === "POST") {
          return Promise.resolve(createMockResponse({ id: "new-trip-id" }));
        }
        return Promise.resolve({ ok: false });
      });

      render(<DashboardClient />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Nouveau voyage/ })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole("button", { name: /Nouveau voyage/ }));

      await waitFor(() => {
        const mockCalls = (globalThis.fetch as jest.Mock).mock.calls;
        const postCalls = findPostCalls(mockCalls);
        expect(postCalls.length).toBeGreaterThan(0);
        const options = postCalls[0][1] as { headers?: Record<string, string> };
        expect(options.headers).toEqual(
          expect.objectContaining({
            Authorization: "Bearer token-123",
            "Content-Type": "application/json",
          })
        );
        expect(mockPush).toHaveBeenCalledWith("/trips/new-trip-id");
      });
    });

    it("devrait désactiver le bouton pendant la création", async () => {
      setupLoggedInUser();

      let resolveCreate: (value: unknown) => void;
      const createPromise = new Promise((resolve) => {
        resolveCreate = resolve;
      });

      (globalThis.fetch as jest.Mock).mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes("/user/me")) {
          return Promise.resolve(createMockResponse({ id: "user-1", username: "Marie", email: "marie@test.com" }));
        }
        if (url.includes("/trips") && !url.includes("recent")) {
          return Promise.resolve(createMockResponse([]));
        }
        if (url.includes("/user/recent-trips")) {
          return Promise.resolve(createMockResponse([]));
        }
        if (url.endsWith("/trip") && options?.method === "POST") {
          return createPromise;
        }
        return Promise.resolve({ ok: false });
      });

      render(<DashboardClient />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Nouveau voyage/ })).toBeInTheDocument();
      });

      const button = screen.getByRole("button", { name: /Nouveau voyage/ });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Création en cours/ })).toBeInTheDocument();
      });

      resolveCreate!({
        ok: true,
        json: () => Promise.resolve({ id: "new-id" })
      });

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Nouveau voyage/ })).toBeInTheDocument();
      });
    });
  });
});
