import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JDImporterModal } from '../components/setup/JDImporterModal';

// Mock api
vi.mock('../services/api', () => ({
  importJDAndCreateSession: vi.fn()
}));

import { importJDAndCreateSession } from '../services/api';
const mockImport = vi.mocked(importJDAndCreateSession);

describe('JDImporterModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSessionCreated: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<JDImporterModal {...defaultProps} isOpen={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders title, company, level, and textarea when open', () => {
    render(<JDImporterModal {...defaultProps} />);
    expect(screen.getByText('Custom Interview Architect')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Senior Distributed Systems Engineer/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Stripe, Netflix, Google/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Architect Interview Loop/i })).toBeInTheDocument();
  });

  it('submits customized JD parameters and calls onSessionCreated', async () => {
    mockImport.mockResolvedValueOnce({
      session_id: 'sess-jd-custom-1',
      job_title: 'Staff Platform Engineer',
      company_name: 'Netflix',
      track: 'technical',
      category: 'Staff Platform Engineer @ Netflix',
      level: 'senior',
      total_questions: 5,
      current_question_index: 1,
      extracted_skills: {
        primary_technologies: ['Kubernetes', 'Spinnaker', 'Go'],
        architectural_domains: ['Edge Routing', 'Multi-Region Failover'],
        behavioral_competencies: ['Architecture Reviews'],
        seniority_signals: ['Staff-level Scope']
      },
      question: {
        id: 'q-custom-1',
        text: 'How do you design multi-region failover for streaming control planes?',
        track: 'technical',
        category: 'Staff Platform Engineer @ Netflix',
        level: 'senior',
        hints: ['Consider active-active replication latencies.']
      },
      tailored_questions: []
    });

    render(<JDImporterModal {...defaultProps} />);

    // Change title and company
    const titleInput = screen.getByPlaceholderText(/e\.g\. Senior Distributed Systems Engineer/i);
    fireEvent.change(titleInput, { target: { value: 'Staff Platform Engineer' } });

    const companyInput = screen.getByPlaceholderText(/e\.g\. Stripe, Netflix, Google/i);
    fireEvent.change(companyInput, { target: { value: 'Netflix' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Architect Interview Loop/i }));

    await waitFor(() => {
      expect(mockImport).toHaveBeenCalledWith(
        expect.objectContaining({
          job_title: 'Staff Platform Engineer',
          company_name: 'Netflix',
          level: 'senior',
          track: 'technical'
        })
      );
    });

    expect(defaultProps.onSessionCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: 'sess-jd-custom-1',
        company_name: 'Netflix'
      })
    );
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
