import React from 'react';
import {
  History,
  X,
  Award,
  ChevronRight,
  Trash2,
  Activity
} from 'lucide-react';
import type { SessionSummary } from '../../types';

export interface StoredSessionItem {
  id: string;
  date: string;
  summary: SessionSummary;
}

interface PracticeHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: StoredSessionItem[];
  onSelectSession: (summary: SessionSummary) => void;
  onClearHistory: () => void;
}

export const PracticeHistoryDrawer: React.FC<PracticeHistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectSession,
  onClearHistory
}) => {
  if (!isOpen) return null;

  // Calculate overall performance trend
  const avgOverall = history.length > 0
    ? Math.round(history.reduce((acc, h) => acc + h.summary.average_overall_score, 0) / history.length)
    : 0;

  const avgWPM = history.length > 0
    ? Math.round(history.reduce((acc, h) => acc + h.summary.average_wpm, 0) / history.length)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md h-full glass-panel border-l border-slate-800/90 shadow-2xl p-6 flex flex-col justify-between animate-slideInRight overflow-y-auto">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400">
                <History className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">Practice History & Trends</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          {history.length > 0 && (
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <Award className="w-3.5 h-3.5 text-violet-400" />
                  <span>Mean Score</span>
                </div>
                <div className="text-xl font-extrabold text-white">{avgOverall}/100</div>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Average Pace</span>
                </div>
                <div className="text-xl font-extrabold text-white">{avgWPM} WPM</div>
              </div>
            </div>
          )}

          {/* Session Cards List */}
          {history.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <History className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-300">No practice sessions yet</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Complete an interview session to unlock your progress tracker and score trajectory.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Completed Sessions ({history.length})
              </div>
              {history.map((item) => {
                const s = item.summary;
                const scoreBg = s.average_overall_score >= 85
                  ? 'bg-emerald-950/60 border-emerald-800/50 text-emerald-300'
                  : s.average_overall_score >= 70
                  ? 'bg-violet-950/60 border-violet-800/50 text-violet-300'
                  : 'bg-amber-950/60 border-amber-800/50 text-amber-300';

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectSession(s);
                      onClose();
                    }}
                    className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-violet-500/50 hover:bg-slate-900/90 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-200 group-hover:text-white transition-colors">
                          {s.category}
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
                          <span>{item.date}</span>
                          <span>·</span>
                          <span className="capitalize">{s.level}</span>
                          <span>·</span>
                          <span>{s.total_questions_answered} Qs</span>
                        </div>
                      </div>
                      <div className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${scoreBg}`}>
                        {s.average_overall_score}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/50 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Pace: {s.average_wpm} wpm</span>
                      <div className="flex items-center space-x-1 text-violet-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                        <span>View Summary</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {history.length > 0 && (
          <div className="pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClearHistory}
              className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-red-950/30 hover:bg-red-900/40 border border-red-800/40 text-red-400 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
