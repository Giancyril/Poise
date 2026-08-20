import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.llm_service import llm_service
from app.services.whisper_service import whisper_service
from app.models.schemas import Question, DeliveryMetrics

@pytest.mark.asyncio
async def test_llm_service_fallback_on_openai_failure():
    """
    Test that when OpenAI API raises an exception during question generation,
    LLMService gracefully falls back to deterministic curated questions.
    """
    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(side_effect=Exception("OpenAI API Rate Limit"))
    
    with patch.object(llm_service, "client", mock_client), patch.object(llm_service, "api_key", "mock-key"):
        question = await llm_service.generate_question(
            track="technical",
            category="Frontend Engineer",
            level="senior",
            previously_asked=[]
        )
        assert question is not None
        assert len(question.text) > 10
        assert question.track == "technical"
        assert question.category == "Frontend Engineer"
        assert question.level == "senior"

@pytest.mark.asyncio
async def test_feedback_fallback_on_openai_failure():
    """
    Test that when OpenAI API raises an exception during feedback evaluation,
    LLMService produces a sensible fallback evaluation instead of crashing.
    """
    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(side_effect=Exception("OpenAI 503 Overloaded"))

    q = Question(
        id="q-test",
        text="Design a caching layer for high read throughput.",
        track="technical",
        category="System Design",
        level="senior"
    )
    dm = DeliveryMetrics(
        words_per_minute=140,
        pacing_assessment="Optimal",
        filler_word_count=0,
        filler_words=[],
        total_words=60,
        average_words_per_sentence=15.0
    )

    with patch.object(llm_service, "client", mock_client), patch.object(llm_service, "api_key", "mock-key"):
        fb = await llm_service.evaluate_response(
            question=q,
            transcript="I would use Redis with a cache-aside pattern and set appropriate TTLs.",
            duration_seconds=45.0,
            delivery_metrics=dm
        )
        assert fb is not None
        assert 0 <= fb.scores.overall_score <= 100
        assert len(fb.strengths) >= 1
        assert len(fb.improvements) >= 1
        assert len(fb.rewritten_snippet) > 10

@pytest.mark.asyncio
async def test_whisper_service_fallback_on_api_error():
    """
    Test that when Whisper API fails on real file payload, whisper_service returns an error tuple.
    """
    mock_client = MagicMock()
    mock_client.audio.transcriptions.create = AsyncMock(side_effect=Exception("Whisper service down"))

    with patch.object(whisper_service, "client", mock_client), patch.object(whisper_service, "api_key", "mock-key"):
        transcript, err = await whisper_service.transcribe_audio(
            b"0" * 2000,
            filename="test.webm",
            duration_seconds=10.0
        )
        assert transcript == ""
        assert err is not None
        assert "Whisper service down" in err or "Transcription failed" in err

@pytest.mark.asyncio
async def test_invalid_session_handling():
    """
    Test API returns 404 for nonexistent session IDs across all endpoints.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res_next = await ac.post("/api/interview/next-question", json={"session_id": "nonexistent-session-id"})
        assert res_next.status_code == 404

        res_ans = await ac.post("/api/interview/answer", data={
            "session_id": "nonexistent-session-id",
            "question_id": "q-123",
            "duration_seconds": "30",
            "transcript": "Hello world"
        })
        assert res_ans.status_code == 404

        res_end = await ac.post("/api/interview/end", json={"session_id": "nonexistent-session-id"})
        assert res_end.status_code == 404
