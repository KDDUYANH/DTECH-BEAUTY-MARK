import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { StudioDashboard } from './pages/StudioDashboard';
import { DatasetView } from './pages/DatasetView';
import { SystemView } from './pages/SystemView';

export const App: React.FC = () => {
  const [cameraReady, setCameraReady] = useState(false);
  const [activeAdvancedTool, setActiveAdvancedTool] = useState<string | null>(null);

  const renderAdvancedDrawer = () => {
    if (!activeAdvancedTool) return null;

    return (
      <div className="fixed inset-y-0 right-0 w-96 bg-slate-950 border-l border-slate-900 z-50 shadow-2xl p-6 font-mono overflow-y-auto flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              SYSTEM DETAILS: {activeAdvancedTool}
            </h3>
            <button
              onClick={() => setActiveAdvancedTool(null)}
              className="text-xs text-slate-550 hover:text-slate-200 cursor-pointer"
            >
              [ CLOSE ]
            </button>
          </div>

          {activeAdvancedTool === 'dataset' && <DatasetView />}
          {(activeAdvancedTool === 'models' || activeAdvancedTool === 'settings') && <SystemView />}
          {activeAdvancedTool === 'privacy' && (
            <div className="text-xs text-slate-400 space-y-4 leading-relaxed font-sans">
              <p><strong>100% OFF-GRID PRIVACY GATEWAY</strong></p>
              <p>Ứng dụng được chạy hoàn toàn dưới bộ nhớ RAM cục bộ của máy tính của bạn. Mọi luồng Camera và file ảnh Upload không được truyền lên bất kỳ Cloud Server nào.</p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-900 pt-4 text-[10px] text-slate-600">
          D-Tech Compliance System Version: rule-v0.1
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      <Navbar
        cameraReady={cameraReady}
        onOpenAdvanced={setActiveAdvancedTool}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <StudioDashboard onCameraStatusChange={setCameraReady} />
      </main>

      {/* Advanced drawer panel */}
      {renderAdvancedDrawer()}

      {/* Click outside to close drawer overlay */}
      {activeAdvancedTool && (
        <div 
          onClick={() => setActiveAdvancedTool(null)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs font-mono text-slate-450">
        D-Tech Beauty Vision Local Console • 100% Offline • Zero Remote Cloud Dependencies
      </footer>
    </div>
  );
};

export default App;
