# PS-024-06 — failure, recovery and idempotency

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_recovery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R02, R03), CTR-ERR-001 (R03), CTR-SCH-001 (R07).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-024-06.R01 | Missing attestation at window end is recorded as `not_given`; the recovery never waits indefinitely. | MVP |
| PS-024-06.R02 | Compensation steps are idempotent per (recovery_id, step_id); reruns skip done steps. | MVP |
| PS-024-06.R03 | A failed release step moves the recovery to closed_partial with a retry queue; it is not silently dropped. | MVP |
| PS-024-06.R04 | Retry: 1 s base, 60 s cap, 8 attempts (ASSUMPTION), then escalated. | MVP |
| PS-024-06.R05 | A party's late attestation after window end is refused (CYCRECOV.WINDOW_CLOSED) and does not change the plan. | MVP |

## Data / schema
Plan steps with status; attestations immutable.

## Commands / queries / events
Compensate is retry-safe per step.

## States & transitions
Failure paths in PS-024-03.

## Validation & errors
Retry-exhausted steps return SYS.UNAVAILABLE internally and escalate.

## Authorization
Retries use system grant; attest retries re-check participant.

## Failure, idempotency, concurrency, offline
- Race: two attestations near window end serialise on revision.
- Crash mid-plan: resume from last committed step.
- Offline: attestation queued as pending-ack only (D08); never final locally.

## Privacy, retention, abuse
Retry logs carry step IDs only.

## Observability & budgets
Count of closed_partial and escalated per day.

## Tests
- TEST-PS-024-06-01 (integration): silent party leads to not_given and compensation.
- TEST-PS-024-06-02 (negative): late attestation refused and plan unchanged.
- TEST-PS-024-06-03 (fault): release step failure moves to closed_partial; retry closes.

## Acceptance criteria
1. No recovery waits past window + 14 days.
2. Compensation reruns create no duplicate releases.
3. Every failed step is visible in state, none silently dropped.

## Assumptions & open decisions
- PROVISIONAL (D04 default, unapproved).
- ASSUMPTION: retry values above.
