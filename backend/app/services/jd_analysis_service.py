"""
JDAnalysisService — Feature 4: Custom Interview Architect & JD Ingestion

Extracts key competencies, frameworks, and architectural challenges
from unstructured Job Descriptions using GPT-4o, and compiles a bespoke
set of interview questions specifically tuned for the target company and role.
"""
import uuid
import json
import re
from typing import Tuple, List, Optional
from app.models.schemas import (
    CustomJDRequest,
    ExtractedJDSkills,
    Question,
    TrackType,
    DifficultyLevel
)
from app.core.config import settings

try:
    from openai import AsyncOpenAI
    _openai_available = True
except ImportError:
    _openai_available = False

_JD_PROMPT_TEMPLATE = """\
You are an expert technical recruiting leader and principal hiring manager at {company_name}.
You are designing a high-signal interview loop for the following role:

Job Title: {job_title}
Seniority Level: {level}
Track: {track}

Job Description Text:
\"\"\"{jd_text}\"\"\"

Your task:
1. Extract key skills & competencies:
   - primary_technologies (e.g. ["TypeScript", "Kafka", "PostgreSQL", "Next.js"])
   - architectural_domains (e.g. ["Event-Driven Systems", "Database Partitioning", "Micro-frontends"])
   - behavioral_competencies (e.g. ["Cross-team Alignment", "Incident Management", "Mentorship"])
   - seniority_signals (e.g. ["Staff-level Trade-off Thinking", "Ambiguity Handling"])

2. Generate exactly {total_questions} bespoke, highly realistic interview questions tailored directly to the specific tech stack and challenges mentioned in this job description.

Format your response ONLY as valid JSON:
{{
  "extracted_skills": {{
    "primary_technologies": ["..."],
    "architectural_domains": ["..."],
    "behavioral_competencies": ["..."],
    "seniority_signals": ["..."]
  }},
  "questions": [
    {{
      "text": "...",
      "hints": ["...", "..."],
      "key_evaluation_criteria": ["...", "..."]
    }}
  ]
}}
"""

class JDAnalysisService:
    def __init__(self):
        self._client: Optional[AsyncOpenAI] = None
        if _openai_available and settings.OPENAI_API_KEY:
            self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def analyze_and_generate_session(
        self, req: CustomJDRequest
    ) -> Tuple[ExtractedJDSkills, List[Question]]:
        """
        Extracts JD competencies and creates a tailored Question bank.
        Falls back to keyword extraction and procedural question generation if LLM is unavailable.
        """
        if self._client:
            try:
                return await self._llm_analyze(req)
            except Exception:
                pass  # Fall back to procedural generation

        return self._procedural_fallback(req)

    async def _llm_analyze(
        self, req: CustomJDRequest
    ) -> Tuple[ExtractedJDSkills, List[Question]]:
        prompt = _JD_PROMPT_TEMPLATE.format(
            company_name=req.company_name or "the hiring company",
            job_title=req.job_title,
            level=req.level.value,
            track=req.track.value if req.track else "technical",
            jd_text=req.job_description_text[:4000],
            total_questions=req.total_questions
        )

        response = await self._client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )

        raw = response.choices[0].message.content or "{}"
        parsed = json.loads(raw)

        extracted_raw = parsed.get("extracted_skills", {})
        skills = ExtractedJDSkills(
            primary_technologies=extracted_raw.get("primary_technologies", ["General Engineering"]),
            architectural_domains=extracted_raw.get("architectural_domains", ["System Architecture"]),
            behavioral_competencies=extracted_raw.get("behavioral_competencies", ["Team Collaboration"]),
            seniority_signals=extracted_raw.get("seniority_signals", [f"{req.level.value.title()} Impact"])
        )

        questions: List[Question] = []
        raw_questions = parsed.get("questions", [])
        track = req.track or TrackType.TECHNICAL
        category = req.job_title

        for idx, q_dict in enumerate(raw_questions):
            questions.append(Question(
                id=f"jd-q-{uuid.uuid4().hex[:8]}",
                text=q_dict.get("text", f"Question {idx+1} for {req.job_title}"),
                track=track,
                category=category,
                level=req.level,
                hints=q_dict.get("hints", []),
                key_evaluation_criteria=q_dict.get("key_evaluation_criteria", [])
            ))

        # Ensure we have at least total_questions
        if len(questions) < req.total_questions:
            fallback_skills, fallback_qs = self._procedural_fallback(req)
            needed = req.total_questions - len(questions)
            questions.extend(fallback_qs[:needed])

        return skills, questions[:req.total_questions]

    def _procedural_fallback(
        self, req: CustomJDRequest
    ) -> Tuple[ExtractedJDSkills, List[Question]]:
        """Procedural keyword extraction and question templating for offline mode."""
        text = req.job_description_text.lower()
        
        # Simple regex keyword detector
        tech_catalog = [
            "react", "typescript", "python", "go", "golang", "rust", "java", "c++",
            "postgresql", "mysql", "mongodb", "redis", "kafka", "rabbitmq", "aws", "gcp",
            "docker", "kubernetes", "graphql", "grpc", "node", "fastapi", "django"
        ]
        found_tech = [t.title() for t in tech_catalog if re.search(r'\b' + re.escape(t) + r'\b', text)]
        if not found_tech:
            found_tech = ["Core Stack", "Distributed Systems", "APIs"]

        skills = ExtractedJDSkills(
            primary_technologies=found_tech[:6],
            architectural_domains=["High Availability", "Scalable Data Modeling", "API Contracts"],
            behavioral_competencies=["Technical Ownership", "Cross-Functional Collaboration", "Mentorship"],
            seniority_signals=[f"{req.level.value.title()} Autonomy", "Trade-Off Analysis"]
        )

        track = req.track or TrackType.TECHNICAL
        category = req.job_title

        # Procedural questions
        template_pool = [
            f"Looking at the tech requirements for {req.job_title} at {req.company_name}, how have you designed systems utilizing {found_tech[0]} under heavy load?",
            f"Describe an architectural trade-off you made between development velocity and long-term maintainability when building with {found_tech[min(1, len(found_tech)-1)]}.",
            f"At {req.company_name}, uptime and reliability are critical. Walk through how you debug and isolate a production failure in a distributed environment.",
            f"Tell me about a time you had to drive alignment across stakeholders or engineering teams when adopting a new technology or architecture.",
            f"How do you approach capacity planning, rate limiting, and observability for high-throughput services?"
        ]

        questions = [
            Question(
                id=f"jd-q-fallback-{idx+1}-{uuid.uuid4().hex[:6]}",
                text=text_q,
                track=track,
                category=category,
                level=req.level,
                hints=[
                    "Ground your answer with measurable metrics (e.g. latency, throughput, team velocity).",
                    "Clearly state assumptions and alternative options you considered."
                ],
                key_evaluation_criteria=[
                    "Clear technical depth",
                    "Practical operational experience",
                    "Structured communication"
                ]
            )
            for idx, text_q in enumerate(template_pool[:req.total_questions])
        ]

        return skills, questions

jd_analysis_service = JDAnalysisService()
