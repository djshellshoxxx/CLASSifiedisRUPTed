# PS-143-08 — observability and performance budgets

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_gates. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-143-08.R01 | Every decision emits a metric with outcome, gate key and blocking evidence type. | MVP |
| PS-143-08.R02 | Open waivers and days to expiry are visible on the release dashboard. | MVP |

## Budgets
| Metric | Target (ASSUMPTION) |
|---|---|
| Evaluation time after last evidence arrives, p95 | ≤ 60 s |
| Waivers open past expiry | 0 |
| Blocked decisions older than 7 days without a waiver or fix | flagged to QA Lead |

## Logs
Gate key, commit SHA prefix, outcome, evidence type. No evidence bodies.

## Data / schema
Not applicable to this process; owned by [domain_schema](domain_schema.md).

## Commands / queries / events
Not applicable to this process; owned by [commands_queries_events](commands_queries_events.md).

## States & transitions
Not applicable to this process; owned by [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Not applicable to this process; owned by [validation_rules](validation_rules.md).

## Authorization
Not applicable to this process; owned by [authorization_capabilities](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Not applicable to this process; owned by [failure_recovery_idempotency](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Not applicable to this process; owned by [privacy_retention_abuse](privacy_retention_abuse.md).

## Tests
- TEST-PS-143-08-01 (unit): each decision emits a metric with outcome, gate key and blocking evidence type.
- TEST-PS-143-08-02 (performance): evaluation completes within 60 s after the last evidence arrives.

## Acceptance criteria
1. TEST-PS-143-08-01, TEST-PS-143-08-02 pass in CI.
2. Each requirement in this file maps to at least one test above.

## Assumptions & open decisions
- ASSUMPTION: 60-second budget assumes evidence records are already stored.
- No Dxx governs budgets directly: PROVISIONAL, none applied.
