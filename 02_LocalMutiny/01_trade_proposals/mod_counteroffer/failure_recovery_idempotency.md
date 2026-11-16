# PS-012-06 — Failure recovery and idempotency: Barter counteroffers

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M04 Barter counteroffers](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/counteroffer` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-012-06.R01** create and ingest are idempotent; ingest dedupes by contentHash and create by Idempotency-Key.
- **PS-012-06.R02** Revision creation is one IndexedDB transaction covering the record, the event and the outbox entry.
- **PS-012-06.R03** Forks are never merged automatically, and recovery is explicit renegotiation as a new subject.

## Specification

- **idempotency:** Idempotency-Key replay 24 h for create; ingest is idempotent by contentHash (a duplicate is acknowledged and skipped, EVT-3).
- **concurrency:** expectedHeadRevisionNo guards create inside the vault; two devices of one principal are serialized by an IndexedDB transaction on the subject head; cross-party races are detected as forks, never resolved by last-writer-wins.
- **retries:** Outbox delivery retries with IDM-4 backoff (base 500 ms, cap 30 s, max 6 attempts per destination, then waits for reconnect or user action).
- **offline:** Revisions can be created offline; they stay local_committed or prepared and the UI never claims delivery; peers see them only after transport acknowledgement and their own ingest.
- **partial failure:** If the signing key is locked the transaction aborts and nothing is stored; if delivery fails the revision remains valid locally and the other parties continue to consent to the previous head until they ingest the new one, at which point their earlier consents are void.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-012-09.T08 | integration | PS-012-06.R01, PS-012-06.R02 | replay create with same key, deliver same envelope twice, crash mid-transaction | one revision, duplicate skipped, no partial record |
| TEST-PS-012-09.T09 | integration | PS-012-06.R03, PS-012-01.R04 | offline create then reconnect | syncState prepared then transport_acknowledged; plaintext absent from relay fixture |

## Dependencies

Module depends on: F02.S01.M02, F02.S01.M03, F02.S02.M05, F02.S04.M01, F02.S04.M02, F07.S01.M01, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
