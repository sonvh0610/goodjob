import crypto from 'node:crypto';
import { and, desc, eq, gte, lt, or, sql } from 'drizzle-orm';
import type { MonthlySummaryResponse } from '@org/shared';
import { db } from '../db/client.js';
import { aiMonthlySummaries, kudos, redemptions, users } from '../db/schema.js';
import { getEnv } from '../config/env.js';

type SummaryContext = {
  userId: string;
  displayName: string;
  monthKey: string;
  sourceStats: MonthlySummaryResponse['sourceStats'];
  supportingNotes: string[];
};

function monthRange(monthKey: string) {
  const start = new Date(`${monthKey}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
}

function contentHashFor(context: SummaryContext) {
  return crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        monthKey: context.monthKey,
        sourceStats: context.sourceStats,
        supportingNotes: context.supportingNotes,
      })
    )
    .digest('hex');
}

function fallbackSummary(context: SummaryContext) {
  const { sourceStats } = context;
  const topValues =
    sourceStats.topCoreValues.length > 0
      ? sourceStats.topCoreValues
          .map((item) => `${item.coreValue} (${item.count})`)
          .join(', ')
      : 'no standout core values yet';
  const colleagues =
    sourceStats.notableColleagues.length > 0
      ? sourceStats.notableColleagues
          .map((item) => `${item.displayName} (${item.count})`)
          .join(', ')
      : 'no repeated recognition patterns yet';

  return `${context.displayName} sent ${sourceStats.kudosSent} kudos worth ${
    sourceStats.pointsGiven
  } points and received ${sourceStats.kudosReceived} kudos worth ${
    sourceStats.pointsReceived
  } points in ${
    context.monthKey
  }. The strongest themes were ${topValues}. The most-recognized teammates were ${colleagues}. ${
    sourceStats.rewardsRedeemed > 0
      ? `They redeemed ${sourceStats.rewardsRedeemed} rewards.`
      : 'They did not redeem any rewards this month.'
  }`;
}

async function generateOpenAiSummary(context: SummaryContext) {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) {
    return fallbackSummary(context);
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content:
            'You write concise internal recognition summaries. Keep it factual, encouraging, and specific. Do not invent details.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            monthKey: context.monthKey,
            displayName: context.displayName,
            sourceStats: context.sourceStats,
            supportingNotes: context.supportingNotes,
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    return fallbackSummary(context);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  return content && content.length > 0 ? content : fallbackSummary(context);
}

async function buildSummaryContext(
  userId: string,
  monthKey: string
): Promise<SummaryContext> {
  const { start, end } = monthRange(monthKey);
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      displayName: true,
    },
  });

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  const [
    sentRows,
    receivedRows,
    topCoreValueRows,
    notableColleagueRows,
    redemptionRows,
    noteRows,
  ] = await Promise.all([
    db
      .select({
        kudosSent: sql<number>`count(*)::int`,
        pointsGiven: sql<number>`coalesce(sum(${kudos.points}), 0)::int`,
      })
      .from(kudos)
      .where(
        and(
          eq(kudos.senderId, userId),
          gte(kudos.createdAt, start),
          lt(kudos.createdAt, end)
        )
      ),
    db
      .select({
        kudosReceived: sql<number>`count(*)::int`,
        pointsReceived: sql<number>`coalesce(sum(${kudos.points}), 0)::int`,
      })
      .from(kudos)
      .where(
        and(
          eq(kudos.receiverId, userId),
          gte(kudos.createdAt, start),
          lt(kudos.createdAt, end)
        )
      ),
    db
      .select({
        coreValue: kudos.coreValue,
        count: sql<number>`count(*)::int`,
      })
      .from(kudos)
      .where(
        and(
          or(eq(kudos.senderId, userId), eq(kudos.receiverId, userId)),
          gte(kudos.createdAt, start),
          lt(kudos.createdAt, end)
        )
      )
      .groupBy(kudos.coreValue)
      .orderBy(desc(sql`count(*)`), kudos.coreValue)
      .limit(5),
    db
      .select({
        userId: users.id,
        displayName: users.displayName,
        count: sql<number>`count(*)::int`,
      })
      .from(kudos)
      .innerJoin(users, eq(kudos.receiverId, users.id))
      .where(
        and(
          eq(kudos.senderId, userId),
          gte(kudos.createdAt, start),
          lt(kudos.createdAt, end)
        )
      )
      .groupBy(users.id, users.displayName)
      .orderBy(desc(sql`count(*)`), users.displayName)
      .limit(5),
    db
      .select({
        rewardsRedeemed: sql<number>`count(*)::int`,
      })
      .from(redemptions)
      .where(
        and(
          eq(redemptions.userId, userId),
          gte(redemptions.createdAt, start),
          lt(redemptions.createdAt, end)
        )
      ),
    db
      .select({
        description: kudos.description,
        coreValue: kudos.coreValue,
      })
      .from(kudos)
      .where(
        and(
          or(eq(kudos.senderId, userId), eq(kudos.receiverId, userId)),
          gte(kudos.createdAt, start),
          lt(kudos.createdAt, end)
        )
      )
      .orderBy(desc(kudos.createdAt))
      .limit(6),
  ]);

  return {
    userId,
    displayName: user.displayName,
    monthKey,
    sourceStats: {
      kudosSent: sentRows[0]?.kudosSent ?? 0,
      kudosReceived: receivedRows[0]?.kudosReceived ?? 0,
      pointsGiven: sentRows[0]?.pointsGiven ?? 0,
      pointsReceived: receivedRows[0]?.pointsReceived ?? 0,
      rewardsRedeemed: redemptionRows[0]?.rewardsRedeemed ?? 0,
      topCoreValues: topCoreValueRows.map((row) => ({
        coreValue: row.coreValue,
        count: row.count,
      })),
      notableColleagues: notableColleagueRows,
    },
    supportingNotes: noteRows.map(
      (row) => `${row.coreValue}: ${row.description.slice(0, 180)}`
    ),
  };
}

export async function getMonthlySummary(
  userId: string,
  monthKey: string,
  forceRefresh = false
): Promise<MonthlySummaryResponse> {
  const context = await buildSummaryContext(userId, monthKey);
  const contentHash = contentHashFor(context);

  if (!forceRefresh) {
    const cached = await db.query.aiMonthlySummaries.findFirst({
      where: and(
        eq(aiMonthlySummaries.userId, userId),
        eq(aiMonthlySummaries.monthKey, monthKey),
        eq(aiMonthlySummaries.contentHash, contentHash)
      ),
      orderBy: [desc(aiMonthlySummaries.generatedAt)],
    });

    if (cached) {
      return {
        monthKey,
        summary: cached.summary,
        generatedAt: cached.generatedAt.toISOString(),
        sourceStats:
          cached.sourceStatsJson as unknown as MonthlySummaryResponse['sourceStats'],
        cached: true,
      };
    }
  }

  const summary = await generateOpenAiSummary(context);
  const inserted = await db
    .insert(aiMonthlySummaries)
    .values({
      userId,
      monthKey,
      contentHash,
      summary,
      sourceStatsJson: context.sourceStats as unknown as Record<
        string,
        unknown
      >,
    })
    .onConflictDoNothing()
    .returning();

  const row =
    inserted[0] ??
    (await db.query.aiMonthlySummaries.findFirst({
      where: and(
        eq(aiMonthlySummaries.userId, userId),
        eq(aiMonthlySummaries.monthKey, monthKey),
        eq(aiMonthlySummaries.contentHash, contentHash)
      ),
      orderBy: [desc(aiMonthlySummaries.generatedAt)],
    }));

  if (!row) {
    throw new Error('SUMMARY_NOT_SAVED');
  }

  return {
    monthKey,
    summary: row.summary,
    generatedAt: row.generatedAt.toISOString(),
    sourceStats:
      row.sourceStatsJson as unknown as MonthlySummaryResponse['sourceStats'],
    cached: false,
  };
}
