#!/usr/bin/env bash
set -euo pipefail

# Quick smoke test for redemption race behavior.
# Required env:
#   BASE_URL=http://localhost:3000
#   TOKEN=<bearer token>
#   REWARD_ID=<reward id>
#   PARALLEL=10 (optional)

: "${BASE_URL:?BASE_URL is required}"
: "${TOKEN:?TOKEN is required}"
: "${REWARD_ID:?REWARD_ID is required}"
PARALLEL="${PARALLEL:-10}"

for i in $(seq 1 "$PARALLEL"); do
  curl -sS -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "$BASE_URL/rewards/$REWARD_ID/redeem" &
done
wait

echo "Submitted $PARALLEL concurrent redeem requests. Check DB: expect a single successful spend."
