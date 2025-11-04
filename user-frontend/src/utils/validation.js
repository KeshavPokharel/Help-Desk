/**
 * Form Validation Utilities
 * Follows Single Responsibility Principle - each function has one clear purpose
 */

// Email validation
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }
  
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    return { isValid: false, error: 'Email is required' };
  }
  
  // Basic email format validation
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  // Split email into local part and domain
  const [localPart, domain] = trimmedEmail.split('@');
  
  // Reject if local part (before @) is only numbers
  if (/^\d+$/.test(localPart)) {
    return { isValid: false, error: 'Email username cannot contain only numbers' };
  }
  
  // Reject if local part has no letters (only numbers and special chars)
  if (!/[a-zA-Z]/.test(localPart)) {
    return { isValid: false, error: 'Email username must contain at least one letter' };
  }
  
  // Split domain into name and TLD
  const domainParts = domain.split('.');
  const domainName = domainParts[0];
  
  // Reject if domain name (before first .) is only numbers
  if (/^\d+$/.test(domainName)) {
    return { isValid: false, error: 'Email domain cannot contain only numbers' };
  }
  
  // Reject if domain has no letters
  if (!/[a-zA-Z]/.test(domainName)) {
    return { isValid: false, error: 'Email domain must contain at least one letter' };
  }
  
  // Ensure TLD is all letters (no numbers like .123)
  const tld = domainParts[domainParts.length - 1];
  if (!/^[a-zA-Z]{2,}$/.test(tld)) {
    return { isValid: false, error: 'Email must have a valid domain extension (e.g., .com, .org)' };
  }
  
  return { isValid: true, value: trimmedEmail };
};

// Password validation
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = false,
    requireLowercase = false,
    requireNumber = false,
    requireSpecialChar = false,
    fieldName = 'Password'
  } = options;
  
  if (!password) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  if (password.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters long` };
  }
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    return { isValid: false, error: `${fieldName} must contain at least one uppercase letter` };
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    return { isValid: false, error: `${fieldName} must contain at least one lowercase letter` };
  }
  
  if (requireNumber && !/[0-9]/.test(password)) {
    return { isValid: false, error: `${fieldName} must contain at least one number` };
  }
  
  if (requireSpecialChar && !/[^A-Za-z0-9]/.test(password)) {
    return { isValid: false, error: `${fieldName} must contain at least one special character` };
  }
  
  return { isValid: true, value: password };
};

// Password strength calculator
export const calculatePasswordStrength = (password) => {
  if (!password) return { strength: 0, label: 'None', color: 'gray' };
  
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  if (strength <= 1) return { strength, label: 'Very Weak', color: 'red' };
  if (strength <= 2) return { strength, label: 'Weak', color: 'orange' };
  if (strength <= 3) return { strength, label: 'Fair', color: 'yellow' };
  if (strength <= 4) return { strength, label: 'Good', color: 'blue' };
  return { strength, label: 'Strong', color: 'green' };
};

// Name validation
export const validateName = (name, options = {}) => {
  const { minLength = 2, maxLength = 100, fieldName = 'Name' } = options;
  
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  if (trimmedName.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters long` };
  }
  
  if (trimmedName.length > maxLength) {
    return { isValid: false, error: `${fieldName} must not exceed ${maxLength} characters` };
  }
  
  // Reject if name is only numbers
  if (/^\d+$/.test(trimmedName)) {
    return { isValid: false, error: `${fieldName} cannot contain only numbers` };
  }
  
  // Reject if name contains no letters at all (only numbers/special chars)
  if (!/[a-zA-Z]/.test(trimmedName)) {
    return { isValid: false, error: `${fieldName} must contain at least one letter` };
  }
  
  // Optional: Reject if name has more numbers than letters (uncommon for real names)
  const letters = (trimmedName.match(/[a-zA-Z]/g) || []).length;
  const numbers = (trimmedName.match(/\d/g) || []).length;
  if (numbers > letters) {
    return { isValid: false, error: `${fieldName} should contain more letters than numbers` };
  }
  
  return { isValid: true, value: trimmedName };
};

