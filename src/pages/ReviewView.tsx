import React, { useState } from 'react';
import { AnalysisRecord, localDb } from '../storage/db';
import { HumanReviewModal } from '../components/HumanReviewModal';
import { CheckSquare, Edit3, CheckCircle2, XCircle, HelpCircle, RefreshCw, Trash2 } from 'lucide-react';

export const ReviewView: React.FC = () => {
  const [records, setRecords] = useState<AnalysisRecord[]>(() => localDb.getAllAnalyses());
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);

  const refreshRecords = () => {
    setRecords(localDb.getAllAnalyses());
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all local analysis records?')) {
      localDb.clearAllData();
      refreshRecords();
    }
  };

  const getReviewBadge = (rec: AnalysisRecord) => {
    if (!rec.human_review) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
          UNREVIEWED
        </span>
      );
    }
    switch (rec.human_review.status) {
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> ACCEPTED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-rose-950 text-rose-400 border border-rose-800">
            <XCircle className="w-3.5 h-3.5" /> REJECTED
          </span>
        );
      case 'UNCERTAIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">
            <HelpCircle className="w-3.5 h-3.5" /> UNCERTAIN
          </span>
        );
      case 'CORRECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
            <Edit3 className="w-3.5 h-3.5" /> CORRECTED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-100 text-lg flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-cyan-400" /> HUMAN REVIEW & GROUND TRUTH SEED
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Annotate AI predictions (Accept / Reject / Correct) to build D-Tech's local ground truth dataset.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshRecords}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleClearAll}
            className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-mono font-bold text-xs rounded-lg border border-rose-800 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> CLEAR RECORDS
          </button>
        </div>
      </div>

      {/* Record Table / Cards List */}
      <div className="space-y-3">
        {records.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {records.map((rec) => (
              <div
                key={rec.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-slate-950 overflow-hidden flex-shrink-0 border border-slate-800">
                    {rec.image_data_url ? (
                      <img src={rec.image_data_url} alt="Frame" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-600 font-mono">No Image</div>
                    )}
                  </div>

                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{rec.id}</span>
                      {getReviewBadge(rec)}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Date: {new Date(rec.timestamp).toLocaleString()} • Score: {rec.overall_score !== null ? `${rec.overall_score}/100` : 'N/A'}
                    </div>
                    {rec.human_review?.user_comment && (
                      <div className="text-cyan-300 text-[11px] italic">
                        "{rec.human_review.user_comment}"
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedRecord(rec)}
                  className="px-4 py-2 bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-700/60 text-slate-300 font-mono font-bold text-xs rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 justify-center"
                >
                  <Edit3 className="w-4 h-4 text-cyan-400" /> ANNOTATE / REVIEW
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-10 text-center text-slate-500 font-mono text-xs space-y-2">
            <CheckSquare className="w-10 h-10 text-slate-700 mx-auto" />
            <p>No analysis records saved yet. Run QA analysis on live camera or uploaded image to record samples.</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedRecord && (
        <HumanReviewModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onSaved={refreshRecords}
        />
      )}
    </div>
  );
};
