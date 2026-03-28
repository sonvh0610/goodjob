import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { KudoUserOption } from '@org/shared';
import { useNavigate } from 'react-router-dom';
import { uploadManyMedia } from '../../../lib/media';
import { getUserFacingError } from '../../../lib/user-errors';
import { listKudoUsers, sendKudo } from '../api';
import { extractUniqueTags, mergeRecentTags, readRecentTags, saveRecentTags } from '../tagging';

export function useSendKudosForm() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<KudoUserOption[]>([]);
  const [receiverId, setReceiverId] = useState('');
  const [points, setPoints] = useState(25);
  const [description, setDescription] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const usersResponse = await listKudoUsers();
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

  const setSafePoints = (value: number) => {
    if (Number.isNaN(value)) return;
    setPoints(Math.max(10, Math.min(50, value)));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const mediaAssetIds =
        mediaFiles.length > 0 ? await uploadManyMedia(mediaFiles) : undefined;
      await sendKudo({
        receiverId,
        points,
        description,
        mediaAssetIds,
      });
      const tags = extractUniqueTags(description);
      if (tags.length > 0) {
        const merged = mergeRecentTags(readRecentTags(), tags);
        saveRecentTags(merged);
      }
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

  return {
    users,
    receiverId,
    setReceiverId,
    receiver,
    points,
    setSafePoints,
    description,
    setDescription,
    mediaFiles,
    setMediaFiles,
    loading,
    error,
    setError,
    onSubmit,
  };
}
