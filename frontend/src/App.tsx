import React, { useState, useEffect } from 'react';
import { Mic, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import type {
  StartSessionRequest,
  StartSessionResponse,
  Question
} from './types';
import { startInterviewSession, getNextQuestion, transcribeAudio } from './services/api';
import { TrackSelector } from './components/setup/TrackSelector';
import { QuestionDisplay } from './components/interview/QuestionDisplay';

type AppStep = 'setup' | 'interview' | 'complete';

export const App: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [currentStep, setCurrentStep] = useState<AppStep>('setup');
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  // Active Session State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Health check on load
  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then((res) => res.json())
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));
  }, []);

  const handleStartSession = async (config: StartSessionRequest) => {
    setIsStartingSession(true);
    setErrorMessage(null);
    try {
      const response: StartSessionResponse = await startInterviewSession(config);
      setSessionId(response.session_id);
      setCurrentQuestion(response.question);
      setCurrentIndex(response.current_question_index);
      setTotalQuestions(response.total_questions);
      setCurrentStep('interview');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start interview session');
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleAudioSubmitted = async (audioBlob: Blob, durationSeconds: number): Promise<string | null> => {
    if (!sessionId || !currentQuestion) return null;
    setIsTranscribing(true);
    setTranscriptionError(null);
    try {
      const result = await transcribeAudio(
        audioBlob,
        sessionId,
        currentQuestion.id,
        durationSeconds
      );
      if (!result.success || result.error) {
        setTranscriptionError(result.error || 'Transcription was empty or unclear.');
        return null;
      }
      return result.transcript;
    } catch (err: any) {
      setTranscriptionError(err.message || 'Failed to transcribe audio.');
      return null;
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!sessionId) return;
    setIsLoadingNext(true);
    setErrorMessage(null);
    setTranscriptionError(null);
    try {
      const response = await getNextQuestion(sessionId);
      if (response.is_completed || !response.question) {
        setCurrentStep('complete');
      } else {
        setCurrentQuestion(response.question);
        setCurrentIndex(response.current_question_index);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch next question');
    } finally {
      setIsLoadingNext(false);
    }
  };

  const handleResetSession = () => {
    setSessionId(null);
    setCurrentQuestion(null);
    setCurrentIndex(1);
    setTranscriptionError(null);
    setCurrentStep('setup');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Navigation */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={handleResetSession}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              AI Mock Interview Coach
            </h1>
            <p className="text-xs text-slate-400">Intelligent Voice & STAR Interview Practice</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 hidden sm:inline">Backend API:</span>
          {backendStatus === 'online' && (
            <span className="flex items-center text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
              Connected
            </span>
          )}
          {backendStatus === 'offline' && (
            <span className="flex items-center text-amber-400 bg-amber-950/60 border border-amber-800/50 px-2.5 py-1 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 mr-1.5" />
              Offline
            </span>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto my-auto py-8">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-white font-bold ml-2 cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        {currentStep === 'setup' && (
          <TrackSelector
            onStartSession={handleStartSession}
            isLoading={isStartingSession}
          />
        )}

        {currentStep === 'interview' && currentQuestion && (
          <QuestionDisplay
            question={currentQuestion}
            currentIndex={currentIndex}
            totalQuestions={totalQuestions}
            onNextQuestion={handleNextQuestion}
            onEndSession={handleResetSession}
            onAudioSubmitted={handleAudioSubmitted}
            isTranscribing={isTranscribing}
            transcriptionError={transcriptionError}
            isLoadingNext={isLoadingNext}
          />
        )}

        {currentStep === 'complete' && (
          <div className="max-w-xl mx-auto glass-panel p-8 rounded-3xl text-center space-y-6 animate-fadeIn border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Interview Session Completed!</h2>
              <p className="text-sm text-slate-400 mt-2">
                You completed practicing with voice audio across all {totalQuestions} questions.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 text-left space-y-2">
              <div className="font-semibold text-violet-400 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next up in Stage 4:</span>
              </div>
              <p className="text-slate-400">
                Detailed structured feedback (scores, strengths, improvements, rewritten snippet) + delivery analytics (filler words, WPM).
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetSession}
              className="py-3 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold flex items-center justify-center space-x-2 mx-auto transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Practice Another Track</span>
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto py-4 border-t border-slate-900 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>AI Mock Interview Coach &copy; 2026</span>
        <span className="text-violet-400/80">Stage 3: Whisper Voice Pipeline Active</span>
      </footer>
    </div>
  );
};

export default App;
