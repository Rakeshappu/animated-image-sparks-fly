
import React from 'react';

interface CircularProgressProps {
  value: number;
  maxValue?: number;
  size?: number;
  strokeWidth?: number;
  textSize?: string;
  color?: string;
  bgColor?: string;
  showPercentage?: boolean;
}

export const CircularProgress = ({
  value,
  maxValue = 100,
  size = 80,
  strokeWidth = 8,
  textSize = "text-lg",
  color = "#4f46e5", // indigo-600
  bgColor = "#e5e7eb", // gray-200
  showPercentage = true,
}: CircularProgressProps) => {
  // Calculate percentage
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  
  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="inline-flex items-center justify-center" style={{ height: size, width: size }}>
      <svg
        className="transform -rotate-90"
        height={size}
        width={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          className="text-gray-200"
          stroke={bgColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        
        {/* Progress circle */}
        <circle
          className="transition-all duration-700 ease-out"
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute flex items-center justify-center">
        <span className={`font-semibold ${textSize}`}>
          {showPercentage ? `${Math.round(percentage)}%` : value}
        </span>
      </div>
    </div>
  );
};

export default CircularProgress;
