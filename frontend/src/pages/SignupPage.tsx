import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { RepoLensLogo } from '../components/common/RepoLensLogo';
import { useApp } from '../context';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useApp();

  const [fullName, setFullName] = useState('Alex Vance');
  const [email, setEmail] = useState('alex.vance@blackmesa.tech');
  const [teamName, setTeamName] = useState('Core Architecture Guild');
  const [password, setPassword] = useState('sUp3r-S3cur3-p@ss');
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);

  const calculateStrength = (p: string) => {
    if (p.length > 12) return { text: 'Strong', width: 'w-full', color: 'bg-primary-container' };
    if (p.length > 8) return { text: 'Good', width: 'w-3/4', color: 'bg-secondary' };
    if (p.length > 4) return { text: 'Fair', width: 'w-1/2', color: 'bg-amber-400' };
    return { text: 'Weak', width: 'w-1/4', color: 'bg-error' };
  };

  const strength = calculateStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/ingest');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-primary-container/10 rounded-full blur-[110px] pointer-events-none" />

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

      {/* Main Signup Card */}
      <main className="w-full max-w-lg mx-auto my-auto py-8">
        <div className="bg-surface-container-low border border-surface-container-high rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="font-headline-lg text-2xl font-bold text-on-surface">
              Create Your RepoLens Workspace
            </h1>
            <p className="font-body-md text-xs text-on-surface-variant">
              Continuous AST intelligence, blast radius mapping, and security auditing for your team.
            </p>
          </div>

          {/* Social OAuth Providers */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/ingest')}
              className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-surface-container-highest transition-colors font-headline-sm text-xs font-semibold text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">deployed_code</span>
              <span>Sign up with GitHub</span>
            </button>
            <button
              onClick={() => navigate('/ingest')}
              className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-surface-container-highest transition-colors font-headline-sm text-xs font-semibold text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">merge</span>
              <span>Sign up with GitLab</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-surface-container-high" />
            <span className="text-[11px] font-code text-outline uppercase">Or register with email</span>
            <div className="flex-1 h-px bg-surface-container-high" />
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-body-sm text-xs text-on-surface font-medium">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-surface-container-highest text-on-surface font-code text-xs focus:outline-none focus:border-primary-container transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="font-body-sm text-xs text-on-surface font-medium">
                  Team / Workspace Alias
                </label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-surface-container-highest text-on-surface font-code text-xs focus:outline-none focus:border-primary-container transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-body-sm text-xs text-on-surface font-medium">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container border border-surface-container-highest text-on-surface font-code text-xs focus:outline-none focus:border-primary-container transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-body-sm text-xs text-on-surface font-medium">
                Workstation Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container border border-surface-container-highest text-on-surface font-code text-xs focus:outline-none focus:border-primary-container transition-colors"
              />
              {/* Password strength indicator */}
              <div className="space-y-1 pt-1">
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${strength.width} ${strength.color}`} />
                </div>
                <div className="flex items-center justify-between text-[10px] font-code text-outline">
                  <span>Entropy Security:</span>
                  <span className="font-bold text-on-surface">{strength.text}</span>
                </div>
              </div>
            </div>

            <div className="text-xs font-body-sm text-on-surface-variant">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 rounded border-surface-container-highest accent-primary-container"
                />
                <span>
                  I agree to the <a href="#terms" className="text-primary-container hover:underline">Terms of Service</a> and allow RepoLens to execute local AST telemetry on uploaded codebases.
                </span>
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
                  <span>Configuring Workspace...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                  <span>Create Account &amp; Ingest Codebase</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-outline font-body-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-on-surface hover:text-primary-container font-semibold transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-outline font-code max-w-5xl mx-auto w-full py-2">
        <span>RepoLens Intelligence • SOC2 Type II Certified AST Engine</span>
      </footer>
    </div>
  );
};
