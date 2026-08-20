import React, { useState, useEffect } from 'react';
import {
  Code,
  Users,
  ChevronRight,
  Layers,
  BarChart2,
  Briefcase,
  Loader2
} from 'lucide-react';
import type {
  TrackType,
  DifficultyLevel,
  TrackOption,
  LevelOption,
  StartSessionRequest
} from '../../types';
import { getTracksAndCategories } from '../../services/api';

interface TrackSelectorProps {
  onStartSession: (config: StartSessionRequest) => void;
  isLoading: boolean;
}

const FALLBACK_TRACKS: TrackOption[] = [
  {
    id: 'technical',
    name: 'Technical Interview',
    description: 'Architecture, trade-offs, debugging, and system design.',
    categories: [
      { id: 'Frontend Engineer', name: 'Frontend Engineer', description: 'React, TypeScript, Web Vitals, and state management architecture.' },
      { id: 'Backend Engineer', name: 'Backend Engineer', description: 'APIs, databases, concurrency, and distributed caching.' },
      { id: 'Fullstack Engineer', name: 'Fullstack Engineer', description: 'End-to-end architecture, API contracts, and security.' },
      { id: 'System Design', name: 'System Design', description: 'High scalability, distributed systems, and data modeling.' },
      { id: 'Data Structures & Algorithms', name: 'Data Structures & Algorithms', description: 'Time and space complexity, data structures, and algorithmic trade-offs.' },
      { id: 'DevOps & Cloud Infrastructure', name: 'DevOps & Cloud Infrastructure', description: 'CI/CD pipelines, Kubernetes, observability, and container orchestration.' }
    ]
  },
  {
    id: 'behavioral',
    name: 'Behavioral Interview (STAR)',
    description: 'Leadership, communication, conflict, and impact.',
    categories: [
      { id: 'Behavioral / STAR', name: 'Standard Behavioral (STAR)', description: 'Conflict resolution, leadership, ambiguity, and failure recovery.' },
      { id: 'Engineering Leadership', name: 'Engineering Leadership', description: 'Mentorship, cross-functional strategy, and driving team alignment.' },
      { id: 'Product & Cross-Functional', name: 'Product & Cross-Functional Collaboration', description: 'Partnering with product managers, design, and business stakeholders.' },
      { id: 'Adaptability & Growth', name: 'Adaptability & Growth', description: 'Navigating fast-moving team pivots, learning curves, and technical shifts.' }
    ]
  }
];

const FALLBACK_LEVELS: LevelOption[] = [
  { id: 'junior', name: 'Junior', description: 'Foundational concepts & practical execution' },
  { id: 'mid', name: 'Mid-Level', description: 'Trade-offs, edge cases & real-world experience' },
  { id: 'senior', name: 'Senior / Staff', description: 'Architecture, ambiguity & strategic impact' }
];

const QUESTION_COUNTS = [3, 5, 7, 10];

