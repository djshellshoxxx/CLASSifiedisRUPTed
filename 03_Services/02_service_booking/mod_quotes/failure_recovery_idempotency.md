# PS-032-06 — Failure recovery and idempotency: Service quotes and booking

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M01 Service quotes and booking](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/quotes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-032-06.R01** Commands are idempotent through local command ids and statements are idempotent by cid, so duplicate delivery through two relays is harmless.
- **PS-032-06.R02** Conflicting signed promises (two confirmations, a confirmation crossing a timeout cancellation, two different acceptances of one quote, or a conflicted consent) freeze the affected booking as conflicted and require explicit renegotiation; there is no last-writer-wins for money or commitments.
- **PS-032-06.R03** Each state change and its sync outbox entry are one IndexedDB transaction; a crash leaves neither.

## Specification

- **idempotency:** Local command id stored 24 h; inbound statements deduplicated by cid in the inbox table (EVT-3); a repeated accept returns the same bookingId and acceptanceCid; two consistent confirmation_timeout cancellations from both vaults dedupe to one cancellation; DeletionPort and RetentionPurgePort handlers are idempotent by request id.
- **concurrency:** Web Locks lock services-provider-<providerId> around quote issue, confirm and slot operations so overlap prevention holds inside the provider vault; across vaults the only protection is the signed quote with its hold expiry, the provider's confirmation deadline and the signed timeout cancellation. Two confirmations for one quote cid from forked provider devices are detected through the seq/prev chain and freeze the booking as conflicted.
- **retries:** Sync outbox retries 1 s, 2 s, 4 s, 8 s up to 8 attempts per destination, then shows needs attention; acceptance is retried until confirmation, timeout or expiry.
- **offline:** Request, accept, decline and cancel work offline and commit locally; status text always names the highest reached sync state, confirmed appears only after the provider's signed confirmation is held locally, and an offline cancellation states that the fee is computed from delivery evidence when it reaches the other vault.
- **partial failure:** If slot commit or re-hold fails during confirmation, nothing is signed or stored and the booking stays awaiting_confirmation; if relay delivery fails after local commit the booking keeps its local state and the sync state shows the failure; this module creates no Deal, so there is no Deal step to fail.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-032-09.T04 | integration | PS-032-03.R02, PS-032-03.R03, PS-032-06.R03 | confirm with slot commit failing and with the hold flagged needsReconfirmation | booking stays awaiting_confirmation, no signature, no committed slot; no Deal is created at any point |
| TEST-PS-032-09.T05 | integration | PS-032-04.R02, PS-032-06.R01, PS-032-09.R03 | full flow with relay that duplicates and reorders envelopes | both vaults reach confirmed with identical bookingId, milestone ids and cids; duplicates skipped |
| TEST-PS-032-09.T08 | integration | PS-032-06.R02 | two clients accept two quotes for one slot; forked provider devices sign two confirmations | other acceptance refused slot_taken; forked confirmations move the booking to conflicted |
| TEST-PS-032-09.T13 | integration | PS-032-06.R01 | go offline, accept, sync later | UI shows prepared then transport_acknowledged; confirmed only after provider confirmation received |

## Dependencies

Module depends on: F03.S01.M01, F03.S01.M02, F08.S01.M01, F08.S01.M03, F08.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M03, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
