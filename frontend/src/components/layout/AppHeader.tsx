import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context';

export const AppHeader: React.FC = () => {
  const {
    activeRepo,
    repositories,
    setActiveRepoId,
    theme,
    toggleTheme,
    setIsCommandPaletteOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
  } = useApp();
  const [repoDropdownOpen, setRepoDropdownOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/overview') return 'Workspace Overview';
    if (path.startsWith('/repositories/connect')) return 'Connect Repository';
    if (path.startsWith('/repositories')) return 'Fleet Inventory';
    if (path.startsWith('/progress')) return 'Pipeline Telemetry';
    if (path.startsWith('/architecture')) return 'Architecture Topology';
    if (path.startsWith('/security')) return 'Security Analysis';
    if (path.startsWith('/dependencies')) return 'Dependency Graph & Licenses';
    if (path.startsWith('/blast-radius')) return 'Blast Radius Simulation';
    if (path.startsWith('/issues/')) return 'Issue Code Evidence & Remediation';
    if (path.startsWith('/issues')) return 'Repository Findings & Issues';
    if (path.startsWith('/testing')) return 'Testing Impact Recommendations';
    if (path.startsWith('/file-explorer/detail')) return 'File Detail / AST Inspector';
    if (path.startsWith('/file-explorer')) return 'Repository File Explorer';
    if (path.startsWith('/ai-assistant')) return 'RepoLens AI Assistant';
    if (path.startsWith('/settings')) return 'Application Settings';
    return 'RepoLens';
  };

  return (
    <header
      className={`fixed top-0 right-0 z-20 h-16 bg-surface-container-lowest/90 backdrop-blur-md border-b border-surface-container-high flex items-center justify-between px-4 lg:px-6 transition-all duration-300 ${
        sidebarCollapsed ? 'left-16' : 'left-64'
      }`}
    >
      {/* Left: Mobile Toggle, Breadcrumb & Active Repo Dropdown */}
      <div className="flex items-center gap-space-sm min-w-0">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="text-outline hover:text-on-surface p-1 rounded hover:bg-surface-container transition-colors md:hidden"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>

        {/* Breadcrumb Title */}
        <div className="flex items-center gap-2">
          <span className="text-on-surface font-semibold text-body-md truncate">
            {getPageTitle()}
          </span>
          <span className="text-outline text-xs hidden sm:inline">/</span>
        </div>

        {/* Repo Selector Dropdown */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => setRepoDropdownOpen(!repoDropdownOpen)}
            className="flex items-center gap-space-xs px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container border border-surface-container-highest transition-colors text-xs font-code text-on-surface"
          >
            <span className="material-symbols-outlined text-[14px] text-primary-container">
              lock
            </span>
            <span className="font-semibold text-on-surface">{activeRepo?.name || 'repolens-demo'}</span>
            <span className="text-outline font-normal">({activeRepo?.branch || 'main'})</span>
            <span className="material-symbols-outlined text-[16px] text-outline">
              expand_more
            </span>
          </button>

          {repoDropdownOpen && (
            <div
              className="absolute left-0 mt-1 w-64 rounded-xl bg-surface-container-low border border-surface-container-highest shadow-xl py-1 z-50 animate-scale-up"
              onClick={() => setRepoDropdownOpen(false)}
            >
              <div className="px-3 py-1.5 text-[10px] font-label-caps text-outline uppercase font-semibold border-b border-surface-container-highest">
                Switch Repository Context
              </div>
              {repositories.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => setActiveRepoId(repo.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-surface-container transition-colors ${
                    repo.id === activeRepo?.id ? 'bg-surface-container/60 text-primary-container' : 'text-on-surface'
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-code text-xs font-semibold truncate">{repo.name}</span>
                    <span className="text-[11px] text-outline truncate">{repo.framework} • {repo.branch}</span>
                  </div>
                  <span className="font-code text-xs font-bold px-1.5 py-0.5 rounded bg-surface-container-highest">
                    {repo.score}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
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

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light Mode (Champagne)' : 'Dark Mode (Graphite)'}`}
          className="p-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors relative"
        >
          <span className="material-symbols-outlined text-[20px]">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* Notifications */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          title="Notifications (3 active alerts)"
          className="p-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors relative"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface-container-lowest" />
        </button>

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
