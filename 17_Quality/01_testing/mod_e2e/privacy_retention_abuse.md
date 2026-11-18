# PS-134-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_e2e. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-134-07.R01 | Personas are fictional; pseudonym and region_code only; PII linter reports 0 hits | MVP |
| PS-134-07.R02 | Screenshots captured only at scenario checkpoints, with all form inputs and message bodies masked | MVP |
| PS-134-07.R03 | Location in fixtures limited to coarse public regions; no coordinate finer than 0.1 degree | MVP |
| PS-134-07.R04 | Trace and screenshot artifacts deleted after 14 days; run records kept 1 year | MVP |

## Data / schema
Data class for personas and artifacts: test-synthetic (CTR-PRV-001). Artifact record: `{artifact_id, run_id, kind: trace|screenshot, masked: bool, created_at, delete_after}`.

## Commands / queries / events
No new commands. Artifact deletion is a scheduled job.

## States & transitions
Artifact: created -> deleted (at delete_after). No other states.

## Validation & errors
`E2E.ARTIFACT_UNMASKED` (non-retryable): screenshot captured without masking. Diagnostic: checkpoint name.

## Authorization
Artifacts readable by QA Lead and CI identity. Engineers see run pass/fail only unless QA Lead grants access for a specific run.

## Failure, idempotency, concurrency, offline
Deletion job idempotent per artifact_id.

## Privacy, retention, abuse
- Abuse: a scenario uses a real account to reproduce a bug. Control: linter, and test-account registry rejects non-fixture accounts.
- Retention per R04; D07 PROVISIONAL (D07 default, unapproved).
- Masking is best-effort; screenshots are reviewed on first publication of a new checkpoint (ASSUMPTION).

## Observability & budgets
Count of unmasked artifact attempts (target 0). Artifact store size per week (target < 5 GB, ASSUMPTION).

## Tests
- TEST-PS-134-07-01 (unit): screenshot without mask flag rejected.
- TEST-PS-134-07-02 (unit): persona with real-format phone number rejected.
- TEST-PS-134-07-03 (integration): artifact deleted at delete_after, run record remains.

## Acceptance criteria
1. Zero personal-data hits in fixture sweep.
2. Masked screenshots verified at each checkpoint in the scenario set.
3. Deletion job drill passes.

## Assumptions & open decisions
- ASSUMPTION: masking by selector list covers all input and message elements.
- D05 PROVISIONAL (D05 default, unapproved): region-level fixtures only.
- D07 PROVISIONAL (D07 default, unapproved): 14-day artifacts, 1-year run records.
