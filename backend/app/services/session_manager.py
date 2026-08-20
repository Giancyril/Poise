import uuid
from typing import Dict, Optional, List
from app.models.schemas import SessionState, Question, TrackType, DifficultyLevel

class SessionManager:
    """
    In-memory session manager for managing practice interview sessions.
    Designed with a clean interface so it can be swapped with Redis / SQLite / Postgres in v2.
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
            asked_questions=[]
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
