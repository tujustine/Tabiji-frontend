"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { FaCopy, FaLink, FaTrash, FaEye, FaEdit } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import Modal from "@/components/modal/Modal";

interface ShareLink {
  id: string;
  token: string;
  role: "EDITOR" | "VIEWER";
  createdAt: string;
}

interface Collaborator {
  id: string;
  userId: string;
  tripId: string;
  role: "EDITOR" | "VIEWER";
  createdAt: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

interface ShareData {
  shareLinks: ShareLink[];
  collaborators: Collaborator[];
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripTitle: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  tripId,
  tripTitle,
}: Readonly<ShareModalProps>) {
  const { token } = useAuth();
  const [shareData, setShareData] = useState<ShareData>({
    shareLinks: [],
    collaborators: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [updatingCollaboratorId, setUpdatingCollaboratorId] = useState<
    string | null
  >(null);
  const [deletingCollaboratorId, setDeletingCollaboratorId] = useState<
    string | null
  >(null);
  const [selectedRole, setSelectedRole] = useState<"EDITOR" | "VIEWER">(
    "VIEWER"
  );

  // Charger les liens de partage et collaborateurs
  const loadShareData = useCallback(async () => {
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_API_URL_FALLBACK
        }/trip/${tripId}/shares`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (response.ok) {
        const data = await response.json();
        setShareData(data);
      } else {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Erreur lors du chargement des données de partage");
    }
  }, [tripId, token]);

  // Charger les données de partage
  useEffect(() => {
    if (isOpen && tripId) {
      loadShareData();
    }
  }, [isOpen, tripId, loadShareData]);

  // Fermer le modal
  const handleClose = () => {
    onClose();
  };

  // Créer un lien de partage
  const createShareLink = async () => {
    setIsLoading(true);
    try {
      const requestBody = { role: selectedRole };

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_API_URL_FALLBACK
        }/trip/${tripId}/share`,
        {
          method: "POST",
          headers: token
            ? {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              }
            : { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) {
        await loadShareData();
        toast.success("Lien de partage créé avec succès !");
      } else {
        const error = await response.json();
        toast.error(
          error.error || "Erreur lors de la création du lien de partage"
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors de la création du lien de partage";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Supprimer un lien de partage
  const deleteShareLink = async (linkId: string) => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer ce lien de partage ?\n\n⚠️ Cela supprimera également l'accès de tous les collaborateurs ajoutés via ce lien."
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_API_URL_FALLBACK
        }/share/${linkId}`,
        {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (response.ok) {
        await loadShareData();
        toast.success(
          "Lien de partage supprimé avec succès ! Tous les collaborateurs ajoutés via ce lien ont perdu l'accès."
        );
      } else {
        const error = await response.json();
        toast.error(
          error.error || "Erreur lors de la suppression du lien de partage"
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression du lien de partage";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre à jour le rôle d'un collaborateur
  const updateCollaboratorRole = async (
    collaboratorUserId: string,
    newRole: "EDITOR" | "VIEWER"
  ) => {
    setUpdatingCollaboratorId(collaboratorUserId);
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_API_URL_FALLBACK
        }/trip/${tripId}/collaborator/${collaboratorUserId}`,
        {
          method: "PUT",
          headers: token
            ? {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              }
            : { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (response.ok) {
        await loadShareData();
        toast.success("Rôle mis à jour avec succès");
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la mise à jour du rôle");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise à jour du rôle";
      toast.error(errorMessage);
    } finally {
      setUpdatingCollaboratorId(null);
    }
  };

  // Supprimer un collaborateur du voyage
  const removeCollaborator = async (collaboratorUserId: string) => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir retirer cette personne du voyage ? Elle perdra l'accès à ce voyage."
      )
    ) {
      return;
    }

    setDeletingCollaboratorId(collaboratorUserId);
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_API_URL_FALLBACK
        }/trip/${tripId}/collaborator/${collaboratorUserId}`,
        {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (response.ok) {
        await loadShareData();
        toast.success("Collaborateur retiré du voyage");
      } else {
        const error = await response.json();
        toast.error(
          error.error || "Erreur lors de la suppression du collaborateur"
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression du collaborateur";
      toast.error(errorMessage);
    } finally {
      setDeletingCollaboratorId(null);
    }
  };

  // Copier le lien dans le presse-papiers
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Lien copié dans le presse-papiers !");
  };

  // Générer l'URL complète du lien de partage
  const getShareUrl = (token: string) => {
    return `${globalThis.window.location.origin}/shared/${token}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Partager "${tripTitle}"`}
      size="2xl"
      maxHeight="max-h-[90vh]"
      className="overflow-hidden"
    >
      <div className="overflow-y-auto max-h-[60vh]">
        <div className="space-y-6">
          {/* Créer un lien de partage */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Créer un lien de partage
            </h3>
            <div className="bg-[#f6e6d1] rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-4">
                Créez un lien qui permet aux personnes d&apos;accéder à ce
                voyage. Elles pourront l&apos;ajouter à leurs voyages
                personnels.
              </p>

              {/* Sélection du rôle */}
              <div className="mb-4">
                <label
                  htmlFor="share-role-select"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Permissions du lien
                </label>
                <select
                  id="share-role-select"
                  value={selectedRole}
                  onChange={(e) =>
                    setSelectedRole(e.target.value as "EDITOR" | "VIEWER")
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7a8450] focus:border-transparent"
                >
                  <option value="VIEWER">
                    Lecteur - Peut seulement voir et commenter
                  </option>
                  <option value="EDITOR">
                    Éditeur - Peut modifier le voyage
                  </option>
                </select>
              </div>

              <button
                onClick={createShareLink}
                disabled={isLoading}
                className="flex items-center gap-2 bg-[#7a8450] hover:bg-[#6a7445] text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
              >
                <FaLink size={16} />
                Créer un lien de partage
              </button>
            </div>
          </div>

          {/* Liste des liens de partage */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Liens de partage actifs
            </h3>
            {shareData.shareLinks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Aucun lien de partage actif
              </p>
            ) : (
              <div className="space-y-3">
                {shareData.shareLinks.map((link) => (
                  <div
                    key={link.id}
                    className="border border-gray-200 rounded-md p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          <span>Lien de partage du voyage</span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              link.role === "EDITOR"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {link.role === "EDITOR" ? (
                              <>
                                <FaEdit className="inline mr-1" size={10} />
                                Éditeur
                              </>
                            ) : (
                              <>
                                <FaEye className="inline mr-1" size={10} />
                                Lecteur
                              </>
                            )}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Créé le{" "}
                          {new Date(link.createdAt).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteShareLink(link.id)}
                        disabled={isLoading}
                        className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={getShareUrl(link.token)}
                        readOnly
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50"
                      />
                      <button
                        onClick={() => copyToClipboard(getShareUrl(link.token))}
                        className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
                      >
                        <FaCopy size={12} />
                        Copier
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Liste des collaborateurs */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Personnes ayant rejoint le voyage
            </h3>
            {shareData.collaborators.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Personne n&apos;a encore rejoint ce voyage via un lien de
                partage
              </p>
            ) : (
              <div className="space-y-3">
                {shareData.collaborators.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="border border-gray-200 rounded-md p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900">
                          {collaborator.user.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {collaborator.user.email}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Rejoint le{" "}
                          {new Date(collaborator.createdAt).toLocaleDateString(
                            "fr-FR"
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={collaborator.role}
                          onChange={(e) =>
                            updateCollaboratorRole(
                              collaborator.userId,
                              e.target.value as "EDITOR" | "VIEWER"
                            )
                          }
                          disabled={
                            updatingCollaboratorId === collaborator.userId
                          }
                          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#7a8450] focus:border-transparent disabled:opacity-50"
                        >
                          <option value="VIEWER">Lecteur</option>
                          <option value="EDITOR">Éditeur</option>
                        </select>
                        <button
                          onClick={() =>
                            removeCollaborator(collaborator.userId)
                          }
                          disabled={
                            deletingCollaboratorId === collaborator.userId
                          }
                          className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50 p-1"
                          title="Retirer du voyage"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </div>
                    {updatingCollaboratorId === collaborator.userId && (
                      <div className="mt-2 text-xs text-gray-500">
                        Mise à jour...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
