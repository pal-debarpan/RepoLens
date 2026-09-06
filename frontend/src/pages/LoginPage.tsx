import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { RepoLensLogo } from '../components/common/RepoLensLogo';
import { useApp } from '../context';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useApp();

  const [email, setEmail] = useState('developer@repolens.io');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/app');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary-container/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <header className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link to="/">
          <RepoLensLogo size="md" />
        </Link>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          title="Toggle theme"
        >
          <span className="material-symbols-outlined text-[20px]">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-md mx-auto my-auto py-8">
        <div className="bg-surface-container-low border border-surface-container-high rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="font-headline-lg text-2xl font-bold text-on-surface">
              Sign In to RepoLens
            </h1>
            <p className="font-body-md text-xs text-on-surface-variant">
              Access your workspace AST telemetry, blast simulations, and code intelligence.
            </p>
          </div>

          {/* Social OAuth Providers */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/app')}
              className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-surface-container-highest transition-colors font-headline-sm text-xs font-semibold text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">deployed_code</span>
              <span>GitHub</span>
            </button>
            <button
              onClick={() => navigate('/app')}
              className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-surface-container-highest transition-colors font-headline-sm text-xs font-semibold text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">merge</span>
              <span>GitLab</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-surface-container-high" />
            <span className="text-[11px] font-code text-outline uppercase">Or email</span>
            <div className="flex-1 h-px bg-surface-container-high" />
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="font-body-sm text-xs text-on-surface font-medium">
                Work Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@company.com"
                className="w-full px-3 py-2 rounded-lg bg-surface-container border border-surface-container-highest text-on-surface font-code text-xs focus:outline-none focus:border-primary-container transition-colors"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-body-sm text-xs text-on-surface font-medium">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password reset email dispatched to developer@repolens.io')}
                  className="text-[11px] text-primary-container hover:underline font-code"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-9 rounded-lg bg-surface-container border border-surface-container-highest text-on-surface font-code text-xs focus:outline-none focus:border-primary-container transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-body-sm">
              <label className="flex items-center gap-2 cursor-pointer text-on-surface-variant">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-surface-container-highest accent-primary-container"
                />
                <span>Remember this workstation</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container font-headline-sm text-xs font-semibold transition-all shadow-glow-lime flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">login</span>
                  <span>Sign In to Console</span>
                </>
              )}
            </button>
          </form>

          {/* Instant Demo Bypass */}
          <div className="p-3 rounded-lg bg-surface-container border border-surface-container-highest text-center space-y-1">
            <span className="text-[11px] text-outline font-code">Need immediate access?</span>
            <div>
              <button
                onClick={() => navigate('/app')}
                className="text-xs font-code text-primary-container hover:underline font-semibold"
              >
                Explore Demo Console with Sample Repositories →
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-outline font-body-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-on-surface hover:text-primary-container font-semibold transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-outline font-code max-w-5xl mx-auto w-full py-2">
        <span>RepoLens AST Security Engine • 256-bit Token Authorization</span>
      </footer>
    </div>
  );
};
