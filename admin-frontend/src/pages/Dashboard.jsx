import React, { useState, useEffect, useCallback } from 'react';
import { Users, Ticket, Clock, CheckCircle, TrendingUp, BarChart3 } from 'lucide-react';
import { dashboardService } from '../services';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Import our chart components
import PieChart from '../components/charts/PieChart';
import BarChart from '../components/charts/BarChart';
import LineChart from '../components/charts/LineChart';
import DoughnutChart from '../components/charts/DoughnutChart';

const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const [chartData, setChartData] = useState({
    statusData: null,
    categoryData: null,
    trendData: null,
    agentData: null,
    priorityData: null
  });
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const { user } = useAuth();

  // Memoize the fetchDashboardStats function to prevent unnecessary re-renders
  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      // Call appropriate endpoint based on user role
      const data = user?.role === 'admin' 
        ? await dashboardService.getStats()
        : await dashboardService.getAgentStats();
      
      // Transform the API data into the expected format for admin
      const transformedStats = [
        {
          name: 'Total Users',
          value: data.total_users.toString(),
          change: '+12%',
          changeType: 'increase',
          icon: Users,
          color: 'bg-blue-500',
        },
        {
          name: 'Total Tickets',
          value: data.total_tickets.toString(),
          change: '+8%',
          changeType: 'increase',
          icon: Ticket,
          color: 'bg-green-500',
        },
        {
          name: 'Pending Tickets',
          value: data.pending_tickets.toString(),
          change: '-3%',
          changeType: 'decrease',
          icon: Clock,
          color: 'bg-yellow-500',
        },
        {
          name: 'Resolved Tickets',
          value: data.resolved_tickets.toString(),
          change: '+15%',
          changeType: 'increase',
          icon: CheckCircle,
          color: 'bg-purple-500',
        },
      ];
      
      setStats(transformedStats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch chart data
  const fetchChartData = useCallback(async () => {
    if (user?.role !== 'admin') return; // Only admins see charts
    
    try {
      setChartsLoading(true);
      
      // Use the existing enhanced stats endpoint that already provides all chart data
      const enhancedStats = await dashboardService.getEnhancedStats(30);

      // Transform status data for pie chart
      const statusChartData = enhancedStats.tickets_by_status?.length > 0 ? {
        labels: enhancedStats.tickets_by_status.map(item => item.status),
        datasets: [{
          data: enhancedStats.tickets_by_status.map(item => item.count),
          backgroundColor: enhancedStats.tickets_by_status.map(item => item.color || '#6b7280'),
        }]
      } : null;

      // Transform category data for doughnut chart
      const categoryChartData = enhancedStats.tickets_by_category?.length > 0 ? {
        labels: enhancedStats.tickets_by_category.map(item => item.category_name),
        datasets: [{
          data: enhancedStats.tickets_by_category.map(item => item.count),
          backgroundColor: [
            '#FF6384',
            '#36A2EB', 
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
            '#FF6384',
            '#C9CBCF'
          ],
        }]
      } : null;

      // Transform trend data for line chart (tickets created over time)
      const trendChartData = enhancedStats.ticket_trends?.length > 0 ? {
        labels: enhancedStats.ticket_trends.map(item => {
          const date = new Date(item.date);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [
          {
            label: 'Tickets Created',
            data: enhancedStats.ticket_trends.map(item => item.created),
            borderColor: '#36A2EB',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Tickets Resolved',
            data: enhancedStats.ticket_trends.map(item => item.resolved),
            borderColor: '#4BC0C0',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            fill: false,
            tension: 0.4,
          }
        ]
      } : null;

      // Transform agent data for bar chart
      const agentChartData = enhancedStats.agent_performance?.length > 0 ? {
        labels: enhancedStats.agent_performance.map(item => item.agent_name),
        datasets: [
          {
            label: 'Total Tickets',
            data: enhancedStats.agent_performance.map(item => item.total_tickets),
            backgroundColor: '#36A2EB',
          },
          {
            label: 'Resolved Tickets',
            data: enhancedStats.agent_performance.map(item => item.resolved_tickets), 
            backgroundColor: '#4BC0C0',
          }
        ]
      } : null;

      // Transform priority data for pie chart
      const priorityChartData = enhancedStats.tickets_by_priority?.length > 0 ? {
        labels: enhancedStats.tickets_by_priority.map(item => item.priority),
        datasets: [{
          data: enhancedStats.tickets_by_priority.map(item => item.count),
          backgroundColor: enhancedStats.tickets_by_priority.map(item => item.color || '#6b7280'),
        }]
      } : null;

      setChartData({
        statusData: statusChartData,
        categoryData: categoryChartData,
        trendData: trendChartData,
        agentData: agentChartData,
        priorityData: priorityChartData
      });

    } catch (error) {
      console.error('Error fetching chart data:', error);
      toast.error('Failed to load chart data');
    } finally {
      setChartsLoading(false);
    }
  }, [user]);

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
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-md ${stat.color}`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="text-sm font-medium text-gray-500">{stat.name}</div>
                  <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                  <div className={`text-sm ${stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change} from last month
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role-specific content */}
      {user?.role === 'admin' && (
        <>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Admin Overview</h2>
            <p className="text-gray-600">
              System is running smoothly. All services are operational.
            </p>
          </div>

          {/* Charts Section - Only for Admins */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Analytics Dashboard
              </h2>
              <div className="text-sm text-gray-500">
                Interactive charts and insights
              </div>
            </div>

            {chartsLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                      <div className="h-64 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ticket Status Distribution */}
                {chartData.statusData && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Ticket Status Distribution</h3>
                    <PieChart data={chartData.statusData} height={300} />
                  </div>
                )}

                {/* Category Distribution */}
                {chartData.categoryData && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Tickets by Category</h3>
                    <DoughnutChart data={chartData.categoryData} height={300} />
                  </div>
                )}

                {/* Ticket Creation Trends */}
                {chartData.trendData && (
                  <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Ticket Creation Trends (Last 30 Days)</h3>
                    <LineChart data={chartData.trendData} height={300} />
                  </div>
                )}

                {/* Agent Performance */}
                {chartData.agentData && (
                  <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Agent Performance</h3>
                    <BarChart data={chartData.agentData} height={300} />
                  </div>
                )}

                {/* Priority Distribution */}
                {chartData.priorityData && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Priority Distribution</h3>
                    <PieChart data={chartData.priorityData} height={300} />
                  </div>
                )}

                {/* Empty state when no chart data */}
                {!chartData.statusData && !chartData.categoryData && !chartData.trendData && !chartData.agentData && !chartData.priorityData && (
                  <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
                    <div className="text-center py-12">
                      <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Chart Data Available</h3>
                      <p className="text-gray-600">
                        Chart data will appear here once the backend endpoints are configured.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {user?.role === 'agent' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Agent Dashboard</h2>
          <p className="text-gray-600">
            You have {stats.find(s => s.name === 'Pending Tickets')?.value || 0} tickets to review.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;