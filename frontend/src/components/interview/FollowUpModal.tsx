import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  ChevronRight,
  Loader2,
  X,
  HelpCircle,
  Volume2,
  MessageSquare,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import type {
  FollowUpDepth,
  FollowUpResponse,
  TrackType,
  DifficultyLevel
} from '../../types';
import { requestFollowUpQuestion } from '../../services/api';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  questionId: string;
  transcript: string;
  track: TrackType;
  category: string;
  level: DifficultyLevel;
  onAcceptFollowUp: (followUp: FollowUpResponse) => void;
}

const DEPTH_OPTIONS: { id: FollowUpDepth; title: string; desc: string; icon: any }[] = [
  {
    id: 'shallow',
    title: 'Clarify & Expand',
    desc: 'Deepen your concrete examples and articulate details',
    icon: MessageSquare
  },
  {
    id: 'medium',
    title: 'Challenge Trade-Offs',
    desc: 'Defend your architectural choices and alternative approaches',
    icon: Layers
  },
  {
    id: 'deep',
    title: 'Stress-Test Edge Cases',
    desc: 'Recover from system failures, scale bottlenecks, and constraints',
    icon: ShieldAlert
  }
];

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  questionId,
  transcript,
  track,
  category,
  level,
  onAcceptFollowUp
}) => {
  const [selectedDepth, setSelectedDepth] = useState<FollowUpDepth>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [followUpResult, setFollowUpResult] = useState<FollowUpResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDirection, setShowDirection] = useState(false);

  const { speak, isPlaying: isSpeaking, stop: stopAudio } = useAudioPlayer();

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await requestFollowUpQuestion({
        session_id: sessionId,
        question_id: questionId,
        transcript,
        depth: selectedDepth,
        track,
        category,
        level
      });
      setFollowUpResult(res);
      // Auto-read follow-up
      speak(res.follow_up_question);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate follow-up question');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    if (followUpResult) {
      stopAudio();
      onAcceptFollowUp(followUpResult);
      onClose();
    }
  };

  const handleClose = () => {
    stopAudio();
    setFollowUpResult(null);
    setShowDirection(false);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl glass-panel p-6 sm:p-7 rounded-3xl border-slate-700/80 shadow-2xl space-y-5 animate-fadeSlideUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Dynamic Follow-Up Drill-Down</h3>
              <p className="text-xs text-slate-400">Simulate a multi-turn interviewer probing your actual answer</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs">
            {errorMessage}
          </div>
        )}

        {!followUpResult ? (
          /* Step 1: Select Depth */
          <div className="space-y-4">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Choose Probing Intensity:
            </div>
            <div className="space-y-2.5">
              {DEPTH_OPTIONS.map((opt) => {
                const isSelected = selectedDepth === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedDepth(opt.id)}
                    className={`w-full p-3.5 rounded-xl border text-left flex items-start space-x-3.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-violet-950/50 border-violet-500/80 text-white shadow-xs ring-1 ring-violet-500/30'
                        : 'bg-slate-900/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs sm:text-sm">{opt.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading}
                className="btn-primary w-full py-3 text-sm flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Answer & Calibrating Probe...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Contextual Probe</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Display Generated Follow-up Question */
          <div className="space-y-4 animate-fadeSlideUp">
            <div className="p-4 rounded-2xl bg-violet-950/30 border border-violet-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="badge badge-violet uppercase text-[10px]">
                  {followUpResult.depth} Level Probe
                </span>
                <button
                  type="button"
                  onClick={() => speak(followUpResult.follow_up_question)}
                  className="flex items-center space-x-1 text-xs text-violet-300 hover:text-violet-200 cursor-pointer"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-pulse text-violet-400' : ''}`} />
                  <span>{isSpeaking ? 'Playing...' : 'Read Aloud'}</span>
                </button>
              </div>

              <h4 className="text-base font-bold text-white leading-relaxed">
                "{followUpResult.follow_up_question}"
              </h4>

              {followUpResult.rationale && (
                <p className="text-xs text-slate-400 italic">
                  Interviewer Context: {followUpResult.rationale}
                </p>
              )}
            </div>

            {/* Hint / Direction */}
            {followUpResult.suggested_answer_direction && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowDirection(!showDirection)}
                  className="text-xs text-violet-400 hover:text-violet-300 flex items-center space-x-1.5 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showDirection ? 'Hide Target Angle' : 'View Target Answer Direction'}</span>
                </button>

                {showDirection && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed animate-fadeSlideDown">
                    {followUpResult.suggested_answer_direction}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setFollowUpResult(null)}
                className="btn-secondary text-xs py-2.5 px-4"
              >
                Choose Different Depth
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className="btn-primary text-xs py-2.5 px-5 flex items-center space-x-2"
              >
                <span>Answer This Follow-Up</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
