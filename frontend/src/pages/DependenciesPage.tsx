import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { dependencyService } from '../services/api';
import { DependencyItem } from '../types';

export const DependenciesPage: React.FC = () => {
  const { activeRepo } = useApp();
  const navigate = useNavigate();

  const [dependencies, setDependencies] = useState<DependencyItem[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    dependencyService.getDependencies(activeRepo?.id).then(setDependencies);
  }, [activeRepo]);

  const filtered = dependencies.filter((dep) => {
    const matchesSearch = dep.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || dep.type === filterType;
    const matchesStatus = filterStatus === 'all' || dep.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-space-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
              Repository Dependencies
            </h1>
            <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-surface-container text-primary-container font-mono">
              SOFTWARE BILL OF MATERIALS
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Ecosystem packages, license compliance audits, and transitive vulnerabilities for{' '}
            <span className="font-code text-on-surface font-semibold">{activeRepo?.name}</span>.
          </p>
        </div>

        <button
          onClick={() => navigate('/blast-radius')}
          className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high border border-surface-container-highest text-on-surface text-body-sm font-semibold transition-colors self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">radar</span>
          <span>Trace Dependency Blast</span>
        </button>
      </div>

      {/* Dependency Telemetry Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <div className="text-outline text-xs uppercase font-label-caps font-semibold">Direct Packages</div>
          <div className="text-2xl font-bold font-code text-on-surface mt-1">7</div>
          <div className="text-xs text-outline font-code mt-0.5">Top-level manifest</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <div className="text-outline text-xs uppercase font-label-caps font-semibold">Transitive Graph</div>
          <div className="text-2xl font-bold font-code text-secondary mt-1">42</div>
          <div className="text-xs text-outline font-code mt-0.5">Resolved AST symbols</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <div className="text-outline text-xs uppercase font-label-caps font-semibold">Vulnerable CVEs</div>
          <div className="text-2xl font-bold font-code text-error mt-1">1</div>
          <div className="text-xs text-error font-code mt-0.5">CVE-2022-29217 (pyjwt)</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <div className="text-outline text-xs uppercase font-label-caps font-semibold">License Compliance</div>
          <div className="text-2xl font-bold font-code text-primary-container mt-1">100%</div>
          <div className="text-xs text-primary-container font-code mt-0.5">Permissive (MIT/BSD/Apache)</div>
        </div>
      </div>

      {/* Circular Dependency Warning Callout */}
      <div className="p-space-md rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-space-md">
        <span className="material-symbols-outlined text-amber-400 text-[24px] flex-shrink-0 mt-0.5">
          warning
        </span>
        <div className="flex flex-col">
          <span className="font-semibold text-body-sm text-amber-300">
            Circular Dependency Cycle Flagged by AST Parser
          </span>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Module <span className="font-code text-on-surface">core.tokens</span> imports{' '}
            <span className="font-code text-on-surface">core.session</span> while{' '}
            <span className="font-code text-on-surface">core.session</span> lazily references{' '}
            <span className="font-code text-on-surface">core.tokens</span> during session revocation. This introduces deadlock risks during cold module initialization.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-outline">
            search
          </span>
          <input
            type="text"
            placeholder="Search package name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-container border border-surface-container-highest text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
          />
        </div>

        <div className="flex items-center gap-space-sm">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-surface-container border border-surface-container-highest text-xs text-on-surface focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="direct">Direct</option>
            <option value="transitive">Transitive</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-surface-container border border-surface-container-highest text-xs text-on-surface focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="up-to-date">Up to date</option>
            <option value="outdated">Outdated</option>
            <option value="vulnerable">Vulnerable</option>
            <option value="circular">Circular</option>
          </select>
        </div>
      </div>

      {/* Dependency Matrix Table */}
      <div className="rounded-xl border border-surface-container-high overflow-hidden shadow-sm">
        <table className="w-full text-left text-body-sm">
          <thead className="bg-surface-container-lowest border-b border-surface-container-high text-outline text-[11px] font-label-caps uppercase">
            <tr>
              <th className="px-4 py-3">Package &amp; Ecosystem</th>
              <th className="px-4 py-3">Dependency Type</th>
              <th className="px-4 py-3">Version Installed</th>
              <th className="px-4 py-3">Latest Upstream</th>
              <th className="px-4 py-3">License</th>
              <th className="px-4 py-3">Audit Status</th>
              <th className="px-4 py-3 text-right">Dependents</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high bg-surface-container-low">
            {filtered.map((dep) => (
              <tr key={dep.id} className="hover:bg-surface-container transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-outline text-[18px]">
                      inventory_2
                    </span>
                    <span className="font-code font-semibold text-on-surface">{dep.name}</span>
                    <span className="text-[10px] font-mono px-1 rounded bg-surface-container-highest text-outline uppercase">
                      {dep.ecosystem}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="capitalize text-outline font-code text-xs">{dep.type}</span>
                </td>
                <td className="px-4 py-3.5 font-code text-xs text-on-surface">
                  {dep.version}
                </td>
                <td className="px-4 py-3.5 font-code text-xs text-outline">
                  {dep.latestVersion}
                </td>
                <td className="px-4 py-3.5 font-code text-xs text-outline">
                  <span className="px-1.5 py-0.5 rounded bg-surface-container-highest">
                    {dep.license}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  {dep.status === 'vulnerable' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-error-container/30 text-error text-[11px] font-code font-semibold">
                      <span className="material-symbols-outlined text-[14px]">gpp_bad</span>
                      {dep.cveId || 'Vulnerable'}
                    </span>
                  ) : dep.status === 'circular' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[11px] font-code font-semibold">
                      <span className="material-symbols-outlined text-[14px]">sync_problem</span>
                      Circular
                    </span>
                  ) : dep.status === 'outdated' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-highest text-outline text-[11px] font-code">
                      <span className="material-symbols-outlined text-[14px]">update</span>
                      Outdated
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-container/20 text-primary-container text-[11px] font-code font-semibold">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Up to date
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right font-code text-xs text-outline">
                  {dep.dependentsCount} files
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
