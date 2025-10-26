import React from 'react';
import { Mail, Calendar, Edit, Trash2, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserAvatar = ({ user, roleConfig }) => (
  <div className={`h-10 w-10 rounded-full ${roleConfig.avatarColor} flex items-center justify-center`}>
    <span className="text-white text-sm font-medium">
      {(user?.name || 'U').charAt(0).toUpperCase()}
    </span>
  </div>
);

const RoleBadge = ({ roleConfig }) => {
  const RoleIcon = roleConfig.icon;
  return (
    <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${roleConfig.color}`}>
      <RoleIcon className="h-3 w-3 mr-1" />
      {roleConfig.label}
    </span>
  );
};

const UserTableRow = ({ 
  user, 
  getRoleConfig, 
  formatDate, 
  onDeleteUser 
}) => {
  const roleConfig = getRoleConfig(user?.role);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <UserAvatar user={user} roleConfig={roleConfig} />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {user?.name || 'Unknown User'}
            </div>
            <div className="text-sm text-gray-500 flex items-center">
              <Mail className="h-4 w-4 mr-1" />
              {user?.email || 'No email'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <RoleBadge roleConfig={roleConfig} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1" />
          <span className="text-gray-900">
            {formatDate(user?.created_at)}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <Link
          to={`/users/${user.id}/edit`}
          className="text-blue-600 hover:text-blue-900 inline-flex items-center"
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Link>
        <button
          onClick={() => onDeleteUser(user.id)}
          className="text-red-600 hover:text-red-900 inline-flex items-center"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </button>
      </td>
    </tr>
  );
};

const EmptyState = ({ searchTerm, selectedRole }) => (
  <div className="text-center py-12">
    <UserIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
    <h3 className="text-sm font-medium text-gray-900 mb-1">
      {searchTerm || selectedRole !== 'all' ? 'No matching users' : 'No users yet'}
    </h3>
    <p className="text-sm text-gray-500">
      {searchTerm || selectedRole !== 'all'
        ? 'Try adjusting your search or filter criteria.'
        : 'Get started by creating your first user.'}
    </p>
  </div>
);

const UsersTable = ({ 
  filteredUsers, 
  getRoleConfig, 
  formatDate, 
  onDeleteUser, 
  searchTerm, 
  selectedRole 
}) => {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <UserTableRow
                key={user.id}
                user={user}
                getRoleConfig={getRoleConfig}
                formatDate={formatDate}
                onDeleteUser={onDeleteUser}
              />
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <EmptyState searchTerm={searchTerm} selectedRole={selectedRole} />
      )}
    </div>
  );
};

export default UsersTable;