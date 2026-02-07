/**
 * Tests unitaires pour AuthContext
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth, __resetAuthStateForTests } from "@/contexts/AuthContext";
import type { User } from "@/types";

const mockUser: User = {
  _id: "user-1",
  username: "testuser",
  email: "test@example.com",
  admin: false,
};

const mockToken = "mock-token-123";

// Helper functions to create mock responses
const renderUseAuthWithoutProvider = () => renderHook(() => useAuth());
const createMockResponse = (data: unknown) => ({
  ok: true,
  json: () => Promise.resolve(data),
});

const createErrorResponse = () => ({ ok: false });

function wrapper({ children }: { readonly children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthContext", () => {
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

  describe("login", () => {
    it("devrait connecter l'utilisateur avec succès", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse({
          id: mockUser._id,
          username: mockUser.username,
          email: mockUser.email,
          token: mockToken,
        })
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      expect(result.current.user).toEqual({
        ...mockUser,
        _id: mockUser._id,
      });
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isLoading).toBe(false);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "http://localhost:4000/user/login",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "test@example.com",
            password: "password123",
          }),
        })
      );
    });

    it("devrait rejeter en cas d'échec de connexion", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue(createErrorResponse());

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.login("test@example.com", "wrongpassword");
        })
      ).rejects.toThrow("Login failed");

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });
  });

  describe("signup", () => {
    it("devrait inscrire un nouvel utilisateur avec succès", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue(
        createMockResponse({
          id: mockUser._id,
          username: mockUser.username,
          email: mockUser.email,
          token: mockToken,
        })
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signup("testuser", "test@example.com", "password123");
      });

      expect(result.current.user).toBeTruthy();
      expect(result.current.user?.username).toBe("testuser");
      expect(result.current.user?.email).toBe("test@example.com");
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isLoading).toBe(false);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "http://localhost:4000/user/signup",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            username: "testuser",
            email: "test@example.com",
            password: "password123",
          }),
        })
      );
    });

    it("devrait rejeter en cas d'échec d'inscription", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue(createErrorResponse());

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.signup("testuser", "test@example.com", "password123");
        })
      ).rejects.toThrow("Signup failed");

      expect(result.current.user).toBeNull();
    });
  });

  describe("logout", () => {
    it("devrait déconnecter et nettoyer les cookies", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue(
        createMockResponse({
          id: mockUser._id,
          username: mockUser.username,
          email: mockUser.email,
          token: mockToken,
        })
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      expect(result.current.user).toBeTruthy();

      act(() => {
        result.current.logout();
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.token).toBeNull();
        expect(result.current.isLoggingOut).toBe(false);
      });

      expect(document.cookie).not.toMatch(/token=/);
      expect(document.cookie).not.toMatch(/user=/);
    });
  });

  describe("updateUser", () => {
    it("devrait mettre à jour le profil avec succès", async () => {
      let callCount = 0;
      (globalThis.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(createMockResponse({
            id: mockUser._id,
            username: mockUser.username,
            email: mockUser.email,
            token: mockToken,
          }));
        }
        return Promise.resolve(createMockResponse({
          id: mockUser._id,
          username: "newname",
          email: mockUser.email,
        }));
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      await act(async () => {
        await result.current.updateUser("newname");
      });

      expect(result.current.user?.username).toBe("newname");
      expect(globalThis.fetch).toHaveBeenLastCalledWith(
        "http://localhost:4000/user/update",
        expect.objectContaining({
          method: "PUT",
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
          body: JSON.stringify({ username: "newname" }),
        })
      );
    });

    it("devrait rejeter si pas de token", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.updateUser("newname");
        })
      ).rejects.toThrow("No token found");
    });
  });

  describe("uploadProfilePhoto", () => {
    it("devrait uploader la photo avec succès", async () => {
      let callCount = 0;
      (globalThis.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(createMockResponse({
            id: mockUser._id,
            username: mockUser.username,
            email: mockUser.email,
            token: mockToken,
          }));
        }
        return Promise.resolve(createMockResponse({
          id: mockUser._id,
          username: mockUser.username,
          email: mockUser.email,
          profilePhoto: "https://example.com/photo.jpg",
        }));
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });

      await act(async () => {
        await result.current.uploadProfilePhoto(file);
      });

      expect(result.current.user?.profilePhoto).toBe("https://example.com/photo.jpg");
      expect(globalThis.fetch).toHaveBeenLastCalledWith(
        "http://localhost:4000/user/upload-photo",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it("devrait rejeter si pas de token", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });

      await expect(
        act(async () => {
          await result.current.uploadProfilePhoto(file);
        })
      ).rejects.toThrow("No token found");
    });
  });

  describe("useAuth sans provider", () => {
    it("devrait lever une erreur si utilisé hors AuthProvider", () => {
      expect(() => renderUseAuthWithoutProvider()).toThrow(
        "useAuth must be used within an AuthProvider"
      );
    });
  });
});
