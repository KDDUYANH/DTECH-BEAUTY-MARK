import React from 'react';
import { QAModuleResult } from '../scoring/makeupQA';
import { StatusPill } from './StatusPill';
import { ShieldAlert, Info, Activity } from 'lucide-react';

interface ScoreCardProps {
  moduleResult: QAModuleResult;
  onSelectRegion?: (regionKey: string) => void;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ moduleResult, onSelectRegion }) => {
  const { label, status, score, confidence, evidence, severity, recommendation, regionKey } = moduleResult;

  const getSeverityBadge = () => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">SEVERITY: HIGH</span>;
      case 'MEDIUM':
        return <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">SEVERITY: MED</span>;
      default:
        return <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">SEVERITY: LOW</span>;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all rounded-xl p-4 shadow-lg flex flex-col justify-between gap-3">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-100 text-sm tracking-wide">{label}</h4>
            {getSeverityBadge()}
          </div>
          <StatusPill status={status} />
        </div>

        {/* Score & Confidence display */}
        <div className="flex items-baseline justify-between my-2 py-2 px-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <div>
            <span className="text-xs text-slate-400 font-mono">QA SCORE: </span>
            {score !== null ? (
              <span className={`text-2xl font-black font-mono ${score < 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {score}<span className="text-xs font-normal text-slate-400">/100</span>
              </span>
            ) : (
              <span className="text-sm font-bold text-slate-400 font-mono">NOT ASSESSABLE</span>
            )}
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 font-mono block">CONFIDENCE</span>
            <span className="text-sm font-bold text-cyan-400 font-mono">{confidence}%</span>
          </div>
        </div>
      </div>

      {/* Evidence & Recommendation */}
      <div className="space-y-2 text-xs">
        <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-slate-300 font-mono leading-relaxed">
          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-1">
            <Activity className="w-3.5 h-3.5" /> MEASURABLE EVIDENCE
          </div>
          <p>{evidence}</p>
        </div>

        <div className="p-2.5 rounded bg-slate-800/40 border border-slate-700/50 text-slate-300">
          <div className="flex items-center gap-1.5 text-indigo-300 font-semibold mb-1">
            <Info className="w-3.5 h-3.5" /> RECOMMENDATION
          </div>
          <p>{recommendation}</p>
        </div>
      </div>

      {/* Footer trigger */}
      {onSelectRegion && (
        <button
          onClick={() => onSelectRegion(regionKey)}
          className="mt-1 w-full py-1.5 text-xs font-mono font-medium rounded bg-slate-800/80 hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-700/50 text-slate-400 border border-slate-700/50 transition-colors flex items-center justify-center gap-1"
        >
          <ShieldAlert className="w-3.5 h-3.5" /> INSPECT REGION POLYNOMIAL
        </button>
      )}
    </div>
  );
};
