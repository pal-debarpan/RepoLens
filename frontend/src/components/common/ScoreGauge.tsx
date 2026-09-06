import React from 'react';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  size = 'md',
  showLabel = true,
}) => {
  const sizeMap = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-16 h-16 text-lg',
  };

  const getStrokeColor = (val: number) => {
    if (val >= 85) return 'text-primary-container';
    if (val >= 65) return 'text-primary-fixed-dim';
    if (val >= 50) return 'text-amber-400';
    return 'text-error';
  };

  const strokeWidth = size === 'lg' ? 4 : 3.5;

  return (
    <div className={`relative flex items-center justify-center flex-shrink-0 ${sizeMap[size]}`}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <path
          className="text-surface-container-highest"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        <path
          className={getStrokeColor(score)}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeDasharray={`${score}, 100`}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
      </svg>
      {showLabel && (
        <span className="absolute font-code font-bold text-on-surface">
          {score}
        </span>
      )}
    </div>
  );
};
