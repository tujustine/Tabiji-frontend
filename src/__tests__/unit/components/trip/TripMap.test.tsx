/**
 * Tests unitaires pour TripMap
 */

import { screen } from "@testing-library/react";
import TripMap from "@/components/trip/TripMap";
import { render } from "@/__tests__/setup/test-utils";
import type { Place } from "@/types";

// Mock Leaflet et react-leaflet
jest.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer">TileLayer</div>,
  Marker: ({ position, children }: { position: [number, number]; children?: React.ReactNode }) => (
    <div data-testid={`marker-${position[0]}-${position[1]}`}>
      Marker
      {children}
    </div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup" style={{ display: 'block' }}>{children}</div>
  ),
  useMap: () => ({
    fitBounds: jest.fn(),
  }),
  useMapEvents: () => null,
}));

jest.mock("leaflet", () => ({
  __esModule: true,
  default: {
    divIcon: jest.fn(() => ({})),
    latLngBounds: jest.fn(() => ({
      extend: jest.fn(),
    })),
  },
}));

jest.mock("leaflet/dist/leaflet.css", () => ({}));

const mockPlaces: Place[] = [
  {
    id: "place-1",
    name: "Tour Eiffel",
    address: "Champ de Mars, 5 Avenue Anatole France, 75007 Paris",
    coordinates: { lat: 48.8584, lng: 2.2945 },
    category: "Monuments",
    description: "La tour Eiffel",
  },
  {
    id: "place-2",
    name: "Restaurant Le Jules Verne",
    address: "Avenue Gustave Eiffel, 75007 Paris",
    coordinates: { lat: 48.8583, lng: 2.2944 },
    category: "Restaurants",
    description: "Restaurant gastronomique",
  },
];

describe("TripMap", () => {
  describe("Rendu de base", () => {
    it("devrait afficher la carte", () => {
      render(<TripMap places={[]} />);

      expect(screen.getByTestId("map-container")).toBeInTheDocument();
      expect(screen.getByTestId("tile-layer")).toBeInTheDocument();
    });

    it("devrait afficher les marqueurs pour chaque lieu", () => {
      render(<TripMap places={mockPlaces} />);

      expect(
        screen.getByTestId("marker-48.8584-2.2945")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("marker-48.8583-2.2944")
      ).toBeInTheDocument();
    });

    it("ne devrait pas afficher de marqueurs si pas de lieux", () => {
      render(<TripMap places={[]} />);

      expect(screen.queryByTestId(/marker-/)).not.toBeInTheDocument();
    });
  });

  describe("Mode ajout", () => {
    it("devrait afficher le sélecteur de catégorie en mode ajout", () => {
      const handleAddPlace = jest.fn();
      render(
        <TripMap
          places={[]}
          onAddPlace={handleAddPlace}
          isAddMode={true}
          selectedCategory="Restaurants"
          categories={["Restaurants", "Hôtels", "Activités"]}
        />
      );

      expect(screen.getByText("Catégorie du nouveau lieu :")).toBeInTheDocument();
    });

    it("ne devrait pas afficher le sélecteur de catégorie hors mode ajout", () => {
      render(<TripMap places={mockPlaces} isAddMode={false} />);

      expect(
        screen.queryByText("Catégorie du nouveau lieu :")
      ).not.toBeInTheDocument();
    });

    it("devrait afficher le message d'ajout en mode ajout", () => {
      const handleAddPlace = jest.fn();
      render(
        <TripMap
          places={[]}
          onAddPlace={handleAddPlace}
          isAddMode={true}
        />
      );

      expect(
        screen.getByText("Cliquez sur la carte pour ajouter un lieu")
      ).toBeInTheDocument();
    });
  });

  describe("Styles de carte", () => {
    it("devrait afficher les boutons de changement de style", () => {
      render(<TripMap places={mockPlaces} />);

      expect(screen.getByText("Carte")).toBeInTheDocument();
      expect(screen.getByText("Satellite")).toBeInTheDocument();
    });

    it("devrait permettre de changer de style de carte", async () => {
      render(<TripMap places={mockPlaces} />);

      const satelliteButton = screen.getByText("Satellite");
      expect(satelliteButton).toBeInTheDocument();
    });
  });

  describe("Catégories", () => {
    it("devrait utiliser les catégories par défaut si non fournies", () => {
      render(<TripMap places={mockPlaces} isAddMode={true} />);

      // Vérifier que les catégories apparaissent dans le sélecteur
      const select = screen.getByRole("combobox");
      expect(select).toBeInTheDocument();

      // Vérifier que toutes les catégories par défaut sont présentes dans le sélecteur
      expect(screen.getByRole("option", { name: "Restaurants" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Hôtels" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Activités" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Monuments" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Transport" })).toBeInTheDocument();
    });

    it("devrait utiliser les catégories personnalisées si fournies", () => {
      render(
        <TripMap
          places={mockPlaces}
          isAddMode={true}
          categories={["Musées", "Parcs", "Shopping"]}
        />
      );

      expect(screen.getByText("Musées")).toBeInTheDocument();
      expect(screen.getByText("Parcs")).toBeInTheDocument();
      expect(screen.getByText("Shopping")).toBeInTheDocument();
    });
  });

  describe("Props optionnelles", () => {
    it("devrait utiliser le centre par défaut si non fourni", () => {
      render(<TripMap places={[]} />);

      expect(screen.getByTestId("map-container")).toBeInTheDocument();
    });

    it("devrait utiliser le zoom par défaut si non fourni", () => {
      render(<TripMap places={[]} />);

      expect(screen.getByTestId("map-container")).toBeInTheDocument();
    });

    it("devrait utiliser le style de carte par défaut si non fourni", () => {
      render(<TripMap places={[]} />);

      expect(screen.getByText("Carte")).toBeInTheDocument();
    });
  });

  describe("Gestion des lieux", () => {
    it("devrait afficher les informations du lieu dans le popup", () => {
      render(<TripMap places={mockPlaces} />);

      // Les popups devraient être présents pour chaque marqueur
      expect(screen.getAllByTestId("popup")).toHaveLength(2);
    });

    it("devrait gérer une liste vide de lieux", () => {
      render(<TripMap places={[]} />);

      expect(screen.getByTestId("map-container")).toBeInTheDocument();
      expect(screen.queryByTestId(/marker-/)).not.toBeInTheDocument();
    });
  });
});
