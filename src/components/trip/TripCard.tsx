/**
 * Composant carte de voyage individuelle
 * Affiche l'image, le nom et les dates d'un voyage
 */

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useFavorites } from "@/contexts/FavoritesContext";
import favIcon from "@/media/fav.png";
import noFavIcon from "@/media/no_fav.png";

interface TripCardProps {
  id: string;
  image: string;
  title: string;
  startDate: string;
  endDate: string;
}

export default function TripCard({
  id,
  image,
  title,
  startDate,
  endDate,
}: Readonly<TripCardProps>) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(id);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasImage, setHasImage] = useState(!!image);

  useEffect(() => {
    setHasImage(!!image);
  }, [image]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id);

    // Déclencher l'animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 400);
  };

  return (
    <Link
      href={`/trips/${id}`}
      className="relative flex-shrink-0 w-80 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer"
    >
      {/* Image du voyage */}
      <div className="relative h-48 w-full">
        {hasImage ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
            onError={() => setHasImage(false)}
          />
        ) : (
          <div className="absolute inset-0 bg-black" />
        )}

        {/* Bouton favori */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-2 right-2 z-10 transition-transform hover:scale-110 ${
            isAnimating ? "favorite-animate" : ""
          }`}
          aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Image
            src={favorite ? favIcon : noFavIcon}
            alt={favorite ? "Favori" : "Non favori"}
            width={28}
            height={28}
            className="drop-shadow-md"
            style={{ width: "auto", height: "auto" }}
          />
        </button>
      </div>

      {/* Informations du voyage */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
          {title}
        </h3>
        <p className="text-sm text-gray-600">
          {startDate} - {endDate}
        </p>
      </div>
    </Link>
  );
}
