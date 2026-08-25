import React from 'react';
import { QAStatus } from '../scoring/makeupQA';

interface StatusPillProps {
  status: QAStatus | 'MODEL_NOT_AVAILABLE' | 'NO_CAMERA_INPUT' | 'LOW_CONFIDENCE';
}

export const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  switch (status) {
    case 'OPTIMAL':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-700/80">
          OPTIMAL
        </span>
      );
    case 'WARNING':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-amber-950/80 text-amber-400 border border-amber-700/80">
          WARNING
        </span>
      );
    case 'ERROR':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-rose-950/80 text-rose-400 border border-rose-700/80">
          ERROR
        </span>
      );
    case 'NOT_ASSESSABLE':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 font-mono">
          NOT ASSESSABLE
        </span>
      );
    case 'MODEL_NOT_AVAILABLE':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-purple-950 text-purple-300 border border-purple-800 font-mono">
          MODEL NOT AVAILABLE
        </span>
      );
    case 'NO_CAMERA_INPUT':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-red-950 text-red-400 border border-red-800 font-mono">
          NO CAMERA INPUT
        </span>
      );
    case 'LOW_CONFIDENCE':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-yellow-950 text-yellow-400 border border-yellow-800 font-mono">
          LOW CONFIDENCE
        </span>
      );
    default:
      return null;
  }
};
