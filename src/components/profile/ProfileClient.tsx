/**
 * Composant client de la page Profil
 * Affiche les informations de l'utilisateur, ses stats et ses favoris
 */

"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import Modal from "@/components/modal/Modal";
import PolaroidCard from "@/components/polaroid/PolaroidCard";
import { formatDate } from "@/utils/dateFormatter";
import type { Place } from "@/types";

interface Trip {
  id: string;
  image: string;
  title: string;
  startDate: string;
  endDate: string;
  destination?: string;
  places?: Place[];
}

interface TripFromAPI {
  id: string;
  _id?: string; // Pour compatibilité avec l'ancien format
  image?: string;
  title: string;
  startDate: string;
  endDate: string;
  destination?: string;
  places?: Place[];
}

export default function ProfileClient() {
  const { user, token, updateUser, uploadProfilePhoto, isLoading } = useAuth();
  const { favorites } = useFavorites();

  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [presetAvatars, setPresetAvatars] = useState<string[]>([]);
  const avatarsLoadedRef = useRef(false);


  // Mettre à jour le username quand l'utilisateur change
  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user?.username]);
  // Charger dynamiquement les avatars Cloudinary au chargement de la page
  useEffect(() => {
    const loadAvatars = async () => {
      if (!token || avatarsLoadedRef.current) return;
      avatarsLoadedRef.current = true;
      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/media/avatars?folder=tabiji/profile-avatars`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to load avatars");
        const data: { items: { secureUrl: string }[] } = await response.json();
        const urls = data.items.map((i) => i.secureUrl).filter(Boolean);
        if (urls.length > 0) setPresetAvatars(urls);
      } catch {
        setPresetAvatars([]);
      }
    };
    loadAvatars();
  }, [token]);

  // Récupérer tous les voyages de l'utilisateur
  useEffect(() => {
    const fetchTrips = async () => {
      if (!token) {
        setAllTrips([]);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/trips`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch trips");
        }

        const data: TripFromAPI[] = await response.json();

        // Mapper les données Prisma (id) vers l'interface frontend (id)
        const trips: Trip[] = data.map((trip) => ({
          id: trip.id || trip._id || "",
          image: trip.image || "",
          title: trip.title,
          startDate: trip.startDate,
          endDate: trip.endDate,
          destination: trip.destination,
          places: trip.places || [],
        }));

        setAllTrips(trips);
      } catch (error) {
        console.error("Erreur lors de la récupération des voyages:", error);
        setAllTrips([]);
      }
    };

    fetchTrips();
  }, [token]);

  // Utilitaires pour stats
  const parseDaysInclusive = (startISO: string, endISO: string) => {
    const start = new Date(startISO);
    const end = new Date(endISO);
    const msPerDay = 24 * 60 * 60 * 1000;
    const diff = Math.max(
      0,
      Math.ceil((end.getTime() - start.getTime()) / msPerDay) + 1
    );
    return diff;
  };

  // Calcul des stats réelles
  const now = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const pastTrips = allTrips.filter((t) => new Date(t.endDate) < now);
  const nextTrip = allTrips
    .filter((t) => new Date(t.startDate).getTime() >= todayStart.getTime())
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )[0];

  const daysTraveled = pastTrips.reduce(
    (acc, t) => acc + parseDaysInclusive(t.startDate, t.endDate),
    0
  );

  // Calculer le nombre total de lieux visités dans les voyages passés
  const placesVisited = pastTrips.reduce(
    (acc, trip) => acc + (trip.places?.length || 0),
    0
  );

  // Calculer la moyenne de jours par voyage
  const averageDaysPerTrip =
    pastTrips.length > 0 ? Math.round(daysTraveled / pastTrips.length) : 0;

  // Compte à rebours vers le prochain voyage
  const [countdown, setCountdown] = useState<string>("");
  useEffect(() => {
    if (!nextTrip) {
      setCountdown("");
      return;
    }
    const target = new Date(nextTrip.startDate).getTime();
    const update = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setCountdown("C'est aujourd'hui !");
        return;
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setCountdown(`${d}j ${h}h ${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [nextTrip]);

  // Gérer la sélection d'une photo prédéfinie - pas encore implémenté car nécessite URL
  const handleSelectPresetPhoto = async (photoUrl: string) => {
    setErrorMessage("");
    try {
      // Télécharger l'image depuis l'URL et la convertir en File
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const file = new File([blob], "profile-photo.jpg", { type: blob.type });

      await uploadProfilePhoto(file);
      setShowPhotoModal(false);
      setSuccessMessage("Photo de profil mise à jour avec succès !");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setErrorMessage("Erreur lors de la mise à jour de la photo");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  // Gérer le téléchargement d'une photo personnalisée
  const handleUploadPhoto = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier que c'est une image
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Veuillez sélectionner une image valide");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("L'image ne doit pas dépasser 5MB");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    setErrorMessage("");
    try {
      await uploadProfilePhoto(file);
      setShowPhotoModal(false);
      setSuccessMessage("Photo de profil mise à jour avec succès !");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setErrorMessage("Erreur lors de la mise à jour de la photo");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  // Statistiques réelles
  const stats = {
    tripsOrganized: allTrips.length,
    daysTraveled,
    placesVisited,
    averageDaysPerTrip,
  };

  // Filtrer les voyages favoris parmi tous les voyages de l'utilisateur
  const favoriteTrips = allTrips.filter((trip) => favorites.includes(trip.id));

  // Calculer l'URL de l'image de profil
  const profileImageUrl = user?.profilePhoto || presetAvatars[0] || null;

  const handleSave = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    // Validation
    if (username.trim() === "") {
      setErrorMessage("Le nom d'utilisateur ne peut pas être vide");
      return;
    }

    // Déterminer quelles données doivent être mises à jour
    const usernameToUpdate = username === user?.username ? undefined : username;
    const passwordToUpdate = password.trim() === "" ? undefined : password;

    // Vérifier s'il y a quelque chose à mettre à jour
    if (!usernameToUpdate && !passwordToUpdate) {
      setSuccessMessage("Aucune modification à sauvegarder");
      setTimeout(() => setSuccessMessage(""), 3000);
      return;
    }

    try {
      // Envoyer uniquement les données modifiées
      await updateUser(usernameToUpdate, passwordToUpdate);
      setSuccessMessage("Profil mis à jour avec succès !");
      setPassword(""); // Réinitialiser le champ mot de passe
      // Faire disparaître le message après 3 secondes
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setErrorMessage("Erreur lors de la mise à jour du profil");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6e6d1] py-8">
      {(successMessage || errorMessage) && (
        <output
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] space-y-2 text-center"
          aria-live="polite"
        >
          {successMessage && (
            <div className="px-4 py-3 rounded-md bg-green-500 text-white shadow-lg">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="px-4 py-3 rounded-md bg-red-500 text-white shadow-lg">
              {errorMessage}
            </div>
          )}
        </output>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Passeport */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-gradient-to-br from-[#8b9556] via-[#7a8450] to-[#6a7445] rounded-lg shadow-2xl p-8 border-4 border-[#d4c5a0]">
            {/* En-tête du passeport */}
            <div className="text-center mb-6 border-b-2 border-[#d4c5a0] pb-4">
              <h2 className="text-3xl font-bold text-[#f6e6d1] font-bagel mb-1">
                PASSEPORT VOYAGEUR
              </h2>
              <p className="text-[#f6e6d1]/90 text-sm uppercase tracking-widest">
                Travel Passport
              </p>
            </div>

            {/* Contenu principal du passeport */}
            <div className="bg-white/95 rounded-lg p-6">
              <div className="flex md:flex-row gap-6">
                {/* Photo de profil */}
                <div className="flex-shrink-0">
                  <button
                    type="button"
                    className="w-40 h-52 border-4 border-gray-400 bg-gray-100 overflow-hidden cursor-pointer relative group hover:border-[#7a8450] transition-colors"
                    onClick={() => setShowPhotoModal(true)}
                    aria-label="Changer la photo de profil"
                  >
                    {profileImageUrl ? (
                      <Image
                        src={profileImageUrl}
                        alt="Photo de profil"
                        width={160}
                        height={208}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">
                          Chargement...
                        </span>
                      </div>
                    )}
                    {/* Overlay au survol */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <p className="text-white text-sm font-medium text-center px-2">
                        Changer la photo
                      </p>
                    </div>
                  </button>
                </div>

                {/* Informations du passeport */}
                <div className="flex-1 space-y-4">
                  {/* Nom d'utilisateur */}
                  <div className="border-b border-gray-300 pb-2">
                    <label
                      htmlFor="username"
                      className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      Nom / Name
                    </label>
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full text-lg font-bold text-gray-800 bg-transparent border-none focus:outline-none focus:ring-0 px-0 py-1"
                    />
                  </div>

                  {/* Email */}
                  <div className="border-b border-gray-300 pb-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Email / Email
                    </div>
                    <p className="text-lg font-medium text-gray-800">
                      {user?.email || "email@example.com"}
                    </p>
                  </div>

                  {/* Mot de passe */}
                  <div className="border-b border-gray-300 pb-2">
                    <label
                      htmlFor="password"
                      className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      Mot de passe / Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Modifier le mot de passe"
                      className="w-full text-lg font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:ring-0 px-0 py-1"
                    />
                  </div>

                  {/* Numéro de passeport */}
                  <div className="border-b border-gray-300 pb-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      N° Passeport / Passport No.
                    </div>
                    <p className="text-lg font-bold text-gray-800 font-mono">
                      {user?._id?.slice(0, 8).toUpperCase() || "TB000000"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bouton de sauvegarde */}
              <div className="mt-6">
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="w-full bg-[#7a8450] hover:bg-[#6a7445] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? "ENREGISTREMENT..."
                    : "✓ ENREGISTRER LES MODIFICATIONS"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Compte à rebours prochain voyage */}
        {countdown && nextTrip && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Prochain voyage
                  </div>
                  <div className="text-2xl font-bold text-gray-900 font-bagel">
                    {nextTrip.title}
                  </div>
                  <div className="text-gray-600">
                    Départ le {formatDate(nextTrip.startDate)}
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <div className="text-sm text-gray-500 mb-1">Départ dans</div>
                  <div className="text-2xl md:text-3xl font-extrabold text-[#7a8450]">
                    {countdown}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bannière de statistiques - Pleine largeur */}
      <div className="w-full bg-gradient-to-r from-[#7a8450] via-[#8b9556] to-[#7a8450] py-12 mb-8 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Voyages organisés */}
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {stats.tripsOrganized}
              </div>
              <div className="text-sm text-white/90 font-medium">
                Voyages organisés
              </div>
            </div>

            {/* Jours voyagés */}
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {stats.daysTraveled}
              </div>
              <div className="text-sm text-white/90 font-medium">
                Jours voyagés
              </div>
            </div>

            {/* Lieux visités */}
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {stats.placesVisited}
              </div>
              <div className="text-sm text-white/90 font-medium">
                Lieux visités
              </div>
            </div>

            {/* Moyenne de jours par voyage */}
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {stats.averageDaysPerTrip}
              </div>
              <div className="text-sm text-white/90 font-medium">
                Jours / voyage
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section favoris */}
      <div className="w-full px-2 sm:px-4">
        <div className="max-w-[1400px] mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 font-bagel mb-8">
            FAVORIS ({favoriteTrips.length})
          </h2>

          {favoriteTrips.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-700 text-lg">
                Vous n&apos;avez pas encore de voyage en favori
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {favoriteTrips.map((trip) => (
                <PolaroidCard
                  key={trip.id}
                  id={trip.id}
                  image={trip.image}
                  title={trip.title}
                  startDate={formatDate(trip.startDate)}
                  endDate={formatDate(trip.endDate)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modale de sélection de photo */}
      <Modal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        title="Choisir une photo de profil"
        size="3xl"
        maxHeight="max-h-[90vh]"
        headerClassName="sticky top-0 bg-[#7a8450] text-white p-6 flex justify-between items-center rounded-t-lg z-10"
        className="overflow-hidden"
      >
        {/* Section téléchargement */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Télécharger votre photo
          </h4>
          <input
            type="file"
            accept="image/*"
            onChange={handleUploadPhoto}
            className="hidden"
            id="photo-upload"
          />
          <label
            htmlFor="photo-upload"
            className="block cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#7a8450] hover:bg-gray-50 transition-colors"
          >
            <p className="text-gray-600 font-medium">
              Cliquez pour télécharger une photo
            </p>
            <p className="text-gray-500 text-sm mt-2">
              (JPG, PNG, GIF - Max 5MB)
            </p>
          </label>
        </div>

        {/* Divider */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500 font-medium">
              OU CHOISIR PARMI NOS SUGGESTIONS
            </span>
          </div>
        </div>

        {/* Galerie d'avatars prédéfinis */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          {presetAvatars.map((avatarUrl) => (
            <button
              type="button"
              key={avatarUrl}
              className={`rounded-lg overflow-hidden border-4 transition-all ${
                user?.profilePhoto === avatarUrl
                  ? "border-[#7a8450] scale-105"
                  : "border-gray-300 hover:border-[#8b9556]"
              }`}
              onClick={() => handleSelectPresetPhoto(avatarUrl)}
              aria-label={`Sélectionner l'avatar ${avatarUrl}`}
            >
              <Image
                src={avatarUrl}
                alt="Avatar prédéfini"
                width={150}
                height={150}
                className="object-cover w-full h-full aspect-square"
              />
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
