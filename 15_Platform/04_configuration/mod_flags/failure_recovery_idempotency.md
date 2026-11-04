# PS-124-06 — Failure recovery and idempotency: Feature flags

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M02 Feature flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/flags` · **Contracts:** [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-124-06.R01** Writes are idempotent per CTR-IDM-001 and use expectedRevision, so retries and concurrent edits are safe.
- **PS-124-06.R02** A cascade is a single transaction; a failure leaves no partial change.
- **PS-124-06.R03** Evaluation falls back to registry defaults if settings cannot be read, but fails closed (off) for FUTURE modules and for relay-hosted features that need a host.

## Specification

- **idempotency:** Relay command requires Idempotency-Key and replays the stored response for 24 h. Vault-local set is idempotent by value: setting the same value with the matching revision returns the current state without a new event.
- **concurrency:** expectedRevision per key; the unique index on (scope, tenant_id, key) enforces one row. Cascades run in one BEGIN IMMEDIATE transaction on the relay or one IndexedDB readwrite transaction in the vault.
- **retries:** Clients retry only network errors and RATE_LIMITED with IDM-4 backoff; PLATFORM_FLAG_DEPENDENCY and CONFLICT_REVISION are not retried automatically.
- **offline:** Vault-scope flags work fully offline. Relay-scope changes need the relay and are not queued, because they are operator decisions that need live feedback; the operator console shows read-only when offline.
- **partial failure:** If the event insert fails the whole transaction rolls back. If cache invalidation fails the entry expires within 30 s. If settings cannot be read, evaluation uses registry defaults and logs a local diagnostic.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-124-09.T04 | integration | PS-124-03.R02, PS-124-06.R02 | cascade off of B with A and D on, injected failure on the third write | no key changed; without failure A, D, B off in one transaction with three events |
| TEST-PS-124-09.T09 | integration | PS-124-06.R01, PS-124-03.R01 | same Idempotency-Key replayed with same and different body; stale expectedRevision | original response replayed; IDEMPOTENCY_KEY_REUSED; CONFLICT_REVISION |
| TEST-PS-124-09.T10 | integration | PS-124-06.R03, PS-124-05.R03 | settings table unreadable, FUTURE module queried | defaults used, FUTURE and host-dependent features off, diagnostic logged |

## Dependencies

Module depends on: F15.S04.M01, F15.S04.M03, F15.S02.M03, CTR-FLG-001, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
