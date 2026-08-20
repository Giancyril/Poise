import React, { useState, useEffect } from 'react';
import { Mic, Sparkles, Loader2 } from 'lucide-react';
import type {
  StartSessionRequest,
  StartSessionResponse,
  Question,
  FeedbackResponse,
  SessionSummary
} from './types';
import {
  startInterviewSession,
  getNextQuestion,
  submitAndEvaluateAnswer,
  endInterviewSession
} from './services/api';
import { TrackSelector } from './components/setup/TrackSelector';
import { QuestionDisplay } from './components/interview/QuestionDisplay';
import { SessionSummaryView } from './components/summary/SessionSummaryView';

type AppStep = 'setup' | 'interview' | 'summarizing' | 'summary';

export const App: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [currentStep, setCurrentStep] = useState<AppStep>('setup');
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then(res => res.json())
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

  const handleAnswerSubmitted = async (params: {
    audioBlob?: Blob | null;
    transcript?: string | null;
    durationSeconds: number;
  }): Promise<FeedbackResponse | null> => {
    if (!sessionId || !currentQuestion) return null;
    setIsEvaluating(true);
    setEvaluationError(null);
    try {
      const result = await submitAndEvaluateAnswer({
        audioBlob: params.audioBlob,
        transcript: params.transcript,
        sessionId,
        questionId: currentQuestion.id,
        durationSeconds: params.durationSeconds
      });
      return result.feedback;
    } catch (err: any) {
      setEvaluationError(err.message || 'Failed to evaluate answer.');
      return null;
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!sessionId) return;
    setIsLoadingNext(true);
    setErrorMessage(null);
    setEvaluationError(null);

    try {
      const response = await getNextQuestion(sessionId);
      if (response.is_completed || !response.question) {
        // Session complete — fetch summary
        await handleEndSession();
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

  const handleEndSession = async () => {
    if (!sessionId) return;
    setCurrentStep('summarizing');
    try {
      const result = await endInterviewSession(sessionId);
      setSummary(result.summary);
      setCurrentStep('summary');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate session summary');
      setCurrentStep('interview');
    }
  };

  const handleResetSession = () => {
    setSessionId(null);
    setCurrentQuestion(null);
    setCurrentIndex(1);
    setSummary(null);
    setEvaluationError(null);
    setErrorMessage(null);
    setCurrentStep('setup');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6">
      {/* Header */}
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

      {/* Main */}
      <main className="max-w-4xl w-full mx-auto my-auto py-8">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white font-bold ml-2 cursor-pointer">&times;</button>
          </div>
        )}

        {currentStep === 'setup' && (
          <TrackSelector onStartSession={handleStartSession} isLoading={isStartingSession} />
        )}

        {currentStep === 'interview' && currentQuestion && (
          <QuestionDisplay
            question={currentQuestion}
            currentIndex={currentIndex}
            totalQuestions={totalQuestions}
            onNextQuestion={handleNextQuestion}
            onEndSession={handleResetSession}
            onAnswerSubmitted={handleAnswerSubmitted}
            isEvaluating={isEvaluating}
            evaluationError={evaluationError}
            isLoadingNext={isLoadingNext}
          />
        )}

        {currentStep === 'summarizing' && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-violet-950/60 border border-violet-800/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white">Generating Your Performance Summary...</h3>
              <p className="text-sm text-slate-400">
                AI coach is analyzing patterns across all {totalQuestions} of your answers.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs text-violet-400 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Synthesizing strengths, growth areas, and your personalized focus goal</span>
            </div>
          </div>
        )}

        {currentStep === 'summary' && summary && (
          <SessionSummaryView
            summary={summary}
            onPracticeAgain={handleResetSession}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto py-4 border-t border-slate-900 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>AI Mock Interview Coach &copy; 2026</span>
        <span className="text-violet-400/80">Stage 5: Session Flow & Summary Active</span>
      </footer>
    </div>
  );
};

export default App;
