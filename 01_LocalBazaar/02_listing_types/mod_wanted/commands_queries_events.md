# PS-007-04 — Commands, queries and events: Wanted listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M02 Wanted listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/wanted` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-007-04.R01** define, mark_fulfilled and withdraw are vault-local commands; none produces a signed statement; the want's public data reaches others in the signed projection of F01.S01.M03.
- **PS-007-04.R02** bazaar.want.declared and bazaar.want.withdrawn carry ids and category only, so matching engines read details through the signed projection or the local read port.
- **PS-007-04.R03** bazaar.want.list_open is the local read port for LocalMutiny matching, including private fields because it runs in the owner's vault.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `bazaar.want.define` | bazaar.want.define | [vault-local] { listingId, expectedRevision?, categoryId, keywords, conditionsAccepted, quantityWanted, maxBudget?, budgetVisible?, barterAcceptable?, barterNote?, maxDistanceBucket?, neededBy? } | { wantId, revision, status, unsentChanges } | VALIDATION_FAILED, NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, BAZAAR_WANT_CATEGORY_INVALID, BAZAAR_WANT_CURRENCY_UNKNOWN, BAZAAR_WANT_LIMIT |  | yes (Idempotency-Key) |
| `bazaar.want.mark_fulfilled` | bazaar.want.close | [vault-local] { wantId, expectedRevision } | { wantId, revision, status: fulfilled } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | bazaar.want.fulfilled | yes (Idempotency-Key) |
| `bazaar.want.withdraw` | bazaar.want.close | [vault-local] { wantId, expectedRevision } | { wantId, revision, status: withdrawn } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | bazaar.want.withdrawn | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `bazaar.want.get` | bazaar.want.read | { wantId } \| { listingId } | { want: WantSpec } | NOT_FOUND |
| `bazaar.want.list_open` | bazaar.want.read | { categoryId?, barterAcceptable?, cursor?, limit <= 200 } | { items: WantSpec[], nextCursor? } | VALIDATION_FAILED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `bazaar.want.declared` | P1 | { wantId, listingId, ownerId, categoryId, barterAcceptable, revision } |
| `bazaar.want.withdrawn` | P1 | { wantId, listingId, ownerId, reason: owner\|expired\|listing_closed\|listing_archived\|listing_deleted } |
| `bazaar.want.fulfilled` | P1 | { wantId, listingId, ownerId } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.listing.published` | move the want of that listing from draft or paused to open and emit bazaar.want.declared |
| `bazaar.listing.unpublished` | move an open want to paused |
| `bazaar.listing.expired` | withdraw the want with reason expired |
| `bazaar.listing.closed` | withdraw an open or paused want with reason listing_closed |
| `bazaar.listing.archived` | withdraw the want with reason listing_archived |
| `bazaar.listing.deleted` | withdraw the want with reason listing_deleted and delete it after 30 days |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| BAZAAR_WANT_CATEGORY_INVALID | 422 | no | category missing, retired or not a leaf |
| BAZAAR_WANT_CURRENCY_UNKNOWN | 422 | no | budget currency is not registered |
| BAZAAR_WANT_LIMIT | 409 | no | owner already has 100 open wants |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault.dispatch("bazaar.want.define", { "listingId": "0192f3a4-7777-7d8e-9f01-23456789abcd", "categoryId": "0192f3a4-1111-7000-8000-0000000000c2",
  "keywords": ["road bike", "54 cm"], "conditionsAccepted": ["good", "like_new"], "quantityWanted": 1,
  "maxBudget": { "amount": "30000", "currency": "EUR" }, "budgetVisible": false, "barterAcceptable": true },
  idempotencyKey: "0192f3a4-0000-7000-8000-000000000081")
=> { "wantId": "0192f3ad-...", "revision": 1, "status": "draft", "unsentChanges": false }
on bazaar.listing.published => event bazaar.want.declared { wantId, listingId, ownerId, categoryId, barterAcceptable: true, revision: 2 }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-007-09.T04 | contract | PS-007-04.R01, PS-007-04.R02, PS-007-09.R02 | define, fulfil and withdraw | outputs and events validate; event payloads carry no budget or keywords |
| TEST-PS-007-09.T05 | integration | PS-007-04.R03, PS-007-05.R03 | list_open as owner, as matching module and as relay-facing call | private fields for owner and matching module only; relay-facing path sees projection fields only |

## Dependencies

Module depends on: F01.S01.M01, F18.S01.M03, F09.S03.M01, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
