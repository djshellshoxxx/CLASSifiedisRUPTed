# F18.S02.M02 — Transparency reports

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F18.S02](../SPEC.md). **Process IDs:** PS-148-01…PS-148-10. **Code:** `packages/governance/src/community/transparency`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Periodic transparency reports for one relay: aggregate counts of reports received, moderation actions taken, appeals and their outcomes, spam detections at relay intake, the operator's policy decisions and operator-attested legal requests, with small-number suppression (any cell below 10 is shown as under 10, with complementary and cross-version suppression). Counters live on the relay as relay-local operational data: a relay-side consumer of the relay-local moderation events accumulates them, and the relay serves a relay-signed counter snapshot, sealed to the requesting operator key, with coverage measured from its processing checkpoints. A compiler operator imports the snapshot into its vault, computes the report deterministically and sends a compiler-signed draft to a second operator key, which countersigns and publishes classrup.governance.transparency_report/v1. Receivers check both signatures against the relay's signed operator list. The report covers only what that relay hosted; it is not a global statistic and it contains no personal data, case content or requester identities.

## Responsibilities

- Own TransparencyReport (one two-signature report version per relayId, periodKey and version) and TransparencyCounter (relay-side period counters, no identities).
- Accumulate counters on the relay from relay-local moderation events bound to the F12 producer enums, from the operator's relay-scope policy decisions and from operator-signed legal request tallies, and serve operators a relay-signed, sealed counter snapshot with measured coverage.
- Compute a report deterministically from a verified snapshot at period end (one period granularity per relay), apply k >= 10 suppression with complementary and cross-version suppression, and send a compiler-signed draft to a second operator key for review.
- Publish the report countersigned by the reviewer to the relay, verify both signatures and the operator list in every receiving vault, and keep corrections as new versions that supersede the earlier one.
- Alert the operator when a period has not been published within 30 days after it ended.

## Not responsible for

- Moderation decisions, reports, evidence and appeals themselves (F12); this module only counts their relay-local events.
- Legal evaluation or content of legal requests; only counts by type and outcome, attested by the operator.
- Global or cross-relay statistics; each report states the relay and the hosting scope.
- User-level activity analytics; nothing here counts individual users.
- The relay's operator list (F15.S04.M03 tenant configuration and F16.S01.M01 role assignments) and relay receipts and keys (F15.S02.M01).
- Future: federated roll-ups across cooperating relays using secure aggregation.

## User stories

- As a community member, I read my relay's quarterly report and can verify that it is signed by two different operator keys of that relay.
- As a relay operator, I prepare the report from the relay's signed counter snapshot, a colleague reviews and countersigns it, and it is published with small numbers suppressed.
- As a researcher, I download the signed JSON and CSV and check that they match.

## Edge cases

- A cell has 7 events; it is shown as under 10, one more cell in the same row is shown as suppressed and the row total is not published, so the value cannot be recovered from totals.
- Total reports in a period are below 10; every breakdown is suppressed and only the statement that the total is under 10 is shown.
- The same reviewer key as the compiler tries to publish; GOVERNANCE_TRANSPARENCY_SELF_REVIEW is returned.
- A reviewer key that is not in the relay's signed operator list countersigns; receivers quarantine the report with GOVERNANCE_TRANSPARENCY_SELF_REVIEW.
- A correction is needed after publication; a new version is computed from a new snapshot, every cell whose change from the earlier version is 1 to 9 is suppressed, and the earlier version is marked superseded but remains available.
- The relay's moderation consumers were stopped for 12 hours in a 92-day quarter; the snapshot's coverage is measured from processing checkpoints and the report states 99 percent.
- A legal request tally is entered for a period that is already published; it is added to the next period and the correction path is offered.
- Event delivery duplicates, and vault-derived copies of moderation events exist; counters use eventId deduplication, ignore origin vault and vault_filter events, and count each policy decision once by proposalId and statementCid.
- Operator clock is wrong by days; period boundaries use the relay's time of each event and the report states that times are the relay's claims.
- A relay that published quarterly reports tries a monthly report for a month in a published quarter; rejected with GOVERNANCE_TRANSPARENCY_PERIOD_INVALID.
- Two different version-1 reports for the same period are published from different reviewer vaults; readers mark both conflicted and show neither as current.

## UX and accessibility

- Operator dashboard: current-period counters from the latest snapshot (with suppression preview), measured coverage percent, days since last publication, compute, request review and review actions.
- Public report page: period, relay and operator fingerprints of compiler and reviewer with the text 'two different keys, not proof of two people', hosting scope statement, tables with suppressed cells shown as under 10 or suppressed, download JSON and CSV, verification status of both signatures.
- Legal request entry: type, outcome, count increment; clear warning that no case details are stored.

**States:** loading; empty; collecting; computed; awaiting-review; published; superseded; conflicted; overdue; offline-cached

**Accessibility:** Tables have captions and header cells; suppressed cells read as fewer than ten or as withheld, not as an empty cell.; Charts, if any, have a table alternative; status uses text and icon.; Download buttons are at least 44x44 px with descriptive names.

## Owned data

- `TransparencyReport` (classrup.governance.transparency_report/v1, P0, RET-STANDARD)
- `TransparencyCounter` (classrup.governance.transparency_counter/v1, P2, RET-AUDIT)

## Interfaces

- Commands: `governance.transparency.record_legal_request`, `governance.transparency.import_snapshot`, `governance.transparency.compute`, `governance.transparency.request_review`, `governance.transparency.publish`, `governance.transparency.discard`, `governance.transparency.receive`, `governance.transparency.relay_upload`
- Queries: `governance.transparency.get_published`, `governance.transparency.list_published`, `governance.transparency.preview`, `governance.transparency.relay_counter_snapshot`
- Emits: `governance.transparency.published`
- Consumes: `moderation.report.received`, `moderation.action.applied`, `moderation.appeal.filed`, `moderation.appeal.decided`, `moderation.spam.detected`, `governance.policy_proposal.decided`

## Dependencies

F18.S02.M01, F16.S02.M03, F11.S01.M01, F15.S02.M01, F15.S04.M03, F07.S02.M01, F12.S01.M01, F12.S01.M03, F12.S02.M01, F12.S02.M02, F10.S01.M02, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-148-01 | [Domain schema](domain_schema.md) | 4 |
| PS-148-02 | [Validation rules](validation_rules.md) | 5 |
| PS-148-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-148-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-148-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-148-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-148-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-148-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-148-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-148-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/governance/src/community/transparency/index.ts`.

## Acceptance criteria

- All tests T01-T22 pass in CI.
- No published cell reveals a count between 1 and 9 directly, through totals or by differencing across periods or versions, and totals under 10 hide all breakdowns.
- Every published report is computed from a relay-signed snapshot, signed by one operator key and countersigned by a different operator key of the same relay, verified by receivers, states its hosting scope and measured coverage, and corrections never overwrite earlier versions.
