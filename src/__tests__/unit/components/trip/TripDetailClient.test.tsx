/**
 * Tests unitaires pour TripDetailClient
 */

import { fireEvent, screen, waitFor } from "@testing-library/react";
import TripDetailClient from "@/components/trip/TripDetailClient";
import { render } from "@/__tests__/setup/test-utils";
import type { Trip } from "@/types";
import toast from "react-hot-toast";

const mockPush = jest.fn();
const mockRouter = jest.fn(() => ({
  push: mockPush,
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  pathname: "/",
  query: {},
  asPath: "/",
}));

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter(),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock des composants dynamiques
jest.mock("../../../../components/trip/TripMap", () => {
  return function MockTripMap() {
    return <div data-testid="trip-map">Carte</div>;
  };
});

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock(
  "@/hooks/useSocket",
  () => ({
    useSocket: () => ({
      socket: null,
      isConnected: false,
      error: null,
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    }),
  }),
  { virtual: true },
);

const mockTrip: Trip = {
  _id: "trip-123",
  title: "Voyage à Paris",
  description: "Un super voyage",
  destination: "Paris",
  startDate: "2025-01-01",
  endDate: "2025-01-07",
  image: "https://example.com/image.jpg",
  participants: [],
  memories: [],
  places: [],
  todoItems: [],
  daySchedule: [],
};

const mockTripResponse = (overrides = {}) => ({
  ok: true,
  json: async () => ({
    ...mockTrip,
    userPermissions: {
      role: "OWNER",
      canEdit: true,
      canDelete: true,
      canShare: true,
    },
    ...overrides,
  }),
});

const mockUserResponse = () => ({
  ok: true,
  json: async () => ({ id: "user-1" }),
});

// Helper functions to create mock responses
const createMockResponse = (data: unknown) => ({
  ok: true,
  json: () => Promise.resolve(data),
});

