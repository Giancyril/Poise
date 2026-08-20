import type {
  TrackOption,
  LevelOption,
  StartSessionRequest,
  StartSessionResponse,
  NextQuestionResponse,
  TranscribeAudioResponse
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function getTracksAndCategories(): Promise<{
  tracks: TrackOption[];
  levels: LevelOption[];
}> {
  const response = await fetch(`${API_BASE}/api/interview/tracks`);
  if (!response.ok) {
    throw new Error('Failed to fetch tracks and categories');
  }
  return response.json();
}

export async function startInterviewSession(
  params: StartSessionRequest
): Promise<StartSessionResponse> {
  const response = await fetch(`${API_BASE}/api/interview/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to start interview session');
  }
  return response.json();
}

export async function getNextQuestion(
  sessionId: string
): Promise<NextQuestionResponse> {
  const response = await fetch(`${API_BASE}/api/interview/next-question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to retrieve next question');
  }
  return response.json();
}

export async function transcribeAudio(
  audioBlob: Blob,
  sessionId: string,
  questionId: string,
  durationSeconds: number
): Promise<TranscribeAudioResponse> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('session_id', sessionId);
  formData.append('question_id', questionId);
  formData.append('duration_seconds', durationSeconds.toString());

  const response = await fetch(`${API_BASE}/api/interview/transcribe`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Audio transcription request failed');
  }

  return response.json();
}
