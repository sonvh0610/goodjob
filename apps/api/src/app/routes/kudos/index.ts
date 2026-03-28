import { FastifyInstance } from 'fastify';
import { and, eq, inArray, sql } from 'drizzle-orm';
import {
  createCommentBodySchema,
  createKudoBodySchema,
  createReactionBodySchema,
} from '@org/shared';
import { db } from '../../db/client.js';
import {
  budgetLedger,
  commentMediaAssets,
  comments,
  feedEvents,
  kudoMediaAssets,
  kudos,
  mediaAssets,
  monthlyGivingWallets,
  notifications,
  pointLedger,
  reactions,
  users,
  wallets,
} from '../../db/schema.js';
import { monthKeyFromDate } from '../../lib/time.js';

const MONTHLY_BUDGET = 200;

export default async function kudosRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/',
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      const parsed = createKudoBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const actor = request.user!;
      const data = parsed.data;

      if (actor.id === data.receiverId) {
        return reply.status(400).send({ error: 'Cannot send kudo to self' });
      }

      const receiver = await db.query.users.findFirst({
        where: eq(users.id, data.receiverId),
      });
      if (!receiver) {
        return reply.status(404).send({ error: 'Receiver not found' });
      }

      const requestedMediaIds = data.mediaAssetIds?.length
        ? Array.from(new Set(data.mediaAssetIds))
        : data.mediaAssetId
          ? [data.mediaAssetId]
          : [];

      if (requestedMediaIds.length > 5) {
        return reply.status(400).send({ error: 'Maximum 5 media files per kudo' });
      }

      let validMediaIds: string[] = [];
      if (requestedMediaIds.length > 0) {
        const rows = await db
          .select({
            id: mediaAssets.id,
            status: mediaAssets.status,
          })
          .from(mediaAssets)
          .where(
            and(
              eq(mediaAssets.ownerId, actor.id),
              inArray(mediaAssets.id, requestedMediaIds)
            )
          );

        if (rows.length !== requestedMediaIds.length) {
          return reply.status(400).send({ error: 'Invalid media asset selection' });
        }
        if (rows.some((item) => item.status === 'rejected')) {
          return reply.status(400).send({ error: 'Invalid media asset selection' });
        }
        validMediaIds = requestedMediaIds;
      }

      const monthKey = monthKeyFromDate();

      let result: { id: string };
      try {
        result = await db.transaction(async (tx) => {
          await tx.execute(
            sql`select user_id from wallets where user_id = ${actor.id} for update`
          );

          await tx.execute(
            sql`select user_id from monthly_giving_wallets where user_id = ${actor.id} and month_key = ${monthKey} for update`
          );

          let monthlySummary = await tx.query.monthlyGivingWallets.findFirst({
            where: and(
              eq(monthlyGivingWallets.userId, actor.id),
              eq(monthlyGivingWallets.monthKey, monthKey)
            ),
          });

          if (!monthlySummary) {
            const spentRows = await tx
              .select({
                total: sql<number>`coalesce(sum(${budgetLedger.deltaPoints}), 0)`,
              })
              .from(budgetLedger)
              .where(
                and(
                  eq(budgetLedger.userId, actor.id),
                  eq(budgetLedger.monthKey, monthKey)
                )
              );
            const spentPoints = Math.abs(Math.min(spentRows[0]?.total ?? 0, 0));

            const insertedSummary = await tx
              .insert(monthlyGivingWallets)
              .values({
                userId: actor.id,
                monthKey,
                spentPoints,
                limitPoints: MONTHLY_BUDGET,
              })
              .onConflictDoUpdate({
                target: [monthlyGivingWallets.userId, monthlyGivingWallets.monthKey],
                set: { spentPoints, updatedAt: new Date() },
              })
              .returning();

            monthlySummary = insertedSummary[0] ?? null;
          }

          const alreadySpent = monthlySummary?.spentPoints ?? 0;
          if (alreadySpent + data.points > MONTHLY_BUDGET) {
            throw new Error('MONTHLY_BUDGET_EXCEEDED');
          }

          const insertedKudo = await tx
            .insert(kudos)
            .values({
              senderId: actor.id,
              receiverId: data.receiverId,
              points: data.points,
              description: data.description,
              coreValue: 'Kudos',
              mediaAssetId: validMediaIds[0] ?? null,
            })
            .returning();

          const kudo = insertedKudo[0];
          if (!kudo) {
            throw new Error('KUDO_NOT_CREATED');
          }

          if (validMediaIds.length > 0) {
            await tx.insert(kudoMediaAssets).values(
              validMediaIds.map((mediaAssetId, index) => ({
                kudoId: kudo.id,
                mediaAssetId,
                position: index,
              }))
            );
          }

          await tx.insert(pointLedger).values([
            {
              userId: actor.id,
              deltaPoints: -data.points,
              direction: 'debit',
              reason: 'kudo_sent',
              refType: 'kudo',
              refId: kudo.id,
            },
            {
              userId: data.receiverId,
              deltaPoints: data.points,
              direction: 'credit',
              reason: 'kudo_received',
              refType: 'kudo',
              refId: kudo.id,
            },
          ]);

          await tx.insert(budgetLedger).values({
            userId: actor.id,
            monthKey,
            deltaPoints: -data.points,
            reason: 'kudo_sent',
            refType: 'kudo',
            refId: kudo.id,
          });

          await tx
            .insert(monthlyGivingWallets)
            .values({
              userId: actor.id,
              monthKey,
              spentPoints: alreadySpent + data.points,
              limitPoints: MONTHLY_BUDGET,
            })
            .onConflictDoUpdate({
              target: [monthlyGivingWallets.userId, monthlyGivingWallets.monthKey],
              set: {
                spentPoints: alreadySpent + data.points,
                updatedAt: new Date(),
              },
            });

          await tx.insert(feedEvents).values({
            kudoId: kudo.id,
            actorId: actor.id,
            type: 'kudo_created',
            payloadJson: {
              points: data.points,
              description: data.description,
            },
          });

          await tx
            .update(wallets)
            .set({
              availablePoints: sql`${wallets.availablePoints} + ${data.points}`,
              updatedAt: new Date(),
            })
            .where(eq(wallets.userId, data.receiverId));

          const recipientIds = [data.receiverId];
          await tx.insert(notifications).values(
            recipientIds
              .filter((id) => id !== actor.id)
              .map((userId) => ({
                userId,
                type: 'kudo_received',
                payloadJson: {
                  kudoId: kudo.id,
                  senderId: actor.id,
                  receiverId: data.receiverId,
                  points: data.points,
                },
              }))
          );

          return kudo;
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === 'MONTHLY_BUDGET_EXCEEDED'
        ) {
          return reply.status(400).send({ error: 'Monthly budget exceeded' });
        }
        throw error;
      }

      await fastify.publishEvent({
        event: 'feed.new',
        payload: { kudoId: result.id },
        createdAt: new Date().toISOString(),
      });

      await fastify.publishEvent({
        event: 'notification.new',
        userId: data.receiverId,
        payload: {
          type: 'kudo_received',
          kudoId: result.id,
          points: data.points,
        },
        createdAt: new Date().toISOString(),
      });

      await fastify.publishEvent({
        event: 'wallet.points_received',
        userId: data.receiverId,
        payload: {
          points: data.points,
          kudoId: result.id,
        },
        createdAt: new Date().toISOString(),
      });

      return reply.status(201).send({ kudo: result });
    }
  );

  fastify.post(
    '/:id/reactions',
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      const parsed = createReactionBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }
      const params = request.params as { id: string };

      const inserted = await db
        .insert(reactions)
        .values({
          kudoId: params.id,
          userId: request.user!.id,
          emoji: parsed.data.emoji,
        })
        .onConflictDoNothing()
        .returning();

      if (inserted.length > 0) {
        await db.insert(feedEvents).values({
          kudoId: params.id,
          actorId: request.user!.id,
          type: 'reaction_added',
          payloadJson: { emoji: parsed.data.emoji },
        });

        await fastify.publishEvent({
          event: 'feed.reaction',
          payload: {
            kudoId: params.id,
            emoji: parsed.data.emoji,
            actorId: request.user!.id,
            action: 'added',
          },
          createdAt: new Date().toISOString(),
        });

        return reply.status(201).send({ reaction: inserted[0], toggled: 'added' });
      }

      const deleted = await db
        .delete(reactions)
        .where(
          and(
            eq(reactions.kudoId, params.id),
            eq(reactions.userId, request.user!.id),
            eq(reactions.emoji, parsed.data.emoji)
          )
        )
        .returning();

      await fastify.publishEvent({
        event: 'feed.reaction',
        payload: {
          kudoId: params.id,
          emoji: parsed.data.emoji,
          actorId: request.user!.id,
          action: 'removed',
        },
        createdAt: new Date().toISOString(),
      });

      return reply.send({ ok: true, toggled: 'removed', reaction: deleted[0] });
    }
  );

  fastify.post(
    '/:id/comments',
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      const parsed = createCommentBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }
      const params = request.params as { id: string };

      const requestedMediaIds = parsed.data.mediaAssetIds?.length
        ? Array.from(new Set(parsed.data.mediaAssetIds))
        : parsed.data.mediaAssetId
          ? [parsed.data.mediaAssetId]
          : [];

      if (requestedMediaIds.length > 5) {
        return reply.status(400).send({ error: 'Maximum 5 media files per comment' });
      }

      let validMediaIds: string[] = [];
      if (requestedMediaIds.length > 0) {
        const rows = await db
          .select({
            id: mediaAssets.id,
            status: mediaAssets.status,
          })
          .from(mediaAssets)
          .where(
            and(
              eq(mediaAssets.ownerId, request.user!.id),
              inArray(mediaAssets.id, requestedMediaIds)
            )
          );

        if (rows.length !== requestedMediaIds.length) {
          return reply.status(400).send({ error: 'Invalid media asset' });
        }
        if (rows.some((item) => item.status === 'rejected')) {
          return reply.status(400).send({ error: 'Invalid media asset' });
        }
        validMediaIds = requestedMediaIds;
      }

      const inserted = await db
        .insert(comments)
        .values({
          kudoId: params.id,
          userId: request.user!.id,
          text: parsed.data.text ?? '',
          mediaAssetId: validMediaIds[0] ?? null,
        })
        .returning();

      const comment = inserted[0];
      if (!comment) {
        return reply.status(500).send({ error: 'Cannot create comment' });
      }

      if (validMediaIds.length > 0) {
        await db.insert(commentMediaAssets).values(
          validMediaIds.map((mediaAssetId, index) => ({
            commentId: comment.id,
            mediaAssetId,
            position: index,
          }))
        );
      }

      await db.insert(feedEvents).values({
        kudoId: params.id,
        actorId: request.user!.id,
        type: 'comment_added',
        payloadJson: { commentId: comment.id },
      });

      await fastify.publishEvent({
        event: 'feed.comment',
        payload: {
          kudoId: params.id,
          commentId: comment.id,
          text: comment.text,
        },
        createdAt: new Date().toISOString(),
      });

      return reply.status(201).send({ comment });
    }
  );
}
