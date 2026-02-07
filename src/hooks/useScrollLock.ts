/**
 * Hook personnalisé pour bloquer/débloquer le scroll du body
 * Utile pour les modales et autres overlays
 * Gère automatiquement le paddingRight pour éviter les décalages
 */

import { useEffect } from "react";

export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      // Sauvegarder les valeurs originales
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      // Calculer la largeur de la scrollbar
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      // Bloquer le scroll
      document.body.style.overflow = "hidden";

      // Ajuster le paddingRight si nécessaire pour éviter le décalage
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      // Cleanup: remettre les valeurs originales
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isLocked]);
}
