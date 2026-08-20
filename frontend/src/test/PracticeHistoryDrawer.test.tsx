import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PracticeHistoryDrawer, type StoredSessionItem } from '../components/history/PracticeHistoryDrawer';
import type { SessionSummary } from '../types';

describe('PracticeHistoryDrawer', () => {
  const sampleSummary: SessionSummary = {
    session_id: 'sess-hist-1',
    track: 'technical',
    category: 'Fullstack Engineer',
    level: 'senior',
    total_questions_answered: 3,
    average_overall_score: 88,
    average_content_score: 90,
    average_clarity_score: 85,
    average_delivery_score: 89,
    average_wpm: 145,
    total_filler_words: 2,
    total_duration_seconds: 120,
    recurring_strengths: ['Great modularity'],
    recurring_growth_areas: ['Edge cases'],
    recommended_focus_area: 'Distributed transactions',
    question_breakdown: []
  };

  const sampleHistory: StoredSessionItem[] = [
    {
      id: 'sess-hist-1',
      date: 'Aug 20',
      summary: sampleSummary
    }
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    history: sampleHistory,
    onSelectSession: vi.fn(),
    onClearHistory: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<PracticeHistoryDrawer {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders metrics summary and session items when open', () => {
    render(<PracticeHistoryDrawer {...defaultProps} />);
    expect(screen.getByText('Practice History & Trends')).toBeInTheDocument();
    expect(screen.getByText('88/100')).toBeInTheDocument();
    expect(screen.getByText('145 WPM')).toBeInTheDocument();
    expect(screen.getByText('Fullstack Engineer')).toBeInTheDocument();
    expect(screen.getByText('Aug 20')).toBeInTheDocument();
  });

  it('calls onSelectSession when clicking on a session card', () => {
    render(<PracticeHistoryDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText('Fullstack Engineer'));
    expect(defaultProps.onSelectSession).toHaveBeenCalledWith(sampleSummary);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClearHistory when clicking Clear History button', () => {
    render(<PracticeHistoryDrawer {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Clear History/i }));
    expect(defaultProps.onClearHistory).toHaveBeenCalled();
  });

  it('renders empty state message when history is empty', () => {
    render(<PracticeHistoryDrawer {...defaultProps} history={[]} />);
    expect(screen.getByText('No practice sessions yet')).toBeInTheDocument();
  });
});
