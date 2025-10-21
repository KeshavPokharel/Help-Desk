import { useState, useCallback } from 'react';
import { dashboardService } from '../services';
import { transformChartData } from '../utils/chartDataTransforms';
import toast from 'react-hot-toast';

export const useChartData = (user) => {
  const [chartData, setChartData] = useState({
    statusData: null,
    categoryData: null,
    trendData: null,
    agentData: null,
    priorityData: null
  });
  const [chartsLoading, setChartsLoading] = useState(true);

  const fetchChartData = useCallback(async () => {
    if (user?.role !== 'admin') return; // Only admins see charts
    
    try {
      setChartsLoading(true);
      
      // Use the existing enhanced stats endpoint that already provides all chart data
      const enhancedStats = await dashboardService.getEnhancedStats(30);
      
      // Transform all chart data using utility functions
      const transformedData = transformChartData(enhancedStats);
      
      setChartData(transformedData);

    } catch (error) {
      console.error('Error fetching chart data:', error);
      toast.error('Failed to load chart data');
    } finally {
      setChartsLoading(false);
    }
  }, [user]);

  return { chartData, chartsLoading, fetchChartData };
};