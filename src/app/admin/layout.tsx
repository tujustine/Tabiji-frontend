"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import TravelLoader from "@/components/ui/TravelLoader";
import Link from "next/link";
import { IoMdStats, IoMdPeople, IoMdAirplane } from "react-icons/io";

export default function AdminLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const { user, isLoading, isInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Attendre que l'initialisation soit terminée avant de vérifier l'authentification
    if (isInitialized && !isLoading) {
      if (!user) {
        router.replace("/user/login");
      } else if (!user.admin) {
        router.replace("/dashboard");
      }
    }
  }, [user, isLoading, isInitialized, router]);

  // Afficher le chargement tant que l'initialisation n'est pas terminée
  if (!isInitialized || isLoading) {
    return <TravelLoader fullScreen label="Chargement..." />;
  }

  if (!user?.admin) {
    return null;
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: <IoMdStats size={18} /> },
    {
      href: "/admin/users",
      label: "Utilisateurs",
      icon: <IoMdPeople size={18} />,
    },
    {
      href: "/admin/trips",
      label: "Voyages",
      icon: <IoMdAirplane size={18} />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6e6d1]">
      {/* Navigation admin horizontale */}
      <div className="bg-[#f6e6d1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
          <div className="flex items-center justify-center h-16">
            <div className="flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                      isActive
                        ? "text-purple-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {item.icon}
                    <span
                      className={isActive ? "underline underline-offset-4" : ""}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
