"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import { useAdmin } from "@/hooks/useAdmin";
import { AdminTrip } from "@/types";
import { IoSearch, IoTrash } from "react-icons/io5";

export default function AdminTripsPage() {
  const { getTrips, deleteTrip } = useAdmin();
  const [allTrips, setAllTrips] = useState<AdminTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadAllTrips = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getTrips(1, 1000, "");
        setAllTrips(response.trips);
      } catch (err) {
        console.error("Erreur chargement voyages:", err);
        setError("Erreur lors du chargement des voyages");
      } finally {
        setLoading(false);
      }
    };
    loadAllTrips();
  }, [getTrips]);

  // Filtrer les voyages en temps réel
  const filteredTrips = allTrips.filter(
    (trip) =>
      trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.owner.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDelete = async (tripId: string) => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer ce voyage ? Cette action est irréversible.",
      )
    ) {
      return;
    }

    try {
      await deleteTrip(tripId);
      // Mettre à jour l'état local en supprimant le voyage supprimé
      setAllTrips((prevTrips) =>
        prevTrips.filter((trip) => trip.id !== tripId),
      );
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      toast.error("Erreur lors de la suppression du voyage");
    }
  };

  const renderTableBody = () => {
    if (filteredTrips.length === 0 && searchQuery) {
      return (
        <tr>
          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
            Aucun voyage trouvé pour votre recherche
          </td>
        </tr>
      );
    }
    if (filteredTrips.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
            Aucun voyage disponible
          </td>
        </tr>
      );
    }
    return filteredTrips.map((trip) => (
      <tr key={trip.id} className="hover:bg-gray-50">
        <td className="px-6 py-4">
          <div className="text-sm font-medium text-gray-900">{trip.title}</div>
          {trip.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {trip.description}
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{trip.owner.username}</div>
          <div className="text-sm text-gray-500">{trip.owner.email}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <div>Lieux: {trip._count?.places || 0}</div>
          <div>Collaborateurs: {trip._count?.collaborators || 0}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {new Date(trip.createdAt).toLocaleDateString("fr-FR")}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
          <div className="relative group">
            <button
              onClick={() => handleDelete(trip.id)}
              className="text-red-600 hover:text-red-900 transition-colors"
            >
              <IoTrash size={20} />
            </button>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Supprimer ce voyage
            </div>
          </div>
        </td>
      </tr>
    ));
  };

  const renderMobileCards = () => {
    if (filteredTrips.length === 0 && searchQuery) {
      return (
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          Aucun voyage trouvé pour votre recherche
        </div>
      );
    }
    if (filteredTrips.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          Aucun voyage disponible
        </div>
      );
    }
    return filteredTrips.map((trip) => (
      <div
        key={trip.id}
        className="bg-white rounded-lg shadow-md p-6 hover:bg-gray-50"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {trip.title}
            </h3>
            {trip.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {trip.description}
              </p>
            )}
            <div className="space-y-1 text-sm text-gray-500">
              <p>
                📅 Créé le{" "}
                {new Date(trip.createdAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>
          <div className="relative group ml-4">
            <button
              onClick={() => handleDelete(trip.id)}
              className="text-red-600 hover:text-red-900 transition-colors p-2"
            >
              <IoTrash size={24} />
            </button>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Supprimer ce voyage
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center mb-3">
            {trip.owner.profilePhoto ? (
              <Image
                src={trip.owner.profilePhoto}
                alt={trip.owner.username}
                width={32}
                height={32}
                className="rounded-full mr-3"
                unoptimized
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-300 mr-3 flex items-center justify-center text-xs">
                {trip.owner.username[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {trip.owner.username}
              </p>
              <p className="text-xs text-gray-500">{trip.owner.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm text-gray-500">
            <div className="text-center">
              <div className="font-medium text-gray-900">
                {trip._count?.memories || 0}
              </div>
              <div>Souvenirs</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">
                {trip._count?.places || 0}
              </div>
              <div>Lieux</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">
                {trip._count?.collaborators || 0}
              </div>
              <div>Collaborateurs</div>
            </div>
          </div>
        </div>
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Chargement des voyages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erreur: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Gestion des voyages</h1>

      {/* Barre de recherche */}
      <div className="max-w-2xl mr-auto mb-12">
        <div className="relative bg-white rounded-lg shadow-md">
          <IoSearch
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={24}
          />
          <input
            type="text"
            placeholder="Rechercher par titre ou propriétaire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7a8450] focus:border-transparent bg-white"
          />
        </div>
      </div>

      {/* Compteur de résultats */}
      <div className="mb-4 text-sm text-gray-600">
        {filteredTrips.length} voyage{filteredTrips.length > 1 ? "s" : ""}{" "}
        {searchQuery &&
          ` trouvé${filteredTrips.length > 1 ? "s" : ""} pour "${searchQuery}"`}
      </div>

      {/* Tableau Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-visible">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Voyage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Propriétaire
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contenu
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date création
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {renderTableBody()}
          </tbody>
        </table>
      </div>

      {/* Cartes Mobile */}
      <div className="md:hidden space-y-4">{renderMobileCards()}</div>
    </div>
  );
}
