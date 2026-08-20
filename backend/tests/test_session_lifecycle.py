import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_full_session_lifecycle():
    """
    End-to-end session: start → answer questions → end → summary.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Start 2-question behavioral session
        start_res = await ac.post("/api/interview/start", json={
            "track": "behavioral",
            "category": "Behavioral / STAR",
            "level": "mid",
            "total_questions": 2
        })
        assert start_res.status_code == 200
        session_id = start_res.json()["session_id"]
        q1_id = start_res.json()["question"]["id"]

        # 2. Answer Question 1
        answer1 = {
            "session_id": session_id,
            "question_id": q1_id,
            "duration_seconds": "40.0",
            "transcript": (
                "In my last role we faced a tough disagreement about whether to use "
                "a microservices approach or a monolith. I gathered data on our team's "
                "operational capacity and presented a phased proposal that satisfied both "
                "the CTO and the senior engineers. We launched on time with the monolith "
                "and planned a gradual extraction roadmap."
            )
        }
        ans1_res = await ac.post("/api/interview/answer", data=answer1)
        assert ans1_res.status_code == 200
        assert "feedback" in ans1_res.json()

        # 3. Get Question 2
        next_res = await ac.post("/api/interview/next-question", json={"session_id": session_id})
        assert next_res.status_code == 200
        q2_id = next_res.json()["question"]["id"]

        # 4. Answer Question 2
        answer2 = {
            "session_id": session_id,
            "question_id": q2_id,
            "duration_seconds": "35.0",
            "transcript": (
                "When our requirements changed mid-sprint, I immediately set up a 30-minute "
                "stakeholder sync to clarify scope boundaries. I documented the new requirements "
                "as acceptance criteria and re-estimated with the team. We delivered 90% of the "
                "original scope plus the new requirement within the same timeline by cutting "
                "a lower-priority feature."
            )
        }
        ans2_res = await ac.post("/api/interview/answer", data=answer2)
        assert ans2_res.status_code == 200

        # 5. End session and validate summary
        end_res = await ac.post("/api/interview/end", json={"session_id": session_id})

    assert end_res.status_code == 200
    end_data = end_res.json()
    assert "summary" in end_data
    summary = end_data["summary"]

    assert summary["total_questions_answered"] == 2
    assert 0 <= summary["average_overall_score"] <= 100
    assert len(summary["recurring_strengths"]) >= 1
    assert len(summary["recurring_growth_areas"]) >= 1
    assert len(summary["recommended_focus_area"]) > 10
    assert len(summary["question_breakdown"]) == 2

@pytest.mark.asyncio
async def test_end_session_without_answers():
    """
    Edge case: ending a session with no answered questions still returns a valid summary.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        start_res = await ac.post("/api/interview/start", json={
            "track": "technical",
            "category": "System Design",
            "level": "senior",
            "total_questions": 3
        })
        session_id = start_res.json()["session_id"]

        # End without answering anything
        end_res = await ac.post("/api/interview/end", json={"session_id": session_id})

    assert end_res.status_code == 200
    summary = end_res.json()["summary"]
    assert summary["total_questions_answered"] == 0
    assert len(summary["recurring_strengths"]) >= 1
