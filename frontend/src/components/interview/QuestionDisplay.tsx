import React, { useState } from 'react';
import {
  HelpCircle,
  ArrowLeft,
  MessageSquareQuote,
  Sparkles,
  Keyboard,
  Mic
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

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  currentIndex,
  totalQuestions,
  onNextQuestion,
  onEndSession,
  onAnswerSubmitted,
  isEvaluating,
  evaluationError,
  isLoadingNext
}) => {
  const [showHints, setShowHints] = useState(false);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [textAnswer, setTextAnswer] = useState('');
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'senior':
        return 'bg-purple-950/70 border-purple-800/60 text-purple-300';
      case 'mid':
        return 'bg-blue-950/70 border-blue-800/60 text-blue-300';
      default:
        return 'bg-emerald-950/70 border-emerald-800/60 text-emerald-300';
    }
  };

  const handleAudioComplete = async (blob: Blob, durationSeconds: number) => {
    const res = await onAnswerSubmitted({
      audioBlob: blob,
      durationSeconds
    });
    if (res) {
      setFeedback(res);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textAnswer.trim()) return;
    const estimatedDuration = Math.max(10, Math.round(textAnswer.split(' ').length / 2.5));
    const res = await onAnswerSubmitted({
      transcript: textAnswer,
      durationSeconds: estimatedDuration
    });
    if (res) {
      setFeedback(res);
    }
  };

  const handleReRecord = () => {
    setFeedback(null);
    setTextAnswer('');
  };

  const handleNext = () => {
    setFeedback(null);
    setTextAnswer('');
    setShowHints(false);
    onNextQuestion();
  };

  return (
    <div className="max-w-3xl w-full mx-auto space-y-6 animate-fadeIn">
      {/* Top Bar: Progress & Exit */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onEndSession}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Session</span>
        </button>

        {/* Question Counter Indicator */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400">
            Question {currentIndex} of {totalQuestions}
          </span>
          <div className="flex space-x-1">
            {Array.from({ length: totalQuestions }).map((_, idx) => (
              <div
                key={idx}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  idx + 1 === currentIndex
                    ? 'bg-violet-500 ring-2 ring-violet-500/30'
                    : idx + 1 < currentIndex
                    ? 'bg-emerald-500/80'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="glass-panel p-8 rounded-3xl space-y-6 relative overflow-hidden border-slate-800/80 shadow-2xl">
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300">
            {question.category}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${getLevelBadgeClass(
              question.level
            )}`}
          >
            {question.level} Level
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-violet-950/60 border border-violet-800/40 text-violet-300">
            {question.track === 'technical' ? 'Technical Architecture' : 'STAR Behavioral'}
          </span>
        </div>

        {/* Question Prompt */}
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <MessageSquareQuote className="w-7 h-7 text-violet-400 flex-shrink-0 mt-1" />
            <h3 className="text-xl sm:text-2xl font-bold text-white leading-relaxed tracking-tight">
              "{question.text}"
            </h3>
          </div>
        </div>

        {/* Expandable Hints Section */}
        {question.hints && question.hints.length > 0 && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowHints(!showHints)}
              className="text-xs text-violet-400 hover:text-violet-300 inline-flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showHints ? 'Hide Hints' : 'Need a hint or angle to consider?'}</span>
            </button>

            {showHints && (
              <div className="mt-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-2 animate-fadeIn">
                <div className="font-semibold text-violet-300">Consider addressing:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  {question.hints.map((hint, i) => (
                    <li key={i}>{hint}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Answer Area: Audio Recorder, Text Fallback, OR Structured Feedback Card */}
      {feedback ? (
        <FeedbackCard
          feedback={feedback}
          onNextQuestion={handleNext}
          onReRecord={handleReRecord}
          isLoadingNext={isLoadingNext}
          isLastQuestion={currentIndex >= totalQuestions}
        />
      ) : (
        <div className="space-y-4">
          {/* Mode Switcher (Voice vs Text input) */}
          <div className="flex justify-end space-x-2 text-xs">
            <button
              type="button"
              onClick={() => setInputMode('voice')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                inputMode === 'voice'
                  ? 'bg-violet-950/80 text-violet-300 border border-violet-800/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice Mode (Whisper)</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                inputMode === 'text'
                  ? 'bg-violet-950/80 text-violet-300 border border-violet-800/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Text Mode</span>
            </button>
          </div>

          {inputMode === 'voice' ? (
            <AudioRecorder
              onRecordingComplete={handleAudioComplete}
              isTranscribing={isEvaluating}
              transcriptionError={evaluationError}
            />
          ) : (
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>Text Response Mode</span>
              </div>
              <form onSubmit={handleTextSubmit} className="space-y-3">
                <textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  rows={4}
                  placeholder="Type your spoken answer or talking points here..."
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!textAnswer.trim() || isEvaluating}
                    className="py-2.5 px-5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold disabled:opacity-40 transition-all cursor-pointer"
                  >
                    {isEvaluating ? 'Evaluating with AI...' : 'Submit Answer for Feedback'}
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
