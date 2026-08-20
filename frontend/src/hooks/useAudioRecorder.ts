import { useState, useRef, useCallback, useEffect } from 'react';

export type RecorderState = 'idle' | 'recording' | 'processing' | 'error';

export interface UseAudioRecorderReturn {
  state: RecorderState;
  recordingTime: number;
  audioBlob: Blob | null;
  audioLevels: number[];
  volume: number;
  errorMessage: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  resetRecording: () => void;
  isPermissionDenied: boolean;
  /** The live MediaStream (set while recording, null otherwise) */
  mediaStream: MediaStream | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [state, setState] = useState<RecorderState>('idle');
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>([10, 15, 12, 20, 15, 10]);
  const [volume, setVolume] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const updateAudioLevels = useCallback(() => {
    if (!analyserRef.current || state !== 'recording') return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate volume
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const avg = sum / bufferLength;
    setVolume(Math.min(100, Math.round((avg / 128) * 100)));

    // Sample 8 frequency bands for visualizer bars
    const bands: number[] = [];
    const step = Math.floor(bufferLength / 8);
    for (let i = 0; i < 8; i++) {
      const val = dataArray[i * step] || 0;
      // Scale from 0 to 100 with minimum height of 15%
      bands.push(Math.max(15, Math.min(100, Math.round((val / 255) * 100))));
    }
    setAudioLevels(bands);

    animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
  }, [state]);

  const startRecording = useCallback(async () => {
    setErrorMessage(null);
    setAudioBlob(null);
    setRecordingTime(0);
    setIsPermissionDenied(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      // Setup Web Audio Analyser
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      // Determine supported mimeType
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.start(250); // Collect data every 250ms
      setState('recording');

      // Start timer
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Start visualizer loop
      animationFrameRef.current = requestAnimationFrame(updateAudioLevels);

    } catch (err: any) {
      console.error('Microphone access error:', err);
      setState('error');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setIsPermissionDenied(true);
        setErrorMessage('Microphone access denied. Please click the camera/mic icon in your address bar to grant permission.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No microphone found. Please connect a microphone and reload.');
      } else {
        setErrorMessage(err.message || 'Failed to start audio recording.');
      }
    }
  }, [updateAudioLevels]);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        setState('idle');
        resolve(null);
        return;
      }

      setState('processing');

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const finalBlob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(finalBlob);

        // Stop stream tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }

        resolve(finalBlob);
      };

      recorder.stop();
    });
  }, []);

  const resetRecording = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    chunksRef.current = [];
    setAudioBlob(null);
    setRecordingTime(0);
    setErrorMessage(null);
    setState('idle');
  }, []);

  return {
    state,
    recordingTime,
    audioBlob,
    audioLevels,
    volume,
    errorMessage,
    startRecording,
    stopRecording,
    resetRecording,
    isPermissionDenied,
    mediaStream: streamRef.current
  };
}
