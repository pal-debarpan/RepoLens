import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { ScoreGauge } from '../components/common/ScoreGauge';
import { StatusPill } from '../components/common/StatusPill';

export const RepositoriesPage: React.FC = () => {
  const { repositories, setActiveRepoId } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [langFilter, setLangFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  const filteredRepos = repositories.filter((repo) => {
    const matchesSearch =
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.framework.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.language.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLang =
      langFilter === 'all' || repo.language.toLowerCase().includes(langFilter.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || repo.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesLang && matchesStatus;
  });

  const handleSelectRepo = (repoId: string) => {
    setActiveRepoId(repoId);
    navigate('/architecture');
  };

  return (
    <div className="space-y-space-lg">
      {/* Top Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
              Repositories
            </h1>
            <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-surface-container text-primary-container font-mono">
              FLEET INVENTORY
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Active codebase telemetry, topological AST resolution, and structural integrity monitoring.
          </p>
        </div>

        <button
          onClick={() => navigate('/ingest')}
          className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container font-headline-sm text-body-sm font-semibold transition-all shadow-glow-lime self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Ingest Repository</span>
        </button>
      </div>

      {/* Filter and Telemetry Bar */}
      <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-outline">
            search
          </span>
          <input
            type="text"
            placeholder="Filter by repository name, stack, or framework..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-container border border-surface-container-highest text-on-surface text-body-sm focus:outline-none focus:border-primary-container transition-colors"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-space-sm">
          <div className="flex items-center gap-1.5 text-xs text-outline">
            <span>Language:</span>
            <select
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
              className="bg-surface-container border border-surface-container-highest text-on-surface rounded-lg px-2.5 py-1 text-xs focus:outline-none"
            >
              <option value="all">All Languages</option>
              <option value="python">Python</option>
              <option value="typescript">TypeScript</option>
              <option value="go">Go</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-outline">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface-container border border-surface-container-highest text-on-surface rounded-lg px-2.5 py-1 text-xs focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="degraded">Degraded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Repositories Table */}
      <div className="rounded-xl border border-surface-container-high overflow-hidden shadow-sm">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-space-sm px-space-lg py-space-sm bg-surface-container-lowest border-b border-surface-container-high text-outline font-label-caps text-label-caps uppercase tracking-wider">
          <div className="col-span-12 lg:col-span-4">Repository &amp; Branch Identity</div>
          <div className="hidden lg:block lg:col-span-2">Language &amp; Stack</div>
          <div className="hidden lg:block lg:col-span-2">Last Analyzed</div>
          <div className="hidden lg:block lg:col-span-2">RepoLens Index</div>
          <div className="hidden lg:block lg:col-span-1">Status</div>
          <div className="col-span-12 lg:col-span-1 text-right">Action</div>
        </div>

        {/* Table Body Rows */}
        <div className="divide-y divide-surface-container-high">
          {filteredRepos.map((repo) => (
            <div
              key={repo.id}
              className="group grid grid-cols-12 gap-space-sm px-space-lg py-space-md bg-surface-container-low hover:bg-surface-container items-center transition-colors relative cursor-pointer"
              onClick={() => handleSelectRepo(repo.id)}
            >
              {/* Visual Active Indicator Strip on Hover */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary-container opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Repo & Branch Identity (Col 4) */}
              <div className="col-span-12 lg:col-span-4 flex items-center gap-space-md min-w-0">
                <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0 text-on-surface-variant group-hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-[18px]">
                    {repo.isPrivate ? 'lock' : 'public'}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-code-md text-code-md font-semibold text-on-surface group-hover:text-primary-container truncate transition-colors">
                      {repo.name}
                    </span>
                    <span className="font-label-caps text-label-caps px-space-xs py-0.5 bg-surface-container-highest text-outline rounded font-mono">
                      {repo.isPrivate ? 'PRIVATE' : 'PUBLIC'}
                    </span>
                  </div>
                  <div className="flex items-center gap-space-xs font-code-sm text-code-sm text-outline mt-0.5">
                    <span className="material-symbols-outlined text-[14px]">commit</span>
                    <span>{repo.branch}</span>
                    <span className="text-surface-variant">•</span>
                    <span className="text-on-surface-variant font-mono">{repo.commitHash}</span>
                  </div>
                </div>
              </div>

              {/* Language & Stack (Col 2) */}
              <div className="col-span-6 lg:col-span-2 flex items-center gap-space-sm mt-space-xs lg:mt-0">
                <div className="w-2.5 h-2.5 rounded-full bg-secondary-container" />
                <div className="flex flex-col">
                  <span className="font-code-md text-code-md text-on-surface">{repo.language}</span>
                  <span className="font-body-sm text-body-sm text-outline">{repo.framework}</span>
                </div>
              </div>

              {/* Last Analyzed (Col 2) */}
              <div className="col-span-6 lg:col-span-2 flex items-center gap-space-xs mt-space-xs lg:mt-0">
                <span className="material-symbols-outlined text-[16px] text-outline">history</span>
                <div className="flex flex-col">
                  <span className="font-code-sm text-code-sm text-on-surface">{repo.lastAnalyzed}</span>
                  <span className="font-body-sm text-body-sm text-outline">Scan depth: {repo.scanDepth}</span>
                </div>
              </div>

              {/* Score Badge & Breakdown (Col 2) */}
              <div className="col-span-8 lg:col-span-2 flex items-center gap-space-md mt-space-sm lg:mt-0">
                <ScoreGauge score={repo.score} size="md" />
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps font-semibold text-primary-fixed-dim">
                    {repo.riskLevel}
                  </span>
                  <span className="font-body-sm text-body-sm text-outline">
                    {repo.blastVectorsCount} blast vectors
                  </span>
                </div>
              </div>

              {/* Health Status (Col 1) */}
              <div className="col-span-4 lg:col-span-1 flex items-center mt-space-sm lg:mt-0">
                <StatusPill status={repo.status} />
              </div>

              {/* Actions (Col 1) */}
              <div className="col-span-12 lg:col-span-1 flex items-center justify-end gap-space-xs mt-space-sm lg:mt-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectRepo(repo.id);
                  }}
                  className="px-space-sm py-space-xs bg-surface-container hover:bg-primary-container hover:text-on-primary-container text-on-surface font-headline-sm text-body-sm rounded-lg transition-all flex items-center gap-space-2xs shadow-sm"
                >
                  <span>View Intel</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
