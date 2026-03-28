import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const uploadPresignBodySchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  fileSizeBytes: z.number().int().positive(),
  mediaType: z.enum(['image', 'video']),
  durationSeconds: z.number().positive().max(180).optional(),
});

export const createKudoBodySchema = z
  .object({
    receiverId: uuidSchema,
    points: z.number().int().min(10).max(50),
    description: z.string().min(5).max(2000),
    coreValue: z.string().trim().min(2).max(60),
    taggedUserIds: z.array(uuidSchema).max(10).optional(),
    mediaAssetIds: z.array(uuidSchema).max(5).optional(),
    // backward-compatible legacy field
    mediaAssetId: uuidSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.mediaAssetIds && value.mediaAssetIds.length > 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Maximum 5 media files per kudo',
        path: ['mediaAssetIds'],
      });
    }
    if (value.taggedUserIds) {
      const uniqueCount = new Set(value.taggedUserIds).size;
      if (uniqueCount !== value.taggedUserIds.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tagged teammates must be unique',
          path: ['taggedUserIds'],
        });
      }
    }
  });

export const createReactionBodySchema = z.object({
  emoji: z.string().min(1).max(16),
});

export const createCommentBodySchema = z
  .object({
    text: z.string().min(1).max(2000).optional(),
    mediaAssetIds: z.array(uuidSchema).max(5).optional(),
    // backward-compatible legacy field
    mediaAssetId: uuidSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.text && !value.mediaAssetId && !value.mediaAssetIds?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Comment requires text or media',
      });
    }
    if (value.mediaAssetIds && value.mediaAssetIds.length > 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Maximum 5 media files per comment',
        path: ['mediaAssetIds'],
      });
    }
  });

export const listUsersQuerySchema = z.object({
  q: z.string().min(1).max(80).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const redeemRewardBodySchema = z.object({
  quantity: z.number().int().min(1).max(1).default(1),
});

const rewardThumbnailUrlSchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}, z.string().url().max(1024).nullable().optional());

export const createRewardBodySchema = z.object({
  name: z.string().min(2).max(140),
  costPoints: z.number().int().positive().max(100000),
  stock: z.number().int().min(0).max(100000).default(0),
  thumbnailUrl: rewardThumbnailUrlSchema,
  active: z.boolean().default(true),
});

export const updateRewardBodySchema = z.object({
  name: z.string().min(2).max(140),
  costPoints: z.number().int().positive().max(100000),
  stock: z.number().int().min(0).max(100000),
  thumbnailUrl: rewardThumbnailUrlSchema,
  active: z.boolean().optional(),
});

export const feedCursorSchema = z.object({
  createdAt: z.string().datetime(),
  id: uuidSchema,
});

export const listFeedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const listTopRecognizersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

export const listWalletTransactionsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const listNotificationsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const listRewardsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type UploadPresignBody = z.infer<typeof uploadPresignBodySchema>;
export type CreateKudoBody = z.infer<typeof createKudoBodySchema>;
export type CreateReactionBody = z.infer<typeof createReactionBodySchema>;
export type CreateCommentBody = z.infer<typeof createCommentBodySchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type RedeemRewardBody = z.infer<typeof redeemRewardBodySchema>;
export type CreateRewardBody = z.infer<typeof createRewardBodySchema>;
export type UpdateRewardBody = z.infer<typeof updateRewardBodySchema>;
export type ListTopRecognizersQuery = z.infer<
  typeof listTopRecognizersQuerySchema
>;
export type ListWalletTransactionsQuery = z.infer<
  typeof listWalletTransactionsQuerySchema
>;
export type ListNotificationsQuery = z.infer<
  typeof listNotificationsQuerySchema
>;
export type ListRewardsQuery = z.infer<typeof listRewardsQuerySchema>;

export interface KudoUserOption {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface KudoMedia {
  mediaAssetId: string;
  mediaType: 'image' | 'video';
  mediaUrl: string | null;
}

export interface RecentReaction {
  id: string;
  emoji: string;
  createdAt: string;
  userId: string;
  userName: string;
}

export interface RecentComment {
  id: string;
  text: string;
  mediaAssetId: string | null;
  medias: KudoMedia[];
  createdAt: string;
  userId: string;
  userName: string;
}

export interface FeedItem {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  senderAvatarUrl: string | null;
  receiverName: string;
  description: string;
  coreValue: string;
  taggedUsers: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl?: string | null;
  }[];
  points: number;
  medias: KudoMedia[];
  createdAt: string;
  engagement: {
    reactions: { emoji: string; count: number }[];
    userReactions: string[];
    commentsCount: number;
    recentReactions: RecentReaction[];
    recentComments: RecentComment[];
  };
  watchedByViewer: boolean;
}

export interface FeedResponse {
  items: FeedItem[];
  nextCursor: string | null;
}

export interface KudoDetailResponse {
  item: FeedItem;
}

export interface TopRecognizerItem {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  kudosSent: number;
  pointsGiven: number;
}

export interface TopRecognizersResponse {
  items: TopRecognizerItem[];
}

export interface WalletResponse {
  wallet: {
    receivedWallet: {
      userId: string;
      availablePoints: number;
      updatedAt: string;
    };
    givingWallet: {
      monthKey: string;
      limitPoints: number;
      spentPoints: number;
      remainingPoints: number;
      updatedAt: string;
    };
  };
}

export interface WalletTransactionItem {
  id: string;
  deltaPoints: number;
  direction: 'credit' | 'debit';
  reason: string;
  refType: string;
  refId: string;
  createdAt: string;
  detail: string | null;
}

export interface WalletTransactionsResponse {
  items: WalletTransactionItem[];
  nextCursor: string | null;
}

export interface NotificationItem {
  id: string;
  type: string;
  payloadJson: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface AuthProvidersResponse {
  providers: Array<'oidc' | 'google' | 'slack'>;
}

export interface AuthMeResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    role: 'member' | 'admin';
  };
  csrfToken: string;
}

export interface CsrfTokenResponse {
  csrfToken: string;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  nextCursor: string | null;
}

export interface NotificationUnreadCountResponse {
  unreadCount: number;
}

export interface RewardItem {
  id: string;
  name: string;
  thumbnailUrl?: string | null;
  costPoints: number;
  stock: number;
  active: boolean;
}

export interface RewardsResponse {
  items: RewardItem[];
  nextCursor: string | null;
}

export interface MonthlySummaryResponse {
  monthKey: string;
  summary: string;
  generatedAt: string;
  sourceStats: {
    kudosSent: number;
    kudosReceived: number;
    pointsGiven: number;
    pointsReceived: number;
    rewardsRedeemed: number;
    topCoreValues: { coreValue: string; count: number }[];
    notableColleagues: { userId: string; displayName: string; count: number }[];
  };
  cached: boolean;
}

export type RealtimeEventType =
  | 'feed.new'
  | 'feed.reaction'
  | 'feed.comment'
  | 'notification.new'
  | 'wallet.points_received'
  | 'ai.summary.invalidate';

export interface RealtimeEnvelope<TPayload = unknown> {
  event: RealtimeEventType;
  userId?: string;
  payload: TPayload;
  createdAt: string;
}
