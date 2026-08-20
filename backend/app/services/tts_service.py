import io
from typing import Tuple, Optional
from openai import AsyncOpenAI
from app.core.config import settings
from app.models.schemas import TTSVoice

class TTSService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None

    async def generate_speech(
        self,
        text: str,
        voice: TTSVoice = TTSVoice.NOVA,
        speed: float = 1.0
    ) -> Tuple[bytes, str, Optional[str]]:
        """
        Synthesizes text to speech using OpenAI audio API (tts-1).
        Returns (audio_bytes, content_type, error_message).
        """
        if not text or not text.strip():
            return b"", "audio/mpeg", "Empty text provided for speech synthesis."

        if not self.client or not self.api_key:
            # Fallback when no OpenAI API key is configured
            return b"", "audio/mpeg", "OpenAI API key not configured for server-side TTS. Use browser speech synthesis fallback."

        try:
            response = await self.client.audio.speech.create(
                model="tts-1",
                voice=voice.value if hasattr(voice, "value") else str(voice),
                input=text.strip(),
                speed=speed,
                response_format="mp3"
            )
            audio_bytes = response.content
            return audio_bytes, "audio/mpeg", None
        except Exception as e:
            return b"", "audio/mpeg", f"OpenAI TTS synthesis error: {str(e)}"

tts_service = TTSService()
