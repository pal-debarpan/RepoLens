import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radar,
  FolderGit2,
  Lock,
  Globe,
  Network,
  ShieldAlert,
  Bot,
  Activity,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context';

export const OverviewPage: React.FC = () => {
  const { activeRepo, repositories, setActiveRepoId, theme } = useApp();
  const navigate = useNavigate();

  const isDark = theme !== 'light';

  // Animation and counter orchestration
  const [healthScore, setHealthScore] = useState(0);
  const [vulnCount, setVulnCount] = useState(0);
  const [graphCount, setGraphCount] = useState(0);
  const [coverageScore, setCoverageScore] = useState(0);

  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || hasAnimatedRef.current) {
      setHealthScore(activeRepo?.score ?? 76);
      setVulnCount(activeRepo?.openIssuesCount ?? 8);
      setGraphCount(4210);
      setCoverageScore(activeRepo?.testCoverage ?? 84.5);
      return;
    }

    hasAnimatedRef.current = true;

    // Sequence: Hero Fleet Health Ring & Number Count-up (100ms - 1300ms, ease-out)
    const targetHealth = activeRepo?.score ?? 76;
    const targetVulns = activeRepo?.openIssuesCount ?? 8;
    const targetGraph = 4210;
    const targetCoverage = activeRepo?.testCoverage ?? 84.5;

    const startTime = performance.now();
    const duration = 1200;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic curve: 1 - (1 - t)^3
      const ease = 1 - Math.pow(1 - progress, 3);

      setHealthScore(Math.round(targetHealth * ease));
      setVulnCount(Math.round(targetVulns * ease));
      setGraphCount(Math.round(targetGraph * ease));
      setCoverageScore(Number((targetCoverage * ease).toFixed(1)));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const timer = setTimeout(() => {
      requestAnimationFrame(step);
    }, 100);

    return () => clearTimeout(timer);
  }, [activeRepo?.score, activeRepo?.openIssuesCount, activeRepo?.testCoverage]);

  // SVG Ring Calculations for Fleet Health Hero
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  return (
    <div className="space-y-6 pb-12 transition-colors duration-300">
      {/* 1. HERO WORKSPACE HEADER */}
      <div
        className={`p-6 sm:p-7 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
          isDark
            ? 'bg-[rgba(10,18,15,0.60)] backdrop-blur-[12px] border-[rgba(140,255,40,0.14)] shadow-[0_4px_24px_rgba(0,0,0,0.35)]'
            : 'bg-[#FAF6EE] border-[#E2DAC7] shadow-[0_2px_16px_rgba(0,0,0,0.04)]'
        }`}
      >
        {/* Subtle background ambient line grid */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded tracking-widest uppercase transition-colors ${
                  isDark
                    ? 'bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/30'
                    : 'bg-[#046C4E]/10 text-[#046C4E] border border-[#046C4E]/25'
                }`}
              >
                WORKSPACE RADAR
              </span>
              <span
                className={`text-xs font-mono transition-colors ${
                  isDark ? 'text-[#7D8878]' : 'text-[#6E7866]'
                }`}
              >
                Target Context:{' '}
                <span
                  className={`font-semibold ${
                    isDark ? 'text-[#E4E8E1]' : 'text-[#181D17]'
                  }`}
                >
                  {activeRepo?.name ?? 'payments-core'}
                </span>{' '}
                <span className="opacity-60">({activeRepo?.branch ?? 'main'})</span>
              </span>
            </div>

            <h1
              className={`text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight transition-colors ${
                isDark ? 'text-[#E4E8E1]' : 'text-[#181D17]'
              }`}
            >
              Repository Intelligence &amp; Blast Control
            </h1>

            <p
              className={`text-xs sm:text-sm max-w-2xl leading-relaxed transition-colors ${
                isDark ? 'text-[#A2ADA0]' : 'text-[#586252]'
              }`}
            >
              Deterministic topological analysis across{' '}
              <strong className={isDark ? 'text-[#E4E8E1]' : 'text-[#181D17]'}>
                {repositories.length} codebases
              </strong>
              . Trace AST symbol dependencies, breaking API boundaries, and change
              blast propagation before merge.
            </p>
          </div>

          {/* Header Action Buttons & Theme Quick Toggle */}
          <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/blast-radius')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 ${
                isDark
                  ? 'bg-[#a3e635] hover:bg-[#bbf451] text-[#0D0F0C] shadow-[0_0_18px_rgba(163,230,53,0.25)] focus-visible:ring-[#a3e635]'
                  : 'bg-[#046C4E] hover:bg-[#03533C] text-[#FFFFFF] shadow-sm focus-visible:ring-[#046C4E]'
              }`}
            >
              <Radar size={16} strokeWidth={2} />
              <span>Simulate Blast Radius</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CRITICAL BLAST ALERT CALLOUT BANNER (Single attention mount pulse, then settles) */}
      <div
        onClick={() => navigate('/blast-radius')}
        className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer group animate-mount-alert backdrop-blur-[12px] ${
          isDark
            ? 'bg-[#e05252]/10 border-[#e05252]/30 hover:border-[#e05252]/50 hover:bg-[#e05252]/15'
            : 'bg-[#c53030]/08 border-[#c53030]/25 hover:border-[#c53030]/45 hover:bg-[#c53030]/12'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                isDark
                  ? 'bg-[#e05252]/20 text-[#e05252]'
                  : 'bg-[#c53030]/15 text-[#c53030]'
              }`}
            >
              <ShieldAlert size={19} strokeWidth={2} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span
                  className={`font-sans font-bold text-sm tracking-tight ${
                    isDark ? 'text-[#fca5a5]' : 'text-[#b91c1c]'
                  }`}
                >
                  14 Active Blast Vectors in Critical Path
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded tracking-wide uppercase ${
                    isDark
                      ? 'bg-[#e05252]/25 text-[#fecaca] border border-[#e05252]/40'
                      : 'bg-[#c53030]/15 text-[#991b1b] border border-[#c53030]/30'
                  }`}
                >
                  HIGH RIPPLE
                </span>
              </div>
              <p
                className={`text-xs mt-0.5 font-sans truncate ${
                  isDark ? 'text-[#A2ADA0]' : 'text-[#586252]'
                }`}
              >
                Refactoring{' '}
                <code
                  className={`font-mono px-1 py-0.5 rounded text-[11px] ${
                    isDark
                      ? 'bg-[#1E231D] text-[#E4E8E1]'
                      : 'bg-[#E8E0D0] text-[#181D17]'
                  }`}
                >
                  services/auth_service.py
                </code>{' '}
                cascades into 4 API endpoints and 7 test suites.
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 text-xs font-mono font-semibold flex-shrink-0 self-end sm:self-auto transition-colors ${
              isDark ? 'text-[#fca5a5]' : 'text-[#b91c1c]'
            }`}
          >
            <span>Trace Ripple Matrix</span>
            <ArrowRight
              size={14}
              strokeWidth={2}
              className="group-hover:translate-x-1 transition-transform"
            />
          </div>
        </div>
      </div>

      {/* 3. 4 KPI STAT CARDS WITH PROVEN HIERARCHY */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
        {/* CARD 1: FLEET HEALTH INDEX (HERO METRIC — 4 Cols on Large Screen, elevated prominence) */}
        <div
          onClick={() => navigate('/repositories')}
          className={`lg:col-span-4 p-6 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            isDark
              ? 'bg-[rgba(10,18,15,0.65)] backdrop-blur-[12px] border-[rgba(140,255,40,0.14)] hover:border-[#a3e635]/50 shadow-[0_4px_20px_rgba(0,0,0,0.35)]'
              : 'bg-[#FFFFFF] border-[#E2DAC7] hover:border-[#046C4E]/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-sans font-semibold tracking-wider uppercase ${
                isDark ? 'text-[#7D8878]' : 'text-[#6E7866]'
              }`}
            >
              Fleet Health Index
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded tracking-wide ${
                healthScore >= 70
                  ? isDark
                    ? 'bg-[#a3e635]/15 text-[#a3e635]'
                    : 'bg-[#046C4E]/10 text-[#046C4E]'
                  : isDark
                  ? 'bg-[#f59e0b]/15 text-[#f59e0b]'
                  : 'bg-[#b45309]/10 text-[#b45309]'
              }`}
            >
              STABLE DRIFT
            </span>
          </div>

          <div className="my-5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-4xl sm:text-5xl font-heading font-bold tracking-tight ${
                    isDark ? 'text-[#E4E8E1]' : 'text-[#181D17]'
                  }`}
                >
                  {healthScore}
                </span>
                <span
                  className={`text-sm font-heading font-medium ${
                    isDark ? 'text-[#7D8878]' : 'text-[#6E7866]'
                  }`}
                >
                  /100
                </span>
              </div>
              <p
                className={`text-xs mt-1 ${
                  isDark ? 'text-[#a3e635]' : 'text-[#046C4E]'
                }`}
              >
                Topological score: Nominal
              </p>
              <p
                className={`text-[11px] mt-0.5 ${
                  isDark ? 'text-[#7D8878]' : 'text-[#6E7866]'
                }`}
              >
                3 monitored repositories synced
              </p>
            </div>

            {/* Orchestrated Fleet Health SVG Ring */}
            <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                {/* Background Ring Track */}
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  fill="none"
                  strokeWidth="7"
                  className={isDark ? 'stroke-[#1E231D]' : 'stroke-[#E8E0D0]'}
                />
                {/* Animated Value Stroke */}
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  fill="none"
                  stroke={isDark ? '#a3e635' : '#046C4E'}
                  strokeWidth="7"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-[stroke-dashoffset] duration-75 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <Activity
                  size={18}
                  className={isDark ? 'text-[#a3e635]' : 'text-[#046C4E]'}
                />
              </div>
            </div>
          </div>

          <div
            className={`pt-3 border-t text-[11px] font-mono flex items-center justify-between ${
              isDark
                ? 'border-[#1E231D] text-[#7D8878]'
                : 'border-[#E8E0D0] text-[#6E7866]'
            }`}
          >
            <span>AST drift: &lt; 2.4%</span>
            <span className={isDark ? 'text-[#a3e635]' : 'text-[#046C4E]'}>
              Audit Passed
            </span>
          </div>
        </div>

        {/* CARD 2: SECURITY VULNERABILITIES (Desaturated Instrument Red — 8) */}
        <div
          onClick={() => navigate('/security')}
          className={`lg:col-span-3 p-6 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            isDark
              ? 'bg-[rgba(10,18,15,0.65)] backdrop-blur-[12px] border-[rgba(140,255,40,0.14)] hover:border-[#e05252]/50 shadow-[0_4px_20px_rgba(0,0,0,0.35)]'
              : 'bg-[#FFFFFF] border-[#E2DAC7] hover:border-[#c53030]/50 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-sans font-semibold tracking-wider uppercase ${
                isDark ? 'text-[#7D8878]' : 'text-[#6E7866]'
              }`}
            >
              Security Findings
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isDark
                  ? 'bg-[#e05252]/15 text-[#e05252]'
                  : 'bg-[#c53030]/10 text-[#c53030]'
              }`}
            >
              <ShieldAlert size={16} strokeWidth={2} />
            </div>
          </div>

          <div className="my-4">
            <div
              className={`text-3xl sm:text-4xl font-heading font-bold tracking-tight ${
                isDark ? 'text-[#e05252]' : 'text-[#c53030]'
              }`}
            >
              {vulnCount}
            </div>
            <div
              className={`text-xs font-semibold mt-1 ${
                isDark ? 'text-[#e05252]' : 'text-[#c53030]'
              }`}
            >
              2 Critical (CWE-78, CWE-798)
            </div>
            <p
              className={`text-[11px] mt-0.5 ${
                isDark ? 'text-[#7D8878]' : 'text-[#6E7866]'
              }`}
            >
              Tainted data flows detected in backend
            </p>
          </div>

          <div
            className={`pt-3 border-t text-[11px] font-mono flex items-center justify-between ${
              isDark
                ? 'border-[#1E231D] text-[#7D8878]'
                : 'border-[#E8E0D0] text-[#6E7866]'
            }`}
          >
            <span>CVSS Severity: High</span>
            <span className={isDark ? 'text-[#e05252]' : 'text-[#c53030]'}>
              Audit Required
            </span>
          </div>
        </div>

        {/* CARD 3: GRAPH ENTITIES (Topological Blue Telemetry — 4,210) */}
        <div
          onClick={() => navigate('/architecture')}
          className={`lg:col-span-2 p-6 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            isDark
              ? 'bg-[rgba(10,18,15,0.65)] backdrop-blur-[12px] border-[rgba(140,255,40,0.14)] hover:border-[#38bdf8]/50 shadow-[0_4px_20px_rgba(0,0,0,0.35)]'
              : 'bg-[#FFFFFF] border-[#E2DAC7] hover:border-[#0284c7]/50 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-sans font-semibold tracking-wider uppercase ${
                isDark ? 'text-[#7D8878]' : 'text-[#6E7866]'
              }`}
            >
              Graph Nodes
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isDark
                  ? 'bg-[#38bdf8]/15 text-[#38bdf8]'
                  : 'bg-[#0284c7]/10 text-[#0284c7]'
              }`}
            >
              <Network size={16} strokeWidth={2} />
            </div>
          </div>

          <div className="my-4">
            <div
              className={`text-3xl sm:text-4xl font-heading font-bold tracking-tight ${
                isDark ? 'text-[#38bdf8]' : 'text-[#0284c7]'
              }`}
            >
              {graphCount.toLocaleString()}
            </div>
            <div
              className={`text-xs mt-1 ${
                isDark ? 'text-[#7D8878]' : 'text-[#6E7866]'
              }`}
            >
              18,920 AST edges
            </div>
          </div>

          <div
            className={`pt-3 border-t text-[11px] font-mono flex items-center justify-between ${
              isDark
                ? 'border-[#1E231D] text-[#7D8878]'
                : 'border-[#E8E0D0] text-[#6E7866]'
            }`}
          >
            <span>Cross-module</span>
            <span className={isDark ? 'text-[#38bdf8]' : 'text-[#0284c7]'}>
              100% Parsed
            </span>
          </div>
        </div>

        {/* CARD 4: TEST COVERAGE (Targeted Suites — 84.5%) */}
        <div
          onClick={() => navigate('/testing')}
          className={`lg:col-span-3 p-6 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            isDark
              ? 'bg-[rgba(10,18,15,0.65)] backdrop-blur-[12px] border-[rgba(140,255,40,0.14)] hover:border-[#a3e635]/50 shadow-[0_4px_20px_rgba(0,0,0,0.35)]'
              : 'bg-[#FFFFFF] border-[#E2DAC7] hover:border-[#046C4E]/50 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-sans font-semibold tracking-wider uppercase ${
                isDark ? 'text-[#7D8878]' : 'text-[#6E7866]'
              }`}
            >
              Test Coverage
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isDark
                  ? 'bg-[#a3e635]/15 text-[#a3e635]'
                  : 'bg-[#046C4E]/10 text-[#046C4E]'
              }`}
            >
              <Sparkles size={16} strokeWidth={2} />
            </div>
          </div>

          <div className="my-4">
            <div
              className={`text-3xl sm:text-4xl font-heading font-bold tracking-tight ${
                isDark ? 'text-[#a3e635]' : 'text-[#046C4E]'
              }`}
            >
              {coverageScore}%
            </div>
            <div
              className={`text-xs mt-1 ${
                isDark ? 'text-[#a3e635]' : 'text-[#046C4E]'
              }`}
            >
              4 targeted suites ready
            </div>
            <p
              className={`text-[11px] mt-0.5 ${
                isDark ? 'text-[#7D8878]' : 'text-[#6E7866]'
              }`}
            >
              Zero regressions in critical path
            </p>
          </div>

          <div
            className={`pt-3 border-t text-[11px] font-mono flex items-center justify-between ${
              isDark
                ? 'border-[#1E231D] text-[#7D8878]'
                : 'border-[#E8E0D0] text-[#6E7866]'
            }`}
          >
            <span>Change Impact</span>
            <span className={isDark ? 'text-[#a3e635]' : 'text-[#046C4E]'}>
              Optimal
            </span>
          </div>
        </div>
      </div>

      {/* 4. MAIN CONTENT GRID: MONITORED CODEBASES & ANALYSIS LAUNCHPAD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT 7 COLS: MONITORED CODEBASES SNAPSHOT */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2
              className={`font-heading font-bold text-base flex items-center gap-2.5 ${
                isDark ? 'text-[#E4E8E1]' : 'text-[#181D17]'
              }`}
            >
              <FolderGit2
                size={18}
                strokeWidth={2}
                className={isDark ? 'text-[#a3e635]' : 'text-[#046C4E]'}
              />
              <span>Monitored Codebases ({repositories.length})</span>
            </h2>

            <button
              type="button"
              onClick={() => navigate('/repositories')}
              className={`text-xs font-mono font-semibold transition-colors hover:underline ${
                isDark ? 'text-[#a3e635]' : 'text-[#046C4E]'
              }`}
            >
              View Full Fleet
            </button>
          </div>

          {/* Repo List Rows (Left-to-Right reading order, live active dot, fast scanning) */}
          <div className="space-y-2.5">
            {repositories.map((repo, idx) => {
              const isSelected = repo.id === activeRepo?.id;
              const isActiveStatus = repo.status === 'Active';

              return (
                <div
                  key={`${repo.id}-${idx}`}
                  onClick={() => {
                    setActiveRepoId(repo.id);
                    navigate('/architecture');
                  }}
                  className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? isDark
                        ? 'bg-[rgba(10,18,15,0.70)] backdrop-blur-[12px] border-[#a3e635]/40 ring-1 ring-[#a3e635]/25 shadow-sm'
                        : 'bg-[#F2ECE0] border-[#046C4E]/40 ring-1 ring-[#046C4E]/25 shadow-sm'
                      : isDark
                      ? 'bg-[rgba(10,18,15,0.52)] backdrop-blur-[12px] border-[rgba(140,255,40,0.14)] hover:border-[rgba(140,255,40,0.30)] hover:bg-[rgba(10,18,15,0.65)]'
                      : 'bg-[#FFFFFF] border-[#E2DAC7] hover:border-[#D0C5AF] hover:bg-[#FAF6EE]'
                  }`}
                >
                  {/* Left Group: Access Icon, Name, Language, Commit */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Lock / Globe Access Icon */}
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border transition-colors ${
                        isDark
                          ? 'bg-[rgba(10,18,15,0.60)] border-[rgba(140,255,40,0.12)] text-[#7D8878]'
                          : 'bg-[#F7F3E9] border-[#E2DAC7] text-[#6E7866]'
                      }`}
                      title={repo.isPrivate ? 'Private Repository' : 'Public Repository'}
                    >
                      {repo.isPrivate ? (
                        <Lock size={15} strokeWidth={1.8} />
                      ) : (
                        <Globe size={15} strokeWidth={1.8} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-semibold text-sm truncate ${
                            isDark ? 'text-[#E4E8E1]' : 'text-[#181D17]'
                          }`}
                        >
                          {repo.name}
                        </span>

                        {isSelected && (
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                              isDark
                                ? 'bg-[#a3e635]/20 text-[#a3e635]'
                                : 'bg-[#046C4E]/15 text-[#046C4E]'
                            }`}
                          >
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <div
                        className={`text-xs font-mono mt-0.5 flex items-center gap-2 ${
                          isDark ? 'text-[#7D8878]' : 'text-[#6E7866]'
                        }`}
                      >
                        <span>{repo.language}</span>
                        <span>•</span>
                        <span className="opacity-85">{repo.branch}</span>
                        <span className="opacity-60 hidden sm:inline">
                          ({repo.commitHash})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Group: Blast Vector Count, Last Analyzed, Status Pill */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="hidden sm:flex flex-col text-right font-mono text-xs">
                      <span
                        className={`font-semibold ${
                          repo.blastVectorsCount > 10
                            ? isDark
                              ? 'text-[#e05252]'
                              : 'text-[#c53030]'
                            : isDark
                            ? 'text-[#E4E8E1]'
                            : 'text-[#181D17]'
                        }`}
                      >
                        {repo.blastVectorsCount} blast vectors
                      </span>
                      <span
                        className={`text-[11px] ${
                          isDark ? 'text-[#7D8878]' : 'text-[#6E7866]'
                        }`}
                      >
                        {repo.lastAnalyzed}
                      </span>
                    </div>

                    {/* Status Pill with Slow Subtle Live Dot Pulse */}
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${
                        isActiveStatus
                          ? isDark
                            ? 'bg-[#a3e635]/10 text-[#a3e635] border-[#a3e635]/25'
                            : 'bg-[#046C4E]/10 text-[#046C4E] border-[#046C4E]/25'
                          : isDark
                          ? 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/25'
                          : 'bg-[#b45309]/10 text-[#b45309] border-[#b45309]/25'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActiveStatus
                            ? isDark
                              ? 'bg-[#a3e635] animate-live-dot'
                              : 'bg-[#046C4E] animate-live-dot'
                            : isDark
                            ? 'bg-[#f59e0b]'
                            : 'bg-[#b45309]'
                        }`}
                      />
                      <span>{repo.status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT 5 COLS: ANALYSIS LAUNCHPAD GRID & SYSTEM TELEMETRY */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2
              className={`font-heading font-bold text-base flex items-center gap-2.5 ${
                isDark ? 'text-[#E4E8E1]' : 'text-[#181D17]'
              }`}
            >
              <Radar
                size={18}
                strokeWidth={2}
                className={isDark ? 'text-[#a3e635]' : 'text-[#046C4E]'}
              />
              <span>Analysis Launchpad</span>
            </h2>
          </div>

          {/* Functionally Distinct Tool Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Architecture Topology */}
            <div
              onClick={() => navigate('/architecture')}
              className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer space-y-2 group ${
                isDark
                  ? 'bg-[rgba(10,18,15,0.60)] backdrop-blur-[12px] border-[rgba(140,255,40,0.14)] hover:border-[#38bdf8]/50 hover:bg-[rgba(10,18,15,0.70)]'
                  : 'bg-[#FFFFFF] border-[#E2DAC7] hover:border-[#0284c7]/50 hover:bg-[#FAF6EE]'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDark
                    ? 'bg-[#38bdf8]/15 text-[#38bdf8]'
                    : 'bg-[#0284c7]/10 text-[#0284c7]'
                }`}
              >
                <Network size={17} strokeWidth={1.8} />
              </div>
              <div
                className={`font-sans font-semibold text-xs tracking-tight ${
                  isDark ? 'text-[#E4E8E1]' : 'text-[#181D17]'
                }`}
              >
                Architecture Topology
              </div>
              <p
                className={`text-[11.5px] leading-relaxed ${
                  isDark ? 'text-[#7D8878]' : 'text-[#6E7866]'
                }`}
              >
                Structural graph layers, module boundaries, and coupling metrics.
              </p>
            </div>

            {/* 2. Blast Radius Analyzer */}
            <div
              onClick={() => navigate('/blast-radius')}
              className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer space-y-2 group ${
                isDark
                  ? 'bg-[rgba(10,18,15,0.60)] backdrop-blur-[12px] border-[rgba(140,255,40,0.14)] hover:border-[#a3e635]/50 hover:bg-[rgba(10,18,15,0.70)]'
                  : 'bg-[#FFFFFF] border-[#E2DAC7] hover:border-[#046C4E]/50 hover:bg-[#FAF6EE]'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDark
                    ? 'bg-[#a3e635]/15 text-[#a3e635]'
                    : 'bg-[#046C4E]/10 text-[#046C4E]'
                }`}
              >
                <Radar size={17} strokeWidth={1.8} />
              </div>
              <div
                className={`font-sans font-semibold text-xs tracking-tight ${
                  isDark ? 'text-[#E4E8E1]' : 'text-[#181D17]'
                }`}
              >
                Blast Radius Analyzer
              </div>
              <p
                className={`text-[11.5px] leading-relaxed ${
                  isDark ? 'text-[#7D8878]' : 'text-[#6E7866]'
                }`}
              >
                Simulate component change cascade across endpoints and test suites.
              </p>
            </div>

            {/* 3. Vulnerability Taint */}
            <div
              onClick={() => navigate('/security')}
              className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer space-y-2 group ${
                isDark
                  ? 'bg-[rgba(10,18,15,0.60)] backdrop-blur-[12px] border-[rgba(140,255,40,0.14)] hover:border-[#e05252]/50 hover:bg-[rgba(10,18,15,0.70)]'
                  : 'bg-[#FFFFFF] border-[#E2DAC7] hover:border-[#c53030]/50 hover:bg-[#FAF6EE]'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDark
                    ? 'bg-[#e05252]/15 text-[#e05252]'
                    : 'bg-[#c53030]/10 text-[#c53030]'
                }`}
              >
                <ShieldAlert size={17} strokeWidth={1.8} />
              </div>
              <div
                className={`font-sans font-semibold text-xs tracking-tight ${
                  isDark ? 'text-[#E4E8E1]' : 'text-[#181D17]'
                }`}
              >
                Vulnerability Taint
              </div>
              <p
                className={`text-[11.5px] leading-relaxed ${
                  isDark ? 'text-[#7D8878]' : 'text-[#6E7866]'
                }`}
              >
                Audit CWE command injections, tainted data sinks, and secrets.
              </p>
            </div>

            {/* 4. RepoLens Code AI */}
            <div
              onClick={() => navigate('/ai-assistant')}
              className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer space-y-2 group ${
                isDark
                  ? 'bg-[rgba(10,18,15,0.60)] backdrop-blur-[12px] border-[rgba(140,255,40,0.14)] hover:border-[#a3e635]/50 hover:bg-[rgba(10,18,15,0.70)]'
                  : 'bg-[#FFFFFF] border-[#E2DAC7] hover:border-[#046C4E]/50 hover:bg-[#FAF6EE]'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDark
                    ? 'bg-[#a3e635]/15 text-[#a3e635]'
                    : 'bg-[#046C4E]/10 text-[#046C4E]'
                }`}
              >
                <Bot size={17} strokeWidth={1.8} />
              </div>
              <div
                className={`font-sans font-semibold text-xs tracking-tight ${
                  isDark ? 'text-[#E4E8E1]' : 'text-[#181D17]'
                }`}
              >
                RepoLens Code AI
              </div>
              <p
                className={`text-[11.5px] leading-relaxed ${
                  isDark ? 'text-[#7D8878]' : 'text-[#6E7866]'
                }`}
              >
                Query semantic AST graph, auto-generate patches, and explain debt.
              </p>
            </div>
          </div>

          {/* Quick System Telemetry Card */}
          <div
            className={`p-4 rounded-xl border space-y-2 ${
              isDark
                ? 'bg-[rgba(10,18,15,0.60)] backdrop-blur-[12px] border-[rgba(140,255,40,0.14)]'
                : 'bg-[#FFFFFF] border-[#E2DAC7]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isDark
                      ? 'bg-[#a3e635] animate-live-dot'
                      : 'bg-[#046C4E] animate-live-dot'
                  }`}
                />
                <span
                  className={`font-semibold ${
                    isDark ? 'text-[#A2ADA0]' : 'text-[#586252]'
                  }`}
                >
                  AST Daemon Telemetry
                </span>
              </div>
              <span
                className={`font-bold ${
                  isDark ? 'text-[#a3e635]' : 'text-[#046C4E]'
                }`}
              >
                v4.9 Active
              </span>
            </div>

            <div
              className={`text-xs font-mono ${
                isDark ? 'text-[#7D8878]' : 'text-[#6E7866]'
              }`}
            >
              Buffer:{' '}
              <strong className={isDark ? 'text-[#E4E8E1]' : 'text-[#181D17]'}>
                412 MB RSS
              </strong>{' '}
              • Throughput:{' '}
              <strong className={isDark ? 'text-[#E4E8E1]' : 'text-[#181D17]'}>
                2,840 tok/s
              </strong>
            </div>

            <button
              type="button"
              onClick={() => navigate('/progress')}
              className={`text-xs font-mono font-semibold hover:underline block pt-1 ${
                isDark ? 'text-[#a3e635]' : 'text-[#046C4E]'
              }`}
            >
              Open Live Pipeline Streamer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
