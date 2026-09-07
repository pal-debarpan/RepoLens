import React, { useState, useEffect, startTransition } from 'react';
import { Repository, ThemeMode } from '../types';
import { repoService } from '../services/api';
import { MOCK_REPOSITORIES } from '../services/mockData';
import { AppContext, UserProfile } from './appContextDefinition';
import { triggerParticleThemeTransition } from '../utils/particleThemeTransition';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('repolens_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const login = (email?: string, name?: string) => {
    const u: UserProfile = {
      email: email || 'developer@repolens.io',
      name: name || (email ? email.split('@')[0] : 'Developer'),
    };
    setUser(u);
    localStorage.setItem('repolens_user', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('repolens_user');
  };

  const isAuthenticated = !!user;

  const refreshRepositories = async () => {
    const list = await repoService.getRepositories();
    setRepositories(list);
  };

  const activeRepo = repositories.find((r) => r.id === activeRepoId) || repositories[0];

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
        user,
        setUser,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
