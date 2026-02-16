# AWS Production Cutover Runbook

## Goal

Safely migrate `/api/v1/*` traffic from legacy Supabase-backed handlers to the AWS API without downtime.

## Preconditions

- PR-01 through PR-10 are deployed and healthy in the target environment.
- AWS API base URL is reachable and has Cognito auth configured.
- CloudWatch dashboard and alarms from PR-10 are active.

## Stage 1: Parity Validation (No User Traffic Shift)

1. Set parity env vars:
   - `LEGACY_API_BASE_URL`
   - `AWS_API_BASE_URL`
   - `API_PARITY_BEARER_TOKEN`
2. Run:
   - `pnpm cutover:parity`
3. Fix any status/shape mismatches before canary rollout.

## Stage 2: Canary Rollout (Bearer Token Traffic)

1. Configure web runtime:
   - `AWS_API_BASE_URL=https://<aws-api-domain>`
   - `AWS_API_CUTOVER_MODE=canary`
   - `AWS_API_CUTOVER_PERCENT=10`
2. Monitor for at least 24 hours:
   - `crop-copilot-<env>-ops` dashboard
   - queue backlog alarms
   - recommendation failure alarm
   - recommendation cost alarm
3. Increase canary in steps (25 -> 50 -> 100) only if alarms stay healthy.

## Stage 3: Forced AWS Mode

1. Set:
   - `AWS_API_CUTOVER_MODE=aws`
2. Re-run:
   - `pnpm cutover:parity`
   - `pnpm cutover:supabase-audit`
3. Keep Supabase infra read-only during stabilization window.

## Stage 4: Supabase Decommission

Proceed only after:

- parity checks pass repeatedly in production,
- cutover alarms remain healthy through one full usage cycle,
- `pnpm cutover:supabase-audit` reports no backend references in `apps/api`, `packages`, or `infra`.

Then:

1. Remove remaining Supabase runtime paths in web/iOS.
2. Remove Supabase env vars from deployment.
3. Archive Supabase project after backup/export.

## Rollback

If canary causes regressions:

1. Set `AWS_API_CUTOVER_MODE=legacy`.
2. Redeploy web.
3. Investigate parity/metrics deltas before retrying canary.
