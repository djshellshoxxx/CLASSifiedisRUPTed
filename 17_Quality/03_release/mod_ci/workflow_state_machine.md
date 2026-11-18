# PS-141-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_ci. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-141-03.R01 | Run states are exactly `queued`, `running`, `passed`, `failed`, `aborted_infra`, `superseded`. | MVP |
| PS-141-03.R02 | A new push to the same branch supersedes older `queued` or `running` PR runs for that branch within 60 s (ASSUMPTION). | MVP |
| PS-141-03.R03 | `passed` requires every required check in the pipeline version to be `passed`. | MVP |
| PS-141-03.R04 | Terminal states are immutable. | MVP |

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | StartCiRun | pipeline version active; commit exists | queued | emit `ci_run.started` on dispatch |
| queued | DispatchRun | runner pool matches trigger | running | runner bound as `sys_` |
| running | RecordJobResult (all jobs) | every required check `passed` | passed | emit `ci_run.completed` |
| running | RecordJobResult (any required fails) | none | failed | emit `ci_run.completed` |
| running | Timeout or RunnerLost | infra error | aborted_infra | eligible for one retry (see failure file) |
| queued or running | SupersedeRun | newer push on branch | superseded | emit `ci_run.completed`, status superseded |

## Validation & errors
Invalid pairs return `CIPIPE.INVALID_TRANSITION` (422, non-retryable). A `passed` run may not be edited; a changed commit needs a new run.

## Failure, idempotency, concurrency, offline
- Webhook duplicates: the same `(commit_sha, pipeline_key, trigger)` maps to one queued run.
- Runner lost mid-job: the job is marked `aborted_infra`; no partial artifact digest is published.
- Offline: no effect; CI requires network to dispatch, and runs are not marked complete from local runners.

## Data / schema
Not applicable to this process; owned by [domain_schema](domain_schema.md).

## Commands / queries / events
Not applicable to this process; owned by [commands_queries_events](commands_queries_events.md).

## Authorization
Not applicable to this process; owned by [authorization_capabilities](authorization_capabilities.md).

## Privacy, retention, abuse
Not applicable to this process; owned by [privacy_retention_abuse](privacy_retention_abuse.md).

## Observability & budgets
Not applicable to this process; owned by [observability_performance](observability_performance.md).

## Tests
- TEST-PS-141-03-01 (unit): every row of the transition table passes; other pairs return CIPIPE.INVALID_TRANSITION.
- TEST-PS-141-03-02 (integration): a newer push supersedes a queued PR run within 60 s.

## Acceptance criteria
1. TEST-PS-141-03-01, TEST-PS-141-03-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: 60-second supersede window is a default; confirm with QA Lead.
- D08 (offline writes) is out of scope; the offline suite results are read here only.
