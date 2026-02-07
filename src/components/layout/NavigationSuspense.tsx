"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  IoMdStats,
  IoMdAirplane,
  IoMdPerson,
  IoMdSettings,
  IoMdLogOut,
} from "react-icons/io";

export default function NavigationSuspense() {
  const { user, logout, isLoggingOut, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Fonction pour vérifier si un lien est actif
  const isActiveLink = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // Classes CSS pour les liens actifs/inactifs
  const getLinkClasses = (href: string, isMobile = false) => {
    const baseClasses = isMobile
      ? "block text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-base font-medium transition-all duration-200 relative"
      : "text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-base font-medium transition-all duration-200 relative";

    const activeClasses = isMobile
      ? "text-[#7a8450] font-semibold [&>span]:underline [&>span]:underline-offset-4 [&>span]:decoration-[#7a8450] [&>span]:decoration-2"
      : "text-[#7a8450] font-semibold [&>span]:underline [&>span]:underline-offset-4 [&>span]:decoration-[#7a8450] [&>span]:decoration-2";

    return isActiveLink(href) ? `${baseClasses} ${activeClasses}` : baseClasses;
  };

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  // Afficher un indicateur de chargement pendant l'initialisation de l'auth
  if (isLoading) {
    return (
      <div className="flex items-center space-x-4">
        <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
        <div className="w-24 h-8 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }

  if (user) {
    // Menu connecté
    return (
      <>
        {/* Menu Desktop */}
        <div className="hidden md:flex items-center space-x-2">
          <Link
            href="/dashboard"
            className={`${getLinkClasses(
              "/dashboard"
            )} flex items-center gap-2`}
          >
            <IoMdStats size={18} className="flex-shrink-0" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/trips"
            className={`${getLinkClasses("/trips")} flex items-center gap-2`}
          >
            <IoMdAirplane size={18} className="flex-shrink-0" />
            <span>Mes voyages</span>
          </Link>
          <Link
            href="/profile"
            className={`${getLinkClasses("/profile")} flex items-center gap-2`}
          >
            <IoMdPerson size={18} className="flex-shrink-0" />
            <span>Mon profil</span>
          </Link>
          {user.admin && (
            <Link
              href="/admin"
              className={`${getLinkClasses("/admin")} flex items-center gap-2`}
            >
              <IoMdSettings size={18} className="flex-shrink-0" />
              <span>Admin</span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-base font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {/* <IoMdLogOut size={18} className="flex-shrink-0" /> */}
            <span>{isLoggingOut ? "Déconnexion..." : "Déconnexion"}</span>
          </button>
        </div>

        {/* Bouton Menu Mobile */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-700 hover:text-gray-900 p-2 rounded-md"
            aria-expanded={isMenuOpen}
            aria-label="Ouvrir le menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Menu Mobile */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#f6e6d1] shadow-lg z-50">
            <div className="px-6 py-6 space-y-4">
              <Link
                href="/dashboard"
                className={`${getLinkClasses(
                  "/dashboard",
                  true
                )} flex items-center gap-3`}
                onClick={() => setIsMenuOpen(false)}
              >
                <IoMdStats size={20} className="flex-shrink-0" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/trips"
                className={`${getLinkClasses(
                  "/trips",
                  true
                )} flex items-center gap-3`}
                onClick={() => setIsMenuOpen(false)}
              >
                <IoMdAirplane size={20} className="flex-shrink-0" />
                <span>Mes voyages</span>
              </Link>
              <Link
                href="/profile"
                className={`${getLinkClasses(
                  "/profile",
                  true
                )} flex items-center gap-3`}
                onClick={() => setIsMenuOpen(false)}
              >
                <IoMdPerson size={20} className="flex-shrink-0" />
                <span>Mon profil</span>
              </Link>
              {user.admin && (
                <Link
                  href="/admin"
                  className={`${getLinkClasses(
                    "/admin",
                    true
                  )} flex items-center gap-3`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <IoMdSettings size={20} className="flex-shrink-0" />
                  <span>Admin</span>
                </Link>
              )}
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                disabled={isLoggingOut}
                className="w-full text-left bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-md text-base font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              >
                <IoMdLogOut size={20} className="flex-shrink-0" />
                <span>{isLoggingOut ? "Déconnexion..." : "Déconnexion"}</span>
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Menu non connecté
  return (
    <>
      {/* Menu Desktop */}
      <div className="hidden md:flex items-center space-x-4">
        <Link
          href="/user/login"
          className="text-gray-700 hover:text-gray-900 px-4 py-3 rounded-md text-base font-medium transition-colors duration-200"
        >
          Se connecter
        </Link>
        <Link
          href="/user/signup"
          className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-md text-base font-medium transition-colors duration-200"
        >
          S&apos;inscrire
        </Link>
      </div>

      {/* Bouton Menu Mobile */}
      <div className="md:hidden">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-gray-700 hover:text-gray-900 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500"
          aria-expanded={isMenuOpen}
          aria-label="Ouvrir le menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Menu Mobile */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#f6e6d1] shadow-lg z-50">
          <div className="px-4 py-4 space-y-3">
            <Link
              href="/user/login"
              className="block text-gray-700 hover:text-gray-900 px-4 py-3 rounded-md text-base font-medium transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Se connecter
            </Link>
            <Link
              href="/user/signup"
              className="block bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 rounded-md text-base font-medium transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              S&apos;inscrire
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
