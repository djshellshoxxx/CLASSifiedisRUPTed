# PS-007-06 — Failure recovery and idempotency: Wanted listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M02 Wanted listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/wanted` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-007-06.R01** Commands are idempotent per CTR-IDM-001; event consumers are idempotent by event id in the local inbox (EVT-3).
- **PS-007-06.R02** State change and outbox event commit in one transaction; events that arrive twice or out of order never regress a terminal state.
- **PS-007-06.R03** Offline edits are committed locally; matching engines on relays learn of changes only through a new signed projection.

## Specification

- **idempotency:** Idempotency-Key required on commands, kept 24 h; consumers record (consumer, eventId) before side effects and skip duplicates.
- **concurrency:** expectedRevision on define, mark_fulfilled and withdraw; unique index on listing id; listing events and owner actions are serialized by the IndexedDB transaction, first commit wins. The listing revision recorded by define uses the Listing expectedRevision inside the same transaction.
- **retries:** Consumers retry failed handling with backoff base 500 ms cap 30 s up to 8 attempts, then dead-letter locally and show a diagnostics entry (EVT-6).
- **offline:** Fully offline capable; unsent changes are shown until the projection is re-sent and a signed relay receipt exists.
- **partial failure:** If an event handler fails after the status change, the whole handler transaction rolls back and the event is retried; the want never shows open while its listing is unpublished or expired. If recording the listing revision fails, the want edit is rolled back.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-007-09.T07 | integration | PS-007-06.R01, PS-007-06.R02 | replay define; deliver bazaar.listing.published twice | one want, one declared event |
| TEST-PS-007-09.T08 | integration | PS-007-06.R03 | handler fails after transition | handler rolled back; retried; want never open while listing unpublished |
| TEST-PS-007-09.T09 | integration | PS-007-06.R03 | edit offline then send projection | unsent state shown; no relay-accepted claim without receipt |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M02, F18.S01.M03, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
