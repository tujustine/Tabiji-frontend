"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 min-h-screen flex items-center justify-center">
      {/* Overlay pour améliorer la lisibilité */}
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>

      {/* Contenu du hero */}
      <div className="relative z-10 text-center text-[#f6e6d1] px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 font-bagel">
          Bienvenue sur Tabiji
        </h1>

        <p className="text-xl md:text-2xl mb-8 text-[#f6e6d1] max-w-2xl mx-auto leading-relaxed">
          Votre compagnon de voyage idéal. Découvrez de nouveaux horizons,
          planifiez vos aventures et partagez vos expériences.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/user/signup"
            className="bg-[#D2B48C] text-[#f6e6d1] px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#DEB887] transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Commencer l&apos;aventure
          </Link>
        </div>
      </div>

      {/* Points lumineux représentant des étoiles */}
      <div
        className="absolute top-1/4 right-1/3 w-2 h-2 bg-white bg-opacity-40 rounded-full animate-ping delay-1000"
        style={{ animationDuration: "3s" }}
      ></div>
      <div
        className="absolute top-3/4 left-1/3 w-1.5 h-1.5 bg-white bg-opacity-50 rounded-full animate-ping delay-1500"
        style={{ animationDuration: "4s" }}
      ></div>
      <div
        className="absolute top-1/3 left-1/2 w-1 h-1 bg-white bg-opacity-60 rounded-full animate-ping delay-2000"
        style={{ animationDuration: "2.5s" }}
      ></div>
      <div
        className="absolute top-1/6 right-1/4 w-1.5 h-1.5 bg-white bg-opacity-45 rounded-full animate-ping delay-500"
        style={{ animationDuration: "3.5s" }}
      ></div>
      <div
        className="absolute bottom-1/4 right-1/2 w-1 h-1 bg-white bg-opacity-55 rounded-full animate-ping delay-2500"
        style={{ animationDuration: "4.5s" }}
      ></div>
      <div
        className="absolute bottom-1/3 left-1/6 w-2 h-2 bg-white bg-opacity-35 rounded-full animate-ping delay-3000"
        style={{ animationDuration: "2s" }}
      ></div>
      <div
        className="absolute top-1/5 left-1/4 w-1 h-1 bg-white bg-opacity-40 rounded-full animate-ping delay-800"
        style={{ animationDuration: "3.2s" }}
      ></div>
      <div
        className="absolute top-2/5 right-1/5 w-1.5 h-1.5 bg-white bg-opacity-45 rounded-full animate-ping delay-1200"
        style={{ animationDuration: "4.2s" }}
      ></div>
      <div
        className="absolute top-3/5 left-1/5 w-1 h-1 bg-white bg-opacity-50 rounded-full animate-ping delay-1800"
        style={{ animationDuration: "2.8s" }}
      ></div>
      <div
        className="absolute top-4/5 right-1/3 w-1.5 h-1.5 bg-white bg-opacity-35 rounded-full animate-ping delay-2200"
        style={{ animationDuration: "3.8s" }}
      ></div>
      <div
        className="absolute bottom-1/5 left-1/3 w-1 h-1 bg-white bg-opacity-55 rounded-full animate-ping delay-2800"
        style={{ animationDuration: "4.8s" }}
      ></div>
      <div
        className="absolute bottom-2/5 right-1/6 w-2 h-2 bg-white bg-opacity-30 rounded-full animate-ping delay-3200"
        style={{ animationDuration: "2.2s" }}
      ></div>
      <div
        className="absolute bottom-3/5 left-2/3 w-1 h-1 bg-white bg-opacity-40 rounded-full animate-ping delay-3800"
        style={{ animationDuration: "3.6s" }}
      ></div>
      <div
        className="absolute bottom-4/5 right-2/3 w-1.5 h-1.5 bg-white bg-opacity-45 rounded-full animate-ping delay-4200"
        style={{ animationDuration: "4.4s" }}
      ></div>

      {/* Points plus petits et subtils */}
      <div
        className="absolute top-1/8 left-1/2 w-0.5 h-0.5 bg-white bg-opacity-30 rounded-full animate-ping delay-600"
        style={{ animationDuration: "5s" }}
      ></div>
      <div
        className="absolute top-3/8 right-1/8 w-0.5 h-0.5 bg-white bg-opacity-35 rounded-full animate-ping delay-1400"
        style={{ animationDuration: "4.6s" }}
      ></div>
      <div
        className="absolute top-5/8 left-1/8 w-0.5 h-0.5 bg-white bg-opacity-25 rounded-full animate-ping delay-2600"
        style={{ animationDuration: "3.4s" }}
      ></div>
      <div
        className="absolute top-7/8 right-1/2 w-0.5 h-0.5 bg-white bg-opacity-40 rounded-full animate-ping delay-3400"
        style={{ animationDuration: "2.6s" }}
      ></div>
      <div
        className="absolute bottom-1/8 left-3/4 w-0.5 h-0.5 bg-white bg-opacity-30 rounded-full animate-ping delay-4000"
        style={{ animationDuration: "4.8s" }}
      ></div>
      <div
        className="absolute top-1/12 left-1/6 w-1 h-1 bg-white bg-opacity-35 rounded-full animate-ping delay-700"
        style={{ animationDuration: "3.7s" }}
      ></div>
      <div
        className="absolute top-2/12 right-1/12 w-0.5 h-0.5 bg-white bg-opacity-25 rounded-full animate-ping delay-1100"
        style={{ animationDuration: "4.3s" }}
      ></div>
      <div
        className="absolute top-4/12 left-5/6 w-1.5 h-1.5 bg-white bg-opacity-40 rounded-full animate-ping delay-1600"
        style={{ animationDuration: "2.9s" }}
      ></div>
      <div
        className="absolute top-6/12 right-1/4 w-0.5 h-0.5 bg-white bg-opacity-30 rounded-full animate-ping delay-2100"
        style={{ animationDuration: "4.1s" }}
      ></div>
      <div
        className="absolute top-8/12 left-1/12 w-1 h-1 bg-white bg-opacity-45 rounded-full animate-ping delay-2700"
        style={{ animationDuration: "3.3s" }}
      ></div>
      <div
        className="absolute top-10/12 right-5/6 w-0.5 h-0.5 bg-white bg-opacity-35 rounded-full animate-ping delay-3300"
        style={{ animationDuration: "4.7s" }}
      ></div>
      <div
        className="absolute top-11/12 left-2/3 w-1 h-1 bg-white bg-opacity-30 rounded-full animate-ping delay-3900"
        style={{ animationDuration: "2.7s" }}
      ></div>
      <div
        className="absolute top-0 left-1/3 w-0.5 h-0.5 bg-white bg-opacity-40 rounded-full animate-ping delay-900"
        style={{ animationDuration: "5.2s" }}
      ></div>
      <div
        className="absolute top-0 right-1/3 w-1 h-1 bg-white bg-opacity-35 rounded-full animate-ping delay-1300"
        style={{ animationDuration: "3.8s" }}
      ></div>
      <div
        className="absolute bottom-0 left-1/4 w-0.5 h-0.5 bg-white bg-opacity-30 rounded-full animate-ping delay-1700"
        style={{ animationDuration: "4.4s" }}
      ></div>
      <div
        className="absolute bottom-0 right-1/4 w-1 h-1 bg-white bg-opacity-40 rounded-full animate-ping delay-2300"
        style={{ animationDuration: "3.1s" }}
      ></div>
      <div
        className="absolute top-1/2 left-0 w-0.5 h-0.5 bg-white bg-opacity-25 rounded-full animate-ping delay-2900"
        style={{ animationDuration: "4.9s" }}
      ></div>
      <div
        className="absolute top-1/2 right-0 w-1 h-1 bg-white bg-opacity-35 rounded-full animate-ping delay-3500"
        style={{ animationDuration: "2.4s" }}
      ></div>
      <div
        className="absolute top-1/7 left-3/7 w-0.5 h-0.5 bg-white bg-opacity-30 rounded-full animate-ping delay-1000"
        style={{ animationDuration: "4.5s" }}
      ></div>
      <div
        className="absolute top-2/7 right-2/7 w-1 h-1 bg-white bg-opacity-40 rounded-full animate-ping delay-1500"
        style={{ animationDuration: "3.6s" }}
      ></div>
      <div
        className="absolute top-3/7 left-4/7 w-0.5 h-0.5 bg-white bg-opacity-35 rounded-full animate-ping delay-2000"
        style={{ animationDuration: "4.2s" }}
      ></div>
      <div
        className="absolute top-4/7 right-3/7 w-1 h-1 bg-white bg-opacity-30 rounded-full animate-ping delay-2500"
        style={{ animationDuration: "3.9s" }}
      ></div>
      <div
        className="absolute top-5/7 left-2/7 w-0.5 h-0.5 bg-white bg-opacity-45 rounded-full animate-ping delay-3000"
        style={{ animationDuration: "2.8s" }}
      ></div>
      <div
        className="absolute top-6/7 right-4/7 w-1 h-1 bg-white bg-opacity-35 rounded-full animate-ping delay-3600"
        style={{ animationDuration: "4.6s" }}
      ></div>
      <div
        className="absolute bottom-1/7 left-5/7 w-0.5 h-0.5 bg-white bg-opacity-30 rounded-full animate-ping delay-4200"
        style={{ animationDuration: "3.2s" }}
      ></div>
      <div
        className="absolute bottom-2/7 right-1/7 w-1 h-1 bg-white bg-opacity-40 rounded-full animate-ping delay-4800"
        style={{ animationDuration: "4.8s" }}
      ></div>
    </section>
  );
}
