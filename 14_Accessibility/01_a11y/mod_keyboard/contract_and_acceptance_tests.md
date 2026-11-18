# PS-109-09 — contract and acceptance tests
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_keyboard. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-EVT-001, CTR-ERR-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-109-09.R01 | Every requirement in PS-109-01 through PS-109-08 maps to at least one test ID. | MVP |
| PS-109-09.R02 | Keyboard-only walkthrough passes on all catalog dialogs before release (QA Lead sign-off). | MVP |
| PS-109-09.R03 | Contract tests run on every schema change (CTR-SCH-001 R03). | MVP |

## Data / schema
Test fixtures: a seeded component catalog (10 representative components: listing form, message thread, cycle consent dialog, filter panel, modal confirm, menu, tabs, grid, toast, drawer) and synthetic accounts.

## Commands / queries / events
Contract tests replay `kbd.binding.set`, `kbd.binding.reset` and `keyboard_binding.changed` samples.

## States & transitions
Covered by TEST-PS-109-03 series.

## Validation & errors
Negative fixtures for each code in [PS-109-02](validation_rules.md).

## Authorization
Negative tests in [PS-109-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Fault injection in [PS-109-06](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Log-scan tests from [PS-109-07](privacy_retention_abuse.md).

## Observability & budgets
Performance tests from [PS-109-08](observability_performance.md).

## Tests
- TEST-PS-109-09-01 contract: schema samples validate against v1.0.0.
- TEST-PS-109-09-02 e2e: keyboard-only creation of a listing, dialog close returns focus.
- TEST-PS-109-09-03 a11y: automated scan of catalog pages plus manual keyboard walkthrough (automated tool selection PENDING research).
- TEST-PS-109-09-04 offline: change while offline, reconnect, verify single committed event.

## Acceptance criteria
1. Traceability matrix maps 100% of keyboard requirements to tests.
2. Keyboard walkthrough shows no focus trap without an exit path.
3. Contract tests fail on a breaking schema change without a MAJOR bump.

## Assumptions & open decisions
- ASSUMPTION: manual walkthrough is required in addition to automated scan.
- No Dxx decision directly affects testing.
