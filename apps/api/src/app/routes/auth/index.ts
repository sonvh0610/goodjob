import crypto from 'node:crypto';
import { FastifyInstance, FastifyReply } from 'fastify';
import {
  createSession,
  destroySession,
  destroyUserSessions,
  upsertOauthAccount,
} from '../../services/auth.js';
import { redis } from '../../lib/redis.js';
import { makeToken } from '../../lib/crypto.js';
import { getEnv } from '../../config/env.js';

const OAUTH_STATE_KEY_PREFIX = 'oauth:state:';
const OIDC_STATE_KEY_PREFIX = 'oidc:state:';

type SupportedProvider = 'oidc' | 'google' | 'slack';

type OidcDiscoveryDocument = {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
};

let oidcDiscoveryPromise: Promise<OidcDiscoveryDocument> | null = null;

function makeCookieOptions(
  env: FastifyInstance['appEnv'],
  maxAgeSeconds: number
) {
  const apiUrl = new URL(env.API_BASE_URL);
  const appOrigin = new URL(env.APP_BASE_URL).origin;
  const apiOrigin = apiUrl.origin;
  const crossOrigin = appOrigin !== apiOrigin;
  const secure = crossOrigin || apiUrl.protocol === 'https:';

  return {
    path: '/',
    httpOnly: true,
    sameSite: (crossOrigin ? 'none' : 'lax') as 'none' | 'lax',
    secure,
    maxAge: maxAgeSeconds,
  };
}

function makeCsrfCookieOptions(env: FastifyInstance['appEnv']) {
  const base = makeCookieOptions(env, 60 * 60);
  return {
    ...base,
    httpOnly: false,
  };
}

function setCsrfTokenCookie(
  reply: FastifyReply,
  env: FastifyInstance['appEnv'],
  token: string
) {
  reply.setCookie(env.CSRF_COOKIE_NAME, token, makeCsrfCookieOptions(env));
}

function setCsrfCookie(reply: FastifyReply, env: FastifyInstance['appEnv']) {
  const csrfToken = makeToken(24);
  setCsrfTokenCookie(reply, env, csrfToken);
  return csrfToken;
}

function getConfiguredProviders(env: ReturnType<typeof getEnv>) {
  const providers: SupportedProvider[] = [];

  if (
    env.OIDC_ISSUER_URL &&
    env.OIDC_CLIENT_ID &&
    env.OIDC_CLIENT_SECRET &&
    env.OIDC_REDIRECT_URI
  ) {
    providers.push('oidc');
  }
  if (env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_REDIRECT_URI) {
    providers.push('google');
  }
  if (env.SLACK_OAUTH_CLIENT_ID && env.SLACK_OAUTH_REDIRECT_URI) {
    providers.push('slack');
  }

  return providers;
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString('base64url');
}

function makeCodeChallenge(verifier: string) {
  return base64Url(crypto.createHash('sha256').update(verifier).digest());
}

async function getOidcDiscovery(env: ReturnType<typeof getEnv>) {
  if (!env.OIDC_ISSUER_URL) {
    throw new Error('OIDC_NOT_CONFIGURED');
  }

  if (!oidcDiscoveryPromise) {
    oidcDiscoveryPromise = fetch(
      new URL(
        '/.well-known/openid-configuration',
        env.OIDC_ISSUER_URL
      ).toString()
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('OIDC_DISCOVERY_FAILED');
        }
        const discovery = (await response.json()) as OidcDiscoveryDocument;
        if (!discovery.authorization_endpoint || !discovery.token_endpoint) {
          throw new Error('OIDC_DISCOVERY_INVALID');
        }
        return discovery;
      })
      .catch((error) => {
        oidcDiscoveryPromise = null;
        throw error;
      });
  }

  return oidcDiscoveryPromise;
}

