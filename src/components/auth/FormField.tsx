
import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  options,
  required = true,
  placeholder,
  showPassword,
  onTogglePassword,
}) => {
  const [internalShowPassword, setInternalShowPassword] = React.useState(false);
  
  // Use provided showPassword state if available, otherwise use internal state
  const passwordVisible = showPassword !== undefined ? showPassword : internalShowPassword;
  const togglePasswordVisibility = onTogglePassword || (() => setInternalShowPassword(!internalShowPassword));

  const baseClasses = "appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

  if (type === 'select' && options) {
    return (
      <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <select
          id={name}
          name={name}
          required={required}
          className={baseClasses}
          value={value}
          onChange={onChange}
        >
          <option value="">Select {label}</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type === 'password' && passwordVisible ? 'text' : type}
          required={required}
          className={baseClasses}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        {type === 'password' && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={togglePasswordVisibility}
          >
            {passwordVisible ? (
              <EyeOff className="h-5 w-5 text-gray-400" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
