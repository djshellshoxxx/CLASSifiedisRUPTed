# PS-086-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_conflicts. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (verification steps 12–14, R05, R06, R07, R13), CTR-EVT-001 (R02, R03), CTR-SCH-001 (R09 golden fixtures), CTR-ERR-001 (R03 retryable), CTR-PRV-001 (R06).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-086-09.R01 | Golden fixtures for: duplicate (same ID, same digest); equivocation by ID; equivocation by digest; revision gap fills; gap expires; tombstone on arrival with open conflict; restore without review; restore with review. Each has an expected status and code. | MVP |
| PS-086-09.R02 | Each code in PS-086-02 and each conflict transition in PS-086-03 has at least one fixture. | MVP |
| PS-086-09.R03 | Two-implementation check (ASSUMPTION) for detection result on the R01 set. | MVP |
| PS-086-09.R04 | No test in this list is skipped at release. | MVP |
| PS-086-09.R05 | Contract tests reference CTR IDs only. No copies of foreign schemas. | MVP |

## Data / schema
Fixture record: ID, input events (metadata and synthetic bytes), stored state before, expected state after, expected code, source clause.

## Commands / queries / events
Exercises `conflict.open`, `conflict.review`, `conflict.close`, `conflict.list`, `conflict.get` (PS-086-04) and `fed.receive_batch` steps 12–14.

## Validation & errors
One fixture per code in PS-086-02. Unlisted codes fail the build.

## Authorization
Fixtures use `sys_`, `ope_` (two distinct), `mod_` (with and without case) and `fpr_` principals only.

## Failure, idempotency, concurrency, offline
Fault injection: crash in equivocation transaction; hold queue overflow; restart with held events.

## Privacy, retention, abuse
Synthetic envelopes only. No real node or user identifiers in fixtures.

## Observability & budgets
Full conflict suite ≤ 3 min on CI runner (ASSUMPTION).

## Tests
- TEST-PS-086-09-01 (contract): R01 fixture set passes with expected status and code.
- TEST-PS-086-09-02 (contract): every PS-086-02 code and PS-086-03 transition is covered.
- TEST-PS-086-09-03 (contract): two implementations agree on R01 results.
- TEST-PS-086-09-04 (integration): concurrency fixture from PS-086-06 passes 100 consecutive runs.
- TEST-PS-086-09-05 (negative): error responses contain no payload bytes or digests of the second version.

## Acceptance criteria
1. All R01 fixtures pass; TEST-PS-086-09-01 passes.
2. Coverage of codes and transitions is 100%; TEST-PS-086-09-02 passes.
3. No payload leakage in errors; TEST-PS-086-09-05 passes.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md).
- ASSUMPTION: second implementation for cross-check (F17 QA to confirm).
- PENDING CTR-SCH-001: fixture schema ID.
- PROVISIONAL (D01 default, unapproved): wire rules per CTR-FED-001.
