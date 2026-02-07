/**
 * Tests unitaires pour TripContext
 */

import { renderHook, act } from "@testing-library/react";
import React from "react";
import {
  TripProvider,
  useTrip,
  getAllCategories,
} from "@/contexts/TripContext";
import type { Trip, Place, Memory, TodoItem } from "@/types";

function wrapper({ children }: { readonly children: React.ReactNode }) {
  return <TripProvider>{children}</TripProvider>;
}

function useTripHook() {
  return useTrip();
}

function renderTripHookWithoutProvider() {
  return renderHook(useTripHook);
}

const mockTrip: Trip = {
  title: "Voyage test",
  description: "Description",
  destination: "Paris",
  startDate: "2025-01-01",
  endDate: "2025-01-07",
  image: "https://example.com/image.jpg",
  participants: [],
  memories: [],
  places: [],
  todoItems: [],
  daySchedule: [],
};

describe("TripContext", () => {
  describe("chargement et mise à jour du voyage", () => {
    it("devrait initialiser avec un voyage vide", () => {
      const { result } = renderHook(() => useTrip(), { wrapper });

      expect(result.current.trip.title).toBe("");
      expect(result.current.trip.destination).toBe("");
      expect(result.current.trip.places).toEqual([]);
      expect(result.current.trip.memories).toEqual([]);
    });

    it("devrait charger un voyage via SET_TRIP", () => {
      const { result } = renderHook(() => useTrip(), { wrapper });

      act(() => {
        result.current.dispatch({ type: "SET_TRIP", payload: mockTrip });
      });

      expect(result.current.trip.title).toBe("Voyage test");
      expect(result.current.trip.destination).toBe("Paris");
      expect(result.current.trip.startDate).toBe("2025-01-01");
    });

    it("devrait mettre à jour les infos de base via UPDATE_BASIC_INFO", () => {
      const { result } = renderHook(() => useTrip(), { wrapper });

      act(() => {
        result.current.dispatch({ type: "SET_TRIP", payload: mockTrip });
      });

      act(() => {
        result.current.dispatch({
          type: "UPDATE_BASIC_INFO",
          payload: { title: "Nouveau titre", destination: "Lyon" },
        });
      });

      expect(result.current.trip.title).toBe("Nouveau titre");
      expect(result.current.trip.destination).toBe("Lyon");
    });
  });

  describe("gestion des lieux", () => {
    const mockPlace: Place = {
      id: "place-1",
      name: "Tour Eiffel",
      address: "Paris",
      coordinates: { lat: 48.8584, lng: 2.2945 },
      category: "Monuments",
      description: "",
    };

    it("devrait ajouter un lieu via ADD_PLACE", () => {
      const { result } = renderHook(() => useTrip(), { wrapper });

      act(() => {
        result.current.dispatch({ type: "SET_TRIP", payload: mockTrip });
      });

      act(() => {
        result.current.dispatch({ type: "ADD_PLACE", payload: mockPlace });
      });

      expect(result.current.trip.places).toHaveLength(1);
      expect(result.current.trip.places[0].name).toBe("Tour Eiffel");
    });

    it("devrait retirer un lieu via REMOVE_PLACE", () => {
      const { result } = renderHook(() => useTrip(), { wrapper });

      act(() => {
        result.current.dispatch({
          type: "SET_TRIP",
          payload: { ...mockTrip, places: [mockPlace] },
        });
      });

      act(() => {
        result.current.dispatch({ type: "REMOVE_PLACE", payload: "place-1" });
      });

      expect(result.current.trip.places).toHaveLength(0);
    });
  });

  describe("gestion des todos", () => {
    const mockTodo: TodoItem = {
      id: "todo-1",
      text: "Réserver l'hôtel",
      completed: false,
      order: 0,
    };

    it("devrait ajouter un todo via ADD_TODO", () => {
      const { result } = renderHook(() => useTrip(), { wrapper });

      act(() => {
        result.current.dispatch({ type: "SET_TRIP", payload: mockTrip });
      });

      act(() => {
        result.current.dispatch({ type: "ADD_TODO", payload: mockTodo });
      });

      expect(result.current.trip.todoItems).toHaveLength(1);
      expect(result.current.trip.todoItems[0].text).toBe("Réserver l'hôtel");
    });

    it("devrait basculer un todo via TOGGLE_TODO", () => {
      const { result } = renderHook(() => useTrip(), { wrapper });

      act(() => {
        result.current.dispatch({
          type: "SET_TRIP",
          payload: { ...mockTrip, todoItems: [mockTodo] },
        });
      });

      act(() => {
        result.current.dispatch({ type: "TOGGLE_TODO", payload: "todo-1" });
      });

      expect(result.current.trip.todoItems[0].completed).toBe(true);
    });
  });

  describe("gestion des souvenirs", () => {
    const mockMemory: Memory = {
      id: "mem-1",
      type: "text",
      content: "Souvenir",
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      zIndex: 0,
    };

    it("devrait ajouter un souvenir via ADD_MEMORY", () => {
      const { result } = renderHook(() => useTrip(), { wrapper });

      act(() => {
        result.current.dispatch({ type: "SET_TRIP", payload: mockTrip });
      });

      act(() => {
        result.current.dispatch({ type: "ADD_MEMORY", payload: mockMemory });
      });

      expect(result.current.trip.memories).toHaveLength(1);
      expect(result.current.trip.memories[0].content).toBe("Souvenir");
    });

    it("devrait retirer un souvenir via REMOVE_MEMORY", () => {
      const { result } = renderHook(() => useTrip(), { wrapper });

      act(() => {
        result.current.dispatch({
          type: "SET_TRIP",
          payload: { ...mockTrip, memories: [mockMemory] },
        });
      });

      act(() => {
        result.current.dispatch({ type: "REMOVE_MEMORY", payload: "mem-1" });
      });

      expect(result.current.trip.memories).toHaveLength(0);
    });
  });

  describe("useTrip sans provider", () => {
    it("devrait lever une erreur si utilisé hors TripProvider", () => {
      expect(renderTripHookWithoutProvider).toThrow(
        "useTrip doit être utilisé dans un TripProvider"
      );
    });
  });
});

describe("getAllCategories", () => {
  it("devrait retourner les catégories par défaut et celles des lieux", () => {
    const places: Place[] = [
      {
        id: "1",
        name: "Lieu",
        address: "",
        coordinates: { lat: 0, lng: 0 },
        category: "CustomCat",
        description: "",
      },
    ];
    const categories = getAllCategories(places, ["MaCatégorie"]);
    expect(categories).toContain("Restaurants");
    expect(categories).toContain("Monuments");
    expect(categories).toContain("CustomCat");
    expect(categories).toContain("MaCatégorie");
  });
});
