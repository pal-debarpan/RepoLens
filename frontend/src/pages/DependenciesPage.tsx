import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { dependencyService, analysisService } from '../services/api';
import { MOCK_SBOM_SUMMARY } from '../services/mockData';
import { DependencyItem, SbomSummaryData, SbomComponent } from '../types';

export const DependenciesPage: React.FC = () => {
  const { activeRepo } = useApp();
  const navigate = useNavigate();

  const [dependencies, setDependencies] = useState<DependencyItem[]>([]);
  const [sbomData, setSbomData] = useState<SbomSummaryData>(MOCK_SBOM_SUMMARY);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string>('repolens-demo');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [deps, analysisId] = await Promise.all([
          dependencyService.getDependencies(activeRepo?.id),
          analysisService.getAnalysisIdForRepo(activeRepo?.id),
        ]);

        if (!isMounted) return;
        setDependencies(deps);
        if (analysisId) {
          setCurrentAnalysisId(analysisId);
          const sbomRes = await analysisService.getSbomSummary(analysisId);
          if (isMounted && sbomRes) {
            setSbomData(sbomRes);
          }
        }
      } catch (err) {
        console.warn('Failed to load dependency & SBOM data:', err);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeRepo]);

  const handleDownloadSbom = async () => {
    setIsDownloading(true);
    try {
      await analysisService.downloadSbomJson(currentAnalysisId);
    } catch (e) {
      console.warn('Download error:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const filteredComponents: SbomComponent[] = (sbomData.components || []).filter((comp) => {
    const matchesSearch = comp.name.toLowerCase().includes(search.toLowerCase()) ||
      (comp.purl && comp.purl.toLowerCase().includes(search.toLowerCase()));
    const matchesType =
      filterType === 'all' ||
      (filterType === 'direct' && comp.direct) ||
      (filterType === 'transitive' && !comp.direct);
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'vulnerable' && comp.vulnerabilities_count > 0) ||
      (filterStatus === 'clean' && comp.vulnerabilities_count === 0);
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-space-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs flex-wrap">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
              Software Bill of Materials (SBOM)
            </h1>
            <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-primary-container/20 text-primary-container font-mono text-xs border border-primary-container/30">
              CYCLONEDX v{sbomData.spec_version || '1.5'}
            </span>
            <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-surface-container text-outline font-mono text-xs">
              {sbomData.component_count || 0} COMPONENTS
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Standardized CycloneDX SBOM inventory, Package URLs (PURLs), OSV correlation, and blast radius for{' '}
            <span className="font-code text-on-surface font-semibold">{activeRepo?.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-space-sm self-start sm:self-auto flex-wrap">
          <button
            onClick={handleDownloadSbom}
            disabled={isDownloading}
            className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container text-body-sm font-semibold transition-all shadow-glow-lime disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isDownloading ? 'hourglass_top' : 'download'}
            </span>
            <span>Export CycloneDX JSON</span>
          </button>

          <button
            onClick={() => navigate('/blast-radius')}
            className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high border border-surface-container-highest text-on-surface text-body-sm font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">radar</span>
            <span>Trace Blast</span>
          </button>
        </div>
      </div>

      {/* SBOM Telemetry Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <div className="text-outline text-xs uppercase font-label-caps font-semibold">Total Components</div>
          <div className="text-2xl font-bold font-code text-on-surface mt-1">
            {sbomData.component_count || 0}
          </div>
          <div className="text-xs text-outline font-code mt-0.5">CycloneDX registered</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <div className="text-outline text-xs uppercase font-label-caps font-semibold">Direct Dependencies</div>
          <div className="text-2xl font-bold font-code text-primary-container mt-1">
            {sbomData.direct_count || 0}
          </div>
          <div className="text-xs text-primary-container font-code mt-0.5">Top-level manifest</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <div className="text-outline text-xs uppercase font-label-caps font-semibold">Transitive Graph</div>
          <div className="text-2xl font-bold font-code text-secondary mt-1">
            {sbomData.transitive_count || 0}
          </div>
          <div className="text-xs text-secondary font-code mt-0.5">Resolved in lockfile</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-error/40">
          <div className="text-outline text-xs uppercase font-label-caps font-semibold">Vulnerable Packages</div>
          <div className="text-2xl font-bold font-code text-error mt-1">
            {sbomData.vulnerable_components_count || 0}
          </div>
          <div className="text-xs text-error font-code mt-0.5">OSV advisories linked</div>
        </div>
      </div>

      {/* CycloneDX Document Info Callout */}
      <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-outline">SERIAL NUMBER:</span>
          <span className="text-on-surface bg-surface-container px-2 py-0.5 rounded border border-surface-container-highest">
            {sbomData.serial_number || 'urn:uuid:repolens-demo'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-outline">ECOSYSTEMS:</span>
          <div className="flex gap-1">
            {(sbomData.ecosystems || ['npm']).map((eco) => (
              <span key={eco} className="px-1.5 py-0.5 rounded bg-surface-container-highest text-primary-container uppercase font-bold">
                {eco}
              </span>
            ))}
          </div>
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
            placeholder="Search component or PURL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-container border border-surface-container-highest text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
          />
        </div>

        <div className="flex items-center gap-space-sm">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-surface-container border border-surface-container-highest text-xs text-on-surface focus:outline-none font-code"
          >
            <option value="all">All Dependencies</option>
            <option value="direct">Direct Only</option>
            <option value="transitive">Transitive Only</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-surface-container border border-surface-container-highest text-xs text-on-surface focus:outline-none font-code"
          >
            <option value="all">All Statuses</option>
            <option value="vulnerable">Vulnerable (OSV)</option>
            <option value="clean">Clean (No Advisories)</option>
          </select>
        </div>
      </div>

      {/* CycloneDX SBOM Component Matrix Table */}
      <div className="rounded-xl border border-surface-container-high overflow-hidden shadow-sm">
        <table className="w-full text-left text-body-sm">
          <thead className="bg-surface-container-lowest border-b border-surface-container-high text-outline text-[11px] font-label-caps uppercase">
            <tr>
              <th className="px-4 py-3">Component &amp; Ecosystem</th>
              <th className="px-4 py-3">Version</th>
              <th className="px-4 py-3">Package URL (PURL)</th>
              <th className="px-4 py-3">Scope / Type</th>
              <th className="px-4 py-3">OSV Vulnerabilities</th>
              <th className="px-4 py-3 text-right">Blast Radius (Files)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high bg-surface-container-low">
            {filteredComponents.map((comp) => (
              <tr key={comp.purl || comp.name} className="hover:bg-surface-container transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-outline text-[18px]">
                      inventory_2
                    </span>
                    <span className="font-code font-semibold text-on-surface">{comp.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container-highest text-primary-container uppercase font-bold">
                      {comp.ecosystem || 'NPM'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-code text-xs text-on-surface font-semibold">
                  v{comp.version}
                </td>
                <td className="px-4 py-3.5 font-code text-xs text-outline max-w-xs truncate">
                  <span className="bg-surface-container px-2 py-0.5 rounded border border-surface-container-highest">
                    {comp.purl || `pkg:generic/${comp.name}@${comp.version}`}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-code uppercase font-semibold ${
                    comp.direct
                      ? 'bg-primary-container/20 text-primary-container border border-primary-container/30'
                      : 'bg-surface-container-highest text-secondary border border-surface-container-highest'
                  }`}>
                    {comp.direct ? 'Direct' : 'Transitive'}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  {comp.vulnerabilities_count > 0 ? (
                    <span
                      onClick={() => navigate('/security')}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-error-container/30 text-error text-[11px] font-code font-semibold cursor-pointer hover:underline border border-error/30"
                    >
                      <span className="material-symbols-outlined text-[14px]">gpp_bad</span>
                      {comp.vulnerabilities_count} OSV Advisory{comp.vulnerabilities_count > 1 ? 'ies' : ''}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-container/20 text-primary-container text-[11px] font-code font-semibold">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Clean
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right font-code text-xs">
                  {comp.affected_files && comp.affected_files.length > 0 ? (
                    <span
                      onClick={() => navigate('/blast-radius')}
                      className="text-amber-300 hover:underline cursor-pointer flex items-center justify-end gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">radar</span>
                      {comp.affected_files.length} file{comp.affected_files.length > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-outline">0 files</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
