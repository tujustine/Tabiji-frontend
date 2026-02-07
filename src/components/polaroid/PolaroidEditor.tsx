/**
 * Composant polaroid éditable pour un voyage
 * Permet de modifier l'image, le nom, les dates et le statut favori
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { IoMdAdd } from "react-icons/io";
import Modal from "@/components/modal/Modal";
import favIcon from "@/media/fav.png";
import noFavIcon from "@/media/no_fav.png";
import { formatDate } from "@/utils/dateFormatter";

interface PolaroidEditorProps {
  image: string;
  title: string;
  startDate: string;
  endDate: string;
  isFavorite: boolean;
  canEdit?: boolean;
  onImageChange: (image: string) => void;
  onTitleChange: (title: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onFavoriteToggle: () => void;
}

export default function PolaroidEditor({
  image,
  title,
  startDate,
  endDate,
  isFavorite,
  canEdit = true,
  onImageChange,
  onTitleChange,
  onStartDateChange,
  onEndDateChange,
  onFavoriteToggle,
}: Readonly<PolaroidEditorProps>) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Convertir une date ISO en format yyyy-MM-dd pour les inputs HTML
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return "";
    // Si c'est déjà au format yyyy-MM-dd, le retourner tel quel
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    // Sinon, convertir depuis ISO ou autre format
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return "";
      return date.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavoriteToggle();
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 400);
  };

  // Gérer le téléchargement d'une photo
  const handleUploadPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Veuillez sélectionner une image valide");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const photoData = e.target?.result as string;
        onImageChange(photoData);
        setShowImageModal(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative max-w-md mx-auto">
      {/* Polaroid */}
      <div className="bg-white p-6 shadow-md">
        {/* Zone image */}
        <div className="relative">
          <button
            type="button"
            className={`relative w-full aspect-square bg-[#f6e6d1] flex items-center justify-center group overflow-hidden ${
              canEdit ? "cursor-pointer" : "cursor-default"
            }`}
            onClick={() => canEdit && setShowImageModal(true)}
            disabled={!canEdit}
            aria-label={
              canEdit ? "Changer l'image du voyage" : "Image du voyage"
            }
          >
            {image ? (
              <>
                <Image src={image} alt={title} fill className="object-cover" />
                {canEdit && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white font-medium">Changer l&apos;image</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-[#7a8450]">
                <IoMdAdd className="w-16 h-16" />
                <p className="font-medium">Ajouter une image</p>
              </div>
            )}
          </button>

          {/* Bouton favori */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            className={`absolute top-2 right-2 z-10 transition-transform hover:scale-110 ${
              isAnimating ? "favorite-animate" : ""
            }`}
            aria-label={
              isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
            }
          >
            <Image
              src={isFavorite ? favIcon : noFavIcon}
              alt={isFavorite ? "Favori" : "Non favori"}
              width={28}
              height={28}
              className="drop-shadow-md"
              style={{ width: "auto", height: "auto" }}
            />
          </button>
        </div>

        {/* Infos éditables */}
        <div className="mt-4 space-y-3">
          {/* Titre */}
          {canEdit ? (
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Nom du voyage"
              className="w-full text-xl font-bold text-gray-900 font-bagel text-center bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-[#7a8450] focus:outline-none transition-colors px-2 py-1"
            />
          ) : (
            <div className="w-full text-xl font-bold text-gray-900 font-bagel text-center px-2 py-1">
              {title}
            </div>
          )}

          {/* Dates */}
          <div className="flex gap-2 items-center justify-center text-sm">
            {canEdit ? (
              <>
                <input
                  type="date"
                  value={formatDateForInput(startDate)}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#7a8450]"
                />
                <span className="text-gray-600">→</span>
                <input
                  type="date"
                  value={formatDateForInput(endDate)}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#7a8450]"
                  min={formatDateForInput(startDate) || undefined}
                />
              </>
            ) : (
              <span className="text-gray-600">
                {formatDate(startDate)} → {formatDate(endDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Modale de sélection d'image */}
      <Modal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        title="Choisir une image"
        size="md"
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleUploadPhoto}
          className="hidden"
          id="trip-image-upload"
        />

        <label
          htmlFor="trip-image-upload"
          className="block cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#7a8450] hover:bg-gray-50 transition-colors"
        >
          <p className="text-gray-600 font-medium">
            Cliquez pour télécharger une photo
          </p>
          <p className="text-gray-500 text-sm mt-2">
            (JPG, PNG, GIF - Max 5MB)
          </p>
        </label>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowImageModal(false)}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-md transition-colors"
          >
            Annuler
          </button>
        </div>
      </Modal>
    </div>
  );
}
