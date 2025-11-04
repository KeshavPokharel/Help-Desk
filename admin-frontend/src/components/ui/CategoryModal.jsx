import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { FormField, TextInput, TextArea, SubmitButton, CancelButton } from './FormComponents';
import { useFormValidation } from '../../hooks/useFormValidation';

const CategoryModal = ({
  isOpen,
  mode, // 'create' or 'edit'
  title,
  category,
  onSubmit,
  onClose
}) => {
  // Validation schema
  const validationSchema = {
    name: {
      type: 'text',
      label: 'Category name',
      options: {
        required: true,
        minLength: 2,
        maxLength: 100
      }
    },
    description: {
      type: 'text',
      label: 'Description',
      options: {
        required: false,
        maxLength: 500
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
    setFieldValues,
    setIsSubmitting
  } = useFormValidation(
    { name: '', description: '' },
    validationSchema
  );

  // Update form values when category prop changes
  useEffect(() => {
    if (isOpen && category) {
      setFieldValues({
        name: category.name || '',
        description: category.description || ''
      });
    }
  }, [isOpen, category, setFieldValues]);

  // Handle form submission
  const onFormSubmit = handleSubmit(async (formValues) => {
    try {
      await onSubmit(formValues);
      resetForm();
      onClose();
    } catch (error) {
      setIsSubmitting(false);
      // Error is handled by parent component
    }
  });

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={onFormSubmit} className="space-y-4">
          <FormField
            label="Category Name"
            error={errors.name}
            touched={touched.name}
            required
          >
            <TextInput
              name="name"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter category name"
              disabled={isSubmitting}
            />
          </FormField>
          
          <FormField
            label="Description"
            error={errors.description}
            touched={touched.description}
            hint="Optional description for the category"
          >
            <TextArea
              name="description"
              value={values.description}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={3}
              placeholder="Enter category description"
              disabled={isSubmitting}
            />
          </FormField>
          
          <div className="flex justify-end space-x-3 pt-4">
            <CancelButton onClick={handleClose}>
              Cancel
            </CancelButton>
            <SubmitButton isLoading={isSubmitting}>
              {mode === 'create' ? 'Create Category' : 'Update Category'}
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;