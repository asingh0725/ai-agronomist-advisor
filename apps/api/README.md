# Crop Copilot API (AWS)

Lambda-oriented API service that will become the canonical backend for web and iOS clients.

## Current scope (PR-03)

- health endpoint handler
- create input command handler (async recommendation job accepted)
- get recommendation job status handler
- in-memory store abstraction for local testing

## Scripts

```bash
pnpm --filter @crop-copilot/api build
pnpm --filter @crop-copilot/api test
```
