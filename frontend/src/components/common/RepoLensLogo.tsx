import React from 'react';

interface RepoLensLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showVersion?: boolean;
  variant?: 'full' | 'icon';
  onClick?: () => void;
}

export const RepoLensLogo: React.FC<RepoLensLogoProps> = ({
  className = '',
  size = 'md',
  showVersion = false,
  variant = 'full',
  onClick,
}) => {
  const fullHeights = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-11',
    xl: 'h-14',
  };

  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-14 w-14',
  };

  if (variant === 'icon') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center select-none ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${className}`}
      >
        <img
          src="/repolens-icon-only.png"
          alt="RepoLens Mark"
          className={`${iconSizes[size]} object-contain drop-shadow-[0_0_8px_rgba(182,255,46,0.3)]`}
        />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 select-none ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${className}`}
    >
      <img
        src="/repolens-logo-only.png"
        alt="repolens"
        className={`${fullHeights[size]} w-auto object-contain drop-shadow-[0_0_12px_rgba(182,255,46,0.25)]`}
      />
      {showVersion && (
        <span className="font-code text-[10px] px-1.5 py-0.5 rounded bg-surface-container-highest text-primary-container font-mono border border-surface-container-high self-center">
          v2.4
        </span>
      )}
    </div>
  );
};

