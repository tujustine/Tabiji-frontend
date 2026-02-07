/**
 * Contexte pour gérer les voyages favoris
 * Stocke les favoris dans la base de données via l'API
 */

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";

interface FavoritesContextType {
  favorites: string[]; // IDs des voyages favoris
  toggleFavorite: (tripId: string) => void;
  isFavorite: (tripId: string) => boolean;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export function FavoritesProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { token, user } = useAuth();

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_FALLBACK;

  // Charger les favoris depuis l'API
  useEffect(() => {
    const loadFavorites = async () => {
      if (!token || !user) {
        // Si l'utilisateur n'est pas connecté, vider les favoris
        setFavorites([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`${apiUrl}/user/favorites`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load favorites");
        }

        const favoriteIds: string[] = await response.json();
        setFavorites(favoriteIds);
      } catch (error) {
        console.error("Error loading favorites:", error);
        setFavorites([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, [token, user, apiUrl]);

  const toggleFavorite = useCallback(
    async (tripId: string) => {
      // Validation : vérifier que tripId est défini et non vide
      if (!tripId || tripId === "undefined") {
        console.error("Cannot toggle favorite: tripId is undefined or invalid");
        return;
      }

      if (!token || !user) {
        // Si l'utilisateur n'est pas connecté, ne rien faire
        return;
      }

      const isCurrentlyFavorite = favorites.includes(tripId);
      const previousFavorites = [...favorites];

      // Mise à jour optimiste de l'UI
      if (isCurrentlyFavorite) {
        setFavorites(favorites.filter((id) => id !== tripId));
      } else {
        setFavorites([...favorites, tripId]);
      }

      try {
        const method = isCurrentlyFavorite ? "DELETE" : "POST";
        const response = await fetch(`${apiUrl}/user/favorites/${tripId}`, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to ${isCurrentlyFavorite ? "remove" : "add"} favorite`
          );
        }

        // Recharger les favoris depuis l'API pour s'assurer de la cohérence
        const refreshResponse = await fetch(`${apiUrl}/user/favorites`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (refreshResponse.ok) {
          const updatedFavorites = await refreshResponse.json();
          setFavorites(updatedFavorites);
        }
      } catch (error) {
        console.error("Error toggling favorite:", error);
        // Rollback en cas d'erreur
        setFavorites(previousFavorites);
      }
    },
    [token, user, favorites, apiUrl]
  );

  const isFavorite = useCallback(
    (tripId: string) => {
      // Validation : si tripId est undefined ou invalide, retourner false
      if (!tripId || tripId === "undefined") {
        return false;
      }
      return favorites.includes(tripId);
    },
    [favorites]
  );

  const value: FavoritesContextType = useMemo(
    () => ({
      favorites,
      toggleFavorite,
      isFavorite,
      isLoading,
    }),
    [favorites, toggleFavorite, isFavorite, isLoading]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
