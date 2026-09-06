import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { RepoLensLogo } from '../common/RepoLensLogo';
import { useApp } from '../../context';

export const AppSidebar: React.FC = () => {
  const { repositories, sidebarCollapsed, setSidebarCollapsed } = useApp();
  const location = useLocation();

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
                item.to === '/'
                  ? location.pathname === '/' || location.pathname === '/overview'
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

      {/* Footer System Status Card */}
      {!sidebarCollapsed && (
        <div className="p-3 border-t border-surface-container-high">
          <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-label-caps text-outline uppercase font-semibold">
                AST ENGINE
              </span>
              <span className="text-[10px] font-code text-primary-container">
                v4.9 ACTIVE
              </span>
            </div>
            <div className="text-[11px] text-on-surface-variant truncate">
              Context: <span className="font-code text-on-surface">repolens-demo</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
