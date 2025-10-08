import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Ticket,
  FolderTree,
  LogOut,
  Menu,
  X,
  Bell,
  Settings,
  RefreshCw,
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      roles: ['admin', 'agent'], // Both admin and agent can access
    },
    {
      name: 'Users',
      icon: Users,
      path: '/users',
      roles: ['admin'], // Only admin can manage users
    },
    {
      name: 'Transfer Requests',
      icon: Bell,
      path: '/transfers',
      roles: ['admin', 'agent'], // Admin can approve, agent can view their requests
    },
    {
      name: 'Reopen Requests',
      icon: RefreshCw,
      path: '/reopen-requests',
      roles: ['admin'], // Only admin can approve reopen requests
    },
    {
      name: 'Tickets',
      icon: Ticket,
      path: '/tickets',
      roles: ['admin', 'agent'], // Both can access tickets
    },
    {
      name: 'Category Management',
      icon: FolderTree,
      path: '/categories',
      roles: ['admin'], // Only admin can manage categories
    },
  ];

  // Filter menu items based on user role
  const allowedMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden z-20"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-center h-16 px-4 bg-gray-800">
          <h1 className="text-xl font-bold text-white">
            {user?.role === 'admin' ? 'Admin Panel' : 'Agent Panel'}
          </h1>
        </div>

        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {allowedMenuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </div>

          <div className="absolute bottom-0 w-full p-4">
            <div className="border-t border-gray-700 pt-4">
              <div className="flex items-center mb-3">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.email?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{user?.role.toUpperCase()}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors duration-200"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;