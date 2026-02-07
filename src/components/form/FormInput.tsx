/**
 * Composant d'input de formulaire
 * Gère l'affichage des labels, inputs et messages d'erreur
 */

interface FormInputProps {
  label: string;
  id: string;
  name: string;
  type: "text" | "email" | "password" | "tel" | "number" | "url";
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export default function FormInput({
  label,
  id,
  name,
  type,
  placeholder,
  required = false,
  error,
}: FormInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="mt-1">
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          className={`
            appearance-none block w-full px-3 py-2 border rounded-md 
            placeholder-gray-400 focus:outline-none sm:text-sm text-gray-900
            ${
              error
                ? "border-red-300 focus:border-red-500"
                : "border-gray-300 focus:border-amber-500"
            }
          `}
        />
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
