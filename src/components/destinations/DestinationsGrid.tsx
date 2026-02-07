"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Destination {
  name: string;
  country: string;
  region: string;
  image: string;
  flag: string;
}

// Liste de 16 destinations
const ALL_DESTINATIONS: Destination[] = [
  {
    name: "Paris",
    country: "France",
    region: "Île-de-France",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
    flag: "https://flagcdn.com/w80/fr.png",
  },
  {
    name: "Tokyo",
    country: "Japon",
    region: "Kantō",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
    flag: "https://flagcdn.com/w80/jp.png",
  },
  {
    name: "New York",
    country: "États-Unis",
    region: "New York",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800",
    flag: "https://flagcdn.com/w80/us.png",
  },
  {
    name: "Londres",
    country: "Royaume-Uni",
    region: "Angleterre",
    image: "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800",
    flag: "https://flagcdn.com/w80/gb.png",
  },
  {
    name: "Rome",
    country: "Italie",
    region: "Latium",
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800",
    flag: "https://flagcdn.com/w80/it.png",
  },
  {
    name: "Barcelone",
    country: "Espagne",
    region: "Catalogne",
    image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800",
    flag: "https://flagcdn.com/w80/es.png",
  },
  {
    name: "Amsterdam",
    country: "Pays-Bas",
    region: "Hollande-Septentrionale",
    image: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800",
    flag: "https://flagcdn.com/w80/nl.png",
  },
  {
    name: "Berlin",
    country: "Allemagne",
    region: "Berlin",
    image: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800",
    flag: "https://flagcdn.com/w80/de.png",
  },
  {
    name: "Sydney",
    country: "Australie",
    region: "Nouvelle-Galles du Sud",
    image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800",
    flag: "https://flagcdn.com/w80/au.png",
  },
  {
    name: "Dubaï",
    country: "Émirats arabes unis",
    region: "Dubaï",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800",
    flag: "https://flagcdn.com/w80/ae.png",
  },
  {
    name: "Bangkok",
    country: "Thaïlande",
    region: "Bangkok",
    image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800",
    flag: "https://flagcdn.com/w80/th.png",
  },
  {
    name: "Bali",
    country: "Indonésie",
    region: "Bali",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
    flag: "https://flagcdn.com/w80/id.png",
  },
  {
    name: "Prague",
    country: "République tchèque",
    region: "Prague",
    image: "https://images.unsplash.com/photo-1541849546-216549ae216d?w=800",
    flag: "https://flagcdn.com/w80/cz.png",
  },
  {
    name: "Istanbul",
    country: "Turquie",
    region: "Istanbul",
    image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800",
    flag: "https://flagcdn.com/w80/tr.png",
  },
  {
    name: "Séoul",
    country: "Corée du Sud",
    region: "Séoul",
    image: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800",
    flag: "https://flagcdn.com/w80/kr.png",
  },
  {
    name: "Athènes",
    country: "Grèce",
    region: "Attique",
    image: "https://images.unsplash.com/photo-1555993539-1732b0258235?w=800",
    flag: "https://flagcdn.com/w80/gr.png",
  },
];

export default function DestinationsGrid() {
  const [destinations, setDestinations] = useState<Destination[]>([]);

  useEffect(() => {
    // Sélectionner 8 destinations au hasard parmi les 16
    const shuffled = [...ALL_DESTINATIONS].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 8);
    setDestinations(selected);
  }, []);

  return (
    <section className="py-16 bg-[#f6e6d1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-bagel mb-4">
            Pas d&apos;idées de destination ?
          </h2>
          <p className="text-lg text-gray-600 mb-12">
            Découvrez nos suggestions pour votre prochaine aventure
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((destination) => (
              <div
                key={destination.name}
                className="bg-[#f3f3f3] rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 group"
              >
                <div className="h-48 overflow-hidden relative">
                  <Image
                    src={destination.image}
                    alt={`${destination.name}, ${destination.country}`}
                    width={800}
                    height={600}
                    priority={destinations.indexOf(destination) < 4}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Overlay sombre */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-opacity duration-300 pointer-events-none"></div>

                  {/* Drapeau du pays */}
                  <div className="absolute top-3 right-3 z-10">
                    <Image
                      src={destination.flag}
                      alt={`Drapeau de ${destination.country}`}
                      width={32}
                      height={24}
                      className="rounded shadow-md w-8 h-auto"
                    />
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center mb-2 justify-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {destination.name}
                    </h3>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    {destination.country} • {destination.region}
                  </p>

                  {/* <div className="space-y-1 text-xs text-gray-500">
                    <p>Population: {destination.population.toLocaleString()}</p>
                    {destination.currency && (
                      <p>Monnaie: {destination.currency}</p>
                    )}
                    {destination.language && (
                      <p>Langue: {destination.language}</p>
                    )}
                  </div> */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
