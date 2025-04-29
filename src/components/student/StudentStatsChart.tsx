
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

    // First ensure we have entries for the last 7 days including today
    const result = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Create an array with the last 7 days
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(today.getDate() - i);
      day.setHours(0, 0, 0, 0);
      
      const dateStr = day.toISOString().split('T')[0];
      
      // Find if we have data for this day
      const existingData = rawData.find(item => {
        const itemDate = new Date(item.date);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate.getTime() === day.getTime();
      });
      
      result.push({
        date: day.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: dateStr,
        count: existingData ? existingData.count : 0
      });
    }
    
    return result;
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
