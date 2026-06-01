/**
 * Composant de gestion des lieux
 * Permet d'ajouter et de supprimer des adresses
 */

"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { IoMdAdd, IoMdTrash, IoMdMap } from "react-icons/io";
import { FaMapMarkerAlt } from "react-icons/fa";
import type { Place } from "@/types";
import PlaceAutocomplete, {
  PlaceSuggestion,
} from "@/components/places/PlaceAutocomplete";

interface PlacesListProps {
  places: Place[];
  canEdit?: boolean;
  categories?: string[];
  onAddPlace: (place: Place) => void;
  onRemovePlace: (id: string) => void;
  onUpdatePlace?: (id: string, updates: Partial<Place>) => void;
  onAddCategory?: (category: string) => void;
  onMapAddMode?: (enabled: boolean) => void;
  isMapAddMode?: boolean;
}

// Catégories par défaut
const DEFAULT_CATEGORIES = [
  "Restaurants",
  "Hôtels",
  "Activités",
  "Monuments",
  "Transport",
];

export default function PlacesList({
  places,
  canEdit = true,
  categories = DEFAULT_CATEGORIES,
  onAddPlace,
  onRemovePlace,
  onUpdatePlace,
  onAddCategory,
  onMapAddMode,
  isMapAddMode = false,
}: Readonly<PlacesListProps>) {
  const [showForm, setShowForm] = useState(false);
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  // Filtrer les lieux qui n'ont pas de catégorie (ou catégorie vide)
  // Les lieux catégorisés sont gérés dans CategoryAccordion
  const uncategorizedPlaces = places.filter(
    (place) => !place.category || place.category.trim() === ""
  );

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    category: DEFAULT_CATEGORIES[0],
    description: "",
    lat: "",
    lng: "",
  });
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Veuillez saisir un nom pour le lieu");
      return;
    }

    // Utiliser la catégorie personnalisée si elle est définie
    const finalCategory = showCustomCategory && customCategory.trim()
      ? customCategory.trim()
      : formData.category;

    if (editingPlaceId) {
      // Mode édition
      const updatedPlace: Place = {
        id: editingPlaceId,
        name: formData.name.trim(),
        address: formData.address.trim() || "Adresse à définir",
        category: finalCategory,
        description: formData.description.trim(),
        coordinates: {
          lat: Number.parseFloat(formData.lat) || 48.8566,
          lng: Number.parseFloat(formData.lng) || 2.3522,
        },
      };

      if (onUpdatePlace) {
        onUpdatePlace(editingPlaceId, {
          name: updatedPlace.name,
          address: updatedPlace.address,
          category: updatedPlace.category,
          description: updatedPlace.description,
          coordinates: updatedPlace.coordinates,
        });
      }
    } else {
      // Mode ajout
      const newPlace: Place = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        address: formData.address.trim() || "Adresse à définir",
        category: finalCategory,
        description: formData.description.trim(),
        coordinates: {
          lat: Number.parseFloat(formData.lat) || 48.8566,
          lng: Number.parseFloat(formData.lng) || 2.3522,
        },
      };

      onAddPlace(newPlace);
    }

    // Réinitialiser le formulaire
    setFormData({
      name: "",
      address: "",
      category: DEFAULT_CATEGORIES[0],
      description: "",
      lat: "",
      lng: "",
    });
    setShowForm(false);
    setEditingPlaceId(null);
  };

  const handleAdd = () => {
    setShowForm(true);
  };

  const handleMapAdd = () => {
    if (onMapAddMode) {
      onMapAddMode(!isMapAddMode);
    }
  };

  const handleEditPlace = (place: Place) => {
    const isKnownCategory = categories.includes(place.category);
    setFormData({
      name: place.name,
      address: place.address,
      category: isKnownCategory ? place.category : DEFAULT_CATEGORIES[0],
      description: place.description,
      lat: String(place.coordinates.lat),
      lng: String(place.coordinates.lng),
    });
    setShowCustomCategory(!isKnownCategory);
    setCustomCategory(isKnownCategory ? "" : place.category);
    setEditingPlaceId(place.id);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingPlaceId(null);
    setFormData({
      name: "",
      address: "",
      category: DEFAULT_CATEGORIES[0],
      description: "",
      lat: "",
      lng: "",
    });
    setShowCustomCategory(false);
    setCustomCategory("");
  };

  const formTitle = editingPlaceId ? "Modifier le lieu" : "Ajouter un lieu";

  return (
    <div className="space-y-4">
      {/* Bouton ajouter */}
      {!showForm && canEdit && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleAdd}
            className="bg-[#7a8450] hover:bg-[#6a7445] text-white px-6 py-3 rounded-md flex items-center justify-center gap-2 transition-colors flex-1"
          >
            <IoMdAdd size={20} />
            Ajouter un lieu
          </button>
          {onMapAddMode && (
            <button
              type="button"
              onClick={handleMapAdd}
              className={`px-4 py-3 rounded-md flex items-center justify-center gap-2 transition-colors min-w-[140px] ${
                isMapAddMode
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <IoMdMap size={18} />
              {isMapAddMode ? "Annuler" : "Sur carte"}
            </button>
          )}
        </div>
      )}

      {/* Formulaire d'ajout */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 rounded-lg border border-gray-200 space-y-4"
        >
          <div className="mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{formTitle}</h3>
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nom du lieu *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7a8450]"
              placeholder="Ex: Tour Eiffel, Musée du Louvre, Restaurant..."
              autoFocus
            />
          </div>

          <div suppressHydrationWarning>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse *
            </label>

            {isClient ? (
              <PlaceAutocomplete
                value={formData.address}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, address: v }))
                }
                onSelect={(p: PlaceSuggestion) => {
                  setFormData((prev) => ({
                    ...prev,
                    address: p.displayName || p.name,
                    name: prev.name || p.name.split(",")[0].trim(),
                    lat: String(p.lat),
                    lng: String(p.lng),
                  }));
                }}
                placeholder="Tapez une adresse, un lieu, une ville..."
              />
            ) : (
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7a8450]"
                placeholder="Adresse ou description du lieu..."
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            {!showCustomCategory ? (
              <div className="flex gap-2">
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7a8450]"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCustomCategory(true)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors text-sm"
                  title="Créer une nouvelle catégorie"
                >
                  +
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Nouvelle catégorie..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7a8450]"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const category = customCategory.trim();
                      if (category) {
                        onAddCategory?.(category);
                        setFormData({ ...formData, category });
                        setShowCustomCategory(false);
                        setCustomCategory("");
                      }
                    }}
                    className="px-3 py-1 bg-[#7a8450] hover:bg-[#6a7445] text-white rounded text-sm transition-colors"
                  >
                    ✓ Utiliser
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomCategory(false);
                      setCustomCategory("");
                    }}
                    className="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded text-sm transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description (optionnel)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7a8450]"
              placeholder="Notes, horaires, conseils..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-[#7a8450] hover:bg-[#6a7445] text-white py-2 px-4 rounded-md transition-colors font-medium"
            >
              ✓ {editingPlaceId ? "Modifier" : "Ajouter"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (editingPlaceId) {
                  handleCancelEdit();
                } else {
                  // Annuler l'ajout : vider le formulaire et fermer
                  setFormData({
                    name: "",
                    address: "",
                    category: DEFAULT_CATEGORIES[0],
                    description: "",
                    lat: "",
                    lng: "",
                  });
                  setShowForm(false);
                  setShowCustomCategory(false);
                  setCustomCategory("");
                  if (isMapAddMode && onMapAddMode) {
                    onMapAddMode(false);
                  }
                }
              }}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Liste des lieux non catégorisés */}
      {uncategorizedPlaces.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FaMapMarkerAlt className="text-[#7a8450]" size={20} />À organiser
          </h3>
        </div>
      )}

      {uncategorizedPlaces.length === 0 ? (
        <div className="text-center py-8">
          <FaMapMarkerAlt className="mx-auto text-gray-300 mb-2" size={32} />
        </div>
      ) : (
        <div className="space-y-2">
          {uncategorizedPlaces.map((place) => (
            <div
              key={place.id}
              className="bg-white p-3 rounded-md border border-gray-200 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{
                  backgroundColor:
                    {
                      Restaurants: "#e74c3c",
                      Hôtels: "#3498db",
                      Activités: "#2ecc71",
                      Monuments: "#9b59b6",
                      Transport: "#f39c12",
                    }[place.category] || "#7a8450",
                }}
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {place.name}
                </h4>
                <p className="text-sm text-gray-600 truncate">
                  {place.address}
                </p>
              </div>
              {canEdit && (
                <div className="flex gap-1">
                  {onUpdatePlace && (
                    <button
                      type="button"
                      onClick={() => handleEditPlace(place)}
                      className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                      aria-label="Modifier"
                      title="Modifier ce lieu"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemovePlace(place.id)}
                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                    aria-label="Supprimer"
                    title="Supprimer ce lieu"
                  >
                    <IoMdTrash size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
