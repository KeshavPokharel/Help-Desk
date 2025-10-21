import React from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import PieChart from '../charts/PieChart';
import BarChart from '../charts/BarChart';
import LineChart from '../charts/LineChart';
import DoughnutChart from '../charts/DoughnutChart';

const ChartSection = ({ chartData, chartsLoading }) => {
  const hasAnyChartData = Object.values(chartData).some(data => data !== null);

  return (
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
        <ChartLoadingSkeleton />
      ) : hasAnyChartData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ticket Status Distribution */}
          {chartData.statusData && (
            <ChartCard title="Ticket Status Distribution">
              <PieChart data={chartData.statusData} height={300} />
            </ChartCard>
          )}

          {/* Category Distribution */}
          {chartData.categoryData && (
            <ChartCard title="Tickets by Category">
              <DoughnutChart data={chartData.categoryData} height={300} />
            </ChartCard>
          )}

          {/* Ticket Creation Trends */}
          {chartData.trendData && (
            <ChartCard title="Ticket Creation Trends (Last 30 Days)" fullWidth>
              <LineChart data={chartData.trendData} height={300} />
            </ChartCard>
          )}

          {/* Agent Performance */}
          {chartData.agentData && (
            <ChartCard title="Agent Performance" fullWidth>
              <BarChart data={chartData.agentData} height={300} />
            </ChartCard>
          )}

          {/* Priority Distribution */}
          {chartData.priorityData && (
            <ChartCard title="Priority Distribution">
              <PieChart data={chartData.priorityData} height={300} />
            </ChartCard>
          )}
        </div>
      ) : (
        <ChartEmptyState />
      )}
    </div>
  );
};

const ChartCard = ({ title, children, fullWidth = false }) => (
  <div className={`bg-white rounded-lg shadow p-6 ${fullWidth ? 'lg:col-span-2' : ''}`}>
    <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
    {children}
  </div>
);

const ChartLoadingSkeleton = () => (
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
);

const ChartEmptyState = () => (
  <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
    <div className="text-center py-12">
      <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Chart Data Available</h3>
      <p className="text-gray-600">
        Chart data will appear here once the backend endpoints are configured.
      </p>
    </div>
  </div>
);

export default ChartSection;