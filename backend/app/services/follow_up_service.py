"""
FollowUpService — Feature 3: Dynamic Multi-Turn Follow-Up & Probing Engine

Generates a contextually-aware follow-up/probing question based on the
candidate's previous answer. Uses GPT-4o with a dedicated system prompt
tuned for real interviewer behaviour.
"""
import uuid
import json
from typing import Optional
from app.models.schemas import (
    FollowUpRequest,
    FollowUpResponse,
    FollowUpDepth,
    TrackType
)
from app.core.config import settings

try:
    from openai import AsyncOpenAI
    _openai_available = True
except ImportError:
    _openai_available = False


_DEPTH_INSTRUCTIONS: dict[FollowUpDepth, str] = {
    FollowUpDepth.SHALLOW: (
        "Ask a SHALLOW follow-up that asks the candidate to expand, clarify, or give a concrete "
        "example of something they just mentioned. Keep it open-ended and supportive."
    ),
    FollowUpDepth.MEDIUM: (
        "Ask a MEDIUM follow-up that gently challenges an assumption or decision in the candidate's answer. "
        "Push them to justify their reasoning or consider an alternative approach."
    ),
    FollowUpDepth.DEEP: (
        "Ask a DEEP follow-up that stress-tests the candidate's answer with a tricky edge case, a failure mode, "
        "or a constraint they didn't address. A strong candidate should handle this calmly."
    ),
}

_TRACK_PERSONA: dict[TrackType, str] = {
    TrackType.TECHNICAL: (
        "You are a senior technical interviewer at a top technology company. "
        "Probe for depth in system design, correctness, trade-offs, and real experience."
    ),
    TrackType.BEHAVIORAL: (
        "You are a principal engineering manager. "
        "Probe for specific situations, outcomes, personal ownership, and leadership qualities."
    ),
}

_SYSTEM_TEMPLATE = """\
{persona}

The candidate just answered the following interview question:
Question: {question_id_placeholder}

The candidate said:
\"\"\"{transcript}\"\"\"

{depth_instruction}

Respond ONLY with valid JSON matching exactly this structure:
{{
  "follow_up_question": "...",
  "rationale": "...",
  "suggested_answer_direction": "..."
}}

Rules:
- follow_up_question: 1 direct, concise sentence. Do not reveal the rationale or hints.
- rationale: 1-2 sentences explaining the interviewer intent (internal use only).
- suggested_answer_direction: 2-3 sentences describing what a strong candidate answer should cover.
- Do not use markdown. Return only the raw JSON.
"""


class FollowUpService:
    def __init__(self):
        self._client: Optional[AsyncOpenAI] = None
        if _openai_available and settings.OPENAI_API_KEY:
            self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def generate_follow_up(self, req: FollowUpRequest) -> FollowUpResponse:
        """
        Generate a contextual follow-up probe from the candidate's transcript.
        Falls back to a deterministic rule-based question if LLM is unavailable.
        """
        depth = req.depth or FollowUpDepth.SHALLOW

        if self._client:
            try:
                return await self._llm_generate(req, depth)
            except Exception:
                pass  # fall through to deterministic fallback

        return self._fallback_generate(req, depth)

    async def _llm_generate(self, req: FollowUpRequest, depth: FollowUpDepth) -> FollowUpResponse:
        persona = _TRACK_PERSONA.get(req.track, _TRACK_PERSONA[TrackType.TECHNICAL])
        depth_instruction = _DEPTH_INSTRUCTIONS[depth]

        system_prompt = _SYSTEM_TEMPLATE.format(
            persona=persona,
            question_id_placeholder=f"(Question ID: {req.question_id})",
            transcript=req.transcript[:3000],
            depth_instruction=depth_instruction
        )

        response = await self._client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": system_prompt}],
            temperature=0.7,
            max_tokens=400,
            response_format={"type": "json_object"}
        )

        raw = response.choices[0].message.content or "{}"
        parsed = json.loads(raw)

        return FollowUpResponse(
            session_id=req.session_id,
            parent_question_id=req.question_id,
            follow_up_id=f"fu-{uuid.uuid4().hex[:12]}",
            follow_up_question=parsed.get("follow_up_question", "Can you elaborate on that?"),
            depth=depth,
            rationale=parsed.get("rationale", ""),
            suggested_answer_direction=parsed.get("suggested_answer_direction", "")
        )

    def _fallback_generate(self, req: FollowUpRequest, depth: FollowUpDepth) -> FollowUpResponse:
        """Rule-based fallback when LLM is unavailable."""
        fallback_questions: dict[FollowUpDepth, str] = {
            FollowUpDepth.SHALLOW: (
                "Can you walk me through a specific example from your experience "
                "that illustrates what you just described?"
            ),
            FollowUpDepth.MEDIUM: (
                "What would you do differently if you faced a 10x scale constraint "
                "or had significantly less time to implement that solution?"
            ),
            FollowUpDepth.DEEP: (
                "What would happen to your approach if one of those key assumptions "
                "turned out to be wrong — how would you recover?"
            ),
        }

        fallback_rationales: dict[FollowUpDepth, str] = {
            FollowUpDepth.SHALLOW: "Checking whether the candidate can ground their answer with concrete experience.",
            FollowUpDepth.MEDIUM: "Testing adaptability and awareness of scaling constraints.",
            FollowUpDepth.DEEP: "Stress-testing resilience and edge-case awareness.",
        }

        return FollowUpResponse(
            session_id=req.session_id,
            parent_question_id=req.question_id,
            follow_up_id=f"fu-fallback-{uuid.uuid4().hex[:8]}",
            follow_up_question=fallback_questions[depth],
            depth=depth,
            rationale=fallback_rationales[depth],
            suggested_answer_direction=(
                "A strong answer should include a specific situation, measurable outcome, "
                "and the candidate's personal contribution or learning."
            )
        )


follow_up_service = FollowUpService()
