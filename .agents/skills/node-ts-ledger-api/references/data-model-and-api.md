# Data Model and API Notes

## Tables
- `wallets`: current available points.
- `budget_ledger`: monthly giving budget events.
- `point_ledger`: all debit/credit events.
- `kudos`, `rewards`, `redemptions`, `comments`, `reactions`.

## Critical Endpoints
- `POST /kudos`: transactional insert + budget debit + point credit.
- `POST /rewards/:id/redeem`: transactional wallet debit + redemption row.

## Business Errors
- `BUDGET_EXCEEDED`
- `SELF_KUDO_FORBIDDEN`
- `INSUFFICIENT_BALANCE`
- `DUPLICATE_REDEMPTION`
