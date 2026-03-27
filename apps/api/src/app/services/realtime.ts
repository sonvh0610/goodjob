import type { WebSocket } from 'ws';
import type { RealtimeEnvelope } from '@org/shared';
import { redis, redisSubscriber } from '../lib/redis.js';

const CHANNEL = 'goodjob:events';
const userSockets = new Map<string, Set<WebSocket>>();
let subscriberStarted = false;

function safeSend(socket: WebSocket, message: string) {
  if (socket.readyState === socket.OPEN) {
    socket.send(message);
  }
}

export function registerUserSocket(userId: string, socket: WebSocket) {
  const set = userSockets.get(userId) ?? new Set<WebSocket>();
  set.add(socket);
  userSockets.set(userId, set);

  socket.on('close', () => {
    const current = userSockets.get(userId);
    if (!current) {
      return;
    }
    current.delete(socket);
    if (current.size === 0) {
      userSockets.delete(userId);
    }
  });
}

export async function startRealtimeSubscriber() {
  if (subscriberStarted) {
    return;
  }
  subscriberStarted = true;

  await redisSubscriber.subscribe(CHANNEL);
  redisSubscriber.on('message', (_, payload) => {
    const parsed = JSON.parse(payload) as RealtimeEnvelope;
    if (!parsed.userId) {
      return;
    }
    const sockets = userSockets.get(parsed.userId);
    if (!sockets) {
      return;
    }
    const body = JSON.stringify(parsed);
    sockets.forEach((socket) => safeSend(socket, body));
  });
}

export async function publishEvent(event: RealtimeEnvelope) {
  await redis.publish(CHANNEL, JSON.stringify(event));
}
