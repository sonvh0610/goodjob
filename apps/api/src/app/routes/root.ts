import { FastifyInstance } from 'fastify';
import { and, asc, eq, ilike, or, sql } from 'drizzle-orm';
import { listUsersQuerySchema } from '@org/shared';
import { db } from '../db/client.js';
import {
  budgetLedger,
  monthlyGivingWallets,
  users,
  wallets,
} from '../db/schema.js';
import { monthKeyFromDate } from '../lib/time.js';

const MONTHLY_GIVING_LIMIT = 200;

async function getGivingWallet(userId: string) {
  const monthKey = monthKeyFromDate();
  const existing = await db.query.monthlyGivingWallets.findFirst({
    where: and(
      eq(monthlyGivingWallets.userId, userId),
      eq(monthlyGivingWallets.monthKey, monthKey)
    ),
  });

  if (existing) {
    return existing;
  }

  const spentRows = await db
    .select({
      total: sql<number>`coalesce(sum(${budgetLedger.deltaPoints}), 0)`,
    })
    .from(budgetLedger)
    .where(
      and(eq(budgetLedger.userId, userId), eq(budgetLedger.monthKey, monthKey))
    );
  const spentPoints = Math.abs(Math.min(spentRows[0]?.total ?? 0, 0));

  const inserted = await db
    .insert(monthlyGivingWallets)
    .values({
      userId,
      monthKey,
      spentPoints,
      limitPoints: MONTHLY_GIVING_LIMIT,
    })
    .onConflictDoUpdate({
      target: [monthlyGivingWallets.userId, monthlyGivingWallets.monthKey],
      set: {
        spentPoints,
        updatedAt: new Date(),
      },
    })
    .returning();

  return inserted[0]!;
}

export default async function (fastify: FastifyInstance) {
  fastify.get('/', async function () {
    return { message: 'Goodjob API is running' };
  });

  fastify.get('/healthz', async function () {
    return { ok: true, service: 'api' };
  });

  fastify.get(
    '/wallet',
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      const wallet = await db.query.wallets.findFirst({
        where: eq(wallets.userId, request.user!.id),
      });
      if (!wallet) {
        return reply.status(404).send({ error: 'Wallet not found' });
      }

      const givingWallet = await getGivingWallet(request.user!.id);

      return reply.send({
        wallet: {
          receivedWallet: wallet,
          givingWallet: {
            monthKey: givingWallet.monthKey,
            limitPoints: givingWallet.limitPoints,
            spentPoints: givingWallet.spentPoints,
            remainingPoints: Math.max(
              givingWallet.limitPoints - givingWallet.spentPoints,
              0
            ),
            updatedAt: givingWallet.updatedAt,
          },
        },
      });
    }
  );

  fastify.get(
    '/users',
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      const parsed = listUsersQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const q = parsed.data.q?.trim();
      const rows = await db
        .select({
          id: users.id,
          displayName: users.displayName,
          email: users.email,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(
          and(
            sql`${users.id} <> ${request.user!.id}`,
            q
              ? or(
                  ilike(users.displayName, `%${q}%`),
                  ilike(users.email, `%${q}%`)
                )
              : undefined
          )
        )
        .orderBy(asc(users.displayName))
        .limit(parsed.data.limit);

      return reply.send({ items: rows });
    }
  );

}
