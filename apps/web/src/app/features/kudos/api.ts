import { apiRequest } from '../../lib/api';
import { FeedResponse, KudoUserOption } from './types';

export async function listKudoUsers(limit = 50) {
  return apiRequest<{ items: KudoUserOption[] }>(`/users?limit=${limit}`);
}

export async function sendKudo(input: {
  receiverId: string;
  points: number;
  description: string;
  mediaAssetIds?: string[];
}) {
  return apiRequest('/kudos', {
    method: 'POST',
    body: input,
  });
}

export async function fetchFeed(cursor?: string | null) {
  return apiRequest<FeedResponse>(
    `/feed${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`
  );
}

export async function toggleReaction(input: { kudoId: string; emoji: string }) {
  return apiRequest(`/kudos/${input.kudoId}/reactions`, {
    method: 'POST',
    body: { emoji: input.emoji },
  });
}

export async function createComment(input: {
  kudoId: string;
  text?: string;
  mediaAssetIds?: string[];
}) {
  return apiRequest(`/kudos/${input.kudoId}/comments`, {
    method: 'POST',
    body: {
      text: input.text,
      mediaAssetIds: input.mediaAssetIds,
    },
  });
}
