# Render CI/CD (dev) — Design

## Goal

Add a GitHub Actions pipeline for the `dev` branch that:

- Runs fast CI checks on every PR targeting `dev`
- Runs the same CI checks on every push to `dev`
- Triggers a Render deployment after CI passes on push-to-`dev`

## Scope

In-scope:

- Node.js install (`npm ci`)
- Prisma checks (`prisma validate`, `prisma generate`) using a dummy `DATABASE_URL`
- Docker image build (`docker build`)
- Deployment trigger to Render via Deploy Hook

Out-of-scope:

- Spinning up Postgres/Redis in CI
- Running database migrations automatically as part of deploy
- Integration/e2e tests

## Approach (Recommended)

Single workflow file: `.github/workflows/ci-dev.yml`

- `ci` job runs on both `pull_request` and `push` for `dev`
- `deploy` job runs only when the event is `push` to `dev` and only after `ci` succeeds

## Secrets / Configuration

GitHub repository secret required:

- `RENDER_DEPLOY_HOOK_URL`: Render “Deploy Hook” URL for the dev service

## Success Criteria

- A PR to `dev` shows CI status and does not attempt deployment
- A push to `dev` runs CI and then triggers a Render deploy via the hook
- Deployment step fails fast with a clear error if `RENDER_DEPLOY_HOOK_URL` is missing

