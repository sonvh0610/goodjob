import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  APP_BASE_URL: z.string().url().default('http://localhost:4200'),
  API_BASE_URL: z.string().url().default('http://localhost:3000'),
  SESSION_COOKIE_NAME: z.string().default('goodjob_session'),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(24 * 7),
  JWT_SECRET: z.string().min(32),
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default('ap-southeast-1'),
  S3_ACCESS_KEY_ID: z.string().default('minioadmin'),
  S3_SECRET_ACCESS_KEY: z.string().default('minioadmin'),
  S3_BUCKET: z.string().default('goodjob-media'),
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
  GOOGLE_OAUTH_REDIRECT_URI: z.string().url().optional(),
  SLACK_OAUTH_CLIENT_ID: z.string().optional(),
  SLACK_OAUTH_CLIENT_SECRET: z.string().optional(),
  SLACK_OAUTH_REDIRECT_URI: z.string().url().optional(),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${details}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
