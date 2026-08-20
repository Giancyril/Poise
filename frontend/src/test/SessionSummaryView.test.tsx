import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionSummaryView } from '../components/summary/SessionSummaryView';
import type { SessionSummary } from '../types';

const mockSummary: SessionSummary = {
  session_id: 'test-sess-1',
  track: 'technical',
  category: 'Frontend Engineer',
  level: 'senior',
  total_questions_answered: 3,
  average_overall_score: 84,
  average_content_score: 87,
  average_clarity_score: 82,
  average_delivery_score: 83,
  average_wpm: 142,
  total_filler_words: 4,
  total_duration_seconds: 135,
  recurring_strengths: [
    'Consistently grounded answers in concrete trade-offs and component architecture.',
    'Clear structured reasoning from problem to solution.'
  ],
  recurring_growth_areas: [
    'Incorporate precise performance metrics (e.g. Core Web Vitals targets).'
  ],
  recommended_focus_area: 'Practice framing state management decisions with concrete bundle size and render performance metrics.',
  question_breakdown: [
    {
      question: {
        id: 'q1',
        text: 'How do you optimize render performance in React 19?',
        track: 'technical',
        category: 'Frontend Engineer',
        level: 'senior'
      },
      transcript: 'I used useMemo and React Compiler to reduce wasted renders.',
      duration_seconds: 45,
      feedback: {
        question_id: 'q1',
        transcript: 'I used useMemo and React Compiler to reduce wasted renders.',
        duration_seconds: 45,
        scores: { overall_score: 85, content_score: 88, clarity_score: 84, delivery_score: 83 },
        delivery_metrics: {
          words_per_minute: 140,
          pacing_assessment: 'Optimal',
          filler_word_count: 1,
          filler_words: [],
          total_words: 105,
          average_words_per_sentence: 15
        },
        strengths: ['Addressed modern React 19 paradigms.'],
        improvements: ['Mention profiling tools.'],
        rewritten_snippet: 'By profiling with React DevTools...'
      }
    }
  ]
};

describe('SessionSummaryView Component', () => {
  it('renders overall average scores and metrics', () => {
    render(<SessionSummaryView summary={mockSummary} onPracticeAgain={vi.fn()} />);

    expect(screen.getByText('84')).toBeInTheDocument();
    expect(screen.getByText('87')).toBeInTheDocument();
    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getByText('83')).toBeInTheDocument();
    expect(screen.getByText('142')).toBeInTheDocument();
    expect(screen.getByText('3 Questions Completed')).toBeInTheDocument();
  });

  it('renders recurring patterns and focus goal', () => {
    render(<SessionSummaryView summary={mockSummary} onPracticeAgain={vi.fn()} />);

    expect(screen.getByText(/Consistently grounded answers in concrete trade-offs/i)).toBeInTheDocument();
    expect(screen.getByText(/Incorporate precise performance metrics/i)).toBeInTheDocument();
    expect(screen.getByText(/Practice framing state management decisions/i)).toBeInTheDocument();
  });

  it('calls onPracticeAgain when practice button is clicked', () => {
    const handlePracticeAgain = vi.fn();
    render(<SessionSummaryView summary={mockSummary} onPracticeAgain={handlePracticeAgain} />);

    const restartBtn = screen.getByRole('button', { name: /Practice Another Session/i });
    fireEvent.click(restartBtn);
    expect(handlePracticeAgain).toHaveBeenCalledTimes(1);
  });
});
