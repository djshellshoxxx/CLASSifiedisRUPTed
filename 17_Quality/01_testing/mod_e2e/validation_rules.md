# PS-134-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_e2e. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-134-02.R01 | A scenario has 3..40 steps, indexes contiguous from 1, each with non-empty `expected` | MVP |
| PS-134-02.R02 | Each scenario for `cycle_3`, `cycle_4`, `cycle_n` asserts the full cycle closure (every party gives and receives once) | MVP |
| PS-134-02.R03 | Fixtures pass the synthetic-data linter (no real-format email, phone, street address, precise coordinate) | MVP |
| PS-134-02.R04 | `max_duration_s` between 30 and 120 | MVP |
| PS-134-02.R05 | `payments` scenarios must assert claimed and confirmed states separately, never a single "paid" state | MVP |

## Data / schema
Validates `E2EScenario`, `FixtureSet`, `E2ERun` from PS-134-01.

## Commands / queries / events
Checks run inside RegisterScenario and RecordResult (PS-134-04).

## States & transitions
Not applicable; stateless checks.

## Validation & errors
| Code | Trigger | Retryable | User message key | Diagnostic |
|---|---|---|---|---|
| E2E.SCENARIO_INCOMPLETE | steps < 3 or expected empty | no | e2e.scenario_incomplete | scenario test_id |
| E2E.FLOW_UNKNOWN | flow not in enum | no | e2e.flow_unknown | value length only |
| E2E.CYCLE_CLOSURE_MISSING | cycle scenario lacks closure step | no | e2e.cycle_closure_missing | test_id |
| E2E.FIXTURE_NOT_SYNTHETIC | linter hit | no | e2e.fixture_not_synthetic | rule ID, field name |
| E2E.PAYMENT_STATE_AMBIGUOUS | payment scenario uses single paid state | no | e2e.payment_state_ambiguous | test_id |
| E2E.DURATION_EXCEEDED | max_duration_s out of range | no | e2e.duration_out_of_range | value |

## Authorization
Validators run as CI identity; rule set versioned.

## Failure, idempotency, concurrency, offline
Deterministic; same scenario gives same error list.

## Privacy, retention, abuse
Diagnostics never echo step text or fixture values.

## Observability & budgets
Validation errors per week by code. Full-suite validation <= 30 s (ASSUMPTION).

## Tests
- TEST-PS-134-02-01 (unit): each error code with a minimal fixture.
- TEST-PS-134-02-02 (unit): cycle_4 scenario missing closure step rejected.
- TEST-PS-134-02-03 (unit): payment scenario with only "paid" assertion rejected.

## Acceptance criteria
1. All six codes covered by unit tests.
2. Every registered cycle scenario passes closure validation.
3. No diagnostic contains step text.

## Assumptions & open decisions
- ASSUMPTION: "closure" is verified by an explicit final-state assertion, not inferred from a timeout.
- D04 PROVISIONAL (D04 default, unapproved): barter scenarios assert per-party attestations, not atomic completion.
- D03 PROVISIONAL (D03 default, unapproved): mixed-value scenarios assert integer minor-unit amounts.
