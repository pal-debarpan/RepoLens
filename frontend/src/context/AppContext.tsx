import React, { useState, useEffect, startTransition } from 'react';
import { Repository, ThemeMode } from '../types';
import { getRepositories } from '../services/repositoryService';
import { AppContext } from './appContextDefinition';
import { UserProfile } from '../types';
import * as authService from '../services/authService';
import * as analysisService from '../services/analysisService';
import { getStoredToken } from '../services/api';
import { triggerParticleThemeTransition } from '../utils/particleThemeTransition';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [repositories, setRepositories] = useState<any[]>([]);
  const [activeRepoIdState, setActiveRepoIdState] = useState<string>('');
  const [currentRepositoryId, setCurrentRepositoryId] = useState<string | null>(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => getStoredToken());

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('repolens_theme');
    return (saved as ThemeMode) || 'dark';
  });
  const [diffGlowEnabled, setDiffGlowEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('repolens_diff_glow');
    return saved !== null ? saved === 'true' : true;
  });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(() => authService.getStoredUser());

  const login = async (email?: string, password?: string) => {
    // We expect email and password for real login.
    if (!email || !password) return;
    const res = await authService.login({ email, password });
    if (res.access_token) {
      setAccessToken(res.access_token);
      setUser(authService.getStoredUser());
    }
  };

  const signup = async (email: string, password: string, fullName?: string) => {
    const res = await authService.signup({ email, password, full_name: fullName });
    if (res.access_token) {
      setAccessToken(res.access_token);
      setUser(authService.getStoredUser());
    }
  };

  const logout = () => {
    authService.logout();
    setAccessToken(null);
    setUser(null);
  };

  const isAuthenticated = !!user;

  const refreshRepositories = async () => {
    try {
      const list = await getRepositories();

      const mappedRepos: Repository[] = await Promise.all(list.map(async (repo) => {
        const repoAnalyses = await analysisService.getAnalyses(1, 0, repo.id);
        const latestAnalysis = repoAnalyses.length > 0 ? repoAnalyses[0] : null;

        return {
          id: repo.id,
          name: repo.name || repo.source_url.split('/').pop()?.replace('.git', '') || 'unknown',
          isPrivate: !!repo.user_id,
          branch: repo.default_branch || 'main',
          commitHash: repo.latest_commit_sha ? repo.latest_commit_sha.substring(0, 7) : 'unknown',
          commitMessage: 'Latest commit',
          language: repo.primary_language || 'Unknown',
          framework: 'Detected',
          lastAnalyzed: latestAnalysis ? new Date(latestAnalysis.created_at).toLocaleString() : 'Never',
          scanDepth: 'L3 AST',
          // A missing score means analysis is not complete; a real zero remains
          // zero instead of being silently replaced by an unavailable value.
          score: latestAnalysis?.status === 'COMPLETED' ? latestAnalysis.quality_score ?? null : null,
          riskLevel: latestAnalysis?.status === 'COMPLETED'
            ? ((latestAnalysis.quality_score ?? 0) > 80 ? 'Healthy' : (latestAnalysis.quality_score ?? 0) > 60 ? 'Moderate Risk' : 'High Risk')
            : 'Moderate Risk',
          blastVectorsCount: latestAnalysis?.summary?.total_findings || 0,
          circularLeaksCount: 0,
          // Offline is repository availability, not an analysis lifecycle state.
          status: latestAnalysis ? (latestAnalysis.status === 'COMPLETED' ? 'Active' : latestAnalysis.status === 'RUNNING' || latestAnalysis.status === 'PENDING' ? 'Analyzing' : 'Degraded') : 'Active',
          loc: latestAnalysis?.total_lines || repo.file_count || 0,
          filesCount: latestAnalysis?.file_count || repo.file_count || 0,
          dependenciesCount: 0,
          openIssuesCount: latestAnalysis?.summary?.total_findings || 0,
          testCoverage: 0,
        };
      }));
      setRepositories(mappedRepos);

      // Keep track of current analysis if a repo is selected
      if (mappedRepos.length > 0) {
        const targetRepoId = activeRepoIdState || mappedRepos[0].id;
        const targetRepoAnalyses = await analysisService.getAnalyses(1, 0, targetRepoId);
        if (targetRepoAnalyses.length > 0) {
          setCurrentAnalysisId(targetRepoAnalyses[0].id);
        }
      }
    } catch (e) {
      console.warn("Could not fetch repositories", e);
    }
  };

  const activeRepo = repositories.find((r) => r.id === activeRepoIdState) || repositories[0];

  const setTheme = (newTheme: ThemeMode, event?: { clientX: number; clientY: number }) => {
    if (newTheme === theme) return;
    const target = newTheme === 'system'
      ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : newTheme;

    if (target === theme) {
      startTransition(() => {
        setThemeState(newTheme);
        localStorage.setItem('repolens_theme', newTheme);
      });
      return;
    }

    const originX = event?.clientX ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
    const originY = event?.clientY ?? (typeof window !== 'undefined' ? window.innerHeight / 2 : 0);

    triggerParticleThemeTransition(originX, originY, target, () => {
      startTransition(() => {
        setThemeState(newTheme);
        localStorage.setItem('repolens_theme', newTheme);
      });
    });
  };

  const toggleTheme = (event?: React.MouseEvent | { clientX: number; clientY: number }) => {
    const next = theme === 'dark' ? 'light' : 'dark';
    const originX = event?.clientX ?? (typeof window !== 'undefined' ? window.innerWidth - 60 : 0);
    const originY = event?.clientY ?? 32;

    triggerParticleThemeTransition(originX, originY, next, () => {
      startTransition(() => {
        setThemeState(next);
        localStorage.setItem('repolens_theme', next);
      });
    });
  };

  const setActiveRepoId = (id: string) => {
    setActiveRepoIdState(id);
    setCurrentRepositoryId(id);
    // Only async-update currentAnalysisId from the server — don't clear it
    // if it was just set by the ingest flow (IngestRepoPage sets it before calling this)
    analysisService.getAnalyses(1, 0, id).then(analyses => {
      if (analyses.length > 0) {
        setCurrentAnalysisId(analyses[0].id);
      }
      // Do NOT clear currentAnalysisId if no analyses found yet —
      // the ingest flow may have just created one that isn't fetched yet.
    }).catch(e => console.warn('Could not fetch analyses for repo', e));
  };


  const setDiffGlowEnabled = (val: boolean) => {
    setDiffGlowEnabledState(val);
    localStorage.setItem('repolens_diff_glow', String(val));
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    } else if (theme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.remove('light');
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        root.setAttribute('data-theme', 'light');
      }
    }
  }, [theme]);

  // Keyboard shortcut for Command Palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-load repositories when user authenticates (or on mount if already logged in)
  useEffect(() => {
    if (user) {
      refreshRepositories();
    } else {
      setRepositories([]);
      setCurrentAnalysisId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // A local profile is only a cache. Confirm the bearer token on startup so an
  // expired session cannot keep protected routes visually accessible.
  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    authService.getCurrentUser()
      .then((profile) => { if (!cancelled) setUser(profile); })
      .catch(() => { if (!cancelled) logout(); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);


  return (
    <AppContext.Provider
      value={{
        activeRepoId: activeRepoIdState,
        setActiveRepoId,
        activeRepo,
        repositories,
        refreshRepositories,
        theme,
        setTheme,
        toggleTheme,
        diffGlowEnabled,
        setDiffGlowEnabled,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        sidebarCollapsed,
        setSidebarCollapsed,
        accessToken,
        currentAnalysisId,
        setCurrentAnalysisId,
        currentRepositoryId,
        setCurrentRepositoryId,
        user,
        setUser,
        isAuthenticated,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
