# PS-042-06 — Failure recovery and idempotency: Rental handoff

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M01 Rental handoff](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/handoff` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-042-06.R01** Commands are idempotent through local command ids and statements through cid, so repeated delivery never adds a second attestation.
- **PS-042-06.R02** Contradictory signed statements from forked devices of one party (two reports for the same revision by one signer, or attestations on different cids) freeze the handoff until a new owner-signed revision or a cancellation, while concurrent reports by owner and renter resolve owner-canonical; never last-writer-wins.
- **PS-042-06.R03** Each state change, event and sync outbox entry commit in one IndexedDB transaction, so a crash at any point leaves all or none of them.

## Specification

- **idempotency:** Local command id stored 24 h; statements deduplicated by cid in the inbox table; a second attest by the same signer on the same cid returns the original attestation.
- **concurrency:** Web Locks lock rentals-handoff-<reservationId> around commands; expectedRevision on every command; owner and renter reports of the same revision resolve owner-canonical; forked devices of one party are detected through the signed seq/prev chain and freeze the handoff.
- **retries:** Sync outbox retries 1 s, 2 s, 4 s, 8 s up to 8 attempts per destination; photos are uploaded whole under the F08.S01.M03 slot rules and fetched again on failure; a photo whose comms.attachment.download returns NOT_FOUND (blob expired or deleted by its uploader) is marked missing and re-requested from the author through the thread.
- **offline:** All commands work offline and both parties can sign at the meeting and sync later; inbound statements are judged by signed createdAt within the 72 h receipt bound; the UI shows prepared, transport_acknowledged or peer_accepted and shows attested only when both signatures are held locally.
- **partial failure:** If metadata stripping or re-encoding of a photo fails the report is not signed and the item shows an error; if a photo cannot be fetched the attest button stays disabled with RENTALS_EVIDENCE_MISSING; if relay delivery fails the local signature stands and the sync state shows the failure.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-042-09.T06 | integration | PS-042-04.R01, PS-042-04.R02, PS-042-06.R01, PS-042-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on attested with identical cids; duplicates skipped |
| TEST-PS-042-09.T09 | integration | PS-042-06.R02, PS-042-03.R05 | renter's forked devices sign two reports for revision 1; owner and renter submit revision 1 concurrently; photo strip fails | handoff frozen until a new owner revision; the concurrent case keeps the owner's report and turns the renter's into a changes request; report not signed on strip failure |
| TEST-PS-042-09.T19 | chaos | PS-042-06.R03 | crash injected after the state change, after the event and before the outbox write during attest | after restart no partial state - state, event and outbox entry all present or all absent - and replay converges |

## Dependencies

Module depends on: F05.S01.M01, F05.S01.M02, F08.S01.M01, F08.S01.M03, F15.S02.M03, F10.S02.M03, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
