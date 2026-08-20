import React, { useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  MessageSquareQuote,
  FileText,
  RotateCcw
} from 'lucide-react';
import type { Question } from '../../types';
import { AudioRecorder } from './AudioRecorder';

interface QuestionDisplayProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  onNextQuestion: () => void;
  onEndSession: () => void;
  onAudioSubmitted: (blob: Blob, durationSeconds: number) => Promise<string | null>;
  isTranscribing: boolean;
  transcriptionError: string | null;
  isLoadingNext: boolean;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  currentIndex,
  totalQuestions,
  onNextQuestion,
  onEndSession,
  onAudioSubmitted,
  isTranscribing,
  transcriptionError,
  isLoadingNext
}) => {
  const [showHints, setShowHints] = useState(false);
  const [latestTranscript, setLatestTranscript] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);

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
    setRecordingDuration(durationSeconds);
    const transcript = await onAudioSubmitted(blob, durationSeconds);
    if (transcript) {
      setLatestTranscript(transcript);
    }
  };

  const handleReRecord = () => {
    setLatestTranscript(null);
    setRecordingDuration(0);
  };

  const handleNext = () => {
    setLatestTranscript(null);
    setRecordingDuration(0);
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

      {/* Centerpiece: Audio Recorder OR Transcript Result */}
      {!latestTranscript ? (
        <AudioRecorder
          onRecordingComplete={handleAudioComplete}
          isTranscribing={isTranscribing}
          transcriptionError={transcriptionError}
        />
      ) : (
        <div className="glass-panel p-6 rounded-3xl space-y-5 animate-fadeIn border-emerald-900/40">
          {/* Transcript Success Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/50 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Spoken Answer Transcribed</h4>
                <p className="text-xs text-slate-400">
                  Duration: {Math.round(recordingDuration)}s &bull; Powered by Whisper STT
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReRecord}
              className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Re-record</span>
            </button>
          </div>

          {/* Transcript Body */}
          <div className="space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-violet-400" />
              <span>Your Spoken Transcript</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-sm text-slate-200 leading-relaxed italic">
              "{latestTranscript}"
            </div>
          </div>

          {/* Notice & Next Step Button */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-xs text-slate-500 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Structured feedback & delivery analytics connect in Stage 4</span>
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={isLoadingNext}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-violet-600/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              {isLoadingNext ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Loading Next Question...</span>
                </>
              ) : (
                <>
                  <span>{currentIndex >= totalQuestions ? 'Complete Session' : 'Next Question'}</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
