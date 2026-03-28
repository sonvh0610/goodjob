import { shouldUseWebSocketTransport, wsUrl } from './api';

type RealtimeSubscriptionOptions = {
  path: string;
  onMessage: (event: MessageEvent<string>) => void;
  onFallback: () => void | Promise<void>;
  fallbackIntervalMs?: number;
};

const DEFAULT_FALLBACK_INTERVAL_MS = 15000;

export function subscribeToRealtime({
  path,
  onMessage,
  onFallback,
  fallbackIntervalMs = DEFAULT_FALLBACK_INTERVAL_MS,
}: RealtimeSubscriptionOptions): () => void {
  let socket: WebSocket | null = null;
  let fallbackTimer: number | null = null;
  let disposed = false;

  const startFallback = () => {
    if (fallbackTimer !== null || typeof window === 'undefined') {
      return;
    }

    void onFallback();
    fallbackTimer = window.setInterval(() => {
      void onFallback();
    }, fallbackIntervalMs);
  };

  const stopFallback = () => {
    if (fallbackTimer === null || typeof window === 'undefined') {
      return;
    }

    window.clearInterval(fallbackTimer);
    fallbackTimer = null;
  };

  if (!shouldUseWebSocketTransport()) {
    startFallback();
    return () => {
      disposed = true;
      stopFallback();
    };
  }

  socket = new WebSocket(wsUrl(path));
  socket.onopen = () => {
    stopFallback();
  };
  socket.onmessage = onMessage;
  socket.onerror = () => {
    startFallback();
  };
  socket.onclose = () => {
    if (disposed) {
      return;
    }
    startFallback();
  };

  return () => {
    disposed = true;
    stopFallback();
    socket?.close();
  };
}
