import React, { useState } from 'react';
import { AnalysisRecord, localDb } from '../storage/db';
import { CheckCircle2, XCircle, HelpCircle, Edit3, Save, X } from 'lucide-react';

interface HumanReviewModalProps {
  record: AnalysisRecord;
  onClose: () => void;
  onSaved: () => void;
}

export const HumanReviewModal: React.FC<HumanReviewModalProps> = ({ record, onClose, onSaved }) => {
  const [status, setStatus] = useState<NonNullable<AnalysisRecord['human_review']>['status']>(
    record.human_review ? record.human_review.status : 'ACCEPTED'
  );
  const [userComment, setUserComment] = useState(record.human_review?.user_comment || '');
  const [correctedSeverity, setCorrectedSeverity] = useState(record.human_review?.corrected_severity || 'MEDIUM');
  const [correctedCategory, setCorrectedCategory] = useState(record.human_review?.corrected_category || 'eyeliner');

  const handleSave = () => {
    localDb.updateHumanReview(record.id, {
      status,
      user_comment: userComment,
      corrected_severity: status === 'CORRECTED' ? correctedSeverity : undefined,
      corrected_category: status === 'CORRECTED' ? correctedCategory : undefined,
      reviewed_at: new Date().toISOString(),
    });
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-cyan-400" /> HUMAN REVIEW & DATASET ANNOTATION
            </h3>
            <p className="text-xs text-slate-400 font-mono">RECORD ID: {record.id}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Snapshot preview & AI result */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
            {record.image_data_url ? (
              <img src={record.image_data_url} alt="Captured frame" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-mono text-slate-600">No Snapshot</span>
            )}
          </div>

          <div className="text-xs space-y-1 font-mono">
            <span className="text-slate-400 block font-sans font-semibold">AI PREDICTION SUMMARY</span>
            <div className="text-cyan-400">Score: {record.overall_score !== null ? `${record.overall_score}/100` : 'N/A'}</div>
            <div className="text-emerald-400">Pose: P{record.landmarks_summary.pose.pitch}° / Y{record.landmarks_summary.pose.yaw}°</div>
            <div className="text-slate-300">Status: {record.assessable_status}</div>
            <div className="text-slate-500 text-[11px] pt-1">Model: {record.model_version}</div>
          </div>
        </div>

        {/* Review Action Buttons */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-semibold text-slate-300">SELECT HUMAN VERDICT</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setStatus('ACCEPTED')}
              className={`p-2.5 rounded-lg text-xs font-bold font-mono flex flex-col items-center gap-1 transition-all border ${
                status === 'ACCEPTED'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500 glow-emerald'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> ACCEPT
            </button>

            <button
              type="button"
              onClick={() => setStatus('REJECTED')}
              className={`p-2.5 rounded-lg text-xs font-bold font-mono flex flex-col items-center gap-1 transition-all border ${
                status === 'REJECTED'
                  ? 'bg-rose-950 text-rose-300 border-rose-500 glow-rose'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <XCircle className="w-4 h-4 text-rose-400" /> REJECT
            </button>

            <button
              type="button"
              onClick={() => setStatus('UNCERTAIN')}
              className={`p-2.5 rounded-lg text-xs font-bold font-mono flex flex-col items-center gap-1 transition-all border ${
                status === 'UNCERTAIN'
                  ? 'bg-amber-950 text-amber-300 border-amber-500 glow-amber'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-amber-400" /> UNCERTAIN
            </button>

            <button
              type="button"
              onClick={() => setStatus('CORRECTED')}
              className={`p-2.5 rounded-lg text-xs font-bold font-mono flex flex-col items-center gap-1 transition-all border ${
                status === 'CORRECTED'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500 glow-cyan'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Edit3 className="w-4 h-4 text-cyan-400" /> CORRECT
            </button>
          </div>
        </div>

        {/* Correction Options (If CORRECTED selected) */}
        {status === 'CORRECTED' && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-cyan-900/60">
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Target Category</label>
              <select
                value={correctedCategory}
                onChange={(e) => setCorrectedCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
              >
                <option value="eyebrow">Eyebrow</option>
                <option value="eyeliner">Eyeliner</option>
                <option value="eyelash">Eyelash</option>
                <option value="eyeshadow">Eyeshadow</option>
                <option value="blush">Blush</option>
                <option value="contour">Contour</option>
                <option value="lips">Lips</option>
                <option value="base">Foundation</option>
                <option value="hair">Hair</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Corrected Severity</label>
              <select
                value={correctedSeverity}
                onChange={(e) => setCorrectedSeverity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>
        )}

        {/* User Comment / Reason */}
        <div>
          <label className="text-xs font-mono text-slate-300 block mb-1">REVIEWER COMMENT & REASONING</label>
          <textarea
            rows={3}
            value={userComment}
            onChange={(e) => setUserComment(e.target.value)}
            placeholder="e.g. Camera angle caused false positive asymmetry; lightning shadow on right cheek..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
          />
        </div>

        {/* Save Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-mono font-medium text-slate-400 hover:bg-slate-800"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-lg text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 shadow-lg shadow-cyan-600/30"
          >
            <Save className="w-4 h-4" /> SAVE TO LOCAL DATASET
          </button>
        </div>
      </div>
    </div>
  );
};
