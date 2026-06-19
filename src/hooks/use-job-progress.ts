import { useCallback, useEffect, useReducer, useRef } from 'react';

import { tokenStorage } from '@/lib/token-storage';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface JobProgress {
  progress: number;       // 0-100
  status: string;         // e.g. "Analysing video…"
  estimatedSeconds: number | null;
}

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'polling' | 'error';

interface State extends JobProgress {
  connectionState: ConnectionState;
}

type Action =
  | { type: 'WS_OPEN' }
  | { type: 'WS_EVENT'; payload: Partial<JobProgress> }
  | { type: 'RECONNECTING'; attempt: number }
  | { type: 'POLLING' }
  | { type: 'POLL_RESULT'; payload: Partial<JobProgress> }
  | { type: 'ERROR' };

// ─── Reducer (batches all updates into one render) ────────────────────────────

const INITIAL: State = {
  progress: 0,
  status: 'Connecting…',
  estimatedSeconds: null,
  connectionState: 'connecting',
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'WS_OPEN':
      return { ...state, connectionState: 'connected', status: 'Connected' };
    case 'WS_EVENT':
      return { ...state, ...action.payload, connectionState: 'connected' };
    case 'RECONNECTING':
      return { ...state, connectionState: 'reconnecting', status: `Reconnecting… (attempt ${action.attempt}/5)` };
    case 'POLLING':
      return { ...state, connectionState: 'polling', status: 'Live updates unavailable — polling' };
    case 'POLL_RESULT':
      return { ...state, ...action.payload };
    case 'ERROR':
      return { ...state, connectionState: 'error', status: 'Connection failed' };
    default:
      return state;
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_RETRIES = 5;
const POLL_INTERVAL_MS = 10_000;
const THROTTLE_MS = 200;

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Streams job progress via WebSocket. Falls back to polling after 5 failed
 * reconnection attempts (exponential backoff: 1s, 2s, 4s, 8s, 16s).
 *
 * @param jobId   BullMQ job ID to watch
 * @param wsUrl   WebSocket base URL, e.g. "ws://api.example.com"
 * @param pollFn  Called every 10 s when WS is unavailable; must return JobProgress
 */
export function useJobProgress(
  jobId: string | null,
  wsUrl: string,
  pollFn: (jobId: string) => Promise<JobProgress>,
) {
  const [state, rawDispatch] = useReducer(reducer, INITIAL);

  // Throttle: coalesce dispatches to max 1 per THROTTLE_MS
  const pendingRef = useRef<Action | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dispatch = useCallback((action: Action) => {
    pendingRef.current = action;
    if (!timerRef.current) {
      timerRef.current = setTimeout(() => {
        if (pendingRef.current) rawDispatch(pendingRef.current);
        pendingRef.current = null;
        timerRef.current = null;
      }, THROTTLE_MS);
    }
  }, []);

  const retryRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const startPolling = useCallback((id: string) => {
    dispatch({ type: 'POLLING' });
    const tick = async () => {
      if (!isMountedRef.current) return;
      try {
        const result = await pollFn(id);
        dispatch({ type: 'POLL_RESULT', payload: result });
      } catch { /* ignore poll errors */ }
      if (isMountedRef.current) {
        pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
      }
    };
    tick();
  }, [dispatch, pollFn]);

  const connect = useCallback(async (id: string) => {
    const token = await tokenStorage.get();
    if (!isMountedRef.current) return;

    const url = `${wsUrl}/jobs/progress?jobId=${encodeURIComponent(id)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMountedRef.current) return;
      retryRef.current = 0;
      dispatch({ type: 'WS_OPEN' });
    };

    ws.onmessage = (e) => {
      if (!isMountedRef.current) return;
      try {
        const data: Partial<JobProgress> = JSON.parse(e.data as string);
        dispatch({ type: 'WS_EVENT', payload: data });
      } catch { /* malformed frame — ignore */ }
    };

    ws.onerror = () => { /* handled in onclose */ };

    ws.onclose = () => {
      if (!isMountedRef.current) return;
      const attempt = retryRef.current + 1;
      if (attempt > MAX_RETRIES) {
        dispatch({ type: 'POLLING' });
        startPolling(id);
        return;
      }
      retryRef.current = attempt;
      dispatch({ type: 'RECONNECTING', attempt });
      const backoff = Math.min(1000 * 2 ** (attempt - 1), 30_000);
      setTimeout(() => {
        if (isMountedRef.current) connect(id);
      }, backoff);
    };
  }, [dispatch, startPolling, wsUrl]);

  useEffect(() => {
    if (!jobId) return;
    isMountedRef.current = true;
    connect(jobId);

    return () => {
      isMountedRef.current = false;
      wsRef.current?.close();
      stopPolling();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [jobId, connect]);

  return state;
}
