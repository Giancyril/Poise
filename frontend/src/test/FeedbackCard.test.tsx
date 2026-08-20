import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeedbackCard } from '../components/interview/FeedbackCard';
import type { FeedbackResponse } from '../types';

const mockFeedback: FeedbackResponse = {
  question_id: 'q-101',
  transcript: 'I used Redis for caching and implemented an LRU eviction policy.',
  duration_seconds: 42.0,
  scores: {
    overall_score: 88,
    content_score: 90,
    clarity_score: 85,
    delivery_score: 89
  },
  delivery_metrics: {
    words_per_minute: 145,
    pacing_assessment: 'Optimal conversational speed',
    filler_word_count: 1,
    filler_words: [{ word: 'like', count: 1 }],
    total_words: 102,
    average_words_per_sentence: 14.5
  },
  strengths: [
    'Directly answered the architecture trade-offs with concrete Redis mechanics.',
    'Clear articulation of LRU eviction policy.'
  ],
  improvements: [
    'Could quantify the expected read throughput improvement.'
  ],
  rewritten_snippet: 'In our system, we introduced a Redis cache with LRU eviction, dropping p99 latency from 250ms to 18ms.'
};

describe('FeedbackCard Component', () => {
  it('renders overall score and sub-scores correctly', () => {
    render(
      <FeedbackCard
        feedback={mockFeedback}
        onNextQuestion={vi.fn()}
        onReRecord={vi.fn()}
        isLoadingNext={false}
        isLastQuestion={false}
      />
    );

    expect(screen.getByText('88')).toBeInTheDocument();
    expect(screen.getByText('90')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('89')).toBeInTheDocument();
    expect(screen.getByText(/145 WPM/i)).toBeInTheDocument();
  });

  it('renders strengths and improvements correctly', () => {
    render(
      <FeedbackCard
        feedback={mockFeedback}
        onNextQuestion={vi.fn()}
        onReRecord={vi.fn()}
        isLoadingNext={false}
        isLastQuestion={false}
      />
    );

    expect(screen.getByText(/Directly answered the architecture trade-offs/i)).toBeInTheDocument();
    expect(screen.getByText(/Could quantify the expected read throughput/i)).toBeInTheDocument();
  });

  it('triggers onNextQuestion when Next Question button is clicked', () => {
    const handleNext = vi.fn();
    render(
      <FeedbackCard
        feedback={mockFeedback}
        onNextQuestion={handleNext}
        onReRecord={vi.fn()}
        isLoadingNext={false}
        isLastQuestion={false}
      />
    );

    const nextBtn = screen.getByRole('button', { name: /Next Question/i });
    fireEvent.click(nextBtn);
    expect(handleNext).toHaveBeenCalledTimes(1);
  });

  it('shows View Session Summary on last question', () => {
    render(
      <FeedbackCard
        feedback={mockFeedback}
        onNextQuestion={vi.fn()}
        onReRecord={vi.fn()}
        isLoadingNext={false}
        isLastQuestion={true}
      />
    );

    expect(screen.getByText(/View Session Summary/i)).toBeInTheDocument();
  });
});