async function resolveOauthUser(
  provider: 'google' | 'slack',
  code: string,
  env: FastifyInstance['appEnv']
) {
  if (
    provider === 'google' &&
    env.GOOGLE_OAUTH_CLIENT_ID &&
    env.GOOGLE_OAUTH_CLIENT_SECRET &&
    env.GOOGLE_OAUTH_REDIRECT_URI
  ) {
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_OAUTH_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    if (tokenResp.ok) {
      const tokenData = (await tokenResp.json()) as { access_token?: string };
      if (tokenData.access_token) {
        const userResp = await fetch(
          'https://www.googleapis.com/oauth2/v2/userinfo',
          {
            headers: {
              authorization: `Bearer ${tokenData.access_token}`,
            },
          }
        );
        if (userResp.ok) {
          const userData = (await userResp.json()) as {
            id: string;
            email?: string;
            name?: string;
            picture?: string;
          };
          return upsertOauthAccount({
            provider,
            providerAccountId: userData.id,
            email: userData.email,
            displayName: userData.name,
            avatarUrl: userData.picture,
          });
        }
      }
    }
  }

  if (
    provider === 'slack' &&
    env.SLACK_OAUTH_CLIENT_ID &&
    env.SLACK_OAUTH_CLIENT_SECRET &&
    env.SLACK_OAUTH_REDIRECT_URI
  ) {
    const tokenResp = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.SLACK_OAUTH_CLIENT_ID,
        client_secret: env.SLACK_OAUTH_CLIENT_SECRET,
        redirect_uri: env.SLACK_OAUTH_REDIRECT_URI,
      }),
    });
    if (tokenResp.ok) {
      const tokenData = (await tokenResp.json()) as {
        ok?: boolean;
        authed_user?: { id?: string; access_token?: string };
        access_token?: string;
      };
      const slackUserAccessToken =
        tokenData.authed_user?.access_token ?? tokenData.access_token;

      if (tokenData.ok && slackUserAccessToken) {
        const profileResp = await fetch(
          'https://slack.com/api/users.identity',
          {
            headers: { authorization: `Bearer ${slackUserAccessToken}` },
          }
        );
        if (profileResp.ok) {
          const profileData = (await profileResp.json()) as {
            ok?: boolean;
            user?: {
              id?: string;
              email?: string;
              name?: string;
              image_192?: string;
              image_512?: string;
            };
          };
          if (profileData.ok && profileData.user?.id) {
            return upsertOauthAccount({
              provider,
              providerAccountId: profileData.user.id,
              email: profileData.user.email,
              displayName: profileData.user.name,
              avatarUrl:
                profileData.user.image_512 ?? profileData.user.image_192,
            });
          }
        }
      }
    }
  }

  return upsertOauthAccount({
    provider,
    providerAccountId: code,
    email: `${provider}-${code}@local`,
    displayName: `${provider} user`,
  });
}

async function resolveOidcUser(
  code: string,
  state: string,
  env: FastifyInstance['appEnv']
) {
  const cachedState = await redis.get(`${OIDC_STATE_KEY_PREFIX}${state}`);
  if (!cachedState) {
    throw new Error('OIDC_STATE_INVALID');
  }
  await redis.del(`${OIDC_STATE_KEY_PREFIX}${state}`);

  const parsedState = JSON.parse(cachedState) as { codeVerifier: string };
  const discovery = await getOidcDiscovery(env);

  const tokenResp = await fetch(discovery.token_endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: env.OIDC_CLIENT_ID!,
      client_secret: env.OIDC_CLIENT_SECRET!,
      redirect_uri: env.OIDC_REDIRECT_URI!,
      code_verifier: parsedState.codeVerifier,
    }),
  });

  if (!tokenResp.ok) {
    throw new Error('OIDC_TOKEN_EXCHANGE_FAILED');
  }

  const tokenData = (await tokenResp.json()) as {
    access_token?: string;
    id_token?: string;
  };

  if (!tokenData.access_token || !discovery.userinfo_endpoint) {
    throw new Error('OIDC_USERINFO_UNAVAILABLE');
  }

  const userResp = await fetch(discovery.userinfo_endpoint, {
    headers: {
      authorization: `Bearer ${tokenData.access_token}`,
    },
  });
  if (!userResp.ok) {
    throw new Error('OIDC_USERINFO_FAILED');
  }

  const userData = (await userResp.json()) as {
    sub?: string;
    email?: string;
    name?: string;
    preferred_username?: string;
    picture?: string;
  };

  if (!userData.sub) {
    throw new Error('OIDC_USERINFO_INVALID');
  }

  return upsertOauthAccount({
    provider: 'oidc',
    providerAccountId: userData.sub,
    email: userData.email,
    displayName:
      userData.name ?? userData.preferred_username ?? 'Work Account User',
    avatarUrl: userData.picture,
  });
}

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.get('/providers', async (_request, reply) => {
    return reply.send({
      providers: getConfiguredProviders(fastify.appEnv),
    });
  });

  fastify.get(
    '/csrf',
    { preHandler: fastify.requireAuth },
    async (_request, reply) => {
      const csrfToken = setCsrfCookie(reply, fastify.appEnv);
      return reply.send({ csrfToken });
    }
  );

  fastify.post('/logout', async (request, reply) => {
    const token = request.cookies[fastify.appEnv.SESSION_COOKIE_NAME];
    if (token) {
      await destroySession(token).catch(() => undefined);
    }
    reply.clearCookie(fastify.appEnv.SESSION_COOKIE_NAME, { path: '/' });
    reply.clearCookie(fastify.appEnv.CSRF_COOKIE_NAME, { path: '/' });
    return reply.send({ ok: true });
  });

  fastify.get(
    '/me',
    { preHandler: fastify.requireAuth },
    async (request, reply) => {
      reply.header('Cache-Control', 'no-store');
      reply.header('Pragma', 'no-cache');
      reply.header('Expires', '0');
      const csrfToken = setCsrfCookie(reply, fastify.appEnv);
      return { user: request.user, csrfToken };
    }
  );

  fastify.get('/oidc/start', async (_request, reply) => {
    if (!getConfiguredProviders(fastify.appEnv).includes('oidc')) {
      return reply.status(400).send({ error: 'OIDC is not configured' });
    }

    const discovery = await getOidcDiscovery(fastify.appEnv);
    const state = makeToken(16);
    const codeVerifier = base64Url(crypto.randomBytes(32));
    const codeChallenge = makeCodeChallenge(codeVerifier);

    await redis.setex(
      `${OIDC_STATE_KEY_PREFIX}${state}`,
      600,
      JSON.stringify({ codeVerifier })
    );

    const url = new URL(discovery.authorization_endpoint);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', fastify.appEnv.OIDC_CLIENT_ID!);
    url.searchParams.set('redirect_uri', fastify.appEnv.OIDC_REDIRECT_URI!);
    url.searchParams.set('scope', fastify.appEnv.OIDC_SCOPES);
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');

    return reply.send({ url: url.toString() });
  });

  fastify.get('/oauth/:provider/start', async (request, reply) => {
    const provider = request.params as { provider: 'google' | 'slack' };
    if (!['google', 'slack'].includes(provider.provider)) {
      return reply.status(400).send({ error: 'Unsupported provider' });
    }

    const state = makeToken(16);
    await redis.setex(
      `${OAUTH_STATE_KEY_PREFIX}${state}`,
      600,
      provider.provider
    );

    if (provider.provider === 'google') {
      if (
        !fastify.appEnv.GOOGLE_OAUTH_CLIENT_ID ||
        !fastify.appEnv.GOOGLE_OAUTH_REDIRECT_URI
      ) {
        return reply
          .status(400)
          .send({ error: 'Google OAuth is not configured' });
      }
      const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('client_id', fastify.appEnv.GOOGLE_OAUTH_CLIENT_ID);
      url.searchParams.set(
        'redirect_uri',
        fastify.appEnv.GOOGLE_OAUTH_REDIRECT_URI
      );
      url.searchParams.set('scope', 'openid email profile');
      url.searchParams.set('state', state);
      return reply.send({ url: url.toString() });
    }

    if (
      !fastify.appEnv.SLACK_OAUTH_CLIENT_ID ||
      !fastify.appEnv.SLACK_OAUTH_REDIRECT_URI
    ) {
      return reply.status(400).send({ error: 'Slack OAuth is not configured' });
    }
    const url = new URL('https://slack.com/oauth/v2/authorize');
    url.searchParams.set('client_id', fastify.appEnv.SLACK_OAUTH_CLIENT_ID);
    url.searchParams.set(
      'redirect_uri',
      fastify.appEnv.SLACK_OAUTH_REDIRECT_URI
    );
    url.searchParams.set('user_scope', 'identity.basic,identity.email');
    url.searchParams.set('state', state);
    return reply.send({ url: url.toString() });
  });

  fastify.get('/oidc/callback', async (request, reply) => {
    const query = request.query as { code?: string; state?: string };
    if (!query.code || !query.state) {
      return reply.status(400).send({ error: 'Missing code/state' });
    }

    const oidcUser = await resolveOidcUser(
      query.code,
      query.state,
      fastify.appEnv
    );
    await destroyUserSessions(oidcUser.id);
    const session = await createSession(oidcUser.id);
    reply.setCookie(
      fastify.appEnv.SESSION_COOKIE_NAME,
      session.sessionToken,
      makeCookieOptions(
        fastify.appEnv,
        Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)
      )
    );
    setCsrfCookie(reply, fastify.appEnv);
    return reply.redirect(`${fastify.appEnv.APP_BASE_URL}/`);
  });

  fastify.get('/oauth/:provider/callback', async (request, reply) => {
    const provider = request.params as { provider: 'google' | 'slack' };
    const query = request.query as { code?: string; state?: string };
    if (!query.code || !query.state) {
      return reply.status(400).send({ error: 'Missing code/state' });
    }

    const stateProvider = await redis.get(
      `${OAUTH_STATE_KEY_PREFIX}${query.state}`
    );
    if (!stateProvider || stateProvider !== provider.provider) {
      return reply.status(400).send({ error: 'Invalid OAuth state' });
    }
    await redis.del(`${OAUTH_STATE_KEY_PREFIX}${query.state}`);

    const oauthUser = await resolveOauthUser(
      provider.provider,
      query.code,
      fastify.appEnv
    );
    await destroyUserSessions(oauthUser.id);
    const session = await createSession(oauthUser.id);
    reply.setCookie(
      fastify.appEnv.SESSION_COOKIE_NAME,
      session.sessionToken,
      makeCookieOptions(
        fastify.appEnv,
        Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)
      )
    );
    setCsrfCookie(reply, fastify.appEnv);
    return reply.redirect(`${fastify.appEnv.APP_BASE_URL}/`);
  });
}
