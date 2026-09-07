import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import * as analysisService from '../services/analysisService';
import { FindingResponse } from '../types';

export const IssueDetailPage: React.FC = () => {
  const { issueId } = useParams<{ issueId: string }>();
  const navigate = useNavigate();
  const { currentAnalysisId } = useApp();

  const [issue, setIssue] = useState<FindingResponse | null>(null);
  const [patchApplied, setPatchApplied] = useState(false);

  useEffect(() => {
    if (currentAnalysisId && issueId) {
      analysisService.getFinding(currentAnalysisId, issueId)
        .then((res) => setIssue(res || null))
        .catch(() => setIssue(null));
    }
  }, [currentAnalysisId, issueId]);

  if (!issue) {
    return (
      <div className="p-8 text-center text-outline font-body-md">
        Loading finding telemetry...
      </div>
    );
  }

  const handleApplyPatch = () => {
    setPatchApplied(true);
  };

  return (
    <div className="space-y-space-lg">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-sm">
          <button
            onClick={() => navigate('/issues')}
            className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container border border-surface-container-highest text-outline hover:text-on-surface transition-colors"
            title="Back to Issues"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-code text-xs text-error font-bold">{issue.id.slice(0,8)}</span>
              <span className="font-code text-xs text-outline">•</span>
              {issue.metadata_payload?.cwe && (
                <span className="font-code text-xs px-1.5 py-0.5 rounded bg-surface-container-highest text-primary-container font-mono">
                  {issue.metadata_payload.cwe}
                </span>
              )}
              {issue.metadata_payload?.cve && (
                <span className="font-code text-xs px-1.5 py-0.5 rounded bg-error-container/30 text-error font-mono font-semibold">
                  {issue.metadata_payload.cve}
                </span>
              )}
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold mt-1">
              {issue.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-space-sm self-start sm:self-auto">
          <button
            onClick={() => navigate('/blast-radius')}
            className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high border border-surface-container-highest text-on-surface text-body-sm font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">radar</span>
            <span>Simulate Blast</span>
          </button>
          <button
            onClick={() => navigate('/ai-assistant')}
            className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container font-headline-sm text-body-sm font-semibold transition-all shadow-glow-lime"
          >
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            <span>Ask AI</span>
          </button>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Left 7 Cols: Code Evidence Viewer */}
        <div className="lg:col-span-7 space-y-space-md">
          {/* Breadcrumb & Target Path */}
          <div className="p-space-sm px-space-md rounded-lg bg-surface-container-low border border-surface-container-high flex items-center justify-between font-code text-xs text-outline">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary-container">
                code
              </span>
              <span className="text-on-surface font-semibold">{issue.file_path}</span>
              <span>: Line {issue.line_number || 1}</span>
            </div>
            <span className="text-error font-semibold">Taint Sink Detected</span>
          </div>

          {/* Interactive Code Viewer Box */}
          <div className="rounded-xl bg-surface-container-lowest border border-surface-container-high overflow-hidden shadow-xl">
            <div className="px-4 py-2.5 bg-surface-container-low border-b border-surface-container-high flex items-center justify-between text-xs font-code">
              <span className="text-outline">Python 3.11 AST Taint Trace</span>
              <span className="text-error font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
                Line 142: Subprocess Execution
              </span>
            </div>

            <div className="p-4 font-code text-xs bg-black/50 overflow-x-auto leading-relaxed">
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
            </div>

            <div className="p-3 bg-surface-container border-t border-surface-container-high text-xs text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-amber-400">info</span>
              <span>
                User-controlled payload key <code className="text-on-surface font-code">realm</code> is interpolated directly into system bash execution.
              </span>
            </div>
          </div>

          {/* Taint Flow Trace */}
          <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high space-y-space-sm">
            <h3 className="font-headline-sm text-body-sm font-semibold text-on-surface">
              Syntactic Taint Trace
            </h3>
            <div className="space-y-2 font-code text-xs">
              <div className="flex items-center gap-2 text-outline">
                <span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center text-[10px]">1</span>
                <span>Source: HTTP Header <code className="text-on-surface">X-Realm-Target</code> in <code className="text-on-surface">api/routes.py:84</code></span>
              </div>
              <div className="flex items-center gap-2 text-outline">
                <span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center text-[10px]">2</span>
                <span>Flow: Passed into <code className="text-on-surface">auth_service.py::validate_token(payload)</code></span>
              </div>
              <div className="flex items-center gap-2 text-error font-semibold">
                <span className="w-5 h-5 rounded-full bg-error/20 flex items-center justify-center text-[10px]">3</span>
                <span>Sink: <code className="text-error">subprocess.run(..., shell=True)</code> in <code className="text-error">auth_service.py:142</code></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Vulnerability Details & AI Remediation Patch */}
        <div className="lg:col-span-5 space-y-space-md">
          {/* Metadata Card */}
          <div className="p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high space-y-space-md shadow-sm">
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Vulnerability Telemetry
            </h2>

            <div className="grid grid-cols-2 gap-space-sm text-xs font-sans">
              <div className="p-2 rounded bg-surface-container">
                <span className="text-outline text-[10px] uppercase font-medium">Severity</span>
                <div className="font-bold text-error mt-0.5">{issue.severity}</div>
              </div>
              <div className="p-2 rounded bg-surface-container">
                <span className="text-outline text-[10px] uppercase font-medium">Category</span>
                <div className="font-bold text-amber-400 mt-0.5 font-heading">{issue.category}</div>
              </div>
              <div className="p-2 rounded bg-surface-container">
                <span className="text-outline text-[10px] uppercase font-medium">File Path</span>
                <div className="font-semibold text-on-surface mt-0.5 truncate font-code text-[11px]">{issue.file_path}</div>
              </div>
              <div className="p-2 rounded bg-surface-container">
                <span className="text-outline text-[10px] uppercase font-medium">Line</span>
                <div className="font-semibold text-primary-container mt-0.5">
                  {patchApplied ? 'Resolved' : `#${issue.line_number || 1}`}
                </div>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
              {issue.description}
            </p>
            {issue.evidence && (
              <p className="text-xs text-outline leading-relaxed font-code mt-1 p-2 bg-surface-container rounded">
                {issue.evidence}
              </p>
            )}
          </div>

          {/* AI Remediation Diff Proposal */}
          <div className="p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high space-y-space-md shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary-container text-[18px]">
                  auto_fix_high
                </span>
                <h3 className="font-headline-sm text-body-sm font-semibold text-on-surface">
                  AI Remediation Patch
                </h3>
              </div>
              <span className="text-[10px] font-sans font-semibold px-1.5 py-0.5 rounded bg-surface-container-highest text-primary-container">
                Safe AST Transform
              </span>
            </div>

            <div className="font-code text-xs bg-black/60 p-3 rounded-lg overflow-x-auto leading-relaxed border border-surface-container-highest">
              <div className="text-error bg-error/10 px-1">
                - cmd = f&quot;&#123;command_prefix&#125; --user &#123;user_id&#125; --realm &#123;payload.get('realm')&#125;&quot;
              </div>
              <div className="text-error bg-error/10 px-1">
                - result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
              </div>
              <div className="text-primary-container bg-primary-container/10 px-1 font-semibold mt-1">
                + cmd = [&quot;/usr/local/bin/ldap_verify&quot;, &quot;--user&quot;, user_id, &quot;--realm&quot;, payload.get(&quot;realm&quot;, &quot;&quot;)]
              </div>
              <div className="text-primary-container bg-primary-container/10 px-1 font-semibold">
                + result = subprocess.run(cmd, shell=False, capture_output=True, text=True)
              </div>
            </div>

            <p className="text-xs text-outline">
              {issue.suggested_fix || 'Passing arguments as a list with <code>shell=False</code> bypasses shell interpolation, completely neutralizing injection vectors.'}
            </p>

            <button
              onClick={handleApplyPatch}
              disabled={patchApplied}
              className={`w-full py-2.5 rounded-lg font-headline-sm text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                patchApplied
                  ? 'bg-surface-container text-outline cursor-default'
                  : 'bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container shadow-glow-lime'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {patchApplied ? 'check_circle' : 'build'}
              </span>
              <span>{patchApplied ? 'Patch Applied to AST Context' : 'Apply Remediation Patch'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
