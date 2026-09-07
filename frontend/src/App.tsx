import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { AuthenticatedLandingPage } from './pages/AuthenticatedLandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { StandaloneIngestPage } from './pages/StandaloneIngestPage';
import { OverviewPage } from './pages/OverviewPage';
import { RepositoriesPage } from './pages/RepositoriesPage';
import { PipelineTelemetryPage } from './pages/PipelineTelemetryPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { SecurityAnalysisPage } from './pages/SecurityAnalysisPage';
import { DependenciesPage } from './pages/DependenciesPage';
import { BlastRadiusPage } from './pages/BlastRadiusPage';
import { IssuesPage } from './pages/IssuesPage';
import { IssueDetailPage } from './pages/IssueDetailPage';
import { TestingPage } from './pages/TestingPage';
import { FileExplorerPage } from './pages/FileExplorerPage';
import { FileDetailPage } from './pages/FileDetailPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { SettingsPage } from './pages/SettingsPage';
import { WaterTransitionProvider } from './context';

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <WaterTransitionProvider>
          <Routes>
            {/* Public Landing, Authenticated Landing, Authentication & Standalone Ingest */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<AuthenticatedLandingPage />} />
            <Route path="/landing" element={<AuthenticatedLandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/ingest" element={<StandaloneIngestPage />} />

          {/* Authenticated Workspace / Console Layout */}
          <Route element={<AppLayout />}>
            <Route path="/app" element={<OverviewPage />} />
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/repositories" element={<RepositoriesPage />} />
            <Route path="/progress" element={<PipelineTelemetryPage />} />
            <Route path="/architecture" element={<ArchitecturePage />} />
            <Route path="/security" element={<SecurityAnalysisPage />} />
            <Route path="/dependencies" element={<DependenciesPage />} />
            <Route path="/blast-radius" element={<BlastRadiusPage />} />
            <Route path="/issues" element={<IssuesPage />} />
            <Route path="/issues/:issueId" element={<IssueDetailPage />} />
            <Route path="/testing" element={<TestingPage />} />
            <Route path="/file-explorer" element={<FileExplorerPage />} />
            <Route path="/file-explorer/detail" element={<FileDetailPage />} />
            <Route path="/ai-assistant" element={<AiAssistantPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </WaterTransitionProvider>
    </BrowserRouter>
    </AppProvider>
  );
};

export default App;

