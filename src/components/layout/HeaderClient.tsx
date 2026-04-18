"use client";

import Image from "next/image";
import Link from "next/link";
import logo from "../../media/LOGO.png";
import NavigationSuspense from "./NavigationSuspense";

export default function Header() {
  return (
    <header className="fixed left-0 right-0 top-0 z-[1100] border-b border-[#f6e6d1]/15 bg-[#0f1210]/55 font-bagel text-[#f6e6d1] backdrop-blur-md transition-[background-color,backdrop-filter] duration-300 supports-[backdrop-filter]:bg-[#0f1210]/45">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Desktop Layout */}
        <div className="hidden h-24 items-center justify-between md:flex">
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

          <NavigationSuspense />
        </div>

        <div className="flex h-24 items-center justify-between md:hidden">
          <div className="w-12"></div>

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

          <div className="flex-shrink-0">
            <NavigationSuspense />
          </div>
        </div>
      </div>
    </header>
  );
}
