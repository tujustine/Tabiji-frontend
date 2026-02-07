/**
 * Composant client de la page Mes voyages
 * Affiche tous les voyages sous forme de polaroids avec une barre de recherche
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { IoSearch } from "react-icons/io5";
import PolaroidCard from "@/components/polaroid/PolaroidCard";
import NewTripPolaroid from "@/components/trip/NewTripPolaroid";
import { formatDate } from "@/utils/dateFormatter";

interface Trip {
  id: string;
  image: string;
  title: string;
  startDate: string;
  endDate: string;
  isOwner?: boolean;
  role?: "OWNER" | "EDITOR" | "VIEWER";
  isShared?: boolean;
}

interface TripFromAPI {
  id: string;
  _id?: string; // Pour compatibilité avec l'ancien format
  image?: string;
  title: string;
  startDate: string;
  endDate: string;
  ownerId: string;
  owner: {
    id: string;
    username: string;
    email: string;
  };
  collaborators: Array<{
    role: "OWNER" | "EDITOR" | "VIEWER";
  }>;
}

export async function getTrips(token: string | null): Promise<Trip[]> {
  if (!token) {
    return [];
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/trips`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch trips");
  }

  const data: TripFromAPI[] = await response.json();

  // Mapper les données Prisma (id) vers l'interface frontend (id)
  return data.map((trip) => ({
    id: trip.id || trip._id || "",
    image: trip.image || "",
    title: trip.title,
    startDate: trip.startDate,
    endDate: trip.endDate,
    isOwner: trip.ownerId === data.find((t) => t.id === trip.id)?.ownerId, // Simplifié, on peut améliorer
    role: trip.collaborators[0]?.role || "OWNER",
  }));
}

export default function TripsPageClient() {
  const { token, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const fetchTrips = async () => {
      if (!token || !user) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/trips`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch trips");
        return;
      }

      const data: TripFromAPI[] = await response.json();

      // Mapper les données avec les informations de propriété
      const mappedTrips: Trip[] = data.map((trip) => {
        const isOwner = trip.ownerId === user._id;
        const userRole = isOwner
          ? "OWNER"
          : trip.collaborators[0]?.role || "VIEWER";
        const isShared = !isOwner || trip.collaborators.length > 0; // Voyage partagé si pas propriétaire ou s'il y a des collaborateurs

        return {
          id: trip.id || trip._id || "",
          image: trip.image || "",
          title: trip.title,
          startDate: trip.startDate,
          endDate: trip.endDate,
          isOwner,
          role: userRole,
          isShared,
        };
      });

      setTrips(mappedTrips);
    };

    fetchTrips();
  }, [token, user]);

  // Filtrer les voyages selon la recherche
  const filteredTrips = trips.filter((trip: Trip) =>
    trip.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f6e6d1] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Titre */}
        <h1 className="text-4xl font-bold text-gray-900 font-bagel mb-8 text-center">
          Mes voyages
        </h1>

        {/* Barre de recherche */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative bg-white rounded-lg shadow-md">
            <IoSearch
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={24}
            />
            <input
              type="text"
              placeholder="Rechercher un voyage..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7a8450] focus:border-transparent bg-white"
            />
          </div>
        </div>

        {/* Grille de polaroids */}
        {filteredTrips.length === 0 && searchQuery ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Aucun voyage trouvé pour votre recherche
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {/* Polaroid "Nouveau voyage" */}
            <NewTripPolaroid />

            {/* Liste des voyages */}
            {filteredTrips.map((trip) => (
              <PolaroidCard
                key={trip.id}
                id={trip.id}
                image={trip.image}
                title={trip.title}
                startDate={formatDate(trip.startDate)}
                endDate={formatDate(trip.endDate)}
                isShared={trip.isShared}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
