import React, { useState } from 'react';
import { Navbar, TabKey } from './components/Navbar';
import { DashboardView } from './pages/DashboardView';
import { CameraView } from './pages/CameraView';
import { AnalyzeView } from './pages/AnalyzeView';
import { ReviewView } from './pages/ReviewView';
import { DatasetView } from './pages/DatasetView';
import { SystemView } from './pages/SystemView';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const cameraStatus = 'STOPPED';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cameraStatus={cameraStatus}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
        {activeTab === 'camera' && <CameraView />}
        {activeTab === 'analyze' && <AnalyzeView />}
        {activeTab === 'review' && <ReviewView />}
        {activeTab === 'dataset' && <DatasetView />}
        {activeTab === 'system' && <SystemView />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs font-mono text-slate-400">
        D-Tech Beauty Vision Local MVP V0.1 • 100% Offline • Zero Remote Cloud Dependencies
      </footer>
    </div>
  );
};

export default App;
