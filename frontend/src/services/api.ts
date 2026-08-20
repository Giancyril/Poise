import type {
  TrackOption,
  LevelOption,
  StartSessionRequest,
  StartSessionResponse,
  NextQuestionResponse,
  TranscribeAudioResponse,
  SubmitAnswerResponse,
  EndSessionResponse,
  SpeechTelemetrySnapshot,
  SpeechTelemetryResponse,
  FollowUpRequest,
  FollowUpResponse
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function getTracksAndCategories(): Promise<{
  tracks: TrackOption[];
  levels: LevelOption[];
}> {
  const response = await fetch(`${API_BASE}/api/interview/tracks`);
  if (!response.ok) throw new Error('Failed to fetch tracks and categories');
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
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to start interview session');
  }
  return response.json();
}

export async function getNextQuestion(sessionId: string): Promise<NextQuestionResponse> {
  const response = await fetch(`${API_BASE}/api/interview/next-question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to retrieve next question');
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
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Audio transcription request failed');
  }
  return response.json();
}

export async function submitAndEvaluateAnswer(params: {
  audioBlob?: Blob | null;
  transcript?: string | null;
  sessionId: string;
  questionId: string;
  durationSeconds: number;
}): Promise<SubmitAnswerResponse> {
  const formData = new FormData();
  formData.append('session_id', params.sessionId);
  formData.append('question_id', params.questionId);
  formData.append('duration_seconds', params.durationSeconds.toString());
  if (params.audioBlob) formData.append('file', params.audioBlob, 'recording.webm');
  if (params.transcript) formData.append('transcript', params.transcript);

  const response = await fetch(`${API_BASE}/api/interview/answer`, {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to evaluate answer');
  }
  return response.json();
}

export async function endInterviewSession(sessionId: string): Promise<EndSessionResponse> {
  const response = await fetch(`${API_BASE}/api/interview/end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to generate session summary');
  }
  return response.json();
}

export async function synthesizeSpeechAudio(
  text: string,
  voice: string = 'nova',
  speed: number = 1.0
): Promise<{ audioBlob: Blob | null; fallbackToBrowser: boolean }> {
  try {
    const response = await fetch(`${API_BASE}/api/interview/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, speed })
    });

    if (!response.ok) {
      return { audioBlob: null, fallbackToBrowser: true };
    }

    if (response.headers.get('X-TTS-Fallback') === 'browser') {
      return { audioBlob: null, fallbackToBrowser: true };
    }

    const blob = await response.blob();
    if (blob.size < 100) {
      return { audioBlob: null, fallbackToBrowser: true };
    }

    return { audioBlob: blob, fallbackToBrowser: false };
  } catch {
    return { audioBlob: null, fallbackToBrowser: true };
  }
}

// ── Feature 2: Speech Telemetry ───────────────────────────────────────────────

export async function submitSpeechTelemetry(
  snapshot: SpeechTelemetrySnapshot
): Promise<SpeechTelemetryResponse | null> {
  try {
    const response = await fetch(`${API_BASE}/api/interview/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot)
    });
    if (!response.ok) return null;
    return response.json() as Promise<SpeechTelemetryResponse>;
  } catch {
    return null;
  }
}

// ── Feature 3: Multi-Turn Follow-Up & Probing Engine ─────────────────────────

export async function requestFollowUpQuestion(
  req: FollowUpRequest
): Promise<FollowUpResponse> {
  const response = await fetch(`${API_BASE}/api/interview/follow-up`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
  if (!response.ok) {
    throw new Error('Failed to generate follow-up question');
  }
  return response.json();
}
