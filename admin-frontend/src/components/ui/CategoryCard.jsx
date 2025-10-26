import React from 'react';
import { Edit, Trash2, UserPlus } from 'lucide-react';

const CategoryCard = ({ 
  category, 
  agents, 
  selectedAgents, 
  onEditCategory, 
  onDeleteCategory, 
  onAssignAgent, 
  onUnassignAgent, 
  onAgentSelect 
}) => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {category?.name || 'Unknown Category'}
          </h3>
          {category?.description && (
            <p className="text-sm text-gray-500 mt-1">{category.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            {category?.subcategories_count || 0} subcategories
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEditCategory(category)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Edit category"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDeleteCategory(category?.id)}
            className="text-red-400 hover:text-red-600 transition-colors"
            title="Delete category"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Assigned Agents Section */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium text-gray-700">Assigned Agents</h4>
        </div>
        
        {/* Assigned Agents List */}
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
                  onClick={() => onUnassignAgent(category.id, agent.id)}
                  className="text-red-400 hover:text-red-600 p-1 transition-colors"
                  title="Unassign agent"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-4">No agents assigned</p>
        )}

        {/* Agent Assignment */}
        <div className="flex space-x-2">
          <select
            value={selectedAgents[category.id] || ''}
            onChange={(e) => onAgentSelect(category.id, e.target.value)}
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
            onClick={() => onAssignAgent(category.id)}
            disabled={!selectedAgents[category.id]}
            className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <UserPlus className="h-3 w-3 mr-1" />
            Assign
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryCard;