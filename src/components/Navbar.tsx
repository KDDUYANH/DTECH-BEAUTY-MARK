import React from 'react';
import { Camera, LayoutDashboard, Scan, CheckSquare, Database, Cpu, ShieldCheck } from 'lucide-react';

export type TabKey = 'dashboard' | 'camera' | 'analyze' | 'review' | 'dataset' | 'system';

interface NavbarProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  cameraStatus: 'READY' | 'NO_CAMERA' | 'PERMISSION_DENIED' | 'STOPPED';
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, cameraStatus }) => {
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'camera', label: 'Camera Input', icon: <Camera className="w-4 h-4" /> },
    { key: 'analyze', label: 'QA Engine', icon: <Scan className="w-4 h-4" /> },
    { key: 'review', label: 'Human Review', icon: <CheckSquare className="w-4 h-4" /> },
    { key: 'dataset', label: 'Local Dataset', icon: <Database className="w-4 h-4" /> },
    { key: 'system', label: 'System Audit', icon: <Cpu className="w-4 h-4" /> },
  ];

  const getCameraBadge = () => {
    switch (cameraStatus) {
      case 'READY':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> CAMERA READY</span>;
      case 'NO_CAMERA':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950 text-rose-400 border border-rose-800"><span className="w-2 h-2 rounded-full bg-rose-400"></span> NO CAMERA INPUT</span>;
      case 'PERMISSION_DENIED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950 text-amber-400 border border-amber-800">PERM DENIED</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">CAMERA STOPPED</span>;
    }
  };

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
              D
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-cyan-400 via-indigo-300 to-rose-400 bg-clip-text text-transparent">
                  D-TECH BEAUTY VISION
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  LOCAL MVP V0.1
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">100% Offline • Zero Remote Cloud Dependency</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right System Indicators */}
          <div className="flex items-center gap-3">
            {getCameraBadge()}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/80">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> ISOLATED LOCAL
            </span>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex overflow-x-auto py-2 gap-1 border-t border-slate-800/80">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:bg-slate-800/40'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
