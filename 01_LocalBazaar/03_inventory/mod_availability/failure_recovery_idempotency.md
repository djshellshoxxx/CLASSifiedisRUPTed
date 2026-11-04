# PS-008-06 — Failure recovery and idempotency: Inventory availability

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S03.M01 Inventory availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/inventory/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-008-06.R01** All commands are idempotent per CTR-IDM-001; holds are idempotent per holder, so a retry never takes units twice.
- **PS-008-06.R02** A multi-line hold is all-or-nothing in one IndexedDB transaction; there is no partial hold.
- **PS-008-06.R03** A local reservation protects only this vault; cross-vault consistency is provided by signed statements with expiry and by explicit conflict detection, never by a lock.

## Specification

- **idempotency:** Idempotency-Key required on every command; the vault keeps key and request hash 24 h. A hold call with an existing active (item, holderType, holderId) returns the existing hold unchanged.
- **concurrency:** BEGIN-equivalent IndexedDB readwrite transaction per command re-reads availability; expectedRevision on set_quantity. Forks from a second device of the same principal are detected by reservation statements with the same item and overlapping quantity that exceed onHand; affected holds freeze and neither is converted automatically.
- **retries:** Port callers do not retry BAZAAR_INVENTORY_INSUFFICIENT; transaction aborts are retried up to 3 times 50 ms apart; statement transport follows IDM-4.
- **offline:** All commands work offline. Reservation statements wait in the sync outbox as prepared; the UI states that the buyer has not yet received the promise until transport_acknowledged and shows peer_accepted only after the buyer's signed acknowledgement.
- **partial failure:** If signing the reservation fails after a hold was taken, the hold remains valid locally and the statement is retried; if the caller's transaction aborts, the hold in the same transaction is rolled back with it.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-008-09.T05 | integration | PS-008-03.R02, PS-008-06.R02 | two tabs hold the last unit concurrently | exactly one hold succeeds, other gets INSUFFICIENT |
| TEST-PS-008-09.T06 | integration | PS-008-03.R03, PS-008-06.R02 | D2 holds the same last unit offline then syncs | both holds frozen, conflict event emitted, convert refused with FROZEN until owner releases one |
| TEST-PS-008-09.T10 | integration | PS-008-06.R01 | replay hold with same key and same holder with new key | same hold returned, units taken once |
| TEST-PS-008-09.T11 | chaos | PS-008-06.R03 | abort caller transaction after hold | hold rolled back with it; signing failure leaves valid hold and queued retry |
| TEST-PS-008-09.T12 | integration | PS-008-06.R01, PS-008-06.R03 | offline reservation issued | outbox prepared, UI text says not yet received; peer_accepted only after signed ack |

## Dependencies

Module depends on: F01.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
