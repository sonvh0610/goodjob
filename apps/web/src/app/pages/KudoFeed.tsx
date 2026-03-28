import { useEffect, useState } from 'react';
import { apiRequest, wsUrl } from '../lib/api';
import { uploadManyMedia } from '../lib/media';
import { getUserFacingError } from '../lib/user-errors';
import { KudosMediaDropzone } from '../components/media/KudosMediaDropzone';

interface RecentReaction {
  id: string;
  emoji: string;
  createdAt: string;
  userId: string;
  userName: string;
}

interface RecentComment {
  id: string;
  text: string;
  mediaAssetId: string | null;
  medias: {
    mediaAssetId: string;
    mediaType: 'image' | 'video';
    mediaUrl: string | null;
  }[];
  createdAt: string;
  userId: string;
  userName: string;
}

interface FeedItem {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  senderAvatarUrl: string | null;
  description: string;
  points: number;
  medias: {
    mediaAssetId: string;
    mediaType: 'image' | 'video';
    mediaUrl: string | null;
  }[];
  createdAt: string;
  engagement: {
    reactions: { emoji: string; count: number }[];
    userReactions: string[];
    commentsCount: number;
    recentReactions: RecentReaction[];
    recentComments: RecentComment[];
  };
}

interface FeedResponse {
  items: FeedItem[];
  nextCursor: string | null;
}

const DEFAULT_REACTION_EMOJIS = ['👏', '🔥', '🙌', '🎉'];

