"""
Tests for Feature 5: Exportable PDF/Markdown Reports & Practice History
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.schemas import (
    ReportExportRequest,
    ReportFormat,
    SessionSummary,
    TrackType,
    DifficultyLevel,
    AnswerRecord,
    Question,
    FeedbackResponse,
    FeedbackScoreBreakdown,
    DeliveryMetrics
)
from app.services.report_export_service import report_export_service

client = TestClient(app)

EXPORT_URL = "/api/interview/report/export"

def make_sample_summary() -> SessionSummary:
    fb = FeedbackResponse(
        question_id="q-01",
        transcript="I structured the service into distinct bounded contexts.",
        duration_seconds=45.0,
        scores=FeedbackScoreBreakdown(
            overall_score=85,
            content_score=88,
            clarity_score=82,
            delivery_score=85
        ),
        delivery_metrics=DeliveryMetrics(
            words_per_minute=140,
            pacing_assessment="optimal",
            filler_word_count=2,
            filler_words=[],
            total_words=105,
            average_words_per_sentence=15.0
        ),
        strengths=["Clear architectural boundaries", "Accurate domain terminology"],
        improvements=["Could mention database isolation patterns"],
        rewritten_snippet="To isolate services cleanly, I decoupled data stores per service."
    )
    
    q = Question(
        id="q-01",
        text="How do you decompose a monolith into microservices?",
        track=TrackType.TECHNICAL,
        category="Backend Engineer",
        level=DifficultyLevel.SENIOR
    )
    
    return SessionSummary(
        session_id="sess-rep-001",
        track=TrackType.TECHNICAL,
        category="Backend Engineer",
        level=DifficultyLevel.SENIOR,
        total_questions_answered=1,
        average_overall_score=85,
        average_content_score=88,
        average_clarity_score=82,
        average_delivery_score=85,
        average_wpm=140,
        total_filler_words=2,
        total_duration_seconds=45.0,
        recurring_strengths=["Clear architectural boundaries"],
        recurring_growth_areas=["Database isolation patterns"],
        recommended_focus_area="Deepen distributed data transaction discussions",
        question_breakdown=[
            AnswerRecord(
                question=q,
                transcript="I structured the service into distinct bounded contexts.",
                duration_seconds=45.0,
                feedback=fb
            )
        ]
    )

def test_markdown_report_generation():
    summary = make_sample_summary()
    req = ReportExportRequest(
        summary=summary,
        candidate_name="Alex Rivera",
        format=ReportFormat.MARKDOWN
    )
    res = report_export_service.export_report(req)
    assert res.format == ReportFormat.MARKDOWN
    assert res.filename.endswith(".md")
    assert "Alex Rivera" in res.content
    assert "Executive Summary" in res.content
    assert "85/100" in res.content
    assert "decompose a monolith" in res.content.lower()

def test_html_report_generation():
    summary = make_sample_summary()
    req = ReportExportRequest(
        summary=summary,
        candidate_name="Jordan Lee",
        format=ReportFormat.HTML
    )
    res = report_export_service.export_report(req)
    assert res.format == ReportFormat.HTML
    assert res.filename.endswith(".html")
    assert "<!DOCTYPE html>" in res.content
    assert "Jordan Lee" in res.content
    assert "POISE Practice Session Report" in res.content

def test_export_endpoint_via_api():
    summary = make_sample_summary()
    payload = {
        "summary": summary.model_dump(),
        "candidate_name": "Taylor Swift",
        "format": "markdown"
    }
    resp = client.post(EXPORT_URL, json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["session_id"] == "sess-rep-001"
    assert data["format"] == "markdown"
    assert "Taylor Swift" in data["content"]
