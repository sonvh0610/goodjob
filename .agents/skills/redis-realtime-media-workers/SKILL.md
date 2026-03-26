---
name: redis-realtime-media-workers
description: Build Redis-backed realtime and async media processing flows for Node.js systems. Use when implementing pub-sub notifications, websocket fanout, job queues, non-blocking video handling, and failure-safe worker retries.
---

# Redis Realtime Media Workers

## Overview
Implement real-time updates and asynchronous media processing without blocking API request threads.

## Workflow
1. Define domain events and event payload schemas.
2. Publish events after successful DB commits.
3. Subscribe via WebSocket gateway for online users.
4. Offload media/video processing to queue workers.
5. Track retries, dead-letter cases, and job status.

## Event Design
- `kudo.created`
- `kudo.commented`
- `kudo.reacted`
- `user.tagged`
- `reward.redeemed`

## Queue Design
- Use BullMQ or equivalent with Redis.
- Keep workers stateless and idempotent.
- Store media metadata and processing status in DB.
- Enforce max input duration (3 minutes) before processing.

## Reliability Rules
- Never process video in API request lifecycle.
- Configure exponential backoff and max retries.
- Use dead-letter handling for permanent failures.
- Log correlation ID across API, queue, and worker.

## References and scripts
- Read [events and worker contracts](references/events-and-workers.md).
- Use [`scripts/redis_channels.txt`](scripts/redis_channels.txt) as baseline channel naming.
