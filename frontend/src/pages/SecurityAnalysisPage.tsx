import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { issueService, analysisService } from '../services/api';
import { MOCK_VULNERABILITIES } from '../services/mockData';
import { IssueItem, VulnerabilitiesData } from '../types';
import { ScoreGauge } from '../components/common/ScoreGauge';

export const SecurityAnalysisPage: React.FC = () => {
  const { activeRepo } = useApp();
  const navigate = useNavigate();

  const [securityIssues, setSecurityIssues] = useState<IssueItem[]>([]);
  const [vulnData, setVulnData] = useState<VulnerabilitiesData>(MOCK_VULNERABILITIES);
  const [securityScore, setSecurityScore] = useState<number>(68);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [issues, analysisId] = await Promise.all([
          issueService.getIssues(activeRepo?.id),
          analysisService.getAnalysisIdForRepo(activeRepo?.id),
        ]);

        if (!isMounted) return;
        setSecurityIssues(issues.filter((i) => i.category === 'Security'));

        if (analysisId) {
          const [vulnRes, qualityRes] = await Promise.all([
            analysisService.getVulnerabilities(analysisId),
            analysisService.getQuality(analysisId).catch(() => null),
          ]);

          if (isMounted) {
            if (vulnRes) setVulnData(vulnRes);
            if (qualityRes?.characteristics) {
              const secChar = qualityRes.characteristics.find((c: any) => c.key === 'security');
              if (secChar && typeof secChar.score === 'number') {
                setSecurityScore(Math.round(secChar.score));
              }
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load security analysis data:', err);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeRepo]);

  const totalVulnsCount = (vulnData?.total_vulnerabilities || 0) + (securityIssues.length || 0);

  const getSeverityBadgeClass = (severity?: string | null) => {
    const s = (severity || '').toUpperCase();
    if (s.includes('CRIT')) return 'bg-error-container/30 text-error border-error/30';
    if (s.includes('HIGH')) return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    if (s.includes('MED')) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
    return 'bg-secondary-container/30 text-secondary border-secondary/30';
  };

  return (
    <div className="space-y-space-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs flex-wrap">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
              Security &amp; Vulnerability Posture
            </h1>
            <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-error-container/30 text-error font-mono font-bold">
              {totalVulnsCount} VULNERABILITIES DETECTED
            </span>
            {vulnData?.osv_available && (
              <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-primary-container/20 text-primary-container font-mono text-xs border border-primary-container/30">
                OSV.DEV SYNCED
              </span>
            )}
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Open Source Vulnerability (OSV) query matching, taint vectors, and blast radius for{' '}
            <span className="font-code text-on-surface font-semibold">{activeRepo?.name}</span>.
          </p>
        </div>

        <button
          onClick={() => navigate('/blast-radius')}
          className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high border border-surface-container-highest text-on-surface font-headline-sm text-body-sm font-semibold transition-all shadow-sm self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">radar</span>
          <span>Open Blast Radius</span>
        </button>
      </div>

      {/* Top Security Overview Score & Severity Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md">
        {/* Security Score Card */}
        <div className="md:col-span-4 p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high flex items-center gap-space-lg shadow-sm">
          <ScoreGauge score={securityScore} size="lg" />
          <div className="flex flex-col">
            <span className="text-outline text-xs uppercase font-label-caps font-semibold">
              Security Index
            </span>
            <span className={`text-xl font-bold font-code mt-0.5 ${securityScore >= 80 ? 'text-primary-container' : securityScore >= 60 ? 'text-amber-400' : 'text-error'}`}>
              {securityScore >= 80 ? 'Low Risk' : securityScore >= 60 ? 'Moderate Risk' : 'Critical Risk'}
            </span>
            <span className="text-xs text-outline font-body-sm mt-1">
              Calculated from static AST taint sinks &amp; OSV dependency advisory penalties.
            </span>
          </div>
        </div>

        {/* Severity Count Cards */}
        <div className="md:col-span-8 grid grid-cols-3 gap-space-md">
          <div className="p-space-md rounded-xl bg-surface-container-low border border-error/40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-outline text-xs uppercase font-label-caps font-semibold">
                Critical / High
              </span>
              <span className="material-symbols-outlined text-error text-[18px]">error</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-code text-error">
                {(vulnData?.total_vulnerabilities || 0) + securityIssues.filter(i => i.severity === 'Critical' || i.severity === 'High').length}
              </div>
              <div className="text-xs text-error font-code mt-0.5">Direct &amp; AST vectors</div>
            </div>
          </div>

          <div className="p-space-md rounded-xl bg-surface-container-low border border-amber-500/40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-outline text-xs uppercase font-label-caps font-semibold">
                Packages Scanned
              </span>
              <span className="material-symbols-outlined text-amber-400 text-[18px]">inventory_2</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-code text-amber-400">
                {vulnData?.packages_scanned ?? 0}
              </div>
              <div className="text-xs text-amber-400 font-code mt-0.5">
                {vulnData?.vulnerable_packages?.length ?? 0} vulnerable packages
              </div>
            </div>
          </div>

          <div className="p-space-md rounded-xl bg-surface-container-low border border-primary-container/40 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-outline text-xs uppercase font-label-caps font-semibold">
                OSV Status
              </span>
              <span className="material-symbols-outlined text-primary-container text-[18px]">
                {vulnData?.osv_available ? 'verified_user' : 'cloud_off'}
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-code text-primary-container">
                {vulnData?.osv_available ? 'ONLINE' : 'OFFLINE'}
              </div>
              <div className="text-xs text-primary-container font-code mt-0.5">
                api.osv.dev v1
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OSV Dependency Vulnerability Analysis Section */}
      <div className="space-y-space-md">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 text-[22px]">
              policy
            </span>
            OSV Dependency Vulnerabilities (Open Source Vulnerabilities API)
          </h2>
          <span className="text-xs font-mono text-outline">
            Ecosystem Matching: PyPI / npm
          </span>
        </div>

        {vulnData && vulnData.vulnerable_packages && vulnData.vulnerable_packages.length > 0 ? (
          <div className="space-y-space-md">
            {vulnData.vulnerable_packages.map((pkg) => (
              <div
                key={`${pkg.ecosystem}-${pkg.package_name}-${pkg.version}`}
                className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high hover:border-amber-500/40 transition-all space-y-3"
              >
                {/* Package Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-container pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-surface-container-highest font-code text-xs font-bold text-primary-container uppercase">
                      {pkg.ecosystem}
                    </span>
                    <span className="font-code font-bold text-on-surface text-base">
                      {pkg.package_name}
                    </span>
                    <span className="font-code text-xs px-2 py-0.5 rounded bg-error-container/20 text-error border border-error/30 font-semibold">
                      v{pkg.version}
                    </span>
                    <span className="text-xs text-outline font-mono">
                      ({pkg.vulnerabilities.length} advisory{pkg.vulnerabilities.length > 1 ? 'ies' : ''})
                    </span>
                  </div>

                  {pkg.affected_files && pkg.affected_files.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-300 font-code bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/30">
                      <span className="material-symbols-outlined text-[16px]">crisis_alert</span>
                      <span>Blast Radius: {pkg.affected_files.length} affected file{pkg.affected_files.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                {/* Advisories list */}
                <div className="space-y-2">
                  {pkg.vulnerabilities.map((vuln) => (
                    <div
                      key={vuln.id}
                      className="p-2.5 rounded-lg bg-surface-container/60 border border-surface-container-highest flex flex-col md:flex-row md:items-start justify-between gap-2"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-code font-bold border ${getSeverityBadgeClass(vuln.severity)}`}>
                            {vuln.severity || 'UNKNOWN'}
                          </span>
                          <span className="font-code font-semibold text-xs text-on-surface">
                            {vuln.id}
                          </span>
                          {vuln.fixed_versions && vuln.fixed_versions.length > 0 && (
                            <span className="font-code text-xs px-1.5 py-0.5 rounded bg-primary-container/20 text-primary-container font-mono">
                              Fixed in: {vuln.fixed_versions.join(', ')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-on-surface-variant font-body-sm line-clamp-2">
                          {vuln.summary || 'Open source dependency advisory reported on OSV database.'}
                        </p>
                      </div>

                      {vuln.references && vuln.references.length > 0 && (
                        <a
                          href={vuln.references[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-container hover:underline font-code flex items-center gap-1 flex-shrink-0 self-start mt-1"
                        >
                          <span>Advisory Details</span>
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>

                {/* Blast Radius Affected Files */}
                {pkg.affected_files && pkg.affected_files.length > 0 && (
                  <div className="pt-2 border-t border-surface-container text-xs">
                    <span className="text-outline font-label-caps uppercase font-semibold">
                      Files Importing This Dependency (Blast Radius Impact):
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {pkg.affected_files.map((file) => (
                        <span
                          key={file}
                          className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-code text-xs flex items-center gap-1 border border-surface-container-highest"
                        >
                          <span className="material-symbols-outlined text-[13px] text-amber-400">description</span>
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high text-center space-y-2">
            <span className="material-symbols-outlined text-primary-container text-[36px]">
              verified
            </span>
            <div className="font-headline-sm font-semibold text-on-surface">
              {vulnData?.packages_scanned
                ? `All ${vulnData.packages_scanned} scanned packages are clean`
                : 'No vulnerable packages detected'}
            </div>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              {vulnData?.osv_available
                ? 'OSV vulnerability matching checked all declared dependencies against the OSV database with zero vulnerabilities found.'
                : 'OSV scan telemetry will populate as dependencies are discovered.'}
            </p>
          </div>
        )}
      </div>

      {/* Static Analysis Security Findings List */}
      <div className="space-y-space-sm">
        <h2 className="font-headline-md text-headline-md text-on-surface font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-error text-[20px]">
            security
          </span>
          Static Code Security Findings
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
