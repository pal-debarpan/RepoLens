import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { issueService } from '../services/api';
import { IssueItem } from '../types';

export const IssuesPage: React.FC = () => {
  const { activeRepo } = useApp();
  const navigate = useNavigate();

  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    issueService.getIssues(activeRepo?.id).then(setIssues);
  }, [activeRepo]);

  const filtered = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(search.toLowerCase()) ||
      issue.filePath.toLowerCase().includes(search.toLowerCase()) ||
      issue.cwe.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || issue.severity.toLowerCase() === severityFilter.toLowerCase();
    const matchesCategory = categoryFilter === 'all' || issue.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesSeverity && matchesCategory;
  });

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return 'bg-error-container/30 text-error border-error/40';
      case 'High':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'Medium':
        return 'bg-secondary/20 text-secondary border-secondary/40';
      default:
        return 'bg-surface-container-highest text-outline border-outline/30';
    }
  };

  return (
    <div className="space-y-space-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
              Issues &amp; Findings
            </h1>
            <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-surface-container text-primary-container font-mono">
              TAINT &amp; DEBT VECTORS
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Syntactic taint vectors, architectural debt, and static code analysis findings in{' '}
            <span className="font-code text-on-surface font-semibold">{activeRepo?.name}</span>.
          </p>
        </div>

        <button
          onClick={() => navigate('/blast-radius')}
          className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high border border-surface-container-highest text-on-surface text-body-sm font-semibold transition-colors self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">radar</span>
          <span>Simulate Change Blast</span>
        </button>
      </div>

      {/* Severity Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
        <div
          onClick={() => setSeverityFilter('Critical')}
          className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high hover:border-error/50 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-outline text-xs uppercase font-label-caps font-semibold">Critical</span>
            <span className="material-symbols-outlined text-error text-[18px]">error</span>
          </div>
          <div className="text-2xl font-bold font-code text-error mt-1">2</div>
          <div className="text-xs text-outline font-code mt-0.5">Zero-day / Taint injection</div>
        </div>

        <div
          onClick={() => setSeverityFilter('High')}
          className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high hover:border-amber-500/50 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-outline text-xs uppercase font-label-caps font-semibold">High</span>
            <span className="material-symbols-outlined text-amber-400 text-[18px]">warning</span>
          </div>
          <div className="text-2xl font-bold font-code text-amber-400 mt-1">2</div>
          <div className="text-xs text-outline font-code mt-0.5">Circular / Salt generation</div>
        </div>

        <div
          onClick={() => setSeverityFilter('Medium')}
          className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high hover:border-secondary/50 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-outline text-xs uppercase font-label-caps font-semibold">Medium</span>
            <span className="material-symbols-outlined text-secondary text-[18px]">info</span>
          </div>
          <div className="text-2xl font-bold font-code text-secondary mt-1">1</div>
          <div className="text-xs text-outline font-code mt-0.5">Queue concurrency cap</div>
        </div>

        <div
          onClick={() => setSeverityFilter('all')}
          className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high hover:border-primary-container/50 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-outline text-xs uppercase font-label-caps font-semibold">Total Tracked</span>
            <span className="material-symbols-outlined text-primary-container text-[18px]">check_circle</span>
          </div>
          <div className="text-2xl font-bold font-code text-on-surface mt-1">{issues.length}</div>
          <div className="text-xs text-outline font-code mt-0.5">Click to view all</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-outline">
            search
          </span>
          <input
            type="text"
            placeholder="Search by title, CWE, or file path..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-container border border-surface-container-highest text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
          />
        </div>

        <div className="flex items-center gap-space-sm">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-surface-container border border-surface-container-highest text-xs text-on-surface focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Security">Security</option>
            <option value="Architectural Debt">Architectural Debt</option>
            <option value="Performance">Performance</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-surface-container border border-surface-container-highest text-xs text-on-surface focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-space-sm">
        {filtered.map((issue) => (
          <div
            key={issue.id}
            onClick={() => navigate(`/issues/${issue.id}`)}
            className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-container-high hover:border-surface-container-highest transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-space-md"
          >
            <div className="flex items-start gap-space-md min-w-0">
              <div
                className={`px-2 py-1 rounded border font-code text-xs font-bold uppercase flex-shrink-0 ${getSeverityStyle(
                  issue.severity
                )}`}
              >
                {issue.severity}
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-space-xs flex-wrap">
                  <span className="font-code text-xs text-outline">{issue.id}</span>
                  <span className="font-semibold text-body-sm text-on-surface group-hover:text-primary-container transition-colors truncate">
                    {issue.title}
                  </span>
                  <span className="font-code text-[11px] px-1.5 py-0.2 rounded bg-surface-container-highest text-primary-container">
                    {issue.cwe}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1 text-xs text-outline font-code">
                  <span className="material-symbols-outlined text-[14px]">description</span>
                  <span>
                    {issue.filePath}:{issue.line}
                  </span>
                  <span>•</span>
                  <span>author: {issue.author}</span>
                  <span>•</span>
                  <span>commit: {issue.introducedCommit}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-space-lg flex-shrink-0">
              <div className="flex flex-col text-right">
                <span className="text-[10px] uppercase font-label-caps text-outline">
                  Blast Impact
                </span>
                <span className="font-code text-xs font-bold text-amber-400">
                  {issue.blastRadiusScore}% Ripple
                </span>
              </div>

              <button className="p-2 rounded-lg bg-surface-container group-hover:bg-primary-container group-hover:text-on-primary-container text-outline transition-colors">
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
