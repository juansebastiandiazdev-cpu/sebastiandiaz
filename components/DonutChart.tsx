
import React from 'react';

interface DonutSegment {
  value: number;
  color: string;
  label?: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerText?: React.ReactNode;
  totalValue?: number;
  backgroundTrackColor?: string;
  isPrintVersion?: boolean;
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, size = 120, strokeWidth = 15, centerText, totalValue, backgroundTrackColor, isPrintVersion = false }) => {
  const halfSize = size / 2;
  const radius = halfSize - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  // Use totalValue if provided (for gauge charts), otherwise sum up segments (for pie-chart like behavior)
  const total = totalValue ?? data.reduce((acc, segment) => acc + segment.value, 0);
  const safeTotal = total > 0 ? total : 100;
  
  let accumulatedValue = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track - always visible for gauge-style charts */}
        {(totalValue !== undefined || backgroundTrackColor) && (
            <circle
                cx={halfSize}
                cy={halfSize}
                r={radius}
                fill="none"
                stroke={backgroundTrackColor || "var(--color-core-border)"}
                strokeWidth={strokeWidth}
                opacity={0.3}
            />
        )}

        {/* Data segments */}
        {data.map((segment, index) => {
          if(segment.value <= 0) return null;
          
          const dashArray = (circumference * segment.value) / safeTotal;
          const dashOffset = (circumference * accumulatedValue) / safeTotal;
          accumulatedValue += segment.value;
          
          return (
            <circle
              key={index}
              cx={halfSize}
              cy={halfSize}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashArray} ${circumference}`}
              strokeDashoffset={-dashOffset}
              transform={`rotate(-90 ${halfSize} ${halfSize})`}
              style={isPrintVersion ? {} : { transition: 'stroke-dasharray 0.5s ease-in-out, stroke-dashoffset 0.5s ease-in-out' }}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      {centerText && (
        <div className="absolute inset-0 flex items-center justify-center text-center">
          {centerText}
        </div>
      )}
    </div>
  );
};
