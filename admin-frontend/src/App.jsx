import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CallProvider } from './context/CallContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/Login';
import CallModal from './components/call/CallModal';
import IncomingCallModal from './components/call/IncomingCallModal';

// Lazy load heavy components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Users = lazy(() => import('./pages/Users'));
const UserForm = lazy(() => import('./pages/UserForm'));
const TransferRequests = lazy(() => import('./pages/TransferRequests'));
const ReopenRequests = lazy(() => import('./pages/ReopenRequests'));
const Tickets = lazy(() => import('./pages/Tickets'));
const TicketDetail = lazy(() => import('./pages/TicketDetail'));
const Categories = lazy(() => import('./pages/Categories'));

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

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CallProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route 
                    path="dashboard" 
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Dashboard />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="users" 
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Users />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="users/new" 
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <UserForm />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="users/:id/edit" 
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <UserForm />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="transfers" 
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <TransferRequests />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="reopen-requests" 
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <ReopenRequests />
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
                    path="tickets/:id" 
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <TicketDetail />
                      </Suspense>
                    } 
                  />
                  <Route 
                    path="categories" 
                    element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <Categories />
                      </Suspense>
                    } 
                  />
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
              <Toaster position="top-right" />
              <CallModal />
              <IncomingCallModal />
            </div>
          </Router>
        </CallProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;