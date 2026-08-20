import React, { useState } from 'react';
import {
  HelpCircle,
  ArrowLeft,
  MessageSquareQuote,
  Sparkles,
  Keyboard,
  Mic,
  Loader2
} from 'lucide-react';
import type { Question, FeedbackResponse } from '../../types';
import { AudioRecorder } from './AudioRecorder';
import { FeedbackCard } from './FeedbackCard';

interface QuestionDisplayProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  onNextQuestion: () => void;
  onEndSession: () => void;
  onAnswerSubmitted: (params: {
    audioBlob?: Blob | null;
    transcript?: string | null;
    durationSeconds: number;
  }) => Promise<FeedbackResponse | null>;
  isEvaluating: boolean;
  evaluationError: string | null;
  isLoadingNext: boolean;
}

const LEVEL_BADGE: Record<string, string> = {
  senior: 'badge badge-violet',
  mid:    'bg-blue-950/50 border-blue-800/50 text-blue-300 badge',
  junior: 'badge badge-emerald'
};

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question, currentIndex, totalQuestions,
  onNextQuestion, onEndSession, onAnswerSubmitted,
  isEvaluating, evaluationError, isLoadingNext
}) => {
  const [showHints, setShowHints] = useState(false);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [textAnswer, setTextAnswer] = useState('');
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);

  const handleAudioComplete = async (blob: Blob, durationSeconds: number) => {
    const res = await onAnswerSubmitted({ audioBlob: blob, durationSeconds });
    if (res) setFeedback(res);
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textAnswer.trim()) return;
    const dur = Math.max(10, Math.round(textAnswer.split(' ').length / 2.5));
    const res = await onAnswerSubmitted({ transcript: textAnswer, durationSeconds: dur });
    if (res) setFeedback(res);
  };

  const handleReRecord = () => { setFeedback(null); setTextAnswer(''); };

  const handleNext = () => {
    setFeedback(null);
    setTextAnswer('');
    setShowHints(false);
    onNextQuestion();
  };

  const progressPct = Math.round(((currentIndex - 1) / totalQuestions) * 100);

  return (
    <div className="max-w-3xl w-full mx-auto space-y-5 animate-fadeSlideUp relative z-10">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onEndSession}
          className="btn-secondary"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>

        {/* Progress indicator */}
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-xs font-semibold text-slate-400">
            Question <span className="text-slate-200">{currentIndex}</span> of <span className="text-slate-200">{totalQuestions}</span>
          </span>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalQuestions }).map((_, idx) => (
              <div
                key={idx}
                className={`progress-dot ${
                  idx + 1 < currentIndex ? 'progress-dot--done'
                  : idx + 1 === currentIndex ? 'progress-dot--current'
                  : 'progress-dot--future'
                }`}
              />
            ))}
          </div>
          {/* Linear progress bar */}
          <div className="w-full score-bar-track" style={{ width: '100%' }}>
            <div
              className="score-bar-fill score-bar-fill--violet"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Question Card ── */}
      <div className="glass-panel p-7 sm:p-8 rounded-3xl space-y-5 relative overflow-hidden">
        {/* Ambient glow top-right */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge badge-slate">{question.category}</span>
          <span className={LEVEL_BADGE[question.level] || 'badge badge-slate'}>
            {question.level} Level
          </span>
          <span className="badge badge-violet">
            {question.track === 'technical' ? 'Technical' : 'STAR Behavioral'}
          </span>
        </div>

        {/* Question text */}
        <div className="flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-violet-950/70 border border-violet-800/40 flex items-center justify-center flex-shrink-0 mt-0.5">
            <MessageSquareQuote className="w-4 h-4 text-violet-400" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white leading-relaxed tracking-tight">
            "{question.text}"
          </h3>
        </div>

        {/* Hints */}
        {question.hints && question.hints.length > 0 && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowHints(!showHints)}
              className="text-xs text-violet-400 hover:text-violet-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer group"
            >
              <HelpCircle className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
              <span>{showHints ? 'Hide hints' : 'Need a hint or angle to consider?'}</span>
            </button>

            {showHints && (
              <div className="mt-3 p-4 rounded-xl bg-slate-900/80 border border-violet-900/30 text-xs text-slate-300 space-y-2.5 animate-fadeSlideDown">
                <div className="font-semibold text-violet-300 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Consider addressing:
                </div>
                <ul className="space-y-1.5">
                  {question.hints.map((hint, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500/70 mt-1.5 flex-shrink-0" />
                      <span className="text-slate-300">{hint}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Answer Area ── */}
      {feedback ? (
        <div className="animate-fadeSlideUp">
          <FeedbackCard
            feedback={feedback}
            onNextQuestion={handleNext}
            onReRecord={handleReRecord}
            isLoadingNext={isLoadingNext}
            isLastQuestion={currentIndex >= totalQuestions}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Mode switcher */}
          <div className="flex justify-end gap-2">
            {(['voice', 'text'] as const).map((mode) => {
              const Icon = mode === 'voice' ? Mic : Keyboard;
              const label = mode === 'voice' ? 'Voice (Whisper)' : 'Type Answer';
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setInputMode(mode)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    inputMode === mode
                      ? 'bg-violet-950/80 text-violet-300 border border-violet-800/60'
                      : 'text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {inputMode === 'voice' ? (
            <AudioRecorder
              onRecordingComplete={handleAudioComplete}
              isTranscribing={isEvaluating}
              transcriptionError={evaluationError}
            />
          ) : (
            <div className="glass-panel p-6 rounded-3xl space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>Text Response Mode</span>
                <span className="text-slate-500 font-normal">— type as if speaking naturally</span>
              </div>
              <form onSubmit={handleTextSubmit} className="space-y-3">
                <textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  rows={5}
                  placeholder="Type your spoken answer or talking points here..."
                  className="input-field"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {textAnswer.trim().split(/\s+/).filter(Boolean).length} words
                    {textAnswer.trim().split(/\s+/).filter(Boolean).length > 0 && (
                      <> · ~{Math.round(textAnswer.trim().split(/\s+/).filter(Boolean).length / 2.5)}s</>
                    )}
                  </span>
                  <button
                    type="submit"
                    disabled={!textAnswer.trim() || isEvaluating}
                    className="btn-primary py-2.5 px-5 text-xs"
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Evaluating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Get AI Feedback</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
