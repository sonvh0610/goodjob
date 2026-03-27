---
name: docker-ci-quality-gates
description: Set up Dockerized local environments and CI quality gates for fullstack TypeScript apps. Use when creating docker-compose stacks, GitHub Actions pipelines, lint/test/build gates, and release-readiness checks for React plus Node plus Redis plus Postgres systems.
---

# Docker CI Quality Gates

## Overview
Create consistent local and CI workflows that prevent regressions and prove delivery quality.

## Workflow
1. Define service topology in `docker-compose.yml`.
2. Ensure deterministic dependency install and build steps.
3. Add CI gates: lint, typecheck, tests, build.
4. Add migration and health-check steps.
5. Publish artifacts or deployment evidence.

## Compose Baseline
- `web` (React)
- `api` (Node)
- `postgres`
- `redis`
- optional `worker`

## CI Gate Baseline
- `npm exec nx run-many -t lint`
- `npm exec nx run-many -t typecheck`
- `npm exec nx run-many -t test`
- `npm exec nx run-many -t build`

## Release Readiness Checklist
- `.env.example` exists and documented.
- Migrations run in CI.
- Failing tests block merge.
- Smoke endpoint check after deployment.

## References
- Read [pipeline template notes](references/pipeline-template.md).
