## Goodjob MVP Plan: Postgres + Better Auth + Realtime Feed (Full Case Study)

### Summary

Implement the full `docs/CASE_STUDY_1_PLAN.md` scope in 5 tasks, using:

- Backend: Fastify + TypeScript, Drizzle ORM, PostgreSQL, Redis, BullMQ, WebSocket.
- Auth: Better Auth (self-hosted) with email/password, register, forgot/reset password, Google OAuth, Slack OAuth.
- Frontend: React + Vite + React Query + WebSocket client.
- Media: S3-compatible storage with presigned upload URLs; async media validation/processing worker.
- Data integrity: transaction + row locks + immutable ledgers + idempotency on redemption.

### Implementation Changes

1. **Task 1: Foundation (DB/Auth/Infra)**

- Add Postgres + Redis via Docker Compose for local dev.
- Create DB schema/migrations for case-study entities plus auth/media tables:
  - `users, sessions, accounts(oauth), password_reset_tokens`
  - `wallets, budget_ledger, point_ledger`
  - `kudos, reactions, comments, feed_events`
  - `rewards, redemptions`
  - `media_assets, notifications`
- Add core indexes for read-heavy feed/notifications:
  - `kudos(created_at desc)`, `feed_events(created_at desc)`, `notifications(user_id, created_at desc, read_at)`.
- Wire Better Auth into Fastify with cookie sessions and OAuth providers (Google/Slack).
- Shared package (`@org/shared`) exposes API DTOs + Zod schemas for auth, kudos, feed, rewards, notifications.

2. **Task 2: Kudos Core + Media Upload**

- Implement `POST /auth/register`, `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password`, OAuth start/callback routes.
- Implement `POST /uploads/presign` with constraints:
  - Image max 1MB.
  - Video max 3 minutes (180s) enforced in worker after upload metadata probe.
- Implement `POST /kudos` transaction flow:
  - Reject self-kudos.
  - Points must be 10–50.
  - Lock sender wallet/budget rows (`FOR UPDATE`) and write ledger rows atomically.
  - Persist `kudos` + `feed_events` + notification rows for receiver/tagged users.
- Frontend:
  - Replace static Login/Register/SendKudos pages with working forms.
  - Add upload flow (client validation + presigned upload + submit kudo with media key).

3. **Task 3: Feed Engagement + Realtime**

- Implement `GET /feed?cursor=...` with keyset pagination (created_at + id cursor).
- Implement `POST /kudos/:id/reactions`, `POST /kudos/:id/comments`.
- Add WebSocket gateway:
  - Redis pub/sub fanout for `feed.new`, `feed.reaction`, `feed.comment`, `notification.new`, `wallet.points_received`.
- Frontend:
  - Feed page hydrates from API and patches live updates from socket.
  - Notifications page reads persisted notifications and receives realtime inserts.
  - Wallet/point indicator updates on `wallet.points_received`.

4. **Task 4: Rewards + Redemption Integrity**

- Implement `GET /rewards` and `POST /rewards/:id/redeem`.
- Redemption uses transaction + row locks on wallet/reward stock + idempotency key header.
- Prevent double spend with unique idempotency record and consistent ledger writes.
- Emit notification event on successful redemption and show status updates.

5. **Task 5: Quality, Security, Delivery**

- Add API auth guards on all mutation routes.
- Add rate limiting and request validation.
- Add Nx targets and docs for running API/web/tests in one flow.
- Finalize README, `.env.example`, and architecture rationale mapped to case-study requirements.

### Public API/Interface Additions

- Auth: `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/oauth/:provider/start`, `/auth/oauth/:provider/callback`.
- Upload: `/uploads/presign`, optional `/uploads/complete`.
- Kudos/feed: `/kudos`, `/feed`, `/kudos/:id/reactions`, `/kudos/:id/comments`.
- Rewards: `/rewards`, `/rewards/:id/redeem`.
- Notifications: `/notifications`, `/notifications/read`, WebSocket channel `/notifications/stream` (or `/ws` namespace events).
- Shared DTOs/types exported from `@org/shared` for request/response + socket event payloads.

### Test Plan

- Unit:
  - points range validation (10–50), no self-kudo, monthly budget reset logic.
  - upload validators (image size cap, video duration cap contract).
- Integration (API + DB):
  - register/login/forgot/reset password flows.
  - kudos creation updates `budget_ledger` + `point_ledger` + notifications atomically.
  - feed query returns cursor-paginated, index-friendly ordering.
- Concurrency:
  - parallel redemption requests only allow one successful spend for same balance/stock.
  - repeated idempotency key returns stable redemption result.
- Realtime:
  - creating kudo publishes feed and notification events to subscribed clients.
- Security smoke:
  - unauthorized mutation blocked.
  - rate-limited auth endpoints.
  - OAuth callback rejects invalid state.

### Assumptions and Defaults

- Full case-study MVP scope is required (including rewards/redemption).
- Auth stack: self-hosted Better Auth.
- Media storage: S3-compatible bucket with presigned uploads.
- Realtime transport: WebSocket + Redis pub/sub fanout.
- Notification scope for now: in-app realtime + persisted inbox (no email/push).
- Video handling: async validation/metadata extraction; reject clips longer than 180 seconds.
