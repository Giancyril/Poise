export type TrackType = 'technical' | 'behavioral';
export type DifficultyLevel = 'junior' | 'mid' | 'senior';

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
