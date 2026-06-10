/**
 * Page des souvenirs d'un voyage
 * Affiche le tableau blanc interactif
 */

"use client";

import { useEffect, useState, use } from "react";
import dynamic from "next/dynamic";
import TravelLoader from "@/components/ui/TravelLoader";

// Composant client-only pour éviter les problèmes SSR
const MemoriesCanvas = dynamic(
  () => import("@/components/memories/MemoriesCanvas"),
  {
    ssr: false,
    loading: () => <TravelLoader fullScreen label="Chargement des souvenirs..." />,
  }
);
import { useAuth } from "@/contexts/AuthContext";
import type { Memory } from "@/types";

interface MemoriesPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function MemoriesPage({ params }: MemoriesPageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [tripTitle, setTripTitle] = useState<string>("Tableau des souvenirs");
  const [canEdit, setCanEdit] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  // Plus de redirection côté client - géré par le middleware côté serveur

  // Fonction pour lire les cookies
  const getCookie = (name: string): string | null => {
    if (globalThis.window === undefined) return null;
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (const c of ca) {
      let cookie = c;
      while (cookie.charAt(0) === " ")
        cookie = cookie.substring(1, cookie.length);
      if (cookie.indexOf(nameEQ) === 0)
        return cookie.substring(nameEQ.length, cookie.length);
    }
    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getCookie("token");
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_API_URL_FALLBACK ||
          "http://localhost:4000";

        // Récupérer les informations du voyage
        const tripResponse = await fetch(`${apiUrl}/trip/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (tripResponse.ok) {
          const tripData = await tripResponse.json();
          setTripTitle(tripData.title || "Tableau des souvenirs");
          setCanEdit(tripData.userPermissions?.canEdit || false);
        }

        // Récupérer les souvenirs
        const memoriesResponse = await fetch(`${apiUrl}/trip/${id}/memories`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!memoriesResponse.ok) {
          throw new Error("Erreur lors du chargement");
        }

        const data = await memoriesResponse.json();
        // Convertir les données de l'API vers le format Memory
        const formattedMemories: Memory[] = data.map(
          (m: {
            id: string;
            type: string;
            content: string;
            position: { x: number; y: number };
            size: { width: number; height: number };
            zIndex?: number;
            media?: { url: string }[];
          }) => {
            const raw = String(m.type).toLowerCase();
            const type =
              raw === "text" || raw === "image" || raw === "video"
                ? raw
                : "text";
            const urlFromMedia = m.media?.[0]?.url?.trim();
            const contentTrim = m.content?.trim();
            return {
              id: m.id,
              type,
              content: contentTrim || urlFromMedia || "",
              media: m.media,
              position: m.position as { x: number; y: number },
              size: m.size as { width: number; height: number },
              zIndex: m.zIndex ?? 0,
            };
          }
        );
        setMemories(formattedMemories);
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [id, user]);

  const handleSave = async (updatedMemories: Memory[]) => {
    const token = getCookie("token");
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_URL_FALLBACK ||
      "http://localhost:4000";

    const response = await fetch(`${apiUrl}/trip/${id}/memories/batch`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ memories: updatedMemories }),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la sauvegarde des souvenirs");
    }

    const savedMemories = await response.json();
    setMemories(savedMemories);
  };

  if (isLoading) {
    return <TravelLoader fullScreen label="Chargement des souvenirs..." />;
  }

  return (
    <MemoriesCanvas
      tripId={id}
      memories={memories}
      onSave={handleSave}
      tripTitle={tripTitle}
      canEdit={canEdit}
    />
  );
}
