"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import HeroSection from "@/components/layout/HeroSection";
import DestinationsGrid from "@/components/destinations/DestinationsGrid";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirige vers le dashboard si l'utilisateur est connecté
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Affiche la page d'accueil uniquement si l'utilisateur n'est pas connecté
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <HeroSection />
      <DestinationsGrid />
    </div>
  );
}
