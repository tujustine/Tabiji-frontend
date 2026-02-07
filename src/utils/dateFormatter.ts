/**
 * Utilitaires pour formater les dates
 */

/**
 * Formate une date ISO en format lisible (ex: "15 Nov 2025")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);

  // Vérifier si la date est valide
  if (isNaN(date.getTime())) {
    return dateString;
  }

  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };

  return date.toLocaleDateString("fr-FR", options);
}
