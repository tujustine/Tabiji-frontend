/**
 * Helper pour mocker l'authentification dans les tests
 */

import type { User, AuthContextType } from "@/types";

export const mockUser: User = {
  _id: "user-1",
  username: "testuser",
  email: "test@example.com",
  admin: false,
  profilePhoto: undefined,
};

export const mockToken = "mock-jwt-token-123";

export const mockAuthContextValue: AuthContextType = {
  user: mockUser,
  token: mockToken,
  login: jest.fn().mockResolvedValue(undefined),
  logout: jest.fn(),
  signup: jest.fn().mockResolvedValue(undefined),
  updateUser: jest.fn().mockResolvedValue(undefined),
  uploadProfilePhoto: jest.fn().mockResolvedValue(undefined),
  isLoading: false,
  isLoggingOut: false,
  isInitialized: true,
};

export const mockAuthContextValueLoading: AuthContextType = {
  ...mockAuthContextValue,
  isLoading: true,
};

export const mockAuthContextValueNotAuthenticated: AuthContextType = {
  ...mockAuthContextValue,
  user: null,
  token: null,
  isInitialized: true,
};

export function createMockAuth(overrides: Partial<AuthContextType> = {}): AuthContextType {
  return {
    ...mockAuthContextValue,
    ...overrides,
  };
}
