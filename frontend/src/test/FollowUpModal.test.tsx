import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FollowUpModal } from '../components/interview/FollowUpModal';

// Mock api
vi.mock('../services/api', () => ({
  requestFollowUpQuestion: vi.fn()
}));

import { requestFollowUpQuestion } from '../services/api';
const mockRequest = vi.mocked(requestFollowUpQuestion);

describe('FollowUpModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    sessionId: 'sess-test-456',
    questionId: 'q-arch-1',
    transcript: 'We used PostgreSQL with connection pooling via PgBouncer.',
    track: 'technical' as const,
    category: 'Backend Engineer',
    level: 'senior' as const,
    onAcceptFollowUp: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<FollowUpModal {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders modal header and depth options when open', () => {
    render(<FollowUpModal {...defaultProps} />);
    expect(screen.getByText('Dynamic Follow-Up Drill-Down')).toBeInTheDocument();
    expect(screen.getByText('Clarify & Expand')).toBeInTheDocument();
    expect(screen.getByText('Challenge Trade-Offs')).toBeInTheDocument();
    expect(screen.getByText('Stress-Test Edge Cases')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Contextual Probe/i })).toBeInTheDocument();
  });

  it('calls requestFollowUpQuestion with selected depth on click', async () => {
    mockRequest.mockResolvedValueOnce({
      session_id: 'sess-test-456',
      parent_question_id: 'q-arch-1',
      follow_up_id: 'fu-999',
      follow_up_question: 'How did you size the connection pool limit under peak load?',
      depth: 'deep',
      rationale: 'Testing capacity planning.',
      suggested_answer_direction: 'Mention benchmarking against max database connections.'
    });

    render(<FollowUpModal {...defaultProps} />);

    // Select deep depth
    fireEvent.click(screen.getByText('Stress-Test Edge Cases'));

    // Click Generate
    fireEvent.click(screen.getByRole('button', { name: /Generate Contextual Probe/i }));

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith({
        session_id: 'sess-test-456',
        question_id: 'q-arch-1',
        transcript: 'We used PostgreSQL with connection pooling via PgBouncer.',
        depth: 'deep',
        track: 'technical',
        category: 'Backend Engineer',
        level: 'senior'
      });
    });

    // Should display generated question
    expect(screen.getByText(/"How did you size the connection pool limit under peak load\?"/i)).toBeInTheDocument();
  });

  it('accepts follow up question and calls onAcceptFollowUp', async () => {
    mockRequest.mockResolvedValueOnce({
      session_id: 'sess-test-456',
      parent_question_id: 'q-arch-1',
      follow_up_id: 'fu-777',
      follow_up_question: 'What rollback strategy was in place?',
      depth: 'medium',
      rationale: 'Testing deployment safety.',
      suggested_answer_direction: 'Discuss canary rollouts.'
    });

    render(<FollowUpModal {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Generate Contextual Probe/i }));

    await waitFor(() => {
      expect(screen.getByText(/"What rollback strategy was in place\?"/i)).toBeInTheDocument();
    });

    // Click Accept
    fireEvent.click(screen.getByRole('button', { name: /Answer This Follow-Up/i }));

    expect(defaultProps.onAcceptFollowUp).toHaveBeenCalledWith(
      expect.objectContaining({
        follow_up_id: 'fu-777',
        follow_up_question: 'What rollback strategy was in place?'
      })
    );
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
