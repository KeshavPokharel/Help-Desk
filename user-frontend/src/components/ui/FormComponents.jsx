import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Reusable form components following Single Responsibility Principle
 */

// Form Field Wrapper with Label and Error
export const FormField = ({ 
  label, 
  error, 
  touched, 
  required, 
  children,
  hint 
}) => {
  const showError = touched && error;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {showError && (
        <div className="flex items-center text-sm text-red-600 mt-1">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
      {hint && !showError && (
        <p className="text-xs text-gray-500 mt-1">{hint}</p>
      )}
    </div>
  );
};

// Text Input
export const TextInput = ({ 
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  disabled,
  className = '',
  ...rest
}) => {
  const baseClasses = `
    block w-full px-3 py-2 border rounded-md shadow-sm 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
    disabled:bg-gray-100 disabled:cursor-not-allowed
    transition-all duration-200
  `;
  
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={`${baseClasses} ${className} border-gray-300`}
      {...rest}
    />
  );
};

// Text Area
export const TextArea = ({ 
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  rows = 4,
  disabled,
  className = '',
  ...rest
}) => {
  const baseClasses = `
    block w-full px-3 py-2 border rounded-md shadow-sm 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
    disabled:bg-gray-100 disabled:cursor-not-allowed
    transition-all duration-200 resize-vertical
  `;
  
  return (
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className={`${baseClasses} ${className} border-gray-300`}
      {...rest}
    />
  );
};

// Select Dropdown
export const Select = ({ 
  name,
  value,
  onChange,
  onBlur,
  options = [],
  placeholder = 'Select an option',
  disabled,
  className = '',
  ...rest
}) => {
  const baseClasses = `
    block w-full px-3 py-2 border rounded-md shadow-sm 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
    disabled:bg-gray-100 disabled:cursor-not-allowed
    transition-all duration-200
  `;
  
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
      className={`${baseClasses} ${className} border-gray-300`}
      {...rest}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option 
          key={option.value} 
          value={option.value}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};

// Password Input with Toggle
export const PasswordInput = ({ 
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  disabled,
  showPassword,
  onTogglePassword,
  icon: Icon,
  className = '',
  ...rest
}) => {
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
      )}
      <input
        type={showPassword ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          block w-full px-3 py-2 border rounded-md shadow-sm 
          ${Icon ? 'pl-10' : ''} pr-10
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
          disabled:bg-gray-100 disabled:cursor-not-allowed
          transition-all duration-200 border-gray-300
          ${className}
        `}
        {...rest}
      />
      {onTogglePassword && (
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          onClick={onTogglePassword}
          tabIndex="-1"
        >
          {showPassword ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

// Submit Button
export const SubmitButton = ({ 
  children, 
  isLoading, 
  disabled,
  className = '',
  ...rest
}) => {
  return (
    <button
      type="submit"
      disabled={isLoading || disabled}
      className={`
        w-full flex justify-center py-2 px-4 border border-transparent 
        rounded-md shadow-sm text-sm font-medium text-white 
        bg-blue-600 hover:bg-blue-700 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        ${className}
      `}
      {...rest}
    >
      {isLoading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Processing...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

// Cancel Button
export const CancelButton = ({ 
  children, 
  onClick,
  className = '',
  ...rest
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-4 py-2 border border-gray-300 rounded-md shadow-sm 
        text-sm font-medium text-gray-700 bg-white 
        hover:bg-gray-50 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        transition-all duration-200
        ${className}
      `}
      {...rest}
    >
      {children}
    </button>
  );
};

// Password Strength Indicator
export const PasswordStrength = ({ password, strength }) => {
  if (!password) return null;

  const getStrengthColor = () => {
    if (strength.color === 'red') return 'bg-red-500';
    if (strength.color === 'orange') return 'bg-orange-500';
    if (strength.color === 'yellow') return 'bg-yellow-500';
    if (strength.color === 'blue') return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthTextColor = () => {
    if (strength.color === 'red') return 'text-red-600';
    if (strength.color === 'orange') return 'text-orange-600';
    if (strength.color === 'yellow') return 'text-yellow-600';
    if (strength.color === 'blue') return 'text-blue-600';
    return 'text-green-600';
  };

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">Password Strength:</span>
        <span className={`text-sm font-medium ${getStrengthTextColor()}`}>
          {strength.label}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
          style={{ width: `${(strength.strength / 6) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};
