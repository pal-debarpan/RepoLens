import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RepoLensLogo } from '../components/common/RepoLensLogo';
import { useApp } from '../context';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useApp();

  return (
    <div className="min-h-screen bg-background text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container flex flex-col">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-surface-container-high px-4 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <RepoLensLogo size="md" />
          <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-outline">
            <a href="#features" className="hover:text-on-surface transition-colors">Features</a>
            <a href="#blast-radius" className="hover:text-on-surface transition-colors">Blast Radius</a>
            <a href="#security" className="hover:text-on-surface transition-colors">Security</a>
            <a href="#architecture" className="hover:text-on-surface transition-colors">Architecture</a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            title="Toggle theme"
          >
            <span className="material-symbols-outlined text-[20px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-3.5 py-1.5 rounded-lg text-on-surface hover:bg-surface-container transition-colors font-headline-sm text-xs font-semibold"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/app')}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container font-headline-sm text-xs font-semibold transition-all shadow-glow-lime"
          >
            <span>Launch Console</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 px-4 lg:px-8 border-b border-surface-container-high">
        {/* Background Photon Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary-container/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto flex flex-col items-center text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low border border-surface-container-highest text-xs font-code">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
            <span className="text-on-surface font-semibold">RepoLens v2.4 Active</span>
            <span className="text-surface-variant">•</span>
            <span className="text-primary-container">Topological AST Intelligence</span>
          </div>

          <h1 className="font-headline-xl text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-on-surface max-w-4xl leading-tight">
            Understand the <span className="text-primary-container underline decoration-primary-container/40 underline-offset-8">Blast Radius</span> of Every Code Change
          </h1>

          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
            The developer platform answering the essential pre-commit question:
            <strong className="text-on-surface block mt-1">"If I change this code, what else could be affected?"</strong>
            Maps downstream dependencies, flags security taint, and isolates regression tests before pull requests merge.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => navigate('/ingest')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container font-headline-sm text-sm font-semibold transition-all shadow-glow-lime"
            >
              <span className="material-symbols-outlined text-[20px]">upload_file</span>
              <span>Ingest Repository / Upload ZIP</span>
            </button>
            <button
              onClick={() => navigate('/app')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-container-highest text-on-surface font-headline-sm text-sm font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">play_circle</span>
              <span>Explore Interactive Demo</span>
            </button>
          </div>

          {/* Interactive Code Diff & Ripple Preview Card */}
          <div className="w-full max-w-5xl mt-12 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-2xl overflow-hidden text-left">
            <div className="h-10 px-4 bg-surface-container-low border-b border-surface-container-high flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-error/70" />
                <span className="w-3 h-3 rounded-full bg-amber-400/70" />
                <span className="w-3 h-3 rounded-full bg-primary-container/70" />
                <span className="text-xs font-code text-outline ml-2">services/auth_service.py — Blast Simulation</span>
              </div>
              <span className="text-[11px] font-code px-2 py-0.5 rounded bg-primary-container/20 text-primary-container font-semibold">
                84% Ripple Impact
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-surface-container-high">
              {/* Code Snippet Column */}
              <div className="md:col-span-7 p-5 font-code text-xs leading-relaxed bg-black/60 overflow-x-auto">
                <div className="text-outline select-none">140  command_prefix = "/usr/local/bin/ldap_verify"</div>
                <div className="text-error bg-error/10 px-2 py-0.5 rounded my-1 border-l-2 border-error">
                  - 141  cmd = f"&#123;command_prefix&#125; --user &#123;user_id&#125; --realm &#123;payload['realm']&#125;"
                </div>
                <div className="text-error bg-error/10 px-2 py-0.5 rounded mb-1 border-l-2 border-error">
                  - 142  result = subprocess.run(cmd, shell=True, capture_output=True)
                </div>
                <div className="text-primary-container bg-primary-container/10 px-2 py-0.5 rounded mb-1 border-l-2 border-primary-container font-semibold">
                  + 141  cmd = [command_prefix, "--user", user_id, "--realm", payload.get("realm", "")]
                </div>
                <div className="text-primary-container bg-primary-container/10 px-2 py-0.5 rounded border-l-2 border-primary-container font-semibold">
                  + 142  result = subprocess.run(cmd, shell=False, capture_output=True)
                </div>
                <div className="text-outline select-none mt-2">143  return result.returncode == 0</div>
              </div>

              {/* Cascade Telemetry Column */}
              <div className="md:col-span-5 p-5 bg-surface-container-low flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-code">
                    <span className="text-outline uppercase font-semibold">Cascade Ripple Matrix</span>
                    <span className="text-error font-bold">4 API Endpoints</span>
                  </div>

                  <div className="space-y-2 text-xs font-code">
                    <div className="p-2 rounded bg-surface-container border border-surface-container-highest flex items-center justify-between">
                      <span className="text-on-surface">POST /api/v1/billing/checkout</span>
                      <span className="text-[10px] text-error font-bold">CRITICAL</span>
                    </div>
                    <div className="p-2 rounded bg-surface-container border border-surface-container-highest flex items-center justify-between">
                      <span className="text-on-surface">GET /api/v1/user/profile</span>
                      <span className="text-[10px] text-amber-400 font-bold">HIGH</span>
                    </div>
                    <div className="p-2 rounded bg-surface-container border border-surface-container-highest flex items-center justify-between">
                      <span className="text-on-surface">tests/unit/test_auth_service.py</span>
                      <span className="text-[10px] text-primary-container font-bold">TARGETED</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-surface-container-highest flex items-center justify-between text-xs font-code text-outline">
                  <span>Confidence: <strong className="text-on-surface">96% AST verified</strong></span>
                  <button
                    onClick={() => navigate('/blast-radius')}
                    className="text-primary-container hover:underline font-semibold"
                  >
                    Open Graph →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Section */}
      <section id="features" className="py-20 px-4 lg:px-8 border-b border-surface-container-high bg-surface-container-lowest">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <span className="font-label-caps text-label-caps px-3 py-1 rounded-full bg-surface-container text-primary-container uppercase font-semibold">
              Platform Architecture
            </span>
            <h2 className="font-headline-xl text-3xl sm:text-4xl font-bold text-on-surface">
              Architectural Intelligence Built for Modern Engineering
            </h2>
            <p className="font-body-md text-on-surface-variant max-w-xl mx-auto">
              Replace guesswork with deterministic AST parsing, cross-module taint propagation, and change-risk telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
              id="blast-radius"
              onClick={() => navigate('/blast-radius')}
              className="p-6 rounded-2xl bg-surface-container-low border border-surface-container-high hover:border-primary-container/50 cursor-pointer transition-all space-y-3 group shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-container/10 text-primary-container flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[28px]">radar</span>
              </div>
              <h3 className="font-headline-sm text-lg font-bold text-on-surface group-hover:text-primary-container transition-colors">
                Blast Radius Engine
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Traverse 1-to-5 degree call graphs to locate direct and indirect dependents, affected API routes, and required unit tests.
              </p>
            </div>

            <div
              id="security"
              onClick={() => navigate('/security')}
              className="p-6 rounded-2xl bg-surface-container-low border border-surface-container-high hover:border-error/50 cursor-pointer transition-all space-y-3 group shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[28px]">security</span>
              </div>
              <h3 className="font-headline-sm text-lg font-bold text-on-surface group-hover:text-error transition-colors">
                Syntactic Taint Audit
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Scan for CWE-78 command injection, hardcoded secrets, and cryptographic entropy loss directly in your AST syntax trees.
              </p>
            </div>

            <div
              id="architecture"
              onClick={() => navigate('/architecture')}
              className="p-6 rounded-2xl bg-surface-container-low border border-surface-container-high hover:border-secondary/50 cursor-pointer transition-all space-y-3 group shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[28px]">hub</span>
              </div>
              <h3 className="font-headline-sm text-lg font-bold text-on-surface group-hover:text-secondary transition-colors">
                Layer Topology
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Interactive Canvas graph showing API gateways, domain services, persistence stores, afferent coupling, and instability metrics.
              </p>
            </div>

            <div
              onClick={() => navigate('/testing')}
              className="p-6 rounded-2xl bg-surface-container-low border border-surface-container-high hover:border-primary-container/50 cursor-pointer transition-all space-y-3 group shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-container/10 text-primary-container flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[28px]">checklist</span>
              </div>
              <h3 className="font-headline-sm text-lg font-bold text-on-surface group-hover:text-primary-container transition-colors">
                Test Impact Analysis
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Execute targeted regression suites (8.2s vs 4m 12s full runner) using topological changed-symbol targeting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ingestion Methods Banner */}
      <section className="py-16 px-4 lg:px-8 border-b border-surface-container-high bg-gradient-to-b from-surface-container-low to-background">
        <div className="max-w-4xl mx-auto rounded-2xl bg-surface-container border border-surface-container-highest p-8 md:p-12 text-center space-y-6 shadow-xl relative overflow-hidden">
          <span className="font-label-caps text-label-caps px-3 py-1 rounded-full bg-primary-container text-on-primary-container font-mono font-bold">
            ZERO FRICTION INGESTION
          </span>
          <h2 className="font-headline-xl text-3xl font-bold text-on-surface">
            Two Ways to Analyze Any Repository in Seconds
          </h2>
          <p className="font-body-md text-on-surface-variant max-w-xl mx-auto">
            Paste a public or private Git repository URL with branch &amp; PAT credentials, or drag and drop a local ZIP / Tarball archive.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => navigate('/ingest')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container font-headline-sm text-sm font-semibold transition-all shadow-glow-lime"
            >
              <span className="material-symbols-outlined text-[18px]">add_link</span>
              <span>Paste Git URL</span>
            </button>
            <button
              onClick={() => navigate('/ingest')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface font-headline-sm text-sm font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">folder_zip</span>
              <span>Upload ZIP File</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 px-4 lg:px-8 bg-surface-container-lowest border-t border-surface-container-high text-xs text-outline font-code">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <RepoLensLogo size="sm" showVersion={false} />
            <span>© 2026 RepoLens. AST Topological Engine active.</span>
          </div>
          <div className="flex items-center gap-6 text-outline">
            <a
              href="https://github.com/luckycode1206/RepoLens"
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary-container transition-colors flex items-center gap-1"
            >
              <span>GitHub</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
            <button onClick={() => navigate('/app')} className="hover:text-primary-container">
              Console
            </button>
            <button onClick={() => navigate('/settings')} className="hover:text-primary-container">
              Settings
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
