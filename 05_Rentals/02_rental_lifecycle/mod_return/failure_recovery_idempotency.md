# PS-043-06 — Failure recovery and idempotency: Rental return

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M02 Rental return](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/return` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-043-06.R01** Commands are idempotent through local command ids and statements through cid, so repeated delivery never adds a second attestation or fee adjustment.
- **PS-043-06.R02** Overdue and closed events are derived once per vault from stored state, so sweeps that run twice emit once.
- **PS-043-06.R03** Each state change, event and sync outbox entry commit in one IndexedDB transaction.

## Specification

- **idempotency:** Local command id stored 24 h; statements deduplicated by cid in the inbox table; the unique return per reservation index and a stored overdueEmitted flag make overdue emission once; closure is idempotent on the stored closedAt.
- **concurrency:** Web Locks lock rentals-return-<reservationId> around commands and sweeps; expectedRevision on every command; forked devices of one party are detected through the signed seq/prev chain and freeze the return for explicit renegotiation.
- **retries:** Sync outbox retries 1 s, 2 s, 4 s, 8 s up to 8 attempts per destination; late-fee context registration retries 10 s, 60 s, 10 minutes.
- **offline:** Reporting and attesting work offline; the effective return time uses the claim only within the 72 hour rule at receipt; the UI shows prepared, transport_acknowledged or peer_accepted and never claims the owner saw a report before the signed acknowledgement.
- **partial failure:** If registering the late-fee payment context fails, the report is signed without the fee context and a retry job registers it; if relay delivery fails the local state stands and the sync state shows the failure.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-043-09.T05 | integration | PS-043-03.R03, PS-043-06.R01 | owner silent for 72 hours; owner records receipt only; owner attests exact cid | attestedBy renter_only_silent_owner, owner_only, both respectively; events once per vault |
| TEST-PS-043-09.T06 | integration | PS-043-01.R03, PS-043-06.R02 | sweep runs twice across the grace boundary and across restart | one overdue event per vault; closure emitted once |
| TEST-PS-043-09.T08 | integration | PS-043-04.R01, PS-043-04.R02, PS-043-06.R03, PS-043-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on attested and closed with identical cids; duplicates skipped |

## Dependencies

Module depends on: F05.S02.M01, F05.S01.M01, F05.S01.M02, F09.S01.M01, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
