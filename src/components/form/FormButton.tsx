/**
 * Composant de bouton de formulaire
 */

import { HiOutlineArrowPath } from "react-icons/hi2";

interface FormButtonProps {
  children: React.ReactNode;
  type?: "submit";
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export default function FormButton({
  children,
  type = "submit",
  disabled = false,
  isLoading = false,
  className = "",
}: FormButtonProps) {
  const baseClasse =
    "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const buttonStyle =
    "bg-amber-800 text-white hover:bg-amber-900 focus:ring-amber-500 px-6 py-3 text-base";

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`
        ${baseClasse}
        ${buttonStyle}
        ${className}
      `}
    >
      {isLoading && (
        <HiOutlineArrowPath className="animate-spin -ml-1 mr-2 h-4 w-4" />
      )}
      {children}
    </button>
  );
}
