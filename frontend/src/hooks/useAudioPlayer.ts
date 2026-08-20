import { useState, useEffect, useRef, useCallback } from 'react';
import { synthesizeSpeechAudio } from '../services/api';

export interface UseAudioPlayerReturn {
  isPlaying: boolean;
  isLoading: boolean;
  isFallback: boolean;
  progress: number;
  duration: number;
  speak: (text: string, voice?: string, speed?: number) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setProgress(0);
  }, []);

  const speakWithBrowser = useCallback((text: string, speed: number = 1.0) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsPlaying(false);
      setIsLoading(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed;
    utterance.pitch = 1.0;

    // Try finding an English natural voice
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setIsFallback(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setProgress(100);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback(async (text: string, voice: string = 'nova', speed: number = 1.0) => {
    cleanupAudio();
    if (!text || !text.trim()) return;

    setIsLoading(true);
    setIsFallback(false);

    try {
      const { audioBlob, fallbackToBrowser } = await synthesizeSpeechAudio(text, voice, speed);

      if (fallbackToBrowser || !audioBlob) {
        speakWithBrowser(text, speed);
        return;
      }

      const blobUrl = URL.createObjectURL(audioBlob);
      currentBlobUrlRef.current = blobUrl;

      const audio = new Audio(blobUrl);
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        setDuration(audio.duration || 0);
        setIsLoading(false);
      };

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => {
        setIsPlaying(false);
        setProgress(100);
      };

      audio.onerror = () => {
        // If audio decoding failed, fallback to browser speech
        cleanupAudio();
        speakWithBrowser(text, speed);
      };

      await audio.play();
    } catch {
      speakWithBrowser(text, speed);
    } finally {
      setIsLoading(false);
    }
  }, [cleanupAudio, speakWithBrowser]);

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    }
  }, []);

  const stop = useCallback(() => {
    cleanupAudio();
  }, [cleanupAudio]);

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  return {
    isPlaying,
    isLoading,
    isFallback,
    progress,
    duration,
    speak,
    stop,
    pause,
    resume
  };
}
