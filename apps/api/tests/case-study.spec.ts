import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';

process.env.NODE_ENV = 'test';
process.env.HOST ??= '127.0.0.1';
process.env.PORT ??= '3000';
process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST ??
  process.env.DATABASE_URL ??
  'postgres://app:app@localhost:54322/goodjob';
process.env.REDIS_URL =
  process.env.REDIS_URL_TEST ??
  process.env.REDIS_URL ??
  'redis://localhost:6379';
process.env.APP_BASE_URL ??= 'http://localhost:4200';
process.env.API_BASE_URL ??= 'http://localhost:3000';
process.env.SESSION_COOKIE_NAME ??= 'goodjob_session';
process.env.SESSION_TTL_HOURS ??= '168';
process.env.JWT_SECRET ??= 'change-me-with-at-least-32-characters';
process.env.CSRF_COOKIE_NAME ??= 'goodjob_csrf';
process.env.CSRF_HEADER_NAME ??= 'x-csrf-token';
process.env.OIDC_ISSUER_URL ??= 'https://sso.example.com';
process.env.OIDC_CLIENT_ID ??= 'client-id';
process.env.OIDC_CLIENT_SECRET ??= 'client-secret';
process.env.OIDC_REDIRECT_URI ??= 'http://localhost:3000/auth/oidc/callback';
process.env.OPENAI_MODEL ??= 'gpt-4o-mini';

type Modules = {
  testApp: typeof import('../src/app/test-app');
  dbClient: typeof import('../src/app/db/client');
  authService: typeof import('../src/app/services/auth');
  schema: typeof import('../src/app/db/schema');
  redisLib: typeof import('../src/app/lib/redis');
};

let modules: Modules;
let app: FastifyInstance;

async function resetDb() {
  await modules.dbClient.pgPool.query(`
    truncate table
      accounts,
      sessions,
      notifications,
      redemptions,
      rewards,
      comment_media_assets,
      comments,
      reactions,
      feed_events,
      kudo_tagged_users,
      kudo_watchers,
      kudo_media_assets,
      kudos,
      media_assets,
      ai_monthly_summaries,
      budget_ledger,
      point_ledger,
      monthly_giving_wallets,
      wallets,
      users
    restart identity cascade
  `);
}

async function createUser(input: {
  email: string;
  displayName: string;
  role?: 'member' | 'admin';
}) {
  const inserted = await modules.dbClient.db
    .insert(modules.schema.users)
    .values({
      email: input.email,
      displayName: input.displayName,
      role: input.role ?? 'member',
    })
    .returning();
  const user = inserted[0]!;
  await modules.dbClient.db.insert(modules.schema.wallets).values({
    userId: user.id,
    availablePoints: 0,
  });
  return user;
}

async function createAuthenticatedHeaders(userId: string) {
  const session = await modules.authService.createSession(userId);
  const sessionCookie = `${process.env.SESSION_COOKIE_NAME}=${session.sessionToken}`;
  const csrfResponse = await app.inject({
    method: 'GET',
    url: '/auth/csrf',
    headers: {
      cookie: sessionCookie,
    },
  });
  const csrfPayload = csrfResponse.json() as { csrfToken: string };
  const csrfToken = csrfPayload.csrfToken;
  return {
    cookie: `${sessionCookie}; ${process.env.CSRF_COOKIE_NAME}=${csrfToken}`,
    csrfToken,
  };
}

beforeAll(async () => {
  modules = {
    testApp: await import('../src/app/test-app'),
    dbClient: await import('../src/app/db/client'),
    authService: await import('../src/app/services/auth'),
    schema: await import('../src/app/db/schema'),
    redisLib: await import('../src/app/lib/redis'),
  };

  app = Fastify({ logger: false });
  await modules.testApp.registerTestApp(app);
  await app.ready();
});

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await app.close();
  await modules.redisLib.redis.quit();
  await modules.redisLib.redisSubscriber.quit();
  await modules.dbClient.pgPool.end();
});

