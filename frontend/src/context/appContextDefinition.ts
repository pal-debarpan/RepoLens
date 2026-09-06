import { createContext } from 'react';
import { Repository, ThemeMode } from '../types';

export interface AppContextType {
  activeRepoId: string;
  setActiveRepoId: (id: string) => void;
  activeRepo: Repository | undefined;
  repositories: Repository[];
  refreshRepositories: () => Promise<void>;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  diffGlowEnabled: boolean;
  setDiffGlowEnabled: (enabled: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
