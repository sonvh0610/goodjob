---
name: node-ts-ledger-api
description: Implement Node.js plus TypeScript backend APIs with transaction safety and ledger integrity for point-based systems. Use when building kudos creation, monthly budget enforcement, reward redemption, race-condition protection, and API/integration tests.
---

# Node TS Ledger API

## Overview
Build reliable API flows where points and balances never drift, even under concurrent requests.

## Stack Assumptions (Current Plan)
- Runtime/API: Fastify + TypeScript.
- Persistence: Drizzle ORM + PostgreSQL.
- Auth: Better Auth (self-hosted), cookie sessions, email/password + Google/Slack OAuth.
- Async/realtime: Redis + BullMQ + WebSocket.

## Workflow
1. Model wallet, budget ledger, and immutable point ledger first.
2. Implement write paths inside explicit DB transactions.
3. Apply row-level locks for budget/redeem critical sections.
4. Emit events only after transaction commit.
5. Add integration tests for each mutation endpoint.

## Mandatory Integrity Rules
- Reject self-kudos.
- Enforce points range 10-50.
- Enforce monthly giving budget = 200.
- Guarantee no double spend on redeem.
- Persist all point changes to immutable ledger entries.

## API Design Guidance
- Prefer Better Auth route surface:
  - `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`
  - `POST /auth/forgot-password`, `POST /auth/reset-password`
  - `GET /auth/oauth/:provider/start`, `GET /auth/oauth/:provider/callback`
- Use idempotency keys for redeem endpoint.
- Use cursor pagination for feed endpoints.
- Keep validation at boundary (schema validation).
- Return deterministic error codes for business rule violations.

## Data Consistency Guidance
- Use `SELECT ... FOR UPDATE` around wallet and budget rows.
- Add unique indexes for idempotent operations.
- Keep business calculations in one service layer, not controllers.

## Testing Guidance
- Unit tests for budget math and validation.
- Integration test for give-kudo flow from HTTP to DB.
- Concurrency test for rapid multiple redeem attempts.

## References and scripts
- Read [data model and API notes](references/data-model-and-api.md).
- Use [`scripts/race_redeem_test.sh`](scripts/race_redeem_test.sh) for quick local concurrency smoke checks.
