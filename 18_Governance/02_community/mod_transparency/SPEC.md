# F18.S02.M02 — Transparency reports

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F18.S02](../SPEC.md). **Process IDs:** PS-148-01…PS-148-10. **Code:** `packages/governance/src/community/transparency`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Periodic transparency reports for one publisher (typically a relay operator): aggregate counts of reports filed, moderation actions taken, appeals and their outcomes, proactive spam detections, policy decisions and operator-attested legal requests, with small-number suppression (any cell below 10 is shown as under 10, with complementary suppression). The report covers only what that relay hosted and is signed by the operator as classrup.governance.transparency_report/v1 after a second operator reviews it. It is not a global statistic and it contains no personal data, case content or requester identities.

## Responsibilities

- Own TransparencyReport (one signed report version per period) and TransparencyCounter (derived period counters, no identities).
- Accumulate counters from moderation events of the operator's relay and from operator-entered legal request tallies.
- Compute a report at period end (month or quarter), apply k >= 10 suppression with complementary suppression, and hold it for review by a second operator key.
- Publish the signed report to the operator's relay and keep corrections as new versions that supersede the earlier one.
- Alert the operator when a period has not been published within 30 days after it ended.

## Not responsible for

- Moderation decisions, reports, evidence and appeals themselves (F12); this module only counts their events.
- Legal evaluation or content of legal requests; only counts by type and outcome, attested by the operator.
- Global or cross-relay statistics; each report states the publisher and the hosting scope.
- User-level activity analytics; nothing here counts individual users.
- Future: federated roll-ups across cooperating relays using secure aggregation.

## User stories

- As a community member, I read my relay's quarterly report and can verify that it is signed by the operator I trust.
- As a relay operator, I prepare the report, a colleague reviews it, and it is published with small numbers suppressed.
- As a researcher, I download the signed JSON and CSV and check that they match.

## Edge cases

- A cell has 7 events; it is shown as under 10 and one more cell in the same row is suppressed so the value cannot be recovered from totals.
- Total reports in a period are below 10; every breakdown is suppressed and only the statement that the total is under 10 is shown.
- The same reviewer key as the compiler tries to publish; GOVERNANCE_TRANSPARENCY_SELF_REVIEW is returned.
- A correction is needed after publication; a new version is computed and published, and the earlier version is marked superseded but remains available.
- The operator vault was offline during part of the period; counters reflect only events processed by the relay, and the report states the processing coverage in percent of the period.
- A legal request tally is entered for a period that is already published; it is added to the next period and the correction path is offered.
- Event delivery duplicates; counters use eventId deduplication so counts do not inflate.
- Operator clock is wrong by days; period boundaries use the relay's receipt time and the report states that times are the relay's claims.

## UX and accessibility

- Operator dashboard: current-period counters (with suppression preview), coverage percent, days since last publication, compute and review actions.
- Public report page: period, publisher fingerprint, hosting scope statement, tables with suppressed cells shown as under 10, download JSON and CSV, verification status of the signature.
- Legal request entry: type, outcome, count increment; clear warning that no case details are stored.

**States:** loading; empty; collecting; computed; awaiting-review; published; superseded; overdue; offline-cached

**Accessibility:** Tables have captions and header cells; suppressed cells read as fewer than ten, not as an empty cell.; Charts, if any, have a table alternative; status uses text and icon.; Download buttons are at least 44x44 px with descriptive names.

## Owned data

- `TransparencyReport` (classrup.governance.transparency_report/v1, P0, RET-STANDARD)
- `TransparencyCounter` (classrup.governance.transparency_counter/v1, P3, RET-SHORT)

## Interfaces

- Commands: `governance.transparency.record_legal_request`, `governance.transparency.compute`, `governance.transparency.publish`, `governance.transparency.discard`, `governance.transparency.receive`
- Queries: `governance.transparency.get_published`, `governance.transparency.list_published`, `governance.transparency.preview`
- Emits: `governance.transparency.published`
- Consumes: `moderation.report.filed`, `moderation.action.applied`, `moderation.appeal.filed`, `moderation.appeal.decided`, `moderation.spam.detected`, `governance.policy_proposal.decided`

## Dependencies

F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-148-01 | [Domain schema](domain_schema.md) | 3 |
| PS-148-02 | [Validation rules](validation_rules.md) | 3 |
| PS-148-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-148-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-148-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-148-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-148-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-148-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-148-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-148-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/governance/src/community/transparency/index.ts`.

## Acceptance criteria

- All tests T01-T16 pass in CI.
- No published cell reveals a count between 1 and 9 directly or by differencing, and totals under 10 hide all breakdowns.
- Every published report is signed by one operator key, reviewed by a different operator key, states its hosting scope and coverage, and corrections never overwrite earlier versions.
