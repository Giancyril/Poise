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
    state,
    recordingTime,
    audioLevels,
    volume,
    errorMessage,
    startRecording,
    stopRecording,
    resetRecording,
    isPermissionDenied
  } = useAudioRecorder();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = async () => {
    const blob = await stopRecording();
    if (blob) {
      onRecordingComplete(blob, recordingTime);
    }
  };

  const isBusy = state === 'processing' || isTranscribing;

  return (
    <div className="glass-panel p-8 rounded-3xl text-center space-y-6 relative overflow-hidden border-slate-800/80 shadow-xl">
      {/* Background radial glow when recording */}
      {state === 'recording' && (
        <div className="absolute inset-0 bg-red-600/5 backdrop-blur-3xl animate-pulse-slow pointer-events-none" />
      )}

      {/* 1. Header & Instructions */}
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-slate-200">
          {state === 'recording'
            ? 'Recording your spoken answer...'
            : isBusy
            ? 'Transcribing and processing speech...'
            : 'Speak Your Answer Out Loud'}
        </h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          {state === 'recording'
            ? 'Take your time, speak clearly, and structure your thoughts.'
            : isBusy
            ? 'OpenAI Whisper is transcribing your spoken audio in high accuracy.'
            : 'Aim for 1 to 2 minutes. Focus on clear points, trade-offs, or STAR structure.'}
        </p>
      </div>

      {/* 2. Error States */}
      {(errorMessage || transcriptionError) && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start space-x-3 text-left animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <p className="font-semibold text-red-200">
              {isPermissionDenied ? 'Microphone Permission Required' : 'Audio Note'}
            </p>
            <p className="text-red-300/90">{errorMessage || transcriptionError}</p>
          </div>
          <button
            type="button"
            onClick={resetRecording}
            className="text-xs text-red-400 hover:text-red-200 underline font-medium cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Center Visualizer & Record Button */}
      <div className="flex flex-col items-center justify-center space-y-6 py-4">
        {/* Timer Display when recording */}
        {state === 'recording' && (
          <div className="flex items-center space-x-2 bg-slate-900/90 border border-red-500/30 px-4 py-1.5 rounded-full shadow-inner animate-fadeIn">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping mr-1" />
            <span className="font-mono text-sm font-bold text-red-400 tracking-wider">
              {formatTime(recordingTime)}
            </span>
          </div>
        )}

        {/* Dynamic Waveform Visualizer */}
        {state === 'recording' && (
          <div className="flex items-center justify-center space-x-1.5 h-12 w-48">
            {audioLevels.map((lvl, index) => (
              <div
                key={index}
                className="w-2 bg-gradient-to-t from-red-500 to-violet-400 rounded-full transition-all duration-75"
                style={{
                  height: `${lvl}%`,
                  opacity: Math.max(0.3, volume / 100)
                }}
              />
            ))}
          </div>
        )}

        {/* Central Glowing Mic Button */}
        <div className="relative flex items-center justify-center">
          {/* Animated Ripple Rings when recording */}
          {state === 'recording' && (
            <>
              <div className="absolute w-24 h-24 rounded-full bg-red-500/20 animate-ping pointer-events-none" />
              <div className="absolute w-28 h-28 rounded-full border border-red-500/40 animate-pulse pointer-events-none" />
            </>
          )}

          {state === 'idle' && (
            <button
              type="button"
              onClick={startRecording}
              disabled={isBusy}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white flex items-center justify-center shadow-xl shadow-violet-600/30 hover:shadow-violet-600/50 transform hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group"
              title="Start Recording"
            >
              <Mic className="w-8 h-8 group-hover:scale-110 transition-transform" />
            </button>
          )}

          {state === 'recording' && (
            <button
              type="button"
              onClick={handleStop}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white flex items-center justify-center shadow-xl shadow-red-600/40 transform hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
              title="Stop & Submit Answer"
            >
              <Square className="w-7 h-7 fill-white" />
            </button>
          )}

          {isBusy && (
            <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-violet-500/50 flex items-center justify-center shadow-lg">
              <div className="w-8 h-8 border-3 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Interactive Helper Text Under Button */}
        <div className="text-xs text-slate-400">
          {state === 'idle' && (
            <span className="text-slate-400 font-medium flex items-center justify-center space-x-1.5">
              <Mic className="w-3.5 h-3.5 text-violet-400" />
              <span>Click microphone to begin recording</span>
            </span>
          )}
          {state === 'recording' && (
            <span className="text-red-400 font-medium flex items-center justify-center space-x-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Click square when you are finished speaking</span>
            </span>
          )}
          {isBusy && (
            <span className="text-violet-400 font-medium flex items-center justify-center space-x-1.5 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Transcribing your speech via Whisper...</span>
            </span>
          )}
        </div>
      </div>

      {/* 4. Controls / Re-record button */}
      {state === 'recording' && (
        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={resetRecording}
            className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Cancel & Restart Recording</span>
          </button>
        </div>
      )}
    </div>
  );
};
