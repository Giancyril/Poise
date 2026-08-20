import React, { useState, useEffect } from 'react';
import { Sparkles, Mic, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then((res) => res.json())
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6">
      {/* Header */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              AI Mock Interview Coach
            </h1>
            <p className="text-xs text-slate-400">Intelligent Voice Interview Practice</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Backend API:</span>
          {backendStatus === 'online' && (
            <span className="flex items-center text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
              Connected
            </span>
          )}
          {backendStatus === 'offline' && (
            <span className="flex items-center text-amber-400 bg-amber-950/60 border border-amber-800/50 px-2.5 py-1 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 mr-1.5" />
              Offline (Port 8000)
            </span>
          )}
          {backendStatus === 'checking' && (
            <span className="text-slate-500">Checking...</span>
          )}
        </div>
      </header>

      {/* Main Hero Card */}
      <main className="max-w-3xl w-full mx-auto my-auto py-12 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-brand-950/80 border border-brand-800/50 text-brand-300 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Stage 1: System Scaffolding & Architecture Verified</span>
        </div>

        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
          Master your next interview with <br />
          <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
            real-time AI voice feedback
          </span>
        </h2>

        <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto mb-8">
          Practice speaking answers to technical and behavioral questions out loud. Get instant, constructive coaching on substance, STAR structure, and speaking cadence.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
          <div className="glass-panel p-4 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-brand-400 mb-2" />
            <h3 className="font-semibold text-sm text-slate-200">Whisper Voice Pipeline</h3>
            <p className="text-xs text-slate-400 mt-1">High-accuracy browser audio capture and transcription.</p>
          </div>

          <div className="glass-panel p-4 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-brand-400 mb-2" />
            <h3 className="font-semibold text-sm text-slate-200">Tailored Rubric Feedback</h3>
            <p className="text-xs text-slate-400 mt-1">Structured strengths, weaknesses, and model answers.</p>
          </div>

          <div className="glass-panel p-4 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-brand-400 mb-2" />
            <h3 className="font-semibold text-sm text-slate-200">Delivery Analytics</h3>
            <p className="text-xs text-slate-400 mt-1">Filler word count, WPM pacing, and conciseness score.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto py-4 border-t border-slate-900 text-center text-xs text-slate-500">
        AI Mock Interview Coach &copy; 2026 &bull; Ready for Stage 2 Question Generation
      </footer>
    </div>
  );
};

export default App;
