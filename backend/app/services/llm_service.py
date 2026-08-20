import json
import uuid
import random
from typing import List, Optional
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.prompts import (
    QUESTION_GEN_SYSTEM_PROMPT,
    build_question_gen_user_prompt,
    EVALUATION_SYSTEM_PROMPT,
    build_feedback_user_prompt,
    FALLBACK_QUESTIONS
)
from app.models.schemas import (
    TrackType,
    DifficultyLevel,
    Question,
    FeedbackResponse,
    FeedbackScoreBreakdown,
    DeliveryMetrics
)

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

        return self._get_fallback_question(track, category, level, previously_asked)

    async def evaluate_response(
        self,
        question: Question,
        transcript: str,
        duration_seconds: float,
        delivery_metrics: DeliveryMetrics
    ) -> FeedbackResponse:
        """
        Evaluates candidate spoken transcript against role rubrics and STAR criteria.
        Returns structured scores, strengths, growth areas, and rewritten exemplar snippet.
        """
        if self.client and self.api_key:
            try:
                user_prompt = build_feedback_user_prompt(
                    question=question,
                    transcript=transcript,
                    duration_seconds=duration_seconds,
                    filler_word_count=delivery_metrics.filler_word_count,
                    wpm=delivery_metrics.words_per_minute
                )

                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": EVALUATION_SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.4,
                    max_tokens=900
                )

                content = response.choices[0].message.content
                data = json.loads(content)

                return FeedbackResponse(
                    question_id=question.id,
                    transcript=transcript,
                    duration_seconds=duration_seconds,
                    scores=FeedbackScoreBreakdown(
                        overall_score=int(data.get("overall_score", 80)),
                        content_score=int(data.get("content_score", 82)),
                        clarity_score=int(data.get("clarity_score", 80)),
                        delivery_score=int(data.get("delivery_score", 78))
                    ),
                    delivery_metrics=delivery_metrics,
                    strengths=data.get("strengths", ["Addressed the core concept effectively."]),
                    improvements=data.get("improvements", ["Incorporate more explicit trade-off comparisons."]),
                    rewritten_snippet=data.get("rewritten_snippet", "In my previous project, we optimized our architecture by prioritizing granular state selectors...")
                )
            except Exception as e:
                print(f"[LLMService Warning] OpenAI response evaluation failed: {e}. Using intelligent fallback evaluator.")

        return self._generate_fallback_feedback(question, transcript, duration_seconds, delivery_metrics)

    def _generate_fallback_feedback(
        self,
        question: Question,
        transcript: str,
        duration_seconds: float,
        delivery_metrics: DeliveryMetrics
    ) -> FeedbackResponse:
        # Heuristic calculation for fallback mode
        word_count = len(transcript.split())
        is_behavioral = question.track == TrackType.BEHAVIORAL

        content_score = 84 if word_count > 40 else 72
        clarity_score = 82 if delivery_metrics.filler_word_count <= 4 else 74
        delivery_score = 86 if 120 <= delivery_metrics.words_per_minute <= 170 else 76
        overall_score = round((content_score * 0.4) + (clarity_score * 0.3) + (delivery_score * 0.3))

        if is_behavioral:
            strengths = [
                "Clearly established the business context and team objective.",
                "Demonstrated personal ownership in resolving the core challenge."
            ]
            improvements = [
                "Highlight more quantifiable metrics in the Result portion (e.g. latency drop, conversion gain).",
                f"Reduce verbal hesitation (detected {delivery_metrics.filler_word_count} filler pauses)."
            ]
            rewritten_snippet = (
                "When our team faced tight delivery deadlines with shifting API specs, I established a daily 10-minute sync "
                "with the product lead and drafted mock JSON contracts, unblocking our frontend engineers and delivering the feature 2 days ahead of schedule."
            )
        else:
            strengths = [
                "Accurately identified the core architectural tradeoffs and performance implications.",
                "Structured the response logically from problem diagnosis to implementation."
            ]
            improvements = [
                "Elaborate further on edge-case recovery and failure handling mechanisms.",
                "Frame trade-offs explicitly in terms of memory footprint and developer maintainability."
            ]
            rewritten_snippet = (
                "For high-frequency state updates, Zustand provides O(1) selector subscriptions without triggering top-level component re-renders, "
                "making it significantly more performant than React Context while avoiding the boilerplate overhead of Redux."
            )

        return FeedbackResponse(
            question_id=question.id,
            transcript=transcript,
            duration_seconds=duration_seconds,
            scores=FeedbackScoreBreakdown(
                overall_score=overall_score,
                content_score=content_score,
                clarity_score=clarity_score,
                delivery_score=delivery_score
            ),
            delivery_metrics=delivery_metrics,
            strengths=strengths,
            improvements=improvements,
            rewritten_snippet=rewritten_snippet
        )

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
            for cat_list in track_dict.values():
                category_questions.extend(cat_list)

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
