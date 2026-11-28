# PS-001-06 — Failure recovery and idempotency: Listing archive and expiry

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M04 Listing archive and expiry](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/archive` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-001-06.R01** Commands are idempotent per CTR-IDM-001 and sweeps are safe to run twice.
- **PS-001-06.R02** Ending a publication, converting or releasing holds, cancelling Deals, changing the Listing status and writing the ArchiveRecord commit together; the tombstone and release transport is a separate retried step.
- **PS-001-06.R03** Offline use is complete locally; nothing here claims relay delivery.

## Specification

- **idempotency:** Idempotency-Key required on close, archive and restore; sweeps use the natural key (listingId, target status) so a second run changes nothing.
- **concurrency:** expectedRevision on commands; a unique partial index allows one open ArchiveRecord per listing; two tabs closing the same listing give CONFLICT_REVISION to the second. A hold that becomes active during a sweep run is seen by the next run because the sweep re-reads holds inside its transaction.
- **retries:** Sweeps retry per batch of 100 listings after a transaction abort (max 3); tombstone transport follows IDM-4 backoff (base 500 ms, cap 30 s, 6 attempts).
- **offline:** All commands work offline. Tombstones and reservation releases stay prepared in the sync outbox; the UI says the ended listing may still be visible on relays until they receive it.
- **partial failure:** If ending the publication fails (signing key locked) or commerce.deal.cancel fails, the whole close is refused with PRECONDITION_FAILED and nothing changes; if tombstone transport fails later, the local close stands and delivery is retried.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-001-09.T05 | integration | PS-001-03.R02, PS-001-03.R03, PS-001-06.R02 | close A with active publication | publication ended and tombstone queued in the same transaction; restore of C gives unpublished, never published |
| TEST-PS-001-09.T09 | integration | PS-001-06.R01, PS-001-06.R02 | replay close; run sweeps twice; two tabs | one record, one tombstone, no duplicate events; second tab CONFLICT_REVISION |
| TEST-PS-001-09.T10 | chaos | PS-001-06.R03, PS-001-02.R03 | signing key locked during close; later tombstone transport fails | close refused atomically; later local close stands and transport retries |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F01.S03.M01, F01.S04.M01, F01.S04.M02, F09.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
