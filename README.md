# Goodjob Kudos MVP (Nx Monorepo)

This repository implements the case study in [`docs/CASE_STUDY_1_PLAN.md`](./docs/CASE_STUDY_1_PLAN.md) with:

- `apps/api`: Fastify + TypeScript + Drizzle + PostgreSQL + Redis + BullMQ + WebSocket.
- `apps/web`: React + Vite + React Query.
- `packages/shared`: Shared Zod contracts and realtime event types.

## Implemented feature scope

- Auth:
  - Email/password register + login + logout.
  - Forgot password + reset password.
  - OAuth start/callback endpoints for Google and Slack.
- Kudos:
  - `POST /kudos` with 10-50 points validation.
  - No self-kudo validation.
  - Monthly budget enforcement (200) via transaction and row lock.
  - Immutable budget + point ledgers.
- Feed:
  - `GET /feed` cursor pagination (created_at + id keyset).
  - Reactions and comments endpoints.
- Media:
  - Presigned upload endpoint with image 1MB cap.
  - Async media validation worker for video duration gate (3 minutes).
- Rewards:
  - Reward list + transactional redemption.
  - Idempotency via `x-idempotency-key`.
  - Anti double-spend using DB locks + unique idempotency.
- Notifications:
  - Persisted inbox (`/notifications`, `/notifications/read`).
  - Realtime websocket stream (`/notifications/stream`) with Redis fanout.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Start infra:

```bash
docker compose up -d
```

PostgreSQL is exposed on host port `54322` (mapped to container `5432`) to avoid conflicts with local Postgres installs.

3. Copy env:

```bash
cp .env.example .env
```

4. Run migrations:

```bash
npm run migrate
```

5. Start API and web:

```bash
npm run dev:api
npm run dev:web
```

## Nx tasks

- API serve: `npm exec nx run @org/api:serve`
- API migrate: `npm exec nx run @org/api:migrate`
- Web dev: `npm exec nx run @org/web:dev`
- Typecheck all: `npm run typecheck`
- Build all: `npm run build`

## Key API routes

- Auth: `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/oauth/:provider/start`, `/auth/oauth/:provider/callback`
- Upload: `/uploads/presign`, `/uploads/complete`
- Kudos/Feed: `/kudos`, `/feed`, `/kudos/:id/reactions`, `/kudos/:id/comments`
- Rewards: `/rewards`, `/rewards/:id/redeem`
- Notifications: `/notifications`, `/notifications/read`, websocket `/notifications/stream`
