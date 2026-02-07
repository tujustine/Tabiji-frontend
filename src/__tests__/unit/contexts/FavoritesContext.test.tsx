/**
 * Tests unitaires pour FavoritesContext
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth, __resetAuthStateForTests } from "@/contexts/AuthContext";
import { FavoritesProvider, useFavorites } from "@/contexts/FavoritesContext";

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_URL_FALLBACK ||
  "http://localhost:4000";

function wrapper({ children }: { readonly children: React.ReactNode }) {
  return (
    <AuthProvider>
      <FavoritesProvider>{children}</FavoritesProvider>
    </AuthProvider>
  );
}

// Helpers pour réduire l'imbrication dans les mocks
const createLoginResponse = () => ({
  ok: true,
  json: () =>
    Promise.resolve({
      id: "user-1",
      username: "testuser",
      email: "test@example.com",
      token: "token-123",
    }),
});

const createFavoritesResponse = (favorites: string[]) => ({
  ok: true,
  json: () => Promise.resolve(favorites),
});

function authOnlyWrapper({ children }: { readonly children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

function renderFavoritesHookWithoutProvider() {
  return renderHook(() => useFavorites(), { wrapper: authOnlyWrapper });
}

describe("FavoritesContext", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    __resetAuthStateForTests();
    document.cookie = "";
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("chargement des favoris", () => {
    it("devrait charger les favoris depuis l'API quand l'utilisateur est connecté", async () => {
      (globalThis.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: "user-1",
              username: "testuser",
              email: "test@example.com",
              token: "token-123",
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(["trip-1", "trip-2"]),
        });

      const { result } = renderHook(
        () => ({ auth: useAuth(), favorites: useFavorites() }),
        { wrapper }
      );

      await act(async () => {
        await result.current.auth.login("test@example.com", "password");
      });

      await waitFor(() => {
        expect(result.current.favorites.favorites).toEqual(["trip-1", "trip-2"]);
      });

      expect(result.current.favorites.isFavorite("trip-1")).toBe(true);
      expect(result.current.favorites.isFavorite("trip-2")).toBe(true);
      expect(result.current.favorites.isFavorite("trip-3")).toBe(false);
    });

    it("devrait vider les favoris quand l'utilisateur n'est pas connecté", async () => {
      const { result } = renderHook(() => useFavorites(), { wrapper });

      await waitFor(() => {
        expect(result.current.favorites).toEqual([]);
      });
      expect(result.current.isFavorite("trip-1")).toBe(false);
    });
  });

  describe("toggleFavorite", () => {
    it("devrait ajouter un favori avec succès", async () => {
      (globalThis.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: "user-1",
              username: "testuser",
              email: "test@example.com",
              token: "token-123",
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(["trip-1"]),
        })
        .mockResolvedValueOnce({
          ok: true,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(["trip-1", "trip-2"]),
        });

      const { result } = renderHook(
        () => ({ auth: useAuth(), favorites: useFavorites() }),
        { wrapper }
      );

      await act(async () => {
        await result.current.auth.login("test@example.com", "password");
      });

      await waitFor(() => {
        expect(result.current.favorites.favorites).toContain("trip-1");
      });

      await act(async () => {
        result.current.favorites.toggleFavorite("trip-2");
      });

      await waitFor(() => {
        expect(result.current.favorites.favorites).toContain("trip-2");
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${apiUrl}/user/favorites/trip-2`,
        expect.objectContaining({
          method: "POST",
          headers: { Authorization: "Bearer token-123" },
        })
      );
    });

    it("devrait retirer un favori avec succès", async () => {
      let favoritesCallCount = 0;
      const createFavoritesResponseWithCount = () => {
        favoritesCallCount++;
        return createFavoritesResponse(
          favoritesCallCount === 1 ? ["trip-1", "trip-2"] : ["trip-1"]
        );
      };

      (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/user/login")) {
          return Promise.resolve(createLoginResponse());
        }
        if (url.includes("/user/favorites/trip-2")) {
          return Promise.resolve({ ok: true });
        }
        if (url.includes("/user/favorites")) {
          return Promise.resolve(createFavoritesResponseWithCount());
        }
        return Promise.resolve({ ok: false });
      });

      const { result } = renderHook(
        () => ({ auth: useAuth(), favorites: useFavorites() }),
        { wrapper }
      );

      await act(async () => {
        await result.current.auth.login("test@example.com", "password");
      });

      await waitFor(
        () => {
          expect(result.current.favorites.favorites).toContain("trip-2");
        },
        { timeout: 2000 }
      );

      await act(async () => {
        result.current.favorites.toggleFavorite("trip-2");
      });

      await waitFor(() => {
        expect(result.current.favorites.favorites).not.toContain("trip-2");
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${apiUrl}/user/favorites/trip-2`,
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });

    it("devrait faire un rollback en cas d'erreur API", async () => {
      (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/user/login")) {
          return Promise.resolve(createLoginResponse());
        }
        if (url.includes("/user/favorites/trip-2")) {
          return Promise.resolve({ ok: false });
        }
        if (url.includes("/user/favorites")) {
          return Promise.resolve(createFavoritesResponse(["trip-1"]));
        }
        return Promise.resolve({ ok: false });
      });

      const { result } = renderHook(
        () => ({ auth: useAuth(), favorites: useFavorites() }),
        { wrapper }
      );

      await act(async () => {
        await result.current.auth.login("test@example.com", "password");
      });

      await waitFor(
        () => {
          expect(result.current.favorites.favorites).toEqual(["trip-1"]);
        },
        { timeout: 2000 }
      );

      await act(async () => {
        result.current.favorites.toggleFavorite("trip-2");
      });

      await waitFor(() => {
        expect(result.current.favorites.favorites).toEqual(["trip-1"]);
      });
    });

    it("ne devrait rien faire si tripId invalide", async () => {
      const fetchMock = jest.fn();
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: "user-1",
              username: "testuser",
              email: "test@example.com",
              token: "token-123",
            }),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve([]),
        });
      globalThis.fetch = fetchMock;

      const { result } = renderHook(
        () => ({ auth: useAuth(), favorites: useFavorites() }),
        { wrapper }
      );

      await act(async () => {
        await result.current.auth.login("test@example.com", "password");
      });

      await waitFor(() => {
        expect(result.current.favorites.isLoading).toBe(false);
      });

      const callCountBefore = fetchMock.mock.calls.length;

      await act(async () => {
        result.current.favorites.toggleFavorite("");
      });

      expect(fetchMock.mock.calls.length).toBe(callCountBefore);
    });
  });

  describe("isFavorite", () => {
    it("devrait retourner false pour tripId invalide", async () => {
      const { result } = renderHook(() => useFavorites(), { wrapper });

      expect(result.current.isFavorite("")).toBe(false);
      expect(result.current.isFavorite("undefined")).toBe(false);
    });
  });

  describe("useFavorites sans provider", () => {
    it("devrait lever une erreur si utilisé hors FavoritesProvider", () => {
      expect(renderFavoritesHookWithoutProvider).toThrow(
        "useFavorites must be used within a FavoritesProvider"
      );
    });
  });
});
