import { FastifyInstance } from 'fastify';
import { and, asc, desc, eq, inArray, lt, or, sql } from 'drizzle-orm';
import { listFeedQuerySchema } from '@org/shared';
import { db } from '../../db/client.js';
import {
  commentMediaAssets,
  comments,
  kudoMediaAssets,
  kudos,
  mediaAssets,
  reactions,
  users,
} from '../../db/schema.js';
import { createPresignedReadUrl } from '../../services/storage.js';

function decodeCursor(
  cursor?: string
): { createdAt: string; id: string } | null {
  if (!cursor) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf-8')) as {
      createdAt: string;
      id: string;
    };
    if (!decoded.createdAt || !decoded.id) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(
    JSON.stringify({ createdAt: createdAt.toISOString(), id }),
    'utf-8'
  ).toString('base64url');
}

export default async function feedRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: fastify.requireAuth }, async (request, reply) => {
    const parsed = listFeedQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { limit } = parsed.data;
    const cursor = decodeCursor(parsed.data.cursor);
    const rows = await db
      .select({
        id: kudos.id,
        senderId: kudos.senderId,
        receiverId: kudos.receiverId,
        points: kudos.points,
        description: kudos.description,
        coreValue: kudos.coreValue,
        mediaAssetId: kudos.mediaAssetId,
        mediaUrl: mediaAssets.publicUrl,
        mediaStorageKey: mediaAssets.storageKey,
        mediaType: mediaAssets.mediaType,
        createdAt: kudos.createdAt,
        senderName: users.displayName,
        senderAvatarUrl: users.avatarUrl,
      })
      .from(kudos)
      .innerJoin(users, eq(kudos.senderId, users.id))
      .leftJoin(mediaAssets, eq(kudos.mediaAssetId, mediaAssets.id))
      .where(
        cursor
          ? or(
              lt(kudos.createdAt, new Date(cursor.createdAt)),
              and(eq(kudos.createdAt, new Date(cursor.createdAt)), lt(kudos.id, cursor.id))
            )
          : undefined
      )
      .orderBy(desc(kudos.createdAt), desc(kudos.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const kudoIds = items.map((item) => item.id);

    const [mediaRows, reactionCounts, userReactions, commentCounts, recentReactions, recentComments] =
      kudoIds.length === 0
        ? [[], [], [], [], [], []]
        : await Promise.all([
            db
              .select({
                kudoId: kudoMediaAssets.kudoId,
                mediaAssetId: kudoMediaAssets.mediaAssetId,
                mediaType: mediaAssets.mediaType,
                mediaUrl: mediaAssets.publicUrl,
                mediaStorageKey: mediaAssets.storageKey,
                position: kudoMediaAssets.position,
              })
              .from(kudoMediaAssets)
              .innerJoin(
                mediaAssets,
                eq(kudoMediaAssets.mediaAssetId, mediaAssets.id)
              )
              .where(inArray(kudoMediaAssets.kudoId, kudoIds))
              .orderBy(asc(kudoMediaAssets.position)),
            db
              .select({
                kudoId: reactions.kudoId,
                emoji: reactions.emoji,
                count: sql<number>`count(*)::int`,
              })
              .from(reactions)
              .where(inArray(reactions.kudoId, kudoIds))
              .groupBy(reactions.kudoId, reactions.emoji),
            db
              .select({
                kudoId: reactions.kudoId,
                emoji: reactions.emoji,
              })
              .from(reactions)
              .where(
                and(
                  inArray(reactions.kudoId, kudoIds),
                  eq(reactions.userId, request.user!.id)
                )
              ),
            db
              .select({
                kudoId: comments.kudoId,
                count: sql<number>`count(*)::int`,
              })
              .from(comments)
              .where(inArray(comments.kudoId, kudoIds))
              .groupBy(comments.kudoId),
            db
              .select({
                id: reactions.id,
                kudoId: reactions.kudoId,
                emoji: reactions.emoji,
                createdAt: reactions.createdAt,
                userId: reactions.userId,
                userName: users.displayName,
              })
              .from(reactions)
              .innerJoin(users, eq(reactions.userId, users.id))
              .where(inArray(reactions.kudoId, kudoIds))
              .orderBy(desc(reactions.createdAt))
              .limit(300),
            db
              .select({
                id: comments.id,
                kudoId: comments.kudoId,
                text: comments.text,
                mediaAssetId: comments.mediaAssetId,
                createdAt: comments.createdAt,
                userId: comments.userId,
                userName: users.displayName,
              })
              .from(comments)
              .innerJoin(users, eq(comments.userId, users.id))
              .where(inArray(comments.kudoId, kudoIds))
              .orderBy(desc(comments.createdAt))
              .limit(300),
          ]);

    const allStorageKeys = Array.from(
      new Set(
        [
          ...mediaRows.map((row) => row.mediaStorageKey),
          ...items.map((item) => item.mediaStorageKey),
        ].filter((value): value is string => Boolean(value))
      )
    );
    const signedUrlByKey = new Map<string, string>();
    await Promise.all(
      allStorageKeys.map(async (key) => {
        const signed = await createPresignedReadUrl({ key });
        signedUrlByKey.set(key, signed);
      })
    );

    const mediasByKudoId = new Map<
      string,
      {
        mediaAssetId: string;
        mediaType: 'image' | 'video';
        mediaUrl: string | null;
      }[]
    >();
    for (const row of mediaRows) {
      const list = mediasByKudoId.get(row.kudoId) ?? [];
      list.push({
        mediaAssetId: row.mediaAssetId,
        mediaType: row.mediaType,
        mediaUrl: row.mediaStorageKey
          ? signedUrlByKey.get(row.mediaStorageKey) ?? row.mediaUrl
          : row.mediaUrl,
      });
      mediasByKudoId.set(row.kudoId, list);
    }

    const reactionsSummaryByKudoId = new Map<
      string,
      { emoji: string; count: number }[]
    >();
    for (const row of reactionCounts) {
      const list = reactionsSummaryByKudoId.get(row.kudoId) ?? [];
      list.push({ emoji: row.emoji, count: row.count });
      reactionsSummaryByKudoId.set(row.kudoId, list);
    }

    const userReactionEmojiByKudoId = new Map<string, string[]>();
    for (const row of userReactions) {
      const list = userReactionEmojiByKudoId.get(row.kudoId) ?? [];
      list.push(row.emoji);
      userReactionEmojiByKudoId.set(row.kudoId, list);
    }

    const commentCountByKudoId = new Map<string, number>();
    for (const row of commentCounts) {
      commentCountByKudoId.set(row.kudoId, row.count);
    }

    const recentReactionsByKudoId = new Map<
      string,
      {
        id: string;
        emoji: string;
        createdAt: Date;
        userId: string;
        userName: string;
      }[]
    >();
    for (const row of recentReactions) {
      const list = recentReactionsByKudoId.get(row.kudoId) ?? [];
      if (list.length < 3) {
        list.push(row);
      }
      recentReactionsByKudoId.set(row.kudoId, list);
    }

    const recentCommentsByKudoId = new Map<
      string,
      {
        id: string;
        text: string;
        mediaAssetId: string | null;
        medias: {
          mediaAssetId: string;
          mediaType: 'image' | 'video';
          mediaUrl: string | null;
        }[];
        createdAt: Date;
        userId: string;
        userName: string;
      }[]
    >();
    for (const row of recentComments) {
      const list = recentCommentsByKudoId.get(row.kudoId) ?? [];
      if (list.length < 3) {
        list.push({
          ...row,
          medias: [],
        });
      }
      recentCommentsByKudoId.set(row.kudoId, list);
    }

    const recentCommentIds = Array.from(
      new Set(recentComments.map((item) => item.id))
    );
    const recentCommentMediaRows =
      recentCommentIds.length === 0
        ? []
        : await db
            .select({
              commentId: commentMediaAssets.commentId,
              mediaAssetId: commentMediaAssets.mediaAssetId,
              mediaType: mediaAssets.mediaType,
              mediaUrl: mediaAssets.publicUrl,
              mediaStorageKey: mediaAssets.storageKey,
              position: commentMediaAssets.position,
            })
            .from(commentMediaAssets)
            .innerJoin(
              mediaAssets,
              eq(commentMediaAssets.mediaAssetId, mediaAssets.id)
            )
            .where(inArray(commentMediaAssets.commentId, recentCommentIds))
            .orderBy(asc(commentMediaAssets.position));

    const missingCommentStorageKeys = Array.from(
      new Set(
        recentCommentMediaRows
          .map((row) => row.mediaStorageKey)
          .filter(
            (value): value is string =>
              Boolean(value) && !signedUrlByKey.has(value)
          )
      )
    );
    await Promise.all(
      missingCommentStorageKeys.map(async (key) => {
        const signed = await createPresignedReadUrl({ key });
        signedUrlByKey.set(key, signed);
      })
    );

    const commentMediaByCommentId = new Map<
      string,
      {
        mediaAssetId: string;
        mediaType: 'image' | 'video';
        mediaUrl: string | null;
      }[]
    >();
    for (const row of recentCommentMediaRows) {
      const list = commentMediaByCommentId.get(row.commentId) ?? [];
      list.push({
        mediaAssetId: row.mediaAssetId,
        mediaType: row.mediaType,
        mediaUrl: row.mediaStorageKey
          ? signedUrlByKey.get(row.mediaStorageKey) ?? row.mediaUrl
          : row.mediaUrl,
      });
      commentMediaByCommentId.set(row.commentId, list);
    }

    for (const list of recentCommentsByKudoId.values()) {
      for (const comment of list) {
        comment.medias = commentMediaByCommentId.get(comment.id) ?? [];
      }
    }

    const enrichedItems = items.map((item) => ({
      ...item,
      medias:
        mediasByKudoId.get(item.id) ??
        (item.mediaAssetId && item.mediaType
          ? [
              {
                mediaAssetId: item.mediaAssetId,
                mediaType: item.mediaType,
                mediaUrl: item.mediaStorageKey
                  ? signedUrlByKey.get(item.mediaStorageKey) ?? item.mediaUrl
                  : item.mediaUrl,
              },
            ]
          : []),
      engagement: {
        reactions: reactionsSummaryByKudoId.get(item.id) ?? [],
        userReactions: userReactionEmojiByKudoId.get(item.id) ?? [],
        commentsCount: commentCountByKudoId.get(item.id) ?? 0,
        recentReactions: recentReactionsByKudoId.get(item.id) ?? [],
        recentComments: recentCommentsByKudoId.get(item.id) ?? [],
      },
    }));

    const nextCursor =
      hasMore && items.length > 0
        ? encodeCursor(items[items.length - 1]!.createdAt, items[items.length - 1]!.id)
        : null;

    return reply.send({ items: enrichedItems, nextCursor });
  });
}
