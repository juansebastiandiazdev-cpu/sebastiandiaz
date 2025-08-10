
import React from 'react';

interface SparklineChartProps {
    data: number[];
    width?: number;
    height?: number;
    strokeColor?: string;
    strokeWidth?: number;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({ data, width = 100, height = 20, strokeColor = '#00A99D', strokeWidth = 1.5 }) => {
    if (data.length < 2) return <div style={{width, height}} className="flex items-center justify-center text-xs text-core-text-secondary/50">No trend data</div>;
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min === 0 ? 1 : max - min;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d - min) / range) * (height - (strokeWidth * 2)) - strokeWidth;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <polyline fill="none" stroke={strokeColor} strokeWidth={strokeWidth} points={points} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
};
