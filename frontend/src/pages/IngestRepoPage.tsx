import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { repoService } from '../services/api';

export const IngestRepoPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshRepositories, setActiveRepoId } = useApp();

  const [selectedMethod, setSelectedMethod] = useState<'url' | 'zip'>('url');

  // URL Tab State
  const [gitHost, setGitHost] = useState<'github' | 'gitlab' | 'bitbucket' | 'custom'>('github');
  const [repoUrl, setRepoUrl] = useState('https://github.com/repolens-org/payments-core.git');
  const [repoName, setRepoName] = useState('payments-core');
  const [branch, setBranch] = useState('main');
  const [token, setToken] = useState('ghp_920f8ab73ce184209fa29c');
  const [showToken, setShowToken] = useState(false);

  // ZIP Tab State
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>({
    name: 'analytics-worker-v2.1.zip',
    size: '14.2 MB',
  });
  const [zipRepoAlias, setZipRepoAlias] = useState('analytics-worker');
  const [zipBranch, setZipBranch] = useState('main');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scan Depth State
  const [depth, setDepth] = useState<'l1' | 'l3' | 'l4'>('l4');
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
    setSelectedMethod('zip');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      });
      const cleanName = file.name.replace(/\.(zip|tar\.gz|tar|tgz)$/i, '');
      setZipRepoAlias(cleanName);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedMethod('zip');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      });
      const cleanName = file.name.replace(/\.(zip|tar\.gz|tar|tgz)$/i, '');
      setZipRepoAlias(cleanName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isUrl = selectedMethod === 'url';
    const name = isUrl ? repoName || 'new-repo' : zipRepoAlias || 'uploaded-archive';
    const targetBranch = isUrl ? branch : zipBranch;

    const created = await repoService.createRepository({
      name,
      branch: targetBranch || 'main',
      language: isUrl ? 'TypeScript / Node' : 'Python 3.11',
      framework: isUrl ? 'FastAPI / NestJS' : 'Flask / Celery',
      scanDepth: depth === 'l3' ? 'L3 AST' : depth === 'l4' ? 'Full Monorepo' : 'L1 Static',
    });

    await refreshRepositories();
    setActiveRepoId(created.id);
    navigate('/progress');
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
            <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-surface-container text-primary-container">
              AST INGESTION WORKSTATION
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Provide a remote Git repository URL or upload a local ZIP / Tarball archive for instant topological parsing.
          </p>
        </div>

        <button
          onClick={() => navigate('/repositories')}
          className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container border border-surface-container-highest text-outline hover:text-on-surface transition-colors self-start sm:self-auto flex items-center gap-1.5 text-xs font-sans font-medium"
        >
          <span className="material-symbols-outlined text-[16px]">folder_data</span>
          <span>View Fleet</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-space-lg">
        {/* Unified Single Frame with Upper Git Repository, OR Divider, and Lower ZIP Archive */}
        <div className="relative overflow-hidden bg-surface-container-low border border-primary-container/40 ring-1 ring-primary-container/20 rounded-2xl p-5 sm:p-7 space-y-7 shadow-sm dark:shadow-[0_0_50px_rgba(182,255,46,0.12)]">
          {/* Ambient Glowing Background Aura on Parent Frame */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />

          {/* Policy Notice Top Banner */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 rounded-xl bg-surface-container border border-surface-container-highest shadow-sm text-xs font-sans">
            <div className="flex items-center gap-2.5 text-on-surface font-medium">
              <span className="material-symbols-outlined text-primary-container text-[18px]">check_circle</span>
              <span>
                Single Ingestion Policy: Choose either <strong className="text-on-surface font-semibold">Remote Git Repository</strong> OR <strong className="text-on-surface font-semibold">Local ZIP File</strong>
              </span>
            </div>
            <div className="self-start sm:self-auto flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/15 border border-primary-container/30 text-primary-container font-sans text-[11px] font-semibold tracking-wide shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
              <span>{selectedMethod === 'url' ? 'Selected: Remote Git' : 'Selected: ZIP Archive'}</span>
            </div>
          </div>

          {/* Main Card: Upper: Remote Git Repository */}
          <div
            onClick={() => setSelectedMethod('url')}
            className={`relative z-10 rounded-2xl border transition-all duration-200 p-6 sm:p-8 space-y-7 ${
              selectedMethod === 'url'
                ? 'bg-surface-container border-primary-container ring-1 ring-primary-container/30 shadow-sm'
                : 'bg-surface-container-lowest/50 border-surface-container-highest opacity-60 hover:opacity-90 hover:border-surface-container-high cursor-pointer'
            }`}
          >
            {/* Header: Title, Subtitle, Left Icon, and Right ACTIVE Pill */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-container-high/60 pb-5">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  selectedMethod === 'url'
                    ? 'bg-primary-container text-on-primary-container shadow-glow-lime'
                    : 'bg-surface-container text-outline border border-surface-container-highest'
                }`}>
                  <span className="material-symbols-outlined text-[22px]">add_link</span>
                </div>
                <div>
                  <h2 className="font-heading text-base sm:text-lg font-bold text-on-surface tracking-tight">
                    Upper: Remote Git Repository
                  </h2>
                  <p className="font-sans text-xs text-outline mt-0.5">
                    Clone directly from GitHub, GitLab, Bitbucket, or custom Git endpoint
                  </p>
                </div>
              </div>

              <div className="self-start sm:self-auto flex-shrink-0">
                {selectedMethod === 'url' ? (
                  <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary-container text-on-primary-container text-xs font-sans font-semibold tracking-wide shadow-sm">
                    <span className="material-symbols-outlined text-[15px] font-bold">check</span>
                    <span>ACTIVE</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMethod('url');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high border border-surface-container-highest text-outline hover:text-on-surface text-xs font-sans transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">radio_button_unchecked</span>
                    <span>Select Remote Git</span>
                  </button>
                )}
              </div>
            </div>

            {/* Git Host Selector: 4 Horizontal Tab-like Buttons */}
            <div className="space-y-3">
              <label className="font-sans text-xs font-medium text-on-surface block">
                Target Git Host
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    id: 'github',
                    name: 'GitHub',
                    icon: (
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                      </svg>
                    ),
                  },
                  {
                    id: 'gitlab',
                    name: 'GitLab',
                    icon: (
                      <svg className="w-4 h-4 fill-current text-[#fc6d26]" viewBox="0 0 24 24">
                        <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.29-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 5.51 2a.48.48 0 0 1 .4.24l2.62 8.08h6.94l2.62-8.08a.48.48 0 0 1 .4-.24.42.42 0 0 1 .39.16l2.44 7.51 1.22 3.78a.84.84 0 0 1-.29.94z"/>
                      </svg>
                    ),
                  },
                  {
                    id: 'bitbucket',
                    name: 'Bitbucket',
                    icon: (
                      <svg className="w-4 h-4 fill-current text-[#2684ff]" viewBox="0 0 24 24">
                        <path d="M2.61 4.19A1.5 1.5 0 0 1 4.1 3h15.8a1.5 1.5 0 0 1 1.49 1.19l2.58 13.06a1.5 1.5 0 0 1-1.47 1.79H5.5a1.5 1.5 0 0 1-1.47-1.22L1.45 4.82a1.5 1.5 0 0 1 1.16-.63zm11.23 9.38h-3.68l-.86-4.54h5.4l-.86 4.54z"/>
                      </svg>
                    ),
                  },
                  {
                    id: 'custom',
                    name: 'Custom Git',
                    icon: (
                      <span className="material-symbols-outlined text-[18px]">terminal</span>
                    ),
                  },
                ].map((g) => {
                  const isSelected = gitHost === g.id && selectedMethod === 'url';
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMethod('url');
                        setGitHost(g.id as any);
                      }}
                      className={`h-11 px-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between font-sans text-xs font-medium ${
                        isSelected
                          ? 'bg-surface-container-high border-primary-container text-on-surface shadow-sm ring-1 ring-primary-container/40'
                          : 'bg-surface-container-lowest border-surface-container-highest text-outline hover:bg-surface-container hover:border-surface-container-high hover:text-on-surface'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={isSelected ? 'text-primary-container' : 'text-outline'}>
                          {g.icon}
                        </div>
                        <span>{g.name}</span>
                      </div>
                      <span className={`material-symbols-outlined text-[16px] transition-colors ${
                        isSelected ? 'text-primary-container' : 'text-outline/30'
                      }`}>
                        {isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Fields */}
            <div className="space-y-5">
              {/* Git Clone URL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-sans text-xs font-medium text-on-surface">
                    Git Clone URL (HTTPS or SSH)
                  </label>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMethod('url');
                      setRepoUrl('https://github.com/repolens-org/payments-core.git');
                      setRepoName('payments-core');
                      setGitHost('github');
                    }}
                    className="text-[11px] font-sans text-primary-container hover:underline flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[13px]">auto_fix_high</span>
                    <span>Fill Demo Repo</span>
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-outline pointer-events-none material-symbols-outlined text-[18px]">
                    link
                  </span>
                  <input
                    type="text"
                    value={repoUrl}
                    onFocus={() => setSelectedMethod('url')}
                    onChange={(e) => {
                      setSelectedMethod('url');
                      const val = e.target.value;
                      setRepoUrl(val);
                      if (val.includes('github.com')) setGitHost('github');
                      else if (val.includes('gitlab.com')) setGitHost('gitlab');
                      else if (val.includes('bitbucket.org')) setGitHost('bitbucket');

                      const parts = val.split('/');
                      const end = parts[parts.length - 1]?.replace('.git', '');
                      if (end) setRepoName(end);
                    }}
                    placeholder="https://github.com/organization/repository.git"
                    className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-on-surface font-mono text-xs focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/40 shadow-inner transition-all placeholder:text-outline/40"
                  />
                  {repoUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRepoUrl('');
                        setRepoName('');
                      }}
                      className="absolute right-3 p-1 rounded-md text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                      title="Clear URL"
                    >
                      <span className="material-symbols-outlined text-[15px]">close</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Alias & Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-sans text-xs font-medium text-on-surface block">
                    Workspace Repository Alias
                  </label>
                  <input
                    type="text"
                    value={repoName}
                    onFocus={() => setSelectedMethod('url')}
                    onChange={(e) => {
                      setSelectedMethod('url');
                      setRepoName(e.target.value);
                    }}
                    placeholder="payments-core"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-on-surface font-mono text-xs focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/40 shadow-inner transition-all placeholder:text-outline/40"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-sans text-xs font-medium text-on-surface block">
                      Target Analysis Branch
                    </label>
                    <div className="flex items-center gap-1">
                      {['main', 'master', 'develop'].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMethod('url');
                            setBranch(b);
                          }}
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                            branch === b
                              ? 'bg-primary-container text-on-primary-container font-semibold'
                              : 'bg-surface-container-high text-outline hover:text-on-surface'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={branch}
                    onFocus={() => setSelectedMethod('url')}
                    onChange={(e) => {
                      setSelectedMethod('url');
                      setBranch(e.target.value);
                    }}
                    placeholder="main"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-on-surface font-mono text-xs focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/40 shadow-inner transition-all placeholder:text-outline/40"
                  />
                </div>
              </div>

              {/* Personal Access Token (PAT) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label className="font-sans text-xs font-medium text-on-surface">
                    Personal Access Token (PAT) — Optional for Public, Required for Private
                  </label>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-outline pointer-events-none material-symbols-outlined text-[18px]">
                    lock
                  </span>
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={token}
                    onFocus={() => setSelectedMethod('url')}
                    onChange={(e) => {
                      setSelectedMethod('url');
                      setToken(e.target.value);
                    }}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-on-surface font-mono text-xs focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/40 shadow-inner transition-all placeholder:text-outline/40 tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowToken(!showToken);
                    }}
                    className="absolute right-3 text-outline hover:text-on-surface transition-colors p-1"
                    title={showToken ? 'Hide token' : 'Show token'}
                  >
                    <span className="material-symbols-outlined text-[17px]">
                      {showToken ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* THE "OR" DIVIDER */}
          <div className="relative flex items-center justify-center my-6">
            <div className="border-t border-surface-container-highest w-full" />
            <div className="absolute px-5 py-1 bg-surface-container border border-surface-container-highest rounded-full shadow-md flex items-center gap-2 text-xs font-code font-bold tracking-widest text-on-surface uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
              <span className="text-primary-container font-extrabold">OR</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
            </div>
          </div>

          {/* LOWER SIDE: Local ZIP / Archive File */}
          <div
            onClick={() => setSelectedMethod('zip')}
            className={`relative z-10 rounded-2xl border transition-all duration-200 p-6 sm:p-8 space-y-6 ${
              selectedMethod === 'zip'
                ? 'bg-surface-container border-primary-container ring-1 ring-primary-container/30 shadow-sm'
                : 'bg-surface-container-lowest/50 border-surface-container-highest opacity-60 hover:opacity-90 hover:border-surface-container-high cursor-pointer'
            }`}
          >

            {/* Lower Header Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-container-high/60 pb-4">
              <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  selectedMethod === 'zip'
                    ? 'bg-primary-container text-on-primary-container shadow-glow-lime'
                    : 'bg-surface-container text-outline border border-surface-container-highest'
                }`}>
                  <span className="material-symbols-outlined text-[24px]">folder_zip</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-headline-md text-base sm:text-lg font-bold text-on-surface">
                      Local ZIP / Codebase Archive
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase tracking-wider bg-primary-container/15 text-primary-container border border-primary-container/30">
                      Local Archive
                    </span>
                  </div>
                  <p className="text-xs text-outline mt-0.5 font-body-sm">
                    Drag &amp; drop or upload a compressed .zip, .tar.gz, or .tar repository bundle (up to 250 MB)
                  </p>
                </div>
              </div>

              <div className="self-start sm:self-auto flex-shrink-0">
                {selectedMethod === 'zip' ? (
                  <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary-container text-on-primary-container text-xs font-sans font-semibold tracking-wide shadow-sm">
                    <span className="material-symbols-outlined text-[15px] font-bold">check</span>
                    <span>ACTIVE</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMethod('zip');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high border border-surface-container-highest text-outline hover:text-on-surface text-xs font-sans transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">radio_button_unchecked</span>
                    <span>Select Local ZIP</span>
                  </button>
                )}
              </div>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMethod('zip');
                fileInputRef.current?.click();
              }}
              className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-3 ${
                dragActive
                  ? 'border-primary-container bg-primary-container/15 ring-2 ring-primary-container'
                  : selectedMethod === 'zip'
                  ? 'border-primary-container/60 bg-surface-container-lowest/80 hover:bg-surface-container'
                  : 'border-surface-container-highest bg-surface-container-lowest/40 hover:border-primary-container/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,.tar.gz,.tar,.tgz"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                dragActive || selectedMethod === 'zip'
                  ? 'bg-primary-container text-on-primary-container shadow-glow-lime'
                  : 'bg-surface-container text-outline'
              }`}>
                <span className="material-symbols-outlined text-[32px]">cloud_upload</span>
              </div>

              <div className="space-y-1">
                <div className="font-headline-sm text-sm font-bold text-on-surface">
                  Drag &amp; drop repository archive here, or <span className="text-primary-container underline font-semibold">browse files</span>
                </div>
                <p className="text-xs text-outline font-body-sm max-w-md">
                  Accepts zipped Git repositories or export tarballs. AST engine unpacks and builds dependency graphs in-memory.
                </p>
              </div>
            </div>

            {/* Uploaded File Confirmation Card */}
            {uploadedFile && (
              <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary-container/20 border border-primary-container/30 flex items-center justify-center text-primary-container flex-shrink-0">
                    <span className="material-symbols-outlined text-[22px]">inventory_2</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-code text-xs font-bold text-on-surface truncate">
                      {uploadedFile.name}
                    </span>
                    <span className="text-[11px] text-outline font-code">
                      Archive size: {uploadedFile.size} • Ready for AST decomposition
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-surface-container transition-colors"
                  title="Remove archive"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}

            {/* Archive Metadata Alias & Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              <div className="space-y-1.5">
                <label className="font-body-sm text-xs text-on-surface font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-outline">label</span>
                  <span>Workspace Repository Alias</span>
                </label>
                <input
                  type="text"
                  value={zipRepoAlias}
                  onFocus={() => setSelectedMethod('zip')}
                  onChange={(e) => {
                    setSelectedMethod('zip');
                    setZipRepoAlias(e.target.value);
                  }}
                  placeholder="e.g. payments-core"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-on-surface font-code text-xs focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-body-sm text-xs text-on-surface font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-outline">fork_right</span>
                  <span>Virtual Branch Tag</span>
                </label>
                <input
                  type="text"
                  value={zipBranch}
                  onFocus={() => setSelectedMethod('zip')}
                  onChange={(e) => {
                    setSelectedMethod('zip');
                    setZipBranch(e.target.value);
                  }}
                  placeholder="e.g. main"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-on-surface font-code text-xs focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Scan Depth Selection */}
        <div className="relative overflow-hidden bg-surface-container-low border border-surface-container-high rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          {/* Header with glowing circuit/brain icon and subtitle */}
          <div className="flex items-center gap-3.5 border-b border-surface-container-high/60 pb-5">
            <div className="w-10 h-10 rounded-xl bg-primary-container/15 border border-primary-container/30 flex items-center justify-center text-primary-container shadow-sm flex-shrink-0">
              <span className="material-symbols-outlined text-[24px]">psychology</span>
            </div>
            <div>
              <h2 className="font-sans text-base sm:text-lg font-bold text-on-surface tracking-tight flex items-center gap-2">
                <span>Analysis Depth &amp; Resolution</span>
              </h2>
              <p className="font-sans text-xs text-outline mt-0.5">
                Choose how deep the scan goes across AST symbols and dependency graphs
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                id: 'l1',
                title: 'L1 Static AST',
                icon: 'bolt',
                time: '~30s initial scan',
                badge: 'Fast Syntax',
                desc: 'Fast lexical and syntactic parsing. Maps exports, function signatures, and simple imports without cross-module taint propagation.',
              },
              {
                id: 'l3',
                title: 'L3 Deep Trace',
                icon: 'search_insights',
                time: '~2m initial scan',
                badge: 'Recommended',
                desc: 'Full semantic symbol graph, cross-module blast radius vectors, and CWE taint vulnerability flow across module boundaries.',
              },
              {
                id: 'l4',
                title: 'L4 Monorepo Complete',
                icon: 'layers',
                time: '~5m initial scan',
                badge: 'Deep / Exhaustive',
                desc: 'Exhaustive cross-package inter-dependency resolution with circular reference detection and whole-workspace symbol indexing.',
              },
            ].map((d) => {
              const isSelected = depth === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => setDepth(d.id as any)}
                  className={`relative p-6 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-surface-container border-primary-container ring-1 ring-primary-container/40 shadow-md -translate-y-1'
                      : 'bg-surface-container-lowest border border-surface-container-highest hover:bg-surface-container hover:border-surface-container-high hover:-translate-y-1 hover:shadow-lg'
                  }`}
                >
                  <div>
                    {/* Top Row: Tier Icon and Radio Indicator */}
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-primary-container/20 text-primary-container'
                          : 'bg-surface-container text-outline'
                      }`}>
                        <span className="material-symbols-outlined text-[18px]">
                          {d.icon}
                        </span>
                      </div>
                      <span className={`material-symbols-outlined text-[18px] transition-colors ${
                        isSelected
                          ? 'text-primary-container'
                          : 'text-outline/30'
                      }`}>
                        {isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                      </span>
                    </div>

                    {/* Bold Title */}
                    <h3 className="font-sans text-sm sm:text-base font-bold text-on-surface mt-3.5 tracking-tight flex items-center justify-between">
                      <span>{d.title}</span>
                    </h3>

                    {/* Colored Timing Badge */}
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-container/15 border border-primary-container/30 text-primary-container font-mono text-[11px] font-semibold">
                        <span className="material-symbols-outlined text-[12px]">timer</span>
                        <span>{d.time}</span>
                      </span>
                      {d.badge && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-container border border-surface-container-highest text-outline">
                          {d.badge}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="font-sans text-xs text-outline mt-3.5 leading-relaxed">
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
            disabled={
              isSubmitting ||
              (selectedMethod === 'url' && !repoUrl.trim()) ||
              (selectedMethod === 'zip' && !uploadedFile)
            }
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
                <span>
                  {selectedMethod === 'url'
                    ? 'Initialize Pipeline (Remote Git)'
                    : 'Initialize Pipeline (ZIP Archive)'}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
