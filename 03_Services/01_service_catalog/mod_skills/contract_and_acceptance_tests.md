# PS-029-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/01_service_catalog/mod_skills. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-029-09.R01 | Consumer contract tests for F06 search index: token set per listing ≤ 20, schema `service_listing.skill_tokens` v1. | MVP |
| PS-029-09.R02 | Producer contract tests for CTR-EVT-001 envelope on all three events; payload ≤ 2 KiB. | MVP |
| PS-029-09.R03 | Golden fixtures per schema version and migration path (CTR-SCH-001 R09). | MVP |
| PS-029-09.R04 | Negative tests for every error code in [validation_rules.md](validation_rules.md). | MVP |
| PS-029-09.R05 | Accessibility e2e: keyboard add/remove of skill chips, screen-reader announcement of count (≤ 20). | MVP |
| PS-029-09.R06 | Offline e2e: attach queued offline, delivered once after reconnect. | MVP |
| PS-029-09.R07 | Property tests for uniqueness and state invariants in [workflow_state_machine.md](workflow_state_machine.md). | MVP |

## Data / schema
Fixture files stored under the module test directory, one per schema version; digests per CTR-SCH-001 R02.

## Commands / queries / events
Contract matrix: one row per command, query and event. Each row lists fixture ID, consumer, and expected error set.

## States & transitions
State invariants: no detached row is active; pending rows never in search tokens.

## Validation & errors
Error contract tests assert `code`, `retryable`, `message_key` and absence of input echo (CTR-ERR-001 R06–R07).

## Authorization
Contract tests for each capability in [authorization_capabilities.md](authorization_capabilities.md): allow and deny per row.

## Failure, idempotency, concurrency, offline
Contract tests for replay and conflict behavior in [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Fixtures use synthetic accounts and labels only; no production data in fixtures.

## Observability & budgets
Contract suite runtime ≤ 10 min in CI (ASSUMPTION).

## Tests
- TEST-PS-029-09-01 contract: F06 token consumer fixture.
- TEST-PS-029-09-02 contract: all event fixtures validate against CTR-SCH-001 registry.
- TEST-PS-029-09-03 e2e: provider attaches three skills; buyer filters by code; pending label absent.
- TEST-PS-029-09-04 a11y: skill chip keyboard flow and announcement.

## Acceptance criteria
1. Every row in the command/query/event matrix has at least one passing test.
2. Consumer fixture for F06 passes before F06 integration is accepted.
3. No fixture contains real personal data.

## Assumptions & open decisions
- ASSUMPTION: contract suite CI budget 10 min.
- F06 token schema `service_listing.skill_tokens` is PENDING CTR-SCH-001 registration by F06 owner.
- No payment or receipt checklist applies.
