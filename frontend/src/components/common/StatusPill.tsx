import React from 'react';

interface StatusPillProps {
  status: 'Active' | 'Analyzing' | 'Degraded' | 'Offline' | 'Healthy' | 'Moderate Risk' | 'High Risk' | 'Critical Risk';
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, className = '' }) => {
  const getStyles = () => {
    switch (status) {
      case 'Active':
      case 'Healthy':
        return {
          bg: 'bg-surface-container',
          text: 'text-on-surface',
          dot: 'bg-primary-container',
        };
      case 'Analyzing':
        return {
          bg: 'bg-secondary-container/20',
          text: 'text-secondary',
          dot: 'bg-secondary animate-pulse',
        };
      case 'Degraded':
      case 'Moderate Risk':
        return {
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          dot: 'bg-amber-400',
        };
      case 'High Risk':
      case 'Critical Risk':
      case 'Offline':
        return {
          bg: 'bg-error-container/30',
          text: 'text-error',
          dot: 'bg-error',
        };
      default:
        return {
          bg: 'bg-surface-container',
          text: 'text-on-surface',
          dot: 'bg-outline',
        };
    }
  };

  const style = getStyles();

  return (
    <div className={`inline-flex items-center gap-space-xs px-space-xs py-space-2xs ${style.bg} rounded-full ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      <span className={`font-code-sm text-code-sm ${style.text} font-medium`}>{status}</span>
    </div>
  );
};
