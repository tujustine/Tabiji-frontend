/**
 * Composant client de la page de détail d'un voyage
 * Interface complète avec toutes les sections
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import toast from "react-hot-toast";
import { IoMdSave, IoMdTrash } from "react-icons/io";
import {
  FaMapMarkedAlt,
  FaShareAlt,
  FaVideo,
  FaSignOutAlt,
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import {
  TripProvider,
  useTrip,
  getAllCategories,
} from "@/contexts/TripContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import type { Place, Memory, Trip } from "@/types";

// Composant pour l'aperçu miniature du tableau de souvenirs
function MemoriesPreview({ memories }: Readonly<{ memories: Memory[] }>) {
  if (memories.length === 0) return null;

  // Render le contenu d'un souvenir
  const renderMemoryContent = (memory: Memory) => {
    if (memory.type === "image" && memory.content) {
      return (
        <div className="w-full h-full relative bg-gray-200">
          <Image
            src={memory.content}
            alt="Souvenir"
            fill
            className="object-cover"
            sizes="10vw"
          />
        </div>
      );
    }

    if (memory.type === "video" && memory.content) {
      return (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <FaVideo className="text-white text-xs" />
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-[#f6e6d1] flex items-center justify-center p-1">
        <div className="text-xs text-[#7a8450] text-center line-clamp-3 leading-tight">
          {memory.content || "Texte"}
        </div>
      </div>
    );
  };

  return (
    <div
      className="relative bg-white border-2 border-gray-200 rounded-lg overflow-hidden"
      style={{ aspectRatio: "16/9" }}
    >
      {/* Fond du canvas */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50">
        {/* Grille de fond subtile */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" className="w-full h-full">
            <defs>
              <pattern
                id="grid"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="#000"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Souvenirs positionnés */}
        {memories.map((memory) => (
          <div
            key={memory.id}
            className="absolute rounded-lg overflow-hidden shadow-sm border border-gray-300"
            style={{
              left: `${memory.position.x}%`,
              top: `${memory.position.y}%`,
              width: `${memory.size.width}%`,
              height: `${memory.size.height}%`,
              zIndex: memory.zIndex,
            }}
          >
            {/* Contenu du souvenir miniature */}
            {renderMemoryContent(memory)}
          </div>
        ))}
      </div>
    </div>
  );
}

import PolaroidEditor from "@/components/polaroid/PolaroidEditor";
import TodoList from "@/components/places/TodoList";
import PlacesList from "@/components/places/PlacesList";
import CategoryAccordion from "@/components/accordion/CategoryAccordion";
import DayScheduleAccordion from "@/components/accordion/DayScheduleAccordion";
import ShareModal from "@/components/trip/ShareModal";
// Import dynamique pour TripMap (éviter les erreurs SSR avec Leaflet)
const TripMap = dynamic(() => import("@/components/trip/TripMap"), {
  ssr: false,
});

interface TripDetailClientProps {
  tripId: string;
}

