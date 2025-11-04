import { useState, useCallback } from 'react';
import { validateForm, sanitizeInput } from '../utils/validation';

/**
 * Custom hook for form management with validation
 * Follows Open/Closed Principle - extensible without modification
 */
export const useFormValidation = (initialValues, validationSchema) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setValues(prev => ({
      ...prev,
      [name]: type === 'text' || type === 'email' || type === 'password' ? sanitizeInput(fieldValue) : fieldValue
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  }, [errors]);

  // Handle blur - mark field as touched
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate single field on blur
    if (validationSchema && validationSchema[name]) {
      const fieldSchema = { [name]: validationSchema[name] };
      const { errors: fieldErrors } = validateForm(values, fieldSchema);
      
      if (fieldErrors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: fieldErrors[name]
        }));
      }
    }
  }, [values, validationSchema]);

  // Validate all fields
  const validate = useCallback(() => {
    if (!validationSchema) return { isValid: true, errors: {} };
    
    const result = validateForm(values, validationSchema);
    setErrors(result.errors);
    return result;
  }, [values, validationSchema]);

  // Handle form submission
  const handleSubmit = useCallback((onSubmit) => {
    return async (e) => {
      e.preventDefault();
      setIsSubmitting(true);

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      setTouched(allTouched);

      // Validate
      const { isValid, errors: validationErrors } = validate();

      if (!isValid) {
        setIsSubmitting(false);
        return;
      }

      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [values, validate]);

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Set specific field value
  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Set specific field error
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);

  // Set multiple values at once
  const setFieldValues = useCallback((newValues) => {
    setValues(prev => ({
      ...prev,
      ...newValues
    }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    validate,
    resetForm,
    setFieldValue,
    setFieldError,
    setFieldValues,
    setIsSubmitting
  };
};
