import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

// ─── Mock the API module ───────────────────────────────────────────────────────
vi.mock('../services/api', () => ({
  synthesizeSpeechAudio: vi.fn()
}));

import { synthesizeSpeechAudio } from '../services/api';
const mockSynthesize = vi.mocked(synthesizeSpeechAudio);

// ─── Mock browser Speech Synthesis ────────────────────────────────────────────
const mockCancel = vi.fn();
const mockSpeak = vi.fn();
const mockPause = vi.fn();
const mockResume = vi.fn();
const mockGetVoices = vi.fn(() => []);

Object.defineProperty(window, 'speechSynthesis', {
  value: {
    cancel: mockCancel,
    speak: mockSpeak,
    pause: mockPause,
    resume: mockResume,
    getVoices: mockGetVoices,
    speaking: false,
    paused: false
  },
  writable: true
});

// ─── Stub SpeechSynthesisUtterance (not defined in jsdom) ────────────────────
class MockSpeechSynthesisUtterance {
  text: string;
  rate = 1.0;
  pitch = 1.0;
  voice: SpeechSynthesisVoice | null = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) { this.text = text; }
}
// @ts-expect-error - mock for jsdom environment
global.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;

// ─── Mock HTMLAudioElement ─────────────────────────────────────────────────────
class MockAudio {
  src = '';
  onloadedmetadata: (() => void) | null = null;
  ontimeupdate: (() => void) | null = null;
  onplay: (() => void) | null = null;
  onpause: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  duration = 0;
  currentTime = 0;
  paused = false;

  play = vi.fn(() => {
    this.onplay?.();
    return Promise.resolve();
  });
  pause = vi.fn(() => {
    this.paused = true;
    this.onpause?.();
  });
}

global.Audio = MockAudio as unknown as typeof Audio;
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('useAudioPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default idle state', () => {
    const { result } = renderHook(() => useAudioPlayer());
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFallback).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  it('should play OpenAI TTS audio when API returns a valid blob', async () => {
    const fakeBlob = new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/mpeg' });
    mockSynthesize.mockResolvedValueOnce({ audioBlob: fakeBlob, fallbackToBrowser: false });

    const { result } = renderHook(() => useAudioPlayer());

    await act(async () => {
      await result.current.speak('Tell me about yourself.');
    });

    expect(mockSynthesize).toHaveBeenCalledWith('Tell me about yourself.', 'nova', 1.0);
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(fakeBlob);
  });

  it('should fall back to browser speech synthesis when API returns fallbackToBrowser=true', async () => {
    mockSynthesize.mockResolvedValueOnce({ audioBlob: null, fallbackToBrowser: true });

    const { result } = renderHook(() => useAudioPlayer());

    await act(async () => {
      await result.current.speak('What is your greatest strength?');
    });

    expect(mockSpeak).toHaveBeenCalled();
    const utterance: SpeechSynthesisUtterance = mockSpeak.mock.calls[0][0];
    expect(utterance.text).toBe('What is your greatest strength?');
  });

  it('should fall back to browser speech when API call throws', async () => {
    mockSynthesize.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAudioPlayer());

    await act(async () => {
      await result.current.speak('Describe a challenge you faced.');
    });

    expect(mockSpeak).toHaveBeenCalled();
  });

  it('should call speechSynthesis.cancel on stop()', async () => {
    mockSynthesize.mockResolvedValueOnce({ audioBlob: null, fallbackToBrowser: true });

    const { result } = renderHook(() => useAudioPlayer());

    await act(async () => {
      await result.current.speak('Some text');
    });

    act(() => {
      result.current.stop();
    });

    expect(mockCancel).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);
  });

  it('should not call synthesize for empty text', async () => {
    const { result } = renderHook(() => useAudioPlayer());

    await act(async () => {
      await result.current.speak('');
    });

    expect(mockSynthesize).not.toHaveBeenCalled();
    expect(mockSpeak).not.toHaveBeenCalled();
  });
});
