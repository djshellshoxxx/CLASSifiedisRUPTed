# PS-005-06 — Failure recovery and idempotency: Giveaway listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M03 Giveaway listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/giveaway` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-005-06.R01** Commands are idempotent per CTR-IDM-001; inbound statements are idempotent by requestCid.
- **PS-005-06.R02** Selection, inventory hold and request update commit in one transaction; the signed statement is queued in the same transaction and sent afterwards.
- **PS-005-06.R03** Each sync step states only what is known: prepared, transport_acknowledged by relay receipt, peer_accepted by the peer's signed acknowledgement.

## Specification

- **idempotency:** Idempotency-Key required on commands, kept 24 h; inbound statements deduplicated by cid; replayed selection returns the stored selection statement.
- **concurrency:** expectedRevision on select and decline; the unique index allows one live request per requester; the hold uses F01.S03.M01 serialization; two tabs selecting different requests for the last unit give one success and one BAZAAR_GIVEAWAY_NOT_SELECTABLE. The random draw for a tie group is made once and recorded, so a replay or a second tab sees the same order.
- **retries:** Transport retries follow IDM-4 (base 500 ms, cap 30 s, 6 attempts per burst); quarantined statements are never retried.
- **offline:** Requester can queue a request offline; it stays prepared and is not shown as sent. The giver processes the queue after unlock; selections made offline are final locally and sent when online.
- **partial failure:** If the selection statement cannot be signed (key locked), the whole select is rolled back including the hold; if transport fails after commit, the selection stands locally and the requester sees pending until delivery.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-005-09.T05 | integration | PS-005-03.R02, PS-005-06.R02 | two tabs select different requests for last unit | one selected, other BAZAAR_GIVEAWAY_NOT_SELECTABLE |
| TEST-PS-005-09.T10 | integration | PS-005-06.R01, PS-005-06.R03 | replay select with same key; fail signing | one selection; failure rolls back hold |
| TEST-PS-005-09.T11 | chaos | PS-005-06.R03 | giver offline 3 days, relay mailbox holds requests | processed in receipt order on unlock with tie groups per sync batch; requester sees pending until signed receipt |

## Dependencies

Module depends on: F01.S01.M01, F01.S03.M01, F07.S02.M02, F16.S02.M03, F11.S01.M01, F11.S01.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
