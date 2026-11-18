# PS-047-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/02_geoprivacy/mod_coarse. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001 (R02, R07), CTR-PRV-001 (R04, R05), CTR-SCH-001 (R04).

**Decision labels:** K_MIN = 5 is ASSUMPTION (F10); merge-up policy PROVISIONAL (D05 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-047-02.R01 | Reject a cell code not matching the format in PS-047-01 R02 as `COARSE.REGISTRY_INVALID`. | MVP |
| PS-047-02.R02 | Reject a parent reference to a missing or retired cell as `COARSE.PARENT_MISSING`. | MVP |
| PS-047-02.R03 | Reject a cycle or depth > 3 as `COARSE.REGISTRY_INVALID`. | MVP |
| PS-047-02.R04 | Reject retiring a cell that is the merge target of any publishable cell (until those are re-evaluated) as `COARSE.CELL_IN_USE`. | MVP |
| PS-047-02.R05 | Reject a cell label key missing from the i18n catalog as `COARSE.LABEL_MISSING`. | MVP |

## Data / schema
| Rule | Check | Code | Retryable |
|---|---|---|---|
| V1 | cell_code format | COARSE.REGISTRY_INVALID | false |
| V2 | parent exists, active | COARSE.PARENT_MISSING | false |
| V3 | acyclic, depth ≤ 3 | COARSE.REGISTRY_INVALID | false |
| V4 | not merge target while retiring | COARSE.CELL_IN_USE | false |
| V5 | label_key in catalog | COARSE.LABEL_MISSING | false |

## Commands / queries / events
Applies to `cell.propose` and `cell.retire` (PS-047-04).

## States & transitions
Failed validation leaves registry unchanged.

## Validation & errors
Envelope per CTR-ERR-001. Internal code `COARSE.K_THRESHOLD_NOT_MET` is never returned to clients (CTR-PRV-001 table).

## Authorization
Validation runs after authorization (PS-047-05).

## Failure, idempotency, concurrency, offline
Validation deterministic; registry writes use optimistic concurrency on `registry_version`.

## Privacy, retention, abuse
Cell registry is non-personal. Proposals with free-text justification are capped at 500 chars and reviewed by F10.

## Observability & budgets
Counter `coarse_validation_reject_total{code}`.

## Tests
- TEST-PS-047-02-01 (unit): V1–V5 pass/fail fixtures.
- TEST-PS-047-02-02 (property): random registry graphs never pass with a cycle.
- TEST-PS-047-02-03 (integration): retire of a merge target blocked until re-evaluation.

## Acceptance criteria
1. All five rules tested with fixed codes.
2. Concurrent proposals on same version: one wins, one returns conflict (SYS code).
3. No validation message echoes a cell label beyond its code.

## Assumptions & open decisions
- ASSUMPTION: depth limit 3.
