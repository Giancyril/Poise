"""
Tests for POST /api/interview/telemetry — Feature 2: Real-time Speech Telemetry
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

TELEMETRY_URL = "/api/interview/telemetry"

BASE_PAYLOAD = {
    "session_id": "test-session-001",
    "question_id": "q-abc-123",
    "estimated_wpm": 145,
    "peak_volume": 0.75,
    "avg_volume": 0.55,
    "recording_duration_seconds": 62.4
}


def test_telemetry_returns_optimal_for_good_wpm():
    resp = client.post(TELEMETRY_URL, json={**BASE_PAYLOAD, "estimated_wpm": 150})
    assert resp.status_code == 200
    data = resp.json()
    assert data["pace_label"] == "optimal"
    assert data["session_id"] == "test-session-001"
    assert data["estimated_wpm"] == 150
    assert len(data["coaching_tip"]) > 10


def test_telemetry_returns_too_slow_for_low_wpm():
    resp = client.post(TELEMETRY_URL, json={**BASE_PAYLOAD, "estimated_wpm": 80})
    assert resp.status_code == 200
    data = resp.json()
    assert data["pace_label"] == "too_slow"


def test_telemetry_returns_good_for_borderline_wpm():
    resp = client.post(TELEMETRY_URL, json={**BASE_PAYLOAD, "estimated_wpm": 115})
    assert resp.status_code == 200
    assert resp.json()["pace_label"] == "good"


def test_telemetry_returns_a_bit_fast_for_high_wpm():
    resp = client.post(TELEMETRY_URL, json={**BASE_PAYLOAD, "estimated_wpm": 195})
    assert resp.status_code == 200
    assert resp.json()["pace_label"] == "a_bit_fast"


def test_telemetry_returns_too_fast_for_very_high_wpm():
    resp = client.post(TELEMETRY_URL, json={**BASE_PAYLOAD, "estimated_wpm": 220})
    assert resp.status_code == 200
    assert resp.json()["pace_label"] == "too_fast"


def test_telemetry_returns_no_speech_for_zero_wpm():
    resp = client.post(TELEMETRY_URL, json={**BASE_PAYLOAD, "estimated_wpm": 0})
    assert resp.status_code == 200
    assert resp.json()["pace_label"] == "no_speech"


def test_telemetry_rejects_invalid_wpm_above_max():
    resp = client.post(TELEMETRY_URL, json={**BASE_PAYLOAD, "estimated_wpm": 600})
    assert resp.status_code == 422


def test_telemetry_rejects_volume_above_1():
    resp = client.post(TELEMETRY_URL, json={**BASE_PAYLOAD, "peak_volume": 1.5})
    assert resp.status_code == 422


def test_telemetry_coaching_tip_matches_pace():
    """Ensure coaching tip text is non-trivial and distinct per pace label."""
    tips = {}
    test_cases = [
        ("too_slow", 80),
        ("good", 115),
        ("optimal", 150),
        ("a_bit_fast", 195),
        ("too_fast", 220),
        ("no_speech", 0)
    ]
    for label, wpm in test_cases:
        resp = client.post(TELEMETRY_URL, json={**BASE_PAYLOAD, "estimated_wpm": wpm})
        data = resp.json()
        assert data["pace_label"] == label
        tips[label] = data["coaching_tip"]

    # All tips should be distinct from each other
    tip_values = list(tips.values())
    assert len(set(tip_values)) == len(tip_values), "Coaching tips must be unique per pace label"
