# F02.S04.M02 — Barter currency normalization

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F02.S04](../SPEC.md). **Process IDs:** PS-025-01…PS-025-10. **Code:** `packages/mutiny/src/value_balancing/currency`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Converts the declared values of all items in a proposal or cycle into one settlement currency with pinned FX quotes (F09.S03.M02), using bigint arithmetic and a single HALF_EVEN rounding per conversion (MNY-3, MNY-4). The resulting NormalizationRecord lists every quote id, rate, source and expiry and is embedded in the signed revision snapshot, so every participant signs the same numbers. Receivers independently recompute the arithmetic. A quote's rate is only as trustworthy as its source, and the UI labels the source (relay-signed, manual operator rate, local). When a pinned quote expires before commit, the record expires and the coordinator must issue a new revision, which voids earlier consents.

## Responsibilities

- Compute normalization records for a subject from valuations and quotes, with settlement currency default from the vault's configuration (default EUR for a EUR tenant), at most 5 distinct currencies and 8 quotes per record.
- Request quotes with a time-to-live that covers the consent deadline plus 30 minutes where the source allows, and shorten the effective consent deadline to the earliest quote expiry otherwise.
- Verify and store peers' normalization data from signed revisions by recomputing every conversion, and flag mismatches.
- Expire records at the earliest quote expiry before commit, emit the expiry for re-consent, and freeze records after commit.

## Not responsible for

- Declared values and plausibility (F02.S04.M03) and tolerance comparison (F02.S02.M05).
- Quote issuance, rate sources and manual operator rates (F09.S03.M02), currency registry (F09.S03.M01) and Money arithmetic (F09.S03.M03).
- Compensation amounts (F02.S04.M01) and payments (F09.S01.M01).
- Future: multi-currency settlement per leg, rate-source quorum, and conversion of crypto assets with on-chain price oracles.

## User stories

- As a coordinator of a cycle with items valued in EUR, GBP and CHF, I see all values in EUR with the rates used, their source and when they expire.
- As a participant, I can verify that the numbers I sign were converted correctly from the declared amounts and that the rate source is named.
- As a coordinator, when a quote expires before everyone consented, I get a clear prompt to refresh it and I know that everyone must consent again.

## Edge cases

- All items are already in the settlement currency; a record is still created with no quotes so the pinned numbers are explicit.
- A currency pair has no available quote; the record is refused and the user is told which pair is missing.
- The only available rate is a manual operator rate; it is accepted but labelled manual and flagged as not independently sourced.
- A quote expires 10 minutes after the cycle was proposed; the record expires, the effective consent window ended early, and the coordinator must create a quote_refresh revision.
- A participant's recomputation gives a different converted amount by one minor unit; the revision is flagged normalization_mismatch and cannot be consented.
- A declared value is in a currency that is not in the registry; refused with the registry's currency error.
- The settlement currency has zero decimals (JPY) while items are in EUR; the exponent difference is applied exactly as in MNY-4.

## UX and accessibility

- Values summary: each item with declared amount, rate used, converted amount and source label, plus a footer line 'Rates expire at 14:20; after that the proposal needs a refresh and new consent'.
- Rate source details sheet naming source, as-of time and whether the rate was signed by its source or stated by the proposer.

**States:** loading; current; expiring; expired; mismatch; frozen; error

**Accessibility:** Rates are shown as text such as '1 GBP = 1.1700 EUR' with the source named, readable by screen readers.; The expiring and expired banners use text, not only color, and are announced in an aria-live polite region.; All actions are buttons of at least 44 by 44 px.

## Owned data

- `NormalizationRecord` (classrup.mutiny.normalization_record/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `mutiny.normalization.compute`, `mutiny.normalization.verify`
- Queries: `mutiny.normalization.get`, `mutiny.normalization.current_for_subject`
- Emits: `mutiny.values.normalized`, `mutiny.normalization.expired`
- Consumes: `mutiny.valuation.declared`, `mutiny.proposal.revised`, `mutiny.cycle.committed`, `mutiny.proposal.accepted`, `mutiny.cycle.declined`, `mutiny.cycle.cancelled`, `mutiny.proposal.rejected`, `mutiny.proposal.expired`, `commerce.fx_quote.issued`

## Dependencies

F02.S04.M03, F09.S03.M01, F09.S03.M02, F09.S03.M03, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-025-01 | [Domain schema](domain_schema.md) | 3 |
| PS-025-02 | [Validation rules](validation_rules.md) | 3 |
| PS-025-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-025-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-025-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-025-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-025-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-025-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-025-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-025-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/mutiny/src/value_balancing/currency/index.ts`.

## Acceptance criteria

- All tests T01–T15 pass in CI.
- Every converted amount matches the MNY-4 formula with one HALF_EVEN rounding, and every record names its quote sources.
- No cycle can be consented with an expired quote and expiry before commit always requires a new revision and fresh consent from everyone.
