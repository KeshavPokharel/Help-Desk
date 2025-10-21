import React from 'react';

const StatsCard = ({ stat }) => {
  const IconComponent = stat.icon;
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
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
};

export default StatsCard;