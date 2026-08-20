from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field

class TrackType(str, Enum):
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"

class DifficultyLevel(str, Enum):
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"

class TTSVoice(str, Enum):
    ALLOY = "alloy"
    ECHO = "echo"
    FABLE = "fable"
    ONYX = "onyx"
    NOVA = "nova"
    SHIMMER = "shimmer"

class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="Text prompt to synthesize to audio")
    voice: Optional[TTSVoice] = Field(default=TTSVoice.NOVA, description="Selected OpenAI TTS voice avatar")
    speed: Optional[float] = Field(default=1.0, ge=0.5, le=2.0, description="Speech cadence speed multiplier")

class QuestionCategory(BaseModel):
    id: str
    name: str
    track: TrackType
    description: str

class Question(BaseModel):
    id: str
    text: str
    track: TrackType
    category: str
    level: DifficultyLevel
    hints: Optional[List[str]] = Field(default_factory=list)
    key_evaluation_criteria: Optional[List[str]] = Field(default_factory=list)

class FillerWordStat(BaseModel):
    word: str
    count: int

class DeliveryMetrics(BaseModel):
    words_per_minute: int
    pacing_assessment: str
    filler_word_count: int
    filler_words: List[FillerWordStat] = Field(default_factory=list)
    total_words: int
    average_words_per_sentence: float

class FeedbackScoreBreakdown(BaseModel):
    overall_score: int = Field(..., ge=0, le=100, description="Overall performance score (0-100)")
    content_score: int = Field(..., ge=0, le=100, description="Technical correctness or STAR completeness (0-100)")
    clarity_score: int = Field(..., ge=0, le=100, description="Structure, logic flow, and conciseness (0-100)")
    delivery_score: int = Field(..., ge=0, le=100, description="Pacing and vocal composure (0-100)")

class FeedbackResponse(BaseModel):
    question_id: str
    transcript: str
    duration_seconds: float
    scores: FeedbackScoreBreakdown
    delivery_metrics: DeliveryMetrics
    strengths: List[str] = Field(..., description="2-3 specific things the candidate articulated well")
    improvements: List[str] = Field(..., description="2-3 high-leverage growth areas")
    rewritten_snippet: str = Field(..., description="A concrete 2-3 sentence demonstration of how a top candidate would rephrase the weakest part")

class AnswerRecord(BaseModel):
    question: Question
    transcript: str
    duration_seconds: float
    feedback: FeedbackResponse

class SessionSummary(BaseModel):
    session_id: str
    track: TrackType
    category: str
    level: DifficultyLevel
    total_questions_answered: int
    average_overall_score: int
    average_content_score: int
    average_clarity_score: int
    average_delivery_score: int
    average_wpm: int
    total_filler_words: int
    total_duration_seconds: float
    recurring_strengths: List[str]
    recurring_growth_areas: List[str]
    recommended_focus_area: str
    question_breakdown: List[AnswerRecord] = Field(default_factory=list)

class SessionState(BaseModel):
    session_id: str
    track: TrackType
    category: str
    level: DifficultyLevel
    total_questions: int
    current_question_index: int = 1
    asked_questions: List[Question] = Field(default_factory=list)
    answers: List[AnswerRecord] = Field(default_factory=list)
    is_completed: bool = False

class StartSessionRequest(BaseModel):
    track: TrackType
    category: str
    level: DifficultyLevel
    total_questions: int = Field(default=5, ge=1, le=10)

class StartSessionResponse(BaseModel):
    session_id: str
    track: TrackType
    category: str
    level: DifficultyLevel
    total_questions: int
    current_question_index: int
    question: Question

class NextQuestionRequest(BaseModel):
    session_id: str

class NextQuestionResponse(BaseModel):
    session_id: str
    current_question_index: int
    total_questions: int
    question: Optional[Question] = None
    is_completed: bool

class TranscribeAudioResponse(BaseModel):
    session_id: str
    question_id: str
    transcript: str
    duration_seconds: float
    success: bool
    error: Optional[str] = None

class SubmitAnswerResponse(BaseModel):
    session_id: str
    question_id: str
    feedback: FeedbackResponse
    next_question: Optional[Question] = None
    is_session_complete: bool

class EndSessionRequest(BaseModel):
    session_id: str

class EndSessionResponse(BaseModel):
    summary: SessionSummary

# ── Feature 2: Real-time Speech Telemetry ─────────────────────────────────────

class PaceAssessment(str, Enum):
    TOO_SLOW = "too_slow"
    GOOD = "good"
    OPTIMAL = "optimal"
    A_BIT_FAST = "a_bit_fast"
    TOO_FAST = "too_fast"
    NO_SPEECH = "no_speech"

class SpeechTelemetrySnapshot(BaseModel):
    """Frontend submits this after each recording to persist telemetry alongside feedback."""
    session_id: str
    question_id: str
    estimated_wpm: int = Field(ge=0, le=500)
    peak_volume: float = Field(ge=0.0, le=1.0, description="Max volume observed [0, 1]")
    avg_volume: float = Field(ge=0.0, le=1.0, description="Mean volume over the recording")
    recording_duration_seconds: float = Field(ge=0.0)

class SpeechTelemetryResponse(BaseModel):
    session_id: str
    question_id: str
    estimated_wpm: int
    pace_label: PaceAssessment
    coaching_tip: str
