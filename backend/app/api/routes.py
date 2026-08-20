from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form, Response
from app.models.schemas import (
    TrackType,
    DifficultyLevel,
    StartSessionRequest,
    StartSessionResponse,
    NextQuestionRequest,
    NextQuestionResponse,
    TranscribeAudioResponse,
    SubmitAnswerResponse,
    FeedbackResponse,
    EndSessionRequest,
    EndSessionResponse,
    SessionState,
    TTSRequest,
    SpeechTelemetrySnapshot,
    SpeechTelemetryResponse,
    PaceAssessment,
    FollowUpRequest,
    FollowUpResponse,
    CustomJDRequest,
    CustomJDSessionResponse
)
from app.services.session_manager import session_manager
from app.services.llm_service import llm_service
from app.services.whisper_service import whisper_service
from app.services.delivery_service import delivery_service
from app.services.tts_service import tts_service
from app.services.follow_up_service import follow_up_service
from app.services.jd_analysis_service import jd_analysis_service

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
                    {"id": "Frontend Engineer", "name": "Frontend Engineer", "description": "React, TypeScript, Web Vitals, and state management architecture."},
                    {"id": "Backend Engineer", "name": "Backend Engineer", "description": "APIs, databases, concurrency, and distributed caching."},
                    {"id": "Fullstack Engineer", "name": "Fullstack Engineer", "description": "End-to-end architecture, API contracts, and security."},
                    {"id": "System Design", "name": "System Design", "description": "High scalability, distributed systems, and data modeling."},
                    {"id": "Data Structures & Algorithms", "name": "Data Structures & Algorithms", "description": "Time and space complexity, data structures, and algorithmic trade-offs."},
                    {"id": "DevOps & Cloud Infrastructure", "name": "DevOps & Cloud Infrastructure", "description": "CI/CD pipelines, Kubernetes, observability, and container orchestration."}
                ]
            },
            {
                "id": TrackType.BEHAVIORAL.value,
                "name": "Behavioral Interview (STAR)",
                "description": "Evaluate leadership, communication, conflict resolution, and problem-solving through the STAR method.",
                "categories": [
                    {"id": "Behavioral / STAR", "name": "Standard Behavioral (STAR)", "description": "Conflict resolution, leadership, ambiguity, and failure recovery."},
                    {"id": "Engineering Leadership", "name": "Engineering Leadership", "description": "Mentorship, cross-functional strategy, and driving team alignment."},
                    {"id": "Product & Cross-Functional", "name": "Product & Cross-Functional Collaboration", "description": "Partnering with product managers, design, and business stakeholders."},
                    {"id": "Adaptability & Growth", "name": "Adaptability & Growth", "description": "Navigating fast-moving team pivots, learning curves, and technical shifts."}
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

    # Check if there is a pre-compiled custom question from JD ingestion
    custom_q = session_manager.get_custom_question_for_index(session.session_id, session.current_question_index)
    if custom_q:
        next_question = custom_q
    else:
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

@router.post("/transcribe", response_model=TranscribeAudioResponse)
async def transcribe_audio_answer(
    file: UploadFile = File(...),
    session_id: str = Form(...),
    question_id: str = Form(...),
    duration_seconds: float = Form(0.0)
):
    """
    Receives recorded audio from browser MediaRecorder and transcribes it via Whisper API.
    """
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found"
        )

    audio_bytes = await file.read()
    transcript, error = await whisper_service.transcribe_audio(
        audio_bytes=audio_bytes,
        filename=file.filename or "recording.webm",
        duration_seconds=duration_seconds
    )

    if error:
        return TranscribeAudioResponse(
            session_id=session_id,
            question_id=question_id,
            transcript="",
            duration_seconds=duration_seconds,
            success=False,
            error=error
        )

    return TranscribeAudioResponse(
        session_id=session_id,
        question_id=question_id,
        transcript=transcript,
        duration_seconds=duration_seconds,
        success=True,
        error=None
    )

@router.post("/answer", response_model=SubmitAnswerResponse)
async def submit_and_evaluate_answer(
    file: Optional[UploadFile] = File(None),
    session_id: str = Form(...),
    question_id: str = Form(...),
    duration_seconds: float = Form(0.0),
    transcript: Optional[str] = Form(None)
):
    """
    Receives spoken audio or transcript, transcribes if needed, runs delivery heuristics,
    evaluates response with LLM rubric, and returns structured feedback.
    """
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    # 1. Obtain transcript
    final_transcript = (transcript or "").strip()
    if file is not None and not final_transcript:
        audio_bytes = await file.read()
        transcribed_text, error = await whisper_service.transcribe_audio(
            audio_bytes=audio_bytes,
            filename=file.filename or "recording.webm",
            duration_seconds=duration_seconds
        )
        if error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error
            )
        final_transcript = transcribed_text

    if not final_transcript:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty answer received. Please speak or provide a response."
        )

    # 2. Find target question
    current_q = next((q for q in session.asked_questions if q.id == question_id), None)
    if not current_q:
        current_q = session.asked_questions[-1] if session.asked_questions else None
        if not current_q:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No question found for this answer"
            )

    # 3. Delivery Analysis
    delivery_metrics = delivery_service.analyze_delivery(
        transcript=final_transcript,
        duration_seconds=duration_seconds
    )

    # 4. LLM Feedback Evaluation
    feedback = await llm_service.evaluate_response(
        question=current_q,
        transcript=final_transcript,
        duration_seconds=duration_seconds,
        delivery_metrics=delivery_metrics
    )

    # 5. Record answer in session
    session_manager.record_answer(
        session_id=session_id,
        question_id=question_id,
        transcript=final_transcript,
        duration_seconds=duration_seconds,
        feedback=feedback
    )

    is_complete = session.current_question_index >= session.total_questions

    return SubmitAnswerResponse(
        session_id=session_id,
        question_id=question_id,
        feedback=feedback,
        next_question=None,
        is_session_complete=is_complete
    )

