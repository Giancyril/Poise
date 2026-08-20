import React, { useState } from 'react';
import {
  FileText,
  Building,
  Briefcase,
  Layers,
  Sparkles,
  ChevronRight,
  Loader2,
  X,
  Code,
  Users
} from 'lucide-react';
import type {
  CustomJDRequest,
  CustomJDSessionResponse,
  DifficultyLevel,
  TrackType
} from '../../types';
import { importJDAndCreateSession } from '../../services/api';

interface JDImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionCreated: (response: CustomJDSessionResponse) => void;
}

const SAMPLE_JD = `We are looking for a Senior Backend Engineer to join our Core Infrastructure team.

Key Responsibilities:
- Design, scale, and maintain high-throughput distributed microservices handling 50k+ QPS.
- Architect event-driven data pipelines utilizing Apache Kafka and RabbitMQ.
- Optimize PostgreSQL and Redis caching layers for sub-10ms p99 latency.
- Lead technical design reviews, mentor junior engineers, and drive production reliability.

Requirements:
- 5+ years building backend systems in Go, Python, or Java.
- Proven experience with Kubernetes, Docker, and AWS cloud infrastructure.
- Deep understanding of distributed transactions, concurrency, and fault tolerance.`;

export const JDImporterModal: React.FC<JDImporterModalProps> = ({
  isOpen,
  onClose,
  onSessionCreated
}) => {
  const [jobTitle, setJobTitle] = useState('Senior Backend Engineer');
  const [companyName, setCompanyName] = useState('Stripe');
  const [level, setLevel] = useState<DifficultyLevel>('senior');
  const [track, setTrack] = useState<TrackType>('technical');
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [jdText, setJdText] = useState(SAMPLE_JD);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !jdText.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload: CustomJDRequest = {
        job_title: jobTitle.trim(),
        company_name: companyName.trim() || 'Target Company',
        job_description_text: jdText.trim(),
        level,
        track,
        total_questions: totalQuestions
      };
      const response = await importJDAndCreateSession(payload);
      onSessionCreated(response);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to analyze Job Description');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl glass-panel p-6 sm:p-8 rounded-3xl border-slate-700/80 shadow-2xl space-y-5 animate-fadeSlideUp max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Custom Interview Architect</h3>
              <p className="text-xs text-slate-400">Paste any Job Description to generate a tailored interview loop</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs animate-fadeSlideDown">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Role & Company Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>Target Job Title</span>
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Distributed Systems Engineer"
                required
                className="input-field text-xs sm:text-sm py-2.5"
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Company Name</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Stripe, Netflix, Google"
                className="input-field text-xs sm:text-sm py-2.5"
              />
            </div>
          </div>

          {/* Level & Track Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Seniority Level</span>
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as DifficultyLevel)}
                className="input-field text-xs py-2.5 bg-slate-900"
              >
                <option value="junior">Junior</option>
                <option value="mid">Mid-Level</option>
                <option value="senior">Senior / Staff</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Code className="w-3.5 h-3.5 text-slate-400" />
                <span>Interview Focus</span>
              </label>
              <select
                value={track}
                onChange={(e) => setTrack(e.target.value as TrackType)}
                className="input-field text-xs py-2.5 bg-slate-900"
              >
                <option value="technical">Technical & System Design</option>
                <option value="behavioral">STAR Behavioral & Leadership</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                <span>Question Count</span>
              </label>
              <select
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Number(e.target.value))}
                className="input-field text-xs py-2.5 bg-slate-900"
              >
                <option value={3}>3 Questions (~8 min)</option>
                <option value={5}>5 Questions (~15 min)</option>
                <option value={7}>7 Questions (~20 min)</option>
              </select>
            </div>
          </div>

          {/* Job Description Text Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Paste Job Description Text</span>
              </label>
              <button
                type="button"
                onClick={() => setJdText(SAMPLE_JD)}
                className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
              >
                Insert Sample JD
              </button>
            </div>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              rows={6}
              placeholder="Paste the full job posting, tech requirements, and qualifications here..."
              required
              className="input-field text-xs font-mono leading-relaxed"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>GPT-4o extracts tech stack, architecture scope, and seniority expectations.</span>
              <span>{jdText.length} chars</span>
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !jobTitle.trim() || !jdText.trim()}
              className="btn-primary w-full py-3 text-sm flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Architecting Bespoke Interview Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Architect Interview Loop</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
