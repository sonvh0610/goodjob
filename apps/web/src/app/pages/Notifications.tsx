import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { NotificationItem, NotificationsResponse } from '@org/shared';
import { apiRequest } from '../lib/api';
import { subscribeToRealtime } from '../lib/realtime';
import { getUserFacingError } from '../lib/user-errors';
import { useRealtimeNotifications } from '../features/notifications/context/RealtimeNotificationsContext';

function getNotificationTitle(item: NotificationItem): string {
  if (item.type === 'kudo_commented') {
    return 'New Comment';
  }
  if (item.type === 'kudo_received') {
    return 'Kudos Received';
  }
  if (item.type === 'reward_redeemed') {
    return 'Reward Redeemed';
  }
  return item.type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getNotificationMessage(item: NotificationItem): string {
  if (item.type === 'kudo_commented') {
    const commenterName =
      typeof item.payloadJson.commenterName === 'string'
        ? item.payloadJson.commenterName
        : 'A teammate';
    return `${commenterName} commented on a kudo in your feed.`;
  }
  if (item.type === 'kudo_received') {
    const senderName =
      typeof item.payloadJson.senderName === 'string'
        ? item.payloadJson.senderName
        : 'A teammate';
    const points =
      typeof item.payloadJson.points === 'number'
        ? item.payloadJson.points
        : null;
    return points
      ? `${senderName} sent you ${points} points.`
      : `${senderName} sent you kudos.`;
  }
  if (item.type === 'reward_redeemed') {
    return 'Your reward redemption has been created successfully.';
  }
  return 'You have a new account update.';
}

function getNotificationKudoId(item: NotificationItem): string | null {
  if (item.type !== 'kudo_received' && item.type !== 'kudo_commented') {
    return null;
  }
  return typeof item.payloadJson.kudoId === 'string'
    ? item.payloadJson.kudoId
    : null;
}

export default function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const { refreshUnreadCount } = useRealtimeNotifications();

  const onNotificationClick = async (item: NotificationItem) => {
    if (!item.readAt) {
      try {
        await apiRequest(`/notifications/${item.id}/read`, { method: 'POST' });
        setItems((prev) =>
          prev.map((current) =>
            current.id === item.id
              ? {
                  ...current,
                  readAt: new Date().toISOString(),
                }
              : current
          )
        );
        await refreshUnreadCount();
      } catch {
        // Keep navigation behavior even if marking read fails.
      }
    }

    const kudoId = getNotificationKudoId(item);
    if (kudoId) {
      navigate(`/feed/${kudoId}`);
    }
  };

  const loadNotifications = async (nextCursor?: string | null) => {
    const append = Boolean(nextCursor);
    try {
      if (append) {
        setLoadingMore(true);
      }
      const params = new URLSearchParams();
      params.set('limit', '20');
      if (nextCursor) params.set('cursor', nextCursor);

      const result = await apiRequest<NotificationsResponse>(
        `/notifications?${params.toString()}`
      );
      setItems((prev) => (append ? [...prev, ...result.items] : result.items));
      setCursor(result.nextCursor);
      setHasMore(Boolean(result.nextCursor));
      setError(null);
    } catch (requestError) {
      setError(
        getUserFacingError(requestError, {
          context: 'notifications-load',
          fallback: 'Unable to load notifications right now. Please try again.',
        })
      );
    } finally {
      if (append) {
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    void loadNotifications(null);
  }, []);

  useEffect(() => {
    return subscribeToRealtime({
      path: '/notifications/stream',
      onFallback: () => loadNotifications(null),
      onMessage: (event) => {
        const payload = JSON.parse(event.data) as {
          event: string;
        };
        if (payload.event === 'notification.new') {
          void loadNotifications(null);
        }
      },
    });
  }, []);

  const markAllRead = async () => {
    await apiRequest('/notifications/read', { method: 'POST' });
    await refreshUnreadCount();
    void loadNotifications(null);
  };

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && cursor) {
          void loadNotifications(cursor);
        }
      },
      { rootMargin: '220px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, hasMore, loadingMore]);

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-surface-container-low px-4 py-6 sm:px-6 lg:px-8 md:py-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
              Notifications
            </h1>
            <p className="mt-2 text-on-surface-variant">
              Live updates for kudos, wallet activity, and rewards.
            </p>
          </div>
          <button
            className="rounded-md border border-secondary-fixed/40 bg-secondary px-3 py-2 text-sm font-semibold text-on-secondary hover:bg-secondary-fixed transition-colors"
            onClick={() => void markAllRead()}
            type="button"
          >
            Mark all read
          </button>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        <div className="mt-6 space-y-3">
          {items.map((item) => {
            return (
              <article
                key={item.id}
                className={`rounded-2xl p-4 shadow-[0_12px_40px_rgba(55,39,77,0.06)] ${
                  item.readAt
                    ? 'bg-surface-container-lowest'
                    : 'border border-primary/30 bg-primary-container/25'
                } cursor-pointer transition-colors hover:bg-secondary-container/40`}
                onClick={() => {
                  void onNotificationClick(item);
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-on-surface">
                      {getNotificationTitle(item)}
                    </p>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {getNotificationMessage(item)}
                    </p>
                  </div>
                  {item.readAt ? null : (
                    <span className="rounded-full bg-primary px-2 py-1 text-[11px] font-bold text-on-primary">
                      Unread
                    </span>
                  )}
                </div>
                <p className="mt-3 text-xs text-on-surface-variant">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </article>
            );
          })}
        </div>
        {items.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-surface-container-lowest p-6 text-sm text-on-surface-variant">
            No notifications yet.
          </div>
        ) : null}
        {hasMore ? <div className="mt-3 h-8" ref={loadMoreRef} /> : null}
        {loadingMore ? (
          <p className="mt-2 text-sm text-on-surface-variant">
            Loading more notifications...
          </p>
        ) : null}
      </div>
    </div>
  );
}
