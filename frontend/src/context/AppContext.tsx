import React, { useState, useEffect } from 'react';
import { Repository, ThemeMode } from '../types';
import { repoService, clearAuthToken, setAuthToken } from '../services/api';
import { MOCK_REPOSITORIES } from '../services/mockData';
import { AppContext, UserProfile } from './appContextDefinition';
import { supabase } from '../services/supabaseClient';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('repolens_user_profile');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const setUser = (newUser: UserProfile | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem('repolens_user_profile', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('repolens_user_profile');
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    clearAuthToken();
    setUser(null);
    setRepositories([MOCK_REPOSITORIES[0]]);
    setActiveRepoId('repolens-demo');
    window.location.href = '/login';
  };

  const [repositories, setRepositories] = useState<Repository[]>(() => MOCK_REPOSITORIES);
  const [activeRepoId, setActiveRepoId] = useState<string>('repolens-demo');
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

  const refreshRepositories = async () => {
    try {
      const list = await repoService.getRepositories();
      if (list && list.length > 0) {
        setRepositories(list);
      }
    } catch (e) {
      console.warn('Could not fetch repositories from backend:', e);
    }
  };

  // Sync Supabase Auth Session on mount and on auth state change
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        setAuthToken(session.access_token);
        const email = session.user.email || '';
        const displayName =
          session.user.user_metadata?.display_name ||
          session.user.user_metadata?.full_name ||
          email.split('@')[0] ||
          'Developer';
        const provider = session.user.app_metadata?.provider || 'email';

        setUser({ email, displayName, provider });
        refreshRepositories();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user) {
        setAuthToken(session.access_token);
        const email = session.user.email || '';
        const displayName =
          session.user.user_metadata?.display_name ||
          session.user.user_metadata?.full_name ||
          email.split('@')[0] ||
          'Developer';
        const provider = session.user.app_metadata?.provider || 'email';

        setUser({ email, displayName, provider });
        refreshRepositories();
      } else if (_event === 'SIGNED_OUT') {
        clearAuthToken();
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const activeRepo = repositories.find((r) => r.id === activeRepoId) || repositories[0];

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('repolens_theme', newTheme);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
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

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        signOut,
        activeRepoId,
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
