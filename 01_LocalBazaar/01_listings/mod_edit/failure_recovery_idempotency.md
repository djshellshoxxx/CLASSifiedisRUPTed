# PS-003-06 — Failure recovery and idempotency: Listing editing

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M02 Listing editing](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/edit` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-003-06.R01** Edits are idempotent per CTR-IDM-001 and always carry expectedRevision.
- **PS-003-06.R02** The revision snapshot, the Listing update and the outbox event commit in one IndexedDB transaction or not at all.
- **PS-003-06.R03** Edits made offline are committed locally; no relay acknowledgement is claimed, and the UI shows unsent changes until the projection is sent.

## Specification

- **idempotency:** Idempotency-Key required on edit; the key and request hash are kept 24 h in the vault; replay returns the stored result.
- **concurrency:** expectedRevision on every call; a stale value returns CONFLICT_REVISION with params.currentRevision and the app shows both versions for manual resolution; no last-writer-wins.
- **retries:** Only IndexedDB transaction aborts are retried (max 3); policy and validation errors are not retried.
- **offline:** Edits work offline. Sync-outbox state for the projection belongs to F01.S01.M03: local committed, prepared, transport_acknowledged, peer_accepted.
- **partial failure:** If the prohibited-rule pack cannot be read, the edit is refused with DEPENDENCY_UNAVAILABLE rather than stored unchecked.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-003-09.T08 | integration | PS-003-06.R01, PS-003-06.R02, PS-003-06.R03 | replay edit; abort transaction after outbox write; edit offline | one revision per key; atomic outcome; unsentChanges true and no peer-accepted claim |
| TEST-PS-003-09.T09 | integration | PS-003-06.R02 | two tabs edit with the same expectedRevision | one succeeds, other CONFLICT_REVISION with currentRevision |

## Dependencies

Module depends on: F01.S01.M01, F18.S01.M02, F18.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
