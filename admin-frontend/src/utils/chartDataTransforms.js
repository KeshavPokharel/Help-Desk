// Chart data transformation utilities

export const transformStatusData = (ticketsByStatus) => {
  if (!ticketsByStatus?.length) return null;
  
  return {
    labels: ticketsByStatus.map(item => item.status),
    datasets: [{
      data: ticketsByStatus.map(item => item.count),
      backgroundColor: ticketsByStatus.map(item => item.color || '#6b7280'),
    }]
  };
};

export const transformCategoryData = (ticketsByCategory) => {
  if (!ticketsByCategory?.length) return null;
  
  return {
    labels: ticketsByCategory.map(item => item.category_name),
    datasets: [{
      data: ticketsByCategory.map(item => item.count),
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
  };
};

export const transformTrendData = (ticketTrends) => {
  if (!ticketTrends?.length) return null;
  
  return {
    labels: ticketTrends.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Tickets Created',
        data: ticketTrends.map(item => item.created),
        borderColor: '#36A2EB',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Tickets Resolved',
        data: ticketTrends.map(item => item.resolved),
        borderColor: '#4BC0C0',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        fill: false,
        tension: 0.4,
      }
    ]
  };
};

export const transformAgentData = (agentPerformance) => {
  if (!agentPerformance?.length) return null;
  
  return {
    labels: agentPerformance.map(item => item.agent_name),
    datasets: [
      {
        label: 'Total Tickets',
        data: agentPerformance.map(item => item.total_tickets),
        backgroundColor: '#36A2EB',
      },
      {
        label: 'Resolved Tickets',
        data: agentPerformance.map(item => item.resolved_tickets), 
        backgroundColor: '#4BC0C0',
      }
    ]
  };
};

export const transformPriorityData = (ticketsByPriority) => {
  if (!ticketsByPriority?.length) return null;
  
  return {
    labels: ticketsByPriority.map(item => item.priority),
    datasets: [{
      data: ticketsByPriority.map(item => item.count),
      backgroundColor: ticketsByPriority.map(item => item.color || '#6b7280'),
    }]
  };
};

// Main transformation function that combines all individual transformers
export const transformChartData = (enhancedStats) => {
  return {
    statusData: transformStatusData(enhancedStats.tickets_by_status),
    categoryData: transformCategoryData(enhancedStats.tickets_by_category),
    trendData: transformTrendData(enhancedStats.ticket_trends),
    agentData: transformAgentData(enhancedStats.agent_performance),
    priorityData: transformPriorityData(enhancedStats.tickets_by_priority)
  };
};