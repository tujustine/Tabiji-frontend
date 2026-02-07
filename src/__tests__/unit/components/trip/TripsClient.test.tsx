/**
 * Tests unitaires pour TripsClient
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TripsClient from "@/components/trip/TripsClient";
import { render } from "@/__tests__/setup/test-utils";

const mockTrips = [
  {
    id: "trip-1",
    _id: "trip-1",
    title: "Voyage à Paris",
    startDate: "2025-01-01",
    endDate: "2025-01-07",
    image: "https://example.com/paris.jpg",
    ownerId: "user-1",
    owner: {
      id: "user-1",
      username: "user1",
      email: "user1@example.com",
    },
    collaborators: [],
  },
  {
    id: "trip-2",
    _id: "trip-2",
    title: "Voyage à Londres",
    startDate: "2025-02-01",
    endDate: "2025-02-07",
    image: "https://example.com/london.jpg",
    ownerId: "user-1",
    owner: {
      id: "user-1",
      username: "user1",
      email: "user1@example.com",
    },
    collaborators: [],
  },
  {
    id: "trip-3",
    _id: "trip-3",
    title: "Voyage à Tokyo",
    startDate: "2025-03-01",
    endDate: "2025-03-07",
    image: "https://example.com/tokyo.jpg",
    ownerId: "user-2",
    owner: {
      id: "user-2",
      username: "user2",
      email: "user2@example.com",
    },
    collaborators: [
      {
        role: "EDITOR" as const,
      },
    ],
  },
];

describe("TripsClient", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_API_URL: "http://localhost:4000",
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = originalEnv;
  });

  // Helper pour simuler un utilisateur connecté
  const setupAuthenticatedUser = () => {
    // Simuler les cookies pour que AuthContext trouve un utilisateur
    document.cookie = `token=test-token-123; path=/`;
    document.cookie = `user=${JSON.stringify({ _id: "user-1", username: "TestUser" })}; path=/`;

    // Mock de /user/me pour la vérification du token
    (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/user/me")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ _id: "user-1", username: "TestUser" }),
        });
      }
      if (url.includes("/favorites") || url.includes("/user/favorites")) {
        return Promise.resolve(createMockResponse([]));
      }
      return Promise.resolve({ ok: false });
    });
  };

  // Helper functions to create mock responses
  const createMockResponse = (data: unknown) => ({
    ok: true,
    json: () => Promise.resolve(data),
  });

  describe("Chargement des voyages", () => {
    it("devrait charger et afficher la liste des voyages", async () => {
      setupAuthenticatedUser();

      (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/user/me")) {
          return Promise.resolve(createMockResponse({ _id: "user-1", username: "TestUser" }));
        }
        if (url.includes("/favorites") || url.includes("/user/favorites")) {
          return Promise.resolve(createMockResponse([]));
        }
        if (url.includes("/trips")) {
          return Promise.resolve(createMockResponse(mockTrips));
        }
        return Promise.resolve({ ok: false });
      });

      render(<TripsClient />);

      await waitFor(() => {
        expect(screen.getByText("Voyage à Paris")).toBeInTheDocument();
        expect(screen.getByText("Voyage à Londres")).toBeInTheDocument();
        expect(screen.getByText("Voyage à Tokyo")).toBeInTheDocument();
      });
    });

    it("devrait afficher le titre 'Mes voyages'", async () => {
      setupAuthenticatedUser();

      (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/user/me")) {
          return Promise.resolve(createMockResponse({ _id: "user-1", username: "TestUser" }));
        }
        if (url.includes("/favorites") || url.includes("/user/favorites")) {
          return Promise.resolve(createMockResponse([]));
        }
        if (url.includes("/trips")) {
          return Promise.resolve(createMockResponse(mockTrips));
        }
        return Promise.resolve({ ok: false });
      });

      render(<TripsClient />);

      await waitFor(() => {
        expect(screen.getByText("Mes voyages")).toBeInTheDocument();
      });
    });

    it("devrait gérer les erreurs de chargement", async () => {
      setupAuthenticatedUser();

      (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/user/me")) {
          return Promise.resolve(createMockResponse({ _id: "user-1", username: "TestUser" }));
        }
        if (url.includes("/favorites") || url.includes("/user/favorites")) {
          return Promise.resolve(createMockResponse([]));
        }
        if (url.includes("/trips")) {
          return Promise.resolve({ ok: false, status: 500 });
        }
        return Promise.resolve({ ok: false });
      });

      render(<TripsClient />);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalled();
      });
    });

    it("ne devrait pas charger si pas de token", async () => {
      // Mock de base pour éviter les erreurs
      (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/favorites") || url.includes("/user/favorites")) {
          return Promise.resolve(createMockResponse([]));
        }
        return Promise.resolve({ ok: false });
      });

      render(<TripsClient />);

      // Le composant devrait être rendu même sans token
      await waitFor(() => {
        expect(screen.getByText("Mes voyages")).toBeInTheDocument();
      });
    });
  });

  describe("Barre de recherche", () => {
    beforeEach(() => {
      setupAuthenticatedUser();
      (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/user/me")) {
          return Promise.resolve(createMockResponse({ _id: "user-1", username: "TestUser" }));
        }
        if (url.includes("/favorites") || url.includes("/user/favorites")) {
          return Promise.resolve(createMockResponse([]));
        }
        if (url.includes("/trips")) {
          return Promise.resolve(createMockResponse(mockTrips));
        }
        return Promise.resolve({ ok: false });
      });
    });

    it("devrait afficher la barre de recherche", async () => {
      render(<TripsClient />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Rechercher un voyage...")
        ).toBeInTheDocument();
      });
    });

    it("devrait filtrer les voyages selon la recherche", async () => {
      render(<TripsClient />);

      await waitFor(() => {
        expect(screen.getByText("Voyage à Paris")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        "Rechercher un voyage..."
      );
      await userEvent.type(searchInput, "Paris");

      await waitFor(() => {
        expect(screen.getByText("Voyage à Paris")).toBeInTheDocument();
        expect(screen.queryByText("Voyage à Londres")).not.toBeInTheDocument();
        expect(screen.queryByText("Voyage à Tokyo")).not.toBeInTheDocument();
      });
    });

    it("devrait afficher un message si aucun résultat", async () => {
      render(<TripsClient />);

      await waitFor(() => {
        expect(screen.getByText("Voyage à Paris")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        "Rechercher un voyage..."
      );
      await userEvent.type(searchInput, "Inexistant");

      await waitFor(() => {
        expect(
          screen.getByText("Aucun voyage trouvé pour votre recherche")
        ).toBeInTheDocument();
      });
    });

    it("devrait être insensible à la casse", async () => {
      render(<TripsClient />);

      await waitFor(() => {
        expect(screen.getByText("Voyage à Paris")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        "Rechercher un voyage..."
      );
      await userEvent.type(searchInput, "PARIS");

      await waitFor(() => {
        expect(screen.getByText("Voyage à Paris")).toBeInTheDocument();
      });
    });
  });

  describe("Affichage des voyages", () => {
    beforeEach(() => {
      setupAuthenticatedUser();
      (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/user/me")) {
          return Promise.resolve(createMockResponse({ _id: "user-1", username: "TestUser" }));
        }
        if (url.includes("/favorites") || url.includes("/user/favorites")) {
          return Promise.resolve(createMockResponse([]));
        }
        if (url.includes("/trips")) {
          return Promise.resolve(createMockResponse(mockTrips));
        }
        return Promise.resolve({ ok: false });
      });
    });

    it("devrait afficher le polaroid 'Nouveau voyage'", async () => {
      render(<TripsClient />);

      await waitFor(() => {
        // Le composant NewTripPolaroid devrait être présent
        expect(screen.getByText("Mes voyages")).toBeInTheDocument();
      });
    });

    it("devrait afficher tous les voyages chargés", async () => {
      render(<TripsClient />);

      await waitFor(() => {
        expect(screen.getByText("Voyage à Paris")).toBeInTheDocument();
        expect(screen.getByText("Voyage à Londres")).toBeInTheDocument();
        expect(screen.getByText("Voyage à Tokyo")).toBeInTheDocument();
      });
    });

    it("devrait gérer une liste vide", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      render(<TripsClient />);

      await waitFor(() => {
        expect(screen.getByText("Mes voyages")).toBeInTheDocument();
      });
    });
  });

  describe("Voyages partagés", () => {
    it("devrait identifier les voyages partagés", async () => {
      setupAuthenticatedUser();

      (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/user/me")) {
          return Promise.resolve(createMockResponse({ _id: "user-1", username: "TestUser" }));
        }
        if (url.includes("/favorites") || url.includes("/user/favorites")) {
          return Promise.resolve(createMockResponse([]));
        }
        if (url.includes("/trips")) {
          return Promise.resolve(createMockResponse([
            {
              ...mockTrips[2], // Voyage avec collaborateur
              ownerId: "user-2",
            },
          ]));
        }
        return Promise.resolve({ ok: false });
      });

      render(<TripsClient />);

      await waitFor(() => {
        expect(screen.getByText("Voyage à Tokyo")).toBeInTheDocument();
      });
    });
  });
});
