import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.tts_service import tts_service
from app.models.schemas import TTSVoice

@pytest.mark.asyncio
async def test_tts_service_success_mock():
    """
    Test that TTSService returns valid audio bytes when OpenAI returns speech content.
    """
    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.content = b"ID3\x04\x00\x00\x00dummy-mp3-audio-bytes"
    mock_client.audio.speech.create = AsyncMock(return_value=mock_resp)

    with patch.object(tts_service, "client", mock_client), patch.object(tts_service, "api_key", "test-key"):
        audio_bytes, content_type, err = await tts_service.generate_speech(
            text="Can you explain how the JavaScript event loop works?",
            voice=TTSVoice.NOVA,
            speed=1.0
        )

        assert err is None
        assert content_type == "audio/mpeg"
        assert len(audio_bytes) > 0
        assert b"dummy-mp3" in audio_bytes

@pytest.mark.asyncio
async def test_tts_service_empty_text():
    """
    Test TTSService handles empty input gracefully.
    """
    audio_bytes, content_type, err = await tts_service.generate_speech(text="   ")
    assert err is not None
    assert audio_bytes == b""

@pytest.mark.asyncio
async def test_tts_endpoint_fallback():
    """
    Test /api/interview/tts returns a fallback header when no key is set or generation fails.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        with patch.object(tts_service, "client", None):
            res = await ac.post("/api/interview/tts", json={
                "text": "What are React Server Components?",
                "voice": "nova",
                "speed": 1.0
            })

            assert res.status_code == 200
            assert "X-TTS-Fallback" in res.headers
            assert res.headers["X-TTS-Fallback"] == "browser"

@pytest.mark.asyncio
async def test_tts_endpoint_success_stream():
    """
    Test /api/interview/tts streams audio bytes when speech generation succeeds.
    """
    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.content = b"fake-audio-mp3-stream"
    mock_client.audio.speech.create = AsyncMock(return_value=mock_resp)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        with patch.object(tts_service, "client", mock_client), patch.object(tts_service, "api_key", "mock-key"):
            res = await ac.post("/api/interview/tts", json={
                "text": "Describe the CAP theorem.",
                "voice": "alloy",
                "speed": 1.0
            })

            assert res.status_code == 200
            assert res.headers["content-type"] == "audio/mpeg"
            assert res.content == b"fake-audio-mp3-stream"
