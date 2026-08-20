import uuid
from typing import Dict, Optional, List
from app.models.schemas import SessionState, Question, TrackType, DifficultyLevel, AnswerRecord, FeedbackResponse

class SessionManager:
    """
    In-memory session manager for managing practice interview sessions.
    """
    def __init__(self):
        self._sessions: Dict[str, SessionState] = {}

    def create_session(
        self,
        track: TrackType,
        category: str,
        level: DifficultyLevel,
        total_questions: int = 5
    ) -> SessionState:
        session_id = f"sess_{uuid.uuid4().hex[:12]}"
        session = SessionState(
            session_id=session_id,
            track=track,
            category=category,
            level=level,
            total_questions=total_questions,
            current_question_index=1,
            asked_questions=[],
            answers=[]
        )
        self._sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[SessionState]:
        return self._sessions.get(session_id)

    def add_question_to_session(self, session_id: str, question: Question) -> Optional[SessionState]:
        session = self.get_session(session_id)
        if not session:
            return None
        session.asked_questions.append(question)
        return session

    def record_answer(
        self,
        session_id: str,
        question_id: str,
        transcript: str,
        duration_seconds: float,
        feedback: FeedbackResponse
    ) -> Optional[AnswerRecord]:
        session = self.get_session(session_id)
        if not session:
            return None
        
        # Find question
        question = next((q for q in session.asked_questions if q.id == question_id), None)
        if not question:
            # Create placeholder if not found
            question = Question(
                id=question_id,
                text="Interview Question",
                track=session.track,
                category=session.category,
                level=session.level
            )

        record = AnswerRecord(
            question=question,
            transcript=transcript,
            duration_seconds=duration_seconds,
            feedback=feedback
        )
        session.answers.append(record)
        return record

    def advance_session(self, session_id: str) -> Optional[SessionState]:
        session = self.get_session(session_id)
        if not session:
            return None
        session.current_question_index += 1
        if session.current_question_index > session.total_questions:
            session.is_completed = True
        return session

    def get_previously_asked_texts(self, session_id: str) -> List[str]:
        session = self.get_session(session_id)
        if not session:
            return []
        return [q.text for q in session.asked_questions]

session_manager = SessionManager()
