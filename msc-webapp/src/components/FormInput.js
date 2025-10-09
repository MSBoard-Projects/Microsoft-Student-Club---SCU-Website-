import React from 'react';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

/**
 * Reusable form input component with enhanced validation UI
 */
const FormInput = ({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  placeholder = '', 
  required = false,
  disabled = false,
  error = '',
  helperText = '',
  className = '',
  showValidIcon = false
}) => {
  const hasValue = value && value.toString().length > 0;
  const isValid = hasValue && !error && showValidIcon;
  
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-text mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`block w-full px-3 py-2 border rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
            error 
              ? 'border-red-500 bg-red-50 focus:ring-red-500' 
              : isValid 
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
          } ${showValidIcon ? 'pr-10' : ''}`}
        />
        
        {/* Validation Icons */}
        {showValidIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {error ? (
              <FaExclamationCircle className="text-red-500" />
            ) : isValid ? (
              <FaCheckCircle className="text-green-500" />
            ) : null}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fadeIn">
          <FaExclamationCircle className="text-xs" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default FormInput;
