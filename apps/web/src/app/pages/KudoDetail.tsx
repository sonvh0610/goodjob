import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { FeedItem, KudoMedia } from '@org/shared';
import { KudoCommentComposer } from '../features/kudos/components/KudoCommentComposer';
import { KudoMediaGrid } from '../features/kudos/components/KudoMediaGrid';
import { KudoMediaViewerModal } from '../features/kudos/components/KudoMediaViewerModal';
import { KudoTaggedText } from '../features/kudos/components/KudoTaggedText';
import { ReactionToggleGroup } from '../features/kudos/components/ReactionToggleGroup';
import { AppIcon } from '../components/ui/AppIcon';
import {
  createComment,
  fetchKudoWatchStatus,
  fetchKudoDetail,
  setKudoWatchStatus,
  toggleReaction,
} from '../features/kudos/api';
import { uploadManyMedia } from '../lib/media';
import { getUserFacingError } from '../lib/user-errors';

type ViewerState = {
  medias: KudoMedia[];
  index: number;
};

export default function KudoDetail() {
  const { kudoId } = useParams<{ kudoId: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<FeedItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentValue, setCommentValue] = useState('');
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [sendingComment, setSendingComment] = useState(false);
  const [viewer, setViewer] = useState<ViewerState | null>(null);
  const [watchMenuOpen, setWatchMenuOpen] = useState(false);

  const loadDetail = async () => {
    if (!kudoId) return;
    setLoading(true);
    try {
      const result = await fetchKudoDetail(kudoId);
      const watchState = await fetchKudoWatchStatus(kudoId);
      setItem(result);
      setItem((prev) =>
        prev ? { ...prev, watchedByViewer: watchState.watched } : prev
      );
      setError(null);
    } catch (requestError) {
      setError(
        getUserFacingError(requestError, {
          context: 'feed-load',
          fallback: 'Unable to load this kudo right now. Please try again.',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail();
  }, [kudoId]);

  const onToggleReaction = async (emoji: string) => {
    if (!item) return;
    try {
      await toggleReaction({ kudoId: item.id, emoji });
      await loadDetail();
    } catch (requestError) {
      setError(
        getUserFacingError(requestError, {
          context: 'feed-load',
          fallback: 'Unable to update reaction right now. Please try again.',
        })
      );
    }
  };

  const submitComment = async () => {
    if (!item) return;
    const text = commentValue.trim();
    if (!text && commentFiles.length === 0) return;

    setSendingComment(true);
    try {
      const mediaAssetIds =
        commentFiles.length > 0
          ? await uploadManyMedia(commentFiles)
          : undefined;
      await createComment({
        kudoId: item.id,
        text: text || undefined,
        mediaAssetIds,
      });
      setCommentValue('');
      setCommentFiles([]);
      await loadDetail();
    } catch (requestError) {
      setError(
        getUserFacingError(requestError, {
          context: 'comment-submit',
          fallback: 'Unable to send your comment right now. Please try again.',
        })
      );
    } finally {
      setSendingComment(false);
    }
  };

  const detailsTitle = useMemo(() => {
    if (!item) return 'Kudo Detail';
    return `${item.senderName} sent ${item.points} points`;
  }, [item]);

  const openViewer = (medias: KudoMedia[], index: number) => {
    setViewer({ medias, index });
  };

  const toggleWatch = async () => {
    if (!item) return;
    const nextWatched = !item.watchedByViewer;
    setItem((prev) =>
      prev ? { ...prev, watchedByViewer: nextWatched } : prev
    );
    setWatchMenuOpen(false);
    try {
      await setKudoWatchStatus(item.id, nextWatched);
    } catch (requestError) {
      setItem((prev) =>
        prev ? { ...prev, watchedByViewer: !nextWatched } : prev
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

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-surface-container-low px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
              Kudo Detail
            </h1>
            <p className="mt-2 text-on-surface-variant">{detailsTitle}</p>
          </div>
          <button
            className="rounded-full border border-secondary-fixed/40 bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary transition-colors hover:bg-secondary-fixed"
            type="button"
            onClick={() => navigate('/feed')}
          >
            Back to Feed
          </button>
        </div>

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
        {loading && !item ? (
          <div className="rounded-2xl bg-surface-container-lowest p-6 text-on-surface-variant">
            Loading kudo...
          </div>
        ) : null}

        {!loading && !item ? (
          <div className="rounded-2xl bg-surface-container-lowest p-6 text-on-surface-variant">
            Kudo not found.{' '}
            <Link className="text-primary underline" to="/feed">
              Go back to feed
            </Link>
            .
          </div>
        ) : null}

        {item ? (
          <article className="rounded-2xl bg-surface-container-lowest p-5 shadow-[0_12px_40px_rgba(55,39,77,0.06)]">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-on-surface-variant">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
                <h2 className="mt-1 text-lg font-bold text-on-surface">
                  {item.senderName} sent{' '}
                  <span className="text-primary">{item.points}</span> points to{' '}
                  {item.receiverName}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-primary-container px-2 py-1 font-semibold text-on-primary-container">
                    {item.coreValue}
                  </span>
                  {item.taggedUsers.map((taggedUser) => (
                    <span
                      key={taggedUser.id}
                      className="rounded-full bg-surface-container px-2 py-1 font-medium text-on-surface-variant"
                    >
                      @{taggedUser.displayName}
                    </span>
                  ))}
                </div>
                <KudoTaggedText
                  text={item.description}
                  className="mt-3 flex flex-wrap items-center gap-1 text-on-surface"
                />
              </div>
              <div className="relative">
                <button
                  aria-label="Feed item settings"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container"
                  type="button"
                  onClick={() => setWatchMenuOpen((prev) => !prev)}
                >
                  <AppIcon>more_horiz</AppIcon>
                </button>
                {watchMenuOpen ? (
                  <div className="absolute right-0 top-9 z-20 w-56 rounded-xl border border-surface-container bg-surface-container-lowest p-2 shadow-lg">
                    <button
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
                      type="button"
                      onClick={() => {
                        void toggleWatch();
                      }}
                    >
                      {item.watchedByViewer
                        ? 'Turn off notifications in this feed'
                        : 'Turn on notifications in this feed'}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {item.medias.length > 0 ? (
              <div className="mt-4">
                <KudoMediaGrid
                  medias={item.medias}
                  onOpen={openViewer}
                  alt="Kudo media"
                />
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <ReactionToggleGroup
                reactions={item.engagement.reactions}
                userReactions={item.engagement.userReactions}
                onToggle={(emoji) => void onToggleReaction(emoji)}
              />
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
                      <p className="text-sm text-on-surface">{comment.text}</p>
                    ) : (
                      <p className="text-sm italic text-on-surface-variant">
                        Media comment
                      </p>
                    )}

                    {comment.medias.length > 0 ? (
                      <div className="mt-2">
                        <KudoMediaGrid
                          medias={comment.medias}
                          onOpen={openViewer}
                          alt="Comment media"
                          className="grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-8"
                          cellClassName="relative aspect-square overflow-hidden rounded-lg border border-surface-container bg-surface-container-low cursor-pointer"
                          videoLabelClassName="rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-white"
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            <KudoCommentComposer
              value={commentValue}
              files={commentFiles}
              loading={sendingComment}
              onChange={setCommentValue}
              onFilesChange={setCommentFiles}
              onSubmit={() => void submitComment()}
              onError={(message) => {
                if (message) setError(message);
              }}
            />
          </article>
        ) : null}
      </div>

      <KudoMediaViewerModal
        viewer={viewer}
        onClose={() => setViewer(null)}
        onPrev={() =>
          setViewer((prev) =>
            prev
              ? {
                  ...prev,
                  index:
                    (prev.index - 1 + prev.medias.length) % prev.medias.length,
                }
              : prev
          )
        }
        onNext={() =>
          setViewer((prev) =>
            prev
              ? {
                  ...prev,
                  index: (prev.index + 1) % prev.medias.length,
                }
              : prev
          )
        }
      />
    </div>
  );
}
