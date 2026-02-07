/**
 * Contexte d'authentification pour la gestion des utilisateurs
 * Gère la connexion, déconnexion, inscription
 */

"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { User, AuthContextType } from "@/types";

// État global module-level pour persister l'authentification
let globalAuthState: AuthState | null = null;

/** Reset pour les tests uniquement */
export function __resetAuthStateForTests() {
  globalAuthState = null;
}

// Fonction utilitaire pour gérer les cookies
const setCookie = (name: string, value: string, days = 7) => {
  if (globalThis.window === undefined) return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
};

const getCookie = (name: string): string | null => {
  if (globalThis.window === undefined) return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (const c of ca) {
    const trimmed = c.trimStart();
    if (trimmed.startsWith(nameEQ))
      return trimmed.substring(nameEQ.length, trimmed.length);
  }
  return null;
};

const deleteCookie = (name: string) => {
  if (globalThis.window === undefined) return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict`;
};

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  isInitialized: boolean; // Indique si l'initialisation des cookies est terminée
}

/**
 * Actions possibles pour le reducer d'authentification
 */
type AuthAction =
  | { type: "LOGIN_START" } // Début de la connexion
  | { type: "LOGIN_SUCCESS"; payload: { user: User; token: string } } // Connexion réussie
  | { type: "LOGIN_FAILURE" } // Échec de la connexion
  | { type: "LOGOUT_START" } // Début de la déconnexion
  | { type: "LOGOUT" } // Déconnexion
  | { type: "SIGNUP_START" } // Début de l'inscription
  | { type: "SIGNUP_SUCCESS"; payload: { user: User; token: string } } // Inscription réussie
  | { type: "SIGNUP_FAILURE" } // Échec de l'inscription
  | { type: "UPDATE_START" } // Début de la mise à jour
  | { type: "UPDATE_SUCCESS"; payload: User } // Mise à jour réussie
  | { type: "UPDATE_FAILURE" }; // Échec de la mise à jour

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false, // Ne pas commencer en loading pour accélérer l'affichage initial
  isLoggingOut: false,
  isInitialized: false,
};

/**
 * Reducer pour la gestion de l'état d'authentification
 */
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN_START":
    case "SIGNUP_START":
    case "UPDATE_START":
      return { ...state, isLoading: true };
    case "LOGIN_SUCCESS":
    case "SIGNUP_SUCCESS":
      return {
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isLoggingOut: false,
        isInitialized: true,
      };
    case "UPDATE_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isLoading: false,
        isInitialized: true,
      };
    case "LOGIN_FAILURE":
    case "SIGNUP_FAILURE":
    case "UPDATE_FAILURE":
      return { ...state, isLoading: false, isInitialized: true };
    case "LOGOUT_START":
      return { ...state, isLoggingOut: true };
    case "LOGOUT":
      return {
        user: null,
        token: null,
        isLoading: false,
        isLoggingOut: false,
        isInitialized: true,
      };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  // Utiliser l'état global si disponible, sinon état initial
  const [state, dispatch] = useReducer(
    authReducer,
    globalAuthState || initialState
  );

  // Synchroniser avec l'état global
  useEffect(() => {
    globalAuthState = state;
  }, [state]);

  // Initialisation côté client seulement
  useEffect(() => {
    // Si l'état global existe déjà, ne pas réinitialiser
    if (globalAuthState?.user) {
      return;
    }

    dispatch({ type: "UPDATE_START" }); // Marquer comme en cours de chargement

    const token = getCookie("token");
    const userData = getCookie("user");

    if (token && userData) {
      // Vérifier que l'utilisateur existe encore côté serveur
      const verifyUser = async () => {
        try {
          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL ||
            process.env.NEXT_PUBLIC_API_URL_FALLBACK;
          const response = await fetch(`${apiUrl}/user/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const user: User = JSON.parse(userData);
            dispatch({ type: "LOGIN_SUCCESS", payload: { user, token } });
          } else {
            // Utilisateur n'existe plus ou token invalide
            throw new Error(`User verification failed: ${response.statusText}`);
          }
        } catch {
          // Nettoyer les cookies et déconnecter
          deleteCookie("token");
          deleteCookie("user");
          globalAuthState = null; // Réinitialiser l'état global
          dispatch({ type: "LOGIN_FAILURE" });
        }
      };

      verifyUser();
    } else {
      // Pas de cookies, marquer comme initialisé sans utilisateur
      dispatch({ type: "UPDATE_FAILURE" });
    }
  }, []);

  // Persistance de session via sessionStorage

  const login = useCallback(
    async (email: string, password: string) => {
      dispatch({ type: "LOGIN_START" });

      try {
        const response = await fetch(`http://localhost:4000/user/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          throw new Error("Login failed");
        }

        const data = await response.json();
        // Stocker dans la session courante (persiste au refresh)
        setCookie("token", data.token);

        const user = {
          _id: data.id || data._id,
          username: data.username,
          email: data.email,
          admin: data.admin || false,
          profilePhoto: data.profilePhoto,
        };

        setCookie("user", JSON.stringify(user));
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user, token: data.token },
        });
      } catch (error) {
        dispatch({ type: "LOGIN_FAILURE" });
        throw error;
      }
    },
    [dispatch]
  );

  const signup = useCallback(
    async (username: string, email: string, password: string) => {
      dispatch({ type: "SIGNUP_START" });

      try {
        const response = await fetch(`http://localhost:4000/user/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, email, password }),
        });

        if (!response.ok) {
          throw new Error("Signup failed");
        }

        const data = await response.json();
        setCookie("token", data.token);

        const user = {
          _id: data.id || data._id,
          username: data.username,
          email: data.email,
          admin: data.admin || false,
          profilePhoto: data.profilePhoto,
        };

        setCookie("user", JSON.stringify(user));
        dispatch({
          type: "SIGNUP_SUCCESS",
          payload: { user, token: data.token },
        });
      } catch (error) {
        dispatch({ type: "SIGNUP_FAILURE" });
        throw error;
      }
    },
    [dispatch]
  );

  const logout = useCallback(() => {
    dispatch({ type: "LOGOUT_START" });
    // Supprimer les données de sessionStorage
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    // Supprimer les cookies aussi
    deleteCookie("token");
    deleteCookie("user");
    globalAuthState = null; // Réinitialiser l'état global
    dispatch({ type: "LOGOUT" });
  }, [dispatch]);

  const updateUser = useCallback(
    async (username?: string, password?: string) => {
      dispatch({ type: "UPDATE_START" });

      try {
        const token = state.token;
        if (!token) {
          throw new Error("No token found");
        }

        // Construire l'objet de données en excluant les valeurs undefined
        const updateData: { username?: string; password?: string } = {};
        if (username !== undefined) {
          updateData.username = username;
        }
        if (password !== undefined) {
          updateData.password = password;
        }

        const response = await fetch(`http://localhost:4000/user/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          throw new Error("Update failed");
        }

        const data = await response.json();

        const user = {
          _id: data.id || data._id,
          username: data.username,
          email: data.email,
          admin: data.admin || false,
          profilePhoto: data.profilePhoto,
        };
        setCookie("user", JSON.stringify(user));
        dispatch({ type: "UPDATE_SUCCESS", payload: user });
      } catch (error) {
        dispatch({ type: "UPDATE_FAILURE" });
        throw error;
      }
    },
    [dispatch, state.token]
  );

  const uploadProfilePhoto = useCallback(
    async (file: File) => {
      dispatch({ type: "UPDATE_START" });

      try {
        const token = state.token;
        if (!token) {
          throw new Error("No token found");
        }

        const formData = new FormData();
        formData.append("photo", file);

        const response = await fetch(
          `http://localhost:4000/user/upload-photo`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();

        const user = {
          _id: data.id || data._id,
          username: data.username,
          email: data.email,
          admin: data.admin || false,
          profilePhoto: data.profilePhoto,
        };
        setCookie("user", JSON.stringify(user));
        dispatch({ type: "UPDATE_SUCCESS", payload: user });
      } catch (error) {
        dispatch({ type: "UPDATE_FAILURE" });
        throw error;
      }
    },
    [dispatch, state.token]
  );

  const value: AuthContextType = useMemo(
    () => ({
      user: state.user,
      token: state.token,
      login,
      logout,
      signup,
      updateUser,
      uploadProfilePhoto,
      isLoading: state.isLoading,
      isLoggingOut: state.isLoggingOut,
      isInitialized: state.isInitialized,
    }),
    [
      state.user,
      state.token,
      state.isLoading,
      state.isLoggingOut,
      state.isInitialized,
      login,
      logout,
      signup,
      updateUser,
      uploadProfilePhoto,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
