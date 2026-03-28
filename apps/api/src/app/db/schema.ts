import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const mediaTypeEnum = pgEnum('media_type', ['image', 'video']);
export const mediaStatusEnum = pgEnum('media_status', [
  'pending',
  'validated',
  'rejected',
]);
export const feedEventTypeEnum = pgEnum('feed_event_type', [
  'kudo_created',
  'reaction_added',
  'comment_added',
]);
export const pointDirectionEnum = pgEnum('point_direction', ['credit', 'debit']);
export const redemptionStatusEnum = pgEnum('redemption_status', [
  'pending',
  'approved',
  'rejected',
]);
export const userRoleEnum = pgEnum('user_role', ['member', 'admin']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 1000 }),
  role: userRoleEnum('role').notNull().default('member'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 50 }).notNull(),
    providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    providerUnique: unique('accounts_provider_uid_unique').on(
      table.provider,
      table.providerAccountId
    ),
  })
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: index('sessions_user_idx').on(table.userId),
  })
);

export const wallets = pgTable('wallets', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  availablePoints: integer('available_points').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const budgetLedger = pgTable(
  'budget_ledger',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    monthKey: varchar('month_key', { length: 7 }).notNull(),
    deltaPoints: integer('delta_points').notNull(),
    reason: varchar('reason', { length: 100 }).notNull(),
    refType: varchar('ref_type', { length: 40 }).notNull(),
    refId: uuid('ref_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userMonthIdx: index('budget_ledger_user_month_idx').on(
      table.userId,
      table.monthKey
    ),
  })
);

export const pointLedger = pgTable(
  'point_ledger',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    deltaPoints: integer('delta_points').notNull(),
    direction: pointDirectionEnum('direction').notNull(),
    reason: varchar('reason', { length: 100 }).notNull(),
    refType: varchar('ref_type', { length: 40 }).notNull(),
    refId: uuid('ref_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: index('point_ledger_user_idx').on(table.userId),
  })
);

export const mediaAssets = pgTable(
  'media_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    mediaType: mediaTypeEnum('media_type').notNull(),
    status: mediaStatusEnum('status').notNull().default('pending'),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }).notNull(),
    durationSeconds: integer('duration_seconds'),
    storageKey: varchar('storage_key', { length: 500 }).notNull(),
    publicUrl: varchar('public_url', { length: 1000 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    ownerIdx: index('media_assets_owner_idx').on(table.ownerId),
  })
);

export const kudos = pgTable(
  'kudos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    receiverId: uuid('receiver_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    points: integer('points').notNull(),
    description: text('description').notNull(),
    coreValue: varchar('core_value', { length: 60 }).notNull(),
    mediaAssetId: uuid('media_asset_id').references(() => mediaAssets.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    createdAtIdx: index('kudos_created_at_idx').on(
      table.createdAt,
      table.id
    ),
  })
);

export const kudoMediaAssets = pgTable(
  'kudo_media_assets',
  {
    kudoId: uuid('kudo_id')
      .notNull()
      .references(() => kudos.id, { onDelete: 'cascade' }),
    mediaAssetId: uuid('media_asset_id')
      .notNull()
      .references(() => mediaAssets.id, { onDelete: 'restrict' }),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqueKudoMedia: unique('kudo_media_assets_unique').on(
      table.kudoId,
      table.mediaAssetId
    ),
    kudoPositionIdx: index('kudo_media_assets_kudo_position_idx').on(
      table.kudoId,
      table.position
    ),
  })
);

export const monthlyGivingWallets = pgTable(
  'monthly_giving_wallets',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    monthKey: varchar('month_key', { length: 7 }).notNull(),
    spentPoints: integer('spent_points').notNull().default(0),
    limitPoints: integer('limit_points').notNull().default(200),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pk: unique('monthly_giving_wallets_user_month_unique').on(
      table.userId,
      table.monthKey
    ),
    userMonthIdx: index('monthly_giving_wallets_user_month_idx').on(
      table.userId,
      table.monthKey
    ),
  })
);

export const feedEvents = pgTable(
  'feed_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kudoId: uuid('kudo_id')
      .notNull()
      .references(() => kudos.id, { onDelete: 'cascade' }),
    actorId: uuid('actor_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    type: feedEventTypeEnum('type').notNull(),
    payloadJson: jsonb('payload_json').$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    createdAtIdx: index('feed_events_created_at_idx').on(
      table.createdAt,
      table.id
    ),
  })
);

export const reactions = pgTable(
  'reactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kudoId: uuid('kudo_id')
      .notNull()
      .references(() => kudos.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    emoji: varchar('emoji', { length: 16 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqueReaction: unique('reactions_kudo_user_emoji_unique').on(
      table.kudoId,
      table.userId,
      table.emoji
    ),
  })
);

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  kudoId: uuid('kudo_id')
    .notNull()
    .references(() => kudos.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  mediaAssetId: uuid('media_asset_id').references(() => mediaAssets.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const commentMediaAssets = pgTable(
  'comment_media_assets',
  {
    commentId: uuid('comment_id')
      .notNull()
      .references(() => comments.id, { onDelete: 'cascade' }),
    mediaAssetId: uuid('media_asset_id')
      .notNull()
      .references(() => mediaAssets.id, { onDelete: 'restrict' }),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqueCommentMedia: unique('comment_media_assets_unique').on(
      table.commentId,
      table.mediaAssetId
    ),
    commentPositionIdx: index('comment_media_assets_comment_position_idx').on(
      table.commentId,
      table.position
    ),
  })
);

export const rewards = pgTable(
  'rewards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 140 }).notNull(),
    costPoints: integer('cost_points').notNull(),
    stock: integer('stock').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    activeIdx: index('rewards_active_idx').on(table.active),
  })
);

export const redemptions = pgTable(
  'redemptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rewardId: uuid('reward_id')
      .notNull()
      .references(() => rewards.id, { onDelete: 'restrict' }),
    costPoints: integer('cost_points').notNull(),
    status: redemptionStatusEnum('status').notNull().default('pending'),
    idempotencyKey: varchar('idempotency_key', { length: 128 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    idempotencyUnique: unique('redemptions_user_idempotency_unique').on(
      table.userId,
      table.idempotencyKey
    ),
  })
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 40 }).notNull(),
    payloadJson: jsonb('payload_json').$type<Record<string, unknown>>().notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userCreatedIdx: index('notifications_user_created_read_idx').on(
      table.userId,
      table.createdAt,
      table.readAt
    ),
  })
);

export const nowMonthKeySql = sql<string>`to_char(now() at time zone 'utc', 'YYYY-MM')`;
