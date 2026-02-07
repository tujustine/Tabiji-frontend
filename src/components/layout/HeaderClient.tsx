"use client";

import Image from "next/image";
import Link from "next/link";
import logo from "../../media/LOGO.png";
import NavigationSuspense from "./NavigationSuspense";

export default function Header() {
  return (
    <header className="bg-[#f6e6d1] shadow-sm font-bagel relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Layout */}
        <div className="hidden md:flex justify-between items-center h-24">
          {/* Logo à gauche */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src={logo}
                alt="Tabiji Logo"
                width={200}
                height={80}
                className="h-16 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Navigation desktop */}
          <NavigationSuspense />
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex justify-between items-center h-24">
          {/* Espace gauche vide pour équilibrer */}
          <div className="w-12"></div>

          {/* Logo au centre */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src={logo}
                alt="Tabiji Logo"
                width={200}
                height={80}
                className="h-16 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Menu burger à droite */}
          <div className="flex-shrink-0">
            <NavigationSuspense />
          </div>
        </div>
      </div>
    </header>
  );
}
