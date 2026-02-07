/**
 * Composant polaroid pour créer un nouveau voyage
 * Affiche un gros + pour inviter à créer un voyage
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { IoMdAdd } from "react-icons/io";

export default function NewTripPolaroid() {
  const router = useRouter();
  const { token } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTrip = async () => {
    if (isCreating) return;

    setIsCreating(true);

    try {
      // Créer un nouveau voyage vide en BDD
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_API_URL_FALLBACK
        }/trip`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: "Nouveau voyage",
            description: "",
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la création du voyage");
      }

      const data = await response.json();

      // Rediriger vers la page de détail du nouveau voyage
      router.push(`/trips/${data._id || data.id}`);
    } catch (error) {
      console.error("Erreur:", error);
      setIsCreating(false);
    }
  };

  return (
    <button
      onClick={handleCreateTrip}
      disabled={isCreating}
      className="relative group cursor-pointer w-full text-left"
    >
      <div className="bg-white p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-rotate-1">
        {/* Zone du "+" */}
        <div className="relative w-full aspect-square bg-[#f6e6d1] mb-4 flex items-center justify-center">
          {isCreating ? (
            <div className="text-[#7a8450] text-xl font-bold">...</div>
          ) : (
            <IoMdAdd className="text-[#7a8450] w-24 h-24 " />
          )}
        </div>

        {/* Partie blanche du polaroid avec texte */}
        <div className="text-center space-y-1 pb-2">
          <h3 className="text-lg font-semibold text-gray-900 font-bagel">
            Nouveau voyage
          </h3>
          <p className="text-sm text-gray-600">
            {isCreating ? "Création..." : "Créer un voyage"}
          </p>
        </div>
      </div>
    </button>
  );
}
