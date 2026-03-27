# Goodjob Case Study 1 Plan (Good Job MVP)

## 1) Goal and target score
Build a production-ready MVP in 3 days that safely supports kudos, live feed, and reward redemption.

Target score: 75+ (Senior threshold is >70).

## 2) Scope to implement
1. Authenticated users can give kudos with points (10-50), description, core value tag, and media.
2. Monthly giving budget is 200 points per user and resets on day 1 each month.
3. Live feed supports emoji reactions, comments, and tagged-user notifications in real time.
4. Reward catalog and redemption with anti-double-spend guarantees.
5. Tests for budget logic, self-give prevention, and concurrent redemption.

## 3) Proposed architecture
- Monorepo: `apps/web`, `apps/api`, `packages/shared`.
- Frontend: React + TypeScript + Tailwind + React Query.
- Backend: Node.js + TypeScript + Fastify (or NestJS/Express if preferred).
- DB: PostgreSQL (or SQLite for local), Redis for pub/sub + queue + cache.
- Media: direct upload via pre-signed URL or queue-based processing worker.
- Real-time: WebSocket gateway + Redis pub/sub fanout.
- Background jobs: BullMQ (Redis) for video processing/transcoding metadata.

## 4) Data model (minimum)
- `users(id, email, display_name, created_at)`
- `wallets(user_id, available_points, updated_at)`
- `budget_ledger(id, user_id, month_key, delta_points, reason, ref_type, ref_id, created_at)`
- `kudos(id, sender_id, receiver_id, points, description, core_value, media_url, created_at)`
- `feed_events(id, kudo_id, actor_id, type, payload_json, created_at)`
- `reactions(id, kudo_id, user_id, emoji, created_at, unique(kudo_id,user_id,emoji))`
- `comments(id, kudo_id, user_id, text, media_url, created_at)`
- `rewards(id, name, cost_points, stock, active, created_at)`
- `redemptions(id, user_id, reward_id, cost_points, status, created_at)`
- `point_ledger(id, user_id, delta_points, direction, reason, ref_type, ref_id, created_at)`

## 5) Critical integrity rules
1. No self-kudos.
2. Kudo points must be within 10-50.
3. Monthly give budget enforced by DB transaction + row lock on budget/wallet rows.
4. Redemption flow uses `SELECT ... FOR UPDATE` and idempotency key per request.
5. All point changes recorded in immutable ledger rows.

## 6) API slice
- `POST /kudos`
- `GET /feed?cursor=...`
- `POST /kudos/:id/reactions`
- `POST /kudos/:id/comments`
- `GET /rewards`
- `POST /rewards/:id/redeem`
- `GET /notifications/stream` (WebSocket preferred)

## 7) Task-based execution plan
### Task 1: Foundation setup
- Bootstrap monorepo, auth stub, DB schema, migrations.

### Task 2: Kudos core flow
- Implement kudos write path with transaction + budget checks.
- Build basic web form and feed list.

### Task 3: Engagement and real-time
- Add reactions/comments + real-time notification channel.

### Task 4: Rewards and media
- Build reward catalog and atomic redemption flow.
- Add media upload path (async processing; no API blocking).

### Task 5: Quality and delivery
- Tests (unit + integration + concurrency).
- Docker compose, CI pipeline, README, `.env.example`.
- UI polish: loading states, responsive layouts, errors.

## 8) Test plan (must-have)
- Unit: budget reset, points validation, no self-kudo.
- Integration: give-kudo persists records + budget ledger update.
- Concurrency: parallel redeem requests only produce one successful spend.
- Security smoke: rate limit, CSRF, auth checks on all mutation endpoints.

## 9) Risks and mitigation
- Race conditions: use DB locks, unique constraints, idempotency tokens.
- Video processing latency: async queue + background worker.
- Feed performance: keyset pagination and minimal joins.

## 10) Deliverables checklist
1. Source code with clear frontend/backend separation.
2. Professional commits.
3. README with setup, architecture rationale, env vars.
4. Dockerized local run and CI checks.
5. Test evidence for required edge cases.
