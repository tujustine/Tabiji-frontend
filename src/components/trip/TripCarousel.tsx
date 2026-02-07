/**
 * Composant carrousel de voyages
 * Affiche une section avec un titre et un carrousel de cartes de voyage
 */

"use client";

import { useRef } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import TripCard from "./TripCard";

export interface Trip {
  id: string;
  image: string;
  title: string;
  startDate: string;
  endDate: string;
}

interface TripCarouselProps {
  title: string;
  trips: Trip[];
  emptyMessage?: string;
}

export default function TripCarousel({
  title,
  trips,
  emptyMessage = "Aucun voyage pour le moment",
}: TripCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollPosition =
        scrollContainerRef.current.scrollLeft +
        (direction === "right" ? scrollAmount : -scrollAmount);

      scrollContainerRef.current.scrollTo({
        left: newScrollPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="mb-12">
      {/* Titre de la section */}
      <h2 className="text-2xl font-bold text-gray-900 mb-6 font-bagel">
        {title}
      </h2>

      {/* Carrousel ou message vide */}
      {trips.length === 0 ? (
        <p className="text-gray-600 text-base italic px-1">{emptyMessage}</p>
      ) : (
        <div className="relative group">
          {/* Bouton précédent */}
          {trips.length > 3 && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              aria-label="Précédent"
            >
              <IoChevronBack size={24} className="text-gray-800" />
            </button>
          )}

          {/* Container du carrousel */}
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                id={trip.id}
                image={trip.image}
                title={trip.title}
                startDate={trip.startDate}
                endDate={trip.endDate}
              />
            ))}
          </div>

          {/* Bouton suivant */}
          {trips.length > 3 && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              aria-label="Suivant"
            >
              <IoChevronForward size={24} className="text-gray-800" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
