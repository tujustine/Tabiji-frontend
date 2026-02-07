/**
 * Composant accordéon pour organiser les lieux par catégorie
 * Permet de voir et d'assigner les lieux à des catégories
 */

"use client";

import { useState, useEffect } from "react";
import { useTrip } from "@/contexts/TripContext";
import {
  IoMdArrowDropdown,
  IoMdArrowDropright,
  IoMdCreate,
  IoMdTrash,
} from "react-icons/io";
import { FaMapMarkerAlt, FaGripVertical } from "react-icons/fa";
import PlaceAutocomplete, {
  PlaceSuggestion,
} from "@/components/places/PlaceAutocomplete";
import type { Place } from "@/types";

// Catégories par défaut
const DEFAULT_CATEGORIES = [
  "Restaurants",
  "Hôtels",
  "Activités",
  "Monuments",
  "Transport",
];

interface CategoryAccordionProps {
  places: Place[];
  canEdit?: boolean;
  onAssignToCategory: (placeId: string, categoryName: string) => void;
  onEditPlace?: (placeId: string, updates: Partial<Place>) => void;
  onDeletePlace?: (placeId: string) => void;
}

export default function CategoryAccordion({
  places,
  canEdit = true,
  onAssignToCategory,
  onEditPlace,
  onDeletePlace,
}: CategoryAccordionProps) {
  const { customCategories, dispatch } = useTrip();
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [draggedPlace, setDraggedPlace] = useState<Place | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedOverCategory, setDraggedOverCategory] = useState<string | null>(
    null
  );
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const renderEditButton = (placeId: string) => {
    if (!canEdit || !onEditPlace) return null;
    return (
      <button
        onClick={() => startEditing(placeId)}
        className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
        title="Modifier ce lieu"
      >
        <IoMdCreate size={14} />
      </button>
    );
  };

  const renderDeleteButton = (placeId: string) => {
    if (!canEdit || !onDeletePlace) return null;
    return (
      <button
        onClick={() => onDeletePlace(placeId)}
        className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        title="Supprimer ce lieu"
      >
        <IoMdTrash size={14} />
      </button>
    );
  };

  const handleDragEnd = () => {
    setDraggedPlace(null);
    setDraggedOverCategory(null);
    setIsDragging(false);
  };
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    address: "",
    description: "",
  });
  const [isClient, setIsClient] = useState(false);

  // Vérifier si on est côté client pour PlaceAutocomplete
  useEffect(() => {
    setIsClient(true);
  }, []);

  const toggleCategory = (categoryName: string) => {
    const newOpen = new Set(openCategories);
    if (newOpen.has(categoryName)) {
      newOpen.delete(categoryName);
    } else {
      newOpen.add(categoryName);
    }
    setOpenCategories(newOpen);
  };

  const getPlacesForCategory = (categoryName: string) => {
    // Utiliser directement la propriété category des lieux
    return places.filter((p) => p.category === categoryName);
  };

  const getUnassignedPlaces = () => {
    // Considérer comme non assignés les lieux sans catégorie ou avec une catégorie vide
    return places.filter((p) => !p.category || p.category.trim() === "");
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      dispatch({ type: "ADD_CUSTOM_CATEGORY", payload: newCategoryName.trim() });
      setOpenCategories(prev => new Set([...prev, newCategoryName.trim()]));
      setNewCategoryName("");
      setShowAddCategory(false);
    }
  };

  const getAllCategories = () => {
    // Récupérer toutes les catégories utilisées dans les lieux
    const usedCategories = new Set(places.map(p => p.category).filter(c => c && c.trim()));
    // Combiner avec les catégories par défaut et personnalisées
    return [...new Set([...DEFAULT_CATEGORIES, ...usedCategories, ...customCategories])].sort();
  };

  const startEditing = (placeId: string) => {
    const place = places.find((p) => p.id === placeId);
    if (place) {
      setEditingPlaceId(placeId);
      setEditForm({
        name: place.name,
        address: place.address || "",
        description: place.description || "",
      });
    }
  };

  const cancelEditing = () => {
    setEditingPlaceId(null);
    setEditForm({ name: "", address: "", description: "" });
  };

  const saveEditing = () => {
    if (editingPlaceId && onEditPlace) {
      onEditPlace(editingPlaceId, editForm);
    }
    cancelEditing();
  };


  const unassignedPlaces = getUnassignedPlaces();

  return (
    <div className="space-y-2">
      {/* Section pour ajouter une nouvelle catégorie */}
      {canEdit && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {!showAddCategory ? (
            <button
              onClick={() => setShowAddCategory(true)}
              className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-[#7a8450] font-medium"
            >
              <IoMdCreate size={16} />
              Ajouter une nouvelle catégorie
            </button>
          ) : (
            <div className="p-4 space-y-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nom de la nouvelle catégorie..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7a8450]"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCategory();
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-[#7a8450] hover:bg-[#6a7445] text-white rounded-md transition-colors text-sm"
                >
                  ✓ Ajouter
                </button>
                <button
                  onClick={() => {
                    setShowAddCategory(false);
                    setNewCategoryName("");
                  }}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md transition-colors text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {getAllCategories().map((categoryName) => {
        const categoryPlaces = getPlacesForCategory(categoryName);
        const isOpen = openCategories.has(categoryName);

        return (
          <div
            key={categoryName}
            className={`bg-white rounded-lg border overflow-hidden relative transition-all ${
              draggedOverCategory === categoryName
                ? "border-[#7a8450] bg-opacity-10"
                : "border-gray-200"
            }`}
            onDragOver={(e) => {
              if (isDragging) {
                setDraggedOverCategory(categoryName);
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            onDragLeave={(e) => {
              if (isDragging) {
                setDraggedOverCategory(null);
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            onDrop={(e) => {
              if (isDragging) {
                setDraggedOverCategory(null);
                e.preventDefault();
                e.stopPropagation();
                if (draggedPlace) {
                  onAssignToCategory(draggedPlace.id, categoryName);
                }
                setDraggedPlace(null);
                setIsDragging(false);
              }
            }}
          >
            {/* En-tête */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => toggleCategory(categoryName)}
                className="flex-1 flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    <IoMdArrowDropdown size={20} className="text-gray-600" />
                  ) : (
                    <IoMdArrowDropright size={20} className="text-gray-600" />
                  )}
                  <h3 className="font-semibold text-gray-900">
                    {categoryName}
                  </h3>
                  <span className="text-sm text-gray-500">
                    ({categoryPlaces.length})
                  </span>
                </div>
              </button>
            </div>

            {/* Contenu */}
            {isOpen && (
              <div className="p-4 pt-0 space-y-2">
                {categoryPlaces.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">
                    Aucun lieu dans cette catégorie
                  </p>
                ) : (
                  categoryPlaces.map((place) => (
                    <div
                      key={place.id}
                      className="p-2 bg-gray-50 rounded border border-gray-200 group hover:bg-gray-100 hover:px-3 transition-all duration-200"
                    >
                      {editingPlaceId === place.id ? (
                        // Mode édition
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#7a8450]"
                            placeholder="Nom du lieu"
                          />
                          <div className="relative">
                            {isClient ? (
                              <PlaceAutocomplete
                                value={editForm.address}
                                onValueChange={(value) =>
                                  setEditForm({ ...editForm, address: value })
                                }
                                onSelect={(suggestion: PlaceSuggestion) => {
                                  setEditForm({
                                    ...editForm,
                                    name: suggestion.name,
                                    address:
                                      suggestion.displayName || suggestion.name,
                                  });
                                }}
                                placeholder="Rechercher une adresse..."
                              />
                            ) : (
                              <input
                                type="text"
                                value={editForm.address}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    address: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#7a8450]"
                                placeholder="Adresse"
                              />
                            )}
                          </div>
                          <textarea
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                description: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#7a8450] resize-none"
                            placeholder="Description (optionnel)"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={saveEditing}
                              className="px-3 py-1 text-xs bg-[#7a8450] text-white rounded hover:bg-[#6a7450] transition-colors"
                            >
                              Sauvegarder
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Mode affichage normal
                        <div
                          className={`flex items-center gap-2 group hover:bg-gray-100 transition-colors rounded ${
                            canEdit ? "cursor-move" : "cursor-default"
                          }`}
                          draggable={canEdit}
                          onDragStart={(e) => {
                            if (!canEdit) return;
                            e.dataTransfer.setData("text/plain", place.id);
                            e.dataTransfer.effectAllowed = "move";
                            setDraggedPlace(place);
                            setIsDragging(true);
                          }}
                          onDragEnd={canEdit ? handleDragEnd : undefined}
                        >
                          {canEdit && (
                            <FaGripVertical
                              className="text-gray-400 flex-shrink-0 cursor-move"
                              size={12}
                            />
                          )}
                          <FaMapMarkerAlt
                            className="text-[#7a8450] flex-shrink-0"
                            size={14}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {place.name}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                              {place.address}
                            </p>
                            {place.description && (
                              <p className="text-xs text-gray-500 mt-1 truncate">
                                {place.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {renderEditButton(place.id)}
                            {renderDeleteButton(place.id)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Lieux non assignés */}
      {unassignedPlaces.length > 0 && (
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 mt-4">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Lieux non catégorisés ({unassignedPlaces.length})
            </h3>
            <div className="space-y-2">
              {unassignedPlaces.map((place) => (
                <div
                  key={place.id}
                  className="p-2 bg-white rounded border border-gray-200 group hover:bg-gray-50 hover:px-3 transition-all duration-200"
                >
                  {(() => {
                    if (editingPlaceId === place.id) {
                      // Mode édition pour lieux non assignés
                      return (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#7a8450]"
                            placeholder="Nom du lieu"
                          />
                          <div className="relative">
                            {isClient ? (
                              <PlaceAutocomplete
                                value={editForm.address}
                                onValueChange={(value) =>
                                  setEditForm({ ...editForm, address: value })
                                }
                                onSelect={(suggestion: PlaceSuggestion) => {
                                  setEditForm({
                                    ...editForm,
                                    name: suggestion.name,
                                    address:
                                      suggestion.displayName || suggestion.name,
                                  });
                                }}
                                placeholder="Rechercher une adresse..."
                              />
                            ) : (
                              <input
                                type="text"
                                value={editForm.address}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    address: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#7a8450]"
                                placeholder="Adresse"
                              />
                            )}
                          </div>
                          <textarea
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                description: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#7a8450] resize-none"
                            placeholder="Description (optionnel)"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={saveEditing}
                              className="px-3 py-1 text-xs bg-[#7a8450] text-white rounded hover:bg-[#6a7450] transition-colors"
                            >
                              Sauvegarder
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      );
                    } else {
                      // Mode affichage normal pour lieux non assignés
                      return (
                        <div
                          className={`flex items-start gap-2 group ${
                            canEdit ? "cursor-move" : "cursor-default"
                          }`}
                          draggable={canEdit}
                          onDragStart={(e) => {
                            if (!canEdit) return;
                            e.dataTransfer.setData("text/plain", place.id);
                            e.dataTransfer.effectAllowed = "move";
                            setDraggedPlace(place);
                            setIsDragging(true);
                          }}
                          onDragEnd={canEdit ? handleDragEnd : undefined}
                        >
                          {canEdit && (
                            <FaGripVertical
                              className="text-gray-400 flex-shrink-0 mt-1 cursor-move"
                              size={12}
                            />
                          )}
                          <FaMapMarkerAlt
                            className="text-gray-400 flex-shrink-0 mt-1"
                            size={14}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-900">
                                  {place.name}
                                </p>
                                <p className="text-xs text-gray-600 truncate mb-2">
                                  {place.address}
                                </p>
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      onAssignToCategory(
                                        place.id,
                                        e.target.value
                                      );
                                    }
                                  }}
                                  className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#7a8450]"
                                  defaultValue=""
                                >
                                  <option value="">
                                    Assigner à une catégorie...
                                  </option>
                                  {getAllCategories().map((categoryName) => (
                                    <option key={categoryName} value={categoryName}>
                                      {categoryName}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                {renderEditButton(place.id)}
                                {renderDeleteButton(place.id)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
