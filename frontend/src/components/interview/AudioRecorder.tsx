import React from 'react';
import {
  Mic,
  Square,
  RefreshCw,
  AlertCircle,
  Volume2,
  Sparkles
} from 'lucide-react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, durationSeconds: number) => void;
  isTranscribing: boolean;
  transcriptionError: string | null;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  isTranscribing,
  transcriptionError
}) => {
  const {
    state, recordingTime, audioLevels, volume,
    errorMessage, startRecording, stopRecording,
    resetRecording, isPermissionDenied
  } = useAudioRecorder();

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleStop = async () => {
    const blob = await stopRecording();
    if (blob) onRecordingComplete(blob, recordingTime);
  };

  const isBusy = state === 'processing' || isTranscribing;

  return (
    <div className={`glass-panel p-8 rounded-3xl text-center space-y-7 relative overflow-hidden border-slate-800/80 shadow-xl transition-all duration-500 ${
      state === 'recording' ? 'border-red-900/40' : ''
    }`}>
      {/* Recording ambient glow */}
      {state === 'recording' && (
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/10 to-transparent pointer-events-none animate-pulse-slow" />
      )}

      {/* Header */}
      <div className="space-y-1.5 relative">
        <h4 className="text-base font-bold text-slate-200">
          {state === 'recording'
            ? '🔴 Recording your answer...'
            : isBusy
            ? 'Transcribing via Whisper AI...'
            : 'Speak Your Answer Out Loud'}
        </h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          {state === 'recording'
            ? 'Take your time. Speak clearly and structure your thoughts.'
            : isBusy
            ? 'OpenAI Whisper is transcribing your audio with high accuracy.'
            : 'Aim for 60–120 seconds. Focus on STAR structure or clear trade-offs.'}
        </p>
      </div>

      {/* Error state */}
      {(errorMessage || transcriptionError) && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-start gap-3 text-left animate-fadeSlideDown">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            <p className="font-bold text-red-200">
              {isPermissionDenied ? 'Microphone Permission Required' : 'Audio Error'}
            </p>
            <p>{errorMessage || transcriptionError}</p>
          </div>
          <button type="button" onClick={resetRecording} className="text-red-400 hover:text-red-200 font-semibold cursor-pointer text-xs underline flex-shrink-0">
            Dismiss
          </button>
        </div>
      )}

      {/* Center Controls */}
      <div className="flex flex-col items-center gap-6 py-2">
        {/* Timer */}
        {state === 'recording' && (
          <div className="flex items-center gap-2 bg-slate-950/80 border border-red-500/30 px-5 py-2 rounded-full animate-fadeIn">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="font-mono text-sm font-bold text-red-400 tracking-wider">
              {formatTime(recordingTime)}
            </span>
          </div>
        )}

        {/* Waveform */}
        {state === 'recording' && (
          <div className="flex items-center justify-center gap-1.5 h-14 w-56">
            {audioLevels.map((lvl, i) => (
              <div
                key={i}
                className="w-2 rounded-full bg-gradient-to-t from-red-500 via-rose-400 to-violet-400 transition-all duration-75"
                style={{
                  height: `${Math.max(8, lvl)}%`,
                  opacity: Math.max(0.25, (volume || 0) / 100)
                }}
              />
            ))}
          </div>
        )}

        {/* Spinner while processing */}
        {isBusy && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-20 h-20 rounded-full bg-slate-900/80 border border-violet-500/40 flex items-center justify-center shadow-lg animate-pulse-glow">
              <div className="w-9 h-9 border-3 border-violet-500/25 border-t-violet-400 rounded-full animate-spin" />
            </div>
            <span className="text-xs text-violet-400 animate-pulse flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Transcribing & evaluating...
            </span>
          </div>
        )}

        {/* Mic button — idle */}
        {!isBusy && state === 'idle' && (
          <div className="relative flex items-center justify-center py-2">
            <div className="absolute w-24 h-24 rounded-full bg-violet-600/5 border border-violet-500/10 animate-pulse" />
            <button
              type="button"
              onClick={startRecording}
              className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 text-white flex items-center justify-center shadow-xl shadow-violet-600/30 hover:shadow-violet-600/50 transform hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer group animate-pulse-glow"
              title="Start Recording"
            >
              <Mic className="w-8 h-8 group-hover:scale-110 transition-transform duration-150" />
            </button>
          </div>
        )}

        {/* Stop button — recording */}
        {!isBusy && state === 'recording' && (
          <div className="relative flex items-center justify-center py-2">
            <div className="absolute w-28 h-28 rounded-full bg-red-500/10 animate-ping pointer-events-none" style={{ animationDuration: '1.6s' }} />
            <div className="absolute w-24 h-24 rounded-full border border-red-500/30 animate-pulse pointer-events-none" />
            <button
              type="button"
              onClick={handleStop}
              className="recording-glow relative w-20 h-20 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white flex items-center justify-center shadow-xl shadow-red-600/40 transform hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
              title="Stop & Submit"
            >
              <Square className="w-7 h-7 fill-white" />
            </button>
          </div>
        )}

        {/* Helper text */}
        {!isBusy && (
          <div className="text-xs">
            {state === 'idle' && (
              <span className="text-slate-400 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-violet-400" />
                Click the microphone to begin
              </span>
            )}
            {state === 'recording' && (
              <span className="text-red-400 font-semibold flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                Click the square when finished
              </span>
            )}
          </div>
        )}
      </div>

      {/* Cancel button during recording */}
      {state === 'recording' && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={resetRecording}
            className="btn-secondary text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Cancel & Restart
          </button>
        </div>
      )}
    </div>
  );
};
