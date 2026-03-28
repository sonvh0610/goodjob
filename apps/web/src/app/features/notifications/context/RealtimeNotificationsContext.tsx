import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import type {
  NotificationItem,
  NotificationsResponse,
  NotificationUnreadCountResponse,
} from '@org/shared';
import { useAuth } from '../../../context/AuthContext';
import { apiRequest } from '../../../lib/api';
import { subscribeToRealtime } from '../../../lib/realtime';

type RealtimeNotificationEvent = {
  event: string;
  payload?: Record<string, unknown>;
};

type RealtimeNotificationsContextValue = {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
};

const RealtimeNotificationsContext =
  createContext<RealtimeNotificationsContextValue | null>(null);

function buildBrowserNotification(payload: Record<string, unknown>): {
  title: string;
  body: string;
} {
  if (payload.type === 'kudo_commented') {
    const commenterName =
      typeof payload.commenterName === 'string' &&
      payload.commenterName.trim().length > 0
        ? payload.commenterName
        : 'A teammate';
    return {
      title: 'New comment on your kudo',
      body: `${commenterName} commented on a kudo in your feed.`,
    };
  }

  if (payload.type === 'kudo_received') {
    const senderName =
      typeof payload.senderName === 'string' &&
      payload.senderName.trim().length > 0
        ? payload.senderName
        : 'A teammate';
    const points =
      typeof payload.points === 'number' && Number.isFinite(payload.points)
        ? payload.points
        : null;

    return {
      title: 'You received kudos',
      body: points
        ? `${senderName} sent you ${points} points.`
        : `${senderName} sent you kudos.`,
    };
  }

  return {
    title: 'New notification',
    body: 'You have an update waiting in Goodjob.',
  };
}

function getNotificationTargetPath(payload: Record<string, unknown>): string {
  if (
    (payload.type === 'kudo_received' || payload.type === 'kudo_commented') &&
    typeof payload.kudoId === 'string'
  ) {
    return `/feed/${payload.kudoId}`;
  }
  return '/notifications';
}

async function notifyInBrowser(payload: Record<string, unknown>) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    return;
  }

  const content = buildBrowserNotification(payload);
  const targetPath = getNotificationTargetPath(payload);
  const browserNotification = new Notification(content.title, {
    body: content.body,
    tag: 'goodjob-notification',
    icon: '/favicon.ico',
  });

  browserNotification.onclick = () => {
    window.focus();
    window.location.assign(targetPath);
    browserNotification.close();
  };
}

type NotificationToast = {
  id: string;
  title: string;
  body: string;
  targetPath: string;
};

function toNotificationPayload(
  item: NotificationItem
): Record<string, unknown> {
  return {
    ...item.payloadJson,
    type: item.type,
  };
}

export function RealtimeNotificationsProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const hasSeededNotificationsRef = useRef(false);

  const pushToast = useCallback((payload: Record<string, unknown>) => {
    const content = buildBrowserNotification(payload);
    const targetPath = getNotificationTargetPath(payload);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const toast: NotificationToast = {
      id,
      title: content.title,
      body: content.body,
      targetPath,
    };
    setToasts((prev) => [toast, ...prev].slice(0, 4));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 5000);
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      const result = await apiRequest<NotificationUnreadCountResponse>(
        '/notifications/unread-count'
      );
      setUnreadCount(result.unreadCount);
    } catch {
      // Ignore unread count refresh errors to avoid breaking navigation.
    }
  }, [user]);

  const syncLatestNotifications = useCallback(
    async (mode: 'seed' | 'notify') => {
      if (!user) {
        seenNotificationIdsRef.current.clear();
        hasSeededNotificationsRef.current = false;
        return;
      }

      try {
        const result = await apiRequest<NotificationsResponse>(
          '/notifications?limit=10'
        );
        const nextSeenIds = new Set(seenNotificationIdsRef.current);
        const newlyDiscovered = result.items.filter(
          (item) => !nextSeenIds.has(item.id) && item.readAt === null
        );

        result.items.forEach((item) => {
          nextSeenIds.add(item.id);
        });

        if (nextSeenIds.size > 40) {
          const trimmed = result.items.map((item) => item.id);
          seenNotificationIdsRef.current = new Set(trimmed);
        } else {
          seenNotificationIdsRef.current = nextSeenIds;
        }

        if (mode === 'notify' && hasSeededNotificationsRef.current) {
          newlyDiscovered
            .slice()
            .reverse()
            .forEach((item) => {
              const payload = toNotificationPayload(item);
              pushToast(payload);
              void notifyInBrowser(payload);
            });
        }

        hasSeededNotificationsRef.current = true;
      } catch {
        // Ignore fallback polling errors to avoid breaking app shell behavior.
      }
    },
    [pushToast, user]
  );

  useEffect(() => {
    void refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (!user) {
      seenNotificationIdsRef.current.clear();
      hasSeededNotificationsRef.current = false;
      return;
    }

    void syncLatestNotifications('seed');
  }, [syncLatestNotifications, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      void Notification.requestPermission().catch(() => undefined);
    }

    return subscribeToRealtime({
      path: '/notifications/stream',
      onFallback: async () => {
        await Promise.all([
          refreshUnreadCount(),
          syncLatestNotifications('notify'),
        ]);
      },
      onMessage: (event) => {
        const payload = JSON.parse(event.data) as RealtimeNotificationEvent;
        if (payload.event !== 'notification.new') {
          return;
        }

        const details = payload.payload ?? {};
        if (details.status === 'connected') {
          return;
        }

        pushToast(details);
        void refreshUnreadCount();
        void notifyInBrowser(details);
      },
    });
  }, [pushToast, refreshUnreadCount, syncLatestNotifications, user]);

  const value = useMemo(
    () => ({
      unreadCount,
      refreshUnreadCount,
    }),
    [refreshUnreadCount, unreadCount]
  );

  return (
    <RealtimeNotificationsContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            className="pointer-events-auto rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-left shadow-lg transition-colors hover:bg-green-100"
            type="button"
            onClick={() => {
              window.location.assign(toast.targetPath);
            }}
          >
            <p className="text-sm font-bold text-on-surface">{toast.title}</p>
            <p className="mt-1 text-xs text-on-surface-variant">{toast.body}</p>
          </button>
        ))}
      </div>
    </RealtimeNotificationsContext.Provider>
  );
}

export function useRealtimeNotifications() {
  const value = useContext(RealtimeNotificationsContext);
  if (!value) {
    throw new Error(
      'useRealtimeNotifications must be used inside RealtimeNotificationsProvider'
    );
  }
  return value;
}
