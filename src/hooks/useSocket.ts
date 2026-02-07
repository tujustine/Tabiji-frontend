import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface UseSocketOptions {
  token?: string;
  tripId?: string;
  shareToken?: string;
  enabled?: boolean;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { token, tripId, shareToken, enabled = true } = options;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || (!token && !shareToken)) {
      return;
    }

    const serverUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    const newSocket = io(serverUrl, {
      auth: {
        token: token || undefined,
        shareToken: shareToken || undefined,
        tripId: tripId || undefined,
      },
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
      setError(null);

      // Rejoindre la room du trip si tripId est fourni
      if (tripId) {
        newSocket.emit("join_trip", { tripId });
      }
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setError(err.message);
    });

    newSocket.on("error", (data: { message: string }) => {
      console.error("Socket error:", data);
      setError(data.message);
    });

    newSocket.on("joined_trip", (data) => {
      console.log("Joined trip:", data);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      // Nettoyer les event listeners
      newSocket.removeAllListeners();
      
      // Quitter la room si connecté et tripId fourni
      if (newSocket.connected && tripId) {
        newSocket.emit("leave_trip", { tripId });
      }
      
      // Fermer la connexion proprement
      if (newSocket.connected) {
        newSocket.disconnect();
      } else {
        // Si pas encore connecté, fermer directement
        newSocket.close();
      }
      
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [enabled, token, shareToken, tripId]);

  const emit = (event: string, data?: unknown) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  };

  const on = (event: string, callback: (data: unknown) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event: string, callback?: (data: unknown) => void) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  return {
    socket,
    isConnected,
    error,
    emit,
    on,
    off,
  };
};
