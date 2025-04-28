
import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface DataItem {
  date: string;
  count: number;
}

interface StudentStatsChartProps {
  data: DataItem[];
}

export const StudentStatsChart: React.FC<StudentStatsChartProps> = ({ data }) => {
  // Format data for the chart
  const formatChartData = (rawData: DataItem[]) => {
    // If no data, create some empty placeholder data
    if (!rawData || rawData.length === 0) {
      const result = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const day = new Date();
        day.setDate(today.getDate() - i);
        result.push({
          date: day.toLocaleDateString('en-US', { weekday: 'short' }),
          fullDate: day.toISOString().split('T')[0],
          count: 0
        });
      }
      return result;
    }

    // Sort data by date
    const sortedData = [...rawData].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    // Take the last 7 days
    const lastWeekData = sortedData.slice(-7);
    
    // Format for display
    return lastWeekData.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
      fullDate: new Date(item.date).toISOString().split('T')[0],
      count: item.count
    }));
  };
  
  const chartData = formatChartData(data);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium">{label} ({data.fullDate})</p>
          <p className="text-indigo-600">{`Activities: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#EEE' }}
          />
          <YAxis 
            tickCount={5}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => (value === 0 ? '0' : `${value}`)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="count" 
            stroke="#6366F1" 
            fill="#EEF2FF" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
