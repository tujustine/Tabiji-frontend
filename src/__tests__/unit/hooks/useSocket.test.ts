/**
 * Tests unitaires pour useSocket
 */

import { renderHook } from "@testing-library/react";
import { useSocket } from "@/hooks/useSocket";
import { io } from "socket.io-client";

const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  removeAllListeners: jest.fn(),
  close: jest.fn(),
  connected: true,
};

jest.mock("socket.io-client", () => ({
  __esModule: true,
  io: jest.fn(() => mockSocket),
}));

describe("useSocket", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("devrait retourner socket null quand enabled est false", () => {
    const { result } = renderHook(() =>
      useSocket({ token: "token-123", enabled: false })
    );

    expect(result.current.socket).toBeNull();
    expect(result.current.isConnected).toBe(false);
  });

  it("devrait retourner socket null quand pas de token ni shareToken", () => {
    const { result } = renderHook(() => useSocket({}));

    expect(result.current.socket).toBeNull();
    expect(result.current.isConnected).toBe(false);
  });

  it("devrait créer une connexion socket avec token", () => {
    const { result } = renderHook(() => useSocket({ token: "token-123" }));

    expect(io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        auth: expect.objectContaining({
          token: "token-123",
        }),
        transports: ["websocket", "polling"],
      })
    );
    expect(result.current.socket).toBeTruthy();
  });

  it("devrait exposer emit, on, off", () => {
    const { result } = renderHook(() => useSocket({ token: "token-123" }));

    expect(typeof result.current.emit).toBe("function");
    expect(typeof result.current.on).toBe("function");
    expect(typeof result.current.off).toBe("function");
  });

  it("devrait créer une connexion avec shareToken", () => {
    renderHook(() => useSocket({ shareToken: "share-abc" }));

    expect(io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        auth: expect.objectContaining({
          shareToken: "share-abc",
        }),
      })
    );
  });
});
