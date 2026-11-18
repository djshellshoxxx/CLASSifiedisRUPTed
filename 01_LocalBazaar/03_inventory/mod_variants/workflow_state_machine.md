# PS-009-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/03_inventory/mod_variants. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (revision), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-009-03.R01 | A variant is in exactly one state: `active` or `archived`. | MVP |
| PS-009-03.R02 | `archived` is terminal. Restoring means creating a new variant with a new ID. | MVP |
| PS-009-03.R03 | A listing hide or suspend does not change variant state; visibility follows the listing (PS-009-05). | MVP |
| PS-009-03.R04 | Each transition emits exactly one event in the same commit as the transition (CTR-EVT-001 R02). | MVP |

## Data / schema
State lives in `status` (PS-009-01). Transition log is the event stream; no separate state table.

## Commands / queries / events
Transitions are triggered by PS-009-04 commands only.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | listing.variant_add | listing editable; count < 25; PS-009-02 passes | active | emit listing.variant_added |
| active | listing.variant_update | not referenced by open proposal | active | emit listing.variant_updated |
| active | listing.variant_archive | none | archived | emit listing.variant_archived; F02.S02.M05 marks affected proposals for re-check |
| archived | any update | none | archived | rejected: VARIANT.ARCHIVED |
| active | listing hidden by moderation | none | active | no change; reads return nothing to non-owners |

## Validation & errors
Guards map to codes in PS-009-02. Invalid transitions return `VARIANT.ARCHIVED` or `VARIANT.IN_USE`.

## Authorization
Actors and capabilities are in PS-009-05. Transitions require owner `lst.update`.

## Failure, idempotency, concurrency, offline
A transition commits atomically with its event or not at all. Concurrent transitions on one variant are serialised by the listing revision lock (PS-009-06).

## Privacy, retention, abuse
Archive hides the variant from non-owner reads at once; deletion rules are in PS-009-07.

## Observability & budgets
Transition counts per type are emitted as metrics (PS-009-08).

## Tests
- TEST-PS-009-03-01 (unit): every row of the table, including rejected rows.
- TEST-PS-009-03-02 (integration): archive emits one event and triggers the feasibility re-check flag.
- TEST-PS-009-03-03 (property): no sequence of commands reaches `active` from `archived`.

## Acceptance criteria
1. The table is complete: every (state, command) pair has a row or a rejection.
2. Archive is observable by F02.S02.M05 within the event-delivery budget (PS-009-08).
3. No transition is possible without an event.

## Assumptions & open decisions
- ASSUMPTION: "hide" is a listing-level moderation action owned by F12, not a variant state.
- No Dxx decision changes this process; the values above are ASSUMPTION until F15/F16 review.
