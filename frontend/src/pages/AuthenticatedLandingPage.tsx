import React, { useRef, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { RepoLensLogo } from '../components/common/RepoLensLogo';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { useApp, useWaterNavigate } from '../context';
import darkHeroVideo from '../../lime_spark_B6FF2E_10s.mp4';
import lightHeroVideo from '../../vid_light_emerald.mp4';

export const AuthenticatedLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { waterNavigate } = useWaterNavigate();
  const { theme, user, logout } = useApp();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lightVideoRef = useRef<HTMLVideoElement>(null);

  const isLight = theme === 'light';
  const displayEmail = user?.email || 'developer@repolens.io';
  const displayName = user?.name || (displayEmail.includes('@') ? displayEmail.split('@')[0] : 'Developer');
  const userInitial = displayEmail.charAt(0).toUpperCase();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  useEffect(() => {
    if (!isLight && videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    } else if (isLight && lightVideoRef.current) {
      lightVideoRef.current.defaultMuted = true;
      lightVideoRef.current.muted = true;
      lightVideoRef.current.play().catch(() => {});
    }
  }, [isLight]);

  return (
    <div className="min-h-screen bg-background text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container flex flex-col relative overflow-x-hidden">
      {/* Top Hero with Video Backdrop */}
      <div className="relative isolate overflow-hidden border-b border-surface-container-high/40">
        {!isLight && (
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <video
              ref={videoRef}
              src={darkHeroVideo}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
            >
              <source src={darkHeroVideo} type="video/mp4" />
              <source src="/lime_spark_B6FF2E_10s.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          </div>
        )}

        {isLight && (
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <video
              ref={lightVideoRef}
              src={lightHeroVideo}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-cover mix-blend-multiply opacity-45"
            >
              <source src={lightHeroVideo} type="video/mp4" />
              <source src="/vid_light_emerald.mp4" type="video/mp4" />
              <source src="/vid.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-background/20 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          </div>
        )}

        {/* Authenticated Navigation Header */}
        <header className="relative z-50 px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/home" className="flex items-center hover:opacity-90 transition-opacity">
              <RepoLensLogo size="lg" />
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/app"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container/40 transition-colors"
              >
                Console
              </Link>
              <Link
                to="/repositories"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container/40 transition-colors"
              >
                Repositories
              </Link>
              <Link
                to="/ai-assistant"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container/40 transition-colors"
              >
                AI Assistant
              </Link>
              <Link
                to="/architecture"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container/40 transition-colors"
              >
                Architecture
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle size="sm" />

            {/* Profile Button (Replaces Sign In completely on this authenticated landing page) */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-surface-container-low/90 hover:bg-surface-container border border-surface-container-highest backdrop-blur-sm transition-all cursor-pointer shadow-sm hover:border-primary-container/60 group"
                aria-label="User Profile"
                aria-expanded={profileOpen}
              >
                <div className="w-6 h-6 rounded-lg bg-primary-container/20 border border-primary-container/40 text-primary-container font-mono text-xs font-bold flex items-center justify-center group-hover:scale-105 transition-transform">
                  {userInitial}
                </div>
                <span className="hidden sm:inline-block font-mono text-xs text-on-surface max-w-[150px] truncate">
                  {displayEmail}
                </span>
                <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-on-surface transition-transform duration-200">
                  {profileOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {/* Profile Dropdown Popover */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-surface-container-low/95 backdrop-blur-md border border-surface-container-high p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
                  {/* User Info */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-container/20 border border-primary-container/40 text-primary-container font-mono text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-sm">
                      {userInitial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-on-surface truncate">
                        {displayName}
                      </div>
                      <div className="font-mono text-[11px] text-on-surface-variant truncate mt-0.5">
                        {displayEmail}
                      </div>
                      <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-primary-container/15 text-primary-container font-mono text-[10px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
                        <span>Active Session</span>
                      </span>
                    </div>
                  </div>

                  <div className="h-px bg-surface-container-high" />

                  {/* Sign Out Button */}
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-error hover:bg-error-container/20 border border-transparent hover:border-error/30 transition-all cursor-pointer"
                    onClick={() => {
                      logout();
                      setProfileOpen(false);
                      navigate('/');
                    }}
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Authenticated Hero Banner */}
        <div className="pt-10 pb-16 px-4 lg:px-8 max-w-6xl mx-auto flex flex-col items-center text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low/90 backdrop-blur-md border border-surface-container-highest text-xs font-sans">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
            <span className="text-on-surface font-semibold">Workspace Online</span>
            <span className="text-surface-variant">•</span>
            <span className="text-primary-container font-semibold tracking-wider font-mono text-[11px]">
              {displayEmail}
            </span>
          </div>

          <h1 className="font-headline-xl text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-on-surface max-w-4xl leading-tight drop-shadow-md">
            Welcome to Your <span className="text-primary-container">Codebase Command Center</span>
          </h1>

          <p className="font-body-md text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
            Autonomous AST telemetry, deep blast radius graphs, and proactive security invariants ready for your repositories.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/app')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container font-headline-sm text-sm font-semibold transition-all shadow-glow-lime hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">terminal</span>
              <span>Launch Console Workspace</span>
            </button>
            <button
              onClick={(e) => waterNavigate('/ingest', e)}
              className="page-link inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-container-highest text-on-surface font-headline-sm text-sm font-semibold transition-colors hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">upload_file</span>
              <span>Ingest Repository / ZIP</span>
            </button>
            <button
              onClick={() => navigate('/ai-assistant')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-container-highest text-on-surface font-headline-sm text-sm font-semibold transition-colors hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              <span>AI Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Authenticated Workspace Hub Launchpad */}
      <section className="py-12 px-4 lg:px-8 bg-background border-b border-surface-container-high">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-headline-sm text-on-surface">
                Active Codebase Hub
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Quick jump into indexed repositories, architecture models, or telemetry.
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container text-primary-container font-mono text-xs border border-surface-container-high">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-ping" />
              Telemetry Engine Nominal
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Active Repository Card */}
            <div
              onClick={() => navigate('/app')}
              className="p-6 rounded-2xl bg-surface-container-low border border-surface-container-high hover:border-primary-container cursor-pointer transition-all duration-300 ease-out space-y-4 group shadow-sm hover:shadow-xl hover:shadow-primary-container/15 hover:scale-[1.02] hover:bg-surface-container"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-primary-container/15 text-primary-container flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">folder_code</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-primary-container/10 text-primary-container font-mono text-[11px] font-bold">
                  ACTIVE
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface group-hover:text-primary-container transition-colors">
                  repolens-demo
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  24,180 LOC • TypeScript • React • 98% Health Score
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-primary-container group-hover:translate-x-1 transition-transform">
                <span>Open Overview Console</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </div>
            </div>

            {/* Ingest Codebase Card */}
            <div
              onClick={(e) => waterNavigate('/ingest', e)}
              className="page-link p-6 rounded-2xl bg-surface-container-low border border-surface-container-high hover:border-primary-container cursor-pointer transition-all duration-300 ease-out space-y-4 group shadow-sm hover:shadow-xl hover:shadow-primary-container/15 hover:scale-[1.02] hover:bg-surface-container"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-primary-container/15 text-primary-container flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono text-[11px]">
                  PIPELINE
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface group-hover:text-primary-container transition-colors">
                  Ingest Codebase
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Clone from GitHub URL or drag & drop codebase zip file for instant AST parsing.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-primary-container group-hover:translate-x-1 transition-transform">
                <span>Start Ingestion</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </div>
            </div>

            {/* AI Assistant Card */}
            <div
              onClick={() => navigate('/ai-assistant')}
              className="p-6 rounded-2xl bg-surface-container-low border border-surface-container-high hover:border-primary-container cursor-pointer transition-all duration-300 ease-out space-y-4 group shadow-sm hover:shadow-xl hover:shadow-primary-container/15 hover:scale-[1.02] hover:bg-surface-container"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-primary-container/15 text-primary-container flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">psychology</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono text-[11px]">
                  SYNTHESIS
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface group-hover:text-primary-container transition-colors">
                  AI Architectural Assistant
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Ask architectural questions, trace complex data flows, and verify blast radius.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-primary-container group-hover:translate-x-1 transition-transform">
                <span>Open Assistant</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-16 px-4 lg:px-8 border-b border-surface-container-high bg-surface-container-lowest/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="font-headline-xl text-2xl sm:text-3xl font-bold text-on-surface">
              Engine Capabilities & Tools
            </h2>
            <p className="font-body-md text-sm text-on-surface-variant max-w-xl mx-auto">
              Real-time deep analysis engines ready for your team's codebases.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
              onClick={() => navigate('/blast-radius')}
              className="p-5 rounded-2xl bg-surface-container-low border border-surface-container-high hover:border-primary-container cursor-pointer transition-all duration-300 ease-out space-y-3 group shadow-sm hover:shadow-lg hover:bg-surface-container"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-container/10 text-primary-container flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[24px]">radar</span>
              </div>
              <h3 className="font-headline-sm text-base font-bold text-on-surface group-hover:text-primary-container transition-colors">
                Blast Radius Engine
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Traverse 1-to-5 degree call graphs to locate direct and indirect dependents and affected API routes.
              </p>
            </div>

            <div
              onClick={() => navigate('/security')}
              className="p-5 rounded-2xl bg-surface-container-low border border-surface-container-high hover:border-error cursor-pointer transition-all duration-300 ease-out space-y-3 group shadow-sm hover:shadow-lg hover:bg-surface-container"
            >
              <div className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[24px]">security</span>
              </div>
              <h3 className="font-headline-sm text-base font-bold text-on-surface group-hover:text-error transition-colors">
                Syntactic Taint Audit
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Scan for command injection, hardcoded secrets, and cryptographic entropy loss directly in your AST.
              </p>
            </div>

            <div
              onClick={() => navigate('/architecture')}
              className="p-5 rounded-2xl bg-surface-container-low border border-surface-container-high hover:border-primary-container cursor-pointer transition-all duration-300 ease-out space-y-3 group shadow-sm hover:shadow-lg hover:bg-surface-container"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-container/10 text-primary-container flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[24px]">schema</span>
              </div>
              <h3 className="font-headline-sm text-base font-bold text-on-surface group-hover:text-primary-container transition-colors">
                Architectural Invariants
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Enforce clean module boundaries and boundary integrity automatically on every commit.
              </p>
            </div>

            <div
              onClick={() => navigate('/testing')}
              className="p-5 rounded-2xl bg-surface-container-low border border-surface-container-high hover:border-primary-container cursor-pointer transition-all duration-300 ease-out space-y-3 group shadow-sm hover:shadow-lg hover:bg-surface-container"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-container/10 text-primary-container flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[24px]">flaky</span>
              </div>
              <h3 className="font-headline-sm text-base font-bold text-on-surface group-hover:text-primary-container transition-colors">
                Test Intelligence
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Predict regressions and prioritize test execution based on impacted code paths.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 lg:px-8 border-t border-surface-container-high bg-background flex flex-col sm:flex-row items-center justify-between text-xs text-on-surface-variant gap-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <RepoLensLogo size="sm" />
          <span>© 2026 RepoLens Labs Inc. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/app" className="hover:text-on-surface transition-colors">Console</Link>
          <Link to="/repositories" className="hover:text-on-surface transition-colors">Repositories</Link>
          <Link to="/ai-assistant" className="hover:text-on-surface transition-colors">AI Assistant</Link>
        </div>
      </footer>
    </div>
  );
};
