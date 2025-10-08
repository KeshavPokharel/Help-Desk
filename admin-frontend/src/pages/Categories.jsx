import React, { useState, useEffect } from 'react';
import { categoryService, userService } from '../services';
import { toast } from 'react-hot-toast';
import { Plus, UserPlus, Trash2, Edit, X } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [editCategory, setEditCategory] = useState({ name: '', description: '' });
  const [selectedAgents, setSelectedAgents] = useState({}); // Object to store selected agent for each category

  useEffect(() => {
    fetchCategories();
    fetchAgents();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      console.log('Categories data:', data); // Debug log
      setCategories(data);
    } catch (error) {
      toast.error('Failed to fetch categories');
      console.error('Error fetching categories:', error);
    }
  };

  const fetchAgents = async () => {
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
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      await categoryService.createCategory(newCategory);
      toast.success('Category created successfully');
      setNewCategory({ name: '', description: '' });
      setShowCreateModal(false);
      fetchCategories();
    } catch (error) {
      toast.error('Failed to create category');
      console.error('Error creating category:', error);
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    if (!editCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      await categoryService.updateCategory(selectedCategory.id, editCategory);
      toast.success('Category updated successfully');
      setEditCategory({ name: '', description: '' });
      setShowEditModal(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error) {
      toast.error('Failed to update category');
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
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
  };

  const handleAssignAgent = async (categoryId) => {
    const selectedAgent = selectedAgents[categoryId];
    if (!selectedAgent) {
      toast.error('Please select an agent');
      return;
    }

    try {
      await categoryService.assignAgentToCategory(categoryId, selectedAgent);
      toast.success('Agent assigned successfully');
      // Clear the selected agent for this specific category
      setSelectedAgents(prev => ({ ...prev, [categoryId]: '' }));
      fetchCategories();
    } catch (error) {
      toast.error('Failed to assign agent');
      console.error('Error assigning agent:', error);
    }
  };

  const handleUnassignAgent = async (categoryId, agentId) => {
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
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setEditCategory({ name: category.name, description: category.description || '' });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Category Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage category-agent assignments for automatic ticket routing
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {categories.map((category) => (
          <div key={category.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{category?.name || 'Unknown Category'}</h3>
                {category?.description && (
                  <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {category?.subcategories_count || 0} subcategories
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(category)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(category?.id)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-gray-700">Assigned Agents</h4>
              </div>
              
              {category?.assigned_agents && category.assigned_agents.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {category.assigned_agents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2">
                      <div className="flex items-center">
                        <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {agent.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="ml-2 text-sm text-gray-900">{agent.name}</span>
                        <span className="ml-2 text-xs text-gray-500">({agent.email})</span>
                      </div>
                      <button
                        onClick={() => handleUnassignAgent(category.id, agent.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                        title="Unassign agent"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4">
                  No agents assigned {/* Debug: {JSON.stringify(category?.assigned_agents)} */}
                </p>
              )}

              <div className="flex space-x-2">
                <select
                  value={selectedAgents[category.id] || ''}
                  onChange={(e) => setSelectedAgents(prev => ({ ...prev, [category.id]: e.target.value }))}
                  className="flex-1 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select an agent...</option>
                  {agents
                    .filter(agent => !category.assigned_agents?.some(assigned => assigned.id === agent.id))
                    .map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({agent.email})
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => handleAssignAgent(category.id)}
                  disabled={!selectedAgents[category.id]}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Assign
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <p className="text-lg font-medium">No categories found</p>
            <p className="text-sm">Create your first category to get started</p>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Category</h3>
            <form onSubmit={handleCreateCategory}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter category name"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter category description"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewCategory({ name: '', description: '' });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Category</h3>
            <form onSubmit={handleEditCategory}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={editCategory.name}
                  onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter category name"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editCategory.description}
                  onChange={(e) => setEditCategory({ ...editCategory, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter category description"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditCategory({ name: '', description: '' });
                    setSelectedCategory(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Update Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;