export const TrackSelector: React.FC<TrackSelectorProps> = ({ onStartSession, isLoading }) => {
  const [tracks, setTracks] = useState<TrackOption[]>([]);
  const [levels, setLevels] = useState<LevelOption[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<TrackType>('technical');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel>('mid');
  const [totalQuestions, setTotalQuestions] = useState<number>(5);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoadingTracks, setIsLoadingTracks] = useState(true);

  useEffect(() => {
    setIsLoadingTracks(true);
    getTracksAndCategories()
      .then((data) => {
        setTracks(data.tracks);
        setLevels(data.levels);
        const tech = data.tracks.find(t => t.id === 'technical');
        if (tech?.categories.length) setSelectedCategory(tech.categories[0].id);
      })
      .catch(() => {
        setFetchError('Using default tracks — backend offline.');
        setTracks(FALLBACK_TRACKS);
        setLevels(FALLBACK_LEVELS);
        setSelectedCategory(FALLBACK_TRACKS[0].categories[0].id);
      })
      .finally(() => setIsLoadingTracks(false));
  }, []);

  const activeTrack = tracks.find(t => t.id === selectedTrack) || tracks[0];

  const handleTrackChange = (trackId: TrackType) => {
    setSelectedTrack(trackId);
    const t = tracks.find(t => t.id === trackId);
    if (t?.categories.length) setSelectedCategory(t.categories[0].id);
  };

  const handleStart = () => {
    onStartSession({ track: selectedTrack, category: selectedCategory, level: selectedLevel, total_questions: totalQuestions });
  };

  return (
    <div className="max-w-3xl w-full mx-auto space-y-6 animate-fadeSlideUp relative z-10">
      {/* ── Hero Heading & Trust Chip ── */}
      <div className="text-center space-y-3 pb-1">
        {/* Prominent Trust & Credibility Badge */}


        <h2 className="text-3xl sm:text-4xl font-extrabold gradient-text">
          Configure Your Session
        </h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
          Select a practice track, your specialization, and seniority calibration then speak your answers out loud for real-time AI feedback.
        </p>
      </div>

      {fetchError && (
        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300/90 text-xs text-center">
          {fetchError}
        </div>
      )}

      {/* ── 1. Track Selector Cards (Primary Choice) ── */}
      <div className="grid grid-cols-2 gap-4">
        {(['technical', 'behavioral'] as TrackType[]).map((trackId) => {
          const isActive = selectedTrack === trackId;
          const Icon = trackId === 'technical' ? Code : Users;
          const label = trackId === 'technical' ? 'Technical Track' : 'Behavioral (STAR)';
          const sub = trackId === 'technical' ? 'Architecture, code design & systems' : 'STAR method, leadership & impact';
          return (
            <button
              key={trackId}
              type="button"
              onClick={() => handleTrackChange(trackId)}
              className={`p-5 rounded-2xl text-left border transition-all duration-200 cursor-pointer group card-lift ${isActive
                ? 'bg-violet-950/40 border-violet-500/70 shadow-sm ring-1 ring-violet-500/30'
                : 'glass-panel-interactive border-slate-800/80 opacity-75 hover:opacity-100'
                }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2.5 rounded-xl transition-colors ${isActive ? 'bg-violet-600 text-white shadow-xs' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                  }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className={`font-bold text-sm ${isActive ? 'text-white' : 'text-slate-300'}`}>{label}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{sub}</p>
                </div>
              </div>
              {isActive && (
                <div className="mt-3 h-0.5 w-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400 opacity-60" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── 2. Category / Role Selection (Primary Grid) ── */}
      <div className="glass-panel p-5 rounded-2xl space-y-4 animate-fadeSlideUp stagger-2">
        <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
          <span>Select Role / Specialization</span>
        </label>

        {isLoadingTracks ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeTrack?.categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-3.5 rounded-xl text-left border text-sm transition-all duration-150 cursor-pointer group ${isSelected
                    ? 'bg-slate-800/95 border-violet-500/60 text-white shadow-xs ring-1 ring-violet-500/20'
                    : 'bg-slate-900/50 border-slate-800/70 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                >
                  <div className={`font-semibold text-sm leading-tight ${isSelected ? 'text-white' : 'text-slate-200'}`}>{cat.name}</div>
                  <div className="text-xs text-slate-400 mt-1 leading-snug">{cat.description}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 3. Seniority Level & Question Count (Secondary Segmented Controls) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeSlideUp stagger-3">
        {/* Seniority */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Seniority Level</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(levels.length > 0 ? levels : FALLBACK_LEVELS).map((lvl) => {
              const isSelected = selectedLevel === lvl.id;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setSelectedLevel(lvl.id as DifficultyLevel)}
                  className={`py-2 px-2 rounded-lg text-xs transition-colors cursor-pointer ${isSelected
                    ? 'bg-violet-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-900/60 border border-slate-800/80 text-slate-400 font-medium hover:text-slate-200 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                >
                  {lvl.name}
                </button>
              );
            })}
          </div>
          {levels.length > 0 && (
            <p className="text-[11px] text-slate-500 leading-snug">
              {levels.find(l => l.id === selectedLevel)?.description}
            </p>
          )}
        </div>

        {/* Question count */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Session Length</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {QUESTION_COUNTS.map((num) => {
              const isSelected = totalQuestions === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => setTotalQuestions(num)}
                  className={`py-2 rounded-lg text-xs transition-colors cursor-pointer ${isSelected
                    ? 'bg-violet-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-900/60 border border-slate-800/80 text-slate-400 font-medium hover:text-slate-200 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                >
                  {num} Questions
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500">
            {totalQuestions <= 3 ? 'Quick warm-up (~5 min)' : totalQuestions <= 5 ? 'Standard session (~12 min)' : totalQuestions <= 7 ? 'Deep practice (~18 min)' : 'Full simulation (~25 min)'}
          </p>
        </div>
      </div>

      {/* ── 4. CTA ── */}
      <div className="pt-1 animate-fadeSlideUp stagger-4">
        <button
          type="button"
          onClick={handleStart}
          disabled={isLoading || !selectedCategory}
          className="btn-primary w-full py-3.5 text-base"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating Tailored Questions...</span>
            </>
          ) : (
            <>
              <span>Begin Practice Interview</span>
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
