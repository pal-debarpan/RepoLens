import React from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context';

export const AppHeader: React.FC = () => {
  const {
    setIsCommandPaletteOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
  } = useApp();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/overview' || path === '/app') return '';
    if (path.startsWith('/repositories/connect')) return 'Connect Repository';
    if (path.startsWith('/repositories')) return '';
    if (path.startsWith('/progress')) return '';
    if (path.startsWith('/architecture')) return '';
    if (path.startsWith('/security')) return '';
    if (path.startsWith('/dependencies')) return '';
    if (path.startsWith('/blast-radius')) return '';
    if (path.startsWith('/issues/')) return 'Issue Code Evidence & Remediation';
    if (path.startsWith('/issues')) return '';
    if (path.startsWith('/testing')) return '';
    if (path.startsWith('/file-explorer/detail')) return 'File Detail / AST Inspector';
    if (path.startsWith('/file-explorer')) return '';
    if (path.startsWith('/ai-assistant')) return '';
    if (path.startsWith('/settings')) return '';
    return '';
  };

  return (
    <header
      className={`fixed top-0 right-0 z-20 h-16 bg-surface-container-lowest/90 backdrop-blur-md border-b border-surface-container-high flex items-center justify-between px-4 lg:px-6 transition-all duration-300 ${
        sidebarCollapsed ? 'left-16' : 'left-64'
      }`}
    >
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-space-sm min-w-0">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="text-outline hover:text-on-surface p-1 rounded hover:bg-surface-container transition-colors md:hidden"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>

        {/* Breadcrumb Title */}
        {getPageTitle() && (
          <div className="flex items-center gap-2">
            <span className="text-on-surface font-semibold text-body-md truncate">
              {getPageTitle()}
            </span>
          </div>
        )}
      </div>

      {/* Center: Command Palette Trigger Bar */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-6">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container border border-surface-container-highest transition-colors text-outline text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-outline">search</span>
            <span>Search repositories, files, issues, or blast vectors...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high text-[10px] font-mono text-outline">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-space-sm">
        {/* Telemetry Pill */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container border border-surface-container-high text-[11px] font-code">
          <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
          <span className="text-on-surface">AST Engine v4.9 Active</span>
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-surface-container-high">
          <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center font-code text-xs font-bold text-primary-container border border-surface-container-highest">
            RL
          </div>
        </div>
      </div>
    </header>
  );
};
