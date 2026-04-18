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

const mobileMenuPanel =
  "border-b border-[#f6e6d1]/10 bg-[#1a1f1c]/95 shadow-lg backdrop-blur-md md:hidden";

export default function NavigationSuspense() {
  const { user, logout, isLoggingOut, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const getNavLinkClasses = (href: string, isMobile = false) => {
    const active = isActiveLink(href);
    const weight = active ? "font-semibold" : "font-medium";
    return isMobile
      ? `block px-3 py-2 text-base ${weight} text-[#f6e6d1]/85 transition-all duration-200 hover:text-[#f6e6d1] relative rounded-md`
      : `px-3 py-2 text-base ${weight} text-[#f6e6d1]/85 transition-all duration-200 hover:text-[#f6e6d1] relative rounded-md`;
  };

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-4">
        <div className="h-8 w-20 animate-pulse rounded bg-[#f6e6d1]/15"></div>
        <div className="h-8 w-24 animate-pulse rounded bg-[#f6e6d1]/15"></div>
      </div>
    );
  }

  if (user) {
    // Menu connecté
    return (
      <>
        <div className="hidden items-center space-x-2 md:flex">
          <Link
            href="/dashboard"
            className={`${getNavLinkClasses("/dashboard")} flex items-center gap-2`}
          >
            <IoMdStats size={18} className="flex-shrink-0" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/trips"
            className={`${getNavLinkClasses("/trips")} flex items-center gap-2`}
          >
            <IoMdAirplane size={18} className="flex-shrink-0" />
            <span>Mes voyages</span>
          </Link>
          <Link
            href="/profile"
            className={`${getNavLinkClasses("/profile")} flex items-center gap-2`}
          >
            <IoMdPerson size={18} className="flex-shrink-0" />
            <span>Mon profil</span>
          </Link>
          {user.admin && (
            <Link
              href="/admin"
              className={`${getNavLinkClasses("/admin")} flex items-center gap-2`}
            >
              <IoMdSettings size={18} className="flex-shrink-0" />
              <span>Admin</span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-base font-medium text-white transition-colors duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>{isLoggingOut ? "Déconnexion..." : "Déconnexion"}</span>
          </button>
        </div>

        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded-md p-2 text-[#f6e6d1] hover:bg-[#f6e6d1]/10 hover:text-[#f6e6d1]"
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

        {isMenuOpen && (
          <div
            className={`absolute left-0 right-0 top-full z-[60] ${mobileMenuPanel}`}
          >
            <div className="space-y-4 px-6 py-6">
              <Link
                href="/dashboard"
                className={`${getNavLinkClasses("/dashboard", true)} flex items-center gap-3`}
                onClick={() => setIsMenuOpen(false)}
              >
                <IoMdStats size={20} className="flex-shrink-0" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/trips"
                className={`${getNavLinkClasses("/trips", true)} flex items-center gap-3`}
                onClick={() => setIsMenuOpen(false)}
              >
                <IoMdAirplane size={20} className="flex-shrink-0" />
                <span>Mes voyages</span>
              </Link>
              <Link
                href="/profile"
                className={`${getNavLinkClasses("/profile", true)} flex items-center gap-3`}
                onClick={() => setIsMenuOpen(false)}
              >
                <IoMdPerson size={20} className="flex-shrink-0" />
                <span>Mon profil</span>
              </Link>
              {user.admin && (
                <Link
                  href="/admin"
                  className={`${getNavLinkClasses("/admin", true)} flex items-center gap-3`}
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
                className="flex w-full items-center gap-3 rounded-md bg-red-600 px-4 py-3 text-left text-base font-medium text-white transition-colors duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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

  return (
    <>
      <div className="hidden items-center space-x-4 md:flex">
        <Link
          href="/user/login"
          className="rounded-md px-4 py-3 text-base font-medium text-[#f6e6d1]/90 transition-colors duration-200 hover:text-[#f6e6d1]"
        >
          Se connecter
        </Link>
        <Link
          href="/user/signup"
          className="rounded-md bg-[#7a8450] px-6 py-3 text-base font-medium text-white transition-colors duration-200 hover:bg-[#6a7450]"
        >
          S&apos;inscrire
        </Link>
      </div>

      <div className="md:hidden">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="rounded-md p-2 text-[#f6e6d1] hover:bg-[#f6e6d1]/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#f6e6d1]/30"
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

      {isMenuOpen && (
        <div
          className={`absolute left-0 right-0 top-full z-[60] ${mobileMenuPanel}`}
        >
          <div className="space-y-3 px-4 py-4">
            <Link
              href="/user/login"
              className="block w-full rounded-md px-4 py-3 text-left text-base font-medium text-[#f6e6d1] transition-colors duration-200 hover:bg-[#f6e6d1]/18 hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              Se connecter
            </Link>
            <Link
              href="/user/signup"
              className="block w-full rounded-md bg-[#7a8450] px-4 py-3 text-left text-base font-medium text-white transition-colors duration-200 hover:bg-[#8f9a62]"
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
