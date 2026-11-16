# F09.S02.M03 — Settlement reconciliation

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F09.S02](../SPEC.md). **Process IDs:** PS-072-01…PS-072-10. **Code:** `packages/commerce/src/settlement/reconciliation`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Periodically compares, inside the user's vault, the Deals, payment claims, chain observations, receipts and sync state that belong together, and reports where they disagree or have gone stale: a completed Deal without a settled claim, a final crypto claim without an observation, a claim silent for 10 days, a statement that never left the device, an unresolved fork. The report is advice for the user; the module reads other modules through ports, changes nothing in them and never moves money.

## Responsibilities

- [object Object]
- Detect ten mismatch kinds with severities and emit commerce.reconciliation.mismatch_found once per new mismatch.
- Let the user dismiss a mismatch with a note so it is not re-announced, while it stays visible in the report.
- Keep scanning cost bounded (500 records per tick, yielding to the UI) so large vaults stay responsive.

## Not responsible for

- Correcting or repairing records; each owning module (F09.S01.M01, F09.S01.M03, F09.S02.M01) changes its own data.
- Accounting, tax and bookkeeping reports.
- Relay-side reconciliation of relay-held data (relay operators use their own tooling under F15).
- Future: scheduled export of reconciliation reports to a user-selected location and cross-vault comparison of signed state digests with a counterparty.

## User stories

- As a seller, I see a daily note that two claims have been waiting for my acknowledgement for 10 days before they expire.
- As a buyer paying in BTC, I see that my claim has no verifier configured and what to do about it.
- As a user with many deals, I can run a check and see only the items that need action.

## Edge cases

- A mismatch disappears because the owning module fixed it; the next report marks it resolved and does not emit again.
- The same mismatch persists across daily runs; it is emitted once and shown in every report until dismissed or resolved.
- A run is interrupted by closing the PWA at 40 percent; the report is marked failed and the next run restarts from scratch with the same result.
- A vault with 20 000 claims; the scan is chunked and finishes within the budget without blocking input.
- Clock set backwards by a day; stale-claim detection uses the monotonic lastProgressAt differences and never produces negative ages.
- A dismissed mismatch becomes worse (a claim goes from stale to expired); a new mismatch of a different kind is emitted.

## UX and accessibility

- Settlement check card on the Deals screen: last run time, count of items needing action, Run check button.
- Mismatch list: grouped by severity with plain-language explanation, deep link to the deal or claim, Dismiss with note.

**States:** loading; no-issues; issues-found; running; failed; dismissed

**Accessibility:** Severity is conveyed by text label and icon, not color alone.; Run progress is announced politely at 25 percent steps.; Dismiss buttons have names containing the mismatch summary and are at least 44 px high.

## Owned data

- `ReconciliationReport` (classrup.commerce.reconciliation_report/v1, P2, RET-SHORT)

## Interfaces

- Commands: `commerce.reconciliation.run`, `commerce.reconciliation.dismiss`
- Queries: `commerce.reconciliation.latest`, `commerce.reconciliation.list`
- Emits: `commerce.reconciliation.mismatch_found`
- Consumes: `commerce.deal.completed`, `commerce.payment.finalized`, `commerce.payment.reorged`, `commerce.receipt.issued`, `commerce.payment.expired`

## Dependencies

F09.S01.M01, F09.S01.M03, F09.S02.M01, F09.S03.M03, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-072-01 | [Domain schema](domain_schema.md) | 3 |
| PS-072-02 | [Validation rules](validation_rules.md) | 3 |
| PS-072-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-072-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-072-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-072-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-072-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-072-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-072-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-072-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/commerce/src/settlement/reconciliation/index.ts`.

## Acceptance criteria

- All tests T01 to T15 pass in CI.
- The module never writes to another module's records (write-spy test).
- Each mismatch kind is detected exactly when its rule holds.
