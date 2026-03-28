import { FastifyInstance } from 'fastify';
import { and, count, desc, eq, inArray, isNull, lt, or } from 'drizzle-orm';
import { listNotificationsQuerySchema, uuidSchema } from '@org/shared';
import { db } from '../../db/client.js';
import { notifications, users } from '../../db/schema.js';
import { findSessionUser } from '../../services/auth.js';
import { registerUserSocket } from '../../services/realtime.js';

function decodeCursor(
  cursor?: string
): { createdAt: string; id: string } | null {
  if (!cursor) return null;
  try {
    const decoded = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf-8')
    ) as { createdAt: string; id: string };
    if (!decoded.createdAt || !decoded.id) return null;
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

export default async function notificationRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      const parsed = listNotificationsQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const { limit } = parsed.data;
      const cursor = decodeCursor(parsed.data.cursor);

      const rows = await db.query.notifications.findMany({
        where: and(
          eq(notifications.userId, request.user!.id),
          cursor
            ? or(
                lt(notifications.createdAt, new Date(cursor.createdAt)),
                and(
                  eq(notifications.createdAt, new Date(cursor.createdAt)),
                  lt(notifications.id, cursor.id)
                )
              )
            : undefined
        ),
        orderBy: [desc(notifications.createdAt), desc(notifications.id)],
        limit: limit + 1,
      });

      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;

      const actorIds = Array.from(
        new Set(
          items
            .filter(
              (item) =>
                item.type === 'kudo_received' ||
                item.type === 'kudo_tagged' ||
                item.type === 'kudo_commented'
            )
            .map((item) =>
              item.type === 'kudo_commented'
                ? typeof item.payloadJson.commenterId === 'string'
                  ? item.payloadJson.commenterId
                  : null
                : typeof item.payloadJson.senderId === 'string'
                ? item.payloadJson.senderId
                : null
            )
            .filter((value): value is string => Boolean(value))
        )
      );

      const actorNamesById =
        actorIds.length > 0
          ? new Map(
              (
                await db
                  .select({
                    id: users.id,
                    displayName: users.displayName,
                  })
                  .from(users)
                  .where(inArray(users.id, actorIds))
              ).map((sender) => [sender.id, sender.displayName])
            )
          : new Map<string, string>();

      const enrichedItems = items.map((item) => {
        if (item.type === 'kudo_commented') {
          const commenterId =
            typeof item.payloadJson.commenterId === 'string'
              ? item.payloadJson.commenterId
              : null;
          const commenterName = commenterId
            ? actorNamesById.get(commenterId)
            : null;
          if (!commenterName) {
            return item;
          }
          return {
            ...item,
            payloadJson: {
              ...item.payloadJson,
              commenterName,
            },
          };
        }

        if (item.type === 'kudo_received') {
          const senderId =
            typeof item.payloadJson.senderId === 'string'
              ? item.payloadJson.senderId
              : null;
          const senderName = senderId ? actorNamesById.get(senderId) : null;
          if (!senderName) {
            return item;
          }
          return {
            ...item,
            payloadJson: {
              ...item.payloadJson,
              senderName,
            },
          };
        }

        if (item.type === 'kudo_tagged') {
          const senderId =
            typeof item.payloadJson.senderId === 'string'
              ? item.payloadJson.senderId
              : null;
          const senderName = senderId ? actorNamesById.get(senderId) : null;
          if (!senderName) {
            return item;
          }
          return {
            ...item,
            payloadJson: {
              ...item.payloadJson,
              senderName,
            },
          };
        }

        return item;
      });
      const nextCursor =
        hasMore && items.length > 0
          ? encodeCursor(
              items[items.length - 1]!.createdAt,
              items[items.length - 1]!.id
            )
          : null;

      return reply.send({ items: enrichedItems, nextCursor });
    }
  );

  fastify.get(
    '/unread-count',
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      const rows = await db
        .select({ unreadCount: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, request.user!.id),
            isNull(notifications.readAt)
          )
        );

      return reply.send({ unreadCount: Number(rows[0]?.unreadCount ?? 0) });
    }
  );

  fastify.post(
    '/read',
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      await db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(notifications.userId, request.user!.id),
            isNull(notifications.readAt)
          )
        );
      return reply.send({ ok: true });
    }
  );

  fastify.post(
    '/:id/read',
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      const params = request.params as { id: string };
      const parsedId = uuidSchema.safeParse(params.id);
      if (!parsedId.success) {
        return reply.status(400).send({ error: 'Invalid notification id' });
      }

      await db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(notifications.id, params.id),
            eq(notifications.userId, request.user!.id),
            isNull(notifications.readAt)
          )
        );

      return reply.send({ ok: true });
    }
  );

  fastify.get('/stream', { websocket: true }, async (socket, request) => {
    const token = request.cookies[fastify.appEnv.SESSION_COOKIE_NAME];
    if (!token) {
      socket.close(1008, 'Unauthorized');
      return;
    }

    const user = await findSessionUser(token);
    if (!user) {
      socket.close(1008, 'Unauthorized');
      return;
    }

    registerUserSocket(user.id, socket);
    socket.send(
      JSON.stringify({
        event: 'notification.new',
        payload: { status: 'connected' },
        createdAt: new Date().toISOString(),
      })
    );
  });
}
