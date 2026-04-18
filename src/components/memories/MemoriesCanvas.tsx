/**
 * Composant tableau blanc pour les souvenirs
 * Permet d'ajouter et de positionner librement du texte, des images et des vidéos
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";
import { IoMdSave, IoMdArrowBack, IoMdClose, IoMdCreate } from "react-icons/io";
import { FaImage, FaVideo, FaFont } from "react-icons/fa";
import type { Memory } from "@/types";
import { useSocket } from "@/hooks/useSocket";

/** URL affichable : `content` ou premier fichier lié (`media[]`) renvoyé par l’API */
function resolveMemoryContentUrl(memory: Memory): string {
  const fromContent = memory.content?.trim();
  if (fromContent) return fromContent;
  return memory.media?.[0]?.url?.trim() ?? "";
}
import { useAuth } from "@/contexts/AuthContext";
import Modal from "@/components/modal/Modal";

interface MemoriesCanvasProps {
  tripId: string;
  memories: Memory[];
  onSave: (memories: Memory[]) => Promise<void>;
  tripTitle: string;
  canEdit?: boolean;
}

export default function MemoriesCanvas({
  tripId,
  memories: initialMemories,
  onSave,
  tripTitle,
  canEdit = true,
}: Readonly<MemoriesCanvasProps>) {
  const router = useRouter();
  const { token } = useAuth();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [lastModifiedMemoryId, setLastModifiedMemoryId] = useState<
    string | null
  >(null);
  const pendingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const [currentTitle, setCurrentTitle] = useState<string>(tripTitle);
  const titleUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // États pour le responsive
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const prevCanvasSizeRef = useRef({ width: 0, height: 0 });
  const hasInitializedRef = useRef(false);

  const [textEditModal, setTextEditModal] = useState<{
    isOpen: boolean;
    memoryId: string;
    content: string;
    originalContent: string;
  } | null>(null);

  // Refs pour les inputs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const dragRefs = useRef<Map<string, React.RefObject<HTMLElement | null>>>(
    new Map()
  );

  const pixelsToPercent = useCallback(
    (x: number, y: number, width: number, height: number) => {
      if (canvasSize.width === 0 || canvasSize.height === 0)
        return { position: { x: 0, y: 0 }, size: { width: 0, height: 0 } };
      return {
        position: {
          x: (x / canvasSize.width) * 100,
          y: (y / canvasSize.height) * 100,
        },
        size: {
          width: (width / canvasSize.width) * 100,
          height: (height / canvasSize.height) * 100,
        },
      };
    },
    [canvasSize]
  );

  const percentToPixels = useCallback(
    (xPercent: number, yPercent: number) => {
      return {
        x: (xPercent / 100) * canvasSize.width,
        y: (yPercent / 100) * canvasSize.height,
      };
    },
    [canvasSize]
  );

  // Fonction pour obtenir la ref d'un élément draggable
  const getDragRef = (id: string) => {
    if (!dragRefs.current.has(id)) {
      dragRefs.current.set(id, React.createRef<HTMLElement>());
    }
    return dragRefs.current.get(id);
  };

  // Fonction pour normaliser les positions et tailles pour qu'elles restent dans les limites
  const normalizeMemory = (memory: Memory): Memory => {
    // Limiter les tailles à un maximum de 80% du canvas
    const normalizedSize = {
      width: Math.max(5, Math.min(memory.size.width, 80)),
      height: Math.max(5, Math.min(memory.size.height, 80)),
    };

    // Calculer les limites de position en tenant compte de la taille
    // S'assurer que maxX et maxY ne sont jamais négatifs
    const maxX = Math.max(0, 100 - normalizedSize.width);
    const maxY = Math.max(0, 100 - normalizedSize.height);

    // Normaliser les positions pour qu'elles restent dans les limites
    const normalizedPosition = {
      x: Math.max(0, Math.min(memory.position.x, maxX)),
      y: Math.max(0, Math.min(memory.position.y, maxY)),
    };

    return {
      ...memory,
      position: normalizedPosition,
      size: normalizedSize,
    };
  };

  // Mesurer la taille du canvas et gérer le responsive
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateCanvasSize();

    // Observer les changements de taille du canvas
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current);
    }

    // Écouter aussi les changements de fenêtre
    window.addEventListener("resize", updateCanvasSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, []);

  useEffect(() => {
    if (hasInitializedRef.current) return;

    if (
      initialMemories &&
      initialMemories.length > 0 &&
      canvasSize.width > 0 &&
      canvasSize.height > 0
    ) {
      // Détecter si les données sont en pixels (valeur > 100 pour position ou taille)
      const needsConversion = initialMemories.some(
        (m) =>
          m.position.x > 100 ||
          m.position.y > 100 ||
          m.size.width > 100 ||
          m.size.height > 100
      );

      if (needsConversion) {
        // Convertir de pixels vers pourcentages
        const convertedMemories = initialMemories.map((memory) => {
          const converted = pixelsToPercent(
            memory.position.x,
            memory.position.y,
            memory.size.width,
            memory.size.height
          );
          return normalizeMemory({
            ...memory,
            position: converted.position,
            size: converted.size,
          });
        });
        setMemories(convertedMemories);
      } else {
        // Les données sont déjà en pourcentages, mais on les normalise quand même
        const normalizedMemories = initialMemories.map(normalizeMemory);
        setMemories(normalizedMemories);
      }
      hasInitializedRef.current = true;
    } else if (initialMemories && initialMemories.length > 0) {
      // Pas de conversion nécessaire ou canvas pas encore mesuré, mais on normalise quand même
      const normalizedMemories = initialMemories.map(normalizeMemory);
      setMemories(normalizedMemories);
      hasInitializedRef.current = true;
    }
  }, [initialMemories, canvasSize, pixelsToPercent]);

  // Normaliser les positions lors du redimensionnement du canvas
  // pour éviter que les éléments se collent aux bordures
  useEffect(() => {
    if (
      canvasSize.width > 0 &&
      canvasSize.height > 0 &&
      (prevCanvasSizeRef.current.width !== canvasSize.width ||
        prevCanvasSizeRef.current.height !== canvasSize.height)
    ) {
      // Ne normaliser que si des éléments sont en dehors des limites
      setMemories((prev) => {
        if (prev.length === 0) return prev;

        // Vérifier si des éléments doivent être normalisés
        const needsNormalization = prev.some((memory) => {
          const maxX = Math.max(0, 100 - memory.size.width);
          const maxY = Math.max(0, 100 - memory.size.height);
          return (
            memory.position.x < 0 ||
            memory.position.x > maxX ||
            memory.position.y < 0 ||
            memory.position.y > maxY ||
            memory.size.width > 80 ||
            memory.size.height > 80 ||
            memory.size.width < 5 ||
            memory.size.height < 5
          );
        });

        if (needsNormalization) {
          // Normaliser uniquement les éléments qui en ont besoin
          return prev.map(normalizeMemory);
        }

        // Sinon, garder les positions telles quelles
        return prev;
      });

      // Mettre à jour la référence de la taille précédente
      prevCanvasSizeRef.current = canvasSize;
    }
  }, [canvasSize.width, canvasSize.height, canvasSize]);

  // Initialiser Socket.IO pour la collaboration en temps réel
  const { socket, isConnected, on, off } = useSocket({
    token: token || undefined,
    tripId,
    enabled: !!token && !!tripId,
  });

  // Handlers pour la synchronisation en temps réel
  const handleMemoryAdded = useCallback(
    (data: unknown) => {
      const typedData = data as { memory: Memory };
      // Ne pas ajouter si c'est notre propre action (éviter les doublons)
      if (lastModifiedMemoryId === typedData.memory.id) {
        setLastModifiedMemoryId(null);
        return;
      }
      setMemories((prev) => {
        const exists = prev.some((m) => m.id === typedData.memory.id);
        if (exists) {
          return prev;
        }
        return [...prev, normalizeMemory(typedData.memory)];
      });
    },
    [lastModifiedMemoryId]
  );

  const handleMemoryUpdated = useCallback(
    (data: unknown) => {
      const typedData = data as { memoryId: string; memory: Memory };
      // Ne pas mettre à jour si c'est notre propre modification
      if (lastModifiedMemoryId === typedData.memoryId) {
        setLastModifiedMemoryId(null);
        return;
      }
      setMemories((prev) =>
        prev.map((m) => {
          if (m.id === typedData.memoryId) {
            return normalizeMemory(typedData.memory);
          }
          return m;
        })
      );
    },
    [lastModifiedMemoryId]
  );

  const handleMemoryDeleted = useCallback(
    (data: unknown) => {
      const typedData = data as { memoryId: string };
      // Ne pas supprimer si c'est notre propre suppression
      if (lastModifiedMemoryId === typedData.memoryId) {
        setLastModifiedMemoryId(null);
        return;
      }
      setMemories((prev) => prev.filter((m) => m.id !== typedData.memoryId));
    },
    [lastModifiedMemoryId]
  );

  // Handler pour les changements de titre en temps réel
  const handleTitleUpdated = useCallback(
    (data: unknown) => {
      const typedData = data as { tripId: string; title: string };
      if (typedData.tripId === tripId) {
        setCurrentTitle(typedData.title);
      }
    },
    [tripId]
  );

  // Écouter les événements Socket.IO pour la synchronisation en temps réel
  useEffect(() => {
    if (!socket || !isConnected) return;

    on("memory:added", handleMemoryAdded);
    on("memory:updated", handleMemoryUpdated);
    on("memory:deleted", handleMemoryDeleted);
    on("trip:title-updated", handleTitleUpdated);

    return () => {
      off("memory:added", handleMemoryAdded);
      off("memory:updated", handleMemoryUpdated);
      off("memory:deleted", handleMemoryDeleted);
      off("trip:title-updated", handleTitleUpdated);
    };
  }, [
    socket,
    isConnected,
    on,
    off,
    tripId,
    lastModifiedMemoryId,
    handleMemoryAdded,
    handleMemoryUpdated,
    handleMemoryDeleted,
    handleTitleUpdated,
  ]);

  // Fonction pour nettoyer les mémoires vides
  const cleanupEmptyMemories = useCallback(() => {
    setMemories((prev) => {
      if (!prev) return prev;

      const filtered = prev.filter((memory) => {
        // Pour les éléments texte, on garde même s'ils sont vides (l'utilisateur peut les éditer)
        if (memory.type === "text") {
          return true;
        }
        
        // Images / vidéos : garder si URL dans content ou dans media[]
        const shouldKeep = resolveMemoryContentUrl(memory) !== "";
        return shouldKeep;
      });

      return filtered;
    });
  }, []);

  // Nettoyer automatiquement les mémoires avec du contenu vide (orphelines d'upload échoué)
  useEffect(() => {
    // Vérifier toutes les 15 secondes
    const interval = setInterval(cleanupEmptyMemories, 15000);

    return () => clearInterval(interval);
  }, [cleanupEmptyMemories]);

  // Ajouter un texte
  const addText = async () => {
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_API_URL_FALLBACK ||
        "http://localhost:4000";

      // Positions et tailles en pourcentages (10% depuis le haut/gauche, 15% de largeur, 8% de hauteur)
      const response = await fetch(`${apiUrl}/trip/${tripId}/memory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "text",
          content: "",
          position: { x: 10, y: 10 },
          size: { width: 20, height: 15 },
          zIndex: memories?.length || 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création du texte");
      }

      const createdMemory = await response.json();
      setMemories((prev) => [...(prev || []), normalizeMemory(createdMemory)]);
      setLastModifiedMemoryId(createdMemory.id);
    } catch (error) {
      console.error("Erreur création texte:", error);
      toast.error("Erreur lors de la création du texte");
    }
  };

  // Upload et ajout d'une image
  const addImage = () => {
    imageInputRef.current?.click();
  };

  // Upload et ajout d'une vidéo
  const addVideo = () => {
    videoInputRef.current?.click();
  };

  // Gérer l'upload de fichier
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    let createdMemory: Memory | null = null;
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_URL_FALLBACK ||
      "http://localhost:4000";

    try {
      // Étape 1: Créer le souvenir en base de données
      // Positions et tailles en pourcentages
      const createResponse = await fetch(`${apiUrl}/trip/${tripId}/memory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          content: "", // Sera mis à jour après upload
          position: { x: 10, y: 10 },
          size:
            type === "image"
              ? { width: 40, height: 40 }
              : { width: 25, height: 18 },
          zIndex: memories?.length || 0,
        }),
      });

      if (!createResponse.ok) {
        throw new Error("Erreur lors de la création du souvenir");
      }

      createdMemory = await createResponse.json();

      // Ajouter le souvenir au state local
      setMemories((prev) => [...(prev || []), normalizeMemory(createdMemory!)]);
      setLastModifiedMemoryId(createdMemory!.id);

      // Étape 2: Uploader le fichier avec l'ID réel
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(
        `${apiUrl}/trip/${tripId}/memory/${createdMemory!.id}/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error(
          "Upload failed with status:",
          uploadResponse.status,
          "Response:",
          errorText
        );
        throw new Error(
          `Erreur lors de l'upload: ${uploadResponse.status} - ${errorText}`
        );
      }

      const mediaData = await uploadResponse.json();

      // Étape 3: Mettre à jour le souvenir avec l'URL du média en base de données
      const updateResponse = await fetch(
        `${apiUrl}/memory/${createdMemory!.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: mediaData.url,
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error("Erreur lors de la mise à jour du souvenir");
      }

      // Étape 4: Mettre à jour l'état local
      setMemories((prev) =>
        prev.map((m) =>
          m.id === createdMemory!.id ? { ...m, content: mediaData.url } : m
        )
      );
    } catch (error) {
      console.error("Erreur upload:", error);

      // Supprimer immédiatement du state local si la mémoire a été créée
      if (createdMemory) {
        setMemories((prev) =>
          (prev || []).filter((m) => m.id !== createdMemory!.id)
        );

        // Supprimer aussi du serveur pour éviter les mémoires orphelines
        try {
          await fetch(`${apiUrl}/memory/${createdMemory.id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (deleteError) {
          console.error(
            "Erreur lors de la suppression de la mémoire orpheline:",
            deleteError
          );
        }
      }

      toast.error("Erreur lors de l'upload du fichier");
    } finally {
      setIsUploading(false);
      // Réinitialiser l'input
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  // Mettre à jour la position (en pourcentages) avec limites
  const handleDrag = (id: string, e: DraggableEvent, data: DraggableData) => {
    if (canvasSize.width === 0 || canvasSize.height === 0) return;

    const memory = memories.find((m) => m.id === id);
    if (!memory) return;

    // Calculer les limites en pourcentages (tenir compte de la taille de l'élément)
    // S'assurer que maxX et maxY ne sont jamais négatifs
    const maxX = Math.max(0, 100 - memory.size.width);
    const maxY = Math.max(0, 100 - memory.size.height);

    // Convertir la position en pourcentages et limiter
    const positionPercent = {
      x: Math.max(0, Math.min((data.x / canvasSize.width) * 100, maxX)),
      y: Math.max(0, Math.min((data.y / canvasSize.height) * 100, maxY)),
    };

    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, position: positionPercent } : m))
    );
  };

  // Sauvegarder automatiquement la position d'une mémoire
  const saveMemoryPosition = useCallback(
    async (id: string) => {
      try {
        const latestMemories = memories || [];
        const memoryData = latestMemories.find((m) => m.id === id);

        if (!memoryData) {
          pendingTimeouts.current.delete(id);
          return;
        }

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_API_URL_FALLBACK ||
          "http://localhost:4000";

        const response = await fetch(`${apiUrl}/memory/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            position: memoryData.position,
            size: memoryData.size,
            zIndex: memoryData.zIndex,
          }),
        });

        if (!response.ok) {
          if (response.status === 404) {
            setMemories((prev) => (prev || []).filter((m) => m.id !== id));
            pendingTimeouts.current.delete(id);
            return;
          }
          throw new Error("Erreur lors de la mise à jour de la position");
        }

        setLastModifiedMemoryId(id);
        pendingTimeouts.current.delete(id);
      } catch (error) {
        console.error("Erreur sauvegarde automatique position:", error);
        pendingTimeouts.current.delete(id);
      }
    },
    [memories, token]
  );

  // Normaliser la position après le drag et déclencher la sauvegarde automatique
  const handleDragStop = (id: string) => {
    // Normaliser d'abord localement
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? normalizeMemory(m) : m))
    );

    // Annuler tout timeout en cours pour cet élément
    const existingTimeout = pendingTimeouts.current.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Lancer la sauvegarde en arrière-plan avec timeout annulable
    const timeoutId = setTimeout(() => saveMemoryPosition(id), 100);

    pendingTimeouts.current.set(id, timeoutId);
  };

  // État pour le modal de redimensionnement
  const [resizeModal, setResizeModal] = useState<{
    isOpen: boolean;
    memoryId: string;
    width: number;
    height: number;
  } | null>(null);

  // Ouvrir le modal de redimensionnement
  const openResizeModal = (id: string) => {
    const memory = memories?.find((m) => m.id === id);
    if (!memory) return;

    setResizeModal({
      isOpen: true,
      memoryId: id,
      width: memory.size.width,
      height: memory.size.height,
    });
  };

  // Fermer le modal de redimensionnement
  const closeResizeModal = () => {
    setResizeModal(null);
  };

  // Appliquer les nouvelles dimensions depuis le modal
  const applyResize = async () => {
    if (!resizeModal) return;

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_API_URL_FALLBACK ||
        "http://localhost:4000";

      const response = await fetch(`${apiUrl}/memory/${resizeModal.memoryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          size: { width: resizeModal.width, height: resizeModal.height },
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de la taille");
      }

      // Mettre à jour localement et marquer comme modifié
      setMemories((prev) =>
        (prev || []).map((m) => {
          if (m.id === resizeModal.memoryId) {
            const updatedMemory = {
              ...m,
              size: { width: resizeModal.width, height: resizeModal.height },
            };
            return normalizeMemory(updatedMemory);
          }
          return m;
        })
      );
      setLastModifiedMemoryId(resizeModal.memoryId);

      closeResizeModal();
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde de la taille: " + error);
    }
  };

  // Supprimer un souvenir
  const deleteMemory = async (id: string) => {
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_API_URL_FALLBACK ||
        "http://localhost:4000";

      const response = await fetch(`${apiUrl}/memory/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          "Erreur lors de la suppression: " + response.statusText
        );
      }

      // Annuler tout timeout en cours pour cet élément avant de le supprimer
      const existingTimeout = pendingTimeouts.current.get(id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        pendingTimeouts.current.delete(id);
      }

      // Supprimer du state local seulement si la suppression côté serveur a réussi
      setMemories((prev) => (prev || []).filter((m) => m.id !== id));
      if (selectedMemoryId === id) {
        setSelectedMemoryId(null);
      }
      setLastModifiedMemoryId(id);
    } catch (error) {
      toast.error("Erreur lors de la suppression du souvenir: " + error);
    }
  };

  // Ouvrir la modale d'édition de texte
  const openTextEditModal = (id: string) => {
    const memory = memories?.find((m) => m.id === id);
    if (!memory) return;

    setTextEditModal({
      isOpen: true,
      memoryId: id,
      content: memory.content || "", // Utiliser le contenu existant
      originalContent: memory.content || "", // Garder le contenu original pour pouvoir annuler
    });
  };

  // Fermer la modale d'édition de texte
  const closeTextEditModal = () => {
    setTextEditModal(null);
  };

  // Mettre à jour le titre quand tripTitle change
  useEffect(() => {
    setCurrentTitle(tripTitle);
  }, [tripTitle]);

  // Fonction pour mettre à jour le titre du voyage dans la base de données
  const updateTripTitle = useCallback(
    async (newTitle: string) => {
      if (!token || !canEdit) return;

      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_API_URL_FALLBACK ||
          "http://localhost:4000";

        const response = await fetch(`${apiUrl}/trip/${tripId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: newTitle,
          }),
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la mise à jour du titre");
        }

        // Le backend émet automatiquement l'événement Socket.IO après la mise à jour
      } catch (error) {
        console.error("Erreur lors de la mise à jour du titre:", error);
        toast.error("Impossible de mettre à jour le titre");
        // Restaurer le titre précédent en cas d'erreur
        setCurrentTitle(tripTitle);
      }
    },
    [token, canEdit, tripId, tripTitle]
  );

  // Handler pour le changement de titre avec debounce
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setCurrentTitle(newTitle);

      // Annuler le timeout précédent s'il existe
      if (titleUpdateTimeoutRef.current) {
        clearTimeout(titleUpdateTimeoutRef.current);
      }

      // Définir un nouveau timeout pour mettre à jour après 1 seconde d'inactivité
      titleUpdateTimeoutRef.current = setTimeout(() => {
        if (newTitle.trim() !== tripTitle.trim() && newTitle.trim() !== "") {
          updateTripTitle(newTitle.trim());
        }
      }, 1000);
    },
    [tripTitle, updateTripTitle]
  );

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (titleUpdateTimeoutRef.current) {
        clearTimeout(titleUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Appliquer les modifications du texte avec sauvegarde automatique
  const applyTextEdit = async () => {
    if (!textEditModal) return;

    // Utiliser le contenu tel quel (même s'il est vide) pour permettre de sauvegarder un nouveau texte
    const finalContent = textEditModal.content;

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_API_URL_FALLBACK ||
        "http://localhost:4000";

      const response = await fetch(
        `${apiUrl}/memory/${textEditModal.memoryId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: finalContent,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Erreur lors de la mise à jour du texte: " + response.statusText
        );
      }

      // Mettre à jour localement et marquer comme modifié
      setMemories((prev) =>
        (prev || []).map((m) =>
          m.id === textEditModal.memoryId ? { ...m, content: finalContent } : m
        )
      );
      setLastModifiedMemoryId(textEditModal.memoryId);

      closeTextEditModal();
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde du texte: " + error);
    }
  };

  // Mettre au premier plan avec sauvegarde automatique
  const bringToFront = (id: string) => {
    const currentMemories = memories || [];
    const memoryExists = currentMemories.some((m) => m.id === id);
    if (!memoryExists) return; // Ne pas continuer si l'élément n'existe plus

    // Annuler tout timeout en cours pour cet élément
    const existingTimeout = pendingTimeouts.current.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const maxZ = Math.max(...currentMemories.map((m) => m.zIndex), 0);
    const newZIndex = maxZ + 1;

    // Mettre à jour localement immédiatement
    setMemories((prev) =>
      (prev || []).map((m) => (m.id === id ? { ...m, zIndex: newZIndex } : m))
    );

    // Sauvegarder automatiquement en arrière-plan avec timeout annulable
    const timeoutId = setTimeout(async () => {
      try {
        // Double vérification - s'assurer que l'élément existe toujours
        const latestMemories = memories || [];
        const stillExists = latestMemories.some((m) => m.id === id);

        if (!stillExists) {
          pendingTimeouts.current.delete(id);
          return;
        }

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_API_URL_FALLBACK ||
          "http://localhost:4000";

        const response = await fetch(`${apiUrl}/memory/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            zIndex: newZIndex,
          }),
        });

        if (!response.ok) {
          throw new Error(
            "Erreur lors de la mise à jour du zIndex: " + response.statusText
          );
        }

        setLastModifiedMemoryId(id);
        pendingTimeouts.current.delete(id);
      } catch (error) {
        toast.error("Erreur lors de la sauvegarde du zIndex: " + error);
        pendingTimeouts.current.delete(id);
      }
    }, 100);

    pendingTimeouts.current.set(id, timeoutId);
  };

  // Sauvegarder (principalement pour les nouveaux éléments)
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Les modifications individuelles sont déjà sauvegardées automatiquement
      // Cette fonction gère principalement les nouveaux éléments temporaires
      await onSave(memories);
      toast.success("Souvenirs sauvegardés !");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde: " + error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6e6d1]">
      {/* Barre d'outils */}
      <div className="bg-white shadow-md p-4 mx-4 mt-2 mb-0 sticky top-0 z-40 rounded-t-lg">
        <div className="flex sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => router.push(`/trips/${tripId}`)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 hover:text-gray-400 text-gray-800 rounded-md transition-colors text-sm sm:text-base"
            >
              <IoMdArrowBack size={18} />
              <span className="hidden xs:inline">Retour</span>
            </button>
          </div>

          <div className="flex-1 flex justify-center">
            {canEdit ? (
              <input
                type="text"
                value={currentTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={(e) => {
                  // Mettre à jour immédiatement quand l'utilisateur quitte le champ
                  if (titleUpdateTimeoutRef.current) {
                    clearTimeout(titleUpdateTimeoutRef.current);
                  }
                  if (e.target.value.trim() !== tripTitle.trim() && e.target.value.trim() !== "") {
                    updateTripTitle(e.target.value.trim());
                  } else if (e.target.value.trim() === "") {
                    // Restaurer le titre si vide
                    setCurrentTitle(tripTitle);
                  }
                }}
                className="hidden md:block text-center text-lg md:text-xl font-bold text-gray-900 font-bagel bg-transparent border-none outline-none focus:outline-none focus:ring-0 max-w-xs"
                placeholder="Titre du tableau"
              />
            ) : (
              <h1 className="hidden md:block text-center text-lg md:text-xl font-bold text-gray-900 font-bagel max-w-xs">
                {currentTitle}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={addText}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors text-sm sm:text-base"
                  title="Ajouter du texte"
                >
                  <FaFont size={16} />
                  <span className="hidden xs:inline">Texte</span>
                </button>
                <button
                  type="button"
                  onClick={addImage}
                  disabled={isUploading}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-md transition-colors text-sm sm:text-base"
                  title="Ajouter une image"
                >
                  <FaImage size={16} />
                  <span className="hidden xs:inline">
                    {isUploading ? "Upload..." : "Image"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={addVideo}
                  disabled={isUploading}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-md transition-colors text-sm sm:text-base"
                  title="Ajouter une vidéo"
                >
                  <FaVideo size={16} />
                  <span className="hidden xs:inline">
                    {isUploading ? "Upload..." : "Vidéo"}
                  </span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || isUploading}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[#7a8450] hover:bg-[#6a7445] disabled:bg-gray-400 text-white rounded-md transition-colors text-sm sm:text-base"
                    title="Sauvegarder les nouveaux éléments (les modifications sont synchronisées automatiquement)"
                  >
                    <IoMdSave size={18} />
                    <span className="hidden xs:inline">
                      {isSaving ? "Sauvegarde..." : "Sauvegarder"}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Inputs file cachés */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, "image")}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => handleFileUpload(e, "video")}
            className="hidden"
          />
        </div>
      </div>

      {/* Canvas */}
      <div className="mx-4">
        <div
          ref={canvasRef}
          id="memories-canvas"
          className="relative w-full border-2 border-dashed border-gray-300 border-t-0 bg-gray-50 rounded-b-lg"
          style={{
            minHeight: "calc(100vh - 120px - 2rem)",
            height: "calc(100vh - 120px - 2rem)",
          }}
        >
          {memories?.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">🖼️ Zone de travail des souvenirs</p>
                <p className="text-sm">
                  Cliquez sur les boutons ci-dessus pour ajouter des souvenirs
                </p>
                <p className="text-xs mt-2 opacity-70">
                  Vous pouvez déplacer et redimensionner les éléments dans cette
                  zone
                </p>
              </div>
            </div>
          )}

          {Array.from(
            new Map(
              memories?.map((memory) => [memory.id, memory]) || []
            ).values()
          ).map((memory) => {
            const dragRef = getDragRef(memory.id);
            // Convertir les pourcentages en pixels pour react-draggable
            const positionInPixels = percentToPixels(
              memory.position.x,
              memory.position.y
            );

            // Calculer les bounds en pixels pour que l'élément reste dans le canvas
            // en tenant compte de la taille de l'élément
            const elementWidthInPixels =
              (memory.size.width / 100) * canvasSize.width;
            const elementHeightInPixels =
              (memory.size.height / 100) * canvasSize.height;

            // S'assurer que les bounds sont valides (pas négatifs)
            const bounds = {
              left: 0,
              top: 0,
              right: Math.max(0, canvasSize.width - elementWidthInPixels),
              bottom: Math.max(0, canvasSize.height - elementHeightInPixels),
            };

            return (
              <Draggable
                key={memory.id}
                position={positionInPixels}
                onDrag={(e, data) => canEdit && handleDrag(memory.id, e, data)}
                onStop={() => canEdit && handleDragStop(memory.id)}
                onStart={() => {
                  if (canEdit) {
                    setSelectedMemoryId(memory.id);
                    bringToFront(memory.id);
                  }
                }}
                enableUserSelectHack={false}
                nodeRef={dragRef}
                bounds={canEdit ? bounds : undefined}
                disabled={!canEdit}
                cancel="button"
                handle={memory.type === "text" ? ".memory-text-drag" : undefined}
              >
                <div
                  className="absolute min-h-0 min-w-0 max-w-full cursor-move rounded-xl border-0 bg-transparent p-0"
                  style={{
                    width: `${memory.size.width}%`,
                    height: `${memory.size.height}%`,
                    zIndex: memory.zIndex,
                    boxSizing: "border-box",
                  }}
                  onClick={(e) => {
                    // Ne sélectionner que si on n'a pas cliqué sur un bouton
                    if (!(e.target as HTMLElement).closest('button')) {
                      setSelectedMemoryId(memory.id);
                    }
                  }}
                  tabIndex={canEdit ? 0 : -1}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && canEdit) {
                      e.preventDefault();
                      setSelectedMemoryId(memory.id);
                    }
                  }}
                  onMouseDown={(e) => {
                    if (canEdit && !(e.target as HTMLElement).closest("button")) {
                      e.preventDefault();
                    }
                  }}
                  role={canEdit ? "group" : undefined}
                  aria-label={canEdit ? `Souvenir ${memory.id}` : undefined}
                  ref={dragRef as React.RefObject<HTMLDivElement>}
                >
                  <div
                    className={`relative h-full w-full overflow-hidden rounded-lg group shadow-md ${
                      memory.type === "text"
                        ? `grid min-h-0 bg-white ${
                            canEdit
                              ? "grid-rows-[auto_minmax(0,1fr)]"
                              : "grid-rows-[minmax(0,1fr)]"
                          }`
                        : "min-h-0 min-w-0"
                    }`}
                    style={{ width: "100%", height: "100%" }}
                  >
                    {/* Barre d'outils - uniquement pour texte */}
                    {memory.type === "text" && canEdit && (
                      <div className="memory-text-drag drag-handle flex shrink-0 cursor-move flex-nowrap items-center justify-start gap-1 overflow-x-auto border-b border-gray-200 bg-gray-100 px-1 py-1 sm:gap-1.5 sm:px-1.5 [scrollbar-width:thin]">
                        {/* Bouton suppression (rouge) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMemory(memory.id);
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="flex h-6 w-6 shrink-0 touch-manipulation items-center justify-center rounded-full bg-red-500 text-gray-800 transition-colors hover:bg-red-600"
                          title="Supprimer"
                        >
                          <IoMdClose size={12} />
                        </button>

                        {/* Éditer le texte — mobile uniquement (double-clic au bureau) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openTextEditModal(memory.id);
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="flex h-6 w-6 shrink-0 touch-manipulation items-center justify-center rounded-full bg-blue-500 text-gray-800 transition-colors hover:bg-blue-600 md:hidden"
                          title="Éditer le texte"
                          aria-label="Éditer le texte"
                        >
                          <IoMdCreate size={12} />
                        </button>

                        {/* Bouton redimensionnement (vert) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openResizeModal(memory.id);
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="flex h-6 w-6 shrink-0 touch-manipulation items-center justify-center rounded-full bg-green-500 text-gray-800 transition-colors hover:bg-green-600"
                          title="Redimensionner"
                        >
                          <span className="text-xs font-bold leading-none">⤡</span>
                        </button>
                      </div>
                    )}

                    {memory.type === "text" && (
                      <div className="flex min-h-0 flex-col overflow-hidden p-2">
                        <textarea
                          readOnly
                          className={`box-border block min-h-0 w-full flex-1 basis-0 text-left text-sm whitespace-pre-wrap break-words resize-none border-0 bg-transparent outline-none ${
                            canEdit ? "cursor-text" : "cursor-default"
                          }`}
                          value={
                            memory.content ||
                            (canEdit
                              ? "Double-clic ou icône crayon pour éditer"
                              : "Texte")
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              !canEdit ||
                              typeof window === "undefined" ||
                              !window.matchMedia("(pointer: coarse)").matches
                            ) {
                              return;
                            }
                            openTextEditModal(memory.id);
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            if (canEdit) {
                              openTextEditModal(memory.id);
                            }
                          }}
                          tabIndex={canEdit ? 0 : undefined}
                          aria-label={
                            canEdit
                              ? "Texte du souvenir. Double-cliquez pour éditer sur ordinateur, ou utilisez le bouton crayon sur mobile."
                              : undefined
                          }
                          onKeyDown={(e) => {
                            if (canEdit && (e.key === "Enter" || e.key === " ")) {
                              e.preventDefault();
                              e.stopPropagation();
                              openTextEditModal(memory.id);
                            }
                          }}
                        />
                      </div>
                    )}

                      {memory.type === "image" &&
                        (resolveMemoryContentUrl(memory) ? (
                          <div className="w-full h-full relative rounded-xl overflow-hidden">
                            <Image
                              src={resolveMemoryContentUrl(memory)}
                              alt="Souvenir"
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-contain pointer-events-none"
                            />
                            {/* Superposition avec boutons */}
                            {canEdit && (
                              <div className="pointer-events-auto absolute left-1 top-1 z-10 flex flex-nowrap gap-1 opacity-100 transition-opacity duration-200 md:left-2 md:top-2 md:gap-2 md:opacity-0 md:group-hover:opacity-100">
                                {/* Bouton suppression (rouge) */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteMemory(memory.id);
                                  }}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  className="flex h-6 w-6 shrink-0 touch-manipulation items-center justify-center rounded-full bg-red-500 text-gray-800 transition-colors hover:bg-red-600"
                                  title="Supprimer"
                                >
                                  <IoMdClose size={12} />
                                </button>

                                {/* Bouton redimensionnement (vert) */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openResizeModal(memory.id);
                                  }}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  className="flex h-6 w-6 shrink-0 touch-manipulation items-center justify-center rounded-full bg-green-500 text-gray-800 transition-colors hover:bg-green-600"
                                  title="Redimensionner"
                                >
                                  <span className="text-xs font-bold leading-none">
                                    ⤡
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
                            <span className="text-sm">Chargement...</span>
                          </div>
                        ))}

                      {memory.type === "video" &&
                        (resolveMemoryContentUrl(memory) ? (
                          <div className="w-full h-full relative rounded-xl overflow-hidden bg-black">
                            <video
                              src={resolveMemoryContentUrl(memory)}
                              controls
                              playsInline
                              preload="metadata"
                              className="h-full w-full object-contain"
                              title="Vidéo souvenir"
                            />
                            {/* Barre draggable large avec boutons */}
                            {canEdit && (
                              <div className="drag-handle absolute left-0 right-0 top-0 z-10 flex cursor-move items-center rounded-t-xl bg-black/30 px-1.5 py-1 opacity-100 transition-opacity duration-200 sm:px-2 sm:py-1.5 md:opacity-0 md:group-hover:opacity-100">
                                {/* Boutons à gauche */}
                                <div className="flex shrink-0 flex-nowrap items-center gap-1 overflow-x-auto sm:gap-2 [scrollbar-width:thin]">
                                  {/* Bouton suppression (rouge) */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteMemory(memory.id);
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="flex h-6 w-6 shrink-0 touch-manipulation items-center justify-center rounded-full bg-red-500 text-gray-800 transition-colors hover:bg-red-600"
                                    title="Supprimer"
                                  >
                                    <IoMdClose size={12} />
                                  </button>

                                  {/* Bouton redimensionnement (vert) */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openResizeModal(memory.id);
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    className="flex h-6 w-6 shrink-0 touch-manipulation items-center justify-center rounded-full bg-green-500 text-gray-800 transition-colors hover:bg-green-600"
                                    title="Redimensionner"
                                  >
                                    <span className="text-xs font-bold leading-none">
                                      ⤡
                                    </span>
                                  </button>
                                </div>

                                {/* Zone de drag au centre et à droite (plus large) */}
                                <div className="flex-1 h-full cursor-move ml-4"></div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
                            <span className="text-sm">Chargement...</span>
                          </div>
                        ))}
                  </div>
                </div>
              </Draggable>
            );
          })}
        </div>
      </div>

      {/* Modal de redimensionnement */}
      <Modal
        isOpen={Boolean(resizeModal?.isOpen)}
        onClose={closeResizeModal}
        title="Redimensionner l'élément"
        size="md"
      >
        {resizeModal && (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Largeur: {resizeModal.width.toFixed(1)}%
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="0.5"
                  value={resizeModal.width}
                  onChange={(e) =>
                    setResizeModal((prev) =>
                      prev
                        ? { ...prev, width: Number.parseFloat(e.target.value) }
                        : null
                    )
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hauteur: {resizeModal.height.toFixed(1)}%
                </label>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="0.5"
                  value={resizeModal.height}
                  onChange={(e) =>
                    setResizeModal((prev) =>
                      prev
                        ? { ...prev, height: Number.parseFloat(e.target.value) }
                        : null
                    )
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeResizeModal}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={applyResize}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Appliquer
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Modal d'édition de texte */}
      <Modal
        isOpen={Boolean(textEditModal?.isOpen)}
        onClose={closeTextEditModal}
        title="Modifier le texte"
        size="lg"
      >
        {textEditModal && (
          <>
            <div className="mb-4">
              <textarea
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                value={textEditModal.content}
                onChange={(e) =>
                  setTextEditModal((prev) =>
                    prev ? { ...prev, content: e.target.value } : null
                  )
                }
                placeholder="Tapez votre texte ici..."
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeTextEditModal}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={applyTextEdit}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                disabled={false}
              >
                Appliquer
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
