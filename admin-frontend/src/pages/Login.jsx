import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, Shield, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { FormField, TextInput, PasswordInput, SubmitButton } from '../components/ui/FormComponents';
import { useFormValidation } from '../hooks/useFormValidation';

const Login = () => {
  const [selectedRole, setSelectedRole] = useState('admin'); // Default to admin
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Validation schema
  const validationSchema = {
    email: {
      type: 'email',
      label: 'Email'
    },
    password: {
      type: 'password',
      label: 'Password',
      options: {
        minLength: 6
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
    setIsSubmitting
  } = useFormValidation(
    { email: '', password: '' },
    validationSchema
  );

  const onSubmit = handleSubmit(async (formValues) => {
    clearError();

    const result = await login(formValues.email, formValues.password, selectedRole);
    
    if (result.success) {
      toast.success(`${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} login successful!`);
      navigate(from, { replace: true });
    } else {
      toast.error(result.error);
      setIsSubmitting(false);
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {selectedRole === 'admin' ? 'Admin Portal' : 'Agent Portal'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access the help desk {selectedRole} panel
          </p>
        </div>

        {/* Role Selection */}
        <div className="flex space-x-4 justify-center">
          <button
            type="button"
            onClick={() => setSelectedRole('admin')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedRole === 'admin'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Shield className="h-4 w-4 mr-2" />
            Admin
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('agent')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedRole === 'agent'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Agent
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          <div className="space-y-4">
            <FormField
              label="Email address"
              error={errors.email}
              touched={touched.email}
              required
            >
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <TextInput
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Email address"
                  disabled={isSubmitting}
                  className="pl-10"
                />
              </div>
            </FormField>

            <FormField
              label="Password"
              error={errors.password}
              touched={touched.password}
              required
            >
              <PasswordInput
                name="password"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Password"
                disabled={isSubmitting}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
                icon={Lock}
              />
            </FormField>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <SubmitButton 
              isLoading={isLoading || isSubmitting}
            >
              Sign in
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;