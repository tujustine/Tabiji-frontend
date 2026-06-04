/**
 * Context pour gérer l'état d'un voyage
 * Utilise useReducer pour gérer les opérations complexes
 */

"use client";

import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  ReactNode,
} from "react";
import type {
  Trip,
  Place,
  TodoItem,
  Memory,
  DaySchedule,
} from "@/types";

// Types d'actions
type TripAction =
  | { type: "SET_TRIP"; payload: Trip }
  | {
      type: "APPLY_REALTIME_UPDATE";
      payload: { trip?: Partial<Trip>; customCategories?: string[] };
    }
  | { type: "UPDATE_BASIC_INFO"; payload: Partial<Trip> }
  | { type: "ADD_PLACE"; payload: Place }
  | { type: "REMOVE_PLACE"; payload: string }
  | { type: "UPDATE_PLACE"; payload: { id: string; updates: Partial<Place> } }
  | { type: "ADD_TODO"; payload: TodoItem }
  | { type: "REMOVE_TODO"; payload: string }
  | { type: "TOGGLE_TODO"; payload: string }
  | { type: "REORDER_TODOS"; payload: TodoItem[] }
  | { type: "ADD_MEMORY"; payload: Memory }
  | { type: "UPDATE_MEMORY"; payload: { id: string; updates: Partial<Memory> } }
  | { type: "REMOVE_MEMORY"; payload: string }
  | { type: "UPDATE_DAY_SCHEDULE"; payload: DaySchedule[] }
  | { type: "ASSIGN_PLACE_TO_DAY"; payload: { placeId: string; day: number } }
  | {
      type: "REORDER_PLACES_IN_DAY";
      payload: { day: number; placeIds: string[] };
    }
  | { type: "ADD_CUSTOM_CATEGORY"; payload: string }
  | { type: "SET_CUSTOM_CATEGORIES"; payload: string[] };

// État initial
const initialTrip: Trip = {
    title: "",
    description: "",
    destination: "",
    startDate: "",
    endDate: "",
    image: "",
    participants: [],
  memories: [],
  places: [],
  todoItems: [],
  daySchedule: [],
};

// Catégories par défaut
const DEFAULT_CATEGORIES = [
  "Restaurants",
  "Hôtels",
  "Activités",
  "Monuments",
  "Transport",
];

// État initial du contexte
const initialContextState = {
  trip: initialTrip,
  customCategories: [] as string[],
};

// Type de l'état complet
interface TripContextState {
  trip: Trip;
  customCategories: string[];
}

// Reducer
function tripReducer(state: TripContextState, action: TripAction): TripContextState {
  switch (action.type) {
    case "SET_TRIP":
      return { ...state, trip: action.payload };

    case "APPLY_REALTIME_UPDATE":
      return {
        ...state,
        trip: action.payload.trip
          ? { ...state.trip, ...action.payload.trip }
          : state.trip,
        customCategories:
          action.payload.customCategories ?? state.customCategories,
      };

    case "UPDATE_BASIC_INFO":
      return { ...state, trip: { ...state.trip, ...action.payload } };

    case "ADD_PLACE":
      return { ...state, trip: { ...state.trip, places: [...state.trip.places, action.payload] } };

    case "REMOVE_PLACE": {
      const placeId = action.payload;
      return {
        ...state,
        trip: {
          ...state.trip,
          places: state.trip.places.filter((p) => p.id !== placeId),
          daySchedule: state.trip.daySchedule.map((day) => ({
            ...day,
            placeIds: day.placeIds.filter((id) => id !== placeId),
          })),
        },
      };
    }

    case "UPDATE_PLACE":
      return {
        ...state,
        trip: {
          ...state.trip,
          places: state.trip.places.map((p) =>
            p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
          ),
        },
      };

    case "ADD_TODO":
      return { ...state, trip: { ...state.trip, todoItems: [...state.trip.todoItems, action.payload] } };

    case "REMOVE_TODO":
      return {
        ...state,
        trip: {
          ...state.trip,
          todoItems: state.trip.todoItems.filter((t) => t.id !== action.payload),
        },
      };

    case "TOGGLE_TODO":
      return {
        ...state,
        trip: {
          ...state.trip,
          todoItems: state.trip.todoItems.map((t) =>
            t.id === action.payload ? { ...t, completed: !t.completed } : t
          ),
        },
      };

    case "REORDER_TODOS":
      return { ...state, trip: { ...state.trip, todoItems: action.payload } };

    case "ADD_MEMORY":
      return { ...state, trip: { ...state.trip, memories: [...state.trip.memories, action.payload] } };

    case "UPDATE_MEMORY":
      return {
        ...state,
        trip: {
          ...state.trip,
          memories: state.trip.memories.map((m) =>
            m.id === action.payload.id ? { ...m, ...action.payload.updates } : m
          ),
        },
      };

    case "REMOVE_MEMORY":
      return {
        ...state,
        trip: {
          ...state.trip,
          memories: state.trip.memories.filter((m) => m.id !== action.payload),
        },
      };

    case "UPDATE_DAY_SCHEDULE":
      return { ...state, trip: { ...state.trip, daySchedule: action.payload } };

    case "ASSIGN_PLACE_TO_DAY": {
      const { placeId, day } = action.payload;

      // Vérifier si le jour cible existe
      const targetDayExists = state.trip.daySchedule.some((d) => d.day === day);
      const newDaySchedule = [...state.trip.daySchedule];

      // Si le jour cible n'existe pas et que day > 0, le créer
      if (!targetDayExists && day > 0) {
        newDaySchedule.push({
          day,
          date: new Date(), // La date sera mise à jour par prepareDays
          placeIds: [],
        });
      }

      // RETIRER le lieu de TOUS les jours d'abord
      const cleanedDaySchedule = newDaySchedule.map((d) => ({
        ...d,
        placeIds: d.placeIds.filter((id) => id !== placeId),
      }));

      // AJOUTER le lieu UNIQUEMENT au jour cible
      const updatedDaySchedule = cleanedDaySchedule.map((d) =>
        d.day === day
          ? {
              ...d,
              placeIds: [...d.placeIds, placeId],
            }
          : d
      );

      return {
        ...state,
        trip: { ...state.trip, daySchedule: updatedDaySchedule },
      };
    }

    case "REORDER_PLACES_IN_DAY": {
      const { day, placeIds } = action.payload;
      return {
        ...state,
        trip: {
          ...state.trip,
          daySchedule: state.trip.daySchedule.map((d) =>
            d.day === day
              ? {
                  ...d,
                  placeIds,
                }
              : d
          ),
        },
      };
    }

    case "ADD_CUSTOM_CATEGORY": {
      const category = action.payload.trim();
      if (category && !DEFAULT_CATEGORIES.includes(category) && !state.customCategories.includes(category)) {
        return {
          ...state,
          customCategories: [...state.customCategories, category].sort((a, b) =>
            a.localeCompare(b)
          ),
        };
      }
      return state;
    }

    case "SET_CUSTOM_CATEGORIES": {
      return {
        ...state,
        customCategories: action.payload,
      };
    }

    default:
      return state;
  }
}

// Context
interface TripContextType {
  trip: Trip;
  customCategories: string[];
  dispatch: React.Dispatch<TripAction>;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

// Provider
export function TripProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [state, dispatch] = useReducer(tripReducer, initialContextState);

  const value = useMemo(() => ({
    trip: state.trip,
    customCategories: state.customCategories,
    dispatch
  }), [state.trip, state.customCategories]);

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

// Hook personnalisé
export function useTrip() {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error("useTrip doit être utilisé dans un TripProvider");
  }
  return context;
}

// Fonction pour obtenir toutes les catégories disponibles
export function getAllCategories(places: Place[], customCategories: string[] = []) {
  // Récupérer toutes les catégories utilisées dans les lieux
  const usedCategories = new Set(places.map(p => p.category).filter(c => c?.trim()));
  // Combiner avec les catégories par défaut et personnalisées
  return [...new Set([...DEFAULT_CATEGORIES, ...usedCategories, ...customCategories])].sort((a, b) =>
    a.localeCompare(b)
  );
}
