import React, { useState } from 'react';
import { localDb } from '../storage/db';
import { Database, Download, FileCode, CheckCircle2, Server } from 'lucide-react';

export const DatasetView: React.FC = () => {
  const [copiedNotice, setCopiedNotice] = useState(false);
  const records = localDb.getAllAnalyses();
  const datasetJson = localDb.exportDatasetJSON();

  const handleDownloadJSON = () => {
    const blob = new Blob([datasetJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dtech_beauty_dataset_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(datasetJson);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  const totalSamples = records.length;
  const verifiedCount = records.filter((r) => r.human_review !== undefined).length;
  const pendingCount = totalSamples - verifiedCount;
  const trainingReady = verifiedCount >= 5 ? 'YES' : 'NO';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-100 text-lg flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" /> LOCAL DATASET & SQLITE STORE
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Zero cloud export. All frames, 478 landmarks, AI predictions, and human labels stored in versioned local schema.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyJSON}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <FileCode className="w-4 h-4 text-cyan-400" /> COPY JSON
          </button>

          <button
            onClick={handleDownloadJSON}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-lg shadow-cyan-600/30 transition-colors"
          >
            <Download className="w-4 h-4" /> EXPORT LOCAL DATASET
          </button>
        </div>
      </div>

      {copiedNotice && (
        <div className="p-3 bg-cyan-950 border border-cyan-700 text-cyan-300 font-mono text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Dataset JSON copied to clipboard!
        </div>
      )}

      {/* Dataset Schema Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-xs font-mono text-slate-400">TOTAL SAMPLES</span>
          <div className="text-xl font-black font-mono text-cyan-400">{totalSamples}</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-xs font-mono text-slate-400">VERIFIED DATA</span>
          <div className="text-xl font-black font-mono text-emerald-400">{verifiedCount}</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-xs font-mono text-slate-400">PENDING REVIEW</span>
          <div className="text-xl font-black font-mono text-amber-500">{pendingCount}</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-xs font-mono text-slate-400">TRAINING READY</span>
          <div className={`text-xl font-black font-mono ${trainingReady === 'YES' ? 'text-emerald-400' : 'text-slate-500'}`}>{trainingReady}</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-xs font-mono text-slate-400">MODEL VERSION</span>
          <div className="text-sm font-bold font-mono text-indigo-300 mt-1">v0.1</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-xs font-mono text-slate-400">DATABASE ENGINE</span>
          <div className="text-sm font-bold font-mono text-indigo-300 flex items-center gap-1.5 mt-1">
            <Server className="w-4.5 h-4.5 text-indigo-400" /> SQLite Schema Active
          </div>
        </div>
      </div>

      {/* Raw JSON Schema Preview */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="font-bold text-slate-200 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
            <FileCode className="w-4 h-4 text-cyan-400" /> DATASET EXPORT PAYLOAD PREVIEW
          </h3>
          <span className="text-[11px] font-mono text-slate-500">100% OFF-GRID EXPORT</span>
        </div>

        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] text-cyan-300 font-mono overflow-x-auto max-h-96 leading-relaxed">
          {datasetJson}
        </pre>
      </div>
    </div>
  );
};
