"use client";

import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/utils/dateFormatter";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IoMdAdd } from "react-icons/io";
import TripCarousel from "@/components/trip/TripCarousel";

interface ApiTrip {
  id: string;
  _id?: string; // Pour compatibilité avec l'ancien format
  image?: string;
  title: string;
  startDate: string;
  endDate: string;
}

export default function DashboardClient() {
  const { user, token, isLoggingOut } = useAuth();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [allTrips, setAllTrips] = useState<ApiTrip[]>([]);
  const [recentTripsList, setRecentTripsList] = useState<
    { id: string; viewedAt: string }[]
  >([]);

  // Garde une référence du dernier utilisateur connecté pour éviter le flash
  const lastUserRef = useRef(user);

  if (user) {
    lastUserRef.current = user;
  }

  const displayUser = isLoggingOut ? lastUserRef.current : user;

  // Plus de redirection côté client - géré par le middleware côté serveur

  // Charger les voyages réels de l'utilisateur
  useEffect(() => {
    const loadTrips = async () => {
      if (!token) {
        setAllTrips([]);
        return;
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/trips`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch trips");
        const data: ApiTrip[] = await res.json();
        setAllTrips(data);
      } catch {
        setAllTrips([]);
      }
    };
    loadTrips();
  }, [token]);

  // Charger les trips récents depuis l'API
  useEffect(() => {
    const loadRecentTrips = async () => {
      if (!token) {
        setRecentTripsList([]);
        return;
      }
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/user/recent-trips`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch recent trips");
        const data: { id: string; viewedAt: string }[] = await res.json();
        setRecentTripsList(data);
      } catch {
        setRecentTripsList([]);
      }
    };
    loadRecentTrips();
  }, [token]);

  // Construire les sections
  const now = new Date();
  const upcomingTrips = allTrips
    .filter((t) => new Date(t.startDate) > now)
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )
    .map((t) => ({
      id: t.id || t._id || "",
      image: t.image || "",
      title: t.title,
      startDate: formatDate(t.startDate),
      endDate: formatDate(t.endDate),
    }));

  // Construire la liste des trips récents depuis l'API
  const recentTrips = recentTripsList
    .map((e) => {
      // Chercher le trip qui correspond à l'ID depuis l'API
      // L'ID peut être soit dans t.id (Prisma) soit dans t._id (ancien format)
      const trip = allTrips.find((t) => t.id === e.id || t._id === e.id);
      return trip;
    })
    .filter((t): t is ApiTrip => !!t)
    .map((t) => ({
      id: t.id || t._id || "",
      image: t.image || "",
      title: t.title,
      startDate: formatDate(t.startDate),
      endDate: formatDate(t.endDate),
    }));

  const allTripsForCarousel = allTrips.map((t) => ({
    id: t.id || t._id || "",
    image: t.image || "",
    title: t.title,
    startDate: formatDate(t.startDate),
    endDate: formatDate(t.endDate),
  }));

  const handleCreateTrip = async () => {
    if (isCreating) return; // Éviter les doubles clics

    setIsCreating(true);

    try {
      const authToken = token;

      // Créer un nouveau voyage vide en BDD
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_API_URL_FALLBACK
        }/trip`,
        {
          method: "POST",
          headers: authToken
            ? {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              }
            : { "Content-Type": "application/json" },
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
      router.push(`/trips/${data.id || data._id}`);

      // Remettre isCreating à false après la redirection réussie
      setIsCreating(false);
    } catch (error) {
      console.error("Erreur:", error);
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6e6d1] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête avec titre et bouton */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 font-bagel mb-6">
            Bonjour @{displayUser?.username || "Utilisateur"}
          </h1>
          <button
            onClick={handleCreateTrip}
            disabled={isCreating}
            className="bg-[#7a8450] hover:bg-[#6a7445] disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-md flex items-center gap-2 mx-auto transition-colors duration-200"
          >
            <IoMdAdd size={20} />
            {isCreating ? "Création en cours..." : "Nouveau voyage"}
          </button>
        </div>

        {/* Section À venir */}
        <TripCarousel
          title="À venir"
          trips={upcomingTrips}
          emptyMessage="Aucun voyage prévu pour le moment"
        />

        {/* Section Vu récemment */}
        <TripCarousel
          title="Vu récemment"
          trips={recentTrips}
          emptyMessage="Aucun voyage récent"
        />

        {/* Section Mes voyages */}
        <TripCarousel
          title="Mes voyages"
          trips={allTripsForCarousel}
          emptyMessage="Vous n'avez pas encore créé de voyage"
        />
      </div>
    </div>
  );
}
