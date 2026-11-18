# PS-124-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/04_configuration/mod_flags (F15.S04.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-124-10.R01 | Rules export: versioned snapshot with digest; no subject data (none exists). | MVP |
| PS-124-10.R02 | Rules import: whole-snapshot only, validated per PS-124-02; partial import refused. | MVP |
| PS-124-10.R03 | Rollback re-publishes a previous rules revision as a new revision; history is kept. | MVP |
| PS-124-10.R04 | Flag rules are included in platform backup scope (PS-120) so restore reproduces rollout state. | MVP |
| PS-124-10.R05 | After restore, rollout-up changes made after the restore point are not re-applied automatically; operators confirm (PS-122). | MVP |

## Data / schema
Snapshot: `{"rules_revision": int, "flags": [...], "digest": "sha256"}`.

## Commands / queries / events
Import and rollback require `flag.administer` with approval per PS-124-05.

## States & transitions
Rollback creates a revision; states follow PS-124-03.

## Validation & errors
`FLAG.DEFINITION_INVALID` on snapshot failure.

## Authorization
As PS-124-05.

## Failure, idempotency, concurrency, offline
Import idempotent on digest.

## Privacy, retention, abuse
Snapshots have no personal data.

## Observability & budgets
Import completes within 30 s (ASSUMPTION).

## Tests
- TEST-PS-124-10-01 (round trip): export then import keeps digest.
- TEST-PS-124-10-02 (negative): partial import refused.
- TEST-PS-124-10-03 (rollback): rollback restores prior values as new revision.
- TEST-PS-124-10-04 (restore): backup restore keeps rollout values and requires operator confirmation for rollout-up.

## Acceptance criteria
1. Round trip stable (TEST-01).
2. TEST-PS-124-10-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: rules snapshot under 5 MB.
