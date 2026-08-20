import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InterviewerVoiceAvatar } from '../components/interview/InterviewerVoiceAvatar';

describe('InterviewerVoiceAvatar', () => {
  const defaultProps = {
    isPlaying: false,
    isLoading: false,
    isFallback: false,
    onPlay: vi.fn(),
    onPause: vi.fn(),
    onReplay: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the default persona name and Read Aloud button in idle state', () => {
    render(<InterviewerVoiceAvatar {...defaultProps} />);
    expect(screen.getByText('AI Interviewer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Read Aloud/i })).toBeInTheDocument();
  });

  it('renders custom persona name when provided', () => {
    render(<InterviewerVoiceAvatar {...defaultProps} personaName="Alex (Senior)" />);
    expect(screen.getByText('Alex (Senior)')).toBeInTheDocument();
  });

  it('calls onPlay when Read Aloud button is clicked', () => {
    render(<InterviewerVoiceAvatar {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /Read Aloud/i });
    fireEvent.click(btn);
    expect(defaultProps.onPlay).toHaveBeenCalledOnce();
  });

  it('shows a Pause button and Speaking badge when isPlaying is true', () => {
    render(<InterviewerVoiceAvatar {...defaultProps} isPlaying={true} />);
    expect(screen.getByTitle('Pause Voice')).toBeInTheDocument();
    expect(screen.getByText('Speaking')).toBeInTheDocument();
  });

  it('calls onPause when Pause button is clicked during playback', () => {
    render(<InterviewerVoiceAvatar {...defaultProps} isPlaying={true} />);
    fireEvent.click(screen.getByTitle('Pause Voice'));
    expect(defaultProps.onPause).toHaveBeenCalledOnce();
  });

  it('calls onReplay when the Replay button is clicked', () => {
    render(<InterviewerVoiceAvatar {...defaultProps} />);
    fireEvent.click(screen.getByTitle('Replay from Beginning'));
    expect(defaultProps.onReplay).toHaveBeenCalledOnce();
  });

  it('shows a loading spinner instead of Read Aloud when isLoading is true', () => {
    render(<InterviewerVoiceAvatar {...defaultProps} isLoading={true} />);
    expect(screen.queryByRole('button', { name: /Read Aloud/i })).not.toBeInTheDocument();
    // The spinner wrapper div should be present (no interactive button)
    expect(screen.queryByTitle('Pause Voice')).not.toBeInTheDocument();
  });

  it('shows "Browser Audio" label when isFallback is true and not playing', () => {
    render(<InterviewerVoiceAvatar {...defaultProps} isFallback={true} isPlaying={false} />);
    expect(screen.getByText('Browser Audio')).toBeInTheDocument();
  });
});
