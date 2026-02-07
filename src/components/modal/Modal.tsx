/**
 * Composant Modal réutilisable
 * Gère le style uniforme, le clic extérieur, echap et le scroll lock
 */

"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";
import { useScrollLock } from "@/hooks/useScrollLock";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  className?: string;
  headerClassName?: string;
  maxHeight?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  size = "md",
  className = "",
  headerClassName = "",
  maxHeight = "",
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Bloquer le scroll quand la modale est ouverte
  useScrollLock(isOpen);

  // Gérer la fermeture avec echap et clic extérieur
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (modalRef.current && !modalRef.current.contains(target)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
  };

  const headerClasses =
    headerClassName ||
    "flex items-center justify-between p-6 border-b border-gray-200";
  const hasCustomHeader = headerClassName.includes("sticky");
  const contentClasses = maxHeight ? `overflow-y-auto ${maxHeight}` : "";

  const modalContent = (
    <div className="fixed inset-0 z-[2000] bg-black/50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className={`bg-white rounded-lg shadow-2xl ${
          sizeClasses[size]
        } w-full flex flex-col ${maxHeight || ""} ${className}`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={headerClasses}>
            {title && (
              <h3
                className={`text-xl font-bold ${
                  headerClassName.includes("text-white")
                    ? "text-white"
                    : "text-gray-900"
                }`}
              >
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className={`${
                  headerClassName.includes("text-white")
                    ? "text-white hover:text-gray-200"
                    : "text-gray-400 hover:text-gray-600"
                } transition-colors p-1 rounded-md ${
                  headerClassName.includes("text-white")
                    ? ""
                    : "hover:bg-gray-100"
                }`}
                aria-label="Fermer la modale"
              >
                <FaTimes size={20} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className={`${title || showCloseButton ? "p-6" : ""} ${
            hasCustomHeader ? "" : contentClasses
          } flex-1 ${hasCustomHeader ? contentClasses : ""}`}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
