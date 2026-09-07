import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { RepoLensLogo } from '../common/RepoLensLogo';
import { useApp } from '../../context';

export const AppSidebar: React.FC = () => {
  const { user, signOut, repositories, sidebarCollapsed, setSidebarCollapsed } = useApp();
  const location = useLocation();

  const userInitials = (user?.displayName || user?.email || 'Developer')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const navGroups = [
    {
      label: 'WORKSPACE',
      items: [
        { label: 'Overview', to: '/app', icon: 'dashboard' },
        {
          label: 'Ingest Codebase',
          to: '/ingest',
          icon: 'input',
          badge: 'NEW',
          badgeColor: 'bg-primary-container text-on-primary-container font-mono font-bold',
        },
        { label: 'Repositories', to: '/repositories', icon: 'folder_data', badge: String(repositories.length || 3) },
        { label: 'Progress', to: '/progress', icon: 'terminal' },
      ],
    },
    {
      label: 'ANALYSIS',
      items: [
        { label: 'Architecture', to: '/architecture', icon: 'hub' },
        { label: 'Security', to: '/security', icon: 'security', badge: '3', badgeColor: 'bg-error-container text-on-error-container' },
        { label: 'Dependencies', to: '/dependencies', icon: 'account_tree' },
        {
          label: 'Blast Radius',
          to: '/blast-radius',
          icon: 'radar',
          badge: 'CORE',
          badgeColor: 'bg-primary-container text-on-primary-container font-bold',
        },
        { label: 'Issues', to: '/issues', icon: 'bug_report', badge: '8' },
        { label: 'Testing', to: '/testing', icon: 'checklist' },
      ],
    },
    {
      label: 'EXPLORER',
      items: [
        { label: 'File Explorer', to: '/file-explorer', icon: 'folder_open' },
      ],
    },
    {
      label: 'TOOLS',
      items: [
        { label: 'AI Assistant', to: '/ai-assistant', icon: 'smart_toy', badge: 'AI', badgeColor: 'bg-secondary/20 text-secondary' },
      ],
    },
    {
      label: 'SYSTEM',
      items: [
        { label: 'Settings', to: '/settings', icon: 'settings' },
      ],
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-30 flex flex-col bg-surface-container-lowest border-r border-surface-container-high transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-surface-container-high">
        {!sidebarCollapsed ? (
          <RepoLensLogo />
        ) : (
          <div className="mx-auto">
            <RepoLensLogo showVersion={false} size="sm" />
          </div>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="text-outline hover:text-on-surface p-1 rounded hover:bg-surface-container transition-colors hidden md:block"
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <span className="material-symbols-outlined text-[18px]">
            {sidebarCollapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label} className="px-2 space-y-0.5">
            {!sidebarCollapsed && (
              <div className="px-3 py-1 text-[10px] font-label-caps tracking-wider text-outline uppercase font-semibold">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const isActive =
                item.to === '/' || item.to === '/app'
                  ? location.pathname === '/' || location.pathname === '/overview' || location.pathname === '/app'
                  : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-body-sm font-body-sm transition-all ${
                    isActive
                      ? 'bg-surface-container text-on-surface font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`}
                >
                  {/* Left glowing accent indicator for active state */}
                  {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary-container rounded-r" />
                  )}

                  <div className="flex items-center gap-space-sm min-w-0">
                    <span
                      className={`material-symbols-outlined text-[20px] transition-colors ${
                        isActive ? 'text-primary-container' : 'text-outline group-hover:text-on-surface'
                      }`}
                    >
                      {item.icon}
                    </span>
                    {!sidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>

                  {!sidebarCollapsed && item.badge && (
                    <span
                      className={`text-[10px] font-label-caps px-1.5 py-0.5 rounded ${
                        item.badgeColor || 'bg-surface-container-highest text-outline'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* User Session & Sign Out Footer */}
      <div className="p-3 border-t border-surface-container-high bg-surface-container-low/40">
        {!sidebarCollapsed ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-surface-container-low border border-surface-container-highest">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary-container/20 text-primary-container border border-primary-container/40 flex items-center justify-center font-code text-xs font-bold flex-shrink-0">
                {userInitials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-xs text-on-surface truncate">
                  {user?.displayName || 'Developer'}
                </span>
                <span className="text-[10px] font-code text-outline truncate">
                  {user?.email || 'developer@repolens.io'}
                </span>
              </div>
            </div>

            <button
              onClick={signOut}
              title="Sign Out of Session"
              className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container/20 transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        ) : (
          <button
            onClick={signOut}
            title="Sign Out"
            className="w-full flex items-center justify-center p-2 rounded-lg text-outline hover:text-error hover:bg-error-container/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        )}
      </div>
    </aside>
  );
};
