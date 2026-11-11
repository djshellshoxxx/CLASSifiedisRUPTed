# PS-043-06 — Failure recovery and idempotency: Rental return

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M02 Rental return](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/return` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-043-06.R01** Commands are idempotent through local command ids and statements through cid, so repeated delivery never adds a second attestation or fee adjustment.
- **PS-043-06.R02** Overdue and closed events are derived once per vault from stored state and signed times, so sweeps that run twice emit once and both vaults derive the same deadlines.
- **PS-043-06.R03** Each state change, Deal call, event and sync outbox entry commit in one IndexedDB transaction, so a crash at any point leaves all or none of them.

## Specification

- **idempotency:** Local command id stored 24 h; statements deduplicated by cid in the inbox table; the unique return per reservation index and a stored overdueEmitted flag make overdue emission once; closure is idempotent on the stored closedAt; commerce.deal.open with the deterministic contextRef returns the existing Deal.
- **concurrency:** Web Locks lock rentals-return-<reservationId> around commands and sweeps; expectedRevision on every command; forked devices of one party are detected through the signed seq/prev chain and freeze the return until a co-signed renegotiation.
- **retries:** Sync outbox retries 1 s, 2 s, 4 s, 8 s up to 8 attempts per destination; late-fee Deal opening retries 10 s, 60 s, 10 minutes with the same contextRef; a photo whose comms.attachment.download returns NOT_FOUND is marked missing in missingPhotos[] and re-requested from the author.
- **offline:** Reporting and attesting work offline; a report that is only prepared starts no silence clock and is labelled not yet delivered; the effective return time and the silence deadline use signed times and the relay transport receipt; the UI shows prepared, transport_acknowledged or peer_accepted and never claims the owner saw a report before the signed acknowledgement.
- **partial failure:** If commerce.deal.open fails for the late fee, the attestation is signed without the Deal and a retry job opens it; if relay delivery fails the local state stands and the sync state shows the failure; if a photo cannot be fetched attest stays refused with RENTALS_EVIDENCE_MISSING.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-043-09.T05 | integration | PS-043-03.R03, PS-043-06.R01 | owner silent for 72 hours after relay receipt; owner records receipt only; owner attests exact cid | renter_reported_unconfirmed labelled with the relay and no rentals.return.attested; owner_only; both respectively; events once per vault |
| TEST-PS-043-09.T06 | integration | PS-043-06.R02 | sweep runs twice across the grace boundary and across restart in both vaults | one overdue event per vault; identical silence deadline and damage window in both vaults; closure emitted once |
| TEST-PS-043-09.T22 | chaos | PS-043-06.R03 | crash injected after the state change, after commerce.deal.open and before the outbox write during attest | after restart state, Deal, event and outbox entry are all present or all absent |
| TEST-PS-043-09.T27 | integration | PS-043-03.R01, PS-043-06.R01 | forked owner devices sign two different attestations, then the parties co-sign a renegotiation naming the one that stands; a second frozen return voided by renegotiation; a third left frozen for 30 days | first returns to attested with rentals.return.attested emitted once per vault; second returns to awaiting_owner with the silence clock restarted; third closes with reason unresolved, oneSided and no completionCid |

## Dependencies

Module depends on: F05.S02.M01, F05.S01.M01, F05.S01.M02, F09.S01.M01, F08.S01.M01, F08.S01.M03, F15.S02.M03, F10.S02.M03, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
