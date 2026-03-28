import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KudosMediaDropzone } from '../components/media/KudosMediaDropzone';
import { apiRequest } from '../lib/api';
import { uploadManyMedia } from '../lib/media';
import { getUserFacingError } from '../lib/user-errors';

interface UserOption {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
}

export default function SendKudos() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [receiverId, setReceiverId] = useState('');
  const [points, setPoints] = useState(25);
  const [description, setDescription] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const usersResponse = await apiRequest<{ items: UserOption[] }>(
        '/users?limit=50'
      );
      setUsers(usersResponse.items);
    })().catch((requestError: unknown) => {
      setError(
        getUserFacingError(requestError, {
          context: 'kudos-form-load',
          fallback: 'Unable to load form data. Please refresh and try again.',
        })
      );
    });
  }, []);

  const receiver = useMemo(
    () => users.find((item) => item.id === receiverId),
    [receiverId, users]
  );

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const mediaAssetIds =
        mediaFiles.length > 0 ? await uploadManyMedia(mediaFiles) : undefined;
      await apiRequest('/kudos', {
        method: 'POST',
        body: {
          receiverId,
          points,
          description,
          mediaAssetIds,
        },
      });
      navigate('/feed');
    } catch (requestError) {
      setError(
        getUserFacingError(requestError, {
          context: 'kudos-submit',
          fallback:
            'Unable to send kudo right now. Please review your inputs and try again.',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] px-4 py-6 sm:px-6 lg:px-8 md:py-8 bg-surface-container-low">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight">
            Send Kudos
          </h1>
          <p className="mt-2 text-on-surface-variant text-base">
            Give 10-50 points and optionally attach media.
          </p>
        </header>

        <form
          className="rounded-3xl bg-surface-container-lowest p-6 md:p-8 shadow-[0_12px_40px_rgba(55,39,77,0.06)] space-y-6"
          onSubmit={onSubmit}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Receiver
              </span>
              <select
                className="w-full rounded-xl border border-surface-container bg-white px-3 py-3 text-on-surface"
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                required
              >
                <option value="">Select a teammate</option>
                {users.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.displayName} ({item.email})
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-xl bg-surface-container-low p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Selected Receiver
              </p>
              <p className="mt-2 text-lg font-bold text-on-surface">
                {receiver ? receiver.displayName : 'No receiver selected'}
              </p>
              <p className="text-sm text-on-surface-variant">
                {receiver?.email ?? '-'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-surface-container-low p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Points
            </label>
            <div className="mt-3 flex items-center gap-3">
              <input
                className="w-28 rounded-xl border border-surface-container bg-white px-3 py-2 text-base font-bold text-on-surface"
                min={10}
                max={50}
                step={5}
                type="number"
                value={points}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (Number.isNaN(value)) return;
                  setPoints(Math.max(10, Math.min(50, value)));
                }}
              />
              <span className="text-sm font-semibold text-primary">
                10-50 per kudo
              </span>
            </div>
            <p className="mt-2 text-xs text-on-surface-variant">
              Monthly giving wallet is capped at 200 points and resets every UTC
              month.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Kudos Message
            </label>
            <textarea
              className="w-full rounded-xl border border-surface-container bg-white px-4 py-3 text-on-surface"
              rows={5}
              value={description}
              placeholder="What did they do great?"
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Media (optional)
            </span>
            <KudosMediaDropzone
              files={mediaFiles}
              onFilesChange={setMediaFiles}
              maxFiles={5}
              onError={(message) => {
                if (message) {
                  setError(message);
                }
              }}
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              className="cursor-pointer rounded-full bg-primary px-6 py-3 font-bold text-on-primary disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Kudo'}
            </button>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </form>
      </div>
    </div>
  );
}
