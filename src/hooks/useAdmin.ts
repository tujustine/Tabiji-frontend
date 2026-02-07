import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  AdminStats,
  AdminUserStats,
  AdminTripStats,
  AdminUsersResponse,
  AdminTripsResponse,
  AdminMemoriesResponse,
  AdminMediaResponse,
  AdminUser,
  AdminTrip,
} from "@/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_URL_FALLBACK ||
  "http://localhost:4000";

export function useAdmin() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = useCallback(() => {
    if (!token) {
      throw new Error("Non authentifié");
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  // Statistiques
  const getStats = useCallback(async (): Promise<AdminStats> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/admin/stats`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des statistiques");
      }
      return await response.json();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Une erreur est survenue";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const getUserStats = useCallback(async (): Promise<AdminUserStats> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/admin/stats/users`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(
          "Erreur lors de la récupération des stats utilisateurs"
        );
      }
      return await response.json();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Une erreur est survenue";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const getTripStats = useCallback(async (): Promise<AdminTripStats> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/admin/stats/trips`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des stats voyages");
      }
      return await response.json();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Une erreur est survenue";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // Utilisateurs
  const getUsers = useCallback(
    async (page = 1, limit = 20, search = ""): Promise<AdminUsersResponse> => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (search) {
          params.append("search", search);
        }
        const response = await fetch(
          `${API_URL}/admin/users?${params.toString()}`,
          {
            headers: getAuthHeaders(),
          }
        );
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des utilisateurs");
        }
        return await response.json();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Une erreur est survenue";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  const getUser = useCallback(
    async (userId: string): Promise<AdminUser> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération de l'utilisateur");
        }
        return await response.json();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Une erreur est survenue";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  const updateUser = useCallback(
    async (
      userId: string,
      data: { username?: string; email?: string; admin?: boolean }
    ): Promise<AdminUser> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          throw new Error("Erreur lors de la mise à jour de l'utilisateur");
        }
        return await response.json();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Une erreur est survenue";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  const toggleUserAdmin = useCallback(
    async (userId: string): Promise<AdminUser> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_URL}/admin/users/${userId}/toggle-admin`,
          {
            method: "PUT",
            headers: getAuthHeaders(),
          }
        );
        if (!response.ok) {
          throw new Error("Erreur lors de la modification du rôle admin");
        }
        return await response.json();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Une erreur est survenue";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  const deleteUser = useCallback(
    async (userId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error("Erreur lors de la suppression de l'utilisateur");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Une erreur est survenue";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  // Voyages
  const getTrips = useCallback(
    async (page = 1, limit = 20, search = ""): Promise<AdminTripsResponse> => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (search) {
          params.append("search", search);
        }
        const response = await fetch(
          `${API_URL}/admin/trips?${params.toString()}`,
          {
            headers: getAuthHeaders(),
          }
        );
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des voyages");
        }
        return await response.json();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Une erreur est survenue";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  const getTrip = useCallback(
    async (tripId: string): Promise<AdminTrip> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/admin/trips/${tripId}`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération du voyage");
        }
        return await response.json();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Une erreur est survenue";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  const deleteTrip = useCallback(
    async (tripId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/admin/trips/${tripId}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error("Erreur lors de la suppression du voyage");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Une erreur est survenue";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  // Souvenirs
  const getMemories = useCallback(
    async (
      page = 1,
      limit = 20,
      tripId?: string
    ): Promise<AdminMemoriesResponse> => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (tripId) {
          params.append("tripId", tripId);
        }
        const response = await fetch(
          `${API_URL}/admin/memories?${params.toString()}`,
          {
            headers: getAuthHeaders(),
          }
        );
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des souvenirs");
        }
        return await response.json();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Une erreur est survenue";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  const deleteMemory = useCallback(
    async (memoryId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/admin/memories/${memoryId}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error("Erreur lors de la suppression du souvenir");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Une erreur est survenue";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  // Médias
  const getMedia = useCallback(
    async (page = 1, limit = 20): Promise<AdminMediaResponse> => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        const response = await fetch(
          `${API_URL}/admin/media?${params.toString()}`,
          {
            headers: getAuthHeaders(),
          }
        );
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des médias");
        }
        return await response.json();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Une erreur est survenue";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  const deleteMedia = useCallback(
    async (mediaId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/admin/media/${mediaId}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error("Erreur lors de la suppression du média");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Une erreur est survenue";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  return {
    loading,
    error,
    getStats,
    getUserStats,
    getTripStats,
    getUsers,
    getUser,
    updateUser,
    toggleUserAdmin,
    deleteUser,
    getTrips,
    getTrip,
    deleteTrip,
    getMemories,
    deleteMemory,
    getMedia,
    deleteMedia,
  };
}
