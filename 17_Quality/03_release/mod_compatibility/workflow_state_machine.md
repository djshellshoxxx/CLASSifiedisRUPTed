# PS-142-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_compatibility. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-142-03.R01 | Matrix states are exactly `draft`, `published`, `superseded`. | MVP |
| PS-142-03.R02 | Only one matrix per `matrix_key` is `published` at a time. | MVP |
| PS-142-03.R03 | Row support status moves only `supported` → `deprecated` → `unsupported`, never backward without a new matrix version. | MVP |

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | CreateMatrixDraft | matrix_key unique | draft | none |
| draft | PublishCompatMatrix | R01–R04 of PS-142-02 pass | published | emit `compat_matrix.published`; prior published → superseded |
| published | PublishCompatMatrix (new version) | revision matches | published | prior version → superseded |
| (any result) | RecordCompatResult | matrix version exists | recorded | emit `compat_result.recorded` |

## Validation & errors
Invalid transitions return `COMPAT.INVALID_TRANSITION` (422). A published matrix is immutable; corrections publish a new version.

## Failure, idempotency, concurrency, offline
- Two publishers race: `expected_revision` decides; the loser gets `SYS.CONFLICT`.
- Result upload retried with the same `(matrix_version, row_key, commit_sha, suite_ref)`; duplicates return the original result.
- Offline devices are tested in the lab, not in production. No offline state is held here.

## Assumptions & open decisions
- ASSUMPTION: a single published matrix per release line is sufficient for MVP.
- D08 governs client offline queues only; not modelled here: PROVISIONAL (D08 default, unapproved).
