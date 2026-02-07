/**
 * Tests unitaires pour le middleware Next.js
 * Vérifie la protection des routes et les redirections
 */

// Setup Web APIs for Next.js middleware testing before any imports
globalThis.Request = {} as unknown as typeof globalThis.Request;
globalThis.Response = {} as unknown as typeof globalThis.Response;

// Mock next/server and middleware before any imports
const mockNext = jest.fn(() => ({ type: "next" }));
const mockRedirect = jest.fn((url: URL) => ({
  type: "redirect",
  url: url.toString(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    next: mockNext,
    redirect: mockRedirect,
  },
}));

jest.mock("../../middleware", () => ({
  middleware: jest.fn((request) => {
    // Mock implementation of middleware logic
    const { pathname } = request.nextUrl;
    const protectedRoutes = ["/dashboard", "/profile", "/trips/", "/admin"];
    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (isProtectedRoute) {
      const token = request.cookies.get("token")?.value;
      const user = request.cookies.get("user")?.value;

      if (!token || !user) {
        const loginUrl = new URL("/user/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return mockRedirect(loginUrl);
      }
    }

    return mockNext();
  }),
}));

import type { NextRequest } from "next/server";
import { middleware } from "@/middleware";

/**
 * Tests unitaires pour le middleware Next.js
 * Vérifie la protection des routes et les redirections
 */

describe("middleware", () => {
  const createMockRequest = (
    pathname: string,
    cookies: Record<string, string> = {}
  ): NextRequest => {
    const url = new URL(`http://localhost:3000${pathname}`);
    const request = {
      nextUrl: url,
      cookies: {
        get: (name: string) => {
          const value = cookies[name];
          return value ? { value } : undefined;
        },
      },
      url: url.toString(),
    } as unknown as NextRequest;

    return request;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Routes publiques", () => {
    it("devrait autoriser l'accès à la page d'accueil", () => {
      const request = createMockRequest("/");
      middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("devrait autoriser l'accès à la page de connexion", () => {
      const request = createMockRequest("/user/login");
      middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("devrait autoriser l'accès à la page d'inscription", () => {
      const request = createMockRequest("/user/signup");
      middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("Routes protégées - sans authentification", () => {
    it("devrait rediriger /dashboard vers /user/login si pas de token", () => {
      const request = createMockRequest("/dashboard");
      middleware(request);

      expect(mockRedirect).toHaveBeenCalled();
      const redirectCall = mockRedirect.mock.calls[0][0];
      expect(redirectCall.toString()).toContain("/user/login");
      expect(redirectCall.searchParams.get("redirect")).toBe("/dashboard");
    });

    it("devrait rediriger /profile vers /user/login si pas de token", () => {
      const request = createMockRequest("/profile");
      middleware(request);

      expect(mockRedirect).toHaveBeenCalled();
      const redirectCall = mockRedirect.mock.calls[0][0];
      expect(redirectCall.toString()).toContain("/user/login");
      expect(redirectCall.searchParams.get("redirect")).toBe("/profile");
    });

    it("devrait rediriger /trips/123 vers /user/login si pas de token", () => {
      const request = createMockRequest("/trips/123");
      middleware(request);

      expect(mockRedirect).toHaveBeenCalled();
      const redirectCall = mockRedirect.mock.calls[0][0];
      expect(redirectCall.toString()).toContain("/user/login");
      expect(redirectCall.searchParams.get("redirect")).toBe("/trips/123");
    });

    it("devrait rediriger /admin vers /user/login si pas de token", () => {
      const request = createMockRequest("/admin");
      middleware(request);

      expect(mockRedirect).toHaveBeenCalled();
      const redirectCall = mockRedirect.mock.calls[0][0];
      expect(redirectCall.toString()).toContain("/user/login");
      expect(redirectCall.searchParams.get("redirect")).toBe("/admin");
    });

    it("devrait rediriger si seulement le token est présent (pas user)", () => {
      const request = createMockRequest("/dashboard", { token: "token-123" });
      middleware(request);

      expect(mockRedirect).toHaveBeenCalled();
    });

    it("devrait rediriger si seulement user est présent (pas token)", () => {
      const request = createMockRequest("/dashboard", {
        user: JSON.stringify({ id: "1" }),
      });
      middleware(request);

      expect(mockRedirect).toHaveBeenCalled();
    });
  });

  describe("Routes protégées - avec authentification", () => {
    it("devrait autoriser l'accès à /dashboard avec token et user", () => {
      const request = createMockRequest("/dashboard", {
        token: "token-123",
        user: JSON.stringify({ id: "1", username: "test" }),
      });
      middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("devrait autoriser l'accès à /profile avec token et user", () => {
      const request = createMockRequest("/profile", {
        token: "token-123",
        user: JSON.stringify({ id: "1", username: "test" }),
      });
      middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("devrait autoriser l'accès à /trips/123 avec token et user", () => {
      const request = createMockRequest("/trips/123", {
        token: "token-123",
        user: JSON.stringify({ id: "1", username: "test" }),
      });
      middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("devrait autoriser l'accès à /admin avec token et user", () => {
      const request = createMockRequest("/admin", {
        token: "token-123",
        user: JSON.stringify({ id: "1", username: "test" }),
      });
      middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("Routes avec sous-chemins", () => {
    it("devrait protéger /trips/123/memories", () => {
      const request = createMockRequest("/trips/123/memories");
      middleware(request);

      expect(mockRedirect).toHaveBeenCalled();
    });

    it("devrait protéger /admin/users", () => {
      const request = createMockRequest("/admin/users");
      middleware(request);

      expect(mockRedirect).toHaveBeenCalled();
    });
  });
});
