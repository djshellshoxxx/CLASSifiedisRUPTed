# PS-133-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_threats. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-133-06.R01 | PublishModel failure at any step leaves the prior published version active and no partial version rows | MVP |
| PS-133-06.R02 | Dangling control links detected within 24 h by scheduled job and at each publish | MVP |
| PS-133-06.R03 | Concurrent edits on the same threat: second writer receives THREATS.REVISION_CONFLICT | MVP |
| PS-133-06.R04 | A control rename or removal never deletes a threat; status moves to `assessed` with flag `control_unresolved` | MVP |

## Data / schema
Uses `revision`, `content_hash` and `ThreatModelVersion.status`. Flag field `control_unresolved: bool` on Threat (added to PS-133-01 record view).

## Commands / queries / events
Retry-safe per PS-133-04. Failure event: `threats.PublishFailed` (model_id, version, code).

## States & transitions
| from | event | guard | to | side effect |
|---|---|---|---|---|
| draft version | PublishModel ok | all checks pass | published | previous published -> superseded |
| draft version | PublishModel fail | any check fails | draft | emit PublishFailed |
| published | control removed | link unresolved | published (flag set) | notify owner |

## Validation & errors
`THREATS.REVISION_CONFLICT` (retryable after re-read), `THREATS.PUBLISH_ABORTED` (retryable after fix), `THREATS.STORE_UNAVAILABLE` (retryable; 3 attempts with 2 s backoff, ASSUMPTION).

## Authorization
Recovery jobs run as server identity; manual unflagging requires Security Lead.

## Failure, idempotency, concurrency, offline
- Publish is a single transaction; partial failure rolls back.
- Timeout for write commands 5 s (ASSUMPTION).
- Concurrency via compare-and-set on `revision`.
- Offline: not applicable; no client-side queue for this register.

## Privacy, retention, abuse
Recovery logs carry IDs and codes only.

## Observability & budgets
Publish failure count per week (target 0); dangling-link count (target 0 after 24 h).

## Tests
- TEST-PS-133-06-01 (integration): inject failure at each publish step; prior version stays active.
- TEST-PS-133-06-02 (integration): two writers race on one threat; exactly one succeeds.
- TEST-PS-133-06-03 (integration): removing a control target sets flag and keeps the threat.

## Acceptance criteria
1. Failure injection at four publish steps leaves prior version active in 100% of runs.
2. No threat row deleted by any recovery path.
3. Dangling link flag visible in CoverageReport.

## Assumptions & open decisions
- ASSUMPTION: 3-attempt retry with 2 s backoff is adequate for a low-traffic back-office store.
- No D-number applies beyond D10 (not used here).
