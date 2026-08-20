import React, { useState, useEffect } from 'react';
import {
  Code,
  Users,
  Briefcase,
  ChevronRight,
  Sparkles,
  Layers,
  BarChart2
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

export const TrackSelector: React.FC<TrackSelectorProps> = ({
  onStartSession,
  isLoading
}) => {
  const [tracks, setTracks] = useState<TrackOption[]>([]);
  const [levels, setLevels] = useState<LevelOption[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<TrackType>('technical');
  const [selectedCategory, setSelectedCategory] = useState<string>('Frontend Engineer');
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel>('mid');
  const [totalQuestions, setTotalQuestions] = useState<number>(5);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    getTracksAndCategories()
      .then((data) => {
        setTracks(data.tracks);
        setLevels(data.levels);
        const techTrack = data.tracks.find(t => t.id === 'technical');
        if (techTrack && techTrack.categories.length > 0) {
          setSelectedCategory(techTrack.categories[0].id);
        }
      })
      .catch(() => {
        setFetchError('Could not load tracks from server. Using standard defaults.');
        setTracks([
          {
            id: 'technical',
            name: 'Technical Interview',
            description: 'Architecture, trade-offs, debugging, and system design.',
            categories: [
              { id: 'Frontend Engineer', name: 'Frontend Engineer', description: 'React, TypeScript, Web Vitals, state management.' },
              { id: 'Backend Engineer', name: 'Backend Engineer', description: 'APIs, databases, concurrency, caching.' },
              { id: 'System Design', name: 'System Design', description: 'Scalability, microservices, data modeling.' }
            ]
          },
          {
            id: 'behavioral',
            name: 'Behavioral Interview (STAR)',
            description: 'Leadership, communication, conflict, and impact.',
            categories: [
              { id: 'Behavioral / STAR', name: 'Standard Behavioral (STAR)', description: 'Conflict, leadership, ambiguity, failure & learning.' },
              { id: 'Engineering Leadership', name: 'Engineering Leadership', description: 'Mentorship, cross-functional collaboration, strategy.' }
            ]
          }
        ]);
        setLevels([
          { id: 'junior', name: 'Junior', description: 'Foundational concepts & practical execution' },
          { id: 'mid', name: 'Mid-Level', description: 'Trade-offs, edge cases & real-world experience' },
          { id: 'senior', name: 'Senior / Staff', description: 'Architecture, ambiguity & strategic impact' }
        ]);
      });
  }, []);

  const activeTrackObj = tracks.find(t => t.id === selectedTrack) || tracks[0];

  const handleTrackChange = (trackId: TrackType) => {
    setSelectedTrack(trackId);
    const trackObj = tracks.find(t => t.id === trackId);
    if (trackObj && trackObj.categories.length > 0) {
      setSelectedCategory(trackObj.categories[0].id);
    }
  };

  const handleStart = () => {
    onStartSession({
      track: selectedTrack,
      category: selectedCategory,
      level: selectedLevel,
      total_questions: totalQuestions
    });
  };

  return (
    <div className="max-w-3xl w-full mx-auto space-y-8 animate-fadeIn">
      {/* Intro Heading */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-950/80 border border-violet-800/40 text-violet-300 text-xs font-medium mb-1">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Interactive AI Practice Session</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Configure Your Mock Interview
        </h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Choose your practice track, target focus area, and seniority calibration.
        </p>
      </div>

      {fetchError && (
        <div className="bg-amber-950/40 border border-amber-800/40 text-amber-300 text-xs p-3 rounded-lg text-center">
          {fetchError}
        </div>
      )}

      {/* 1. Track Type Switcher */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => handleTrackChange('technical')}
          className={`p-5 rounded-2xl text-left border transition-all duration-200 cursor-pointer ${
            selectedTrack === 'technical'
              ? 'bg-violet-950/40 border-violet-500/80 shadow-lg shadow-violet-950/50 ring-1 ring-violet-500/50'
              : 'glass-panel-interactive border-slate-800/80 opacity-70 hover:opacity-100'
          }`}
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className={`p-2 rounded-xl ${selectedTrack === 'technical' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">Technical Track</h3>
              <p className="text-xs text-slate-400">Architecture, code design & systems</p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleTrackChange('behavioral')}
          className={`p-5 rounded-2xl text-left border transition-all duration-200 cursor-pointer ${
            selectedTrack === 'behavioral'
              ? 'bg-violet-950/40 border-violet-500/80 shadow-lg shadow-violet-950/50 ring-1 ring-violet-500/50'
              : 'glass-panel-interactive border-slate-800/80 opacity-70 hover:opacity-100'
          }`}
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className={`p-2 rounded-xl ${selectedTrack === 'behavioral' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">Behavioral Track</h3>
              <p className="text-xs text-slate-400">STAR method, leadership & collaboration</p>
            </div>
          </div>
        </button>
      </div>

      {/* 2. Category / Role Selection */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
          <Briefcase className="w-4 h-4 text-violet-400" />
          <span>Select Role / Specialization</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activeTrackObj?.categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`p-3.5 rounded-xl text-left border text-sm transition-all duration-150 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-800 border-violet-500/80 text-white shadow-md'
                  : 'bg-slate-900/60 border-slate-800/70 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="font-medium text-slate-100">{cat.name}</div>
              <div className="text-xs text-slate-400 mt-1 line-clamp-1">{cat.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Seniority Level & Question Count */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-panel p-5 rounded-2xl space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-violet-400" />
            <span>Seniority Calibration</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(levels.length > 0 ? levels : [
              { id: 'junior', name: 'Junior', description: '' },
              { id: 'mid', name: 'Mid', description: '' },
              { id: 'senior', name: 'Senior', description: '' }
            ]).map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setSelectedLevel(lvl.id as DifficultyLevel)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedLevel === lvl.id
                    ? 'bg-violet-600 text-white shadow'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl.name}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-violet-400" />
            <span>Questions in Session</span>
          </label>
          <div className="flex items-center space-x-3">
            {[3, 5, 7].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setTotalQuestions(num)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  totalQuestions === num
                    ? 'bg-violet-600 text-white shadow'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {num} Questions
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Action Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleStart}
          disabled={isLoading}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-violet-600/25 flex items-center justify-center space-x-2 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generating Tailored Interview Question...</span>
            </div>
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
