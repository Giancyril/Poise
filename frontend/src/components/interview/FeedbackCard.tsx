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
  Activity,
  Loader2,
  Flag
} from 'lucide-react';
import type { FeedbackResponse } from '../../types';

interface FeedbackCardProps {
  feedback: FeedbackResponse;
  onNextQuestion: () => void;
  onReRecord: () => void;
  onDrillDown?: () => void;
  isLoadingNext: boolean;
  isLastQuestion: boolean;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({
  feedback,
  onNextQuestion,
  onReRecord,
  onDrillDown,
  isLoadingNext,
  isLastQuestion
}) => {
  const [copied, setCopied] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const { scores, delivery_metrics, strengths, improvements, rewritten_snippet } = feedback;
  const overall = scores.overall_score;

  const scoreColorText = (s: number) =>
    s >= 85 ? 'text-emerald-400' : s >= 70 ? 'text-violet-300' : 'text-amber-300';
  const scoreBorderBg = (s: number) =>
    s >= 85 ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
    : s >= 70 ? 'bg-violet-950/40 border-violet-500/40 text-violet-300'
    : 'bg-amber-950/40 border-amber-500/40 text-amber-300';

  const headline = overall >= 85
    ? 'Excellent Response!'
    : overall >= 70
    ? 'Solid Answer — Good Foundation'
    : 'Needs More Specifics — Keep Practicing';

  const handleCopy = () => {
    navigator.clipboard.writeText(rewritten_snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-7 animate-fadeSlideUp border-slate-800/90 shadow-2xl">

      {/* ── 1. Score Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-slate-800/60">
        <div className="flex items-center gap-4">
          {/* Score ring */}
          <div className={`score-reveal w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 shadow-lg flex-shrink-0 ${scoreBorderBg(overall)}`}>
            <span className="text-3xl font-extrabold leading-none">{overall}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-75 mt-0.5">Score</span>
          </div>
          <div className="space-y-1.5">
            <div className="badge badge-violet inline-flex">
              <Sparkles className="w-3 h-3" />
              <span>AI Coach Evaluation</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white">{headline}</h3>
            <p className="text-xs text-slate-400 leading-snug max-w-xs">
              Scored across content depth, structural clarity, and vocal delivery.
            </p>
          </div>
        </div>

        {/* Sub-scores */}
        <div className="grid grid-cols-3 gap-2.5 sm:w-56 flex-shrink-0">
          {[
            { label: 'Content', score: scores.content_score, bar: 'score-bar-fill--emerald' },
            { label: 'Clarity', score: scores.clarity_score, bar: 'score-bar-fill--violet' },
            { label: 'Delivery', score: scores.delivery_score, bar: 'score-bar-fill--indigo' }
          ].map(({ label, score, bar }) => (
            <div key={label} className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 text-center space-y-1.5">
              <span className="text-[10px] text-slate-400 font-semibold block">{label}</span>
              <span className={`text-sm font-extrabold ${scoreColorText(score)}`}>{score}</span>
              <div className="score-bar-track">
                <div className={`score-bar-fill ${bar}`} style={{ width: `${score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. Delivery Stats ── */}
      <div className="bg-slate-900/50 border border-slate-800/60 p-4 rounded-2xl flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-violet-400 flex-shrink-0" />
          <span className="text-slate-400">Pacing:</span>
          <span className="font-bold text-slate-200">{delivery_metrics.words_per_minute} WPM</span>
          <span className="text-slate-500">({delivery_metrics.pacing_assessment})</span>
        </div>
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-slate-400">Fillers:</span>
          <span className="font-bold text-slate-200">{delivery_metrics.filler_word_count} detected</span>
          {delivery_metrics.filler_words.length > 0 && (
            <span className="text-slate-500 hidden sm:inline">
              ({delivery_metrics.filler_words.map(f => `"${f.word}"×${f.count}`).join(', ')})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span className="text-slate-400">Duration:</span>
          <span className="font-bold text-slate-200">{Math.round(feedback.duration_seconds)}s</span>
        </div>
      </div>

      {/* ── 3. Strengths & Improvements ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Key Strengths</span>
          </div>
          <div className="space-y-2">
            {strengths.map((s, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-emerald-950/18 border border-emerald-900/30 text-xs text-slate-200 flex items-start gap-2.5 leading-relaxed animate-fadeIn" style={{ animationDelay: `${i * 0.07}s` }}>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-400">
            <TrendingUp className="w-4 h-4" />
            <span>Growth Areas</span>
          </div>
          <div className="space-y-2">
            {improvements.map((imp, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-amber-950/18 border border-amber-900/30 text-xs text-slate-200 flex items-start gap-2.5 leading-relaxed animate-fadeIn" style={{ animationDelay: `${i * 0.07}s` }}>
                <TrendingUp className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>{imp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4. Model Snippet ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-violet-400">
            <Sparkles className="w-4 h-4" />
            <span>Exemplary Model Rephrase</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="tooltip-trigger inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className={copied ? 'text-emerald-400 font-semibold' : ''}>{copied ? 'Copied!' : 'Copy'}</span>
            <span className="tooltip">Copy model answer snippet</span>
          </button>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-950/40 via-purple-950/25 to-slate-900/50 border border-violet-800/35 text-xs sm:text-sm text-slate-200 leading-relaxed">
          <p className="italic">"{rewritten_snippet}"</p>
        </div>
      </div>

      {/* ── 5. Transcript Accordion ── */}
      <div className="border-t border-slate-800/60 pt-1">
        <button
          type="button"
          onClick={() => setShowTranscript(!showTranscript)}
          className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-300 py-2 transition-colors cursor-pointer group"
        >
          <span className="flex items-center gap-1.5">
            <MessageSquareQuote className="w-3.5 h-3.5 group-hover:text-violet-400 transition-colors" />
            <span>{showTranscript ? 'Hide Transcript' : 'View Your Spoken Transcript'}</span>
          </span>
          {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showTranscript && (
          <div className="mt-2 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 italic leading-relaxed animate-fadeSlideDown">
            "{feedback.transcript}"
          </div>
        )}
      </div>

      {/* ── 6. Actions ── */}
      <div className="flex flex-wrap items-center justify-between pt-1 gap-3">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onReRecord}
            className="btn-secondary"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-try</span>
          </button>

          {onDrillDown && (
            <button
              type="button"
              onClick={onDrillDown}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 border border-violet-800/60 text-violet-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Drill Deeper (Follow-Up)</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onNextQuestion}
          disabled={isLoadingNext}
          className={`btn-primary py-3 px-6 text-sm flex-shrink-0 ${isLastQuestion ? 'from-emerald-700 to-teal-600 hover:from-emerald-600 hover:to-teal-500' : ''}`}
        >
          {isLoadingNext ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : isLastQuestion ? (
            <>
              <Flag className="w-4 h-4" />
              <span>View Session Summary</span>
            </>
          ) : (
            <>
              <span>Next Question</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
