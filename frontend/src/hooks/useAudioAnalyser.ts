import { useRef, useState, useCallback } from 'react';

export interface AudioAnalysisData {
  /** Frequency bin data, 0–255 per bin, length = fftSize / 2 */
  frequencyData: Uint8Array;
  /** Time-domain waveform data, 0–255, length = fftSize / 2 */
  timeDomainData: Uint8Array;
  /** Instantaneous volume in [0, 1] */
  volume: number;
  /** Estimated words-per-minute from pace of significant energy peaks */
  estimatedWPM: number;
}

export interface UseAudioAnalyserReturn {
  isActive: boolean;
  analysisData: AudioAnalysisData | null;
  /** Attach the hook to an existing MediaStream (e.g. from getUserMedia) */
  connectStream: (stream: MediaStream) => void;
  /** Disconnect and clean up all Web Audio resources */
  disconnect: () => void;
}

const FFT_SIZE = 256; // 128 frequency bins — fine grained, low latency
const SMOOTHING = 0.8;

export function useAudioAnalyser(): UseAudioAnalyserReturn {
  const [isActive, setIsActive] = useState(false);
  const [analysisData, setAnalysisData] = useState<AudioAnalysisData | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const peakTimestampsRef = useRef<number[]>([]);
  const lastPeakTimeRef = useRef<number>(0);

  const disconnect = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsActive(false);
    setAnalysisData(null);
    peakTimestampsRef.current = [];
    lastPeakTimeRef.current = 0;
  }, []);

  const connectStream = useCallback((stream: MediaStream) => {
    disconnect();

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = SMOOTHING;
    analyserRef.current = analyser;

    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    sourceRef.current = source;

    const freqBins = analyser.frequencyBinCount; // FFT_SIZE / 2 = 128
    const freqBuf = new Uint8Array(freqBins);
    const timeBuf = new Uint8Array(freqBins);

    const tick = () => {
      analyser.getByteFrequencyData(freqBuf);
      analyser.getByteTimeDomainData(timeBuf);

      // Volume: RMS of frequency data normalised to [0, 1]
      let sum = 0;
      for (let i = 0; i < freqBuf.length; i++) sum += freqBuf[i] * freqBuf[i];
      const rms = Math.sqrt(sum / freqBuf.length);
      const volume = Math.min(rms / 255, 1);

      // WPM estimation: count energy peaks per second over a sliding 10s window
      const now = performance.now();
      const PEAK_THRESHOLD = 0.12;
      const MIN_PEAK_GAP_MS = 80; // ~750 peaks/min ceiling
      if (volume > PEAK_THRESHOLD && now - lastPeakTimeRef.current > MIN_PEAK_GAP_MS) {
        peakTimestampsRef.current.push(now);
        lastPeakTimeRef.current = now;
      }
      // Keep only peaks within the last 10 seconds
      const TEN_SEC_AGO = now - 10_000;
      peakTimestampsRef.current = peakTimestampsRef.current.filter(t => t > TEN_SEC_AGO);
      // Calibrated mapping: ~120 peaks/10s ≈ 150 WPM
      const peaksIn10s = peakTimestampsRef.current.length;
      const estimatedWPM = Math.round((peaksIn10s / 10) * 12.5);

      setAnalysisData({
        frequencyData: new Uint8Array(freqBuf),
        timeDomainData: new Uint8Array(timeBuf),
        volume,
        estimatedWPM
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    setIsActive(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [disconnect]);

  return { isActive, analysisData, connectStream, disconnect };
}
