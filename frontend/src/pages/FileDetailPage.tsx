import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const FileDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'code' | 'ast' | 'dependents'>('code');

  return (
    <div className="space-y-space-lg">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-sm">
          <button
            onClick={() => navigate('/file-explorer')}
            className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container border border-surface-container-highest text-outline hover:text-on-surface transition-colors"
            title="Back to File Explorer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-code text-outline">
              <span>repolens-demo</span>
              <span>/</span>
              <span>services</span>
              <span>/</span>
              <span className="text-on-surface font-semibold">auth_service.py</span>
            </div>
            <div className="flex items-center gap-space-xs mt-1">
              <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold font-code">
                auth_service.py
              </h1>
              <span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-error-container/30 text-error font-bold border border-error/30 animate-pulse">
                CRITICAL PATH
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-space-sm self-start sm:self-auto">
          <button
            onClick={() => navigate('/blast-radius')}
            className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high border border-surface-container-highest text-on-surface text-body-sm font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">radar</span>
            <span>Simulate Blast Radius</span>
          </button>
          <button
            onClick={() => navigate('/issues/ISSUE-2041')}
            className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-error-container text-on-error-container font-headline-sm text-body-sm font-semibold transition-all shadow-glow-red"
          >
            <span className="material-symbols-outlined text-[18px]">bug_report</span>
            <span>Fix CWE-78</span>
          </button>
        </div>
      </div>

      {/* Top 4 Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <span className="text-outline text-xs uppercase font-label-caps font-semibold">Lines of Code</span>
          <div className="text-2xl font-bold font-code text-on-surface mt-1">412 LOC</div>
          <div className="text-xs text-outline font-code mt-0.5">14 functions, 2 classes</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <span className="text-outline text-xs uppercase font-label-caps font-semibold">Direct Dependents</span>
          <div className="text-2xl font-bold font-code text-secondary mt-1">14 modules</div>
          <div className="text-xs text-secondary font-code mt-0.5">High coupling gravity</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <span className="text-outline text-xs uppercase font-label-caps font-semibold">Blast Radius Risk</span>
          <div className="text-2xl font-bold font-code text-error mt-1">88%</div>
          <div className="text-xs text-error font-code mt-0.5">4 API routes impacted</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <span className="text-outline text-xs uppercase font-label-caps font-semibold">Audited Findings</span>
          <div className="text-2xl font-bold font-code text-amber-400 mt-1">2 Open</div>
          <div className="text-xs text-amber-400 font-code mt-0.5">1 Critical (CWE-78)</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-space-sm border-b border-surface-container-high">
        <button
          onClick={() => setActiveTab('code')}
          className={`px-4 py-2.5 font-headline-sm text-body-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'code'
              ? 'border-primary-container text-primary-container'
              : 'border-transparent text-outline hover:text-on-surface'
          }`}
        >
          Code &amp; Taint Annotations
        </button>
        <button
          onClick={() => setActiveTab('ast')}
          className={`px-4 py-2.5 font-headline-sm text-body-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'ast'
              ? 'border-primary-container text-primary-container'
              : 'border-transparent text-outline hover:text-on-surface'
          }`}
        >
          AST Symbol Tree
        </button>
        <button
          onClick={() => setActiveTab('dependents')}
          className={`px-4 py-2.5 font-headline-sm text-body-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'dependents'
              ? 'border-primary-container text-primary-container'
              : 'border-transparent text-outline hover:text-on-surface'
          }`}
        >
          Downstream Dependents (14)
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'code' && (
        <div className="rounded-xl bg-surface-container-lowest border border-surface-container-high overflow-hidden shadow-xl">
          <div className="p-space-sm px-space-md bg-surface-container-low border-b border-surface-container-high flex items-center justify-between text-xs font-code">
            <span className="text-outline">services/auth_service.py [Python 3.11]</span>
            <span className="text-error font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-error" />
              Lines 141-143 Flagged for Command Injection
            </span>
          </div>

          <div className="p-4 font-code text-xs bg-black/60 overflow-x-auto leading-relaxed">
            <div className="text-outline">135  import subprocess</div>
            <div className="text-outline">136  from core.tokens import TokenManager</div>
            <div className="text-outline">137</div>
            <div className="text-outline">138  def execute_system_auth_hook(user_id: str, payload: dict) -&gt; bool:</div>
            <div className="text-outline">139      # Build authentication probe command</div>
            <div className="text-outline">140      command_prefix = &quot;/usr/local/bin/ldap_verify&quot;</div>
            <div className="text-amber-300 bg-amber-500/10 px-1 rounded">
              141      cmd = f&quot;&#123;command_prefix&#125; --user &#123;user_id&#125; --realm &#123;payload.get('realm')&#125;&quot;
            </div>
            <div className="text-error bg-error-container/30 border-l-2 border-error px-1 font-bold my-1">
              142      # CRITICAL: shell=True executes with system shell privileges
            </div>
            <div className="text-error bg-error-container/30 border-l-2 border-error px-1 font-bold">
              143      result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            </div>
            <div className="text-outline mt-1">144      return result.returncode == 0</div>
            <div className="text-outline">145</div>
            <div className="text-outline">146  def validate_token(token: str) -&gt; dict:</div>
            <div className="text-outline">147      # Core authentication validation</div>
            <div className="text-outline">148      return TokenManager().verify_and_decode(token)</div>
          </div>
        </div>
      )}

      {activeTab === 'ast' && (
        <div className="p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high space-y-space-md">
          <h3 className="font-headline-sm text-body-sm font-semibold text-on-surface">
            Registered AST Symbols
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm font-code text-xs">
            <div className="p-3 rounded-lg bg-surface-container border border-surface-container-highest">
              <div className="font-semibold text-primary-container">Function: execute_system_auth_hook</div>
              <div className="text-outline text-[11px] mt-1">Args: (user_id: str, payload: dict) -&gt; bool</div>
              <div className="text-error text-[11px] mt-1">Status: Taint Sink Flagged</div>
            </div>
            <div className="p-3 rounded-lg bg-surface-container border border-surface-container-highest">
              <div className="font-semibold text-secondary">Function: validate_token</div>
              <div className="text-outline text-[11px] mt-1">Args: (token: str) -&gt; dict</div>
              <div className="text-primary-container text-[11px] mt-1">Status: Core Blast Anchor</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dependents' && (
        <div className="p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high space-y-space-md">
          <h3 className="font-headline-sm text-body-sm font-semibold text-on-surface">
            Downstream Modules Depending on auth_service.py
          </h3>
          <div className="space-y-2 font-code text-xs">
            {[
              { path: 'api/v1/routers/user.py', type: 'Endpoint Handler', risk: 'High' },
              { path: 'api/v1/routers/billing.py', type: 'Endpoint Handler', risk: 'High' },
              { path: 'middleware/jwt_auth.py', type: 'HTTP Middleware', risk: 'Critical' },
              { path: 'workers/task_runner.py', type: 'Async Worker', risk: 'Medium' },
            ].map((d, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-surface-container border border-surface-container-highest flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-outline">
                    description
                  </span>
                  <span className="font-semibold text-on-surface">{d.path}</span>
                  <span className="text-outline">({d.type})</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    d.risk === 'Critical' ? 'text-error bg-error/20' : 'text-amber-400 bg-amber-500/20'
                  }`}
                >
                  {d.risk} Risk
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
