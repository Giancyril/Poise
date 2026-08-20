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

class StartSessionRequest(BaseModel):
    track: TrackType = Field(default=TrackType.TECHNICAL, description="Technical or Behavioral track")
    category: str = Field(default="Frontend Engineer", description="Target role or topic (e.g. Frontend Engineer, System Design, Behavioral/STAR)")
    level: DifficultyLevel = Field(default=DifficultyLevel.MID, description="Seniority level (junior, mid, senior)")
    total_questions: int = Field(default=5, ge=1, le=10, description="Total questions for this session")

class SessionState(BaseModel):
    session_id: str
    track: TrackType
    category: str
    level: DifficultyLevel
    total_questions: int
    current_question_index: int = 1
    asked_questions: List[Question] = Field(default_factory=list)
    is_completed: bool = False

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
