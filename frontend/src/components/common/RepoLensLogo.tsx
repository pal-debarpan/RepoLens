import React from 'react';

interface RepoLensLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showVersion?: boolean;
}

export const RepoLensLogo: React.FC<RepoLensLogoProps> = ({
  className = '',
  size = 'md',
  showVersion = true,
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  return (
    <div className={`flex items-center gap-space-xs ${className}`}>
      <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
        {/* RepoLens Optical Lens Mark */}
        <svg
          viewBox="0 0 48 48"
          className="w-full h-full text-primary-container"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="48" height="48" rx="8" fill="var(--color-surface-container-high)" />
          <circle cx="21" cy="21" r="13" stroke="currentColor" strokeWidth="3" />
          <circle cx="21" cy="21" r="6" fill="currentColor" opacity="0.8" />
          <line x1="31" y1="31" x2="40" y2="40" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="37" cy="11" r="2.5" fill="#7bd0ff" />
        </svg>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-display font-bold tracking-wider text-on-surface text-sm uppercase">
            RepoLens
          </span>
          {showVersion && (
            <span className="font-code text-[10px] px-1 py-0.2 rounded bg-surface-container-highest text-primary-container font-mono">
              v2.4
            </span>
          )}
        </div>
        <span className="font-code text-[9px] text-on-surface-variant tracking-tight uppercase">
          AST Engine active
        </span>
      </div>
    </div>
  );
};
