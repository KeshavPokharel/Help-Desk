import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { categoryService, userService } from '../services';
import { toast } from 'react-hot-toast';

// Components
import {
  LoadingSpinner,
  CategoryCard,
  CategoryModal,
  CategoryEmptyState
} from '../components/ui';

// Constants
const INITIAL_CATEGORY = { name: '', description: '' };

const Categories = () => {
  // State
  const [categories, setCategories] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newCategory, setNewCategory] = useState(INITIAL_CATEGORY);
  const [editCategory, setEditCategory] = useState(INITIAL_CATEGORY);
  const [selectedAgents, setSelectedAgents] = useState({});

  // Initialize data
  useEffect(() => {
    fetchCategories();
    fetchAgents();
  }, []);

  // API calls
  const fetchCategories = useCallback(async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      toast.error('Failed to fetch categories');
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const data = await userService.getUsers();
      const agentUsers = data.filter(user => user.role === 'agent');
      setAgents(agentUsers);
    } catch (error) {
      toast.error('Failed to fetch agents');
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Category handlers
  const handleCreateCategory = useCallback(async (formValues) => {
    try {
      await categoryService.createCategory(formValues);
      toast.success('Category created successfully');
      setShowCreateModal(false);
      fetchCategories();
    } catch (error) {
      toast.error('Failed to create category');
      console.error('Error creating category:', error);
      throw error; // Re-throw to let modal handle it
    }
  }, [fetchCategories]);

  const handleEditCategory = useCallback(async (formValues) => {
    try {
      await categoryService.updateCategory(selectedCategory.id, formValues);
      toast.success('Category updated successfully');
      handleCloseEditModal();
      fetchCategories();
    } catch (error) {
      toast.error('Failed to update category');
      console.error('Error updating category:', error);
      throw error; // Re-throw to let modal handle it
    }
  }, [selectedCategory, fetchCategories]);

  const handleDeleteCategory = useCallback(async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      await categoryService.deleteCategory(categoryId);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete category');
      console.error('Error deleting category:', error);
    }
  }, [fetchCategories]);

  // Agent assignment handlers
  const handleAssignAgent = useCallback(async (categoryId) => {
    const selectedAgent = selectedAgents[categoryId];
    if (!selectedAgent) {
      toast.error('Please select an agent');
      return;
    }

    try {
      await categoryService.assignAgentToCategory(categoryId, selectedAgent);
      toast.success('Agent assigned successfully');
      setSelectedAgents(prev => ({ ...prev, [categoryId]: '' }));
      fetchCategories();
    } catch (error) {
      toast.error('Failed to assign agent');
      console.error('Error assigning agent:', error);
    }
  }, [selectedAgents, fetchCategories]);

  const handleUnassignAgent = useCallback(async (categoryId, agentId) => {
    if (!window.confirm('Are you sure you want to unassign this agent from the category?')) {
      return;
    }

    try {
      await categoryService.unassignAgentFromCategory(categoryId, agentId);
      toast.success('Agent unassigned successfully');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to unassign agent');
      console.error('Error unassigning agent:', error);
    }
  }, [fetchCategories]);

  // Modal handlers
  const handleOpenEditModal = useCallback((category) => {
    setSelectedCategory(category);
    setEditCategory({ name: category.name, description: category.description || '' });
    setShowEditModal(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setNewCategory(INITIAL_CATEGORY);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setEditCategory(INITIAL_CATEGORY);
    setSelectedCategory(null);
  }, []);

  const handleAgentSelect = useCallback((categoryId, agentId) => {
    setSelectedAgents(prev => ({ ...prev, [categoryId]: agentId }));
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading categories..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Category Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage category-agent assignments for automatic ticket routing
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </button>
      </div>

      {/* Categories Grid or Empty State */}
      {categories.length === 0 ? (
        <CategoryEmptyState onCreateCategory={() => setShowCreateModal(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              agents={agents}
              selectedAgents={selectedAgents}
              onEditCategory={handleOpenEditModal}
              onDeleteCategory={handleDeleteCategory}
              onAssignAgent={handleAssignAgent}
              onUnassignAgent={handleUnassignAgent}
              onAgentSelect={handleAgentSelect}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CategoryModal
        isOpen={showCreateModal}
        mode="create"
        title="Create New Category"
        category={newCategory}
        onSubmit={handleCreateCategory}
        onClose={handleCloseCreateModal}
      />

      <CategoryModal
        isOpen={showEditModal}
        mode="edit"
        title="Edit Category"
        category={editCategory}
        onSubmit={handleEditCategory}
        onClose={handleCloseEditModal}
      />
    </div>
  );
};

export default Categories;