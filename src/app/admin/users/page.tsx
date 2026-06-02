"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import { useAdmin } from "@/hooks/useAdmin";
import { AdminUser } from "@/types";
import TravelLoader from "@/components/ui/TravelLoader";
import { IoSearch, IoTrash, IoShield, IoShieldOutline } from "react-icons/io5";

export default function AdminUsersPage() {
  const { getUsers, deleteUser, toggleUserAdmin } = useAdmin();
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getUsers(1, 1000, "");
        setAllUsers(response.users);
      } catch (err) {
        console.error("Erreur chargement utilisateurs:", err);
        setError("Erreur lors du chargement des utilisateurs");
      } finally {
        setLoading(false);
      }
    };
    loadAllUsers();
  }, [getUsers]);

  // Filtrer les utilisateurs en temps réel
  const filteredUsers = allUsers.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDelete = async (userId: string) => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.",
      )
    ) {
      return;
    }

    try {
      await deleteUser(userId);
      // Mettre à jour l'état local en supprimant l'utilisateur supprimé
      setAllUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== userId),
      );
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      toast.error("Erreur lors de la suppression de l'utilisateur");
    }
  };

  const handleToggleAdmin = async (userId: string) => {
    try {
      await toggleUserAdmin(userId);
      // Mettre à jour l'état local en modifiant le rôle de l'utilisateur
      setAllUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, admin: !user.admin } : user,
        ),
      );
    } catch (err) {
      console.error("Erreur lors de la modification du rôle:", err);
      toast.error("Erreur lors de la modification du rôle");
    }
  };

  const renderProfilePhoto = (user: AdminUser) => {
    if (user.profilePhoto) {
      return (
        <Image
          src={user.profilePhoto}
          alt={user.username}
          width={40}
          height={40}
          className="rounded-full mr-3"
          unoptimized
        />
      );
    }
    return (
      <div className="h-10 w-10 rounded-full bg-gray-300 mr-3 flex items-center justify-center">
        {user.username[0].toUpperCase()}
      </div>
    );
  };

  const renderTableBody = () => {
    if (filteredUsers.length === 0 && searchQuery) {
      return (
        <tr>
          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
            Aucun utilisateur trouvé pour votre recherche
          </td>
        </tr>
      );
    }
    if (filteredUsers.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
            Aucun utilisateur disponible
          </td>
        </tr>
      );
    }
    return filteredUsers.map((user) => (
      <tr key={user.id} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            {renderProfilePhoto(user)}
            <div>
              <div className="text-sm font-medium text-gray-900">
                {user.username}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(user.createdAt).toLocaleDateString("fr-FR")}
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {user.email}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {user._count?.tripsOwned || 0}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {user._count?.collaborations || 0}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {user.admin ? (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
              Admin
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
              Utilisateur
            </span>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center justify-center gap-2">
          <div className="relative group">
            <button
              onClick={() => handleToggleAdmin(user.id)}
              className="text-blue-600 hover:text-blue-900 transition-colors"
            >
              {user.admin ? (
                <IoShield size={20} />
              ) : (
                <IoShieldOutline size={20} />
              )}
            </button>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              {user.admin
                ? "Rétrograder utilisateur"
                : "Promouvoir administrateur"}
            </div>
          </div>
          <div className="relative group">
            <button
              onClick={() => handleDelete(user.id)}
              className="text-red-600 hover:text-red-900 transition-colors"
            >
              <IoTrash size={20} />
            </button>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Supprimer cet utilisateur
            </div>
          </div>
        </td>
      </tr>
    ));
  };

  const renderMobileCards = () => {
    if (filteredUsers.length === 0 && searchQuery) {
      return (
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          Aucun utilisateur trouvé pour votre recherche
        </div>
      );
    }
    if (filteredUsers.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          Aucun utilisateur disponible
        </div>
      );
    }
    return filteredUsers.map((user) => (
      <div
        key={user.id}
        className="bg-white rounded-lg shadow-md p-6 hover:bg-gray-50"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center flex-1">
            {user.profilePhoto ? (
              <Image
                src={user.profilePhoto}
                alt={user.username}
                width={48}
                height={48}
                className="rounded-full mr-4"
                unoptimized
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-300 mr-4 flex items-center justify-center">
                {user.username[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {user.username}
                </h3>
                {user.admin ? (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                    Admin
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                    Utilisateur
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{user.email}</p>
              <p className="text-sm text-gray-500 mb-3">
                Créé le {new Date(user.createdAt).toLocaleDateString("fr-FR")}
              </p>
              <div className="flex flex-col justify-between text-sm text-gray-500">
                <span>Voyages: {user._count?.tripsOwned || 0}</span>
                <span>Collaborations: {user._count?.collaborations || 0}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 ml-4">
            <div className="relative group">
              <button
                onClick={() => handleToggleAdmin(user.id)}
                className="text-blue-600 hover:text-blue-900 transition-colors p-2"
              >
                {user.admin ? (
                  <IoShield size={24} />
                ) : (
                  <IoShieldOutline size={24} />
                )}
              </button>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {user.admin
                  ? "Rétrograder utilisateur"
                  : "Promouvoir administrateur"}
              </div>
            </div>
            <div className="relative group">
              <button
                onClick={() => handleDelete(user.id)}
                className="text-red-600 hover:text-red-900 transition-colors p-2"
              >
                <IoTrash size={24} />
              </button>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Supprimer cet utilisateur
              </div>
            </div>
          </div>
        </div>
      </div>
    ));
  };

  if (loading) {
    return <TravelLoader label="Chargement des utilisateurs..." />;
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
      <h1 className="text-3xl font-bold mb-8">Gestion des utilisateurs</h1>

      {/* Barre de recherche */}
      <div className="max-w-2xl mr-auto mb-12">
        <div className="relative bg-white rounded-lg shadow-md">
          <IoSearch
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={24}
          />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7a8450] focus:border-transparent bg-white"
          />
        </div>
      </div>

      {/* Compteur de résultats */}
      <div className="mb-4 text-sm text-gray-600">
        {filteredUsers.length} utilisateur
        {filteredUsers.length > 1 ? "s" : ""}
        {searchQuery &&
          ` trouvé
        ${filteredUsers.length > 1 ? "s" : ""} pour "${searchQuery}"`}
      </div>

      {/* Tableau Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-visible">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Voyages
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Collaborations
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rôle
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
