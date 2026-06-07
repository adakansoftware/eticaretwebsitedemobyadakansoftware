# Adakan Commerce Core

This repository is no longer a storefront-only demo. It is structured as a production-minded commerce core with hardened auth, checkout, stock integrity, admin operations, and operational verification tooling.

## Production-oriented highlights

- Trusted-origin protection and request-id propagation in the proxy layer
- Hardened session and JWT issuer/audience validation
- Rate limiting for auth, checkout, upload, and admin mutations
- Checkout replay guard to reduce duplicate order creation
- Variant-aware stock decrement and safe stock restore on cancel or return
- Admin audit trail with request-id correlation
- `live`, `ready`, and admin-gated `ops` health endpoints
- Cleanup, anomaly, timeout, preflight, and assert operational scripts
- Unified `verify` pipeline
- Behavior tests plus Playwright E2E coverage
- Report-only CSP and stronger security headers ready for production rollout

## Stack

- Next.js App Router
- TypeScript
- Prisma + PostgreSQL
- Server Actions and Route Handlers
- Zod
- Playwright
- Sentry-ready instrumentation

## Setup

```powershell
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

## Core commands

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm run verify
npm run e2e
npm run ops:preflight
npm run ops:assert
npm run ops:report
npm run ops:cleanup:dry
```

`npm run ops:cleanup:apply` deletes stale operational records and should be used deliberately in production.

## Health endpoints

- `GET /api/health/live`
- `GET /api/health/ready`
- `GET /api/health/ops`

`ready` verifies environment, database connectivity, and critical tables. Responses include the `x-request-id` header.

## Security notes

- `AUTH_SECRET` must be long and unique
- `TRUSTED_ORIGINS` must include real production domains
- Admin mutations pass through auth, trusted-origin, and rate-limit checks
- Checkout creation uses a replay guard against duplicate submits
- Security headers include HSTS in production and CSP in report-only mode by default

## Sentry and deploy

- Sentry is optional and env-gated. If `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` are missing, it stays as a no-op.
- `.github/workflows` includes `CI`, `Ops Cron`, `Backup Drill`, `Deploy Staging`, and `Deploy Production`.
- Staging and production deploys require `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, the right environment `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, and any needed Sentry secrets.

## Operations guides

See:

- [OPERATIONS.md](C:/Users/adaka/Desktop/aktif%20projeler/eticaretdemobyadakansofttware/OPERATIONS.md)
- [STRENGTHENING.md](C:/Users/adaka/Desktop/aktif%20projeler/eticaretdemobyadakansofttware/STRENGTHENING.md)

## Seed policy

- Demo seed data is for development and controlled test environments only
- Do not run seed in production

## Demo accounts

```txt
Admin
admin@adakancommerce.com
Admin12345

Customer
musteri@adakancommerce.com
User12345
```
