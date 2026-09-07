import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { issueService } from '../services/api';
import { IssueItem } from '../types';
import { ScoreGauge } from '../components/common/ScoreGauge';

export const SecurityAnalysisPage: React.FC = () => {
  const { activeRepo } = useApp();
  const navigate = useNavigate();

  const [securityIssues, setSecurityIssues] = useState<IssueItem[]>([]);

  useEffect(() => {
    issueService.getIssues(activeRepo?.id).then((issues) => {
      setSecurityIssues(issues.filter((i) => i.category === 'Security'));
    });
  }, [activeRepo]);

  return (
    <div className="space-y-space-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
              Security &amp; Vulnerability Posture
            </h1>
            <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-error-container/30 text-error font-bold">
              3 VULNERABILITIES DETECTED
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Syntactic taint vectors and cryptographic audits.
          </p>
        </div>

        <button
          onClick={() => navigate('/issues/ISSUE-2041')}
          className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-error-container text-on-error-container font-headline-sm text-body-sm font-semibold transition-all shadow-glow-red self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">gpp_bad</span>
          <span>Inspect OSV 5.0.0.-2026 and SBOM</span>
        </button>
      </div>

      {/* Top Security Overview Score & Severity Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md">
        {/* Security Score Card */}
        <div className="md:col-span-4 p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high flex items-center gap-space-lg shadow-sm">
          <ScoreGauge score={68} size="lg" />
          <div className="flex flex-col">
            <span className="text-outline text-xs uppercase font-label-caps font-semibold">
              Security Index
            </span>
            <span className="text-xl font-bold font-code text-amber-400 mt-0.5">
              Moderate Risk
            </span>
            <span className="text-xs text-outline font-body-sm mt-1">
              2 Critical taint sinks require remediation before deployment.
            </span>
          </div>
        </div>

        {/* Severity Count Cards */}
        <div className="md:col-span-8 grid grid-cols-3 gap-space-md">
          <div className="p-space-md rounded-xl bg-surface-container-low border border-error/40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-outline text-xs uppercase font-label-caps font-semibold">
                Critical
              </span>
              <span className="material-symbols-outlined text-error text-[18px]">error</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-code text-error">2</div>
              <div className="text-xs text-error font-code mt-0.5">CWE-78, CWE-798</div>
            </div>
          </div>

          <div className="p-space-md rounded-xl bg-surface-container-low border border-amber-500/40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-outline text-xs uppercase font-label-caps font-semibold">
                High Severity
              </span>
              <span className="material-symbols-outlined text-amber-400 text-[18px]">warning</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-code text-amber-400">1</div>
              <div className="text-xs text-amber-400 font-code mt-0.5">CWE-330 (Crypto salt)</div>
            </div>
          </div>

          <div className="p-space-md rounded-xl bg-surface-container-low border border-primary-container/40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-outline text-xs uppercase font-label-caps font-semibold">
                Resolved
              </span>
              <span className="material-symbols-outlined text-primary-container text-[18px]">
                check_circle
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-code text-primary-container">14</div>
              <div className="text-xs text-primary-container font-code mt-0.5">Patched this cycle</div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Findings List */}
      <div className="space-y-space-sm">
        <h2 className="font-headline-md text-headline-md text-on-surface font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-error text-[20px]">
            security
          </span>
          Active Vulnerability Registry
        </h2>

        {securityIssues.map((vuln) => (
          <div
            key={vuln.id}
            onClick={() => navigate(`/issues/${vuln.id}`)}
            className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-container-high hover:border-error/40 transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-space-md"
          >
            <div className="flex items-start gap-space-md min-w-0">
              <div className="px-2.5 py-1 rounded bg-error-container/30 text-error border border-error/30 font-code text-xs font-bold uppercase flex-shrink-0">
                {vuln.severity}
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-code font-bold text-body-sm text-on-surface group-hover:text-primary-container transition-colors truncate">
                    {vuln.title}
                  </span>
                  <span className="font-code text-xs px-1.5 py-0.2 rounded bg-surface-container-highest text-primary-container font-mono">
                    {vuln.cwe}
                  </span>
                  {vuln.cve && (
                    <span className="font-code text-xs px-1.5 py-0.2 rounded bg-error-container/30 text-error font-mono font-semibold">
                      {vuln.cve}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1 text-xs text-outline font-code">
                  <span className="material-symbols-outlined text-[14px]">description</span>
                  <span>
                    {vuln.filePath}:{vuln.line}
                  </span>
                  <span>•</span>
                  <span>Blast Impact: {vuln.blastRadiusScore}%</span>
                </div>

                <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">
                  {vuln.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-space-sm flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/blast-radius');
                }}
                className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-surface-container-highest text-xs font-code text-on-surface transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">radar</span>
                <span>Trace Blast</span>
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container text-xs font-headline-sm font-semibold transition-all shadow-glow-lime">
                Inspect Code
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
