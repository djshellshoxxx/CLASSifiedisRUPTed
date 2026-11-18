# PS-009-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/03_inventory/mod_variants. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-SCH-001 (R06), CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-009-06.R01 | Concurrent writes to one listing are serialised by the listing revision lock; the loser receives `EVT.REVISION_CONFLICT` and re-reads. | MVP |
| PS-009-06.R02 | Two adds of the same attribute set from two devices: exactly one succeeds; the other returns `VARIANT.DUPLICATE_COMBINATION` or `EVT.REVISION_CONFLICT`. | MVP |
| PS-009-06.R03 | Archive committed after a proposal referenced the variant: the proposal is flagged `needs_revalidation` (F02.S02.M05), never silently changed. | MVP |
| PS-009-06.R04 | Command timeout 3 s (ASSUMPTION). Clients retry only with the same `idempotency_key`. | MVP |
| PS-009-06.R05 | Offline edits are held in a local pending queue and shown as pending until relay acknowledgement (D08). | MVP |

## Data / schema
No extra tables. Idempotency records follow CTR-EVT-001 R03 (7-day retention). Read models are rebuilt from the event stream.

## Commands / queries / events
Retry-safe operations: all three commands, by key. `listing.variants_get` is idempotent by definition.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| pending (local) | relay ack | revision matches | committed | UI shows active or archived |
| pending (local) | relay reject | any VARIANT or EVT code | rejected | user sees localised message key; no silent drop |
| pending (local) | unknown schema MAJOR | CTR-SCH-001 R06 | pending | marked "client upgrade required"; never discarded |

## Validation & errors
Rejected queued edits return the original code and message key.

## Authorization
Replayed commands are re-authorised at replay time; a revoked owner's queued edit is rejected.

## Failure, idempotency, concurrency, offline
- Partial failure: the event append and read-model update are one commit; a read-model gap is repaired by replay from revision.
- Archive-versus-proposal race: archive wins if committed first; proposal re-check is asynchronous and bounded by PS-009-08.
- Retries: exponential backoff from 1 s, cap 60 s, maximum 8 attempts (ASSUMPTION).

## Privacy, retention, abuse
Pending queue on a device follows RET-EPH; purged on logout (CTR-PRV-001 R06 cascade).

## Observability & budgets
Count of `EVT.REVISION_CONFLICT` per listing and queue depth per device are tracked (PS-009-08).

## Tests
- TEST-PS-009-06-01 (concurrency): two writers, one winner, one correct conflict.
- TEST-PS-009-06-02 (integration): archive during open proposal flags it for re-check.
- TEST-PS-009-06-03 (offline): queued add survives restart; after ack it is active exactly once.

## Acceptance criteria
1. No duplicate active variants after 100 randomised concurrent-add runs.
2. Every archive that races a proposal yields a re-check flag in 100% of runs.
3. Queued edits are never dropped; each ends in committed or rejected.

## Assumptions & open decisions
- PROVISIONAL (D08 default, unapproved): local pending queue until authenticated relay acknowledgement.
- ASSUMPTION: 3 s command timeout and retry parameters above.
