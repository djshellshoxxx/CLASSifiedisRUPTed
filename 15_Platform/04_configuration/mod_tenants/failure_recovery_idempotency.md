# PS-125-06 — Failure recovery and idempotency: Tenants

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M03 Tenants](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/tenants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-125-06.R01** All relay commands are idempotent per CTR-IDM-001 and use expectedRevision, so concurrent operator edits never overwrite each other.
- **PS-125-06.R02** Bootstrap is safe to run repeatedly and never creates duplicate tenants.
- **PS-125-06.R03** Vault-local settings changes work offline and have no distributed effect.

## Specification

- **idempotency:** Relay commands require Idempotency-Key with 24 h replay. platform.tenant.create with an existing slug and identical content returns the existing tenant (idempotent), with different content PLATFORM_TENANT_SLUG_TAKEN. platform.local_settings.update with the same patch returns the current revision.
- **concurrency:** expectedRevision on configure, assign_operator and change_status; the unique slug index serializes concurrent creates; all writes run in one BEGIN IMMEDIATE transaction together with the outbox event row.
- **retries:** Clients retry network errors and RATE_LIMITED with IDM-4 backoff; conflicts and validation errors are not retried automatically.
- **offline:** Tenant commands need the relay and are not queued because they are operator decisions needing live feedback; clients cache platform.tenant.get for 30 s and show last-known configuration marked as possibly stale when the relay is unreachable. LocalSettings work fully offline.
- **partial failure:** If publishing the event row fails the transaction rolls back and no change is visible. If a consumer fails on platform.tenant.configured it retries and dead-letters per CTR-EVT-001 EVT-6 without affecting the tenant record.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-125-09.T04 | integration | PS-125-03.R03, PS-125-04.R02, PS-125-06.R03 | status change with injected event-insert failure | transaction rolled back, no status change visible, no event |
| TEST-PS-125-09.T07 | integration | PS-125-06.R01, PS-125-06.R02 | replay same Idempotency-Key with same and different body; run bootstrap twice; stale expectedRevision | original response replayed; IDEMPOTENCY_KEY_REUSED; second bootstrap returns existing tenant; CONFLICT_REVISION |
| TEST-PS-125-09.T08 | integration | PS-125-06.R03, PS-125-05.R03 | vault offline, change language and currencies; relay offline, read tenant | LocalSettings update works; tenant read shows cached configuration marked stale |

## Dependencies

Module depends on: F15.S02.M03, F15.S04.M01, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
