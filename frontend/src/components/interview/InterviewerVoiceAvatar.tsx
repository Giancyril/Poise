import React from 'react';
import { Play, Pause, RotateCcw, Sparkles, Loader2 } from 'lucide-react';

interface InterviewerVoiceAvatarProps {
  isPlaying: boolean;
  isLoading: boolean;
  isFallback: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReplay: () => void;
  personaName?: string;
}

export const InterviewerVoiceAvatar: React.FC<InterviewerVoiceAvatarProps> = ({
  isPlaying,
  isLoading,
  isFallback,
  onPlay,
  onPause,
  onReplay,
  personaName = 'AI Interviewer'
}) => {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-inner">
      <div className="flex items-center space-x-3.5">
        {/* Avatar Ring */}
        <div className="relative flex items-center justify-center">
          {isPlaying && (
            <>
              <div className="absolute w-12 h-12 rounded-full bg-violet-500/20 animate-ping pointer-events-none" style={{ animationDuration: '1.4s' }} />
              <div className="absolute w-10 h-10 rounded-full border border-violet-500/40 animate-pulse pointer-events-none" />
            </>
          )}

          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            isPlaying
              ? 'bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-md shadow-violet-500/30'
              : 'bg-slate-800 border border-slate-700/60 text-slate-300'
          }`}>
            <Sparkles className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
          </div>
        </div>

        {/* Identity & Speech Status */}
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-200">{personaName}</span>
            {isPlaying && (
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-violet-950/80 border border-violet-800/50 text-[10px] font-semibold text-violet-300 animate-fadeIn">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                <span>Speaking</span>
              </span>
            )}
            {isFallback && !isPlaying && (
              <span className="text-[10px] text-slate-500">Browser Audio</span>
            )}
          </div>

          {/* Dynamic Waveform when AI speaks */}
          {isPlaying ? (
            <div className="flex items-center space-x-1 h-3 pt-0.5">
              {[40, 90, 60, 100, 75, 45, 85].map((h, idx) => (
                <span
                  key={idx}
                  className="w-1 rounded-full bg-gradient-to-t from-violet-500 to-indigo-400 animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDuration: `${0.3 + (idx % 3) * 0.2}s`
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 leading-none">
              Click to hear the question spoken out loud
            </p>
          )}
        </div>
      </div>

      {/* Play / Pause / Replay Controls */}
      <div className="flex items-center space-x-1.5">
        {isLoading ? (
          <div className="p-2 rounded-lg bg-slate-800 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
          </div>
        ) : isPlaying ? (
          <button
            type="button"
            onClick={onPause}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            title="Pause Voice"
          >
            <Pause className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onPlay}
            className="inline-flex items-center space-x-1.5 py-1.5 px-3 rounded-lg bg-violet-600/90 hover:bg-violet-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Read Question Aloud"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Read Aloud</span>
          </button>
        )}

        <button
          type="button"
          onClick={onReplay}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          title="Replay from Beginning"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
