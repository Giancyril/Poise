from typing import List
from app.models.schemas import TrackType, DifficultyLevel

QUESTION_GEN_SYSTEM_PROMPT = """You are an expert technical interviewer and hiring manager at a top tech company (like Stripe, Google, Meta, or OpenAI).
Your role is to conduct high-signal, realistic mock interviews.

Guidelines for question generation:
1. Questions MUST be tailored to spoken verbal responses (avoid questions requiring writing 40 lines of code or complex syntax quizzes). Focus on architectural reasoning, design trade-offs, debugging instincts, technical concepts, or behavioral scenarios.
2. Calibrate difficulty to the requested seniority level:
   - Junior: Core concepts, fundamental patterns, direct experiences, ability to explain how things work under the hood.
   - Mid-Level: Trade-offs, real-world edge cases, performance considerations, cross-service interactions, practical problem-solving.
   - Senior: Scalability, architecture tradeoffs, organizational influence, failure modes, handling ambiguity, long-term maintainability.
3. For BEHAVIORAL questions: Frame prompts around the STAR framework (Situation, Task, Action, Result) focusing on conflict resolution, ambiguity, leadership, ownership, or overcoming critical failure.
4. For TECHNICAL questions: Ask scenario-based questions (e.g. "How would you design X?", "Why would you choose A over B?", "How do you diagnose and fix Y?").
5. DO NOT repeat or closely mirror any previously asked questions in this session.
6. Return your output strictly as a JSON object with the specified schema.
"""

def build_question_gen_user_prompt(
    track: TrackType,
    category: str,
    level: DifficultyLevel,
    previously_asked: List[str]
) -> str:
    prompt = f"""Generate a realistic, high-signal mock interview question for the following candidate profile:

- Track: {track.value.upper()}
- Target Role / Category: {category}
- Seniority Level: {level.value.upper()}
"""
    if previously_asked:
        prompt += "\nPreviously asked questions in this session (DO NOT REPEAT OR DUPLICATE TOPICS):\n"
        for i, q in enumerate(previously_asked, 1):
            prompt += f"{i}. {q}\n"

    prompt += """
Generate a new, distinct question. Respond ONLY with a valid JSON object matching this schema:
{
  "text": "The exact question text to ask the candidate",
  "hints": ["Helpful hint or consideration 1", "Helpful hint or consideration 2"],
  "key_evaluation_criteria": ["What a strong answer should demonstrate 1", "What a strong answer should demonstrate 2"]
}
"""
    return prompt

# Curated fallback catalog for offline tests / zero-key testing
FALLBACK_QUESTIONS = {
    TrackType.TECHNICAL: {
        "Frontend Engineer": [
            {
                "text": "Can you explain the difference between client-side state management using React Context versus a global store like Redux Toolkit or Zustand? In what scenarios would you recommend one over the other?",
                "level": DifficultyLevel.MID,
                "hints": ["Think about re-render frequency", "Consider bundle size and devtools debugging"],
                "key_evaluation_criteria": ["Re-render optimization understanding", "Granular selector patterns", "Maintainability in large codebases"]
            },
            {
                "text": "How does the browser rendering pipeline work from receiving HTML/CSS to painting pixels on screen, and how do you optimize Core Web Vitals like Largest Contentful Paint (LCP) and Interaction to Next Paint (INP)?",
                "level": DifficultyLevel.SENIOR,
                "hints": ["DOM, CSSOM, Render Tree, Layout, Paint", "Resource prioritization with rel=preload"],
                "key_evaluation_criteria": ["DOM/CSSOM rendering lifecycle", "Critical rendering path optimization", "Modern Core Web Vitals metrics"]
            },
            {
                "text": "What is the JavaScript Event Loop, and how does the microtask queue differ from the macrotask queue when handling Promises and setTimeout callbacks?",
                "level": DifficultyLevel.JUNIOR,
                "hints": ["Call stack, Web APIs, Task Queue, Microtask Queue"],
                "key_evaluation_criteria": ["Execution order understanding", "Promise vs setTimeout priority", "Single-threaded non-blocking I/O"]
            }
        ],
        "Backend Engineer": [
            {
                "text": "How do you approach database indexing in a relational database like PostgreSQL? What are the trade-offs between B-Tree indexes and GIN/GiST indexes, and when can indexing hurt performance?",
                "level": DifficultyLevel.MID,
                "hints": ["Write amplification", "Index selectivity", "Composite index column ordering"],
                "key_evaluation_criteria": ["Understanding query planner & EXPLAIN ANALYZE", "Trade-offs on write-heavy tables", "Compound index prefix rule"]
            },
            {
                "text": "How would you design an idempotent payment processing API to ensure that network timeouts or user retry clicks never cause double charges?",
                "level": DifficultyLevel.SENIOR,
                "hints": ["Idempotency keys", "Distributed locks or unique constraints", "State machine tracking"],
                "key_evaluation_criteria": ["Unique idempotency key handling", "Atomic database transactions", "Graceful error recovery"]
            }
        ],
        "System Design": [
            {
                "text": "How would you design a distributed rate limiter for a public API that receives 100,000 requests per second? What algorithms and storage backends would you consider?",
                "level": DifficultyLevel.SENIOR,
                "hints": ["Token bucket vs Leaky bucket vs Sliding window counter", "Redis cluster with Lua scripts"],
                "key_evaluation_criteria": ["Algorithm comparison", "Distributed race condition handling", "Fault tolerance when rate limiter is down"]
            }
        ]
    },
    TrackType.BEHAVIORAL: {
        "Behavioral / STAR": [
            {
                "text": "Tell me about a time when you strongly disagreed with a technical decision made by a teammate or technical lead. How did you handle the situation, and what was the outcome?",
                "level": DifficultyLevel.MID,
                "hints": ["Use the STAR method (Situation, Task, Action, Result)", "Focus on objective data and empathy"],
                "key_evaluation_criteria": ["Constructive communication", "Data-driven decision making", "Commitment to team alignment"]
            },
            {
                "text": "Describe a project where requirements were vague or rapidly changing. How did you establish clarity, prioritize deliverables, and keep stakeholders informed?",
                "level": DifficultyLevel.SENIOR,
                "hints": ["Highlight proactive communication", "Mention incremental milestones and feedback loops"],
                "key_evaluation_criteria": ["Handling ambiguity", "Stakeholder management", "Iterative delivery"]
            },
            {
                "text": "Tell me about a time you made a mistake or caused a production issue. What steps did you take to mitigate the impact, and what did you learn?",
                "level": DifficultyLevel.JUNIOR,
                "hints": ["Take clear ownership", "Focus on post-mortem and preventative safeguards"],
                "key_evaluation_criteria": ["Accountability", "Blameless post-mortem mindset", "Systemic preventative action"]
            }
        ]
    }
}
