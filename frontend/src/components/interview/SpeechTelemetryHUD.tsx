import React from 'react';
import { Activity, Mic, AlertTriangle } from 'lucide-react';

interface SpeechTelemetryHUDProps {
  isRecording: boolean;
  volume: number;        // 0–1
  estimatedWPM: number;  // raw estimate, e.g. 0–250
  elapsedSeconds: number;
}

function wpmLabel(wpm: number): { text: string; color: string } {
  if (wpm === 0) return { text: 'Waiting…', color: 'text-slate-500' };
  if (wpm < 100) return { text: 'Too slow', color: 'text-amber-400' };
  if (wpm < 130) return { text: 'Good pace', color: 'text-emerald-400' };
  if (wpm < 175) return { text: 'Optimal', color: 'text-emerald-300' };
  if (wpm < 210) return { text: 'A bit fast', color: 'text-amber-400' };
  return { text: 'Too fast', color: 'text-red-400' };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function VolumeBar({ volume }: { volume: number }) {
  // 10 segments
  const segments = 10;
  const filled = Math.round(volume * segments);
  return (
    <div className="flex items-center gap-0.5" aria-label={`Volume ${Math.round(volume * 100)}%`}>
      {Array.from({ length: segments }).map((_, i) => {
        const active = i < filled;
        const isHigh = i >= 8;
        const isMid = i >= 6;
        return (
          <span
            key={i}
            className={`inline-block w-1.5 rounded-sm transition-all duration-75 ${
              active
                ? isHigh
                  ? 'bg-red-400 h-3'
                  : isMid
                    ? 'bg-amber-400 h-2.5'
                    : 'bg-emerald-400 h-2'
                : 'bg-slate-800 h-1.5'
            }`}
          />
        );
      })}
    </div>
  );
}

export const SpeechTelemetryHUD: React.FC<SpeechTelemetryHUDProps> = ({
  isRecording,
  volume,
  estimatedWPM,
  elapsedSeconds
}) => {
  const { text: paceText, color: paceColor } = wpmLabel(estimatedWPM);
  const isClipping = volume > 0.9;

  return (
    <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-2 px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800/70">
      {/* Left: recording indicator + timer */}
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`} />
        <span className="text-xs font-mono font-bold text-slate-200 tabular-nums">
          {formatTime(elapsedSeconds)}
        </span>
        {isRecording && (
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Recording</span>
        )}
      </div>

      {/* Center: volume meter */}
      <div className="flex items-center gap-2">
        <Mic className="w-3 h-3 text-slate-500 flex-shrink-0" />
        <VolumeBar volume={volume} />
        {isClipping && (
          <AlertTriangle className="w-3 h-3 text-red-400 animate-pulse flex-shrink-0" aria-label="Input too loud" />
        )}
      </div>

      {/* Right: WPM */}
      <div className="flex items-center gap-1.5">
        <Activity className="w-3 h-3 text-slate-500 flex-shrink-0" />
        <span className="text-xs font-mono font-bold text-slate-200 tabular-nums">
          {estimatedWPM > 0 ? `${estimatedWPM}` : '–'}
        </span>
        <span className="text-[10px] text-slate-500">wpm</span>
        <span className={`text-[10px] font-semibold ${paceColor}`}>{paceText}</span>
      </div>
    </div>
  );
};
