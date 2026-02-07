"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface PlaceSuggestion {
  name: string;
  lat: number;
  lng: number;
  type?: string;
  region?: string;
  country?: string;
  displayName?: string;
  location?: string;
}

export default function PlaceAutocomplete({
  onSelect,
  placeholder = "Rechercher une adresse ou un lieu...",
  value,
  onValueChange,
}: Readonly<{
  onSelect: (place: PlaceSuggestion) => void;
  placeholder?: string;
  value?: string;
  onValueChange?: (v: string) => void;
}>) {
  const isControlled =
    typeof value === "string" && typeof onValueChange === "function";
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const apiBase = useMemo(
    () =>
      (process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_API_URL_FALLBACK) + "/places/search",
    []
  );

  const inputValue = isControlled ? (value as string) : query;

  // Gérer les changements de valeur depuis les props (pour l'édition)
  useEffect(() => {
    if (isControlled && value) {
      setQuery(value);
      setResults([]); // Vider les résultats
    }
  }, [value, isControlled]);

  useEffect(() => {
    if (inputValue.trim().length === 0) {
      // Barre de recherche vide : annuler toute recherche en cours et nettoyer
      abortRef.current?.abort();
      setResults([]);
      setError(null);
      setIsLoading(false);
      setOpen(false); // Fermer immédiatement le dropdown
      return;
    }

    if (inputValue.trim().length < 2) {
      setResults([]);
      setError(null);
      setOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Délai court pour une réponse réactive
    const timeout = setTimeout(async () => {
      try {
        const url = new URL(apiBase);
        url.searchParams.set("q", inputValue.trim());
        url.searchParams.set("limit", "8"); // Plus de résultats pour plus de choix

        const res = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          if (res.status === 404) {
            setError("Service de recherche temporairement indisponible.");
          } else if (res.status >= 500) {
            setError("Erreur du serveur de recherche.");
          } else {
            setError("Erreur lors de la recherche.");
          }
          setResults([]);
          return;
        }

        const data: { results: PlaceSuggestion[] } = await res.json();

        // Enrichir les résultats avec des informations d'affichage
        const enrichedResults = (data.results || []).map((result) => ({
          ...result,
          displayName: result.name,
        }));

        setResults(enrichedResults);

        // Ouvrir automatiquement la dropdown
        setOpen(true);
      } catch {
        if (!controller.signal.aborted) {
          setError("Problème de connexion. Vérifiez votre réseau.");
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 150);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [inputValue, apiBase]);

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            if (isControlled) {
              onValueChange?.(e.target.value);
            } else {
              setQuery(e.target.value);
            }
            setError(null);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Délai pour permettre la sélection d'un résultat
            setTimeout(() => setOpen(false), 200);
          }}
          placeholder={placeholder}
          className={`w-full px-3 py-2 pr-8 border rounded-md focus:outline-none focus:ring-2 ${
            error
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:ring-[#7a8450]"
          }`}
        />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-auto">
          {error && (
            <div className="px-4 py-3 text-sm text-red-600 bg-red-50 border-b border-red-200">
              ⚠️ {error}
            </div>
          )}
          {isLoading && (
            <div className="px-4 py-3 text-sm text-gray-600 flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-[#7a8450] rounded-full animate-spin"></div>
              Recherche d&apos;adresses...
            </div>
          )}

          {/* Message pour adresse manuelle */}
          {results.length === 0 &&
            inputValue.trim().length >= 2 &&
            !isLoading && (
              <div className="px-4 py-3">
                <div className="text-sm text-gray-500 text-center mb-3">
                  Aucun résultat trouvé pour &quot;{inputValue}&quot;
                  <br />
                  <span className="text-xs">Essayez avec moins de détails</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSelect({
                      name: inputValue.trim(),
                      displayName: inputValue.trim(),
                      lat: 48.8566, // Paris par défaut
                      lng: 2.3522,
                      type: "manual",
                      location: "Adresse saisie manuellement",
                    });
                    if (isControlled) onValueChange?.(inputValue.trim());
                    else setQuery(inputValue.trim());
                    setResults([]);
                    setOpen(false);
                    setError(null);
                  }}
                  className="w-full px-3 py-2 text-sm bg-[#7a8450] text-white rounded-md hover:bg-[#6a7450] transition-colors"
                >
                  📍 Utiliser cette adresse quand même
                </button>
              </div>
            )}
          {!isLoading && results.length > 0 && (
            <div className="py-2">
              {results.map((r, idx) => (
                <button
                  key={`${r.lat}-${r.lng}-${idx}`}
                  type="button"
                  onClick={() => {
                    onSelect(r);
                    if (isControlled) onValueChange?.(r.displayName || r.name);
                    else setQuery("");
                    setResults([]);
                    setOpen(false);
                    setError(null);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full group-hover:bg-blue-500 transition-colors"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm leading-tight">
                        {r.displayName || r.name}
                      </div>
                      {r.location && (
                        <div className="text-xs text-gray-500 mt-1 leading-tight">
                          📍 {r.location}
                        </div>
                      )}
                      {r.type && r.type !== "unknown" && (
                        <div className="text-xs text-[#7a8450] mt-1 font-medium">
                          {r.type.charAt(0).toUpperCase() + r.type.slice(1)}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
