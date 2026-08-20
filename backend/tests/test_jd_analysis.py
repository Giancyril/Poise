"""
Tests for Feature 4: Custom Interview Architect & JD Ingestion
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.schemas import CustomJDRequest, DifficultyLevel, TrackType
from app.services.jd_analysis_service import jd_analysis_service

client = TestClient(app)

CUSTOM_JD_URL = "/api/interview/custom-jd"

SAMPLE_JD_PAYLOAD = {
    "job_title": "Senior Frontend Engineer",
    "company_name": "Vercel",
    "job_description_text": """
    We are looking for a Senior Frontend Engineer to build high-performance developer tools.
    Requirements:
    - 5+ years building complex web applications with React, TypeScript, Next.js, and Tailwind CSS.
    - Deep understanding of Web Vitals (LCP, CLS, INP) and client-side performance optimization.
    - Experience designing design systems, state management (Zustand, React Query), and GraphQL APIs.
    - Strong communication, mentorship, and cross-functional leadership skills.
    """,
    "level": "senior",
    "track": "technical",
    "total_questions": 3
}

def test_custom_jd_endpoint_success():
    resp = client.post(CUSTOM_JD_URL, json=SAMPLE_JD_PAYLOAD)
    assert resp.status_code == 200
    data = resp.json()
    assert data["job_title"] == "Senior Frontend Engineer"
    assert data["company_name"] == "Vercel"
    assert data["total_questions"] == 3
    assert data["current_question_index"] == 1
    assert "session_id" in data
    
    # Verify extracted skills
    skills = data["extracted_skills"]
    assert len(skills["primary_technologies"]) > 0
    assert len(skills["architectural_domains"]) > 0
    
    # Verify first question
    q = data["question"]
    assert len(q["text"]) > 10
    assert q["level"] == "senior"

def test_custom_jd_session_progression():
    """Verify that next questions are served from the pre-compiled JD queue."""
    resp = client.post(CUSTOM_JD_URL, json=SAMPLE_JD_PAYLOAD)
    assert resp.status_code == 200
    sess_data = resp.json()
    sess_id = sess_data["session_id"]
    
    # Next question
    next_resp = client.post("/api/interview/next-question", json={"session_id": sess_id})
    assert next_resp.status_code == 200
    next_data = next_resp.json()
    assert next_data["current_question_index"] == 2
    assert next_data["question"] is not None
    assert next_data["is_completed"] is False

def test_custom_jd_procedural_fallback():
    req = CustomJDRequest(
        job_title="Staff Backend Engineer",
        company_name="Stripe",
        job_description_text="Experience with Go, Kafka, PostgreSQL, Docker, Kubernetes, and high availability distributed systems.",
        level=DifficultyLevel.SENIOR,
        track=TrackType.TECHNICAL,
        total_questions=4
    )
    skills, questions = jd_analysis_service._procedural_fallback(req)
    assert len(questions) == 4
    assert any("Go" in t or "Kafka" in t for t in skills.primary_technologies)
    assert "Stripe" in questions[0].text or "Staff Backend Engineer" in questions[0].text

def test_custom_jd_validation_rejects_empty():
    resp = client.post(CUSTOM_JD_URL, json={
        "job_title": "",
        "job_description_text": "Short",
        "total_questions": 3
    })
    assert resp.status_code == 422
