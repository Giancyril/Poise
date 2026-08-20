from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import (
    TrackType,
    DifficultyLevel,
    StartSessionRequest,
    StartSessionResponse,
    NextQuestionRequest,
    NextQuestionResponse,
    SessionState
)
from app.services.session_manager import session_manager
from app.services.llm_service import llm_service

router = APIRouter(prefix="/api/interview", tags=["Interview"])

@router.get("/tracks")
async def get_tracks_and_categories() -> Dict[str, Any]:
    """
    Returns available tracks, categories, and difficulty levels for candidate onboarding.
    """
    return {
        "tracks": [
            {
                "id": TrackType.TECHNICAL.value,
                "name": "Technical Interview",
                "description": "Deep-dive technical questions covering architecture, debugging, tradeoffs, and system design.",
                "categories": [
                    {"id": "Frontend Engineer", "name": "Frontend Engineer", "description": "React, TypeScript, Web Vitals, browser architecture, state management."},
                    {"id": "Backend Engineer", "name": "Backend Engineer", "description": "APIs, databases, concurrency, distributed systems, caching."},
                    {"id": "Fullstack Engineer", "name": "Fullstack Engineer", "description": "End-to-end web architecture, data flow, API contracts, security."},
                    {"id": "System Design", "name": "System Design", "description": "High scalability, distributed rate limiters, caching strategies, microservices."},
                    {"id": "Data Structures & Algorithms", "name": "Data Structures & Algorithms", "description": "Conceptual time/space complexity, algorithmic tradeoffs, tree/graph traversal."}
                ]
            },
            {
                "id": TrackType.BEHAVIORAL.value,
                "name": "Behavioral Interview (STAR)",
                "description": "Evaluate leadership, communication, conflict resolution, and problem-solving through the STAR method.",
                "categories": [
                    {"id": "Behavioral / STAR", "name": "Standard Behavioral (STAR)", "description": "Conflict, leadership, dealing with ambiguity, overcoming failures."},
                    {"id": "Engineering Leadership", "name": "Engineering Leadership", "description": "Mentorship, cross-functional collaboration, technical strategy, driving alignment."},
                    {"id": "Product & Cross-Functional", "name": "Product & Cross-Functional Collaboration", "description": "Working with PMs, designers, handling trade-offs against business deadlines."}
                ]
            }
        ],
        "levels": [
            {"id": DifficultyLevel.JUNIOR.value, "name": "Junior", "description": "Foundational concepts & practical execution"},
            {"id": DifficultyLevel.MID.value, "name": "Mid-Level", "description": "Trade-offs, edge cases & real-world experience"},
            {"id": DifficultyLevel.SENIOR.value, "name": "Senior / Staff", "description": "Architecture, ambiguity, scalability & strategic impact"}
        ]
    }

@router.post("/start", response_model=StartSessionResponse)
async def start_interview_session(req: StartSessionRequest):
    """
    Initializes a new interview session and generates Question 1.
    """
    session = session_manager.create_session(
        track=req.track,
        category=req.category,
        level=req.level,
        total_questions=req.total_questions
    )

    first_question = await llm_service.generate_question(
        track=session.track,
        category=session.category,
        level=session.level,
        previously_asked=[]
    )

    session_manager.add_question_to_session(session.session_id, first_question)

    return StartSessionResponse(
        session_id=session.session_id,
        track=session.track,
        category=session.category,
        level=session.level,
        total_questions=session.total_questions,
        current_question_index=1,
        question=first_question
    )

@router.post("/next-question", response_model=NextQuestionResponse)
async def get_next_question(req: NextQuestionRequest):
    """
    Advances to the next question in the session, ensuring no duplicate questions.
    """
    session = session_manager.get_session(req.session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    session_manager.advance_session(session.session_id)

    if session.is_completed:
        return NextQuestionResponse(
            session_id=session.session_id,
            current_question_index=session.current_question_index,
            total_questions=session.total_questions,
            question=None,
            is_completed=True
        )

    previously_asked = session_manager.get_previously_asked_texts(session.session_id)
    next_question = await llm_service.generate_question(
        track=session.track,
        category=session.category,
        level=session.level,
        previously_asked=previously_asked
    )

    session_manager.add_question_to_session(session.session_id, next_question)

    return NextQuestionResponse(
        session_id=session.session_id,
        current_question_index=session.current_question_index,
        total_questions=session.total_questions,
        question=next_question,
        is_completed=False
    )

@router.get("/session/{session_id}", response_model=SessionState)
async def get_session_state(session_id: str):
    """
    Fetches the current status and question history of an active session.
    """
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    return session
