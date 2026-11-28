# PS-019-06 — Failure recovery and idempotency: Matching participant eligibility

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M04 Matching participant eligibility](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/party` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-019-06.R01** Commands are idempotent per CTR-IDM-001 and update uses expectedRevision for optimistic concurrency inside the vault.
- **PS-019-06.R02** Projection publication is at-least-once through the sync outbox and receivers dedupe by cid.
- **PS-019-06.R03** A crash between local commit and statement signing leaves the record committed with syncState local_committed and the next open re-prepares the statement.

## Specification

- **idempotency:** Idempotency-Key replay 24 h; projections dedupe by cid, so re-sending the same seq is harmless.
- **concurrency:** expectedRevision on update; multi-device conflicts surface a resolve prompt for private fields and use the higher seq for the public projection after the user confirms; no silent merge.
- **retries:** Outbox retries per IDM-4 (base 500 ms, cap 30 s, max 6 attempts per relay, then waits for user or reconnect); a failed relay never blocks local state.
- **offline:** update commits locally and shows 'saved on this device, not yet published'; the projection waits in the outbox; matching in the vault already uses the new local values.
- **partial failure:** If one of three selected relays acknowledges and others fail, the UI shows 1 of 3 relays acknowledged; the profile stays opted_in and the remaining deliveries retry.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-019-09.T05 | integration | PS-019-03.R02, PS-019-06.R03 | opt out while all relays unreachable | tombstone queued with state prepared and delivered on reconnect |
| TEST-PS-019-09.T07 | integration | PS-019-04.R01, PS-019-04.R03, PS-019-06.R01 | replay update with same key and different body | original response replayed; IDEMPOTENCY_KEY_REUSED |
| TEST-PS-019-09.T11 | integration | PS-019-06.R02, PS-019-06.R01 | two devices update concurrently | resolve prompt surfaced, higher seq wins public projection after confirmation |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F06.S02.M01, F16.S02.M03, F12.S03.M04, F15.S01.M01, F11.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
