# PS-027-04 — Commands, queries and events: Participant valuation

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M03 Participant valuation](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/valuation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-027-04.R01** declare and acknowledge are vault commands that produce the signed projection statement classrup.mutiny.item_valuation/v1; flag produces the signed statement classrup.mutiny.valuation_flag/v1 addressed to the owner; ingest commands verify other parties' statements.
- **PS-027-04.R02** Events are written in the same IndexedDB transaction as the state change and statements go to the sync outbox with states prepared, transport_acknowledged and peer_accepted.
- **PS-027-04.R03** The module consumes listing, sell-terms and reservation events to keep references and locks consistent.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `mutiny.valuation.declare` | mutiny.valuation.declare | { inventoryItemId, declared: Money, basis, note? } — vault command; produces statement classrup.mutiny.item_valuation/v1 signed by the owner (public projection, P0) | { valuationId, seq, plausibility, status, syncState: local_committed \| prepared } | VALIDATION_FAILED, MUTINY_VALUATION_ITEM_INVALID, MUTINY_VALUATION_LOCKED, RATE_LIMITED | mutiny.valuation.declared, mutiny.valuation.flagged | yes (Idempotency-Key) |
| `mutiny.valuation.flag` | mutiny.valuation.flag | { valuationId, reason: too_high\|too_low\|unclear, comment? ≤ 280 } — vault command; produces statement classrup.mutiny.valuation_flag/v1 signed by the flagger, end-to-end encrypted to the owner | { flagId, syncState } | NOT_FOUND, MUTINY_VALUATION_FLAG_NOT_ALLOWED, RATE_LIMITED |  | yes (Idempotency-Key) |
| `mutiny.valuation.acknowledge` | mutiny.valuation.acknowledge | { valuationId, ackNote, expectedRevision } — vault command; produces statement classrup.mutiny.item_valuation/v1 with seq+1 | { valuationId, seq, status: acknowledged, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, MUTINY_VALUATION_ACK_INVALID, MUTINY_VALUATION_LOCKED | mutiny.valuation.declared | yes (Idempotency-Key) |
| `mutiny.valuation.ingest` | mutiny.valuation.ingest | { envelope: classrup.mutiny.item_valuation/v1 \| classrup.mutiny.valuation_flag/v1, provenance } — vault command; produces no statement | { accepted: boolean, valuationId?, quarantineReason? } | MUTINY_VALUATION_STATEMENT_INVALID, UNSUPPORTED_SCHEMA_VERSION, VALIDATION_FAILED | mutiny.valuation.declared, mutiny.valuation.flagged | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `mutiny.valuation.get` | mutiny.valuation.read | { valuationId } | { valuation: ItemValuation } | NOT_FOUND |
| `mutiny.valuation.list_mine` | mutiny.valuation.read | { status?, cursor?, limit ≤ 50 } | { items: ItemValuation[], nextCursor? } |  |
| `mutiny.valuation.list_for_items` | mutiny.valuation.read | { inventoryItemIds: uuidv7[] ≤ 200 } | { items: ItemValuation[] — current projections known in this vault, including peers' } | VALIDATION_FAILED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `mutiny.valuation.declared` | P0 | { valuationId, ownerId, inventoryItemId, declared, basis, plausibility, status, seq, origin } |
| `mutiny.valuation.flagged` | P2 | { valuationId, inventoryItemId, reason, flagCount, origin } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.listing.edited` | re-read the listing price as the reference and re-evaluate plausibility; clear or set the automatic flag |
| `bazaar.sell_terms.set` | update referencePrice and ratioPermille of valuations of items on that listing |
| `bazaar.listing.unpublished` | mark valuations of that listing's items superseded locally; a signed tombstone follows the listing's tombstone |
| `mutiny.cycle.locked` | set lockedBySubjectId on valuations of the reserved items |
| `mutiny.cycle.unlocked` | clear lockedBySubjectId on valuations of the released items |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MUTINY_VALUATION_ITEM_INVALID | 422 | no | the item is not owned by the principal, not listed or not barter-acceptable |
| MUTINY_VALUATION_LOCKED | 409 | no | the item is reserved for an active proposal or cycle and its value cannot change |
| MUTINY_VALUATION_FLAG_NOT_ALLOWED | 403 | no | only participants of an active proposal or cycle containing the item may flag, once per 30 days |
| MUTINY_VALUATION_ACK_INVALID | 422 | no | acknowledgement needs the owner, a flagged valuation and a justification of 10 to 280 characters |
| MUTINY_VALUATION_STATEMENT_INVALID | 422 | no | a valuation or flag statement failed signature, sequence or claimed-time checks |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
mutiny.valuation.declare  Idempotency-Key: 0192f460-0000-7000-8000-000000000001
{ "inventoryItemId": "0192f461-…", "declared": {"amount":"12000","currency":"EUR"}, "basis": "retail_estimate", "note": "Used 3 years, new strings" }
-> { "valuationId": "0192f462-…", "seq": 1, "plausibility": "ok", "status": "declared", "syncState": "prepared" }   (reference price 12500 EUR: ratio 960 permille)
mutiny.valuation.declare { "inventoryItemId": "0192f463-…", "declared": {"amount":"1000","currency":"EUR"}, "basis": "other" }   (asking price 12000)
-> { "plausibility": "low", "status": "flagged" }   ratio 83 permille < 200 => automatic flag; excluded from matching until acknowledged
Values used in 2-, 3-, 4- and N-party cycles are exactly these declared amounts (or their pinned conversion, F02.S04.M02).
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-027-09.T07 | contract | PS-027-04.R01, PS-027-04.R02, PS-027-09.R02, PS-027-09.R03 | commands and events | statements and payloads validate against classrup.mutiny.item_valuation/v1, valuation_flag/v1 and registry |
| TEST-PS-027-09.T08 | integration | PS-027-04.R03, PS-027-06.R03 | listing edited and sell terms set events | reference and plausibility recomputed; automatic flag set or cleared |

## Dependencies

Module depends on: F01.S02.M01, F01.S03.M01, F01.S01.M01, F09.S03.M01, F09.S03.M03, F16.S02.M03, F07.S01.M01, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