describe('case study backend coverage', () => {
  it('persists kudo, ledgers, tagged teammates, and feed payload shape', async () => {
    const sender = await createUser({
      email: 'sender@goodjob.app',
      displayName: 'Sender',
    });
    const receiver = await createUser({
      email: 'receiver@goodjob.app',
      displayName: 'Receiver',
    });
    const tagged = await createUser({
      email: 'tagged@goodjob.app',
      displayName: 'Tagged Teammate',
    });
    const auth = await createAuthenticatedHeaders(sender.id);

    const response = await app.inject({
      method: 'POST',
      url: '/kudos',
      headers: {
        cookie: auth.cookie,
        'x-csrf-token': auth.csrfToken,
      },
      payload: {
        receiverId: receiver.id,
        points: 40,
        coreValue: 'Ownership',
        description: 'Shipped the release and unblocked the team.',
        taggedUserIds: [tagged.id],
      },
    });

    expect(response.statusCode).toBe(201);

    const kudoRows = await modules.dbClient.db
      .select()
      .from(modules.schema.kudos);
    expect(kudoRows).toHaveLength(1);
    expect(kudoRows[0]?.coreValue).toBe('Ownership');

    const taggedRows = await modules.dbClient.db
      .select()
      .from(modules.schema.kudoTaggedUsers);
    expect(taggedRows).toHaveLength(1);
    expect(taggedRows[0]?.userId).toBe(tagged.id);

    const pointLedgerRows = await modules.dbClient.db
      .select()
      .from(modules.schema.pointLedger);
    expect(pointLedgerRows).toHaveLength(2);

    const budgetRows = await modules.dbClient.db
      .select()
      .from(modules.schema.budgetLedger);
    expect(budgetRows).toHaveLength(1);

    const feedResponse = await app.inject({
      method: 'GET',
      url: '/feed',
      headers: {
        cookie: auth.cookie,
      },
    });
    expect(feedResponse.statusCode).toBe(200);
    const feedPayload = feedResponse.json() as {
      items: Array<{
        coreValue: string;
        receiverName: string;
        taggedUsers: Array<{ id: string }>;
      }>;
    };
    expect(feedPayload.items[0]?.coreValue).toBe('Ownership');
    expect(feedPayload.items[0]?.receiverName).toBe('Receiver');
    expect(feedPayload.items[0]?.taggedUsers.map((item) => item.id)).toEqual([
      tagged.id,
    ]);
  });

  it('rejects self kudos', async () => {
    const user = await createUser({
      email: 'self@goodjob.app',
      displayName: 'Self',
    });
    const auth = await createAuthenticatedHeaders(user.id);

    const response = await app.inject({
      method: 'POST',
      url: '/kudos',
      headers: {
        cookie: auth.cookie,
        'x-csrf-token': auth.csrfToken,
      },
      payload: {
        receiverId: user.id,
        points: 10,
        coreValue: 'Teamwork',
        description: 'Trying to reward myself.',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: 'Cannot send kudo to self' });
  });

  it('prevents overspending the monthly giving wallet under concurrency', async () => {
    const sender = await createUser({
      email: 'budget@goodjob.app',
      displayName: 'Budget Holder',
    });
    const receiver = await createUser({
      email: 'budget-receiver@goodjob.app',
      displayName: 'Receiver',
    });
    const auth = await createAuthenticatedHeaders(sender.id);

    const responses = await Promise.all(
      Array.from({ length: 5 }).map(() =>
        app.inject({
          method: 'POST',
          url: '/kudos',
          headers: {
            cookie: auth.cookie,
            'x-csrf-token': auth.csrfToken,
          },
          payload: {
            receiverId: receiver.id,
            points: 50,
            coreValue: 'Teamwork',
            description: 'Concurrent budget test payload.',
          },
        })
      )
    );

    const successes = responses.filter(
      (response) => response.statusCode === 201
    );
    const failures = responses.filter(
      (response) => response.statusCode === 400
    );

    expect(successes).toHaveLength(4);
    expect(failures).toHaveLength(1);
  });

  it('blocks mutating requests without a valid CSRF token', async () => {
    const user = await createUser({
      email: 'csrf@goodjob.app',
      displayName: 'CSRF User',
    });
    const session = await modules.authService.createSession(user.id);

    const response = await app.inject({
      method: 'POST',
      url: '/notifications/read',
      headers: {
        cookie: `${process.env.SESSION_COOKIE_NAME}=${session.sessionToken}`,
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ error: 'Invalid CSRF token' });
  });

  it('allows an OIDC-authenticated session to access protected endpoints', async () => {
    const oidcUser = await modules.authService.upsertOauthAccount({
      provider: 'oidc',
      providerAccountId: 'oidc-user-1',
      email: 'oidc@goodjob.app',
      displayName: 'OIDC User',
    });
    const auth = await createAuthenticatedHeaders(oidcUser.id);

    const response = await app.inject({
      method: 'GET',
      url: '/wallet',
      headers: {
        cookie: auth.cookie,
      },
    });

    expect(response.statusCode).toBe(200);
  });

  it('prevents double-spend during concurrent redemption requests', async () => {
    const user = await createUser({
      email: 'redeemer@goodjob.app',
      displayName: 'Redeemer',
    });
    await modules.dbClient.db
      .update(modules.schema.wallets)
      .set({ availablePoints: 500 })
      .where(eq(modules.schema.wallets.userId, user.id));
    const rewardInserted = await modules.dbClient.db
      .insert(modules.schema.rewards)
      .values({
        name: 'Company Hoodie',
        costPoints: 100,
        stock: 1,
        active: true,
      })
      .returning();
    const reward = rewardInserted[0]!;
    const auth = await createAuthenticatedHeaders(user.id);

    const responses = await Promise.all([
      app.inject({
        method: 'POST',
        url: `/rewards/${reward.id}/redeem`,
        headers: {
          cookie: auth.cookie,
          'x-csrf-token': auth.csrfToken,
          'x-idempotency-key': 'redeem-a',
        },
        payload: { quantity: 1 },
      }),
      app.inject({
        method: 'POST',
        url: `/rewards/${reward.id}/redeem`,
        headers: {
          cookie: auth.cookie,
          'x-csrf-token': auth.csrfToken,
          'x-idempotency-key': 'redeem-b',
        },
        payload: { quantity: 1 },
      }),
    ]);

    const successCount = responses.filter(
      (response) => response.statusCode === 201
    ).length;
    const conflictCount = responses.filter(
      (response) => response.statusCode === 409
    ).length;

    expect(successCount).toBe(1);
    expect(conflictCount).toBe(1);
  });

  it('caches and refreshes monthly summaries when source data changes', async () => {
    const sender = await createUser({
      email: 'summary@goodjob.app',
      displayName: 'Summary User',
    });
    const receiver = await createUser({
      email: 'summary-receiver@goodjob.app',
      displayName: 'Receiver',
    });
    const auth = await createAuthenticatedHeaders(sender.id);

    const first = await app.inject({
      method: 'GET',
      url: '/ai/monthly-summary',
      headers: {
        cookie: auth.cookie,
      },
    });
    expect(first.statusCode).toBe(200);
    expect((first.json() as { cached: boolean }).cached).toBe(false);

    const second = await app.inject({
      method: 'GET',
      url: '/ai/monthly-summary',
      headers: {
        cookie: auth.cookie,
      },
    });
    expect(second.statusCode).toBe(200);
    expect((second.json() as { cached: boolean }).cached).toBe(true);

    const kudoResponse = await app.inject({
      method: 'POST',
      url: '/kudos',
      headers: {
        cookie: auth.cookie,
        'x-csrf-token': auth.csrfToken,
      },
      payload: {
        receiverId: receiver.id,
        points: 20,
        coreValue: 'Growth Mindset',
        description: 'Added another achievement for the month.',
      },
    });
    expect(kudoResponse.statusCode).toBe(201);

    const refreshed = await app.inject({
      method: 'GET',
      url: '/ai/monthly-summary',
      headers: {
        cookie: auth.cookie,
      },
    });
    expect(refreshed.statusCode).toBe(200);
    const refreshedPayload = refreshed.json() as {
      cached: boolean;
      sourceStats: { kudosSent: number };
    };
    expect(refreshedPayload.cached).toBe(false);
    expect(refreshedPayload.sourceStats.kudosSent).toBe(1);
  });
});
