# PS-104-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_push. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-104-09.R01 | Contract tests run on every change to push schemas, error codes or event types, before merge. | MVP |
| PS-104-09.R02 | Every error code in PS-104-02 and PS-104-03 has a contract test asserting envelope, `retryable` and `message_key`. | MVP |
| PS-104-09.R03 | Browser test covers subscribe, receive, revoke on Web Push simulator in Chromium, Firefox and Safari (desktop and iOS). | MVP |
| PS-104-09.R04 | Accessibility: permission prompt and settings controls pass keyboard-only and screen reader checks (WCAG 2.2 AA target). | MVP |

## Data / schema
Fixtures: test push host (`push.test.invalid` ASSUMPTION), VAPID test key pair (non-production), simulated `dev_` and `acc_` records.

## Commands / queries / events
Contract test replays each command with valid, invalid, duplicate and stale-revision inputs and compares response to schema.

## States & transitions
State coverage: all rows of workflow_state_machine.md must be exercised (see TEST-PS-104-03-01).

## Validation & errors
Negative tests: each validation row in PS-104-02 has one failing fixture.

## Authorization
Negative tests: cross-account and operator access fixtures (PS-104-05).

## Failure, idempotency, concurrency, offline
Chaos fixtures from PS-104-06 are included in the integration suite.

## Privacy, retention, abuse
Privacy fixtures check that no event, response or log contains fixture endpoint or key strings.

## Observability & budgets
Test suite runtime budget 10 min for unit and contract layers.

## Tests
- TEST-PS-104-09-01 (contract): all push events validate against CTR-EVT-001.
- TEST-PS-104-09-02 (contract): all push error codes match CTR-ERR-001 regex and envelope.
- TEST-PS-104-09-03 (e2e): subscribe, receive generic notification, revoke, no further sends.
- TEST-PS-104-09-04 (a11y): permission prompt keyboard path and announcement tested.
- TEST-PS-104-09-05 (offline): reconnect after 2 h offline yields queued attempts delivered or expired per TTL.

## Acceptance criteria
1. Contract suite green on CI for all rows above.
2. Browser matrix in R03 passes before MVP gate.
3. Accessibility checklist signed off by Accessibility Lead (future gate).

## Assumptions & open decisions
- ASSUMPTION: Safari web push requires home-screen install (see mod_install); test fixture accounts for this.
- No Dxx directly applies; test scope aligns with D07 retention tests.
