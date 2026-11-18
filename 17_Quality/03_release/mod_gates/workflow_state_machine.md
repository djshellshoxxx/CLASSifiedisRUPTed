# PS-143-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_gates. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-143-03.R01 | Decision states are exactly `evaluating`, `pass`, `blocked`, `waived`. | MVP |
| PS-143-03.R02 | `pass` requires every required evidence item present, fresh (same commit) and in a passing state. | MVP |
| PS-143-03.R03 | A `blocked` decision moves to `waived` only through an approved waiver; it never moves to `pass` by re-evaluation alone unless evidence now passes. | MVP |
| PS-143-03.R04 | Waiver states are exactly `requested`, `granted`, `expired`, `revoked`. | MVP |

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | EvaluateGates | gate version active | evaluating | none |
| evaluating | EvaluationComplete | all evidence fresh and passing | pass | emit `gate_decision.recorded` |
| evaluating | EvaluationComplete | any evidence missing, failing or stale | blocked | emit `gate_decision.recorded` with blocking evidence IDs |
| blocked | GrantGateWaiver | R03 of PS-143-02 satisfied | waived | emit `gate_waiver.granted` |
| waived | WaiverExpires | `expires_at` passed | blocked | re-evaluation required |
| granted waiver | RevokeWaiver | none | revoked | decision → blocked |

## Validation & errors
Invalid pairs return `GATES.INVALID_TRANSITION` (422). Decisions are immutable once recorded; a new evaluation creates a new decision.

## Failure, idempotency, concurrency, offline
- Evidence arriving after evaluation does not change the recorded decision; a new evaluation is required.
- Duplicate `EvaluateGates` for the same commit and gate version returns the existing decision.
- No offline state; evaluation requires online access to evidence records.

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
- TEST-PS-143-03-01 (unit): every row of the transition table passes; other pairs return GATES.INVALID_TRANSITION.
- TEST-PS-143-03-02 (integration): evidence arriving after evaluation leaves the recorded decision unchanged.

## Acceptance criteria
1. TEST-PS-143-03-01, TEST-PS-143-03-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: waivers do not carry over to a new commit.
- D07 (retention) default applies to decisions: PROVISIONAL (D07 default, unapproved).
