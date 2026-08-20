import React, { useState } from 'react';
import {
  Trophy,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Target,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Gauge,
  Volume2,
  Clock,
  MessageSquareQuote,
  Award,
  BarChart3
} from 'lucide-react';
import type { SessionSummary } from '../../types';

interface SessionSummaryViewProps {
  summary: SessionSummary;
  onPracticeAgain: () => void;
}

export const SessionSummaryView: React.FC<SessionSummaryViewProps> = ({
  summary,
  onPracticeAgain
}) => {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const {
    total_questions_answered,
    average_overall_score,
    average_content_score,
    average_clarity_score,
    average_delivery_score,
    average_wpm,
    total_filler_words,
    total_duration_seconds,
    recurring_strengths,
    recurring_growth_areas,
    recommended_focus_area,
    question_breakdown,
    track,
    category,
    level
  } = summary;

  const getScoreEmoji = (score: number) => {
    if (score >= 88) return '🏆';
    if (score >= 76) return '⭐';
    if (score >= 65) return '📈';
    return '💪';
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-violet-300';
    return 'text-amber-300';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-emerald-950/50 border-emerald-700/40';
    if (score >= 70) return 'bg-violet-950/50 border-violet-700/40';
    return 'bg-amber-950/50 border-amber-700/40';
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const encouragementHeadline = average_overall_score >= 85
    ? 'Exceptional Practice Session!'
    : average_overall_score >= 70
    ? 'Strong Practice Session!'
    : 'Good Practice Session — Keep Going!';

  return (
    <div className="max-w-3xl w-full mx-auto space-y-8 animate-fadeIn pb-8">
      {/* 1. Hero Header — Post-Workout Summary Style */}
      <div className="glass-panel p-8 rounded-3xl text-center relative overflow-hidden border-slate-800/80">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Celebration badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-violet-600/25 text-2xl">
          {getScoreEmoji(average_overall_score)}
        </div>

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-950/70 border border-violet-800/40 text-violet-300 text-xs font-medium mb-3">
          <Trophy className="w-3.5 h-3.5 text-violet-400" />
          <span>{total_questions_answered} Questions Completed</span>
        </div>

        <h2 className="text-3xl font-extrabold text-white tracking-tight mb-1">
          {encouragementHeadline}
        </h2>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          {category} · {level.charAt(0).toUpperCase() + level.slice(1)} Level ·{' '}
          {track === 'technical' ? 'Technical Track' : 'Behavioral STAR Track'}
        </p>
      </div>

      {/* 2. Score Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Overall', score: average_overall_score, icon: Award },
          { label: 'Content', score: average_content_score, icon: BarChart3 },
          { label: 'Clarity', score: average_clarity_score, icon: MessageSquareQuote },
          { label: 'Delivery', score: average_delivery_score, icon: Volume2 }
        ].map(({ label, score, icon: Icon }) => (
          <div
            key={label}
            className={`p-4 rounded-2xl border text-center space-y-2 ${getScoreBg(score)}`}
          >
            <Icon className={`w-5 h-5 mx-auto ${getScoreColor(score)}`} />
            <div className={`text-3xl font-extrabold ${getScoreColor(score)}`}>{score}</div>
            <div className="text-xs text-slate-400 font-medium">{label}</div>
            <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  score >= 85 ? 'bg-emerald-400' : score >= 70 ? 'bg-violet-400' : 'bg-amber-400'
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Vocal Delivery Stats Row */}
      <div className="glass-panel p-5 rounded-2xl border-slate-800/80">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Session Vocal Delivery Stats
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-1">
            <Gauge className="w-5 h-5 text-violet-400 mx-auto" />
            <div className="text-xl font-bold text-white">{average_wpm}</div>
            <div className="text-xs text-slate-400">Avg WPM</div>
            <div className="text-[10px] text-slate-500">
              {average_wpm >= 130 && average_wpm <= 165 ? 'Optimal pace' : average_wpm < 130 ? 'Slightly slow' : 'Slightly fast'}
            </div>
          </div>
          <div className="text-center space-y-1">
            <Volume2 className="w-5 h-5 text-amber-400 mx-auto" />
            <div className="text-xl font-bold text-white">{total_filler_words}</div>
            <div className="text-xs text-slate-400">Total Fillers</div>
            <div className="text-[10px] text-slate-500">
              {total_filler_words <= 5 ? 'Excellent' : total_filler_words <= 15 ? 'Moderate' : 'Needs improvement'}
            </div>
          </div>
          <div className="text-center space-y-1">
            <Clock className="w-5 h-5 text-indigo-400 mx-auto" />
            <div className="text-xl font-bold text-white">{formatDuration(total_duration_seconds)}</div>
            <div className="text-xs text-slate-400">Total Practice</div>
            <div className="text-[10px] text-slate-500">{total_questions_answered} answers</div>
          </div>
        </div>
      </div>

      {/* 4. Recurring Patterns — 2-col grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Strengths */}
        <div className="glass-panel p-5 rounded-2xl border-emerald-900/30 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Recurring Strengths</span>
          </div>
          <div className="space-y-2">
            {recurring_strengths.map((str, i) => (
              <div key={i} className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-900/30 text-xs text-slate-200 flex items-start space-x-2.5 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                <span>{str}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Areas */}
        <div className="glass-panel p-5 rounded-2xl border-amber-900/30 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <TrendingUp className="w-4 h-4" />
            <span>Growth Opportunities</span>
          </div>
          <div className="space-y-2">
            {recurring_growth_areas.map((area, i) => (
              <div key={i} className="p-3 rounded-xl bg-amber-950/25 border border-amber-900/30 text-xs text-slate-200 flex items-start space-x-2.5 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <span>{area}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Recommended Focus Goal */}
      <div className="glass-panel p-6 rounded-2xl border-violet-900/40 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-violet-400">
          <Target className="w-4 h-4" />
          <span>Your Focus Goal for Next Practice Round</span>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-r from-violet-950/50 via-indigo-950/30 to-slate-900/50 border border-violet-800/30 text-sm text-slate-200 leading-relaxed">
          <Sparkles className="w-4 h-4 text-violet-400 inline mr-2 mb-0.5" />
          {recommended_focus_area}
        </div>
      </div>

      {/* 6. Per-Question Breakdown Accordion */}
      {question_breakdown.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl border-slate-800/80 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Question-by-Question Breakdown
          </h3>
          <div className="space-y-2">
            {question_breakdown.map((record, idx) => (
              <div key={idx} className="border border-slate-800/80 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedQuestion(expandedQuestion === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-900/60 hover:bg-slate-900/90 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className={`text-sm font-bold flex-shrink-0 ${getScoreColor(record.feedback.scores.overall_score)}`}>
                      {record.feedback.scores.overall_score}
                    </span>
                    <span className="text-xs text-slate-300 truncate">{record.question.text}</span>
                  </div>
                  {expandedQuestion === idx
                    ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  }
                </button>

                {expandedQuestion === idx && (
                  <div className="p-4 border-t border-slate-800/60 space-y-3 bg-slate-950/50 text-xs">
                    <p className="text-slate-400 italic">"{record.transcript}"</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <span className="text-slate-500">Content</span>
                        <div className="font-bold text-slate-200">{record.feedback.scores.content_score}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Clarity</span>
                        <div className="font-bold text-slate-200">{record.feedback.scores.clarity_score}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Delivery</span>
                        <div className="font-bold text-slate-200">{record.feedback.scores.delivery_score}</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {record.feedback.strengths.map((s, i) => (
                        <div key={i} className="flex items-start space-x-1.5 text-emerald-300/90">
                          <span className="text-emerald-400 mt-0.5">✓</span>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. CTA */}
      <div className="text-center space-y-3 pt-2">
        <button
          type="button"
          onClick={onPracticeAgain}
          className="inline-flex items-center space-x-2.5 py-4 px-8 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-violet-600/25 transition-all transform hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Practice Another Session</span>
        </button>
        <p className="text-xs text-slate-500">
          Each session builds on the last. Consistent practice is the fastest path to interview confidence.
        </p>
      </div>
    </div>
  );
};
