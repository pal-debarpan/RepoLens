import React from 'react';
import { useApp } from '../../context';

export interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

/**
 * RepoLens Dual Theme Toggle Switch
 * Adapted from Uiverse.io by satyamchaudharydev with RepoLens custom colors:
 * - Unchecked (Light Mode): Champagne cream track with radiant emerald sun
 * - Checked (Dark Mode): Warm near-black track with glowing lime crescent moon
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = 'md',
  className = '',
  showLabel = false,
}) => {
  const { theme, toggleTheme } = useApp();
  const isDark = theme !== 'light';

  // Responsive scale via font-size since dimensions in the switch use em units
  const sizeClasses = {
    sm: 'text-[10px]',
    md: 'text-[12px]',
    lg: 'text-[14px]',
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    toggleTheme({
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    });
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <label
        className={`repolens-theme-switch ${sizeClasses[size]} cursor-pointer`}
        title={`Switch to ${isDark ? 'Champagne Light' : 'Dark'} Mode`}
        aria-label="Toggle dark or light theme"
      >
        <input
          type="checkbox"
          checked={isDark}
          onChange={handleChange}
          aria-checked={isDark}
        />
        <span className="slider" />
      </label>

      {showLabel && (
        <span className="text-xs font-mono select-none font-semibold text-on-surface">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </div>
  );
};
