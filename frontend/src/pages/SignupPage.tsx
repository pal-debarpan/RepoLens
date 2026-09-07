import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { RepoLensLogo } from '../components/common/RepoLensLogo';
import { useApp } from '../context';
import { supabase } from '../services/supabaseClient';
import { userService, setAuthToken } from '../services/api';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme, setUser, refreshRepositories } = useApp();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const calculateStrength = (p: string) => {
    if (p.length >= 12) return { text: 'Strong', width: 'w-full', color: 'bg-primary-container' };
    if (p.length >= 8) return { text: 'Good', width: 'w-3/4', color: 'bg-secondary' };
    if (p.length >= 6) return { text: 'Fair', width: 'w-1/2', color: 'bg-amber-400' };
    return { text: 'Weak', width: 'w-1/4', color: 'bg-error' };
  };

  const strength = calculateStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: fullName,
            team_name: teamName,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }

      if (data.session && data.user) {
        // Immediate session active (email confirmation not blocking)
        const token = data.session.access_token;
        setAuthToken(token);

        await userService.syncUser(token, {
          displayName: fullName || email.split('@')[0],
          provider: 'email',
        });

        setUser({
          email: data.user.email || email,
          displayName: fullName || email.split('@')[0],
          provider: 'email',
        });

        await refreshRepositories();
        setLoading(false);
        navigate('/ingest');
      } else if (data.user) {
        // Registration created, pending email confirmation
        setSuccessMsg(
          'Account created successfully! Please check your email inbox to confirm your account, then sign in.'
        );
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during registration.');
      setLoading(false);
    }
  };

  const handleOAuthSignup = async (providerName: 'github' | 'gitlab') => {
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: providerName as any,
        options: {
          redirectTo: `${window.location.origin}/app`,
        },
      });
      if (error) {
        setErrorMsg(`OAuth failed: ${error.message}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'OAuth authentication error');
    }
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

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-error-container/20 border border-error/50 text-error flex items-start gap-2.5 text-xs font-medium">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
              <div className="flex-1">
                <span className="font-bold block">Registration Error</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-lg bg-primary-container/20 border border-primary-container/50 text-primary-container flex items-start gap-2.5 text-xs font-medium">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">check_circle</span>
              <div className="flex-1">
                <span className="font-bold block">Account Created</span>
                <span>{successMsg}</span>
              </div>
            </div>
          )}

          {/* Social OAuth Providers */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleOAuthSignup('github')}
              className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-surface-container-highest transition-colors font-headline-sm text-xs font-semibold text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">deployed_code</span>
              <span>Sign up with GitHub</span>
            </button>
            <button
              onClick={() => handleOAuthSignup('gitlab')}
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
                  placeholder="Alex Vance"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container border border-surface-container-highest text-on-surface font-code text-xs focus:outline-none focus:border-primary-container transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="font-body-sm text-xs text-on-surface font-medium">
                  Team / Workspace Alias
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Core Guild"
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
                placeholder="developer@company.com"
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
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 rounded-lg bg-surface-container border border-surface-container-highest text-on-surface font-code text-xs focus:outline-none focus:border-primary-container transition-colors"
              />
              {/* Password strength indicator */}
              <div className="space-y-1 pt-1">
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${strength.width} ${strength.color}`} />
                </div>
                <div className="flex items-center justify-between text-[10px] font-code text-outline">
                  <span>Password Security:</span>
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
                  I agree to the Terms of Service and allow RepoLens to execute local AST telemetry on uploaded codebases.
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
                  <span>Creating Account...</span>
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
        <span>RepoLens Intelligence • Supabase Identity Authorization</span>
      </footer>
    </div>
  );
};

export default SignupPage;
