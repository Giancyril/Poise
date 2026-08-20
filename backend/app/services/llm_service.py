import json
import uuid
import random
from typing import List, Optional
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.prompts import (
    QUESTION_GEN_SYSTEM_PROMPT,
    build_question_gen_user_prompt,
    FALLBACK_QUESTIONS
)
from app.models.schemas import TrackType, DifficultyLevel, Question

class LLMService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None

    async def generate_question(
        self,
        track: TrackType,
        category: str,
        level: DifficultyLevel,
        previously_asked: List[str]
    ) -> Question:
        """
        Generate a tailored, non-repeating interview question using OpenAI GPT.
        Falls back gracefully to the curated bank if no API key is provided.
        """
        if self.client and self.api_key:
            try:
                user_prompt = build_question_gen_user_prompt(
                    track=track,
                    category=category,
                    level=level,
                    previously_asked=previously_asked
                )

                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": QUESTION_GEN_SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.7,
                    max_tokens=600
                )

                content = response.choices[0].message.content
                data = json.loads(content)
                
                return Question(
                    id=f"q_{uuid.uuid4().hex[:8]}",
                    text=data.get("text", "Could you tell me about your technical background and experience?"),
                    track=track,
                    category=category,
                    level=level,
                    hints=data.get("hints", []),
                    key_evaluation_criteria=data.get("key_evaluation_criteria", [])
                )
            except Exception as e:
                print(f"[LLMService Warning] OpenAI question generation failed: {e}. Using fallback question bank.")

        # Fallback question generation
        return self._get_fallback_question(track, category, level, previously_asked)

    def _get_fallback_question(
        self,
        track: TrackType,
        category: str,
        level: DifficultyLevel,
        previously_asked: List[str]
    ) -> Question:
        track_dict = FALLBACK_QUESTIONS.get(track, {})
        category_questions = track_dict.get(category, [])

        if not category_questions:
            # Flatten all questions in track
            for cat_list in track_dict.values():
                category_questions.extend(cat_list)

        # Filter out previously asked
        available = [
            q for q in category_questions 
            if q["text"] not in previously_asked
        ]

        if not available:
            available = category_questions or [{
                "text": f"Can you describe a challenging {category} problem you recently solved, the trade-offs you considered, and the final outcome?",
                "level": level,
                "hints": ["Focus on architecture and problem-solving process"],
                "key_evaluation_criteria": ["Clarity", "Depth of reasoning"]
            }]

        selected = random.choice(available)
        return Question(
            id=f"q_{uuid.uuid4().hex[:8]}",
            text=selected["text"],
            track=track,
            category=category,
            level=level,
            hints=selected.get("hints", []),
            key_evaluation_criteria=selected.get("key_evaluation_criteria", [])
        )

llm_service = LLMService()
