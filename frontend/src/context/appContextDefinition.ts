import { createContext } from 'react';
import { Repository, ThemeMode, UserProfile } from '../types';

export interface AppContextType {  activeRepoId: string;
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

  // New backend-aligned state
  accessToken: string | null;
  currentAnalysisId: string | null;
  setCurrentAnalysisId: (id: string | null) => void;
  currentRepositoryId: string | null;
  setCurrentRepositoryId: (id: string | null) => void;

  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  isAuthenticated: boolean;
  login: (email?: string, name?: string) => void;
  signup: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
}
export const AppContext = createContext<AppContextType | undefined>(undefined);
