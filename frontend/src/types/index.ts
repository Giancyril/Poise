export type TrackType = 'technical' | 'behavioral';
export type DifficultyLevel = 'junior' | 'mid' | 'senior';
export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export interface TTSRequest {
  text: string;
  voice?: TTSVoice;
  speed?: number;
}

export interface QuestionCategory {
  id: string;
  name: string;
  description: string;
}

export interface TrackOption {
  id: TrackType;
  name: string;
  description: string;
  categories: QuestionCategory[];
}

export interface LevelOption {
  id: DifficultyLevel;
  name: string;
  description: string;
}

export interface Question {
  id: string;
  text: string;
  track: TrackType;
  category: string;
  level: DifficultyLevel;
  hints?: string[];
  key_evaluation_criteria?: string[];
}

export interface FillerWordStat {
  word: string;
  count: number;
}

export interface DeliveryMetrics {
  words_per_minute: number;
  pacing_assessment: string;
  filler_word_count: number;
  filler_words: FillerWordStat[];
  total_words: number;
  average_words_per_sentence: number;
}

export interface FeedbackScoreBreakdown {
  overall_score: number;
  content_score: number;
  clarity_score: number;
  delivery_score: number;
}

export interface FeedbackResponse {
  question_id: string;
  transcript: string;
  duration_seconds: number;
  scores: FeedbackScoreBreakdown;
  delivery_metrics: DeliveryMetrics;
  strengths: string[];
  improvements: string[];
  rewritten_snippet: string;
}

export interface AnswerRecord {
  question: Question;
  transcript: string;
  duration_seconds: number;
  feedback: FeedbackResponse;
}

export interface SessionSummary {
  session_id: string;
  track: TrackType;
  category: string;
  level: DifficultyLevel;
  total_questions_answered: number;
  average_overall_score: number;
  average_content_score: number;
  average_clarity_score: number;
  average_delivery_score: number;
  average_wpm: number;
  total_filler_words: number;
  total_duration_seconds: number;
  recurring_strengths: string[];
  recurring_growth_areas: string[];
  recommended_focus_area: string;
  question_breakdown: AnswerRecord[];
}

export interface StartSessionRequest {
  track: TrackType;
  category: string;
  level: DifficultyLevel;
  total_questions: number;
}

export interface StartSessionResponse {
  session_id: string;
  track: TrackType;
  category: string;
  level: DifficultyLevel;
  total_questions: number;
  current_question_index: number;
  question: Question;
}

export interface NextQuestionResponse {
  session_id: string;
  current_question_index: number;
  total_questions: number;
  question: Question | null;
  is_completed: boolean;
}

export interface TranscribeAudioResponse {
  session_id: string;
  question_id: string;
  transcript: string;
  duration_seconds: number;
  success: boolean;
  error?: string | null;
}

export interface SubmitAnswerResponse {
  session_id: string;
  question_id: string;
  feedback: FeedbackResponse;
  next_question: Question | null;
  is_session_complete: boolean;
}

export interface EndSessionResponse {
  summary: SessionSummary;
}

// ── Feature 2: Speech Telemetry ───────────────────────────────────────────────

export type PaceAssessment =
  | 'too_slow'
  | 'good'
  | 'optimal'
  | 'a_bit_fast'
  | 'too_fast'
  | 'no_speech';

export interface SpeechTelemetrySnapshot {
  session_id: string;
  question_id: string;
  estimated_wpm: number;
  peak_volume: number;
  avg_volume: number;
  recording_duration_seconds: number;
}

export interface SpeechTelemetryResponse {
  session_id: string;
  question_id: string;
  estimated_wpm: number;
  pace_label: PaceAssessment;
  coaching_tip: string;
}

// ── Feature 3: Multi-Turn Follow-Up & Probing Engine ─────────────────────────

export type FollowUpDepth = 'shallow' | 'medium' | 'deep';

export interface FollowUpRequest {
  session_id: string;
  question_id: string;
  transcript: string;
  depth?: FollowUpDepth;
  track: TrackType;
  category: string;
  level: DifficultyLevel;
}

export interface FollowUpResponse {
  session_id: string;
  parent_question_id: string;
  follow_up_id: string;
  follow_up_question: string;
  depth: FollowUpDepth;
  rationale: string;
  suggested_answer_direction: string;
}

// ── Feature 4: Custom Interview Architect & JD Ingestion ─────────────────────

export interface CustomJDRequest {
  job_title: string;
  company_name?: string;
  job_description_text: string;
  level: DifficultyLevel;
  track?: TrackType;
  total_questions?: number;
}

export interface ExtractedJDSkills {
  primary_technologies: string[];
  architectural_domains: string[];
  behavioral_competencies: string[];
  seniority_signals: string[];
}

export interface CustomJDSessionResponse {
  session_id: string;
  job_title: string;
  company_name: string;
  track: TrackType;
  category: string;
  level: DifficultyLevel;
  total_questions: number;
  current_question_index: number;
  extracted_skills: ExtractedJDSkills;
  question: Question;
  tailored_questions: Question[];
}
