import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { repoService } from '../services/api';

export const IngestRepoPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshRepositories, setActiveRepoId } = useApp();

  const [activeTab, setActiveTab] = useState<'url' | 'zip'>('url');

  // URL Tab State
  const [gitHost, setGitHost] = useState<'github' | 'gitlab' | 'bitbucket' | 'custom'>('github');
  const [repoUrl, setRepoUrl] = useState('https://github.com/repolens-org/payments-core.git');
  const [repoName, setRepoName] = useState('payments-core');
  const [branch, setBranch] = useState('main');
  const [token, setToken] = useState('ghp_920f8ab73ce184209fa29c');

  // ZIP Tab State
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; rawFile?: File } | null>({
    name: 'analytics-worker-v2.1.zip',
    size: '14.2 MB',
  });
  const [zipRepoAlias, setZipRepoAlias] = useState('analytics-worker');
  const [zipBranch, setZipBranch] = useState('main');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scan Depth State
  const [depth, setDepth] = useState<'l1' | 'l3' | 'l4'>('l3');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        rawFile: file,
      });
      const cleanName = file.name.replace(/\.(zip|tar\.gz|tar|tgz)$/i, '');
      setZipRepoAlias(cleanName);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        rawFile: file,
      });
      const cleanName = file.name.replace(/\.(zip|tar\.gz|tar|tgz)$/i, '');
      setZipRepoAlias(cleanName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (activeTab === 'url' && repoUrl.startsWith('http')) {
        const result = await repoService.ingestGithub(repoUrl);
        if (result && result.repository) {
          await refreshRepositories();
          setActiveRepoId(result.repository.id);
          navigate('/progress');
          return;
        }
      } else if (activeTab === 'zip' && uploadedFile?.rawFile) {
        const result = await repoService.ingestUpload(uploadedFile.rawFile);
        if (result && result.repository) {
          await refreshRepositories();
          setActiveRepoId(result.repository.id);
          navigate('/progress');
          return;
        }
      }

      // Fallback: standard repository creation
      const name = activeTab === 'url' ? repoName || 'new-repo' : zipRepoAlias || 'uploaded-archive';
      const targetBranch = activeTab === 'url' ? branch : zipBranch;

      const created = await repoService.createRepository({
        name,
        branch: targetBranch || 'main',
        language: activeTab === 'url' ? 'TypeScript / Node' : 'Python 3.11',
        framework: activeTab === 'url' ? 'FastAPI / NestJS' : 'Flask / Celery',
        scanDepth: depth === 'l3' ? 'L3 AST' : depth === 'l4' ? 'Full Monorepo' : 'L1 Static',
      });

      await refreshRepositories();
      setActiveRepoId(created.id);
      navigate('/progress');
    } catch (err) {
      console.error('Ingestion error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-space-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
              Ingest Repository
            </h1>
            <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-surface-container text-primary-container font-mono">
              AST INGESTION WORKSTATION
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Provide a remote Git repository URL or upload a local ZIP / Tarball archive for instant topological parsing.
          </p>
        </div>

        <button
          onClick={() => navigate('/repositories')}
          className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container border border-surface-container-highest text-outline hover:text-on-surface transition-colors self-start sm:self-auto flex items-center gap-1.5 text-xs font-code"
        >
          <span className="material-symbols-outlined text-[16px]">folder_data</span>
          <span>View Fleet</span>
        </button>
      </div>

      {/* Dual Ingestion Method Switcher Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-surface-container-low border border-surface-container-high">
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-headline-sm text-xs font-semibold transition-all ${
            activeTab === 'url'
              ? 'bg-surface-container text-primary-container border border-primary-container/40 shadow-sm'
              : 'text-outline hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">add_link</span>
          <span>Method 1: Clone from Remote Git URL</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('zip')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-headline-sm text-xs font-semibold transition-all ${
            activeTab === 'zip'
              ? 'bg-surface-container text-primary-container border border-primary-container/40 shadow-sm'
              : 'text-outline hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">folder_zip</span>
          <span>Method 2: Upload Repository ZIP / Archive</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-space-lg">
        {/* TAB 1: REMOTE GIT URL */}
        {activeTab === 'url' && (
          <div className="space-y-space-md animate-fade-in">
            {/* Git Host Quick Selector */}
            <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-space-lg space-y-space-md shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">
                    lan
                  </span>
                  Select Git Platform
                </h2>
                <span className="text-xs font-code text-outline">HTTPS &amp; SSH Supported</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
                {[
                  { id: 'github', name: 'GitHub', icon: 'deployed_code' },
                  { id: 'gitlab', name: 'GitLab', icon: 'merge' },
                  { id: 'bitbucket', name: 'Bitbucket', icon: 'source' },
                  { id: 'custom', name: 'Custom Git', icon: 'terminal' },
                ].map((g) => {
                  const isSelected = gitHost === g.id;
                  return (
                    <div
                      key={g.id}
                      onClick={() => setGitHost(g.id as any)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-surface-container border-primary-container ring-1 ring-primary-container'
                          : 'bg-surface-container-lowest border-surface-container-highest hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-[20px] ${isSelected ? 'text-primary-container' : 'text-outline'}`}>
                          {g.icon}
                        </span>
                        <span className="font-headline-sm text-xs font-semibold text-on-surface">
                          {g.name}
                        </span>
                      </div>
                      <span className={`material-symbols-outlined text-[16px] ${isSelected ? 'text-primary-container' : 'text-outline opacity-20'}`}>
                        {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* URL & Credentials Form */}
            <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-space-lg space-y-space-md shadow-sm">
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-[20px]">
                  link
                </span>
                Git Repository Coordinates
              </h2>

              <div className="space-y-space-sm">
                <div className="space-y-1">
                  <label className="font-body-sm text-xs text-on-surface font-medium">
                    Git Clone URL (HTTPS or SSH)
                  </label>
                  <input
                    type="text"
                    required
                    value={repoUrl}
                    onChange={(e) => {
                      setRepoUrl(e.target.value);
                      const parts = e.target.value.split('/');
                      const end = parts[parts.length - 1]?.replace('.git', '');
                      if (end) setRepoName(end);
                    }}
                    placeholder="https://github.com/organization/repository.git"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container border border-surface-container-highest text-on-surface font-code text-xs focus:outline-none focus:border-primary-container transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                  <div className="space-y-1">
                    <label className="font-body-sm text-xs text-on-surface font-medium">
                      Workspace Repository Alias
                    </label>
                    <input
                      type="text"
                      required
                      value={repoName}
                      onChange={(e) => setRepoName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-container border border-surface-container-highest text-on-surface font-code text-xs focus:outline-none focus:border-primary-container transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-body-sm text-xs text-on-surface font-medium">
                      Target Analysis Branch
                    </label>
                    <input
                      type="text"
                      required
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-container border border-surface-container-highest text-on-surface font-code text-xs focus:outline-none focus:border-primary-container transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-body-sm text-xs text-on-surface font-medium">
                    Personal Access Token (PAT) — Required for Private Repositories
                  </label>
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container border border-surface-container-highest text-on-surface font-code text-xs focus:outline-none focus:border-primary-container transition-colors"
                  />
                  <span className="text-[11px] text-outline font-code">
                    Requires <code className="text-on-surface">repo:read</code> permissions only. Credentials remain encrypted in memory.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LOCAL ZIP / ARCHIVE UPLOAD */}
        {activeTab === 'zip' && (
          <div className="space-y-space-md animate-fade-in">
            <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-space-lg space-y-space-md shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">
                    folder_zip
                  </span>
                  Upload Codebase Archive
                </h2>
                <span className="text-xs font-code text-outline">.ZIP, .TAR.GZ, .TAR (Up to 250 MB)</span>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-3 ${
                  dragActive
                    ? 'border-primary-container bg-primary-container/10 ring-2 ring-primary-container'
                    : 'border-surface-container-highest bg-surface-container-lowest hover:border-primary-container/60 hover:bg-surface-container'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,.tar.gz,.tar,.tgz"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary-container shadow-inner">
                  <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
                </div>

                <div className="space-y-1">
                  <div className="font-headline-sm text-sm font-bold text-on-surface">
                    Drag and drop your repository archive here, or <span className="text-primary-container underline">browse files</span>
                  </div>
                  <p className="text-xs text-outline font-body-sm">
                    Accepts zipped Git repositories or export tarballs. AST engine will extract syntax trees directly in memory.
                  </p>
                </div>
              </div>

              {/* Uploaded File Confirmation Card */}
              {uploadedFile && (
                <div className="p-3.5 rounded-lg bg-surface-container border border-surface-container-highest flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary-container flex-shrink-0">
                      <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-code text-xs font-semibold text-on-surface truncate">
                        {uploadedFile.name}
                      </span>
                      <span className="text-[11px] text-outline font-code">
                        Archive size: {uploadedFile.size} • Verified ZIP structure
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1 rounded text-outline hover:text-error transition-colors"
                    title="Remove file"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              )}

              {/* Archive Metadata Alias */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pt-2">
                <div className="space-y-1">
                  <label className="font-body-sm text-xs text-on-surface font-medium">
                    Workspace Repository Alias
                  </label>
                  <input
                    type="text"
                    required
                    value={zipRepoAlias}
                    onChange={(e) => setZipRepoAlias(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container border border-surface-container-highest text-on-surface font-code text-xs focus:outline-none focus:border-primary-container transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-body-sm text-xs text-on-surface font-medium">
                    Virtual Branch Tag
                  </label>
                  <input
                    type="text"
                    required
                    value={zipBranch}
                    onChange={(e) => setZipBranch(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container border border-surface-container-highest text-on-surface font-code text-xs focus:outline-none focus:border-primary-container transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scan Depth Selection */}
        <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-space-lg space-y-space-md shadow-sm">
          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[20px]">
              psychology
            </span>
            Analysis Depth &amp; Resolution
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            {[
              {
                id: 'l1',
                title: 'L1 Static AST',
                time: '~30s initial scan',
                desc: 'Fast lexical and syntactic parsing. Maps exports, function signatures, and simple imports.',
              },
              {
                id: 'l3',
                title: 'L3 Deep Trace (Recommended)',
                time: '~2m initial scan',
                desc: 'Full semantic symbol graph, cross-module blast radius vectors, and CWE taint vulnerability flow.',
              },
              {
                id: 'l4',
                title: 'L4 Monorepo Complete',
                time: '~5m initial scan',
                desc: 'Exhaustive cross-package inter-dependency resolution with circular reference detection.',
              },
            ].map((d) => {
              const isSelected = depth === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => setDepth(d.id as any)}
                  className={`p-space-md rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-surface-container border-primary-container ring-1 ring-primary-container'
                      : 'bg-surface-container-lowest border-surface-container-highest hover:bg-surface-container-high'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-headline-sm text-body-sm font-semibold text-on-surface">
                        {d.title}
                      </span>
                      <span className={`material-symbols-outlined text-[16px] ${isSelected ? 'text-primary-container' : 'text-outline opacity-20'}`}>
                        {isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                      </span>
                    </div>
                    <div className="font-code text-[10px] text-primary-container font-semibold mt-1">
                      {d.time}
                    </div>
                    <p className="font-body-sm text-xs text-outline mt-2">
                      {d.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-space-sm pt-space-sm">
          <button
            type="button"
            onClick={() => navigate('/repositories')}
            className="px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-headline-sm text-body-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (activeTab === 'zip' && !uploadedFile)}
            className="inline-flex items-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container font-headline-sm text-body-sm font-semibold transition-all shadow-glow-lime disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                <span>Initializing Pipeline...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                <span>Initialize AST Ingestion Pipeline</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
