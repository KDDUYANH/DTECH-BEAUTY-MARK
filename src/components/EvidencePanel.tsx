import React from 'react';
import { MakeupQAReport } from '../scoring/makeupQA';
import { FileText, Cpu, BarChart2, ShieldCheck } from 'lucide-react';

interface EvidencePanelProps {
  report: MakeupQAReport | null;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ report }) => {
  if (!report) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-400">
        <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm font-mono">No evidence report generated yet. Run analysis on live feed or upload an image.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-slate-100 text-base">EVIDENCE AUDIT REPORT</h3>
        </div>
        <span className="text-xs font-mono text-slate-400">TIMESTAMP: {new Date(report.evaluatedAt).toLocaleTimeString()}</span>
      </div>

      {/* Global Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
          <span className="text-xs font-mono text-slate-400 block mb-1">OVERALL QA SCORE</span>
          {report.overallScore !== null ? (
            <span className="text-2xl font-black font-mono text-cyan-400">{report.overallScore}/100</span>
          ) : (
            <span className="text-sm font-bold text-slate-400 font-mono">NOT ASSESSABLE</span>
          )}
        </div>

        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
          <span className="text-xs font-mono text-slate-400 block mb-1">CONFIDENCE AVERAGE</span>
          <span className="text-2xl font-black font-mono text-emerald-400">{report.confidenceAverage}%</span>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
          <span className="text-xs font-mono text-slate-400 block mb-1">ISOLATION AUDIT</span>
          <span className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-1 mt-1">
            <ShieldCheck className="w-4 h-4 text-cyan-400" /> 100% LOCAL COMPUTED
          </span>
        </div>
      </div>

      {/* Unassessable Notice */}
      {report.assessableStatus !== 'ASSESSABLE' && (
        <div className="p-3 rounded-lg bg-amber-950/50 border border-amber-800/80 text-amber-300 text-xs font-mono">
          ⚠️ <strong>NOT ASSESSABLE:</strong> {report.unassessableReason}
        </div>
      )}

      {/* Evidence Table */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" /> QUANTITATIVE EVIDENCE METRICS
        </h4>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {Object.entries(report.modules).map(([key, mod]) => (
            <div key={key} className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-200">{mod.label}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    CONFIDENCE {mod.confidence}%
                  </span>
                </div>
                <p className="text-xs font-mono text-cyan-300/90">{mod.evidence}</p>
              </div>
              <div className="text-right whitespace-nowrap">
                {mod.score !== null ? (
                  <span className={`text-lg font-black font-mono ${mod.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {mod.score}/100
                  </span>
                ) : (
                  <span className="text-xs font-mono text-slate-500">N/A</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
