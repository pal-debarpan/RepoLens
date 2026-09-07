import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { AppBackgroundVideo } from './AppBackgroundVideo';
import { CommandPaletteModal } from '../common/CommandPaletteModal';
import { FountainReveal } from '../common/FountainReveal';
import { useApp } from '../../context';

export const AppLayout: React.FC = () => {
  const { sidebarCollapsed } = useApp();

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-body transition-colors relative">
      {/* Background Video (Only renders for internal routes, behind UI, non-interactive) */}
      <AppBackgroundVideo />

      <AppSidebar />
      <AppHeader />
      <CommandPaletteModal />

      {/* Main Content Area */}
      <main
        className={`flex-1 pt-16 transition-all duration-300 relative z-10 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          <FountainReveal>
            <Outlet />
          </FountainReveal>
        </div>
      </main>
    </div>
  );
};
