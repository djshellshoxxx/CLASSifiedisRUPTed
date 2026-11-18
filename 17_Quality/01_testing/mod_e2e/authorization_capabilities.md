# PS-134-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/01_testing/mod_e2e. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (capability names PENDING approval).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-134-05.R01 | Scenario registration limited to QA Lead and flow owners for their own flow | MVP |
| PS-134-05.R02 | Run records writable only by CI identity; humans cannot edit a result | MVP |
| PS-134-05.R03 | Test accounts hold no production credentials and no live payment-rail credentials (0 allowed) | MVP |
| PS-134-05.R04 | Quarantine approver differs from requester | MVP |

## Data / schema
Proposed capabilities (PENDING CTR-CAP-001): `e2e.scenario.write`, `e2e.scenario.propose`, `e2e.run.write`, `e2e.run.read`, `e2e.quarantine.approve`.

## Commands / queries / events
Applies to PS-134-04 commands.

## States & transitions
Not applicable.

## Validation & errors
`E2E.UNAUTHORIZED` (non-retryable). Diagnostic: capability name only.

## Authorization
| Actor | Register scenario | Run | Record result | Quarantine request | Quarantine approve | Read results |
|---|---|---|---|---|---|---|
| QA Lead | yes | yes | no | yes | yes | yes |
| Flow owner (own flow) | propose | no | no | yes | no | yes |
| CI identity | no | yes | yes | no | no | yes |
| Engineer | no | no | no | no | no | yes |

## Failure, idempotency, concurrency, offline
Revocation applies to next command. Sandbox payment credentials are stored in CI secret store, scoped to test environment, rotated per D10 PROVISIONAL.

## Privacy, retention, abuse
Abuse case: a developer edits a run result to show green. Control: write capability withheld and records immutable after finish.

## Observability & budgets
Denials per week; any denial from CI identity triggers review.

## Tests
- TEST-PS-134-05-01 (unit): human RecordResult call denied.
- TEST-PS-134-05-02 (unit): flow owner registering scenario for another flow denied.
- TEST-PS-134-05-03 (integration): test environment cannot resolve live payment-rail hosts (network deny test).

## Acceptance criteria
1. Matrix enforced; one test per "no" cell.
2. Network deny test passes in CI.
3. Capability names confirmed against CTR-CAP-001.

## Assumptions & open decisions
- ASSUMPTION: CI secret store is the only location of sandbox credentials.
- D10 PROVISIONAL (D10 default, unapproved): sandbox key rotation documented; user-controlled keys out of scope for e2e.
