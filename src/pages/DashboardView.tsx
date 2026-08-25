import React from 'react';
import { Camera, Scan, CheckSquare, Database, ShieldCheck, Activity, Award } from 'lucide-react';
import { TabKey } from '../components/Navbar';
import { localDb } from '../storage/db';

interface DashboardViewProps {
  setActiveTab: (tab: TabKey) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab }) => {
  const records = localDb.getAllAnalyses();
  const totalAnalyses = records.length;
  const reviewedCount = records.filter((r) => r.human_review).length;
  const assessableCount = records.filter((r) => r.assessable_status === 'ASSESSABLE').length;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800 mb-3">
              <ShieldCheck className="w-4 h-4 text-cyan-400" /> LOCAL MVP V0.1 — 100% OFFLINE ISOLATED
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              D-TECH BEAUTY VISION
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Deterministic real-time computer vision engine for makeup QA analysis, facial landmark tracking, and local proprietary dataset seed building. Zero external cloud dependencies.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('camera')}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all"
            >
              <Camera className="w-4 h-4" /> START LIVE CAMERA
            </button>
            <button
              onClick={() => setActiveTab('analyze')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all"
            >
              <Scan className="w-4 h-4" /> UPLOAD IMAGE ANALYZER
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono text-slate-400">TOTAL LOCAL ANALYSES</span>
            <div className="text-2xl font-black font-mono text-white">{totalAnalyses}</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono text-slate-400">ASSESSABLE RATIO</span>
            <div className="text-2xl font-black font-mono text-emerald-400">
              {totalAnalyses > 0 ? `${Math.round((assessableCount / totalAnalyses) * 100)}%` : '100%'}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-950/80 border border-indigo-800 flex items-center justify-center text-indigo-400">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono text-slate-400">HUMAN ANNOTATIONS</span>
            <div className="text-2xl font-black font-mono text-indigo-300">{reviewedCount}</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-800 flex items-center justify-center text-purple-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono text-slate-400">PROPRIETARY DATASET</span>
            <div className="text-2xl font-black font-mono text-purple-300">SQLite Ready</div>
          </div>
        </div>
      </div>

      {/* Quick Core Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => setActiveTab('camera')}
          className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-5 cursor-pointer group transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-100 group-hover:text-cyan-400 transition-colors flex items-center gap-2">
              <Camera className="w-5 h-5 text-cyan-400" /> Real Camera Feed
            </h3>
            <span className="text-xs font-mono text-slate-500">PHASE 3 & 4</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Live WebRTC camera streaming with MediaPipe 478 3D landmark tracking, pose estimation, and real-time FPS counter.
          </p>
          <div className="text-xs font-mono font-semibold text-cyan-400 flex items-center gap-1">
            OPEN CAMERA STREAM →
          </div>
        </div>

        <div
          onClick={() => setActiveTab('analyze')}
          className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-5 cursor-pointer group transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-100 group-hover:text-cyan-400 transition-colors flex items-center gap-2">
              <Scan className="w-5 h-5 text-cyan-400" /> 9 Makeup QA Modules
            </h3>
            <span className="text-xs font-mono text-slate-500">PHASE 6 & 7</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Deterministic geometry & color analysis for Eyebrow, Eyeliner, Lash, Eyeshadow, Blush, Nose Contour, Lips, Base, and Hair.
          </p>
          <div className="text-xs font-mono font-semibold text-cyan-400 flex items-center gap-1">
            RUN QA ENGINE →
          </div>
        </div>

        <div
          onClick={() => setActiveTab('review')}
          className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-5 cursor-pointer group transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-100 group-hover:text-cyan-400 transition-colors flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-cyan-400" /> Human Review Seed
            </h3>
            <span className="text-xs font-mono text-slate-500">PHASE 9 & 10</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Verify AI predictions (Accept, Reject, Uncertain, Correct) and store high-quality local ground truth labels.
          </p>
          <div className="text-xs font-mono font-semibold text-cyan-400 flex items-center gap-1">
            REVIEW ANNOTATIONS →
          </div>
        </div>
      </div>
    </div>
  );
};
