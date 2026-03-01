/**
 * Tests d'intégration - Trips (liste des voyages)
 * Teste le flow authentification + chargement des voyages avec AuthProvider réel.
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TripsClient from "@/components/trip/TripsClient";
import { render } from "@/__tests__/setup/test-utils";
import { __resetAuthStateForTests } from "@/contexts/AuthContext";

const mockTrips = [
  {
    id: "trip-1",
    title: "Voyage à Paris",
    startDate: "2025-01-01",
    endDate: "2025-01-07",
    image: "",
    ownerId: "user-1",
    owner: {
      id: "user-1",
      username: "traveler",
      email: "traveler@example.com",
    },
    collaborators: [],
  },
  {
    id: "trip-2",
    title: "Week-end Londres",
    startDate: "2025-02-01",
    endDate: "2025-02-03",
    image: "",
    ownerId: "user-1",
    owner: {
      id: "user-1",
      username: "traveler",
      email: "traveler@example.com",
    },
    collaborators: [],
  },
];

function clearCookies() {
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0].trim();
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  });
}

describe("Trips Integration", () => {
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
    };
  });

  afterEach(() => {
    if (typeof originalFetch === "function") {
      globalThis.fetch = originalFetch;
    }
    process.env = originalEnv;
  });

  function setupAuthenticatedUser(userId = "user-1", username = "traveler") {
    document.cookie = `token=mock-token-123; path=/`;
    document.cookie = `user=${JSON.stringify({
      _id: userId,
      username,
      email: "traveler@example.com",
    })}; path=/`;

    (globalThis.fetch as jest.Mock).mockImplementation(
      (input: string | URL | Request) => {
        let urlStr: string;
        if (typeof input === "string") {
          urlStr = input;
        } else if (input instanceof URL) {
          urlStr = input.toString();
        } else {
          urlStr = input.url;
        }

        const mkRes = (data: unknown, ok = true) => ({
          ok,
          status: ok ? 200 : 500,
          json: () => Promise.resolve(data),
          headers: new Headers(),
        });

        if (urlStr?.includes("/user/me")) {
          return Promise.resolve(
            mkRes({
              id: userId,
              _id: userId,
              username,
              email: "traveler@example.com",
              admin: false,
            })
          );
        }
        if (
          urlStr?.includes("/user/favorites") ||
          urlStr?.includes("/favorites")
        ) {
          return Promise.resolve(mkRes([]));
        }
        if (urlStr?.includes("/trips")) {
          return Promise.resolve(mkRes(mockTrips));
        }
        return Promise.resolve(mkRes({}, false));
      }
    );
  }

  it("devrait charger et afficher la liste des voyages pour un utilisateur connecté", async () => {
    setupAuthenticatedUser();

    render(<TripsClient />);

    await waitFor(() => {
      expect(screen.getByText("Voyage à Paris")).toBeInTheDocument();
      expect(screen.getByText("Week-end Londres")).toBeInTheDocument();
    });

    expect(screen.getByText("Mes voyages")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Rechercher un voyage...")
    ).toBeInTheDocument();
  });

  it("devrait filtrer les voyages selon la recherche", async () => {
    setupAuthenticatedUser();

    render(<TripsClient />);

    await waitFor(() => {
      expect(screen.getByText("Voyage à Paris")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Rechercher un voyage...");
    await userEvent.type(searchInput, "Paris");

    expect(screen.getByText("Voyage à Paris")).toBeInTheDocument();
    expect(screen.queryByText("Week-end Londres")).not.toBeInTheDocument();
  });

  it("devrait afficher un message si aucun voyage ne correspond à la recherche", async () => {
    setupAuthenticatedUser();

    render(<TripsClient />);

    await waitFor(() => {
      expect(screen.getByText("Voyage à Paris")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Rechercher un voyage...");
    await userEvent.type(searchInput, "Tokyo");

    await waitFor(() => {
      expect(
        screen.getByText("Aucun voyage trouvé pour votre recherche")
      ).toBeInTheDocument();
    });
  });

  it("devrait afficher la grille même sans voyages (utilisateur connecté)", async () => {
    setupAuthenticatedUser();
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
        if (urlStr.includes("/user/me")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: "user-1", username: "traveler" }),
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
        if (urlStr.includes("/trips")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
            headers: new Headers(),
          });
        }
        return Promise.resolve({ ok: false });
      }
    );

    render(<TripsClient />);

    await waitFor(() => {
      expect(screen.getByText("Mes voyages")).toBeInTheDocument();
    });

    // Le polaroid "Nouveau voyage" devrait être présent
    expect(screen.getByText("Nouveau voyage")).toBeInTheDocument();
  });
});
