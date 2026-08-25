import React, { useState } from 'react';
import { ShieldCheck, Cpu, Database, Settings, Menu } from 'lucide-react';

interface NavbarProps {
  cameraReady: boolean;
  onOpenAdvanced: (tool: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ cameraReady, onOpenAdvanced }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="bg-slate-950 border-b border-slate-900 sticky top-0 z-50 py-3 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Subtitle */}
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-sm tracking-wider text-slate-100 font-mono">
            D-TECH BEAUTY VISION
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-900/60">
            LOCAL AI ●
          </span>
        </div>

        {/* Quiet Indicators */}
        <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${cameraReady ? 'bg-emerald-400' : 'bg-slate-700'}`}></span>
            CAMERA {cameraReady ? 'READY' : 'OFFLINE'}
          </div>
          <div>MODEL READY</div>
          <div>DATA LOCAL</div>
        </div>

        {/* Advanced Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors border border-slate-900"
          >
            <Menu className="w-3.5 h-3.5" /> ADVANCED
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 py-1 font-mono text-xs">
              <button
                onClick={() => { onOpenAdvanced('dataset'); setShowDropdown(false); }}
                className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-300 flex items-center gap-2"
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" /> Local Dataset
              </button>
              <button
                onClick={() => { onOpenAdvanced('models'); setShowDropdown(false); }}
                className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-300 flex items-center gap-2"
              >
                <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Model Lab
              </button>
              <button
                onClick={() => { onOpenAdvanced('privacy'); setShowDropdown(false); }}
                className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-300 flex items-center gap-2"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Privacy Center
              </button>
              <button
                onClick={() => { onOpenAdvanced('settings'); setShowDropdown(false); }}
                className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-300 flex items-center gap-2"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" /> Configuration
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

