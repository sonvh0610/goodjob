import type { AppEnv } from '../config/env.js';
import type { RealtimeEnvelope } from '@org/shared';

declare module 'fastify' {
  interface FastifyInstance {
    appEnv: AppEnv;
    publishEvent: (event: RealtimeEnvelope) => Promise<void>;
    requireAuth: import('fastify').preHandlerHookHandler;
  }

  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      displayName: string;
      avatarUrl: string | null;
      role: 'member' | 'admin';
    };
  }
}
