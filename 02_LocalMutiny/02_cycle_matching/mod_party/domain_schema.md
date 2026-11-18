# PS-019-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_party. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-EVT-001, CTR-CAP-001. `par_` identity owner: F02.S01.M02 (PROVISIONAL).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-019-01.R01 | A binding links one `par_` to one `cyc_` at one `slot_index` (0..N-1) and one `cycle_version`. | MVP |
| PS-019-01.R02 | A `par_` has at most one binding with status in {pending, consented, locked} at any time (one live slot). | MVP |
| PS-019-01.R03 | `slot_index` is unique per cycle version; reindex happens only with a new version. | MVP |
| PS-019-01.R04 | Binding stores no consent payload; consent state is a projection from F02.S03.M01. | MVP |
| PS-019-01.R05 | Binding stores no listing titles or wants text; refs only. | MVP |

## Data / schema
```json
{
  "binding_id": "bnd_<26> (PENDING prefix)",
  "cycle_id": "cyc_<26>",
  "par_id": "par_<26> (owner F02.S01.M02)",
  "participant_ref": "acc_<26>",
  "slot_index": "integer 0..7",
  "cycle_version": "integer >= 1",
  "status": "enum(pending, consented, declined, withdrawn, dropped, locked, compensated)",
  "bound_revision": "integer >= 1",
  "schema_version": "1.0.0"
}
```
Classes: `participant_ref` PSEUDONYMOUS; all other fields PUBLIC within the cycle audience.

## Commands / queries / events
Shapes in PS-019-04.

## Validation & errors
Rules in PS-019-02.

## Authorization
Slot-scoped reads (PS-019-05).

## Failure, idempotency, concurrency, offline
One live slot enforced by unique constraint on (participant_ref) where status in live set; version counter (PS-019-06).

## Privacy, retention, abuse
Slot pseudonyms only (PS-019-07).

## Observability & budgets
Binding row ≤ 512 bytes (ASSUMPTION).

## Tests
- TEST-PS-019-01-01 (unit): unique index on live slot per participant.
- TEST-PS-019-01-02 (property): slot indexes are 0..N-1 with no gaps after bind.
- TEST-PS-019-01-03 (contract): schema validates.

## Acceptance criteria
1. Second live binding for one participant is refused in 100% of runs.
2. Index gaps impossible in stored bindings.
3. Lint shows no free-text field.

## Assumptions & open decisions
- ASSUMPTION: one live slot per participant across cycles (product default).
- PROVISIONAL (D04 default, unapproved): explicit per-party status, no atomic guarantee.
