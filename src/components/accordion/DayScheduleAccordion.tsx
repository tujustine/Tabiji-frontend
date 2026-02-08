/**
 * Composant accordéon pour organiser les lieux par jour
 * Permet de planifier le voyage jour par jour
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import {
  IoMdArrowDropdown,
  IoMdArrowDropright,
  IoMdArrowUp,
  IoMdArrowDown,
  IoMdTrash,
  IoMdCreate,
} from "react-icons/io";
import { FaMapMarkerAlt, FaCalendarAlt, FaGripVertical } from "react-icons/fa";
import PlaceAutocomplete, {
  PlaceSuggestion,
} from "@/components/places/PlaceAutocomplete";
import type { Place, DaySchedule } from "@/types";

interface DayScheduleAccordionProps {
  places: Place[];
  daySchedule: DaySchedule[];
  startDate: string;
  endDate: string;
  canEdit?: boolean;
  onAssignToDay: (placeId: string, day: number) => void;
  onReorderPlaces?: (day: number, placeIds: string[]) => void;
  onEditPlace?: (placeId: string, updates: Partial<Place>) => void;
  onDeletePlace?: (placeId: string) => void;
}

export default function DayScheduleAccordion({
  places,
  daySchedule,
  startDate,
  endDate,
  canEdit = true,
  onAssignToDay,
  onReorderPlaces,
  onEditPlace,
  onDeletePlace,
}: Readonly<DayScheduleAccordionProps>) {
  const [openDays, setOpenDays] = useState<Set<number>>(new Set());
  const [draggedPlace, setDraggedPlace] = useState<Place | null>(null);
  const [draggedOverDay, setDraggedOverDay] = useState<number | null>(null); // -1 pour la zone non planifiés
  const [isDragging, setIsDragging] = useState(false);
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    address: "",
    description: "",
  });
  const [isClient, setIsClient] = useState(false);

  // Effet pour détecter si on est côté client
  useEffect(() => {
    setIsClient(true);
  }, []);

  const startEditing = (placeId: string) => {
    const place = places.find((p) => p.id === placeId);
    if (place) {
      setEditingPlaceId(placeId);
      setEditForm({
        name: place.name,
        address: place.address,
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
      cancelEditing();
    }
  };

  const toggleDay = (day: number) => {
    const newOpen = new Set(openDays);
    if (newOpen.has(day)) {
      newOpen.delete(day);
    } else {
      newOpen.add(day);
    }
    setOpenDays(newOpen);
  };

  // Préparer les jours avec leurs dates
  const days = useMemo(() => {
    if (!startDate || !endDate) return [];

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const days: DaySchedule[] = [];
    for (let i = 0; i < diffDays; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);

      // Utiliser directement le jour du state s'il existe
      const existingDay = daySchedule.find((d) => d.day === i + 1);

      if (existingDay) {
        days.push({
          ...existingDay,
          date: currentDate, // Mettre à jour la date
        });
      } else {
        // Créer un nouveau jour seulement s'il n'existe pas
        days.push({
          day: i + 1,
          date: currentDate,
          placeIds: [],
        });
      }
    }
    return days;
  }, [startDate, endDate, daySchedule]);

  const getPlacesForDay = (day: DaySchedule) => {
    // Créer un map pour un accès rapide
    const placesMap = new Map(places.map((p) => [p.id, p]));

    // Retourner les lieux dans l'ordre défini par placeIds
    return day.placeIds
      .map((placeId) => placesMap.get(placeId))
      .filter((place): place is Place => place !== undefined);
  };

  const getUnscheduledPlaces = () => {
    const scheduledPlaceIds = new Set(days.flatMap((day) => day.placeIds));
    return places.filter((p) => !scheduledPlaceIds.has(p.id));
  };

  const unscheduledPlaces = getUnscheduledPlaces();

  // Gestion du drag & drop
  const handleDragStart = (e: React.DragEvent, place: Place) => {
    e.dataTransfer.setData("text/plain", place.id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedPlace(place);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setDraggedPlace(null);
    setDraggedOverDay(null);
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent, day: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDraggedOverDay(day);
  };

  const handleDragLeave = () => {
    setDraggedOverDay(null);
  };

  const handleDrop = (e: React.DragEvent, day: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedPlace) {
      if (day === -1) {
        // Retirer du planning : on assigne à un jour qui n'existe pas (0)
        // Cela va retirer le lieu de tous les jours existants
        onAssignToDay(draggedPlace.id, 0);
      } else {
        onAssignToDay(draggedPlace.id, day);
      }
    }
    setDraggedOverDay(null);
    setDraggedPlace(null);
    setIsDragging(false);
  };

  // Réorganiser les lieux dans un jour
  const movePlaceInDay = (
    day: number,
    placeId: string,
    direction: "up" | "down"
  ) => {
    const dayData = days.find((d) => d.day === day);
    if (!dayData) return;

    const currentIndex = dayData.placeIds.indexOf(placeId);
    if (currentIndex === -1) return;

    const newPlaceIds = [...dayData.placeIds];
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    // Vérifier les limites
    if (newIndex < 0 || newIndex >= newPlaceIds.length) return;

    // Échanger les positions
    [newPlaceIds[currentIndex], newPlaceIds[newIndex]] = [
      newPlaceIds[newIndex],
      newPlaceIds[currentIndex],
    ];

    onReorderPlaces?.(day, newPlaceIds);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date);
  };

  if (days.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Veuillez définir les dates du voyage pour planifier les jours
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {days.map((day) => {
        const dayPlaces = getPlacesForDay(day);
        const isOpen = openDays.has(day.day);

        return (
          <div
            key={`day-${day.day}-${day.placeIds.join(",")}`}
            className={`bg-white rounded-lg border overflow-hidden transition-all relative ${
              draggedOverDay === day.day
                ? "border-[#7a8450] border-2"
                : "border-gray-200"
            }`}
          >
            {/* En-tête avec zone de drop */}
            <div
              className="relative"
              onDragOver={(e) => {
                if (isDragging && canEdit) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDragOver(e, day.day);
                }
              }}
              onDragLeave={(e) => {
                if (isDragging && canEdit) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDragLeave();
                }
              }}
              onDrop={(e) => {
                if (isDragging) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDrop(e, day.day);
                }
              }}
            >
              <button
                type="button"
                onClick={() => toggleDay(day.day)}
                className={`w-full flex items-center justify-between p-4 transition-colors ${
                  draggedOverDay === day.day
                    ? "border-[#7a8450] bg-opacity-10"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    <IoMdArrowDropdown size={20} className="text-gray-600" />
                  ) : (
                    <IoMdArrowDropright size={20} className="text-gray-600" />
                  )}
                  <FaCalendarAlt className="text-[#7a8450]" size={16} />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">
                      Jour {day.day}
                    </h3>
                    <p className="text-xs text-gray-600 capitalize">
                      {formatDate(day.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      ({dayPlaces.length} lieux)
                    </span>
                    {draggedOverDay === day.day && (
                      <span className="text-xs bg-[#7a8450] text-white px-2 py-1 rounded-full">
                        Déposer ici
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* Contenu */}
            {isOpen && (
              <div className="p-4 pt-0 space-y-2">
                {dayPlaces.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">
                    Aucun lieu prévu ce jour
                  </p>
                ) : (
                  dayPlaces.map((place, index) => (
                    <div
                      key={place.id}
                      className={`p-2 bg-gray-50 rounded border border-gray-200 transition-all ${
                        draggedPlace?.id === place.id
                          ? "opacity-50 scale-95 shadow-lg"
                          : "hover:bg-gray-100"
                      }`}
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
                          className={`flex items-center gap-2 ${
                            canEdit ? "cursor-move" : "cursor-default"
                          }`}
                          draggable={canEdit}
                          onDragStart={(e) =>
                            canEdit && handleDragStart(e, place)
                          }
                          onDragEnd={canEdit ? handleDragEnd : undefined}
                        >
                          {canEdit && (
                            <FaGripVertical
                              className="text-gray-400 flex-shrink-0 cursor-move"
                              size={12}
                            />
                          )}
                          <span className="flex-shrink-0 w-6 h-6 bg-[#7a8450] text-white text-xs rounded-full flex items-center justify-center font-medium">
                            {index + 1}
                          </span>
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
                          {/* Boutons d'action */}
                          <div className="flex gap-1 ml-2">
                            {/* Boutons de réordonnancement */}
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  movePlaceInDay(day.day, place.id, "up");
                                }}
                                disabled={index === 0}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors rounded"
                                title="Déplacer vers le haut"
                              >
                                <IoMdArrowUp size={12} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  movePlaceInDay(day.day, place.id, "down");
                                }}
                                disabled={index === dayPlaces.length - 1}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors rounded"
                                title="Déplacer vers le bas"
                              >
                                <IoMdArrowDown size={12} />
                              </button>
                            </div>
                            {/* Boutons de modification et suppression */}
                            {canEdit && (
                              <div className="flex gap-1">
                                {onEditPlace && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditing(place.id);
                                    }}
                                    className="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded"
                                    title="Modifier ce lieu"
                                  >
                                    <IoMdCreate size={12} />
                                  </button>
                                )}
                                {onDeletePlace && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (
                                        confirm(
                                          `Êtes-vous sûr de vouloir supprimer "${place.name}" de ce voyage ?`
                                        )
                                      ) {
                                        onDeletePlace(place.id);
                                      }
                                    }}
                                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded"
                                    title="Supprimer ce lieu du voyage"
                                  >
                                    <IoMdTrash size={12} />
                                  </button>
                                )}
                              </div>
                            )}
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

      {/* Lieux non planifiés */}
      {(unscheduledPlaces.length > 0 || isDragging) && (
        <div
          className={`rounded-lg border overflow-hidden mt-4 transition-all relative ${
            draggedOverDay === -1
              ? "border-[#7a8450] border-2 shadow-lg bg-[#7a8450] bg-opacity-5"
              : "border-blue-200 bg-blue-50"
          }`}
          onDragOver={(e) => {
            if (isDragging && canEdit) {
              e.preventDefault();
              e.stopPropagation();
              handleDragOver(e, -1); // -1 pour indiquer la zone non planifiés
            }
          }}
          onDragLeave={(e) => {
            if (isDragging && canEdit) {
              e.preventDefault();
              e.stopPropagation();
              handleDragLeave();
            }
          }}
          onDrop={(e) => {
            if (isDragging) {
              e.preventDefault();
              e.stopPropagation();
              handleDrop(e, -1); // -1 pour retirer du planning
            }
          }}
        >
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              Lieux non planifiés ({unscheduledPlaces.length})
              {draggedOverDay === -1 && (
                <span className="text-xs bg-[#7a8450] text-white px-2 py-1 rounded-full ml-2">
                  Déposer ici pour retirer du planning
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Glissez-déposez les lieux vers les jours souhaités pour les
              planifier
            </p>
            <div className="space-y-2">
              {unscheduledPlaces.map((place) => (
                <div
                  key={place.id}
                  className={`p-2 bg-white rounded border border-gray-200 transition-all ${
                    draggedPlace?.id === place.id
                      ? "opacity-50 scale-95 shadow-lg"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {editingPlaceId === place.id ? (
                    // Mode édition pour lieux non planifiés
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
                          className="px-3 py-1 text-xs bg-[#7a8450] text-white rounded hover:bg-[#6a8450] transition-colors"
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
                    // Mode affichage normal pour lieux non planifiés
                    <div
                      className={`flex items-start gap-2 ${
                        canEdit ? "cursor-move" : "cursor-default"
                      }`}
                      draggable={canEdit}
                      onDragStart={(e) => canEdit && handleDragStart(e, place)}
                      onDragEnd={canEdit ? handleDragEnd : undefined}
                    >
                      {canEdit && (
                        <FaGripVertical
                          className="text-gray-400 flex-shrink-0 mt-1 cursor-move"
                          size={14}
                        />
                      )}
                      <FaMapMarkerAlt
                        className="text-gray-400 flex-shrink-0 mt-1"
                        size={14}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900">
                          {place.name}
                        </p>
                        <p className="text-xs text-gray-600 truncate mb-1">
                          {place.address}
                        </p>
                        {place.description && (
                          <p className="text-xs text-gray-500 truncate">
                            {place.description}
                          </p>
                        )}
                        {!isDragging && (
                          <p className="text-xs text-gray-500 italic">
                            Glissez vers un jour pour planifier
                          </p>
                        )}
                      </div>
                      {/* Boutons d'action */}
                      {canEdit && (
                        <div className="flex gap-1">
                          {onEditPlace && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(place.id);
                              }}
                              className="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded flex-shrink-0"
                              title="Modifier ce lieu"
                            >
                              <IoMdCreate size={12} />
                            </button>
                          )}
                          {onDeletePlace && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  confirm(
                                    `Êtes-vous sûr de vouloir supprimer "${place.name}" de ce voyage ?`
                                  )
                                ) {
                                  onDeletePlace(place.id);
                                }
                              }}
                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded flex-shrink-0"
                              title="Supprimer ce lieu du voyage"
                            >
                              <IoMdTrash size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
