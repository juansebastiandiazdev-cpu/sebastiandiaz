
import React from 'react';

interface GaugeProps {
  value: number; // 0-100
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

const riskConfig = {
    Low: { color: '#22c55e', label: 'Low Risk' }, // green-500
    Medium: { color: '#f59e0b', label: 'Medium Risk' }, // amber-500
    High: { color: '#ef4444', label: 'High Risk' }, // red-500
    Critical: { color: '#b91c1c', label: 'Critical' }, // red-700
};


export const Gauge: React.FC<GaugeProps> = ({ value, riskLevel }) => {
  const config = riskConfig[riskLevel] || riskConfig.Low;
  const circumference = 2 * Math.PI * 80; // radius = 80
  const arcLength = (circumference / 2) * (value / 100);
  const totalArcLength = circumference / 2;

  return (
    <div className="relative w-48 h-24 flex flex-col items-center justify-end">
      <svg width="192" height="96" viewBox="0 0 192 96" className="absolute top-0">
        <path
          d="M 16 96 A 80 80 0 0 1 176 96"
          stroke="var(--color-core-border)"
          strokeWidth="16"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 16 96 A 80 80 0 0 1 176 96"
          stroke={config.color}
          strokeWidth="16"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${totalArcLength}`}
          style={{ transition: 'stroke-dasharray 0.5s ease-out' }}
        />
      </svg>
      <div className="text-center relative -top-4">
        <p className="text-3xl font-bold text-core-text-primary">{value}</p>
        <p className={`text-sm font-semibold`} style={{ color: config.color }}>{config.label}</p>
      </div>
    </div>
  );
};
