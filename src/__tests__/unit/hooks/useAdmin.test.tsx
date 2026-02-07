/**
 * Tests unitaires pour useAdmin
 */

import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth, __resetAuthStateForTests } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";

function wrapper({ children }: { readonly children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("useAdmin", () => {
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

  it("devrait lever une erreur pour getStats sans token", async () => {
    const { result } = renderHook(() => useAdmin(), { wrapper });

    await expect(
      act(async () => {
        await result.current.getStats();
      })
    ).rejects.toThrow("Non authentifié");
  });

  it("devrait récupérer les stats avec un token valide", async () => {
    (globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "user-1",
            username: "admin",
            email: "admin@test.com",
            token: "token-123",
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            totalUsers: 10,
            totalTrips: 5,
            totalMemories: 20,
            totalMedia: 15,
            totalPlaces: 30,
            totalCollaborations: 2,
            newUsersLast30Days: 1,
            newTripsLast30Days: 0,
          }),
      });

    const { result } = renderHook(
      () => ({ auth: useAuth(), admin: useAdmin() }),
      { wrapper }
    );

    await act(async () => {
      await result.current.auth.login("admin@test.com", "password");
    });

    let stats: unknown;
    await act(async () => {
      stats = await result.current.admin.getStats();
    });

    expect(stats).toMatchObject({
      totalUsers: 10,
      totalTrips: 5,
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/admin\/stats$/),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token-123",
        }),
      })
    );
  });

  it("devrait gérer les erreurs API", async () => {
    (globalThis.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/user/login")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: "user-1",
              username: "admin",
              email: "admin@test.com",
              token: "token-123",
            }),
        });
      }
      if (url.includes("/admin/stats")) {
        return Promise.resolve({ ok: false });
      }
      return Promise.resolve({ ok: false });
    });

    const { result } = renderHook(
      () => ({ auth: useAuth(), admin: useAdmin() }),
      { wrapper }
    );

    await act(async () => {
      await result.current.auth.login("admin@test.com", "password");
    });

    await act(async () => {
      try {
        await result.current.admin.getStats();
      } catch {
        // getStats doit rejeter (API ok: false)
      }
    });

    await waitFor(() => {
      expect(result.current.admin.error).toBeTruthy();
    });
  });
});
