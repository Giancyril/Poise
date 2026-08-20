import React, { useState } from 'react';
import {
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Volume2,
  Gauge,
  MessageSquareQuote,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Activity
} from 'lucide-react';
import type { FeedbackResponse } from '../../types';

interface FeedbackCardProps {
  feedback: FeedbackResponse;
  onNextQuestion: () => void;
  onReRecord: () => void;
  isLoadingNext: boolean;
  isLastQuestion: boolean;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({
  feedback,
  onNextQuestion,
  onReRecord,
  isLoadingNext,
  isLastQuestion
}) => {
  const [copied, setCopied] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const { scores, delivery_metrics, strengths, improvements, rewritten_snippet } = feedback;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40';
    if (score >= 70) return 'text-violet-300 border-violet-500/50 bg-violet-950/40';
    return 'text-amber-300 border-amber-500/50 bg-amber-950/40';
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(rewritten_snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-8 animate-fadeIn border-slate-800/90 shadow-2xl">
      {/* 1. Top Score & Performance Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
        <div className="flex items-center space-x-4">
          {/* Main Overall Score Ring */}
          <div
            className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 shadow-lg ${getScoreColor(
              scores.overall_score
            )}`}
          >
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {scores.overall_score}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
              Score
            </span>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-violet-950/60 border border-violet-800/40 text-violet-300 text-xs font-medium">
              <Sparkles className="w-3 h-3 text-violet-400" />
              <span>AI Coach Evaluation</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {scores.overall_score >= 85
                ? 'Strong & Well-Articulated Response'
                : scores.overall_score >= 70
                ? 'Solid Answer with Polish Opportunities'
                : 'Foundational Answer — Needs More Specifics'}
            </h3>
            <p className="text-xs text-slate-400">
              Evaluated across technical substance, STAR logic, and vocal pacing.
            </p>
          </div>
        </div>

        {/* 3 Metric Progress Meters */}
        <div className="grid grid-cols-3 gap-3 sm:w-64">
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-center space-y-1">
            <span className="text-[10px] text-slate-400 font-medium block">Content</span>
            <span className="text-sm font-bold text-slate-200">{scores.content_score}%</span>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${scores.content_score}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-center space-y-1">
            <span className="text-[10px] text-slate-400 font-medium block">Clarity</span>
            <span className="text-sm font-bold text-slate-200">{scores.clarity_score}%</span>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-violet-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${scores.clarity_score}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-center space-y-1">
            <span className="text-[10px] text-slate-400 font-medium block">Delivery</span>
            <span className="text-sm font-bold text-slate-200">{scores.delivery_score}%</span>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${scores.delivery_score}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Vocal Delivery & Pacing Strip */}
      <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Gauge className="w-4 h-4 text-violet-400" />
          <span className="text-slate-400">Pacing:</span>
          <span className="font-semibold text-slate-200">
            {delivery_metrics.words_per_minute} WPM
          </span>
          <span className="text-slate-500">({delivery_metrics.pacing_assessment})</span>
        </div>

        <div className="flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-amber-400" />
          <span className="text-slate-400">Filler Words:</span>
          <span className="font-semibold text-slate-200">
            {delivery_metrics.filler_word_count} detected
          </span>
          {delivery_metrics.filler_words.length > 0 && (
            <span className="text-slate-400">
              ({delivery_metrics.filler_words.map(f => `"${f.word}" × ${f.count}`).join(', ')})
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          <span className="text-slate-400">Duration:</span>
          <span className="font-semibold text-slate-200">
            {Math.round(feedback.duration_seconds)}s
          </span>
        </div>
      </div>

      {/* 3. Strengths & Improvements Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Key Strengths</span>
          </div>
          <div className="space-y-2.5">
            {strengths.map((str, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/30 text-xs text-slate-200 flex items-start space-x-2.5 leading-relaxed"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                <span>{str}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Areas */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <TrendingUp className="w-4 h-4" />
            <span>High-Leverage Growth Areas</span>
          </div>
          <div className="space-y-2.5">
            {improvements.map((imp, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/30 text-xs text-slate-200 flex items-start space-x-2.5 leading-relaxed"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <span>{imp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Exemplary Rewritten Answer Snippet */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-violet-400">
            <Sparkles className="w-4 h-4" />
            <span>Exemplary Model Rephrase</span>
          </div>
          <button
            type="button"
            onClick={handleCopySnippet}
            className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/40 via-purple-950/30 to-slate-900/60 border border-violet-800/40 text-xs sm:text-sm text-slate-200 leading-relaxed relative">
          <p className="italic">"{rewritten_snippet}"</p>
        </div>
      </div>

      {/* 5. Transcript Accordion */}
      <div className="pt-1 border-t border-slate-800/60">
        <button
          type="button"
          onClick={() => setShowTranscript(!showTranscript)}
          className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-2 transition-colors cursor-pointer"
        >
          <span className="flex items-center space-x-1.5">
            <MessageSquareQuote className="w-3.5 h-3.5 text-slate-500" />
            <span>{showTranscript ? 'Hide Spoken Transcript' : 'View Your Spoken Transcript'}</span>
          </span>
          {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showTranscript && (
          <div className="mt-2 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 italic leading-relaxed animate-fadeIn">
            "{feedback.transcript}"
          </div>
        )}
      </div>

      {/* 6. Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onReRecord}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Re-try This Question</span>
        </button>

        <button
          type="button"
          onClick={onNextQuestion}
          disabled={isLoadingNext}
          className="py-3 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-violet-600/25 flex items-center space-x-2 transition-all transform active:scale-[0.99] cursor-pointer"
        >
          {isLoadingNext ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generating Next Question...</span>
            </>
          ) : (
            <>
              <span>{isLastQuestion ? 'View Session Summary' : 'Next Question'}</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
