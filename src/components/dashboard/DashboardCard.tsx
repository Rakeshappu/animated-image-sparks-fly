
import { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  value: string;
  icon?: ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
  description?: string;
  onClick?: () => void;
}

const DashboardCard = ({ 
  title, 
  value, 
  icon, 
  color = 'blue',
  description,
  onClick 
}: DashboardCardProps) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div 
      className={`p-6 rounded-lg border shadow-sm ${colorClasses[color]} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">{title}</h3>
        {icon && <div>{icon}</div>}
      </div>
      <div className="text-3xl font-bold">{value}</div>
      {description && (
        <div className="mt-2 text-sm opacity-80">{description}</div>
      )}
    </div>
  );
};

export default DashboardCard;
