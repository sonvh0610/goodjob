import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const uploadPresignBodySchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  fileSizeBytes: z.number().int().positive(),
  mediaType: z.enum(['image', 'video']),
});

export const createKudoBodySchema = z.object({
  receiverId: uuidSchema,
  points: z.number().int().min(10).max(50),
  description: z.string().min(5).max(2000),
  coreValue: z.string().min(2).max(60),
  mediaAssetId: uuidSchema.optional(),
  taggedUserIds: z.array(uuidSchema).max(20).default([]),
});

export const createReactionBodySchema = z.object({
  emoji: z.string().min(1).max(16),
});

export const createCommentBodySchema = z.object({
  text: z.string().min(1).max(2000),
  mediaAssetId: uuidSchema.optional(),
});

export const redeemRewardBodySchema = z.object({
  quantity: z.number().int().min(1).max(1).default(1),
});

export const createRewardBodySchema = z.object({
  name: z.string().min(2).max(140),
  costPoints: z.number().int().positive().max(100000),
  stock: z.number().int().min(0).max(100000).default(0),
  active: z.boolean().default(true),
});

export const feedCursorSchema = z.object({
  createdAt: z.string().datetime(),
  id: uuidSchema,
});

export const listFeedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type UploadPresignBody = z.infer<typeof uploadPresignBodySchema>;
export type CreateKudoBody = z.infer<typeof createKudoBodySchema>;
export type CreateReactionBody = z.infer<typeof createReactionBodySchema>;
export type CreateCommentBody = z.infer<typeof createCommentBodySchema>;
export type RedeemRewardBody = z.infer<typeof redeemRewardBodySchema>;
export type CreateRewardBody = z.infer<typeof createRewardBodySchema>;

export type RealtimeEventType =
  | 'feed.new'
  | 'feed.reaction'
  | 'feed.comment'
  | 'notification.new'
  | 'wallet.points_received';

export interface RealtimeEnvelope<TPayload = unknown> {
  event: RealtimeEventType;
  userId?: string;
  payload: TPayload;
  createdAt: string;
}
