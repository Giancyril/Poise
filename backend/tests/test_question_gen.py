import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models.schemas import TrackType, DifficultyLevel

@pytest.mark.asyncio
async def test_get_tracks():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/interview/tracks")
    assert response.status_code == 200
    data = response.json()
    assert "tracks" in data
    assert "levels" in data
    assert len(data["tracks"]) >= 2
    assert len(data["levels"]) == 3

@pytest.mark.asyncio
async def test_start_session_technical():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "track": "technical",
            "category": "Frontend Engineer",
            "level": "mid",
            "total_questions": 3
        }
        response = await ac.post("/api/interview/start", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert data["total_questions"] == 3
    assert data["current_question_index"] == 1
    assert "question" in data
    assert len(data["question"]["text"]) > 10
    assert data["question"]["track"] == "technical"

@pytest.mark.asyncio
async def test_session_question_progression():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Start session
        start_payload = {
            "track": "behavioral",
            "category": "Behavioral / STAR",
            "level": "senior",
            "total_questions": 2
        }
        start_res = await ac.post("/api/interview/start", json=start_payload)
        assert start_res.status_code == 200
        session_id = start_res.json()["session_id"]
        q1_text = start_res.json()["question"]["text"]

        # 2. Next question (Question 2)
        next_res = await ac.post("/api/interview/next-question", json={"session_id": session_id})
        assert next_res.status_code == 200
        next_data = next_res.json()
        assert next_data["current_question_index"] == 2
        assert next_data["is_completed"] is False
        assert next_data["question"] is not None
        q2_text = next_data["question"]["text"]
        # Ensure questions are distinct
        assert q1_text != q2_text

        # 3. Next question (Finishes session)
        final_res = await ac.post("/api/interview/next-question", json={"session_id": session_id})
        assert final_res.status_code == 200
        final_data = final_res.json()
        assert final_data["is_completed"] is True
        assert final_data["question"] is None
