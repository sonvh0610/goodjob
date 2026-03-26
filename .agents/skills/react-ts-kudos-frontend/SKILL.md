---
name: react-ts-kudos-frontend
description: Build and refine React 18 plus TypeScript frontend features for Amanotes-style recognition apps. Use when implementing kudos forms, live feed UI, reactions/comments UX, responsive layouts, loading/error states, client validation, and frontend test coverage.
---

# React TS Kudos Frontend

## Overview
Implement high-quality frontend flows for kudos creation, feed browsing, and engagement interactions with strong type safety and predictable state handling.

## Workflow
1. Define route and component boundaries before coding.
2. Define API contracts in a typed client layer.
3. Implement UI with loading, empty, and error states first.
4. Add optimistic updates only after server contracts are stable.
5. Add component and integration tests for critical user journeys.

## Implementation Standards
- Use TypeScript strict mode.
- Use React Query (or equivalent) for server state.
- Keep forms schema-driven with shared validation rules.
- Keep mutation side effects in hooks, not in view components.
- Use accessible controls for reactions, comments, and uploads.
- Prevent duplicate submits with disabled-state and request guards.

## Required UI Flows
1. Give Kudo form: receiver, points, description, core value tag, media upload.
2. Feed: paginated list with reactions and comments.
3. Notification indicators for tagged users.
4. Reward catalog and redeem action with optimistic lock-friendly UX.

## Frontend Testing Focus
- Form validation for point range and required fields.
- Disabled states during submit and redeem actions.
- Feed pagination and cursor continuation.
- Rendering fallback states for failed requests.

## References
- Read [component map](references/component-map.md) before structuring new pages.
