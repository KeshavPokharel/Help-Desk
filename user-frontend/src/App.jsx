import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy load heavy components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tickets = lazy(() => import('./pages/Tickets'));
const CreateTicket = lazy(() => import('./pages/CreateTicket'));
const TicketDetail = lazy(() => import('./pages/TicketDetail'));
const Messages = lazy(() => import('./pages/Messages'));
const Profile = lazy(() => import('./pages/Profile'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Component to handle root route logic
const RootRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // If not authenticated, show landing page
  return <Landing />;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Root route - Landing for non-authenticated, redirect to dashboard for authenticated */}
              <Route path="/" element={<RootRoute />} />
              
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route 
                  index 
                  element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <Dashboard />
                    </Suspense>
                  } 
                />
                <Route 
                  path="tickets" 
                  element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <Tickets />
                    </Suspense>
                  } 
                />
                <Route 
                  path="tickets/create" 
                  element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <CreateTicket />
                    </Suspense>
                  } 
                />
                <Route 
                  path="tickets/:id" 
                  element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <TicketDetail />
                    </Suspense>
                  } 
                />
                <Route 
                  path="messages" 
                  element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <Messages />
                    </Suspense>
                  } 
                />
                <Route 
                  path="profile" 
                  element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <Profile />
                    </Suspense>
                  } 
                />
                <Route 
                  path="change-password" 
                  element={
                    <Suspense fallback={<LoadingSpinner />}>
                      <ChangePassword />
                    </Suspense>
                  } 
                />
              </Route>
              
              {/* Catch all - redirect to root */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
