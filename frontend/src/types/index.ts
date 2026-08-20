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
