"""
ReportExportService — Feature 5: Exportable PDF/Markdown Reports & Practice History

Synthesizes high-fidelity Markdown, JSON, and standalone printable HTML reports
from SessionSummary data, complete with STAR rubrics, delivery telemetry,
recurring strengths, and focus growth areas.
"""
from typing import Tuple
from datetime import datetime
from app.models.schemas import (
    ReportExportRequest,
    ReportExportResponse,
    ReportFormat,
    SessionSummary
)

class ReportExportService:
    def export_report(self, req: ReportExportRequest) -> ReportExportResponse:
        fmt = req.format or ReportFormat.MARKDOWN
        session_id = req.summary.session_id
        timestamp = datetime.utcnow().strftime("%Y-%m-%d")

        if fmt == ReportFormat.MARKDOWN:
            content = self._render_markdown(req)
            filename = f"POISE_Report_{req.summary.category.replace(' ', '_')}_{timestamp}.md"
        elif fmt == ReportFormat.HTML:
            content = self._render_html(req)
            filename = f"POISE_Report_{req.summary.category.replace(' ', '_')}_{timestamp}.html"
        else:
            content = req.summary.model_dump_json(indent=2)
            filename = f"POISE_Report_{req.summary.session_id}_{timestamp}.json"

        return ReportExportResponse(
            session_id=session_id,
            format=fmt,
            filename=filename,
            content=content,
            download_url=f"/api/interview/report/download/{session_id}"
        )

    def _render_markdown(self, req: ReportExportRequest) -> str:
        s: SessionSummary = req.summary
        date_str = datetime.utcnow().strftime("%B %d, %Y")

        lines = [
            f"# POISE Practice Session Report",
            f"**Candidate:** {req.candidate_name} | **Date:** {date_str}",
            f"**Track:** {s.track.value.title()} | **Specialization:** {s.category} | **Level:** {s.level.value.title()}",
            f"**Session ID:** `{s.session_id}`",
            "",
            "---",
            "",
            "## Executive Summary",
            "",
            f"| Metric | Result | Target Range | Assessment |",
            f"| :--- | :--- | :--- | :--- |",
            f"| **Overall Score** | **{s.average_overall_score}/100** | 80–100 | {'🟢 Strong' if s.average_overall_score >= 80 else '🟡 Calibrating'} |",
            f"| **Content & Correctness** | **{s.average_content_score}/100** | 80–100 | {'🟢 Ready' if s.average_content_score >= 80 else '🟡 Needs Depth'} |",
            f"| **Clarity & Structure** | **{s.average_clarity_score}/100** | 80–100 | {'🟢 Clear' if s.average_clarity_score >= 80 else '🟡 Needs Polish'} |",
            f"| **Delivery & Composure** | **{s.average_delivery_score}/100** | 80–100 | {'🟢 Composed' if s.average_delivery_score >= 80 else '🟡 Needs Cadence'} |",
            f"| **Average Speaking Pace** | **{s.average_wpm} WPM** | 120–160 WPM | {'🟢 Optimal' if 120 <= s.average_wpm <= 160 else '🟡 Adjusted'} |",
            f"| **Filler Words Detected** | **{s.total_filler_words}** | < 5 per session | {'🟢 Clean' if s.total_filler_words <= 5 else '🟡 Refine'} |",
            f"| **Total Practice Duration** | **{round(s.total_duration_seconds, 1)}s** | — | — |",
            "",
            "### Recommended Focus Area for Next Session",
            f"> **{s.recommended_focus_area}**",
            "",
            "### Recurring Key Strengths",
        ]

        for strength in s.recurring_strengths:
            lines.append(f"- **{strength}**")

        lines.extend([
            "",
            "### Key High-Leverage Growth Areas",
        ])

        for growth in s.recurring_growth_areas:
            lines.append(f"- {growth}")

        if req.include_rubric_breakdown and s.question_breakdown:
            lines.extend([
                "",
                "---",
                "",
                "## Question-by-Question Breakdown",
                ""
            ])

            for idx, q_rec in enumerate(s.question_breakdown, start=1):
                fb = q_rec.feedback
                lines.extend([
                    f"### Question {idx}: {q_rec.question.text}",
                    f"- **Category:** `{q_rec.question.category}` | **Level:** `{q_rec.question.level.value}`",
                    f"- **Score:** `{fb.scores.overall_score}/100` (Content: {fb.scores.content_score}, Clarity: {fb.scores.clarity_score}, Delivery: {fb.scores.delivery_score})",
                    f"- **Pace:** `{fb.delivery_metrics.words_per_minute} WPM` | **Fillers:** `{fb.delivery_metrics.filler_word_count}`",
                    ""
                ])

                if req.include_transcripts and q_rec.transcript:
                    lines.extend([
                        f"**Spoken Transcript:**",
                        f"> \"{q_rec.transcript}\"",
                        ""
                    ])

                lines.extend([
                    f"**Strengths Demonstrated:**",
                    *[f"- {st}" for st in fb.strengths],
                    "",
                    f"**Recommended Improvements:**",
                    *[f"- {imp}" for imp in fb.improvements],
                    "",
                    f"**Demonstrated Top Candidate Phrasing:**",
                    f"> \"{fb.rewritten_snippet}\"",
                    "",
                    "---",
                    ""
                ])

        lines.extend([
            "_Report synthesized by POISE AI Mock Interview Coach. Audio processed in-memory with zero persistent server storage._"
        ])

        return "\n".join(lines)

    def _render_html(self, req: ReportExportRequest) -> str:
        s: SessionSummary = req.summary
        date_str = datetime.utcnow().strftime("%B %d, %Y")

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>POISE Interview Report — {s.category}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 40px 20px; }}
    h1 {{ color: #4338ca; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }}
    h2 {{ color: #334155; margin-top: 30px; }}
    table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
    th, td {{ border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }}
    th {{ background: #f8fafc; font-weight: 600; }}
    blockquote {{ background: #f1f5f9; border-left: 4px solid #6366f1; margin: 16px 0; padding: 12px 18px; border-radius: 0 8px 8px 0; }}
    .badge {{ display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: #e0e7ff; color: #4338ca; }}
    @media print {{ body {{ padding: 0; }} .no-print {{ display: none; }} }}
  </style>
</head>
<body>
  <h1>POISE Practice Session Report</h1>
  <p><strong>Candidate:</strong> {req.candidate_name} &nbsp;|&nbsp; <strong>Date:</strong> {date_str} &nbsp;|&nbsp; <span class="badge">{s.category} ({s.level.value.title()})</span></p>
  
  <h2>Performance Summary</h2>
  <table>
    <tr><th>Metric</th><th>Result</th><th>Target</th></tr>
    <tr><td>Overall Score</td><td><strong>{s.average_overall_score}/100</strong></td><td>80–100</td></tr>
    <tr><td>Content Score</td><td><strong>{s.average_content_score}/100</strong></td><td>80–100</td></tr>
    <tr><td>Clarity Score</td><td><strong>{s.average_clarity_score}/100</strong></td><td>80–100</td></tr>
    <tr><td>Delivery Score</td><td><strong>{s.average_delivery_score}/100</strong></td><td>80–100</td></tr>
    <tr><td>Average Pace</td><td><strong>{s.average_wpm} WPM</strong></td><td>120–160 WPM</td></tr>
    <tr><td>Total Fillers</td><td><strong>{s.total_filler_words}</strong></td><td>&lt; 5</td></tr>
  </table>

  <h2>Recommended Focus Area</h2>
  <blockquote>{s.recommended_focus_area}</blockquote>

  <h2>Key Strengths</h2>
  <ul>{''.join(f'<li><strong>{st}</strong></li>' for st in s.recurring_strengths)}</ul>

  <h2>Growth Opportunities</h2>
  <ul>{''.join(f'<li>{gr}</li>' for gr in s.recurring_growth_areas)}</ul>

  <p style="margin-top: 50px; font-size: 11px; color: #64748b; text-align: center;">Generated by POISE &copy; 2026 · AI Mock Interview Coach</p>
</body>
</html>"""

report_export_service = ReportExportService()
