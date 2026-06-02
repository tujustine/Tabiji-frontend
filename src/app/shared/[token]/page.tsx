"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaMapMarkedAlt,
  FaUserPlus,
  FaImages,
} from "react-icons/fa";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import TravelLoader from "@/components/ui/TravelLoader";

interface SharedTrip {
  id: string;
  title: string;
  image: string;
  owner: {
    id: string;
    username: string;
    email: string;
    profilePhoto?: string;
  };
  shareRole: "EDITOR" | "VIEWER";
}

interface SharedData {
  trip: SharedTrip;
}

export default function SharedTripPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token: authToken } = useAuth();
  const shareToken = params.token as string;
  const [data, setData] = useState<SharedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les données du voyage partagé
  useEffect(() => {
    const fetchSharedTrip = async () => {
      try {
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL ||
            process.env.NEXT_PUBLIC_API_URL_FALLBACK
          }/share/${shareToken}/info`
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Lien de partage non trouvé");
          } else if (response.status === 410) {
            throw new Error("Ce lien de partage a expiré");
          } else {
            throw new Error("Erreur lors du chargement du voyage");
          }
        }

        const sharedData = await response.json();
        setData(sharedData);
      } catch (err) {
        console.error("Erreur:", err);
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (shareToken) {
      fetchSharedTrip();
    }
  }, [shareToken]);

  // Rejoindre le voyage
  const handleJoinTrip = async () => {
    if (!user || !authToken) {
      // Rediriger vers la page de connexion
      router.push(`/user/login?redirect=/shared/${shareToken}`);
      return;
    }

    setIsJoining(true);
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_API_URL_FALLBACK
        }/share/${shareToken}/join`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'ajout du voyage");
      }

      toast.success("Voyage ajouté à vos voyages !");
      router.push("/trips");
    } catch (err) {
      console.error("Erreur:", err);
      toast.error(
        err instanceof Error ? err.message : "Une erreur est survenue"
      );
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return <TravelLoader fullScreen label="Chargement de l'invitation..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f6e6d1] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <FaImages className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oups !</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#7a8450] hover:bg-[#6a7445] text-white px-6 py-3 rounded-md transition-colors"
          >
            <FaArrowLeft />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const invitationMessage =
    data.trip.shareRole === "EDITOR"
      ? `souhaite collaborer avec vous pour le voyage "${data.trip.title}"`
      : `souhaite partager avec vous son voyage "${data.trip.title}"`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6e6d1] to-[#e8d5b7]">
      {/* Contenu principal centré */}
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="max-w-md w-full">
          {/* Bouton retour */}
          <div className="mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-white/90 hover:bg-white text-gray-700 px-4 py-2 rounded-full shadow-lg transition-colors backdrop-blur-sm"
            >
              <FaArrowLeft size={16} />
              <span className="text-sm font-medium">Retour</span>
            </Link>
          </div>

          {/* Carte d'invitation */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Image du voyage */}
            <div className="relative h-48 bg-[#f6e6d1]">
              {data.trip.image ? (
                <Image
                  src={data.trip.image}
                  alt={data.trip.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FaMapMarkedAlt className="w-16 h-16 text-[#7a8450]/50" />
                </div>
              )}

              {/* Badge du rôle */}
              <div className="absolute top-4 right-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    data.trip.shareRole === "EDITOR"
                      ? "bg-blue-500 text-white"
                      : "bg-green-500 text-white"
                  }`}
                >
                  {data.trip.shareRole === "EDITOR" ? "Éditeur" : "Lecteur"}
                </span>
              </div>
            </div>

            {/* Contenu de l'invitation */}
            <div className="p-8 text-center">
              {/* Avatar et nom du propriétaire */}
              <div className="flex items-center justify-center mb-6">
                {data.trip.owner.profilePhoto ? (
                  <Image
                    src={data.trip.owner.profilePhoto}
                    alt={data.trip.owner.username}
                    width={64}
                    height={64}
                    className="rounded-full object-cover border-2 border-[#7a8450]"
                    unoptimized
                  />
                ) : (
                  <div className="w-16 h-16 bg-[#7a8450] rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {data.trip.owner.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Message d'invitation */}
              <h1 className="text-2xl font-bold text-gray-900 font-bagel mb-2">
                {data.trip.owner.username}
              </h1>
              <p className="text-gray-600 mb-8 leading-relaxed">
                {invitationMessage}
              </p>

              {/* Bouton rejoindre */}
              <button
                onClick={handleJoinTrip}
                disabled={isJoining}
                className="w-full bg-[#7a8450] hover:bg-[#6a7445] disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <FaUserPlus size={18} />
                {isJoining ? "Ajout en cours..." : "Rejoindre ce voyage"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
