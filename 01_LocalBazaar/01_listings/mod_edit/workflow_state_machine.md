# PS-003-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_edit. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision, outbox), CTR-ERR-001, CTR-CAP-001 R09. Listing lifecycle: PENDING CTR-LST-001.

**Decision labels:** Blocking material edits while offers are open is PROVISIONAL (ASSUMPTION, unapproved). Draft edits not federated follows CTR-FED-001 R02 default.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-003-03.R01 | An accepted edit never changes `state`. Edit is a self-transition in `draft`, `published`. | MVP |
| PS-003-03.R02 | `archived` and `hidden` reject all edits with `EDIT.STATE_NOT_EDITABLE`. `archived` is terminal for this module. | MVP |
| PS-003-03.R03 | A material edit on `published` is rejected with `EDIT.MATERIAL_CHANGE_BLOCKED` when `has_open_offers = true` (read from 01_LocalBazaar 04_pricing/mod_offers). | MVP |
| PS-003-03.R04 | Each accepted edit increments `revision` by exactly 1 and emits one `listing.updated` event in the same commit. | MVP |
| PS-003-03.R05 | Edits to `published` listings are visible at the next read, and are re-screened asynchronously by moderation (see R07). | MVP |
| PS-003-03.R06 | A `draft` listing's edits emit `listing.updated` with federation off (CTR-FED-001 R02). | MVP |
| PS-003-03.R07 | A `published` edit that changes title or description enqueues a re-screen. A flag moves the listing to `hidden` (owned by 12_Moderation), not this module. | MVP |

## Data / schema
States are read from the listing aggregate. This module adds no state field.

## Commands / queries / events
Transitions are driven only by `listing.edit` (see [commands_queries_events.md](commands_queries_events.md)).

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| draft | `listing.edit` accepted | valid; revision matches | draft | rev+1; `listing.updated` (federation off) |
| published | `listing.edit` accepted | non-material; valid; revision matches | published | rev+1; `listing.updated` (material=false); enqueue re-screen |
| published | `listing.edit` accepted | material; `has_open_offers=false` | published | rev+1; `listing.updated` (material=true); index refresh |
| published | `listing.edit` rejected | material; `has_open_offers=true` | published | none; `EDIT.MATERIAL_CHANGE_BLOCKED` |
| archived, hidden | `listing.edit` rejected | any | same | none; `EDIT.STATE_NOT_EDITABLE` |
| any | `listing.edit` rejected | `expected_revision` ≠ stored | same | none; `EVT.REVISION_CONFLICT` |
| any | `listing.edit` replayed | same key, same digest | same | none; original response |

## Validation & errors
Codes in [validation_rules.md](validation_rules.md). Non-retryable for all state-based rejections.

## Authorization
Transitions require `lst.update` on the owner's listing (see [authorization_capabilities.md](authorization_capabilities.md)).

## Failure, idempotency, concurrency, offline
Concurrency is serialized by the owning node's aggregate lock (CTR-EVT-001 R02). Archive vs. edit race: the second command sees the new revision and fails. See [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Re-screen input is the new title or description only. No state history beyond events is kept here. See [privacy_retention_abuse.md](privacy_retention_abuse.md).

## Observability & budgets
Count transitions by `from`, `event`, `to`. See [observability_performance.md](observability_performance.md).

## Tests
- TEST-PS-003-03-01 (unit): every row of the transition table.
- TEST-PS-003-03-02 (integration): material edit with open offer → blocked; after offer closes → accepted.
- TEST-PS-003-03-03 (integration): edit on `archived` and `hidden` → `EDIT.STATE_NOT_EDITABLE`.
- TEST-PS-003-03-04 (property): state never changes as a result of `listing.edit`.

## Acceptance criteria
1. Transition table matches implementation and tests one-to-one.
2. No accepted edit changes `state`.
3. Material edits while offers are open are never committed.

## Assumptions & open decisions
- ASSUMPTION: states `draft`, `published`, `archived`, `hidden` are canonical in mod_publish, mod_archive, 12_Moderation. Lifecycle contract PENDING CTR-LST-001.
- ASSUMPTION (PROVISIONAL, Dxx: none; no D-entry covers edit rules): blocking material edits while offers are open.
- D01 (PROVISIONAL, Dxx default, unapproved): federation of `listing.updated` only for `published` items with explicit opt-in.
