import { createContext } from 'react';
import { Repository, ThemeMode } from '../types';

export interface UserProfile {
  email: string;
  name?: string;
}

export interface AppContextType {
  activeRepoId: string;
  setActiveRepoId: (id: string) => void;
  activeRepo: Repository | undefined;
  repositories: Repository[];
  refreshRepositories: () => Promise<void>;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: (event?: React.MouseEvent | { clientX: number; clientY: number }) => void;
  diffGlowEnabled: boolean;
  setDiffGlowEnabled: (enabled: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  isAuthenticated: boolean;
  login: (email?: string, name?: string) => void;
  logout: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
