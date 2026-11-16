# PS-079-06 — Failure recovery and idempotency: Retention and legal hold

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M02 Retention and legal hold](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/retention` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-079-06.R01** Policy changes and hold steps are idempotent with Idempotency-Key on the relay and vault command IDs in the vault, and use expectedRevision.
- **PS-079-06.R02** Sweeps commit in batches with a persisted cursor and resume after interruption without double counting.
- **PS-079-06.R03** Hold checks fail closed, so if the hold table cannot be read, relay purges of that subject are skipped.

## Specification

- **idempotency:** Relay commands require Idempotency-Key with replay for 24 h; vault commands record a command ID for 24 h; purge batches are keyed by (runId, kind, cursor).
- **concurrency:** expectedRevision on hold transitions; unique constraint prevents two active holds per subject; a sweep takes a single-flight lock (Web Lock in the vault, SQLite advisory row on the relay); purge re-checks hold state inside the same transaction that deletes.
- **retries:** A failed sweep batch is retried 3 times with 1 s, 5 s and 30 s backoff, then the run is marked partial and resumes at the next schedule.
- **offline:** Vault sweeps run offline. Relay holds require the relay; the console shows relay unreachable.
- **partial failure:** A partial run records which kinds completed; unfinished kinds are retried next run. Records are never half-purged because each batch is one transaction.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-079-09.T10 | chaos | PS-079-06.R02, PS-079-06.R03 | kill sweep mid-run and corrupt the hold table read | resume from cursor without double count; purge of affected subjects skipped |
| TEST-PS-079-09.T11 | integration | PS-079-06.R01 | replay of Idempotency-Key and vault command ID; vault offline sweep | original results; offline sweep completes |

## Dependencies

Module depends on: F18.S01.M01, F16.S01.M01, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
