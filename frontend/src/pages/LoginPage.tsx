import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { RepoLensLogo } from '../components/common/RepoLensLogo';
import { useApp, useWaterNavigate } from '../context';
import { DoodleBackdrop } from '../components/common/DoodleBackdrop';

export const LoginPage: React.FC = () => {
  const { waterNavigate } = useWaterNavigate();
  const { theme, login } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDark = theme !== 'light';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      waterNavigate('/home');
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between p-4 sm:p-6 sm:py-8 relative overflow-hidden transition-colors duration-300 select-none ${
        isDark ? 'bg-[#0D0F0D] text-[#F2F2F2]' : 'bg-[#F7F1E3] text-[#181D17]'
      }`}
    >
      {/* Interactive Reactive Technical Doodle Backdrop */}
      <DoodleBackdrop />

      {/* Top Header with Logo */}
      <header className="relative z-10 flex items-center justify-between w-full">
        <button
          type="button"
          onClick={(e) => waterNavigate('/', e)}
          className="page-link transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container rounded-lg cursor-pointer"
        >
          <RepoLensLogo size="md" />
        </button>
      </header>

      {/* Main Single-Column Centered Card (~440px) */}
      <main className="relative z-10 w-full max-w-[450px] mx-auto my-auto py-8">
        <div
          className={`p-7 sm:p-9 rounded-2xl border transition-all duration-300 space-y-7 ${
            isDark
              ? 'bg-[#121512] border-[#2A2A2A] shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
              : 'bg-[#FFFFFF] border-[#E0D7C6] shadow-[0_4px_24px_rgba(40,30,20,0.06)]'
          }`}
        >
          {/* Bold Headline & Descriptive Subtext */}
          <div className="space-y-2 text-center">
            <h1
              className={`font-heading text-2xl sm:text-[26px] font-bold tracking-tight ${
                isDark ? 'text-[#F2F2F2]' : 'text-[#181D17]'
              }`}
            >
              Sign In to RepoLens
            </h1>
            <p
              className={`text-xs sm:text-[13px] font-sans leading-relaxed ${
                isDark ? 'text-[#9A9A9A]' : 'text-[#6E685E]'
              }`}
            >
              Access your workspace AST telemetry, blast simulations, and code intelligence.
            </p>
          </div>

          {/* Continue with Google SSO (Dummy Button) */}
          <button
            type="button"
            className={`w-full flex items-center justify-center gap-3 h-11 px-4 rounded-xl border font-sans text-xs sm:text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 cursor-pointer ${
              isDark
                ? 'bg-[#171B17] hover:bg-[#1F251F] text-[#F2F2F2] border-[#2A2A2A] hover:border-[#384238] hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-[#B6FF3C]'
                : 'bg-[#FAF6EE] hover:bg-[#F2ECE0] text-[#181D17] border-[#E0D7C6] hover:border-[#D0C5AF] hover:-translate-y-0.5 hover:shadow-sm focus-visible:ring-[#046A38]'
            }`}
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>


          {/* "OR EMAIL" Divider with Horizontal Rules */}
          <div className="flex items-center gap-3">
            <div
              className={`flex-1 h-px ${
                isDark ? 'bg-[#242A24]' : 'bg-[#E5DDCB]'
              }`}
            />
            <span
              className={`text-[10px] font-sans font-semibold tracking-widest uppercase ${
                isDark ? 'text-[#7D8878]' : 'text-[#8A8275]'
              }`}
            >
              OR EMAIL
            </span>
            <div
              className={`flex-1 h-px ${
                isDark ? 'bg-[#242A24]' : 'bg-[#E5DDCB]'
              }`}
            />
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500">
                {error}
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-email"
                  className={`flex items-center gap-1.5 font-sans text-xs font-medium transition-colors duration-200 ${
                    focusedField === 'email'
                      ? isDark
                        ? 'text-[#B6FF3C]'
                        : 'text-[#046A38]'
                      : isDark
                      ? 'text-[#E4E8E1]'
                      : 'text-[#181D17]'
                  }`}
                >
                  <span>Email Address</span>
                  {focusedField === 'email' && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                        isDark ? 'bg-[#B6FF3C]' : 'bg-[#046A38]'
                      }`}
                    />
                  )}
                </label>
              </div>

              <div className="repolens-3d-input-group">
                <div
                  className={`repolens-3d-halo ${
                    focusedField === 'email' ? 'is-active' : ''
                  }`}
                />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@company.com"
                  className="repolens-3d-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className={`flex items-center gap-1.5 font-sans text-xs font-medium transition-colors duration-200 ${
                    focusedField === 'password'
                      ? isDark
                        ? 'text-[#B6FF3C]'
                        : 'text-[#046A38]'
                      : isDark
                      ? 'text-[#E4E8E1]'
                      : 'text-[#181D17]'
                  }`}
                >
                  <span>Password</span>
                  {focusedField === 'password' && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                        isDark ? 'bg-[#B6FF3C]' : 'bg-[#046A38]'
                      }`}
                    />
                  )}
                </label>
                <button
                  type="button"
                  onClick={() =>
                    alert('Password reset link has been dispatched to developer@repolens.io')
                  }
                  className={`text-xs font-sans font-semibold transition-colors hover:underline ${
                    isDark ? 'text-[#B6FF3C]' : 'text-[#046A38]'
                  }`}
                >
                  Forgot?
                </button>
              </div>

              <div className="repolens-3d-input-group flex items-center">
                <div
                  className={`repolens-3d-halo ${
                    focusedField === 'password' ? 'is-active' : ''
                  }`}
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="repolens-3d-input pr-10 tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 z-10 p-1.5 rounded-md transition-colors cursor-pointer ${
                    isDark
                      ? 'text-[#7D8878] hover:text-[#B6FF3C] hover:bg-[#1E241E]'
                      : 'text-[#8A8275] hover:text-[#046A38] hover:bg-[#E8E0D0]'
                  }`}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={1.8} />
                  ) : (
                    <Eye size={16} strokeWidth={1.8} />
                  )}
                </button>
              </div>
            </div>


            {/* "Remember this workstation" Checkbox */}
            <div className="pt-1 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                    rememberMe
                      ? isDark
                        ? 'bg-[#B6FF3C] border-[#B6FF3C] text-[#0D0F0D]'
                        : 'bg-[#046A38] border-[#046A38] text-[#FFFFFF]'
                      : isDark
                      ? 'bg-[#171B17] border-[#2A2A2A] group-hover:border-[#3A443A]'
                      : 'bg-[#FAF6EE] border-[#E0D7C6] group-hover:border-[#D0C5AF]'
                  }`}
                >
                  {rememberMe && <Check size={12} strokeWidth={2.5} />}
                </div>
                <span
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`font-sans ${
                    isDark ? 'text-[#9A9A9A] group-hover:text-[#F2F2F2]' : 'text-[#6E685E] group-hover:text-[#181D17]'
                  }`}
                >
                  Remember this workstation
                </span>
              </label>
            </div>

            {/* Full-width Primary CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className={`page-link w-full h-11 rounded-xl font-sans text-xs font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 cursor-pointer ${
                loading ? 'opacity-70 pointer-events-none' : ''
              } ${
                isDark
                  ? 'bg-[#B6FF3C] hover:bg-[#C4FF5E] text-[#0D0F0D] shadow-[0_0_20px_rgba(182,255,60,0.25)] hover:shadow-[0_0_28px_rgba(182,255,60,0.4)] focus-visible:ring-[#B6FF3C]'
                  : 'bg-[#046A38] hover:bg-[#03542C] text-[#FFFFFF] shadow-[0_2px_12px_rgba(4,106,56,0.25)] hover:shadow-[0_4px_16px_rgba(4,106,56,0.35)] focus-visible:ring-[#046A38]'
              }`}
            >
              <span>{loading ? 'Signing In...' : 'Sign In to Console'}</span>
              {!loading && <ArrowRight size={15} strokeWidth={2.2} />}
            </button>
          </form>


          {/* Footer Link: Sign Up */}
          <div
            className={`text-center text-xs font-sans pt-1 ${
              isDark ? 'text-[#9A9A9A]' : 'text-[#6E685E]'
            }`}
          >
            <span>Don&apos;t have an account? </span>
            <button
              type="button"
              onClick={(e) => waterNavigate('/signup', e)}
              className={`page-link font-semibold hover:underline transition-colors cursor-pointer ${
                isDark ? 'text-[#B6FF3C]' : 'text-[#046A38]'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>
      </main>

      {/* Security Verification Footnote */}
      <footer className="relative z-10 text-center text-xs font-sans max-w-5xl mx-auto w-full py-2">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] ${
            isDark
              ? 'bg-[#121512] border-[#2A2A2A] text-[#7D8878]'
              : 'bg-[#FFFFFF] border-[#E0D7C6] text-[#6E685E] shadow-sm'
          }`}
        >
          <ShieldCheck
            size={13}
            className={isDark ? 'text-[#B6FF3C]' : 'text-[#046A38]'}
          />
          <span>RepoLens AST Security Engine • 256-bit Workstation Token Authorization</span>
        </div>
      </footer>
    </div>
  );
};
