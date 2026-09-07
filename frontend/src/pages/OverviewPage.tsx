import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { ScoreGauge } from '../components/common/ScoreGauge';
import { StatusPill } from '../components/common/StatusPill';

export const OverviewPage: React.FC = () => {
  const { user, signOut, activeRepo, repositories, setActiveRepoId } = useApp();
  const navigate = useNavigate();

  const userDisplayName = user?.displayName || user?.email?.split('@')[0] || 'Developer';
  const userEmail = user?.email || 'developer@repolens.io';
  const userProvider = user?.provider || 'authenticated';

  return (
    <div className="space-y-space-xl">
      {/* Welcome Banner / Workspace Telemetry Header */}
      <div className="p-space-lg rounded-2xl bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-high border border-surface-container-highest flex flex-col md:flex-row md:items-center justify-between gap-space-lg shadow-lg relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-space-xs flex-wrap">
            <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-primary-container text-on-primary-container font-mono font-bold">
              WORKSPACE RADAR
            </span>
            <span className="text-xs font-code text-outline">
              User: <strong className="text-on-surface">{userDisplayName}</strong> ({userEmail})
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-container-highest text-primary-fixed-dim border border-primary-container/30 uppercase">
              {userProvider}
            </span>
          </div>

          <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold">
            Repository Intelligence &amp; Blast Control
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Active workspace with <strong className="text-on-surface">{repositories.length} monitored repositories</strong>.
            User-isolated AST parsing, architectural blast simulations, and continuous security auditing.
          </p>
        </div>

        <div className="flex items-center gap-space-sm z-10 self-start md:self-auto flex-wrap">
          <button
            onClick={() => navigate('/ingest')}
            className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container font-headline-sm text-body-sm font-semibold transition-all shadow-glow-lime"
          >
            <span className="material-symbols-outlined text-[18px]">add_link</span>
            <span>Ingest Repository</span>
          </button>
          
          <button
            onClick={() => navigate('/blast-radius')}
            className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface font-headline-sm text-body-sm font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">radar</span>
            <span>Simulate Blast</span>
          </button>

          {/* Sign Out Button in Header Card */}
          <button
            onClick={signOut}
            className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-error-container/20 hover:bg-error-container/40 text-error border border-error/30 font-headline-sm text-body-sm font-semibold transition-colors"
            title="Sign out of current account"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>

        {/* Decorative subtle background lens circle */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full border border-primary-container/10 pointer-events-none" />
      </div>

      {/* Critical Blast Alert Callout Banner */}
      <div
        onClick={() => navigate('/blast-radius')}
        className="p-space-md rounded-xl bg-error-container/20 border border-error/40 flex items-center justify-between cursor-pointer hover:bg-error-container/30 transition-all group"
      >
        <div className="flex items-center gap-space-md min-w-0">
          <div className="w-9 h-9 rounded-lg bg-error/20 flex items-center justify-center flex-shrink-0 text-error">
            <span className="material-symbols-outlined text-[20px] animate-pulse">warning</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-error">Active Blast Simulation on {activeRepo?.name || 'Codebase'}</span>
              <span className="font-code text-[11px] px-1.5 py-0.2 rounded bg-error/30 text-error font-mono">
                {activeRepo?.riskLevel || 'MODERATE'}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant truncate mt-0.5">
              Refactoring <code className="font-code text-on-surface">paymentService.js</code> cascades into 11 downstream files including 2 API endpoints.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-error text-xs font-code font-semibold flex-shrink-0">
          <span className="hidden sm:inline">Trace Ripple Matrix</span>
          <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </div>
      </div>

      {/* 4 Fleet Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div
          onClick={() => navigate('/repositories')}
          className="p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high hover:border-surface-container-highest cursor-pointer transition-all shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-outline text-xs uppercase font-label-caps font-semibold">
              Quality Score
            </span>
            <span className="material-symbols-outlined text-primary-container text-[20px]">
              insights
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold font-code text-on-surface">
                {activeRepo?.score ?? 82}
                <span className="text-xs font-normal text-outline">/100</span>
              </div>
              <div className="text-xs text-primary-fixed-dim font-code mt-0.5">
                {activeRepo?.riskLevel || 'Moderate Risk'}
              </div>
            </div>
            <ScoreGauge score={activeRepo?.score ?? 82} size="md" showLabel={false} />
          </div>
        </div>

        <div
          onClick={() => navigate('/security')}
          className="p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high hover:border-error/40 cursor-pointer transition-all shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-outline text-xs uppercase font-label-caps font-semibold">
              Security Vulnerabilities
            </span>
            <span className="material-symbols-outlined text-error text-[20px]">
              gpp_bad
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold font-code text-error">
              {activeRepo?.openIssuesCount ?? 3}
            </div>
            <div className="text-xs text-error font-code mt-0.5">
              1 Critical Secret &bull; 1 Cycle
            </div>
          </div>
        </div>

        <div
          onClick={() => navigate('/architecture')}
          className="p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high hover:border-secondary/40 cursor-pointer transition-all shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-outline text-xs uppercase font-label-caps font-semibold">
              AST Graph Nodes
            </span>
            <span className="material-symbols-outlined text-secondary text-[20px]">
              hub
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold font-code text-secondary">
              {activeRepo?.filesCount ? activeRepo.filesCount * 4 : 48}
            </div>
            <div className="text-xs text-outline font-code mt-0.5">
              Cross-module imports resolved
            </div>
          </div>
        </div>

        <div
          onClick={() => navigate('/testing')}
          className="p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high hover:border-primary-container/40 cursor-pointer transition-all shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-outline text-xs uppercase font-label-caps font-semibold">
              Test Recommendations
            </span>
            <span className="material-symbols-outlined text-primary-container text-[20px]">
              checklist
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold font-code text-primary-container">
              {activeRepo?.testCoverage ?? 76.5}%
            </div>
            <div className="text-xs text-primary-container font-code mt-0.5">
              Downstream blast tests mapped
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Monitored Codebases & Launchpad */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Left 7 Cols: Monitored Repositories */}
        <div className="lg:col-span-7 space-y-space-md">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-[20px]">
                folder_data
              </span>
              User Codebases ({repositories.length})
            </h2>
            <button
              onClick={() => navigate('/repositories')}
              className="text-xs font-code text-primary-container hover:underline"
            >
              View Full Fleet →
            </button>
          </div>

          <div className="space-y-space-sm">
            {repositories.map((repo) => (
              <div
                key={repo.id}
                onClick={() => {
                  setActiveRepoId(repo.id);
                  navigate('/architecture');
                }}
                className={`p-space-md rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  repo.id === activeRepo?.id
                    ? 'bg-surface-container border-primary-container/60 shadow-md ring-1 ring-primary-container/40'
                    : 'bg-surface-container-low border-surface-container-high hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-space-md min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center font-code text-xs font-bold text-primary-container border border-surface-container-highest flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px]">
                      {repo.isPrivate ? 'lock' : 'public'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-code font-semibold text-body-sm text-on-surface truncate">
                        {repo.name}
                      </span>
                      {repo.id === activeRepo?.id && (
                        <span className="font-label-caps text-[9px] px-1.5 py-0.2 rounded bg-primary-container text-on-primary-container font-bold">
                          ACTIVE CONTEXT
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-outline font-code mt-0.5">
                      {repo.language} • {repo.branch} ({repo.commitHash})
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-space-md flex-shrink-0">
                  <div className="hidden sm:flex flex-col text-right font-code text-xs">
                    <span className="text-on-surface font-semibold">{repo.blastVectorsCount} blast vectors</span>
                    <span className="text-outline text-[11px]">{repo.lastAnalyzed}</span>
                  </div>
                  <ScoreGauge score={repo.score} size="sm" />
                  <StatusPill status={repo.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 Cols: Quick Tools & Account Info */}
        <div className="lg:col-span-5 space-y-space-md">
          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">
              tune
            </span>
            Analysis Launchpad
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
            <div
              onClick={() => navigate('/architecture')}
              className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-container-high cursor-pointer transition-all space-y-2 group"
            >
              <span className="material-symbols-outlined text-secondary text-[24px] group-hover:scale-110 transition-transform">
                hub
              </span>
              <div className="font-semibold text-body-sm text-on-surface group-hover:text-secondary transition-colors">
                Architecture Topology
              </div>
              <p className="text-xs text-outline">
                Explore structural graph layers, modules, and coupling metrics.
              </p>
            </div>

            <div
              onClick={() => navigate('/blast-radius')}
              className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-container-high cursor-pointer transition-all space-y-2 group"
            >
              <span className="material-symbols-outlined text-primary-container text-[24px] group-hover:scale-110 transition-transform">
                radar
              </span>
              <div className="font-semibold text-body-sm text-on-surface group-hover:text-primary-container transition-colors">
                Blast Radius Analyzer
              </div>
              <p className="text-xs text-outline">
                Simulate component change cascade across endpoints and tests.
              </p>
            </div>

            <div
              onClick={() => navigate('/issues')}
              className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-container-high cursor-pointer transition-all space-y-2 group"
            >
              <span className="material-symbols-outlined text-error text-[24px] group-hover:scale-110 transition-transform">
                bug_report
              </span>
              <div className="font-semibold text-body-sm text-on-surface group-hover:text-error transition-colors">
                Vulnerability Taint
              </div>
              <p className="text-xs text-outline">
                Audit CWE-78 command injection &amp; cryptographic weaknesses.
              </p>
            </div>

            <div
              onClick={() => navigate('/ai-assistant')}
              className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-container-high cursor-pointer transition-all space-y-2 group"
            >
              <span className="material-symbols-outlined text-primary-container text-[24px] group-hover:scale-110 transition-transform">
                smart_toy
              </span>
              <div className="font-semibold text-body-sm text-on-surface group-hover:text-primary-container transition-colors">
                RepoLens Code AI
              </div>
              <p className="text-xs text-outline">
                Query AST semantic graph with Gemini explanation engine.
              </p>
            </div>
          </div>

          {/* User Account & Security Card */}
          <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-outline uppercase font-semibold text-[10px] font-label-caps">
                SESSION SECURITY
              </span>
              <span className="text-primary-container font-code text-xs font-bold">
                Isolated Workspace
              </span>
            </div>
            
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center font-code text-xs font-bold text-primary-container border border-surface-container-highest flex-shrink-0">
                  {userDisplayName.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-xs text-on-surface truncate">
                    {userDisplayName}
                  </span>
                  <span className="text-[11px] font-code text-outline truncate">
                    {userEmail}
                  </span>
                </div>
              </div>

              <button
                onClick={signOut}
                className="px-3 py-1.5 rounded-lg bg-error-container/20 hover:bg-error-container/40 text-error border border-error/30 text-xs font-code font-semibold transition-colors flex items-center gap-1.5 flex-shrink-0"
              >
                <span className="material-symbols-outlined text-[14px]">logout</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
