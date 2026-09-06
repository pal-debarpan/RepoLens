import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { repoService } from '../services/api';

export const ConnectRepoPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshRepositories, setActiveRepoId } = useApp();

  const [provider, setProvider] = useState<'github' | 'gitlab' | 'bitbucket' | 'custom'>('github');
  const [repoUrl, setRepoUrl] = useState('https://github.com/repolens-org/payments-core.git');
  const [repoName, setRepoName] = useState('payments-core');
  const [branch, setBranch] = useState('main');
  const [token, setToken] = useState('ghp_920f8ab73ce184209fa29c');
  const [depth, setDepth] = useState<'l1' | 'l3' | 'l4'>('l3');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const created = await repoService.createRepository({
      name: repoName || 'payments-core',
      branch: branch || 'main',
      language: 'TypeScript / Node',
      framework: 'FastAPI / NestJS',
      scanDepth: depth === 'l3' ? 'L3 AST' : depth === 'l4' ? 'Full Monorepo' : 'L1 Static',
    });

    await refreshRepositories();
    setActiveRepoId(created.id);
    navigate('/progress');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-space-xl">
      {/* Header with Back button */}
      <div className="flex items-center gap-space-sm">
        <button
          onClick={() => navigate('/repositories')}
          className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container border border-surface-container-highest text-outline hover:text-on-surface transition-colors"
          title="Back to Repositories"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        </button>
        <div>
          <div className="flex items-center gap-space-xs">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
              Connect Repository
            </h1>
            <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-surface-container text-primary-container font-mono">
              PIPELINE INGESTION
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Provision real-time AST ingestion pipeline, dependency graph parsing, and blast-radius tracing.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-space-lg">
        {/* Provider Selection */}
        <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-space-lg space-y-space-md shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-[20px]">
                lan
              </span>
              1. Select Git Host
            </h2>
            <span className="text-xs font-code text-outline">OAuth2 &amp; PAT Supported</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            {[
              { id: 'github', name: 'GitHub', desc: 'Cloud & Enterprise Server', icon: 'deployed_code' },
              { id: 'gitlab', name: 'GitLab', desc: 'Self-hosted or GitLab.com', icon: 'merge' },
              { id: 'bitbucket', name: 'Bitbucket', desc: 'Server & Cloud Workspace', icon: 'source' },
              { id: 'custom', name: 'Custom Git', desc: 'Raw SSH / HTTPS Git Endpoint', icon: 'terminal' },
            ].map((p) => {
              const isSelected = provider === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setProvider(p.id as any)}
                  className={`p-space-md rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-surface-container border-primary-container ring-1 ring-primary-container'
                      : 'bg-surface-container-lowest border-surface-container-highest hover:bg-surface-container-high'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`material-symbols-outlined text-[24px] ${isSelected ? 'text-primary-container' : 'text-outline'}`}>
                      {p.icon}
                    </span>
                    <span className={`material-symbols-outlined text-[18px] ${isSelected ? 'text-primary-container' : 'text-outline opacity-20'}`}>
                      {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="font-headline-sm text-body-sm font-semibold text-on-surface">
                      {p.name}
                    </div>
                    <div className="font-body-sm text-[11px] text-outline mt-0.5">
                      {p.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Repository Identification & Authentication */}
        <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-space-lg space-y-space-md shadow-sm">
          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[20px]">
              key
            </span>
            2. Repository Coordinates &amp; Access
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            <div className="space-y-1">
              <label className="font-body-sm text-body-sm text-on-surface font-medium">
                Repository Endpoint URL
              </label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => {
                  setRepoUrl(e.target.value);
                  const segments = e.target.value.split('/');
                  const last = segments[segments.length - 1]?.replace('.git', '');
                  if (last) setRepoName(last);
                }}
                className="w-full px-3 py-2 rounded-lg bg-surface-container border border-surface-container-highest text-on-surface font-code text-xs focus:outline-none focus:border-primary-container"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-body-sm text-body-sm text-on-surface font-medium">
                Workspace Repository Alias
              </label>
              <input
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container border border-surface-container-highest text-on-surface font-code text-xs focus:outline-none focus:border-primary-container"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-body-sm text-body-sm text-on-surface font-medium">
                Default Target Branch
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container border border-surface-container-highest text-on-surface font-code text-xs focus:outline-none focus:border-primary-container"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-body-sm text-body-sm text-on-surface font-medium">
                Personal Access Token (Read Scope)
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container border border-surface-container-highest text-on-surface font-code text-xs focus:outline-none focus:border-primary-container"
                required
              />
            </div>
          </div>
        </div>

        {/* Scan Depth Selection */}
        <div className="bg-surface-container-low border border-surface-container-high rounded-xl p-space-lg space-y-space-md shadow-sm">
          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[20px]">
              psychology
            </span>
            3. Analysis Depth &amp; Graph Resolution
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            {[
              {
                id: 'l1',
                title: 'L1 Static AST',
                time: '~30s initial scan',
                desc: 'Fast lexical and syntactic parsing. Maps exports, basic function signatures, and simple imports.',
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
            disabled={isSubmitting}
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
                <span>Initialize Ingestion Pipeline</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