function TripDetailContent({ tripId }: Readonly<TripDetailClientProps>) {
  const { token, isInitialized } = useAuth();
  const router = useRouter();
  const { trip, customCategories, dispatch } = useTrip();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isMapAddMode, setIsMapAddMode] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Restaurants");
  const [userPermissions, setUserPermissions] = useState({
    role: "OWNER" as "OWNER" | "EDITOR" | "VIEWER",
    canEdit: true,
    canDelete: true,
    canShare: true,
  });
  const [tripOwner, setTripOwner] = useState<{
    id: string;
    username: string;
    email: string;
  } | null>(null);

  // Charger les données du voyage
  useEffect(() => {
    // Attendre que l'authentification soit initialisée ET que le token soit disponible
    if (!isInitialized || !token) {
      return;
    }

    setIsClient(true);

    // Fonctions utilitaires pour réduire la complexité cognitive
    const getApiUrl = (): string | null => {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_API_URL_FALLBACK;
      if (!apiUrl) {
        toast.error("Configuration API manquante");
        setIsLoading(false);
        return null;
      }
      return apiUrl;
    };

    const verifyToken = async (
      apiUrl: string,
      authToken: string
    ): Promise<void> => {
      try {
        const verifyResponse = await fetch(`${apiUrl}/user/me`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!verifyResponse.ok) {
          throw new Error(`Token invalide: ${verifyResponse.status}`);
        }
      } catch (error) {
        throw new Error(`Erreur lors de la vérification du token: ${error}`);
      }
    };

    const fetchTripWithAuth = async (
      apiUrl: string,
      authToken: string | null
    ): Promise<Response> => {
      if (authToken) {
        const response = await fetch(`${apiUrl}/trip/${tripId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (response.ok) {
          return response;
        }
      }
      return fetch(`${apiUrl}/trip/${tripId}`);
    };

    const handleFetchError = async (
      response: Response,
      authToken: string | null
    ): Promise<never> => {
      await response.text();
      if (response.status === 401 || response.status === 403) {
        throw new Error(authToken ? "SESSION_EXPIRED" : "AUTH_REQUIRED");
      }
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    };

    const formatTripData = (
      data: Partial<Trip> & Record<string, unknown>
    ): Trip => {
      const formatDate = (date: unknown): string => {
        if (!date) return "";
        if (typeof date === "string") {
          return new Date(date).toISOString().split("T")[0];
        }
        if (date instanceof Date) {
          return date.toISOString().split("T")[0];
        }
        return "";
      };

      return {
        title: typeof data.title === "string" ? data.title : "",
        description:
          typeof data.description === "string" ? data.description : "",
        destination:
          typeof data.destination === "string" ? data.destination : "",
        startDate: formatDate(data.startDate),
        endDate: formatDate(data.endDate),
        image: typeof data.image === "string" ? data.image : "",
        participants: Array.isArray(data.participants)
          ? data.participants.filter(
              (item): item is string => typeof item === "string"
            )
          : [],
        memories: Array.isArray(data.memories) ? data.memories : [],
        places: Array.isArray(data.places) ? data.places : [],
        todoItems: Array.isArray(data.todoItems) ? data.todoItems : [],
        daySchedule: Array.isArray(data.daySchedule) ? data.daySchedule : [],
        ...data,
      } as Trip;
    };

    const recordRecentTrip = async (
      apiUrl: string,
      authToken: string
    ): Promise<void> => {
      try {
        await fetch(`${apiUrl}/user/recent-trips/${tripId}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch {
        // Ignorer les erreurs silencieusement
      }
    };

    const handleFetchErrorDisplay = (error: unknown): void => {
      console.error("❌ Erreur chargement voyage:", error);
      setIsLoading(false);
      console.error(
        "Erreur temporaire de chargement:",
        (error as Error).message
      );

      if (error instanceof TypeError && error.message.includes("fetch")) {
        toast.error("Problème de connexion réseau. Vérifiez votre internet.");
      } else if ((error as Error).message !== "AUTH_REQUIRED") {
        toast.error("Impossible de charger le voyage. Réessayez plus tard.");
      }
    };

    const fetchTrip = async () => {
      try {
        const apiUrl = getApiUrl();
        if (!apiUrl) return;

        if (token) {
          await verifyToken(apiUrl, token);
        }

        const response = await fetchTripWithAuth(apiUrl, token);
        if (!response.ok) {
          await handleFetchError(response, token);
          return;
        }

        const data = await response.json();

        if (data.userPermissions) {
          setUserPermissions(data.userPermissions);
        }
        if (data.owner) {
          setTripOwner(data.owner);
        }

        const formattedTrip = formatTripData(data);
        dispatch({ type: "SET_TRIP", payload: formattedTrip });
        setIsLoading(false);

        if (token) {
          await recordRecentTrip(apiUrl, token);
        }
      } catch (error) {
        handleFetchErrorDisplay(error);
      }
    };

    fetchTrip();
  }, [tripId, dispatch, token, isInitialized]);

  // Sauvegarder les modifications
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_API_URL_FALLBACK
        }/trip/${tripId}`,
        {
          method: "PUT",
          headers: token
            ? {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              }
            : { "Content-Type": "application/json" },
          body: JSON.stringify(trip),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Erreur lors de la sauvegarde" }));
        console.error("Erreur serveur:", errorData);
        throw new Error(
          errorData.message ||
            `Erreur ${response.status}: ${response.statusText}`
        );
      }

      toast.success("Voyage sauvegardé avec succès !");
    } catch (error) {
      console.error("Erreur:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors de la sauvegarde";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Supprimer le voyage
  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce voyage ?")) {
      return;
    }

    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_API_URL_FALLBACK
        }/trip/${tripId}`,
        {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      router.push("/trips");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  // Quitter un voyage partagé (collaborateur se retire lui-même)
  const handleLeaveTrip = async () => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir quitter ce voyage ? Vous perdrez l'accès à ce voyage."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_API_URL_FALLBACK
        }/trip/${tripId}/collaborator/me`,
        {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Erreur lors de la sortie du voyage" }));
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }

      toast.success("Vous avez quitté ce voyage");
      router.push("/trips");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la sortie du voyage"
      );
    }
  };

  // Gérer l'ajout de lieu depuis la carte
  const handleMapPlaceAdd = (lat: number, lng: number) => {
    const newPlace: Place = {
      id: Date.now().toString(),
      name: `Lieu ${(trip.places || []).length + 1}`,
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      category: selectedCategory,
      description: "",
      coordinates: { lat, lng },
    };

    dispatch({ type: "ADD_PLACE", payload: newPlace });

    setIsMapAddMode(false);

    setTimeout(() => {
      toast.success(
        `Lieu ajouté dans la catégorie "${selectedCategory}" à ${lat.toFixed(
          6
        )}, ${lng.toFixed(6)}. Vous pouvez l'éditer dans la liste des lieux.`
      );
    }, 100);
  };

  // Gérer le changement de mode ajout carte
  const handleMapAddModeChange = (enabled: boolean) => {
    setIsMapAddMode(enabled);
  };

  if (isLoading || !trip?.title) {
    return (
      <div className="min-h-screen bg-[#f6e6d1] flex items-center justify-center">
        <div className="text-xl text-gray-700">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6e6d1] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Boutons d'action en haut - Desktop */}
        <div className="hidden md:flex justify-end items-center gap-4 mb-6">
          {userPermissions.canShare && (
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md transition-colors duration-200"
            >
              <FaShareAlt size={20} />
              Partager
            </button>
          )}
          {userPermissions.canEdit && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-[#7a8450] hover:bg-[#6a7445] disabled:bg-gray-400 text-white px-6 py-3 rounded-md transition-colors duration-200"
            >
              <IoMdSave size={20} />
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          )}
          {userPermissions.canDelete && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md transition-colors duration-200"
            >
              <IoMdTrash size={20} />
              Supprimer
            </button>
          )}
        </div>

        {/* Boutons d'action - Mobile */}
        <div className="md:hidden mb-6">
          <div className="flex justify-center gap-4">
            {userPermissions.canShare && (
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors duration-200"
                title="Partager le voyage"
              >
                <FaShareAlt size={20} />
              </button>
            )}
            {userPermissions.canEdit && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center justify-center w-12 h-12 bg-[#7a8450] hover:bg-[#6a7445] disabled:bg-gray-400 text-white rounded-full transition-colors duration-200"
                title={isSaving ? "Sauvegarde en cours..." : "Sauvegarder"}
              >
                <IoMdSave size={20} />
              </button>
            )}
            {userPermissions.canDelete && (
              <button
                onClick={handleDelete}
                className="flex items-center justify-center w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors duration-200"
                title="Supprimer le voyage"
              >
                <IoMdTrash size={20} />
              </button>
            )}
            {userPermissions.role !== "OWNER" && (
              <button
                onClick={handleLeaveTrip}
                className="flex items-center justify-center w-12 h-12 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-colors duration-200"
                title="Quitter ce voyage"
              >
                <FaSignOutAlt size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Mention du propriétaire et bouton quitter pour les collaborateurs */}
        {userPermissions.role !== "OWNER" && tripOwner && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-blue-800">
                <FaShareAlt size={16} />
                <span className="text-sm font-medium">
                  Voyage partagé par{" "}
                  <span className="font-semibold">{tripOwner.username}</span>
                </span>
              </div>
              <button
                onClick={handleLeaveTrip}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 hover:underline"
                title="Quitter ce voyage"
              >
                <FaSignOutAlt size={14} />
                Quitter ce voyage
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche - Polaroid et aperçu souvenirs */}
          <div className="space-y-6">
            {/* Section 1 - Polaroid éditable */}
            <section>
              <PolaroidEditor
                image={trip.image || ""}
                title={trip.title || ""}
                startDate={trip.startDate || ""}
                endDate={trip.endDate || ""}
                isFavorite={isFavorite(trip._id || tripId)}
                canEdit={userPermissions.canEdit}
                onImageChange={(image) =>
                  dispatch({ type: "UPDATE_BASIC_INFO", payload: { image } })
                }
                onTitleChange={(title) =>
                  dispatch({ type: "UPDATE_BASIC_INFO", payload: { title } })
                }
                onStartDateChange={(startDate) => {
                  if (trip.endDate && startDate > trip.endDate) {
                    dispatch({
                      type: "UPDATE_BASIC_INFO",
                      payload: { startDate, endDate: startDate },
                    });
                  } else {
                    dispatch({
                      type: "UPDATE_BASIC_INFO",
                      payload: { startDate },
                    });
                  }
                }}
                onEndDateChange={(endDate) => {
                  if (trip.startDate && endDate < trip.startDate) {
                    dispatch({
                      type: "UPDATE_BASIC_INFO",
                      payload: { endDate: trip.startDate },
                    });
                  } else {
                    dispatch({
                      type: "UPDATE_BASIC_INFO",
                      payload: { endDate },
                    });
                  }
                }}
                onFavoriteToggle={() => {
                  toggleFavorite(trip._id || tripId);
                }}
              />
            </section>

            {/* Section 2 - Aperçu souvenirs */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 font-bagel mb-4">
                Souvenirs
              </h2>

              {(trip.memories || []).length === 0 ? (
                <div className="bg-[#f6e6d1] rounded-lg p-8 mb-4 text-center">
                  <FaMapMarkedAlt className="w-12 h-12 mx-auto text-[#7a8450] mb-2" />
                  <p className="text-sm text-gray-600">
                    Aucun souvenir pour le moment
                  </p>
                </div>
              ) : (
                <div className="mb-4">
                  <MemoriesPreview memories={trip.memories || []} />
                </div>
              )}

              <button
                type="button"
                onClick={() => router.push(`/trips/${tripId}/memories`)}
                className="w-full bg-[#7a8450] hover:bg-[#6a7445] text-white py-2 rounded-md transition-colors"
              >
                {(trip.memories || []).length === 0
                  ? "Créer des souvenirs"
                  : "Voir tous les souvenirs"}
              </button>
            </section>

            {/* Section 4 - Liste de tâches */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 font-bagel mb-4">
                À faire
              </h2>
              <TodoList
                todos={trip.todoItems || []}
                canEdit={userPermissions.canEdit}
                onAddTodo={(todo) =>
                  dispatch({ type: "ADD_TODO", payload: todo })
                }
                onRemoveTodo={(id) =>
                  dispatch({ type: "REMOVE_TODO", payload: id })
                }
                onToggleTodo={(id) =>
                  dispatch({ type: "TOGGLE_TODO", payload: id })
                }
                onReorderTodos={(todos) =>
                  dispatch({ type: "REORDER_TODOS", payload: todos })
                }
              />
            </section>
          </div>

          {/* Colonne droite - Carte, lieux, organisation */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 3 - Carte interactive */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 font-bagel mb-4">
                Carte
              </h2>
              {isClient && (
                <TripMap
                  places={trip.places || []}
                  onAddPlace={handleMapPlaceAdd}
                  isAddMode={isMapAddMode}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  categories={getAllCategories(
                    trip.places || [],
                    customCategories
                  )}
                />
              )}
            </section>

            {/* Section 5 - Gestion des adresses */}
            {userPermissions.canEdit && (
              <section className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 font-bagel mb-4">
                  Ajouter des lieux à votre voyage
                </h2>
                <PlacesList
                  places={trip.places}
                  canEdit={userPermissions.canEdit}
                  onAddPlace={(place) =>
                    dispatch({ type: "ADD_PLACE", payload: place })
                  }
                  onRemovePlace={(id) =>
                    dispatch({ type: "REMOVE_PLACE", payload: id })
                  }
                  onUpdatePlace={(id, updates) =>
                    dispatch({ type: "UPDATE_PLACE", payload: { id, updates } })
                  }
                  onMapAddMode={handleMapAddModeChange}
                  isMapAddMode={isMapAddMode}
                />
              </section>
            )}

            {/* Section 6 - Organisation par catégorie */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 font-bagel mb-4">
                Organisation par catégorie
              </h2>
              <CategoryAccordion
                places={trip.places || []}
                canEdit={userPermissions.canEdit}
                onAssignToCategory={(placeId, categoryName) =>
                  dispatch({
                    type: "UPDATE_PLACE",
                    payload: {
                      id: placeId,
                      updates: { category: categoryName },
                    },
                  })
                }
                onEditPlace={(placeId, updates) => {
                  console.log("Edit place:", placeId, updates);
                  dispatch({
                    type: "UPDATE_PLACE",
                    payload: { id: placeId, updates },
                  });
                }}
                onDeletePlace={(placeId) => {
                  if (confirm("Êtes-vous sûr de vouloir supprimer ce lieu ?")) {
                    dispatch({ type: "REMOVE_PLACE", payload: placeId });
                  }
                }}
              />
            </section>

            {/* Section 7 - Organisation par jour */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 font-bagel mb-4">
                Planning jour par jour
              </h2>
              <DayScheduleAccordion
                places={trip.places || []}
                daySchedule={trip.daySchedule || []}
                startDate={trip.startDate || ""}
                endDate={trip.endDate || ""}
                canEdit={userPermissions.canEdit}
                onAssignToDay={(placeId, day) =>
                  dispatch({
                    type: "ASSIGN_PLACE_TO_DAY",
                    payload: { placeId, day },
                  })
                }
                onReorderPlaces={(day, placeIds) =>
                  dispatch({
                    type: "REORDER_PLACES_IN_DAY",
                    payload: { day, placeIds },
                  })
                }
                onEditPlace={(placeId, updates) =>
                  dispatch({
                    type: "UPDATE_PLACE",
                    payload: { id: placeId, updates },
                  })
                }
                onDeletePlace={(placeId) =>
                  dispatch({ type: "REMOVE_PLACE", payload: placeId })
                }
              />
            </section>
          </div>
        </div>

        {/* Modal de partage */}
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          tripId={tripId}
          tripTitle={trip.title || ""}
        />
      </div>
    </div>
  );
}

export default function TripDetailClient(
  props: Readonly<TripDetailClientProps>
) {
  return (
    <TripProvider>
      <TripDetailContent {...props} />
    </TripProvider>
  );
}
