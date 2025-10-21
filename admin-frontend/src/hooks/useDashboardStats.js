import { useState, useCallback } from 'react';
import { Users, Ticket, Clock, CheckCircle } from 'lucide-react';
import { dashboardService } from '../services';
import toast from 'react-hot-toast';

export const useDashboardStats = (user) => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      // Call appropriate endpoint based on user role
      const data = user?.role === 'admin' 
        ? await dashboardService.getStats()
        : await dashboardService.getAgentStats();
      
      // Transform the API data into the expected format
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

  return { stats, loading, fetchDashboardStats };
};