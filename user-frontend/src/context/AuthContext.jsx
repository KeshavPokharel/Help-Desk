import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { authService } from '../services';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          try {
            // Fetch user profile from server to get current user info
            const user = await authService.getProfile();
            
            // Allow only regular users (not admin or agent)
            if (user.role === 'user') {
              dispatch({
                type: 'LOGIN_SUCCESS',
                payload: { user, token },
              });
            } else {
              // Admin and agent users should use admin panel
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              dispatch({ type: 'LOGOUT' });
            }
          } catch (error) {
            // Token is invalid or expired
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          // No token found, user is not authenticated
          dispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        // Any unexpected error during initialization
        console.error('Auth initialization error:', error);
        dispatch({ type: 'LOGOUT' });
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authService.login(email, password);
      const token = response.access_token;
      
      // Store token temporarily
      localStorage.setItem('token', token);
      
      // Get user profile with full information
      const user = await authService.getProfile();
      
      // Check if user is a regular user (not admin or agent)
      if (user.role === 'admin' || user.role === 'agent') {
        localStorage.removeItem('token');
        throw new Error('Please use the admin portal for admin or agent access.');
      }

      if (user.role !== 'user') {
        localStorage.removeItem('token');
        throw new Error('Invalid user role.');
      }
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token },
      });
      
      return { success: true };
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const errorMessage = error.response?.data?.detail || error.message || 'Login failed';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = { ...currentUser, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const isUser = () => state.user?.role === 'user';

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    ...state,
    login,
    logout,
    clearError,
    updateUser,
    isUser,
  }), [state, login, logout, clearError, updateUser, isUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};