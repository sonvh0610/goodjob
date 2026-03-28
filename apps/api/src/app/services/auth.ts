import { and, eq, gt } from 'drizzle-orm';
import { db } from '../db/client.js';
import { accounts, sessions, users, wallets } from '../db/schema.js';
import { hashToken, makeToken } from '../lib/crypto.js';
import { getEnv } from '../config/env.js';

const env = getEnv();

export interface SessionResult {
  sessionToken: string;
  expiresAt: Date;
}

export interface AuthUserRecord {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: 'member' | 'admin';
}

export async function createSession(userId: string): Promise<SessionResult> {
  const sessionToken = makeToken(32);
  const tokenHash = hashToken(sessionToken);
  const expiresAt = new Date(
    Date.now() + env.SESSION_TTL_HOURS * 60 * 60 * 1000
  );

  await db.insert(sessions).values({
    userId,
    tokenHash,
    expiresAt,
  });

  return { sessionToken, expiresAt };
}

export async function findSessionUser(
  sessionToken: string
): Promise<AuthUserRecord | null> {
  const tokenHash = hashToken(sessionToken);

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date()))
    )
    .limit(1);

  const user = rows[0];
  if (!user) {
    return null;
  }

  return user;
}

export async function destroySession(sessionToken: string): Promise<void> {
  await db
    .delete(sessions)
    .where(eq(sessions.tokenHash, hashToken(sessionToken)));
}

export async function destroyUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function upsertOauthAccount(input: {
  provider: 'google' | 'slack' | 'oidc';
  providerAccountId: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
}) {
  let user = input.email
    ? await db.query.users.findFirst({
        where: eq(users.email, input.email.toLowerCase()),
      })
    : null;

  if (!user) {
    const inserted = await db
      .insert(users)
      .values({
        email:
          input.email ?? `${input.provider}-${input.providerAccountId}@local`,
        displayName: input.displayName ?? `${input.provider} user`,
        avatarUrl: input.avatarUrl,
      })
      .returning();
    user = inserted[0] ?? null;
    if (!user) {
      throw new Error('Cannot create oauth user');
    }
    await db.insert(wallets).values({
      userId: user.id,
      availablePoints: 0,
    });
  }

  if (
    user &&
    ((input.displayName && input.displayName !== user.displayName) ||
      (input.avatarUrl && input.avatarUrl !== user.avatarUrl))
  ) {
    const updated = await db
      .update(users)
      .set({
        displayName: input.displayName ?? user.displayName,
        avatarUrl: input.avatarUrl ?? user.avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();
    user = updated[0] ?? user;
  }

  const existing = await db.query.accounts.findFirst({
    where: and(
      eq(accounts.provider, input.provider),
      eq(accounts.providerAccountId, input.providerAccountId)
    ),
  });

  if (!existing) {
    await db.insert(accounts).values({
      userId: user.id,
      provider: input.provider,
      providerAccountId: input.providerAccountId,
    });
  }

  return user;
}
