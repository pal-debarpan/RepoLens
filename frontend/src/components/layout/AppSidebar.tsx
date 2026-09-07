import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  Terminal,
  Network,
  ShieldAlert,
  GitFork,
  Radar,
  Bug,
  CheckSquare,
  FolderTree,
  Bot,
  Settings,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { RepoLensLogo } from '../common/RepoLensLogo';
import { useApp } from '../../context';
import { setFountainOrigin } from '../../utils/fountainTransition';

export interface AppSidebarProps {
  /** Optional theme override: 'dark' or 'light'. If omitted, detects active app theme. */
  theme?: 'dark' | 'light';
  /** Optional controlled collapsed state */
  collapsed?: boolean;
  /** Optional controlled collapse toggle callback */
  onToggleCollapse?: () => void;
  /** Optional active path override */
  activePath?: string;
  /** Optional additional class names */
  className?: string;
}

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; size?: number }>;
  badge?: string;
  badgeType?: 'accent-new' | 'accent-core' | 'numeric' | 'alert' | 'neutral';
  external?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  theme: themeProp,
  collapsed: collapsedProp,
  onToggleCollapse,
  activePath: activePathProp,
  className = '',
}) => {
  const { repositories, sidebarCollapsed: contextCollapsed, setSidebarCollapsed, theme: contextTheme } = useApp();
  const location = useLocation();

  // Determine current theme and collapse state
  const isDark = (themeProp || contextTheme) !== 'light';
  const isCollapsed = collapsedProp !== undefined ? collapsedProp : contextCollapsed;
  const currentPath = activePathProp !== undefined ? activePathProp : location.pathname;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setSidebarCollapsed(!isCollapsed);
    }
  };

  const navGroups: NavGroup[] = [
    {
      id: 'workspace',
      label: 'WORKSPACE',
      items: [
        { label: 'Overview', to: '/app', icon: LayoutDashboard },
        {
          label: 'Repositories',
          to: '/repositories',
          icon: FolderGit2,
          badge: String(repositories.length || 3),
          badgeType: 'numeric',
        },
        { label: 'Progress', to: '/progress', icon: Terminal },
      ],
    },
    {
      id: 'analysis',
      label: 'ANALYSIS',
      items: [
        { label: 'Architecture', to: '/architecture', icon: Network },
        {
          label: 'Security',
          to: '/security',
          icon: ShieldAlert,
          badge: '3',
          badgeType: 'alert',
        },
        { label: 'Dependencies', to: '/dependencies', icon: GitFork },
        {
          label: 'Blast Radius',
          to: '/blast-radius',
          icon: Radar,
          badge: 'CORE',
          badgeType: 'accent-core',
        },
        {
          label: 'Issues',
          to: '/issues',
          icon: Bug,
          badge: '8',
          badgeType: 'numeric',
        },
        { label: 'Testing', to: '/testing', icon: CheckSquare },
      ],
    },
    {
      id: 'explorer',
      label: 'EXPLORER',
      items: [
        { label: 'File Explorer', to: '/file-explorer', icon: FolderTree },
      ],
    },
    {
      id: 'tools',
      label: 'TOOLS',
      items: [
        {
          label: 'AI Assistant',
          to: '/ai-assistant',
          icon: Bot,
          badge: 'AI',
          badgeType: 'accent-core',
        },
      ],
    },
    {
      id: 'system',
      label: 'SYSTEM & HELP',
      items: [
        { label: 'Settings', to: '/settings', icon: Settings },
        { label: 'Documentation', to: '/progress', icon: BookOpen },
      ],
    },
  ];

  // Helper to render badges based on theme and badgeType
  const renderBadge = (badge: string, badgeType?: string) => {
    if (badgeType === 'alert') {
      return (
        <span
          className={`w-[18px] h-[18px] rounded-full text-[10px] font-mono font-bold flex items-center justify-center transition-all ${
            isDark
              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.25)]'
              : 'bg-rose-100 text-rose-600 border border-rose-200 shadow-sm'
          }`}
        >
          {badge}
        </span>
      );
    }

    if (badgeType === 'accent-new') {
      return (
        <span
          className={`text-[9.5px] font-sans font-bold px-2 py-0.5 rounded-full tracking-wide transition-all ${
            isDark
              ? 'bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/35 shadow-[0_0_8px_rgba(163,230,53,0.18)]'
              : 'bg-[#10b981]/15 text-[#047857] border border-[#10b981]/35 shadow-sm'
          }`}
        >
          {badge}
        </span>
      );
    }

    if (badgeType === 'accent-core') {
      return (
        <span
          className={`text-[9.5px] font-sans font-bold px-2 py-0.5 rounded-full tracking-wide transition-all ${
            isDark
              ? 'bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/35 shadow-[0_0_8px_rgba(163,230,53,0.18)]'
              : 'bg-[#10b981]/15 text-[#047857] border border-[#10b981]/35 shadow-sm'
          }`}
        >
          {badge}
        </span>
      );
    }

    // Default numeric counter (neutral gray rounded square/circle)
    return (
      <span
        className={`min-w-[20px] px-1.5 py-0.5 text-center text-[10.5px] font-mono font-medium rounded-[5px] transition-colors ${
          isDark
            ? 'bg-[#1c202a] text-[#94a3b8] border border-white/[0.06]'
            : 'bg-[#e9efe5] text-[#475569] border border-[#d6dfcf]'
        }`}
      >
        {badge}
      </span>
    );
  };

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-30 flex flex-col transition-all duration-300 select-none ${
        isDark
          ? 'bg-[#0d0e12] border-r border-[#1d2028] text-[#94a3b8]'
          : 'bg-[#fafdf5] border-r border-[#e4ebd0]/80 text-[#475569]'
      } ${isCollapsed ? 'w-16' : 'w-64'} ${className}`}
    >
      {/* Brand Header */}
      <div
        className={`h-16 flex items-center justify-between px-4 border-b transition-colors ${
          isDark ? 'border-[#1d2028]' : 'border-[#e4ebd0]/80'
        }`}
      >
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <RepoLensLogo size="md" />
          </div>
        ) : (
          <div className="mx-auto">
            <RepoLensLogo variant="icon" size="md" />
          </div>
        )}

        <button
          type="button"
          onClick={handleToggle}
          className={`p-1.5 rounded-lg transition-all hidden md:flex items-center justify-center ${
            isDark
              ? 'text-[#64748b] hover:text-[#f8fafc] hover:bg-[#161a22]'
              : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f0f6ec]'
          }`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight size={16} strokeWidth={1.75} />
          ) : (
            <ChevronLeft size={16} strokeWidth={1.75} />
          )}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-3.5 space-y-5 px-3">
        {navGroups.map((group) => (
          <div key={group.id} className="space-y-1">
            {/* Section Header */}
            {!isCollapsed && (
              <div
                className={`px-3 py-1 text-[10.5px] font-sans font-semibold tracking-[0.09em] uppercase transition-colors ${
                  isDark ? 'text-[#6b7280]' : 'text-[#64748b]'
                }`}
              >
                {group.label}
              </div>
            )}

            {/* Section Nav Items */}
            <div className="space-y-1">
              {group.items.map((item) => {
                const IconComponent = item.icon;
                const isActive =
                  item.to === '/app'
                    ? currentPath === '/app' || currentPath === '/overview' || currentPath === '/'
                    : currentPath.startsWith(item.to);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={isCollapsed ? item.label : undefined}
                    onClick={(e) => setFountainOrigin(e.clientX, e.clientY)}
                    className={`group relative flex items-center justify-between px-3 py-2 rounded-[9px] text-[13px] font-sans transition-all duration-150 active:scale-[0.99] active:opacity-90 cursor-pointer ${
                      isActive
                        ? isDark
                          ? 'bg-[#151922] text-[#f8fafc] font-medium border border-[#a3e635]/25 shadow-[0_0_20px_rgba(163,230,53,0.08)]'
                          : 'bg-[#ebf6ed] text-[#0f172a] font-medium border border-[#10b981]/25 shadow-[0_2px_8px_rgba(16,185,129,0.08)]'
                        : isDark
                        ? 'text-[#94a3b8] font-normal hover:bg-[#161a22] hover:text-[#f1f5f9]'
                        : 'text-[#475569] font-normal hover:bg-[#f0f6ec] hover:text-[#0f172a]'
                    }`}
                  >
                    {/* Glowing Left Accent Bar for Active State */}
                    {isActive && (
                      <div
                        className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-all ${
                          isDark
                            ? 'bg-[#a3e635] shadow-[0_0_8px_rgba(163,230,53,0.7)]'
                            : 'bg-[#10b981] shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                        }`}
                      />
                    )}

                    {/* Left Icon & Label */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        <IconComponent
                          size={18}
                          strokeWidth={1.6}
                          className={`transition-colors ${
                            isActive
                              ? isDark
                                ? 'text-[#a3e635]'
                                : 'text-[#059669]'
                              : isDark
                              ? 'text-[#64748b] group-hover:text-[#f1f5f9]'
                              : 'text-[#64748b] group-hover:text-[#0f172a]'
                          }`}
                        />
                        {/* Collapsed dot indicators for alerts */}
                        {isCollapsed && item.badge && (
                          <span
                            className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                              item.badgeType === 'alert'
                                ? 'bg-rose-500 ring-2 ring-[#0d0e12]'
                                : isDark
                                ? 'bg-[#a3e635] ring-2 ring-[#0d0e12]'
                                : 'bg-[#10b981] ring-2 ring-[#fafdf5]'
                            }`}
                          />
                        )}
                      </div>

                      {!isCollapsed && (
                        <span className="truncate tracking-[-0.01em]">
                          {item.label}
                        </span>
                      )}
                    </div>

                    {/* Right-aligned Badge */}
                    {!isCollapsed && item.badge && (
                      <div className="flex-shrink-0 ml-2">
                        {renderBadge(item.badge, item.badgeType)}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer System Status Card */}
      {!isCollapsed && (
        <div
          className={`p-3.5 border-t transition-colors ${
            isDark ? 'border-[#1d2028]' : 'border-[#e4ebd0]/80'
          }`}
        >
          <div
            className={`p-3 rounded-xl border transition-all ${
              isDark
                ? 'bg-[#13161e] border-[#1f2430] text-[#94a3b8]'
                : 'bg-[#f0f6ec] border-[#dce6d8] text-[#475569]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    isDark
                      ? 'bg-[#a3e635] shadow-[0_0_6px_rgba(163,230,53,0.8)]'
                      : 'bg-[#10b981] shadow-[0_0_6px_rgba(16,185,129,0.6)]'
                  }`}
                />
                <span
                  className={`text-[10px] font-sans font-bold tracking-wider uppercase ${
                    isDark ? 'text-[#8b949e]' : 'text-[#64748b]'
                  }`}
                >
                  AST ENGINE
                </span>
              </div>
              <span
                className={`text-[10.5px] font-mono font-semibold ${
                  isDark ? 'text-[#a3e635]' : 'text-[#059669]'
                }`}
              >
                v4.9 ACTIVE
              </span>
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[11.5px]">
              <span className={isDark ? 'text-[#64748b]' : 'text-[#64748b]'}>
                Context
              </span>
              <span
                className={`font-mono text-[11px] font-medium truncate max-w-[120px] ${
                  isDark ? 'text-[#f1f5f9]' : 'text-[#0f172a]'
                }`}
              >
                repolens-demo
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