// Required field validation
export const validateRequired = (value, fieldName = 'This field') => {
  if (value === undefined || value === null || value === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  if (typeof value === 'string' && !value.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  return { isValid: true, value };
};

// Text length validation
export const validateLength = (value, options = {}) => {
  const { 
    minLength, 
    maxLength, 
    fieldName = 'This field',
    required = true 
  } = options;
  
  // If not required and empty, it's valid
  if (!required && (!value || value.trim() === '')) {
    return { isValid: true, value: '' };
  }
  
  // If required, check if value exists
  if (required) {
    const requiredCheck = validateRequired(value, fieldName);
    if (!requiredCheck.isValid) {
      return requiredCheck;
    }
  }
  
  const trimmedValue = value.trim();
  
  if (minLength && trimmedValue.length < minLength) {
    return { 
      isValid: false, 
      error: `${fieldName} must be at least ${minLength} characters long` 
    };
  }
  
  if (maxLength && trimmedValue.length > maxLength) {
    return { 
      isValid: false, 
      error: `${fieldName} must not exceed ${maxLength} characters` 
    };
  }
  
  return { isValid: true, value: trimmedValue };
};

// URL validation
export const validateURL = (url, options = {}) => {
  const { required = false, fieldName = 'URL' } = options;
  
  if (!required && (!url || url.trim() === '')) {
    return { isValid: true, value: '' };
  }
  
  if (required && (!url || url.trim() === '')) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  try {
    new URL(url);
    return { isValid: true, value: url };
  } catch (error) {
    return { isValid: false, error: `Please enter a valid ${fieldName}` };
  }
};

// Select/dropdown validation
export const validateSelect = (value, fieldName = 'This field') => {
  if (!value || value === '' || value === '0') {
    return { isValid: false, error: `Please select a ${fieldName.toLowerCase()}` };
  }
  
  return { isValid: true, value };
};

// Password match validation
export const validatePasswordMatch = (password, confirmPassword) => {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }
  
  return { isValid: true };
};

// Validate form data against schema
export const validateForm = (formData, schema) => {
  const errors = {};
  let isValid = true;
  
  Object.keys(schema).forEach(fieldName => {
    const fieldSchema = schema[fieldName];
    const fieldValue = formData[fieldName];
    
    let result;
    
    switch (fieldSchema.type) {
      case 'email':
        result = validateEmail(fieldValue);
        break;
        
      case 'password':
        result = validatePassword(fieldValue, fieldSchema.options);
        break;
        
      case 'name':
        result = validateName(fieldValue, { 
          ...fieldSchema.options, 
          fieldName: fieldSchema.label || fieldName 
        });
        break;
        
      case 'text':
        result = validateLength(fieldValue, { 
          ...fieldSchema.options, 
          fieldName: fieldSchema.label || fieldName 
        });
        break;
        
      case 'url':
        result = validateURL(fieldValue, { 
          ...fieldSchema.options, 
          fieldName: fieldSchema.label || fieldName 
        });
        break;
        
      case 'select':
        result = validateSelect(fieldValue, fieldSchema.label || fieldName);
        break;
        
      case 'custom':
        result = fieldSchema.validator(fieldValue, formData);
        break;
        
      default:
        result = validateRequired(fieldValue, fieldSchema.label || fieldName);
    }
    
    if (!result.isValid) {
      errors[fieldName] = result.error;
      isValid = false;
    }
  });
  
  return { isValid, errors };
};

// Validate ticket title/subject - must contain meaningful text
export const validateTicketTitle = (title, options = {}) => {
  const { minLength = 5, maxLength = 200, fieldName = 'Title' } = options;
  
  if (!title || typeof title !== 'string') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  const trimmedTitle = title.trim();
  
  if (!trimmedTitle) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  // Check minimum length
  if (trimmedTitle.length < minLength) {
    return { 
      isValid: false, 
      error: `${fieldName} must be at least ${minLength} characters long` 
    };
  }
  
  // Check maximum length
  if (trimmedTitle.length > maxLength) {
    return { 
      isValid: false, 
      error: `${fieldName} must not exceed ${maxLength} characters` 
    };
  }
  
  // Must contain at least one letter (alphabetic character)
  if (!/[a-zA-Z]/.test(trimmedTitle)) {
    return { 
      isValid: false, 
      error: `${fieldName} must contain at least one letter` 
    };
  }
  
  // Should not be only special characters and numbers
  // Must have at least 2 letters
  const letterCount = (trimmedTitle.match(/[a-zA-Z]/g) || []).length;
  if (letterCount < 2) {
    return { 
      isValid: false, 
      error: `${fieldName} must contain meaningful text, not just numbers or symbols` 
    };
  }
  
  // Should not be only repeating characters (like "aaaaaaa")
  const uniqueChars = new Set(trimmedTitle.toLowerCase().replace(/\s/g, ''));
  if (uniqueChars.size < 3) {
    return { 
      isValid: false, 
      error: `${fieldName} must contain meaningful text` 
    };
  }
  
  return { isValid: true, value: trimmedTitle };
};

// Validate ticket description - similar to title but allows more flexibility
export const validateTicketDescription = (description, options = {}) => {
  const { minLength = 10, maxLength = 5000, fieldName = 'Description' } = options;
  
  if (!description || typeof description !== 'string') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  const trimmedDescription = description.trim();
  
  if (!trimmedDescription) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  // Check minimum length
  if (trimmedDescription.length < minLength) {
    return { 
      isValid: false, 
      error: `${fieldName} must be at least ${minLength} characters long` 
    };
  }
  
  // Check maximum length
  if (trimmedDescription.length > maxLength) {
    return { 
      isValid: false, 
      error: `${fieldName} must not exceed ${maxLength} characters` 
    };
  }
  
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(trimmedDescription)) {
    return { 
      isValid: false, 
      error: `${fieldName} must contain at least one letter` 
    };
  }
  
  // Must have at least 3 letters for meaningful content
  const letterCount = (trimmedDescription.match(/[a-zA-Z]/g) || []).length;
  if (letterCount < 3) {
    return { 
      isValid: false, 
      error: `${fieldName} must contain meaningful text, not just numbers or symbols` 
    };
  }
  
  return { isValid: true, value: trimmedDescription };
};

// Sanitize input
export const sanitizeInput = (value) => {
  if (typeof value !== 'string') return value;
  return value.trim();
};

// File validation
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
    fieldName = 'File'
  } = options;
  
  if (!file) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    return { 
      isValid: false, 
      error: `${fieldName} size must be less than ${maxSizeMB}MB` 
    };
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: `${fieldName} must be one of: ${allowedTypes.join(', ')}` 
    };
  }
  
  return { isValid: true, file };
};