@router.post("/end", response_model=EndSessionResponse)
async def end_interview_session(req: EndSessionRequest):
    """
    Finalizes the interview session and generates the holistic performance summary.
    """
    session = session_manager.get_session(req.session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    session.is_completed = True
    summary = await llm_service.generate_session_summary(session)

    return EndSessionResponse(summary=summary)

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

@router.post("/tts")
async def generate_speech_audio(req: TTSRequest):
    """
    Synthesizes question text to human speech audio bytes (MP3) via OpenAI TTS.
    Falls back with header metadata when operating in demo mode.
    """
    audio_bytes, content_type, err = await tts_service.generate_speech(
        text=req.text,
        voice=req.voice,
        speed=req.speed
    )
    if err or not audio_bytes:
        return Response(
            content=b"",
            status_code=status.HTTP_200_OK,
            media_type="audio/mpeg",
            headers={"X-TTS-Fallback": "browser", "X-TTS-Error": str(err or "No audio generated")}
        )
    
    return Response(
        content=audio_bytes,
        media_type=content_type,
        headers={"Content-Disposition": "inline; filename=speech.mp3"}
    )

# ── Feature 2: Real-time Speech Telemetry ────────────────────────────────────

_PACE_TIPS: dict[PaceAssessment, str] = {
    PaceAssessment.TOO_SLOW: "Pick up your pace slightly — aim for 120–150 wpm to keep interviewers engaged.",
    PaceAssessment.GOOD: "Good pace. Maintain this rhythm and vary your speed for emphasis.",
    PaceAssessment.OPTIMAL: "Excellent pacing. This range maximises comprehension and confidence.",
    PaceAssessment.A_BIT_FAST: "Slow down slightly and add deliberate pauses after key points.",
    PaceAssessment.TOO_FAST: "You're rushing — slow down, breathe, and pause between sentences.",
    PaceAssessment.NO_SPEECH: "No speech detected. Speak clearly into your microphone.",
}


def _classify_pace(wpm: int) -> PaceAssessment:
    if wpm == 0:
        return PaceAssessment.NO_SPEECH
    if wpm < 100:
        return PaceAssessment.TOO_SLOW
    if wpm < 130:
        return PaceAssessment.GOOD
    if wpm < 175:
        return PaceAssessment.OPTIMAL
    if wpm < 210:
        return PaceAssessment.A_BIT_FAST
    return PaceAssessment.TOO_FAST


@router.post("/telemetry", response_model=SpeechTelemetryResponse)
async def submit_speech_telemetry(snapshot: SpeechTelemetrySnapshot) -> SpeechTelemetryResponse:
    """
    Receives live speech telemetry (WPM, volume) from the frontend and returns
    real-time pace coaching feedback. Stateless — no data is stored server-side.
    """
    pace = _classify_pace(snapshot.estimated_wpm)
    return SpeechTelemetryResponse(
        session_id=snapshot.session_id,
        question_id=snapshot.question_id,
        estimated_wpm=snapshot.estimated_wpm,
        pace_label=pace,
        coaching_tip=_PACE_TIPS[pace]
    )

# ── Feature 3: Multi-Turn Follow-Up & Probing Engine ─────────────────────────

@router.post("/follow-up", response_model=FollowUpResponse)
async def generate_follow_up_question(req: FollowUpRequest) -> FollowUpResponse:
    """
    Dynamically generates a follow-up probing question calibrated by depth (shallow/medium/deep)
    based on the candidate's actual answer transcript.
    """
    return await follow_up_service.generate_follow_up(req)

# ── Feature 4: Custom Interview Architect & JD Ingestion ─────────────────────

@router.post("/custom-jd", response_model=CustomJDSessionResponse)
async def create_custom_jd_session(req: CustomJDRequest) -> CustomJDSessionResponse:
    """
    Ingests a raw Job Description, extracts tech stack & competencies via GPT-4o,
    compiles bespoke questions, and starts a live practice interview session.
    """
    extracted_skills, questions = await jd_analysis_service.analyze_and_generate_session(req)
    
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate tailored questions from Job Description"
        )
    
    track = req.track or TrackType.TECHNICAL
    category = f"{req.job_title} @ {req.company_name or 'Target'}"

    # Register in SessionManager so existing submit & progression routes work seamlessly
    state = session_manager.create_session(
        track=track,
        category=category,
        level=req.level,
        total_questions=req.total_questions
    )
    
    # Override session questions with JD-customized question bank
    session_manager.set_custom_questions(state.session_id, questions)
    
    first_q = questions[0]
    
    return CustomJDSessionResponse(
        session_id=state.session_id,
        job_title=req.job_title,
        company_name=req.company_name or "Target Company",
        track=track,
        category=category,
        level=req.level,
        total_questions=req.total_questions,
        current_question_index=1,
        extracted_skills=extracted_skills,
        question=first_q,
        tailored_questions=questions
    )

