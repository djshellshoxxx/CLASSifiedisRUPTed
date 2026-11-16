# PS-042-06 — Failure recovery and idempotency: Rental handoff

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M01 Rental handoff](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/handoff` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-042-06.R01** Commands are idempotent through local command ids and statements through cid, so repeated delivery never adds a second attestation.
- **PS-042-06.R02** Contradictory signed reports (two authors for the same revision, or attestations on different cids from forked devices) freeze the handoff for explicit renegotiation, never last-writer-wins.
- **PS-042-06.R03** Each state change, event and sync outbox entry commit in one IndexedDB transaction.

## Specification

- **idempotency:** Local command id stored 24 h; statements deduplicated by cid in the inbox table; a second attest by the same signer on the same cid returns the original attestation.
- **concurrency:** Web Locks lock rentals-handoff-<reservationId> around commands; expectedRevision on every command; forked devices of one party are detected through the signed seq/prev chain and freeze the handoff.
- **retries:** Sync outbox retries 1 s, 2 s, 4 s, 8 s up to 8 attempts per destination; attachment upload retries use the F08.S01.M03 resumable upload rules.
- **offline:** All commands work offline and both parties can sign at the meeting and sync later; the UI shows prepared, transport_acknowledged or peer_accepted and shows attested only when both signatures are held locally.
- **partial failure:** If a photo cannot be re-encoded the report is not signed and the item shows an error; if relay delivery fails the local signature stands and the sync state shows the failure.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-042-09.T06 | integration | PS-042-04.R01, PS-042-04.R02, PS-042-06.R01, PS-042-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on attested with identical cids; duplicates skipped |
| TEST-PS-042-09.T09 | integration | PS-042-06.R02, PS-042-06.R03 | two authors submit revision 1 on forked devices; photo re-encode fails | handoff frozen for renegotiation; report not signed on failure |

## Dependencies

Module depends on: F05.S01.M01, F05.S01.M02, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
