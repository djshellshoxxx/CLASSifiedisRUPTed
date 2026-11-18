# PS-137-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_unit. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-137-03.R01 | Every TestManifestEntry is in exactly one of unmapped, mapped, quarantined, retired at all times | MVP |
| PS-137-03.R02 | Only the transitions in the table below are permitted; any other transition is rejected with UNIT.ILLEGAL_TRANSITION | MVP |
| PS-137-03.R03 | Quarantined tests expire after 14 days; expiry without renewal moves the test to mapped with gate failure | MVP |
| PS-137-03.R04 | Retired TEST-IDs are never reused; a re-added test gets a new revision, not a new ID | MVP |

## Data / schema
Uses `TestManifestEntry.status` and `revision` from PS-137-01. Transition log entries: `{test_id, from, to, revision, actor_role, at}`.

## Commands / queries / events
Transitions are triggered by `unit.MapTest`, `unit.QuarantineTest`, `unit.ApproveQuarantine`, `unit.RetireTest` and by the scheduled expiry job (PS-137-04).

## States & transitions
| from | event | guard | to | side effect |
|---|---|---|---|---|
| unmapped | MapTest | file exists, >=1 req_id | mapped | emit unit.TestMapped |
| mapped | QuarantineTest | reason valid, requester != approver pending | quarantined (pending approval) | record request |
| quarantined | ApproveQuarantine | approver role differs from requester | quarantined (approved) | emit unit.TestQuarantined |
| quarantined | expiry (14 d) | no renewal | mapped | gate fails; emit unit.QuarantineExpired |
| quarantined | fix merged (CI pass) | test passes 3 consecutive runs | mapped | close quarantine |
| mapped | RetireTest | owning SPEC requirement removed | retired | keep row, no delete |
| retired | MapTest (same ID) | ID reserved | rejected | UNIT.TEST_ID_RETIRED |

## Validation & errors
Illegal transitions return UNIT.ILLEGAL_TRANSITION (non-retryable). Guard failures return the code from PS-137-02.

## Authorization
Approval transition needs a role other than requester (PS-137-05).

## Failure, idempotency, concurrency, offline
Transitions are applied under `revision` compare-and-set; loser gets UNIT.REVISION_CONFLICT (retryable after re-read). Expiry job is idempotent: running it twice has no extra effect.

## Privacy, retention, abuse
Transition log contains roles and IDs only, no test output.

## Observability & budgets
Gauge of entries per status per module; alert when quarantined share > 5% of active tests for 7 days (PROVISIONAL, see D07 for log retention).

## Tests
- TEST-PS-137-03-01 (unit): each row of the table as a single test case.
- TEST-PS-137-03-02 (property): random transition sequences never reach retired then mapped for the same ID.
- TEST-PS-137-03-03 (integration): 14-day expiry moves test to mapped after clock advance in fixture.

## Acceptance criteria
1. Table has no missing from/event combinations in permitted set; all others rejected.
2. Expiry with clock fixed at +14 d produces gate failure, not silent pass.
3. Retired ID re-use attempt returns UNIT.TEST_ID_RETIRED in 100% of cases.

## Assumptions & open decisions
- ASSUMPTION: "3 consecutive passing runs" is the recovery criterion for a quarantined test.
- Quarantine approval policy is PROVISIONAL pending QA Lead decision; no D-number assigned.
