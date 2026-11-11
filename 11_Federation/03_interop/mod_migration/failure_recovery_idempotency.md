# PS-090-06 — Failure recovery and idempotency: Account and relay migration

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M03 Account and relay migration](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/migration` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-090-06.R01** All commands are idempotent per CTR-IDM-001 and mutating commands require expectedRevision.
- **PS-090-06.R02** The copy step is resumable and re-sends only entries without a receipt, relying on cid dedup at the new relay.
- **PS-090-06.R03** A failure before effective leaves the old relay as the user's selected delivery relay and the vault untouched; no relay is authoritative for the principal's records.

## Specification

- **idempotency:** Idempotency-Key on all commands (24 h replay); announce replay returns the same moveCid; receive_move is idempotent by move cid and keeps the first firstReceivedAt.
- **concurrency:** expectedRevision on state changes; unique index allows one open own migration per principal; a veto and the effective promotion race on this receiver's clock, comparing the veto's local receipt time with effectiveAt, with ties going to the veto.
- **retries:** Copy and statement delivery use the outbox retry rules of F11.S02.M01 and F15.S01.M01; this module does not retry independently.
- **offline:** Prepare and cancel work offline; copy, announce and veto need connectivity and the UI shows delivery states per step without claiming completion; an offline receiver starts its window at first receipt, so being offline never shortens the veto window.
- **partial failure:** If the new relay accepts some records but not all, migration stays prepared with copyProgress.failed listed and announce is refused until failures are under 1 percent or the user accepts leaving them behind explicitly.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-090-09.T09 | integration | PS-090-06.R01, PS-090-06.R02 | replay announce; kill app during copy then resume | same moveCid; copy resumes without duplicates |
| TEST-PS-090-09.T10 | chaos | PS-090-06.R02, PS-090-06.R03 | new relay accepts 95 of 100 records; new relay goes down before effective | announce refused with PRECONDITION_FAILED until under 1 percent failed or explicit acceptance; the old relay stays the selected delivery relay and the vault is untouched |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S02.M03, F11.S03.M01, F07.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
