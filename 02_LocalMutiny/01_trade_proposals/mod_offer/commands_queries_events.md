# PS-013-04 — Commands, queries and events: Barter offer items

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M03 Barter offer items](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/offer` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-013-04.R01** define and void are vault commands that produce no statement, because legs reach other parties only inside a signed revision.
- **PS-013-04.R02** materialize from a peer revision is performed by the intake of F02.S01.M04 through the same module port and emits leg.defined with actor.kind federated.
- **PS-013-04.R03** Queries are local and return only legs of subjects stored in the vault.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `mutiny.leg.define` | mutiny.leg.define | { subjectType, subjectId, position, giverId, receiverId, items: { inventoryItemId, listingCid, variantId?, quantity, valuationId? }[] } — vault command; no statement | { legId, legValue, basis, listingChanged: boolean } | VALIDATION_FAILED, MUTINY_LEG_ITEMS_INVALID, MUTINY_LEG_PARTY_INVALID, MUTINY_ITEM_UNAVAILABLE, MUTINY_ITEM_NOT_OWNED, MUTINY_ITEM_DUPLICATE, MUTINY_LEG_LIMIT, CONFLICT_STATE | mutiny.leg.defined | yes (Idempotency-Key) |
| `mutiny.leg.void` | mutiny.leg.void | { legId, expectedRevision } | { legId, revision, status: voided } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `mutiny.leg.get` | mutiny.leg.read | { legId } | { leg: TradeLeg, listingChanged: boolean } | NOT_FOUND |
| `mutiny.leg.list_for_subject` | mutiny.leg.read | { subjectType, subjectId, status? } | { items: TradeLeg[] } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `mutiny.leg.defined` | P2 | { legId, subjectType, subjectId, position, giverId, receiverId, itemCount, legValue, origin } |

### Events consumed

| Type | Effect |
|---|---|
| `mutiny.proposal.revised` | mark legs listed in legIds as referenced and materialize peer legs from the revision snapshot when origin is peer |
| `bazaar.listing.edited` | flag defined legs that reference the listing with listingChanged so the author must re-confirm before sealing |
| `bazaar.listing.unpublished` | void defined (unreferenced) legs referencing the listing; referenced legs stay and are handled by feasibility |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MUTINY_LEG_ITEMS_INVALID | 422 | no | item lines or quantities violate the leg limits |
| MUTINY_LEG_PARTY_INVALID | 422 | no | giver equals receiver or a party is not in the subject roster |
| MUTINY_LEG_LIMIT | 409 | no | a subject allows at most 8 legs |
| MUTINY_ITEM_UNAVAILABLE | 409 | no | own item quantity is not available |
| MUTINY_ITEM_NOT_OWNED | 422 | no | the other party's item is not backed by a verified listing projection authored by them |
| MUTINY_ITEM_DUPLICATE | 422 | no | the item already occurs in another leg of this subject |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
# direct 2-party proposal: Alice gives lamp + shade (2 lines) to Bob, Bob gives bicycle bell (1 line) to Alice
mutiny.leg.define { "subjectType":"trade_proposal", "subjectId":"0192f3f0-…", "position":0, "giverId":"did:key:z6MkAlice", "receiverId":"did:key:z6MkBob",
  "items":[ {"inventoryItemId":"0192f3f1-…","listingCid":"sha256-Ab1…","quantity":1}, {"inventoryItemId":"0192f3f2-…","listingCid":"sha256-Ab2…","quantity":1} ] }
-> { "legId":"0192f3f3-…", "legValue": {"amount":"7500","currency":"EUR"}, "basis":"local_inventory", "listingChanged": false }
# cycles: 3-party ring has 3 legs (position 0,1,2), 4-party 4 legs, N-party N legs (N ≤ 8); each leg exactly one item, quantity 1.
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-013-09.T06 | integration | PS-013-03.R03, PS-013-04.R02 | peer revision ingested | peer legs materialized as referenced with provenance and leg.defined emitted with actor.kind federated |
| TEST-PS-013-09.T07 | contract | PS-013-04.R01, PS-013-04.R03, PS-013-09.R02, PS-013-09.R03 | define and queries | outputs and event payload validate against registry; no statement produced |
| TEST-PS-013-09.T08 | integration | PS-013-04.R03, PS-013-06.R03 | listing edited after drafting | leg flagged listingChanged, recorded listing revision hash unchanged |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F02.S04.M03, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
