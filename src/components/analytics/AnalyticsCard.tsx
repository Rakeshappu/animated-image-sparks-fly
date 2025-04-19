
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const AnalyticsCard = ({ 
  title, 
  value, 
  change, 
  trend = 'up', 
  icon, 
  isLoading = false 
}: AnalyticsCardProps) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
        </div>
        <div className="bg-indigo-100 p-3 rounded-full">
          {icon || <TrendingUp className="h-6 w-6 text-indigo-600" />}
        </div>
      </div>
      {change && (
        <div className="mt-4">
          <span className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-500' : 
            trend === 'down' ? 'text-red-500' : 'text-gray-500'
          }`}>
            {change} {trend === 'up' ? 'increase' : trend === 'down' ? 'decrease' : ''}
            {trend === 'up' && <TrendingUp className="inline h-3 w-3 ml-1" />}
            {trend === 'down' && <TrendingDown className="inline h-3 w-3 ml-1" />}
          </span>
          <span className="text-gray-600 text-sm"> from last month</span>
        </div>
      )}
    </div>
  );
};
