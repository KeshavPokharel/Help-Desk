import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Import custom hooks
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useChartData } from '../hooks/useChartData';

// Import components
import StatsCard from '../components/ui/StatsCard';
import ChartSection from '../components/dashboard/ChartSection';
import RoleSpecificContent from '../components/dashboard/RoleSpecificContent';

const Dashboard = () => {
  const { user } = useAuth();
  
  // Use custom hooks for data fetching
  const { stats, loading, fetchDashboardStats } = useDashboardStats(user);
  const { chartData, chartsLoading, fetchChartData } = useChartData(user);

  // Initial load effect
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'agent') {
      fetchDashboardStats();
      fetchChartData();
    }
  }, [user, fetchDashboardStats, fetchChartData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Welcome back, {user?.name || 'User'}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} stat={stat} />
        ))}
      </div>

      {/* Role-specific content */}
      {/* <RoleSpecificContent user={user} stats={stats} /> */}

      {/* Charts Section - Only for Admins */}
      {user?.role === 'admin' && (
        <ChartSection chartData={chartData} chartsLoading={chartsLoading} />
      )}
    </div>
  );
};

export default Dashboard;