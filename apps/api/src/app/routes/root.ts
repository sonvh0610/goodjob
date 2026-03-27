import { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { wallets } from '../db/schema.js';

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
      return reply.send({ wallet });
    }
  );
}
