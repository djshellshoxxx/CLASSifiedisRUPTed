# PS-003-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_edit. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001 (consumer-driven tests R04–R06), CTR-EVT-001 (envelope, concurrency and idempotency tests), CTR-ERR-001 (error shape), CTR-CAP-001 (authorization tests).

**Decision labels:** Offline test expectations PROVISIONAL (D08 default, unapproved). Test IDs are assignments, not results.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-003-09.R01 | Producer contract tests for `listing.edit` and `listing.get_for_edit` run in CI on every change. | MVP |
| PS-003-09.R02 | Consumer-driven contract tests for `listing.updated` run against discovery index (06_Discovery mod_index) and moderation (12_Moderation). | MVP |
| PS-003-09.R03 | Every error code in [validation_rules.md](validation_rules.md) and [workflow_state_machine.md](workflow_state_machine.md) has one negative test. | MVP |
| PS-003-09.R04 | Offline reconnect and conflict flows run end-to-end on mobile viewport with screen reader announcement of conflict. | MVP |
| PS-003-09.R05 | Fixtures: 50 listing fixtures across categories, states and price shapes; no real personal data. | MVP |

## Data / schema
Fixtures: `listing` (per state), `offer` (open/closed flag only), `device_queue` (pending, conflicting edits). Schema per [domain_schema.md](domain_schema.md).

## Commands / queries / events
Contract coverage: `listing.edit` v1.0.0, `listing.get_for_edit` v1.0.0, `listing.updated` v1.0.0. See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Each row of the transition table in [workflow_state_machine.md](workflow_state_machine.md) has one test.

## Validation & errors
Error coverage per PS-003-09 R03.

## Authorization
Authorization matrix tests in [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Failure tests in [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Privacy tests in [privacy_retention_abuse.md](privacy_retention_abuse.md).

## Observability & budgets
Load and metric tests in [observability_performance.md](observability_performance.md).

## Tests
- TEST-PS-003-09-01 (contract): producer schema for `listing.edit` request and response.
- TEST-PS-003-09-02 (contract): consumer test for `listing.updated` in mod_index.
- TEST-PS-003-09-03 (contract): consumer test for `listing.updated` in moderation re-screen.
- TEST-PS-003-09-04 (e2e): owner edits published title on mobile viewport; index shows new title within budget.
- TEST-PS-003-09-05 (a11y): conflict message announced by screen reader and reachable by keyboard.
- TEST-PS-003-09-06 (offline): queued edit flushes on reconnect; "not yet saved" state clears on acknowledgment.
- TEST-PS-003-09-07 (integration): full negative table run; no value echoed in any error.

## Acceptance criteria
1. Producer and consumer contract tests pass in CI.
2. Every error code and transition has one passing negative or unit test.
3. Mobile and screen-reader tests pass for conflict and blocked-edit messages.
4. Fixtures contain no real personal data.

## Assumptions & open decisions
- ASSUMPTION: test environment runs mod_index and moderation stubs.
- D08 (PROVISIONAL, Dxx default, unapproved): offline test expectations.
- Consumer list confirmed by dependency matrix PENDING.
