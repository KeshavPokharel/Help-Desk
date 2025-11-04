import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save } from 'lucide-react';
import { userService } from '../services';
import toast from 'react-hot-toast';
import { 
  validateEmail, 
  validatePassword, 
  validateName,
  calculatePasswordStrength 
} from '../utils/validation';

const UserForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch('password', '');

  useEffect(() => {
    if (isEdit) {
      fetchUser();
    }
  }, [id, isEdit]);

  useEffect(() => {
    if (!isEdit && password) {
      setPasswordStrength(calculatePasswordStrength(password));
    }
  }, [password, isEdit]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const user = await userService.getUser(id);
      console.log('Fetched user data:', user); // Debug log
      reset({
        name: user.name,
        email: user.email,
        role: user.role,
        profile_photo_url: user.profile_photo_url || ''
      });
    } catch (error) {
      console.error('Error fetching user:', error); // Debug log
      const errorMessage = error.response?.data?.detail || 'Failed to fetch user details';
      toast.error(errorMessage);
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      console.log('Submitting user data:', data, 'isEdit:', isEdit); // Debug log
      
      if (isEdit) {
        // Don't send password field when editing
        const { password, ...updateData } = data;
        await userService.updateUser(id, updateData);
        toast.success('User updated successfully');
      } else {
        await userService.createUser(data);
        toast.success('User created successfully');
      }
      navigate('/users');
    } catch (error) {
      console.error('Error saving user:', error); // Debug log
      
      // Handle different error response formats
      let errorMessage = 'Failed to save user';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle Pydantic validation errors (422)
        if (errorData.detail && Array.isArray(errorData.detail)) {
          // Extract validation error messages
          errorMessage = errorData.detail.map(err => {
            const field = err.loc ? err.loc.join('.') : 'field';
            return `${field}: ${err.msg}`;
          }).join(', ');
        } 
        // Handle string detail message
        else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        }
        // Handle generic error message
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }
      
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/users')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {isEdit ? 'Edit User' : 'Create User'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEdit ? 'Update user information' : 'Add a new user to the system'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                {...register('name', { 
                  required: 'Name is required',
                  validate: (value) => {
                    const result = validateName(value);
                    return result.isValid || result.error;
                  }
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                {...register('email', {
                  required: 'Email is required',
                  validate: (value) => {
                    const result = validateEmail(value);
                    return result.isValid || result.error;
                  }
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            {!isEdit && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  {...register('password', {
                    required: 'Password is required',
                    validate: (value) => {
                      const result = validatePassword(value);
                      return result.isValid || result.error;
                    }
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
                {passwordStrength && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded ${
                            i < passwordStrength.score
                              ? passwordStrength.score <= 1
                                ? 'bg-red-500'
                                : passwordStrength.score === 2
                                ? 'bg-yellow-500'
                                : passwordStrength.score === 3
                                ? 'bg-blue-500'
                                : 'bg-green-500'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs mt-1 ${
                      passwordStrength.score <= 1
                        ? 'text-red-600'
                        : passwordStrength.score === 2
                        ? 'text-yellow-600'
                        : passwordStrength.score === 3
                        ? 'text-blue-600'
                        : 'text-green-600'
                    }`}>
                      {passwordStrength.message}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                {...register('role', { required: 'Role is required' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select a role</option>
                <option value="user">User</option>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            {/* Profile Photo URL */}
            <div className="sm:col-span-2">
              <label htmlFor="profile_photo_url" className="block text-sm font-medium text-gray-700">
                Profile Photo URL (Optional)
              </label>
              <input
                type="url"
                id="profile_photo_url"
                {...register('profile_photo_url')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              {errors.profile_photo_url && (
                <p className="mt-1 text-sm text-red-600">{errors.profile_photo_url.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEdit ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;