describe("TripDetailClient", () => {
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
    document.cookie = `user=${JSON.stringify({
      id: "user-1",
      username: "TestUser",
    })}; path=/`;

    // Mock de /user/me pour la vérification du token
    (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/user/me")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "user-1", username: "TestUser" }),
        });
      }
      return Promise.resolve({ ok: false });
    });
  };

  describe("Chargement du voyage", () => {
    it("devrait afficher un message de chargement initialement", () => {
      const neverResolvingPromise = new Promise(() => {});
      (globalThis.fetch as jest.Mock).mockImplementation(
        () => neverResolvingPromise
      );

      render(<TripDetailClient tripId="trip-123" />);

      expect(screen.getByText("Chargement du voyage...")).toBeInTheDocument();
    });

    it("devrait charger et afficher les données du voyage", async () => {
      setupAuthenticatedUser();

      (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/user/me")) {
          return Promise.resolve(mockUserResponse());
        }
        if (url.includes("/favorites") || url.includes("/user/favorites")) {
          return Promise.resolve(createMockResponse([]));
        }
        if (url.includes("/trip/trip-123")) {
          return Promise.resolve(mockTripResponse());
        }
        return Promise.resolve({ ok: false });
      });

      render(<TripDetailClient tripId="trip-123" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Voyage à Paris")).toBeInTheDocument();
      });
    });

    it("ne devrait pas rester bloqué sur chargement si le titre est vide", async () => {
      setupAuthenticatedUser();

      (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/user/me")) {
          return Promise.resolve(mockUserResponse());
        }
        if (url.includes("/favorites") || url.includes("/user/favorites")) {
          return Promise.resolve(createMockResponse([]));
        }
        if (url.includes("/trip/trip-123")) {
          return Promise.resolve(mockTripResponse({ title: "" }));
        }
        return Promise.resolve({ ok: false });
      });

      render(<TripDetailClient tripId="trip-123" />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Nom du voyage")
        ).toBeInTheDocument();
      });
    });

    it("devrait gérer les erreurs de chargement", async () => {
      setupAuthenticatedUser();

      (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/user/me")) {
          return Promise.resolve(mockUserResponse());
        }
        if (url.includes("/favorites") || url.includes("/user/favorites")) {
          return Promise.resolve(createMockResponse([]));
        }
        if (url.includes("/trip/trip-123")) {
          return Promise.resolve({
            ok: false,
            status: 404,
          });
        }
        return Promise.resolve({ ok: false });
      });

      render(<TripDetailClient tripId="trip-123" />);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalled();
      });
    });
  });

  describe("Affichage des informations", () => {
    beforeEach(() => {
      setupAuthenticatedUser();
      (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/user/me")) {
          return Promise.resolve(mockUserResponse());
        }
        if (url.includes("/favorites") || url.includes("/user/favorites")) {
          return Promise.resolve(createMockResponse([]));
        }
        if (url.includes("/trip/trip-123")) {
          return Promise.resolve(mockTripResponse());
        }
        return Promise.resolve({ ok: false });
      });
    });

    it("devrait afficher le titre du voyage", async () => {
      render(<TripDetailClient tripId="trip-123" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Voyage à Paris")).toBeInTheDocument();
      });
    });

    it("devrait afficher la section souvenirs", async () => {
      render(<TripDetailClient tripId="trip-123" />);

      await waitFor(() => {
        expect(screen.getByText("Souvenirs")).toBeInTheDocument();
      });
    });

    it("devrait afficher la section à faire", async () => {
      render(<TripDetailClient tripId="trip-123" />);

      await waitFor(() => {
        expect(screen.getByText("À faire")).toBeInTheDocument();
      });
    });

    it("devrait afficher la carte", async () => {
      render(<TripDetailClient tripId="trip-123" />);

      await waitFor(() => {
        expect(screen.getByTestId("trip-map")).toBeInTheDocument();
      });
    });
  });

  describe("Boutons d'action", () => {
    beforeEach(() => {
      setupAuthenticatedUser();
      (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/user/me")) {
          return Promise.resolve(mockUserResponse());
        }
        if (url.includes("/favorites") || url.includes("/user/favorites")) {
          return Promise.resolve(createMockResponse([]));
        }
        if (url.includes("/trip/trip-123")) {
          return Promise.resolve(mockTripResponse());
        }
        return Promise.resolve({ ok: false });
      });
    });

    it("devrait afficher le bouton Sauvegarder pour OWNER", async () => {
      render(<TripDetailClient tripId="trip-123" />);

      await waitFor(() => {
        expect(screen.getByText(/Sauvegarder/i)).toBeInTheDocument();
      });
    });

    it("devrait afficher le bouton Partager pour OWNER", async () => {
      render(<TripDetailClient tripId="trip-123" />);

      await waitFor(() => {
        expect(screen.getByText(/Partager/i)).toBeInTheDocument();
      });
    });

    it("devrait afficher le bouton Supprimer pour OWNER", async () => {
      render(<TripDetailClient tripId="trip-123" />);

      await waitFor(() => {
        expect(screen.getByText(/Supprimer/i)).toBeInTheDocument();
      });
    });

    it("devrait refuser la sauvegarde si le titre est vide", async () => {
      render(<TripDetailClient tripId="trip-123" />);

      const titleInput = await screen.findByDisplayValue("Voyage à Paris");
      fireEvent.change(titleInput, { target: { value: "" } });
      fireEvent.click(screen.getByText(/Sauvegarder/i));

      expect(toast.error).toHaveBeenCalledWith(
        "Le titre du voyage ne peut pas être vide"
      );
      expect(globalThis.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining("/trip/trip-123"),
        expect.objectContaining({ method: "PUT" })
      );
    });
  });

  describe("Permissions utilisateur", () => {
    it("ne devrait pas afficher les boutons d'édition pour VIEWER", async () => {
      setupAuthenticatedUser();

      (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/user/me")) {
          return Promise.resolve(mockUserResponse());
        }
        if (url.includes("/trip/trip-123")) {
          return Promise.resolve(
            mockTripResponse({
              userPermissions: {
                role: "VIEWER",
                canEdit: false,
                canDelete: false,
                canShare: false,
              },
            })
          );
        }
        return Promise.resolve({ ok: false });
      });

      render(<TripDetailClient tripId="trip-123" />);

      await waitFor(() => {
        expect(screen.queryByText(/Sauvegarder/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Supprimer/i)).not.toBeInTheDocument();
      });
    });

    it("devrait afficher le bouton Quitter pour les collaborateurs", async () => {
      setupAuthenticatedUser();

      (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/user/me")) {
          return Promise.resolve(mockUserResponse());
        }
        if (url.includes("/trip/trip-123")) {
          return Promise.resolve(
            mockTripResponse({
              userPermissions: {
                role: "EDITOR",
                canEdit: true,
                canDelete: false,
                canShare: false,
              },
              owner: {
                id: "owner-1",
                username: "owner",
                email: "owner@example.com",
              },
            })
          );
        }
        return Promise.resolve({ ok: false });
      });

      render(<TripDetailClient tripId="trip-123" />);

      await waitFor(() => {
        expect(screen.getByText(/Quitter/i)).toBeInTheDocument();
      });
    });
  });

  describe("Voyage sans souvenirs", () => {
    it("devrait afficher un message quand il n'y a pas de souvenirs", async () => {
      setupAuthenticatedUser();

      (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/user/me")) {
          return Promise.resolve(mockUserResponse());
        }
        if (url.includes("/trip/trip-123")) {
          return Promise.resolve(mockTripResponse({ memories: [] }));
        }
        return Promise.resolve({ ok: false });
      });

      render(<TripDetailClient tripId="trip-123" />);

      await waitFor(() => {
        expect(
          screen.getByText(/Aucun souvenir pour le moment/i)
        ).toBeInTheDocument();
      });
    });
  });
});
