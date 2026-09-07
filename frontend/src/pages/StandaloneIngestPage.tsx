import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context';
import * as repoService from '../services/repositoryService';
import * as analysisService from '../services/analysisService';
import { RepoLensLogo } from '../components/common/RepoLensLogo';

export const StandaloneIngestPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshRepositories, setActiveRepoId, setCurrentAnalysisId } = useApp();

  const [selectedMethod, setSelectedMethod] = useState<'url' | 'zip'>('url');

  // URL Tab State
  const [repoUrl, setRepoUrl] = useState('');
  const [repoName, setRepoName] = useState('');
  const [branch, setBranch] = useState('main');

  // ZIP Tab State
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
  const [zipRepoAlias, setZipRepoAlias] = useState('');
  const [zipBranch, setZipBranch] = useState('main');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Handle Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (selectedMethod === 'url' && !repoUrl.trim()) {
      setSubmitError('Enter a GitHub repository URL to begin analysis.');
      return;
    }
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
    try {
      if (isUrl) {
        const created = await repoService.ingestGitHub({ url: repoUrl });
        // Trigger analysis pipeline immediately
        try {
          const analysis = await analysisService.createAnalysis({ repository_id: created.id });
          setCurrentAnalysisId(analysis.id);
        } catch (analysisErr) {
          console.warn('Could not auto-start analysis:', analysisErr);
        }
        await refreshRepositories();
        setActiveRepoId(created.id);
        navigate('/progress');
      } else {
        if (!fileInputRef.current?.files?.[0]) {
          setIsSubmitting(false);
          return;
        }
        const file = fileInputRef.current.files[0];
        const created = await repoService.ingestZip(file);
        // Trigger analysis pipeline immediately
        try {
          const analysis = await analysisService.createAnalysis({ repository_id: created.id });
          setCurrentAnalysisId(analysis.id);
        } catch (analysisErr) {
          console.warn('Could not auto-start analysis:', analysisErr);
        }
        await refreshRepositories();
        setActiveRepoId(created.id);
        navigate('/progress');
      }
    } catch (err: any) {
      console.error('Ingestion failed:', err);
      setSubmitError(err instanceof Error ? err.message : 'Repository ingestion failed.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container flex flex-col justify-between">
      {/* Top Header */}
      <header className="px-4 lg:px-8 h-16 border-b border-surface-container-high/60 bg-surface-container-lowest/70 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center hover:opacity-90 transition-opacity">
            <RepoLensLogo size="md" />
          </Link>
          <span className="hidden sm:inline-block text-surface-variant text-sm">•</span>
          <span className="hidden sm:inline-block font-sans text-xs text-outline uppercase tracking-wider">
            Ingest Codebase
          </span>
        </div>

      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {submitError && <div role="alert" className="rounded-xl border border-error/40 bg-error-container/20 px-4 py-3 text-sm text-error">{submitError}</div>}
        {/* Page Header */}
        <div>
          <h1 className="font-headline-lg text-2xl sm:text-3xl text-on-surface font-bold">
            Ingest Repository
          </h1>
          <p className="font-body-md text-sm sm:text-base text-on-surface-variant mt-1.5">
            Provide a remote Git repository URL or upload a local ZIP / Tarball archive for instant topological parsing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Ingestion Source Card with Toggle Tabs */}
          <div className="relative overflow-hidden bg-surface-container-low border border-primary-container/40 ring-1 ring-primary-container/20 rounded-2xl p-5 sm:p-8 space-y-6 shadow-sm dark:shadow-[0_0_50px_rgba(182,255,46,0.12)]">
            {/* Ambient Glowing Background Aura */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />

            {/* Full-Width Segmented Toggle Control taking the whole width of the dialogue box */}
            <div className="relative z-10 w-full p-1.5 rounded-xl bg-surface-container border border-surface-container-highest shadow-inner grid grid-cols-2">
              {/* Animated Sliding Pill */}
              <div
                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-lg bg-primary-container shadow-glow-lime transition-all duration-300 ease-out pointer-events-none ${
                  selectedMethod === 'url' ? 'left-1.5' : 'left-[calc(50%+3px)]'
                }`}
              />

              {/* GitHub Button */}
              <button
                type="button"
                onClick={() => setSelectedMethod('url')}
                className={`relative z-10 w-full flex items-center justify-center gap-2.5 py-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-200 cursor-pointer select-none ${
                  selectedMethod === 'url'
                    ? 'text-on-primary-container'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
                <span>GitHub URL</span>
              </button>

              {/* ZIP File Button */}
              <button
                type="button"
                onClick={() => setSelectedMethod('zip')}
                className={`relative z-10 w-full flex items-center justify-center gap-2.5 py-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-200 cursor-pointer select-none ${
                  selectedMethod === 'zip'
                    ? 'text-on-primary-container'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">folder_zip</span>
                <span>ZIP File Upload</span>
              </button>
            </div>

            {/* Tab Panels with Smooth Transition */}
            <div className="relative z-10">
              {selectedMethod === 'url' ? (
                /* GitHub URL Screen */
                <div
                  key="github-screen"
                  className="rounded-2xl border border-surface-container-highest bg-surface-container p-6 sm:p-7 space-y-6 animate-tab-fade"
                >
                  <div className="flex items-center gap-3 border-b border-surface-container-high pb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-glow-lime">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-sans text-sm sm:text-base font-bold text-on-surface">
                        GitHub Repository Configuration
                      </h3>
                      <p className="font-sans text-xs text-outline mt-0.5">
                        Provide a public or private GitHub repo URL for instant topological AST parsing
                      </p>
                    </div>
                  </div>

                  {/* Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="font-sans text-xs font-medium text-on-surface flex items-center justify-between h-5">
                        <span>GitHub Repository URL *</span>
                        <span className="font-mono text-[11px] text-outline">https://github.com/...</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={repoUrl}
                          onChange={(e) => {
                            setRepoUrl(e.target.value);
                            const match = e.target.value.match(/\/([^/]+?)(\.git)?$/);
                            if (match && match[1]) {
                              setRepoName(match[1]);
                            }
                          }}
                          placeholder="https://github.com/organization/repository.git"
                          className="w-full h-11 px-3.5 pl-9 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-on-surface font-mono text-xs focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
                        />
                        <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-outline text-[18px]">
                          link
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-sans text-xs font-medium text-on-surface flex items-center justify-between h-5">
                        <span>Target Branch</span>
                        <span className="font-mono text-[11px] text-outline">default: main</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          placeholder="main"
                          className="w-full h-11 px-3.5 pl-9 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-on-surface font-mono text-xs focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
                        />
                        <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-outline text-[18px]">
                          fork_right
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ZIP File Upload Screen */
                <div
                  key="zip-screen"
                  className="rounded-2xl border border-surface-container-highest bg-surface-container p-6 sm:p-7 space-y-6 animate-tab-fade"
                >
                  <div className="flex items-center gap-3 border-b border-surface-container-high pb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-glow-lime">
                      <span className="material-symbols-outlined text-[22px]">folder_zip</span>
                    </div>
                    <div>
                      <h3 className="font-sans text-sm sm:text-base font-bold text-on-surface">
                        Local ZIP Archive Upload
                      </h3>
                      <p className="font-sans text-xs text-outline mt-0.5">
                        Upload codebase bundle archives (.zip, .tar.gz) directly from your computer
                      </p>
                    </div>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${
                      dragActive
                        ? 'border-primary-container bg-primary-container/10 scale-[1.01]'
                        : 'border-surface-container-highest hover:border-primary-container bg-surface-container-lowest/80'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".zip,.tar,.gz,.tgz"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />

                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center mx-auto text-primary-container border border-surface-container-highest shadow-sm">
                        <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
                      </div>
                      <div>
                        <p className="font-sans text-sm font-semibold text-on-surface">
                          Drag & Drop repository archive here, or <span className="text-primary-container underline">browse machine</span>
                        </p>
                        <p className="font-sans text-xs text-outline mt-1">
                          Supports .zip, .tar.gz, .tgz up to 500 MB
                        </p>
                      </div>

                      {uploadedFile && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-primary-container/40 text-xs font-mono text-on-surface shadow-sm">
                          <span className="material-symbols-outlined text-primary-container text-[16px]">check_circle</span>
                          <span className="font-semibold">{uploadedFile.name}</span>
                          <span className="text-outline">({uploadedFile.size})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ZIP Metadata Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-sans text-xs font-medium text-on-surface">Repository Alias / Name</label>
                      <input
                        type="text"
                        value={zipRepoAlias}
                        onChange={(e) => setZipRepoAlias(e.target.value)}
                        placeholder="my-codebase"
                        className="w-full h-11 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-on-surface font-mono text-xs focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-sans text-xs font-medium text-on-surface">Branch Tag</label>
                      <input
                        type="text"
                        value={zipBranch}
                        onChange={(e) => setZipBranch(e.target.value)}
                        placeholder="main"
                        className="w-full h-11 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-on-surface font-mono text-xs focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>



          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-surface-container-high/60">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-surface-container-highest text-on-surface font-sans text-xs font-semibold transition-colors"
            >
              Cancel & Return to Home
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                (selectedMethod === 'url' && !repoUrl.trim()) ||
                (selectedMethod === 'zip' && !uploadedFile)
              }
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container font-headline-sm text-sm font-bold transition-all shadow-glow-lime hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                  <span>Launching Overview & Console...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                  <span>
                    {selectedMethod === 'url'
                      ? 'Ingest GitHub Repo & Launch Console →'
                      : 'Upload ZIP & Launch Console →'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 lg:px-8 border-t border-surface-container-high/40 text-center text-xs text-outline font-sans">
        <p>RepoLens AST Engine • Ephemeral Sandboxed Memory • Zero Permanent Source Code Retention</p>
      </footer>
    </div>
  );
};