export default function KudoFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [commentFile, setCommentFile] = useState<Record<string, File[]>>({});
  const [sendingComment, setSendingComment] = useState<Record<string, boolean>>(
    {}
  );
  const [viewer, setViewer] = useState<{
    medias: FeedItem['medias'];
    index: number;
  } | null>(null);

  const loadFeed = async (nextCursor?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest<FeedResponse>(
        `/feed${nextCursor ? `?cursor=${encodeURIComponent(nextCursor)}` : ''}`
      );
      setItems((prev) =>
        nextCursor ? [...prev, ...result.items] : result.items
      );
      setCursor(result.nextCursor);
    } catch (requestError) {
      setError(
        getUserFacingError(requestError, {
          context: 'feed-load',
          fallback:
            'Unable to load the kudos feed right now. Please try again.',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async (kudoId: string) => {
    const text = (commentDraft[kudoId] ?? '').trim();
    const files = commentFile[kudoId] ?? [];
    if (!text && files.length === 0) return;

    setSendingComment((prev) => ({ ...prev, [kudoId]: true }));
    setError(null);
    try {
      const mediaAssetIds =
        files.length > 0 ? await uploadManyMedia(files) : undefined;
      await apiRequest(`/kudos/${kudoId}/comments`, {
        method: 'POST',
        body: {
          text: text || undefined,
          mediaAssetIds,
        },
      });
      setCommentDraft((prev) => ({ ...prev, [kudoId]: '' }));
      setCommentFile((prev) => ({ ...prev, [kudoId]: [] }));
      await loadFeed(null);
    } catch (requestError) {
      setError(
        getUserFacingError(requestError, {
          context: 'comment-submit',
          fallback: 'Unable to send your comment right now. Please try again.',
        })
      );
    } finally {
      setSendingComment((prev) => ({ ...prev, [kudoId]: false }));
    }
  };

  const toggleReaction = async (kudoId: string, emoji: string) => {
    try {
      await apiRequest(`/kudos/${kudoId}/reactions`, {
        method: 'POST',
        body: { emoji },
      });
      await loadFeed(null);
    } catch (requestError) {
      setError(
        getUserFacingError(requestError, {
          context: 'feed-load',
          fallback: 'Unable to update reaction right now. Please try again.',
        })
      );
    }
  };

  useEffect(() => {
    void loadFeed(null);
  }, []);

  useEffect(() => {
    const socket = new WebSocket(wsUrl('/notifications/stream'));
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data) as { event: string };
      if (
        payload.event === 'feed.new' ||
        payload.event === 'feed.reaction' ||
        payload.event === 'feed.comment'
      ) {
        void loadFeed(null);
      }
    };
    return () => {
      socket.close();
    };
  }, []);

  const currentViewerMedia = viewer ? viewer.medias[viewer.index] : null;

  return (
    <div className="min-h-[calc(100vh-5rem)] px-4 py-6 sm:px-6 lg:px-8 md:py-8 bg-surface-container-low">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight">
              Kudos Feed
            </h1>
            <p className="mt-2 text-on-surface-variant">
              Live recognition stream with reactions and media comments.
            </p>
          </div>
          <button
            className="rounded-full border border-secondary-fixed/40 bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary hover:bg-secondary-fixed transition-colors"
            onClick={() => void loadFeed(null)}
            type="button"
          >
            Refresh
          </button>
        </header>

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        <div className="space-y-4">
          {items.map((item) => {
            const reactionCountMap = new Map(
              item.engagement.reactions.map((reaction) => [
                reaction.emoji,
                reaction.count,
              ])
            );
            const reactionEmojis = Array.from(
              new Set([
                ...DEFAULT_REACTION_EMOJIS,
                ...item.engagement.reactions.map((r) => r.emoji),
              ])
            );

            return (
              <article
                key={item.id}
                className="rounded-2xl bg-surface-container-lowest p-5 shadow-[0_12px_40px_rgba(55,39,77,0.06)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-on-surface-variant">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                    <h2 className="mt-1 font-bold text-on-surface text-lg">
                      {item.senderName} sent{' '}
                      <span className="text-primary">{item.points}</span> points
                    </h2>
                    <p className="mt-2 text-on-surface">{item.description}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary-container px-3 py-1 text-xs font-bold text-on-primary-container">
                    +{item.points}
                  </span>
                </div>

                {item.medias.length > 0 ? (
                  <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                    {item.medias.map((media, index) => (
                      <button
                        key={media.mediaAssetId}
                        type="button"
                        className="relative aspect-square overflow-hidden rounded-xl border border-surface-container bg-surface-container-low cursor-pointer"
                        onClick={() =>
                          setViewer({ medias: item.medias, index })
                        }
                      >
                        {media.mediaType === 'video' ? (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">
                              Video
                            </span>
                          </div>
                        ) : (
                          <img
                            src={media.mediaUrl ?? undefined}
                            alt="Kudo media"
                            className="h-full w-full object-cover"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {reactionEmojis.map((emoji) => {
                    const active =
                      item.engagement.userReactions.includes(emoji);
                    const count = reactionCountMap.get(emoji) ?? 0;
                    return (
                      <button
                        key={`${item.id}-${emoji}`}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'bg-primary text-on-primary'
                            : 'border border-secondary-fixed/40 bg-secondary text-on-secondary hover:bg-secondary-fixed'
                        }`}
                        onClick={() => void toggleReaction(item.id, emoji)}
                        type="button"
                      >
                        {emoji} {count}
                      </button>
                    );
                  })}
                  <span className="text-xs text-on-surface-variant">
                    {item.engagement.commentsCount} comments
                  </span>
                </div>

                {item.engagement.recentComments.length > 0 ? (
                  <div className="mt-10 space-y-2">
                    {item.engagement.recentComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-xl bg-surface-container-low px-3 py-2"
                      >
                        <p className="text-xs text-on-surface-variant">
                          {comment.userName}
                        </p>
                        {comment.text ? (
                          <p className="text-sm text-on-surface">
                            {comment.text}
                          </p>
                        ) : (
                          <p className="text-sm italic text-on-surface-variant">
                            Media comment
                          </p>
                        )}
                        {comment.medias.length > 0 ? (
                          <div className="mt-2 grid grid-cols-12 gap-2">
                            {comment.medias.map((media) => (
                              <button
                                key={media.mediaAssetId}
                                type="button"
                                className="relative aspect-square overflow-hidden rounded-lg border border-surface-container bg-surface-container-low cursor-pointer"
                                onClick={() =>
                                  setViewer({
                                    medias: comment.medias,
                                    index: comment.medias.findIndex(
                                      (item) =>
                                        item.mediaAssetId === media.mediaAssetId
                                    ),
                                  })
                                }
                              >
                                {media.mediaType === 'video' ? (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <span className="rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-white">
                                      Video
                                    </span>
                                  </div>
                                ) : (
                                  <img
                                    src={media.mediaUrl ?? undefined}
                                    alt="Comment media"
                                    className="h-full w-full object-cover"
                                  />
                                )}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="mt-10 space-y-2">
                  <textarea
                    className="w-full rounded-xl border border-surface-container bg-white px-3 py-2 text-sm"
                    rows={3}
                    placeholder="Add a comment"
                    value={commentDraft[item.id] ?? ''}
                    onChange={(e) =>
                      setCommentDraft((prev) => ({
                        ...prev,
                        [item.id]: e.target.value,
                      }))
                    }
                  />
                  <KudosMediaDropzone
                    files={commentFile[item.id] ?? []}
                    onFilesChange={(files) =>
                      setCommentFile((prev) => ({
                        ...prev,
                        [item.id]: files,
                      }))
                    }
                    maxFiles={5}
                    onError={(message) => {
                      if (message) setError(message);
                    }}
                  />
                  <button
                    className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary disabled:opacity-60"
                    type="button"
                    disabled={Boolean(sendingComment[item.id])}
                    onClick={() => void submitComment(item.id)}
                  >
                    {sendingComment[item.id] ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {cursor ? (
          <button
            className="mt-6 rounded-full bg-primary px-6 py-3 font-bold text-on-primary disabled:opacity-60"
            disabled={loading}
            onClick={() => void loadFeed(cursor)}
            type="button"
          >
            Load More
          </button>
        ) : null}
      </div>

      {viewer && currentViewerMedia ? (
        <div className="fixed inset-0 z-50 bg-black/80 p-4 flex items-center justify-center">
          <button
            type="button"
            className="absolute right-4 top-4 h-10 w-10 rounded-full bg-black/50 text-xl text-white cursor-pointer"
            onClick={() => setViewer(null)}
          >
            ×
          </button>
          <div className="max-h-[90vh] max-w-[90vw]">
            {currentViewerMedia.mediaType === 'video' ? (
              <video
                src={currentViewerMedia.mediaUrl ?? undefined}
                controls
                className="max-h-[80vh] max-w-[90vw] rounded-xl"
              />
            ) : (
              <img
                src={currentViewerMedia.mediaUrl ?? undefined}
                alt="Kudo media detail"
                className="max-h-[80vh] max-w-[90vw] rounded-xl object-contain"
              />
            )}
            {viewer.medias.length > 1 ? (
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  className="rounded-full bg-white/15 px-3 py-1 text-xs text-white cursor-pointer"
                  onClick={() =>
                    setViewer((prev) =>
                      prev
                        ? {
                            ...prev,
                            index:
                              (prev.index - 1 + prev.medias.length) %
                              prev.medias.length,
                          }
                        : prev
                    )
                  }
                >
                  Prev
                </button>
                <span className="text-xs text-white/90">
                  {viewer.index + 1} / {viewer.medias.length}
                </span>
                <button
                  type="button"
                  className="rounded-full bg-white/15 px-3 py-1 text-xs text-white cursor-pointer"
                  onClick={() =>
                    setViewer((prev) =>
                      prev
                        ? {
                            ...prev,
                            index: (prev.index + 1) % prev.medias.length,
                          }
                        : prev
                    )
                  }
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
