import pytest
import io
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_transcribe_audio_empty_file():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Start a session
        start_payload = {
            "track": "technical",
            "category": "Frontend Engineer",
            "level": "mid",
            "total_questions": 3
        }
        start_res = await ac.post("/api/interview/start", json=start_payload)
        session_id = start_res.json()["session_id"]
        question_id = start_res.json()["question"]["id"]

        # 2. Send empty / too short audio file (< 1000 bytes)
        fake_empty_audio = b"RIFF" + b"\x00" * 100
        files = {
            "file": ("test.webm", io.BytesIO(fake_empty_audio), "audio/webm")
        }
        data = {
            "session_id": session_id,
            "question_id": question_id,
            "duration_seconds": "1.0"
        }
        response = await ac.post("/api/interview/transcribe", files=files, data=data)

    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is False
    assert "silent" in res_data["error"].lower() or "short" in res_data["error"].lower()

@pytest.mark.asyncio
async def test_transcribe_audio_valid_mock():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        start_payload = {
            "track": "technical",
            "category": "Frontend Engineer",
            "level": "mid",
            "total_questions": 3
        }
        start_res = await ac.post("/api/interview/start", json=start_payload)
        session_id = start_res.json()["session_id"]
        question_id = start_res.json()["question"]["id"]

        # Send valid size audio byte buffer (> 1500 bytes)
        fake_audio = b"RIFF" + b"\x00" * 2000
        files = {
            "file": ("test.webm", io.BytesIO(fake_audio), "audio/webm")
        }
        data = {
            "session_id": session_id,
            "question_id": question_id,
            "duration_seconds": "30.0"
        }
        response = await ac.post("/api/interview/transcribe", files=files, data=data)

    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert len(res_data["transcript"]) > 10
    assert res_data["duration_seconds"] == 30.0
