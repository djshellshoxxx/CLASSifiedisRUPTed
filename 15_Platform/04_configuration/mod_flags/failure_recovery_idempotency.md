# PS-124-06 — Failure recovery and idempotency: Feature flags

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M02 Feature flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/flags` · **Contracts:** [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-124-06.R01** Writes are idempotent per CTR-IDM-001 and use expectedRevision, so retries and concurrent edits are safe.
- **PS-124-06.R02** A cascade is a single transaction; a failure leaves no partial change.
- **PS-124-06.R03** When settings cannot be read, evaluation fails closed - it uses the last committed values kept in memory or in the mirror row, and when none are available every switchable non-core module evaluates off, the UI shows "settings unavailable" and the relay answers DEPENDENCY_UNAVAILABLE for relay commands of affected modules; FUTURE modules and relay-hosted features that need a host are always off without a value.

## Specification

- **idempotency:** Relay commands (set_relay, reset_relay) require Idempotency-Key and replay the stored response for 24 h. Vault-local set and reset are idempotent by value: setting the same value with the matching revision, or resetting a key with no row, returns the current state without a new event.
- **concurrency:** expectedRevision per key; the unique index on (scope, tenant_id, key) enforces one row. Cascades run in one BEGIN IMMEDIATE transaction on the relay or one IndexedDB readwrite transaction in the vault, together with the mirror row.
- **retries:** Clients retry only network errors, DEPENDENCY_UNAVAILABLE and RATE_LIMITED with IDM-4 backoff; PLATFORM_FLAG_DEPENDENCY and CONFLICT_REVISION are not retried automatically.
- **offline:** Vault-scope flags work fully offline. Relay-scope changes need the relay and are not queued, because they are operator decisions that need live feedback; the operator console shows read-only when offline.
- **partial failure:** If the event insert fails the whole transaction rolls back. If cache invalidation fails the entry expires within 30 s. If settings cannot be read, evaluation uses the last committed values from memory or the mirror row; with none it evaluates every switchable non-core module off, logs a local diagnostic and retries the read at the next evaluation after 5 s; it never falls back to registry defaults for a key that may have a stored off value.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-124-09.T04 | integration | PS-124-03.R02, PS-124-06.R02 | cascade off of B with A and D on, injected failure on the third write | no key changed; without failure A, D, B off in one transaction with three events |
| TEST-PS-124-09.T09 | integration | PS-124-06.R01, PS-124-03.R01 | same Idempotency-Key replayed with same and different body on set_relay and reset_relay; stale expectedRevision | original response replayed; IDEMPOTENCY_KEY_REUSED; CONFLICT_REVISION |
| TEST-PS-124-09.T10 | integration | PS-124-06.R03, PS-124-05.R03 | user turns F13 push and F06 location off, then the settings store becomes unreadable in a new process with and without the mirror row; relay settings unreadable; FUTURE module queried | with the mirror the switched-off modules stay off (source last_committed); without it every switchable non-core module is off (source fail_closed) and 'settings unavailable' is shown; relay commands of affected modules answer DEPENDENCY_UNAVAILABLE; FUTURE module off |

## Dependencies

Module depends on: F15.S04.M01, F15.S04.M03, F15.S02.M03, F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FLG-001, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
