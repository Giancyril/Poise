import re
from typing import Dict, List, Any
from app.models.schemas import FillerWordStat, DeliveryMetrics

# Common filler words and vocal crutches
FILLER_PATTERNS = [
    r"\bum+\b",
    r"\buh+\b",
    r"\blike\b",
    r"\byou know\b",
    r"\bactually\b",
    r"\bbasically\b",
    r"\bliterally\b",
    r"\bsort of\b",
    r"\bkind of\b",
    r"\bi mean\b",
    r"\bright\b",
]

class DeliveryService:
    """
    Analyzes delivery and vocal pacing heuristics from transcript text and recording duration.
    """
    def analyze_delivery(
        self,
        transcript: str,
        duration_seconds: float
    ) -> DeliveryMetrics:
        if not transcript or not transcript.strip():
            return DeliveryMetrics(
                words_per_minute=0,
                pacing_assessment="No speech detected",
                filler_word_count=0,
                filler_words=[],
                total_words=0,
                average_words_per_sentence=0.0
            )

        clean_text = transcript.strip()
        words = re.findall(r"\b\w+\b", clean_text.lower())
        total_words = len(words)

        # 1. Pacing & WPM Calculation
        effective_duration = max(1.0, duration_seconds)
        wpm = round((total_words / effective_duration) * 60)

        # Ideal conversational interview pacing is ~130 - 165 WPM
        if wpm < 110:
            pacing_assessment = "Deliberate / Slow Pace (Take care not to stall)"
        elif wpm <= 165:
            pacing_assessment = "Optimal Pace (Natural, confident cadence)"
        elif wpm <= 195:
            pacing_assessment = "Slightly Fast (Ensure you pause between key points)"
        else:
            pacing_assessment = "Rapid Pace (Slow down for clarity and emphasis)"

        # 2. Filler Word Detection
        filler_stats: List[FillerWordStat] = []
        total_fillers = 0

        for pattern in FILLER_PATTERNS:
            matches = re.findall(pattern, clean_text, flags=re.IGNORECASE)
            count = len(matches)
            if count > 0:
                clean_word = pattern.replace(r"\b", "").replace(r"+", "")
                filler_stats.append(FillerWordStat(word=clean_word, count=count))
                total_fillers += count

        # Sort fillers by count descending
        filler_stats.sort(key=lambda x: x.count, reverse=True)

        # 3. Sentence Structure & Rambling Heuristics
        sentences = [s for s in re.split(r"[.!?]+", clean_text) if s.strip()]
        sentence_count = max(1, len(sentences))
        avg_words_per_sentence = round(total_words / sentence_count, 1)

        return DeliveryMetrics(
            words_per_minute=wpm,
            pacing_assessment=pacing_assessment,
            filler_word_count=total_fillers,
            filler_words=filler_stats,
            total_words=total_words,
            average_words_per_sentence=avg_words_per_sentence
        )

delivery_service = DeliveryService()
