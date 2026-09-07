import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { explorerService } from '../services/api';
import { FileTreeNode } from '../types';

export const FileExplorerPage: React.FC = () => {
  const { activeRepo } = useApp();
  const navigate = useNavigate();

  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [search, setSearch] = useState('');
  const [expandedDirs, setExpandedDirs] = useState<Record<string, boolean>>({
    'dir-services': true,
    'dir-core': true,
    'dir-api': true,
    'dir-config': true,
  });

  useEffect(() => {
    explorerService.getFileTree(activeRepo?.id).then(setFileTree);
  }, [activeRepo]);

  const toggleDir = (id: string) => {
    setExpandedDirs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getRiskBadge = (risk?: string) => {
    switch (risk) {
      case 'critical':
        return 'bg-error-container/30 text-error';
      case 'high':
        return 'bg-amber-500/20 text-amber-400';
      case 'medium':
        return 'bg-secondary/20 text-secondary';
      default:
        return 'bg-surface-container text-outline';
    }
  };

  return (
    <div className="space-y-space-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
              File Explorer
            </h1>
            <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-surface-container text-primary-container">
              AST HIERARCHY
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Structural file tree, blast risk indicators, and symbol indices for{' '}
            <span className="font-code text-on-surface font-semibold">{activeRepo?.name}</span>.
          </p>
        </div>

        <button
          onClick={() => navigate('/file-explorer/detail')}
          className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container font-headline-sm text-body-sm font-semibold transition-all shadow-glow-lime self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">visibility</span>
          <span>Inspect auth_service.py</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-outline">
            search
          </span>
          <input
            type="text"
            placeholder="Search files by path or symbol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-container border border-surface-container-highest text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-code text-outline">
          <span>Total Tree: 128 units</span>
        </div>
      </div>

      {/* File Tree Table Container */}
      <div className="rounded-xl border border-surface-container-high overflow-hidden shadow-sm bg-surface-container-low">
        <div className="grid grid-cols-12 px-4 py-2.5 bg-surface-container-lowest border-b border-surface-container-high font-label-caps text-label-caps text-outline uppercase">
          <div className="col-span-6">Path / File Unit</div>
          <div className="col-span-2">Lines of Code</div>
          <div className="col-span-2">Blast Risk Index</div>
          <div className="col-span-2 text-right">Audit Findings</div>
        </div>

        <div className="p-2 space-y-1">
          {fileTree.map((dir) => (
            <div key={dir.id} className="space-y-0.5">
              {/* Directory Node */}
              <div
                onClick={() => toggleDir(dir.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-container cursor-pointer text-on-surface font-semibold text-body-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-outline">
                  {expandedDirs[dir.id] ? 'folder_open' : 'folder'}
                </span>
                <span>{dir.name}/</span>
                <span className="text-xs text-outline font-code font-normal">
                  ({dir.children?.length} files)
                </span>
              </div>

              {/* Children Files */}
              {expandedDirs[dir.id] &&
                dir.children
                  ?.filter((file) => file.name.toLowerCase().includes(search.toLowerCase()))
                  .map((file) => (
                    <div
                      key={file.id}
                      onClick={() => navigate('/file-explorer/detail')}
                      className="grid grid-cols-12 items-center pl-8 pr-3 py-2 rounded-lg hover:bg-surface-container cursor-pointer transition-colors group"
                    >
                      <div className="col-span-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-primary-container">
                          description
                        </span>
                        <span className="font-code text-xs text-on-surface group-hover:text-primary-container font-semibold truncate">
                          {file.name}
                        </span>
                      </div>

                      <div className="col-span-2 font-code text-xs text-outline">
                        {file.lines} LOC
                      </div>

                      <div className="col-span-2">
                        <span
                          className={`font-code text-[11px] font-bold px-2 py-0.5 rounded uppercase ${getRiskBadge(
                            file.blastRisk
                          )}`}
                        >
                          {file.blastRisk}
                        </span>
                      </div>

                      <div className="col-span-2 text-right">
                        {file.issuesCount ? (
                          <span className="font-code text-xs px-2 py-0.5 rounded bg-error-container/30 text-error font-bold">
                            {file.issuesCount} issues
                          </span>
                        ) : (
                          <span className="font-code text-xs text-outline">Clean</span>
                        )}
                      </div>
                    </div>
                  ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
