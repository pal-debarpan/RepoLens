import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context';

export const AppHeader: React.FC = () => {
  const {
    user,
    signOut,
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
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/overview' || path === '/app') return 'Workspace Overview';
    if (path.startsWith('/repositories/connect')) return 'Connect Repository';
    if (path.startsWith('/repositories')) return 'Fleet Inventory';
    if (path.startsWith('/ingest')) return 'Ingest Codebase';
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

  const userInitials = (user?.displayName || user?.email || 'Developer')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

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

        {/* User Profile Avatar with Dropdown */}
        <div className="relative pl-2 border-l border-surface-container-high" ref={userDropdownRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-surface-container transition-colors"
            title="User Account Menu"
          >
            <div className="w-8 h-8 rounded-lg bg-primary-container/20 text-primary-container border border-primary-container/40 flex items-center justify-center font-code text-xs font-bold shadow-sm">
              {userInitials}
            </div>
            <span className="material-symbols-outlined text-[16px] text-outline hidden md:block">
              expand_more
            </span>
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-surface-container-low border border-surface-container-highest shadow-2xl py-2 z-50 animate-scale-up">
              {/* User Details */}
              <div className="px-4 py-2 border-b border-surface-container-highest">
                <div className="font-semibold text-xs text-on-surface truncate">
                  {user?.displayName || 'Developer'}
                </div>
                <div className="text-[11px] font-code text-outline truncate">
                  {user?.email || 'developer@repolens.io'}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary-container" />
                  <span className="text-[10px] font-code text-primary-fixed-dim uppercase tracking-wider">
                    {user?.provider || 'Active'} Tenant
                  </span>
                </div>
              </div>

              {/* Menu Links */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    navigate('/app');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs text-on-surface hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-outline">dashboard</span>
                  <span>Workspace Dashboard</span>
                </button>

                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    navigate('/repositories');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs text-on-surface hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-outline">folder_data</span>
                  <span>Fleet Inventory</span>
                </button>

                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs text-on-surface hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-outline">settings</span>
                  <span>Settings &amp; Keys</span>
                </button>
              </div>

              {/* Sign Out Action */}
              <div className="pt-1 mt-1 border-t border-surface-container-highest">
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs text-error hover:bg-error-container/20 font-semibold transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-error">logout</span>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
