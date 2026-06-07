# Operations Runbook

## Production checklist

- `AUTH_SECRET` is unique and rotated for production
- `TRUSTED_ORIGINS` includes real deployment domains
- `NEXT_PUBLIC_SITE_URL` points to the live origin
- SMTP credentials have been tested
- `npx prisma migrate deploy` has completed successfully
- the latest `npm run verify` and `npm run e2e` have passed
- backup and restore procedures are documented and reachable
- admin audit and rate-limit tables are monitored
- Sentry DSN and deploy secrets are configured if external monitoring is desired

## Deploy flow

1. `npm install`
2. `npx prisma generate`
3. `npx prisma migrate deploy`
4. `npm run verify`
5. `npm run build`
6. start the application
7. `GET /api/health/live`
8. `GET /api/health/ready`
9. `npm run ops:status`

## Ops status

Quick operational summary:

```powershell
npm run ops:status
```

Fail-fast assertion for CI or cron:

```powershell
npm run ops:assert
```

Combined incident snapshot:

```powershell
npm run ops:report
```

Backup and restore drill:

```powershell
npm run ops:backup:drill
npm run ops:backup:assert
```

The summary reports:

- low-stock active product count
- orders open longer than expected
- recent rate-limit block count
- expired password reset tokens
- stale replay guard records
- site settings presence
- admin user presence

Order anomaly report:

```powershell
npm run ops:orders:anomalies
```

This report separates:

- stuck fulfillment or payment
- confirmed payment with no order progression
- shipped orders missing tracking
- cancelled or refunded orders missing inventory restore markers
- bank transfer orders missing payment records

Dry run for timed-out bank transfer orders:

```powershell
npm run ops:orders:timeout:dry
```

Real application:

```powershell
npm run ops:orders:timeout:apply
```

This command only cancels orders that are:

- `WAITING_PAYMENT`
- `BANK_TRANSFER`
- older than the configured timeout
- not already restored back into inventory

## Cleanup and retention

Preview:

```powershell
npm run ops:cleanup:dry
```

Apply:

```powershell
npm run ops:cleanup:apply
```

Cleanup covers:

- old admin audit rows
- expired rate-limit rows
- expired replay guard rows
- stale password reset tokens

## Backup and restore

- take PostgreSQL backups independently from deploys
- create a snapshot before running migrations
- after restore, confirm `GET /api/health/ready`
- if `BACKUP_DRILL_RESTORE_DATABASE_URL` is configured, run the restore drill regularly

## Incident notes

- for suspected duplicate checkout, inspect `OperationReplayGuard` together with related `Order` rows
- for admin operation incidents, correlate logs with `AdminAuditLog.requestId`
- for abuse spikes, inspect `ActionRateLimit` by scope
- for CSP rollout, review report-only findings before moving to enforced mode
