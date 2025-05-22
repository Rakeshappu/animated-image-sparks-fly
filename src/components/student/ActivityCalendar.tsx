
import React from 'react';
import { Calendar } from 'lucide-react';

interface Activity {
  date: string;
  count: number;
}

interface ActivityCalendarProps {
  data: Activity[];
  isLoading?: boolean;
}

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ 
  data, 
  isLoading = false 
}) => {
  // Get current date info
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  // Create array of days for the calendar grid
  const calendarDays = [];
  
  // Fill in leading blank spaces
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Fill in days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }
  
  // Function to get activity count for a specific day
  const getActivityCountForDay = (day: number) => {
    // Format date strings consistently for comparison
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // Search for matching activity by date
    const activity = data.find(a => {
      if (!a || !a.date) return false;
      
      // Handle different date formats
      const aDate = typeof a.date === 'string' ? a.date : a.date;
      return aDate.includes(dateStr);
    });
    
    return activity ? activity.count : 0;
  };
  
  // Function to get activity color based on count
  const getActivityColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-700';
    if (count < 3) return 'bg-green-100 dark:bg-green-900';
    if (count < 6) return 'bg-green-300 dark:bg-green-700';
    return 'bg-green-500 dark:bg-green-500';
  };
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="grid grid-cols-7 gap-1">
          {Array(35).fill(0).map((_, index) => (
            <div 
              key={index} 
              className="h-9 bg-gray-100 dark:bg-gray-700 rounded"
            ></div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-700 dark:text-gray-200 font-medium">
          {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        <div className="flex items-center text-sm text-gray-500">
          <span className="w-3 h-3 inline-block bg-green-100 dark:bg-green-900 mr-1 rounded-sm"></span>
          <span className="mr-3">Low</span>
          <span className="w-3 h-3 inline-block bg-green-300 dark:bg-green-700 mr-1 rounded-sm"></span>
          <span className="mr-3">Medium</span>
          <span className="w-3 h-3 inline-block bg-green-500 dark:bg-green-500 mr-1 rounded-sm"></span>
          <span>High</span>
        </div>
      </div>
      
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-9 rounded"></div>;
          }
          
          const isToday = day === today.getDate();
          const activityCount = getActivityCountForDay(day);
          const activityColor = getActivityColor(activityCount);
          
          return (
            <div 
              key={`day-${day}`} 
              className={`h-9 rounded flex items-center justify-center relative ${activityColor} 
                ${isToday ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}`}
            >
              <span className={`text-xs ${isToday ? 'font-bold' : ''}`}>
                {day}
              </span>
              {activityCount > 0 && (
                <div className="absolute bottom-1 right-1">
                  <Calendar className="h-2 w-2" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
