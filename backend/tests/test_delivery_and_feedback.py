import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.delivery_service import delivery_service

def test_delivery_service_heuristics():
    transcript = (
        "Well um in our previous project like we had a situation where the database was slow. "
        "Um you know actually we basically added an index on the user_id column. "
        "This reduced our query time from 400 milliseconds to 15 milliseconds."
    )
    duration_seconds = 20.0
    metrics = delivery_service.analyze_delivery(transcript, duration_seconds)

    # 1. Total words and WPM
    assert metrics.total_words > 25
    assert metrics.words_per_minute > 0

    # 2. Filler words detection
    assert metrics.filler_word_count >= 4
    filler_words_found = [f.word for f in metrics.filler_words]
    assert "um" in filler_words_found
    assert "like" in filler_words_found
    assert "actually" in filler_words_found

@pytest.mark.asyncio
async def test_submit_answer_evaluation_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Start technical session
        start_payload = {
            "track": "technical",
            "category": "Frontend Engineer",
            "level": "senior",
            "total_questions": 2
        }
        start_res = await ac.post("/api/interview/start", json=start_payload)
        session_data = start_res.json()
        session_id = session_data["session_id"]
        question_id = session_data["question"]["id"]

        # 2. Submit transcript answer
        candidate_answer = (
            "In React, state management choices depend on re-render frequency and component tree depth. "
            "We chose Zustand over Redux because it offers minimal boilerplate and atomic selector subscriptions, "
            "avoiding unnecessary re-renders in our live telemetry dashboard."
        )
        answer_form = {
            "session_id": session_id,
            "question_id": question_id,
            "duration_seconds": "35.0",
            "transcript": candidate_answer
        }
        answer_res = await ac.post("/api/interview/answer", data=answer_form)

    assert answer_res.status_code == 200
    answer_data = answer_res.json()
    assert "feedback" in answer_data
    feedback = answer_data["feedback"]

    # Verify structured feedback fields
    assert "scores" in feedback
    assert 0 <= feedback["scores"]["overall_score"] <= 100
    assert 0 <= feedback["scores"]["content_score"] <= 100
    assert 0 <= feedback["scores"]["clarity_score"] <= 100
    assert 0 <= feedback["scores"]["delivery_score"] <= 100

    assert len(feedback["strengths"]) >= 1
    assert len(feedback["improvements"]) >= 1
    assert len(feedback["rewritten_snippet"]) > 10
    assert feedback["delivery_metrics"]["words_per_minute"] > 0
