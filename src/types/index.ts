/**
 * Interface représentant un utilisateur de l'application
 * Utilisée pour l'authentification et la gestion des droits
 */
export interface User {
  _id: string;
  username: string;
  email: string;
  admin: boolean;
  profilePhoto?: string;
}

/**
 * Interface du contexte d'authentification
 * Définit les méthodes et états disponibles pour la gestion des utilisateurs
 */
export interface AuthContextType {
  user: User | null; // Utilisateur connecté ou null si déconnecté
  token: string | null; // Token d'authentification
  login: (email: string, password: string) => Promise<void>; // Connexion
  logout: () => void; // Déconnexion
  signup: (username: string, email: string, password: string) => Promise<void>; // Inscription
  updateUser: (username?: string, password?: string) => Promise<void>; // Mise à jour du profil
  uploadProfilePhoto: (file: File) => Promise<void>; // Upload de la photo de profil
  isLoading: boolean;
  isLoggingOut: boolean; // Indique si une déconnexion est en cours
  isInitialized: boolean; // Indique si l'initialisation des cookies est terminée
}

/**
 * Interface représentant un souvenir sur le tableau blanc
 */
export interface Memory {
  id: string;
  type: "text" | "image" | "video";
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
}

/**
 * Interface représentant un lieu à visiter
 */
export interface Place {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  category: string;
  description: string;
  googlePlaceId?: string;
}

/**
 * Interface représentant une tâche de la liste de tâches
 */
export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  order: number;
}

/**
 * Interface représentant l'organisation par jour
 */
export interface DaySchedule {
  day: number;
  date: Date;
  placeIds: string[];
}

/**
 * Interface représentant une catégorie de lieux
 */

/**
 * Interface représentant un voyage complet
 */
export interface Trip {
  _id?: string;
  title: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  image: string;
  participants: string[];
  memories: Memory[];
  places: Place[];
  todoItems: TodoItem[];
  daySchedule: DaySchedule[];
}

// ==================== TYPES ADMIN ====================

export interface AdminStats {
  totalUsers: number;
  totalTrips: number;
  totalMemories: number;
  totalMedia: number;
  totalPlaces: number;
  totalCollaborations: number;
  newUsersLast30Days: number;
  newTripsLast30Days: number;
}

export interface AdminUserStats {
  totalUsers: number;
  adminUsers: number;
  regularUsers: number;
  usersWithTrips: number;
  usersWithoutTrips: number;
  monthlyStats: Record<string, number>;
}

export interface AdminTripStats {
  totalTrips: number;
  tripsWithMemories: number;
  tripsWithPlaces: number;
  tripsWithoutContent: number;
  monthlyStats: Record<string, number>;
 }

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  admin: boolean;
  profilePhoto?: string;
  createdAt: string;
  _count?: {
    tripsOwned: number;
    collaborations: number;
  };
}

export interface AdminTrip {
  id: string;
  title: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  image: string;
  createdAt: string;
  owner: {
    id: string;
    username: string;
    email: string;
    profilePhoto?: string;
  };
  _count?: {
    memories: number;
    places: number;
    collaborators: number;
  };
}

export interface AdminMemory {
  id: string;
  type: string;
  content: string;
  createdAt: string;
  trip: {
    id: string;
    title: string;
    owner: {
      id: string;
      username: string;
      email: string;
    };
  };
  media: Array<{
    id: string;
    url: string;
  }>;
}

export interface AdminMedia {
  id: string;
  url: string;
  provider?: string;
  publicId?: string;
  createdAt: string;
  memory: {
    id: string;
    trip: {
      id: string;
      title: string;
    };
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  pagination: PaginationInfo;
}

export interface AdminTripsResponse {
  trips: AdminTrip[];
  pagination: PaginationInfo;
}

export interface AdminMemoriesResponse {
  memories: AdminMemory[];
  pagination: PaginationInfo;
}

export interface AdminMediaResponse {
  media: AdminMedia[];
  pagination: PaginationInfo;
}
