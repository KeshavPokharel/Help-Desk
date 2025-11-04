import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Send, AlertCircle } from 'lucide-react';
import { ticketService, categoryService } from '../services';
import { validateTicketTitle, validateTicketDescription } from '../utils/validation';
import toast from 'react-hot-toast';

const CreateTicket = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

  const watchedCategory = watch('category_id');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (watchedCategory) {
      fetchSubcategories(watchedCategory);
      setValue('subcategory_id', ''); // Reset subcategory when category changes
    } else {
      setSubcategories([]);
    }
  }, [watchedCategory, setValue]);

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Don't show error toast for categories as it's not critical
    }
  };

  const fetchSubcategories = async (categoryId) => {
    try {
      const data = await categoryService.getSubcategoriesByCategory(categoryId);
      setSubcategories(data);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubcategories([]);
    }
  };

  const onSubmit = async (data) => {
    try {
      await ticketService.createTicket({
        title: data.subject,
        initial_description: data.description,
        category_id: parseInt(data.category_id),
        subcategory_id: data.subcategory_id ? parseInt(data.subcategory_id) : null,
      });
      toast.success('Ticket created successfully!');
      navigate('/tickets');
    } catch (error) {
      console.error('Create ticket error:', error);
      let errorMessage = 'Failed to create ticket';
      
      if (error.response?.data?.detail) {
        // Handle array of validation errors
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map(err => {
            if (typeof err === 'object' && err.msg) {
              return err.msg;
            }
            return String(err);
          }).join(', ');
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (typeof error.response.data.detail === 'object') {
          errorMessage = JSON.stringify(error.response.data.detail);
        }
      }
      
      toast.error(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/tickets')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Create New Ticket
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Submit a new support request for assistance
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                {...register('subject', { 
                  required: 'Subject is required',
                  minLength: {
                    value: 5,
                    message: 'Subject must be at least 5 characters long'
                  },
                  maxLength: {
                    value: 200,
                    message: 'Subject must not exceed 200 characters'
                  },
                  validate: (value) => {
                    const result = validateTicketTitle(value, {
                      minLength: 5,
                      maxLength: 200,
                      fieldName: 'Subject'
                    });
                    return result.isValid || result.error;
                  }
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Brief description of your issue"
              />
              {errors.subject && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>{errors.subject.message}</span>
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Enter a clear, descriptive subject with meaningful text
              </p>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category_id"
                {...register('category_id', { required: 'Category is required' })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Help us route your ticket to the right team
              </p>
            </div>

            {/* Subcategory */}
            {subcategories.length > 0 && (
              <div>
                <label htmlFor="subcategory_id" className="block text-sm font-medium text-gray-700">
                  Subcategory
                </label>
                <select
                  id="subcategory_id"
                  {...register('subcategory_id')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a subcategory (optional)</option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a more specific category if available
                </p>
              </div>
            )}

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                rows={6}
                {...register('description', { 
                  required: 'Description is required',
                  minLength: {
                    value: 10,
                    message: 'Description must be at least 10 characters long'
                  },
                  maxLength: {
                    value: 5000,
                    message: 'Description must not exceed 5000 characters'
                  },
                  validate: (value) => {
                    const result = validateTicketDescription(value, {
                      minLength: 10,
                      maxLength: 5000,
                      fieldName: 'Description'
                    });
                    return result.isValid || result.error;
                  }
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Please provide detailed information about your issue, including:
- What you were trying to do
- What happened instead
- Any error messages you received
- Steps to reproduce the issue (if applicable)"
              />
              {errors.description && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>{errors.description.message}</span>
                </div>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Provide detailed information with meaningful text to help us assist you better
              </p>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Tips for better support:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Be specific about the problem you're experiencing</li>
              <li>• Include screenshots if they would be helpful</li>
              <li>• Mention what browser or device you're using</li>
              <li>• Tell us if this worked before or is a new issue</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/tickets')}
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
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicket;