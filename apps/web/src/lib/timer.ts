import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'gymapp-rest-timer';

interface StoredTimer {
  endAt?: number;
  remainingMs?: number;
  totalSeconds: number;
}

export interface RestTimerState {
  remainingSeconds: number;
  isRunning: boolean;
  totalSeconds: number;
}

export interface UseRestTimerReturn extends RestTimerState {
  start: (seconds: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

export function useRestTimer(onExpire?: () => void): UseRestTimerReturn {
  const [state, setState] = useState<RestTimerState>({
    remainingSeconds: 0,
    isRunning: false,
    totalSeconds: 0,
  });
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const sync = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setState((prev) => (prev.isRunning ? { ...prev, isRunning: false } : prev));
      return;
    }
    try {
      const parsed: StoredTimer = JSON.parse(stored);
      const remainingMs = parsed.endAt !== undefined ? parsed.endAt - Date.now() : parsed.remainingMs ?? 0;
      if (remainingMs <= 0) {
        localStorage.removeItem(STORAGE_KEY);
        setState({ remainingSeconds: 0, isRunning: false, totalSeconds: parsed.totalSeconds });
        onExpireRef.current?.();
      } else {
        setState({
          remainingSeconds: Math.max(0, Math.ceil(remainingMs / 1000)),
          isRunning: parsed.endAt !== undefined,
          totalSeconds: parsed.totalSeconds,
        });
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    sync();
    const interval = setInterval(sync, 1000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [sync]);

  const start = useCallback(
    (seconds: number) => {
      if (seconds <= 0) return;
      const endAt = Date.now() + seconds * 1000;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ endAt, totalSeconds: seconds }));
      setState({ remainingSeconds: seconds, isRunning: true, totalSeconds: seconds });
    },
    []
  );

  const pause = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed: StoredTimer = JSON.parse(stored);
      const remainingMs = parsed.endAt !== undefined ? Math.max(0, parsed.endAt - Date.now()) : parsed.remainingMs ?? 0;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ remainingMs, totalSeconds: parsed.totalSeconds }));
      setState((prev) => ({
        ...prev,
        remainingSeconds: Math.max(0, Math.ceil(remainingMs / 1000)),
        isRunning: false,
      }));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const resume = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed: StoredTimer = JSON.parse(stored);
      const remainingMs = parsed.remainingMs ?? 0;
      if (remainingMs > 0) {
        const endAt = Date.now() + remainingMs;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ endAt, totalSeconds: parsed.totalSeconds }));
        setState({
          remainingSeconds: Math.max(0, Math.ceil(remainingMs / 1000)),
          isRunning: true,
          totalSeconds: parsed.totalSeconds,
        });
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setState({ remainingSeconds: 0, isRunning: false, totalSeconds: parsed.totalSeconds });
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ remainingSeconds: 0, isRunning: false, totalSeconds: 0 });
  }, []);

  return { ...state, start, pause, resume, reset };
}
