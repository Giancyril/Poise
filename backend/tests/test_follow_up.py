"""
Tests for Feature 3: Dynamic Multi-Turn Follow-Up & Probing Engine
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.models.schemas import FollowUpRequest, FollowUpDepth, TrackType, DifficultyLevel
from app.services.follow_up_service import follow_up_service

client = TestClient(app)

FOLLOW_UP_URL = "/api/interview/follow-up"

SAMPLE_PAYLOAD = {
    "session_id": "sess-test-123",
    "question_id": "q-design-cache",
    "transcript": "In my previous project, we used Redis for caching session data and TTL eviction to prevent memory bloat.",
    "depth": "shallow",
    "track": "technical",
    "category": "Backend Engineer",
    "level": "mid"
}

def test_follow_up_endpoint_shallow():
    resp = client.post(FOLLOW_UP_URL, json=SAMPLE_PAYLOAD)
    assert resp.status_code == 200
    data = resp.json()
    assert data["session_id"] == "sess-test-123"
    assert data["parent_question_id"] == "q-design-cache"
    assert data["depth"] == "shallow"
    assert len(data["follow_up_question"]) > 10
    assert len(data["suggested_answer_direction"]) > 10

def test_follow_up_endpoint_medium_depth():
    payload = {**SAMPLE_PAYLOAD, "depth": "medium"}
    resp = client.post(FOLLOW_UP_URL, json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["depth"] == "medium"
    assert len(data["follow_up_question"]) > 10

def test_follow_up_endpoint_deep_depth():
    payload = {**SAMPLE_PAYLOAD, "depth": "deep"}
    resp = client.post(FOLLOW_UP_URL, json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["depth"] == "deep"
    assert len(data["follow_up_question"]) > 10

def test_follow_up_fallback_generation():
    req = FollowUpRequest(
        session_id="sess-fallback",
        question_id="q-beh-01",
        transcript="I had a conflict with a designer on the navigation redesign.",
        depth=FollowUpDepth.SHALLOW,
        track=TrackType.BEHAVIORAL,
        category="Behavioral / STAR",
        level=DifficultyLevel.MID
    )
    res = follow_up_service._fallback_generate(req, FollowUpDepth.SHALLOW)
    assert res.session_id == "sess-fallback"
    assert "example" in res.follow_up_question.lower() or "experience" in res.follow_up_question.lower()
    assert len(res.suggested_answer_direction) > 10

@pytest.mark.asyncio
async def test_follow_up_llm_mock_success():
    req = FollowUpRequest(
        session_id="sess-llm",
        question_id="q-sys-01",
        transcript="We deployed a Kafka queue to buffer writes.",
        depth=FollowUpDepth.MEDIUM,
        track=TrackType.TECHNICAL,
        category="System Design",
        level=DifficultyLevel.SENIOR
    )
    
    mock_choice = MagicMock()
    mock_choice.message.content = '{"follow_up_question": "How did you handle consumer lag in Kafka?", "rationale": "Testing Kafka operational readiness.", "suggested_answer_direction": "Mention Kafka auto-scaling consumer groups and Prometheus alerts."}'
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]

    with patch.object(follow_up_service, "_client") as mock_client:
        if mock_client is None:
            mock_client = MagicMock()
            follow_up_service._client = mock_client
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        result = await follow_up_service.generate_follow_up(req)
        assert result.follow_up_question == "How did you handle consumer lag in Kafka?"
        assert result.depth == FollowUpDepth.MEDIUM
        assert "Kafka" in result.suggested_answer_direction
