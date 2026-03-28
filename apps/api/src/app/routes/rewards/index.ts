import { FastifyInstance } from 'fastify';
import { and, asc, eq, gt, or, sql } from 'drizzle-orm';
import {
  createRewardBodySchema,
  listRewardsQuerySchema,
  redeemRewardBodySchema,
  updateRewardBodySchema,
} from '@org/shared';
import { db } from '../../db/client.js';
import {
  notifications,
  pointLedger,
  redemptions,
  rewards,
  wallets,
} from '../../db/schema.js';

function decodeCursor(
  cursor?: string
): { costPoints: number; id: string } | null {
  if (!cursor) return null;
  try {
    const decoded = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf-8')
    ) as { costPoints: number; id: string };
    if (!decoded.id || !Number.isInteger(decoded.costPoints)) return null;
    return decoded;
  } catch {
    return null;
  }
}

function encodeCursor(costPoints: number, id: string): string {
  return Buffer.from(JSON.stringify({ costPoints, id }), 'utf-8').toString(
    'base64url'
  );
}

export default async function rewardRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/',
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      if (request.user?.role !== 'admin') {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const parsed = createRewardBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const created = await db.insert(rewards).values(parsed.data).returning();
      const reward = created[0];
      if (!reward) {
        return reply.status(500).send({ error: 'Cannot create reward' });
      }

      return reply.status(201).send({ reward });
    }
  );

  fastify.put(
    '/:id',
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      if (request.user?.role !== 'admin') {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const parsed = updateRewardBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const rewardId = (request.params as { id: string }).id;
      const updated = await db
        .update(rewards)
        .set({
          name: parsed.data.name,
          thumbnailUrl: parsed.data.thumbnailUrl ?? null,
          costPoints: parsed.data.costPoints,
          stock: parsed.data.stock,
          ...(parsed.data.active === undefined
            ? {}
            : { active: parsed.data.active }),
        })
        .where(eq(rewards.id, rewardId))
        .returning();

      const reward = updated[0];
      if (!reward) {
        return reply.status(404).send({ error: 'Reward not found' });
      }

      return reply.send({ reward });
    }
  );

  fastify.get(
    '/',
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      const parsed = listRewardsQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const { limit } = parsed.data;
      const cursor = decodeCursor(parsed.data.cursor);

      const rows = await db
        .select({
          id: rewards.id,
          name: rewards.name,
          thumbnailUrl: rewards.thumbnailUrl,
          costPoints: rewards.costPoints,
          stock: rewards.stock,
          active: rewards.active,
        })
        .from(rewards)
        .where(
          and(
            eq(rewards.active, true),
            cursor
              ? or(
                  gt(rewards.costPoints, cursor.costPoints),
                  and(
                    eq(rewards.costPoints, cursor.costPoints),
                    gt(rewards.id, cursor.id)
                  )
                )
              : undefined
          )
        )
        .orderBy(asc(rewards.costPoints), asc(rewards.id))
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;
      const nextCursor =
        hasMore && items.length > 0
          ? encodeCursor(
              items[items.length - 1]!.costPoints,
              items[items.length - 1]!.id
            )
          : null;

      return reply.send({ items, nextCursor });
    }
  );

  fastify.post(
    '/:id/redeem',
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      const parsed = redeemRewardBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }
      const idempotencyKey = request.headers['x-idempotency-key'];
      if (!idempotencyKey || typeof idempotencyKey !== 'string') {
        return reply
          .status(400)
          .send({ error: 'x-idempotency-key header is required' });
      }
      const rewardId = (request.params as { id: string }).id;
      const userId = request.user!.id;

      const existing = await db.query.redemptions.findFirst({
        where: and(
          eq(redemptions.userId, userId),
          eq(redemptions.idempotencyKey, idempotencyKey)
        ),
      });
      if (existing) {
        return reply.send({ redemption: existing, idempotent: true });
      }

      const redemption = await db
        .transaction(async (tx) => {
          await tx.execute(
            sql`select user_id from wallets where user_id = ${userId} for update`
          );
          await tx.execute(
            sql`select id from rewards where id = ${rewardId} for update`
          );

          const wallet = await tx.query.wallets.findFirst({
            where: eq(wallets.userId, userId),
          });
          const reward = await tx.query.rewards.findFirst({
            where: eq(rewards.id, rewardId),
          });

          if (!wallet || !reward || !reward.active) {
            throw new Error('REWARD_NOT_AVAILABLE');
          }
          if (reward.stock <= 0) {
            throw new Error('OUT_OF_STOCK');
          }
          if (wallet.availablePoints < reward.costPoints) {
            throw new Error('INSUFFICIENT_POINTS');
          }

          await tx
            .update(wallets)
            .set({
              availablePoints: sql`${wallets.availablePoints} - ${reward.costPoints}`,
              updatedAt: new Date(),
            })
            .where(eq(wallets.userId, userId));

          await tx
            .update(rewards)
            .set({
              stock: sql`${rewards.stock} - 1`,
            })
            .where(eq(rewards.id, rewardId));

          const created = await tx
            .insert(redemptions)
            .values({
              userId,
              rewardId,
              costPoints: reward.costPoints,
              status: 'approved',
              idempotencyKey,
            })
            .returning();

          const row = created[0];
          if (!row) {
            throw new Error('REDEMPTION_CREATE_FAILED');
          }

          await tx.insert(pointLedger).values({
            userId,
            deltaPoints: -reward.costPoints,
            direction: 'debit',
            reason: 'reward_redeemed',
            refType: 'redemption',
            refId: row.id,
          });

          await tx.insert(notifications).values({
            userId,
            type: 'reward_redeemed',
            payloadJson: {
              rewardId,
              rewardName: reward.name,
              costPoints: reward.costPoints,
              redemptionId: row.id,
            },
          });

          return row;
        })
        .catch((error: Error) => {
          if (error.message === 'OUT_OF_STOCK') {
            return null;
          }
          throw error;
        });

      if (!redemption) {
        return reply.status(409).send({ error: 'Reward out of stock' });
      }

      await fastify.publishEvent({
        event: 'notification.new',
        userId,
        payload: {
          type: 'reward_redeemed',
          redemptionId: redemption.id,
        },
        createdAt: new Date().toISOString(),
      });

      await fastify.publishEvent({
        event: 'ai.summary.invalidate',
        userId,
        payload: {
          redemptionId: redemption.id,
        },
        createdAt: new Date().toISOString(),
      });

      return reply.status(201).send({ redemption });
    }
  );
}
