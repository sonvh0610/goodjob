# Production Deployment and CI/CD Runbook

This repository now includes CI and CD workflows:

- CI: `.github/workflows/ci.yml`
- CD: `.github/workflows/cd.yml`

## Delivery Model

1. CI runs on pull requests and `main` pushes:
   - `nx format:check`
   - `nx affected --targets=typecheck,test,build`
2. CD runs on `main` pushes (or manually):
   - builds API image
   - pushes API image to GHCR
   - deploys API/Postgres/Redis on EC2 over SSH
   - runs DB migrations before restarting API
   - deploys web to Vercel production

## New Production Artifacts

- `Dockerfile.api`: builds and runs Fastify API (`node apps/api/dist/main.js`).
- `deploy/docker-compose.aws-nano.yml`: EC2 nano compose stack for `api + postgres + redis`.

## Required GitHub Secrets

Set these in repository settings before enabling production CD:

- `PROD_SSH_HOST`: production host/IP.
- `PROD_SSH_PORT`: SSH port (usually `22`).
- `PROD_SSH_USER`: SSH user on production host.
- `PROD_SSH_PRIVATE_KEY`: private key for that user.
- `PROD_DEPLOY_PATH`: absolute path on server where this repo is checked out.
- `GHCR_USERNAME`: GHCR username for pull access from server.
- `GHCR_READ_TOKEN`: PAT with `read:packages` scope.
- `VERCEL_TOKEN`: Vercel token with deploy permission.
- `VERCEL_ORG_ID`: Vercel org/team ID.
- `VERCEL_PROJECT_ID`: Vercel project ID for `apps/web`.

## First-Time Server Setup

1. Install Docker + Docker Compose plugin on production host.
2. Clone this repository at `PROD_DEPLOY_PATH` on the host.
3. Create `PROD_DEPLOY_PATH/.env.prod` with production values:
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DB`
   - `NODE_ENV=production`
   - `HOST=0.0.0.0`
   - `PORT=3000`
   - `DATABASE_URL`
   - `REDIS_URL`
   - `APP_BASE_URL` (example: `https://web-hoaison-vos-projects.vercel.app`)
   - `API_BASE_URL` (example: `https://web-hoaison-vos-projects.vercel.app/api`)
   - `VITE_WS_BASE_URL` (optional, required for true realtime if your frontend proxy does not forward websocket upgrades)
   - `SESSION_COOKIE_NAME`
   - `SESSION_TTL_HOURS`
   - `JWT_SECRET`
   - `S3_ENDPOINT` (optional if using AWS S3 directly)
   - `S3_REGION`
   - `S3_ACCESS_KEY_ID`
   - `S3_SECRET_ACCESS_KEY`
   - `S3_BUCKET`
   - OAuth secrets/redirect URIs as needed
   - `RATE_LIMIT_MAX`
   - `RATE_LIMIT_WINDOW`
4. Ensure `docker-compose` (or `docker compose`) is available on the host.

## Deployment Flow Executed by CD

The CD workflow runs this sequence on the server:

1. `git fetch` + `git checkout main` + `git pull --ff-only`
2. `docker login ghcr.io`
3. `docker-compose --env-file .env.prod -f deploy/docker-compose.aws-nano.yml pull api`
4. `docker-compose --env-file .env.prod -f deploy/docker-compose.aws-nano.yml up -d postgres redis`
5. `docker-compose --env-file .env.prod -f deploy/docker-compose.aws-nano.yml run --rm api node apps/api/dist/apps/api/src/app/db/migrate.js`
6. `docker-compose --env-file .env.prod -f deploy/docker-compose.aws-nano.yml up -d api`
7. `docker image prune -f`
8. `npm exec nx run @org/web:build` with `VITE_API_BASE_URL=/api`, optionally set `VITE_WS_BASE_URL` to a websocket-capable public API origin, copy `apps/web/dist` into `.vercel/output/static`, add Vercel route `/api/* -> http://$PROD_SSH_HOST/*`, then `npx vercel deploy --prebuilt --prod --public --yes --token="$VERCEL_TOKEN"`

Note: the Vercel `/api/*` rewrite is suitable for HTTP requests, but websocket upgrades may not survive that hop. If `VITE_WS_BASE_URL` is not set, the web app will fall back to polling for notification-driven refreshes.

## Smoke Checks After Deploy

Run on production host:

```bash
docker-compose -f deploy/docker-compose.aws-nano.yml ps
curl -f http://localhost/healthz
```

Then verify application flows:

1. Login + session persistence.
2. Send kudos (10-50 points).
3. React/comment update in feed.
4. Redeem reward with idempotency key.

## Rollback

To roll back to previous image tag:

1. Set `IMAGE_TAG=<previous_sha>` in shell on production host.
2. Re-run:

```bash
docker-compose -f deploy/docker-compose.aws-nano.yml pull api
docker-compose -f deploy/docker-compose.aws-nano.yml up -d api
```

If schema changed, use your DB rollback policy before or after image rollback depending on migration compatibility.
