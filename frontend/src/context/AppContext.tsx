import React, { useState, useEffect } from 'react';
import { Repository, ThemeMode } from '../types';
import { repoService } from '../services/api';
import { MOCK_REPOSITORIES } from '../services/mockData';
import { AppContext } from './appContextDefinition';

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

  useEffect(() => {
    refreshRepositories();
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
