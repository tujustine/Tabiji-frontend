/**
 * Composant d'affichage des erreurs de formulaire
 */

import { HiOutlineExclamationCircle } from "react-icons/hi";

interface FormErrorProps {
  error?: string | null;
}

export default function FormError({ error }: FormErrorProps) {
  if (!error) return null;

  return (
    <div
      className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md`}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <HiOutlineExclamationCircle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">{error}</p>
        </div>
      </div>
    </div>
  );
}
