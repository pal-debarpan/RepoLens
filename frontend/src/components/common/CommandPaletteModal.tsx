import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context';

export const CommandPaletteModal: React.FC = () => {
  const { isCommandPaletteOpen, setIsCommandPaletteOpen, repositories, setActiveRepoId, toggleTheme } = useApp();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  const handleClose = () => {
    setQuery('');
    setIsCommandPaletteOpen(false);
  };

  if (!isCommandPaletteOpen) return null;

  const items = [
    { type: 'Page', title: 'Workspace Overview', icon: 'dashboard', action: () => navigate('/') },
    { type: 'Page', title: 'Repository Inventory', icon: 'folder_data', action: () => navigate('/repositories') },
    { type: 'Page', title: 'Connect New Repository', icon: 'add_link', action: () => navigate('/repositories/connect') },
    { type: 'Page', title: 'Pipeline Telemetry', icon: 'terminal', action: () => navigate('/progress') },
    { type: 'Page', title: 'Architecture Topology', icon: 'hub', action: () => navigate('/architecture') },
    { type: 'Page', title: 'Security Analysis (3 Vulnerabilities)', icon: 'security', action: () => navigate('/security') },
    { type: 'Page', title: 'Dependency Intelligence', icon: 'account_tree', action: () => navigate('/dependencies') },
    { type: 'Page', title: 'Blast Radius Analyzer (CORE)', icon: 'radar', action: () => navigate('/blast-radius') },
    { type: 'Page', title: 'Issues & Findings', icon: 'bug_report', action: () => navigate('/issues') },
    { type: 'Page', title: 'Testing Recommendations', icon: 'checklist', action: () => navigate('/testing') },
    { type: 'Page', title: 'File Explorer', icon: 'folder_open', action: () => navigate('/file-explorer') },
    { type: 'Page', title: 'AI Assistant', icon: 'smart_toy', action: () => navigate('/ai-assistant') },
    { type: 'Page', title: 'Application Settings', icon: 'settings', action: () => navigate('/settings') },
    { type: 'Action', title: 'Toggle Theme (Dark / Light)', icon: 'palette', action: () => toggleTheme() },
    ...repositories.map((repo) => ({
      type: 'Repository',
      title: `Switch context to ${repo.name} (${repo.language})`,
      icon: 'bookmark',
      action: () => {
        setActiveRepoId(repo.id);
        navigate('/repositories');
      },
    })),
    {
      type: 'File',
      title: 'services/auth_service.py [Critical Blast Risk]',
      icon: 'description',
      action: () => navigate('/file-explorer/detail'),
    },
    {
      type: 'Issue',
      title: 'ISSUE-2041: Potential Command Injection via Unsanitized Input',
      icon: 'warning',
      action: () => navigate('/issues/ISSUE-2041'),
    },
  ];

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.type.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (action: () => void) => {
    action();
    handleClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4 animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="bg-surface-container-low border border-surface-container-highest rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-space-sm px-space-lg py-space-md border-b border-surface-container-highest bg-surface-container-lowest">
          <span className="material-symbols-outlined text-primary-container text-[22px]">
            search
          </span>
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none"
            placeholder="Search commands, repositories, files, issues, or blast vectors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') handleClose();
              if (e.key === 'Enter' && filtered.length > 0) {
                handleSelect(filtered[0].action);
              }
            }}
          />
          <kbd className="px-2 py-0.5 rounded bg-surface-container-high text-outline text-[11px] font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-space-sm space-y-1">
          {filtered.length === 0 ? (
            <div className="p-space-lg text-center text-outline font-body-sm">
              No matching records found for "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(item.action)}
                className="w-full flex items-center justify-between px-space-md py-space-sm rounded-lg hover:bg-surface-container transition-colors text-left group"
              >
                <div className="flex items-center gap-space-sm min-w-0">
                  <span className="material-symbols-outlined text-outline group-hover:text-primary-container text-[18px]">
                    {item.icon}
                  </span>
                  <span className="font-body-sm text-on-surface group-hover:text-primary-container truncate font-medium">
                    {item.title}
                  </span>
                </div>
                <span className="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-surface-container-highest text-outline group-hover:bg-primary-container group-hover:text-on-primary-container uppercase ml-2 flex-shrink-0">
                  {item.type}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-space-md py-space-xs bg-surface-container border-t border-surface-container-highest flex items-center justify-between text-[11px] text-outline font-code">
          <div className="flex items-center gap-3">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
          <span>RepoLens Search Engine v2.4</span>
        </div>
      </div>
    </div>
  );
};
