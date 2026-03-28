import { useEffect, useMemo, useState } from 'react';
import { uploadManyMedia } from '../../../lib/media';
import { subscribeToRealtime } from '../../../lib/realtime';
import { getUserFacingError } from '../../../lib/user-errors';
import type { FeedItem, KudoMedia } from '@org/shared';
import {
  createComment,
  fetchFeed,
  setKudoWatchStatus,
  toggleReaction,
} from '../api';
import { extractUniqueTags, normalizeTag } from '../tagging';

type ViewerState = {
  medias: KudoMedia[];
  index: number;
};

export function useKudoFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [commentFiles, setCommentFiles] = useState<Record<string, File[]>>({});
  const [sendingComment, setSendingComment] = useState<Record<string, boolean>>(
    {}
  );
  const [viewer, setViewer] = useState<ViewerState | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    if (!selectedTag) return items;
    return items.filter((item) =>
      extractUniqueTags(item.description)
        .map((tag) => normalizeTag(tag))
        .includes(selectedTag)
    );
  }, [items, selectedTag]);

  const loadFeed = async (nextCursor?: string | null) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFeed(nextCursor);
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
    const files = commentFiles[kudoId] ?? [];
    if (!text && files.length === 0) return;

    setSendingComment((prev) => ({ ...prev, [kudoId]: true }));
    setError(null);
    try {
      const mediaAssetIds =
        files.length > 0 ? await uploadManyMedia(files) : undefined;
      await createComment({
        kudoId,
        text: text || undefined,
        mediaAssetIds,
      });
      setCommentDraft((prev) => ({ ...prev, [kudoId]: '' }));
      setCommentFiles((prev) => ({ ...prev, [kudoId]: [] }));
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

  const onToggleReaction = async (kudoId: string, emoji: string) => {
    try {
      await toggleReaction({ kudoId, emoji });
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

  const toggleWatch = async (kudoId: string, watched: boolean) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === kudoId ? { ...item, watchedByViewer: watched } : item
      )
    );
    try {
      await setKudoWatchStatus(kudoId, watched);
    } catch (requestError) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === kudoId ? { ...item, watchedByViewer: !watched } : item
        )
      );
      setError(
        getUserFacingError(requestError, {
          context: 'feed-load',
          fallback:
            'Unable to update feed notification settings right now. Please try again.',
        })
      );
    }
  };

  const openViewer = (medias: KudoMedia[], index: number) => {
    setViewer({ medias, index });
  };

  const closeViewer = () => {
    setViewer(null);
  };

  const viewPrev = () => {
    setViewer((prev) =>
      prev
        ? {
            ...prev,
            index: (prev.index - 1 + prev.medias.length) % prev.medias.length,
          }
        : prev
    );
  };

  const viewNext = () => {
    setViewer((prev) =>
      prev
        ? {
            ...prev,
            index: (prev.index + 1) % prev.medias.length,
          }
        : prev
    );
  };

  useEffect(() => {
    void loadFeed(null);
  }, []);

  useEffect(() => {
    return subscribeToRealtime({
      path: '/notifications/stream',
      onFallback: () => loadFeed(null),
      onMessage: (event) => {
        const payload = JSON.parse(event.data) as { event: string };
        if (
          payload.event === 'feed.new' ||
          payload.event === 'feed.reaction' ||
          payload.event === 'feed.comment'
        ) {
          void loadFeed(null);
        }
      },
    });
  }, []);

  return {
    items,
    filteredItems,
    cursor,
    loading,
    error,
    setError,
    commentDraft,
    setCommentDraft,
    commentFiles,
    setCommentFiles,
    sendingComment,
    viewer,
    loadFeed,
    submitComment,
    onToggleReaction,
    toggleWatch,
    openViewer,
    closeViewer,
    viewPrev,
    viewNext,
    selectedTag,
    setSelectedTag,
  };
}
