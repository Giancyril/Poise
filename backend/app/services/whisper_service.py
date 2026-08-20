import io
import os
import tempfile
from typing import Optional, Tuple
from openai import AsyncOpenAI
from app.core.config import settings

class WhisperService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.WHISPER_MODEL
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        filename: str = "recording.webm",
        duration_seconds: float = 0.0
    ) -> Tuple[str, Optional[str]]:
        """
        Transcribes audio bytes via OpenAI Whisper API.
        Returns (transcript_text, error_message).
        """
        # 1. Validate audio data presence
        if not audio_bytes or len(audio_bytes) < 1000:
            return "", "Recording was too short or silent. Please speak your answer clearly."

        # 2. Check if API key configured
        if not self.client or not self.api_key:
            # Mock / Demo fallback transcription for testing when API key not configured
            mock_transcript = (
                "In my previous project, we evaluated React Context versus Zustand for state management. "
                "We noticed that React Context caused unnecessary re-renders across our dashboard widgets "
                "whenever a single metric updated. By migrating to Zustand with granular selectors, "
                "we reduced render cycles by 40% and improved our Interaction to Next Paint score."
            )
            return mock_transcript, None

        # 3. Call OpenAI Whisper API with temporary file
        temp_file_path = None
        try:
            # Determine extension
            ext = os.path.splitext(filename)[1] or ".webm"
            with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as temp_file:
                temp_file.write(audio_bytes)
                temp_file_path = temp_file.name

            with open(temp_file_path, "rb") as audio_file:
                transcript_obj = await self.client.audio.transcriptions.create(
                    model=self.model,
                    file=audio_file,
                    language="en",
                    response_format="json"
                )

            transcript_text = transcript_obj.text.strip()
            
            if not transcript_text:
                return "", "No speech was detected in the recording. Please check your microphone and try again."

            return transcript_text, None

        except Exception as e:
            print(f"[WhisperService Error]: {e}")
            return "", f"Transcription error: {str(e)}"
        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except Exception:
                    pass

whisper_service = WhisperService()
