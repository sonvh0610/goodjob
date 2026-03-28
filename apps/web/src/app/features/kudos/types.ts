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
  description: string;
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
}

export interface FeedResponse {
  items: FeedItem[];
  nextCursor: string | null;
}
