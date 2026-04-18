/**
 * Composant carte interactive avec Leaflet
 * Affiche les lieux à visiter avec des marqueurs
 */

"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { IoMdAdd } from "react-icons/io";
import {
  IoRestaurant,
  IoBed,
  IoGameController,
  IoCamera,
  IoTrain,
  IoLocation,
} from "react-icons/io5";
import { renderToString } from "react-dom/server";
import type { Place } from "@/types";

// Styles CSS personnalisés pour la carte
const customMapStyles = `
  .leaflet-container {
    font-family: inherit;
  }

  .modern-marker {
    transition: transform 0.2s ease-in-out;
  }

  .modern-marker:hover {
    transform: scale(1.1) translate(-50%, -110%);
  }

  .leaflet-popup-content-wrapper {
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    border: none;
  }

  .leaflet-popup-tip {
    background-color: white;
  }

  .modern-popup .leaflet-popup-content {
    margin: 0;
  }
`;

// Fix pour les icônes Leaflet dans Next.js

// Icônes par catégorie pour différencier les marqueurs
const categoryIcons: Record<string, { icon: React.ReactNode; color: string }> =
  {
    Restaurants: { icon: <IoRestaurant />, color: "#e74c3c" },
    Hôtels: { icon: <IoBed />, color: "#3498db" },
    Activités: { icon: <IoGameController />, color: "#2ecc71" },
    Monuments: { icon: <IoCamera />, color: "#9b59b6" },
    Transport: { icon: <IoTrain />, color: "#f39c12" },
    default: { icon: <IoLocation />, color: "#7a8450" },
  };

// Créer une icône moderne pour chaque catégorie
const createModernIcon = (category: string) => {
  const { icon, color } = categoryIcons[category] || categoryIcons.default;

  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 3px 6px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
      transform: translate(-50%, -100%);
    ">
      ${renderToString(icon)}
    </div>`,
    className: "modern-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

// Composant pour ajuster les limites de la carte
function MapBounds({ places }: { places: Place[] }) {
  const map = useMap();

  useEffect(() => {
    if (places.length > 0) {
      const bounds = L.latLngBounds(
        places.map((place) => [place.coordinates.lat, place.coordinates.lng])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [places, map]);

  return null;
}

// Composant pour gérer les clics sur la carte
function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Styles de carte disponibles
const mapStyles = [
  {
    name: "Carte",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
  },
  {
    name: "Satellite",
    attribution:
      '&copy; <a href="https://www.esri.com/">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  },
];

interface TripMapProps {
  places: Place[];
  center?: [number, number];
  zoom?: number;
  onAddPlace?: (lat: number, lng: number) => void;
  isAddMode?: boolean;
  mapStyle?: number;
  selectedCategory?: string;
  categories?: string[];
  onCategoryChange?: (category: string) => void;
}

export default function TripMap({
  places,
  center = [48.8566, 2.3522], // Paris par défaut
  zoom = 13,
  onAddPlace,
  isAddMode = false,
  mapStyle = 0,
  selectedCategory = "Restaurants",
  categories = ["Restaurants", "Hôtels", "Activités", "Monuments", "Transport"],
  onCategoryChange,
}: Readonly<TripMapProps>) {
  const [currentMapStyle, setCurrentMapStyle] = useState(mapStyle);
  const handleMapClick = (lat: number, lng: number) => {
    if (isAddMode && onAddPlace) {
      onAddPlace(lat, lng);
    }
  };

  return (
    <div className="relative h-[400px] w-full rounded-lg overflow-hidden shadow-sm border border-gray-200">
      <style dangerouslySetInnerHTML={{ __html: customMapStyles }} />
      {/* Contrôles de la carte */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        {/* Sélecteur de catégorie */}
        {isAddMode && (
          <div className="bg-white rounded-lg shadow-md p-3">
            <div className="text-xs font-medium text-gray-700 mb-2">
              Catégorie du nouveau lieu :
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange?.(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7a8450] focus:border-[#7a8450]"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Boutons de style de carte */}
        <div className="bg-white rounded-lg shadow-md p-1 flex flex-col gap-1">
          {mapStyles.map((style, index) => (
            <button
              key={style.name}
              onClick={() => setCurrentMapStyle(index)}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                currentMapStyle === index
                  ? "bg-[#7a8450] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {style.name}
            </button>
          ))}
        </div>

        {/* Mode ajout */}
        {isAddMode && (
          <div className="bg-white px-3 py-2 rounded-md shadow-md flex items-center gap-2">
            <IoMdAdd className="text-[#7a8450]" size={16} />
            <span className="text-sm font-medium text-gray-700">
              Cliquez sur la carte pour ajouter un lieu
            </span>
          </div>
        )}
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        zoomControl={true}
        className={isAddMode ? "cursor-crosshair" : ""}
        zoomAnimation={true}
        fadeAnimation={true}
        markerZoomAnimation={true}
      >
        <TileLayer
          attribution={mapStyles[currentMapStyle].attribution}
          url={mapStyles[currentMapStyle].url}
        />

        {places.map((place) => (
          <Marker
            key={place.id}
            position={[place.coordinates.lat, place.coordinates.lng]}
            icon={createModernIcon(place.category)}
          >
            <Popup className="modern-popup">
              <div className="p-4 min-w-[240px] max-w-[300px]">
                <div className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm shadow-md"
                    style={{
                      backgroundColor:
                        categoryIcons[place.category]?.color ||
                        categoryIcons.default.color,
                    }}
                  >
                    {categoryIcons[place.category]?.icon ||
                      categoryIcons.default.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base mb-1 leading-tight">
                      {place.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                      {place.address}
                    </p>
                    {place.category && (
                      <span
                        className="inline-block px-2 py-1 text-xs text-white rounded-full font-medium shadow-sm"
                        style={{
                          backgroundColor:
                            categoryIcons[place.category]?.color ||
                            categoryIcons.default.color,
                        }}
                      >
                        {place.category}
                      </span>
                    )}
                  </div>
                </div>
                {place.description && (
                  <p className="text-sm text-gray-700 mt-3 leading-relaxed border-t border-gray-100 pt-3">
                    {place.description}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {places.length > 0 && <MapBounds places={places} />}
        {onAddPlace && <MapClickHandler onMapClick={handleMapClick} />}
      </MapContainer>
    </div>
  );
}
