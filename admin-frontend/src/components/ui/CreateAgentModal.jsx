import React, { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { FormField, TextInput, PasswordInput, SubmitButton, CancelButton } from './FormComponents';
import { useFormValidation } from '../../hooks/useFormValidation';
import { calculatePasswordStrength } from '../../utils/validation';

const CreateAgentModal = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ strength: 0, label: 'None', color: 'gray' });

  // Validation schema
  const validationSchema = {
    name: {
      type: 'name',
      label: 'Full name',
      options: {
        minLength: 2,
        maxLength: 100
      }
    },
    email: {
      type: 'email',
      label: 'Email'
    },
    password: {
      type: 'password',
      label: 'Password',
      options: {
        minLength: 8
      }
    }
  };

  // Form validation hook
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setIsSubmitting
  } = useFormValidation(
    { name: '', email: '', password: '' },
    validationSchema
  );

  // Update password strength when password changes
  useEffect(() => {
    if (values.password) {
      setPasswordStrength(calculatePasswordStrength(values.password));
    } else {
      setPasswordStrength({ strength: 0, label: 'None', color: 'gray' });
    }
  }, [values.password]);

  // Handle form submission
  const onFormSubmit = handleSubmit(async (formValues) => {
    try {
      await onSubmit(formValues);
      resetForm();
      setShowPassword(false);
      onClose();
    } catch (error) {
      setIsSubmitting(false);
      // Error is handled by parent component
    }
  });

  // Handle close
  const handleClose = () => {
    resetForm();
    setShowPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Create New Agent</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={onFormSubmit} className="space-y-4">
          <FormField
            label="Full Name"
            error={errors.name}
            touched={touched.name}
            required
          >
            <TextInput
              name="name"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter agent's full name"
              disabled={isSubmitting}
            />
          </FormField>
          
          <FormField
            label="Email Address"
            error={errors.email}
            touched={touched.email}
            required
          >
            <TextInput
              type="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter agent's email"
              disabled={isSubmitting}
            />
          </FormField>
          
          <FormField
            label="Password"
            error={errors.password}
            touched={touched.password}
            required
            hint="Must be at least 8 characters long"
          >
            <PasswordInput
              name="password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter agent's password"
              disabled={isSubmitting}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />
            
            {/* Password Requirements */}
            {values.password && (
              <div className="mt-2 text-xs">
                <div className={`flex items-center ${values.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  At least 8 characters long
                </div>
                
                {/* Password Strength Indicator */}
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-600">Strength:</span>
                    <span className={`font-medium ${
                      passwordStrength.color === 'red' ? 'text-red-600' :
                      passwordStrength.color === 'orange' ? 'text-orange-600' :
                      passwordStrength.color === 'yellow' ? 'text-yellow-600' :
                      passwordStrength.color === 'blue' ? 'text-blue-600' :
                      'text-green-600'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        passwordStrength.color === 'red' ? 'bg-red-500' :
                        passwordStrength.color === 'orange' ? 'bg-orange-500' :
                        passwordStrength.color === 'yellow' ? 'bg-yellow-500' :
                        passwordStrength.color === 'blue' ? 'bg-blue-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </FormField>
          
          <div className="flex justify-end space-x-3 pt-4">
            <CancelButton onClick={handleClose}>
              Cancel
            </CancelButton>
            <SubmitButton isLoading={isSubmitting} className="bg-green-600 hover:bg-green-700">
              Create Agent
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAgentModal;