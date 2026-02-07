/**
 * Composant carte de voyage style polaroid
 * Affiche l'image, le nom et les dates d'un voyage dans un style polaroid
 */

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { FaLink } from "react-icons/fa";
import favIcon from "@/media/fav.png";
import noFavIcon from "@/media/no_fav.png";

interface PolaroidCardProps {
  id: string;
  image: string;
  title: string;
  startDate: string;
  endDate: string;
  isShared?: boolean;
}

export default function PolaroidCard({
  id,
  image,
  title,
  startDate,
  endDate,
  isShared = false,
}: Readonly<PolaroidCardProps>) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(id);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id);

    // Déclencher l'animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 400);
  };

  return (
    <div className="relative group">
      <Link href={`/trips/${id}`}>
        <div className="bg-white p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-rotate-1 cursor-pointer relative">
          {/* Image du voyage */}
          <div className="relative w-full aspect-square bg-black mb-4">
            {image && (
              <Image src={image} alt={title} fill className="object-cover" />
            )}
          </div>

          {/* Partie blanche du polaroid avec infos */}
          <div className="text-center space-y-1 pb-2">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 font-bagel truncate">
                {title}
              </h3>
              {isShared && (
                <FaLink
                  size={14}
                  className="text-gray-500 flex-shrink-0"
                  title="Voyage partagé"
                />
              )}
            </div>
            <p className="text-sm text-gray-600">
              {startDate} - {endDate}
            </p>
          </div>

          {/* Bouton favori */}
          <button
            onClick={handleFavoriteClick}
            className={`absolute top-6 right-6 z-10 transition-transform hover:scale-110 ${
              isAnimating ? "favorite-animate" : ""
            }`}
            aria-label={
              favorite ? "Retirer des favoris" : "Ajouter aux favoris"
            }
          >
            <Image
              src={favorite ? favIcon : noFavIcon}
              alt={favorite ? "Favori" : "Non favori"}
              width={32}
              height={32}
              className="drop-shadow-md"
            />
          </button>
        </div>
      </Link>
    </div>
  );
}
