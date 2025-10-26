import React from 'react';
import { Users2, Shield, User as UserIcon } from 'lucide-react';

const StatCard = ({ icon: Icon, iconColor, title, value }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="text-lg font-medium text-gray-900">{value}</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

const UserStatsCards = ({ userStats, totalUsers }) => {
  const stats = [
    { 
      icon: Users2, 
      iconColor: 'text-gray-400', 
      title: 'Total Users', 
      value: totalUsers 
    },
    { 
      icon: Shield, 
      iconColor: 'text-red-400', 
      title: 'Admins', 
      value: userStats.admin || 0 
    },
    { 
      icon: Users2, 
      iconColor: 'text-blue-400', 
      title: 'Agents', 
      value: userStats.agent || 0 
    },
    { 
      icon: UserIcon, 
      iconColor: 'text-green-400', 
      title: 'Users', 
      value: userStats.user || 0 
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default UserStatsCards;