# F02.S04.M02 — Barter currency normalization

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F02.S04](../SPEC.md). **Process IDs:** PS-025-01…PS-025-10. **Code:** `packages/mutiny/src/value_balancing/currency`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Converts the declared values of all items in a proposal or cycle into one settlement currency with pinned FX quotes (F09.S03.M02), using bigint arithmetic and a single HALF_EVEN rounding per conversion (MNY-3, MNY-4). The resulting NormalizationRecord lists every quote id, rate, source and expiry and is embedded in the signed revision snapshot, so every participant signs the same numbers. Receivers independently recompute the arithmetic. Quotes are requested with purpose barter_normalization and a lifetime of at most 24 h (N16) and are shown as 'pinned rate agreed by all parties' with their source (relay-signed, manual operator rate, local). A cross-currency subject therefore has a consent deadline of at most 24 h and never after the earliest quote expiry; otherwise the coordinator re-quotes and issues a quote_refresh revision, which voids earlier consents. When a pinned quote expires before commit, the record expires with the same consequence.

## Responsibilities

- Compute normalization records for a subject from valuations and quotes, with settlement currency default from the vault's configuration (default EUR for a EUR tenant), at most 5 distinct currencies and 8 quotes per record.
- Request quotes from F09.S03.M02 with purpose barter_normalization and validForMs = min(consentDeadline − now + 30 min, 24 h) (N16), label each pinned rate 'pinned rate agreed by all parties' with its source, and require consentDeadline ≤ now + 24 h and ≤ earliestQuoteExpiry; otherwise re-quote and require fresh consent through a quote_refresh revision.
- Verify and store peers' normalization data from signed revisions by recomputing every conversion, and flag mismatches.
- Expire records at the earliest quote expiry before commit, emit the expiry for re-consent, freeze records after commit and close them when the subject ends, forks or freezes.
- When the settlement currency is not EUR, provide the tolerance reference quote EUR to settlement currency (purpose barter_normalization) that the revision pins as toleranceRef, used only to convert the profile's absolute minimum reference (F02.S02.M05 C05); its rate is part of the signed terms and its later expiry has no effect.
- Register the module's export section, deletion and retention purge handlers with F10 (N6).

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

- All items are already in the settlement currency; no NormalizationRecord is referenced (normalizationId absent), the 24 h cross-currency deadline cap does not apply, and when the settlement currency is not EUR only the tolerance reference quote is pinned.
- The coordinator asks for a 72 h consent deadline on a cycle with EUR and GBP items; compute refuses with MUTINY_QUOTE_TOO_SHORT and offers 24 h, because barter quotes live at most 24 h.
- A currency pair has no available quote; the record is refused and the user is told which pair is missing.
- The only available rate is a manual operator rate; it is accepted but labelled manual and flagged as not independently sourced.
- A quote expires before everyone consented; the record expires, the effective consent window ended early, and the coordinator must re-quote and create a quote_refresh revision with fresh consent.
- A participant's recomputation gives a different converted amount by one minor unit; the revision is flagged normalization_mismatch and cannot be consented.
- A declared value is in a currency that is not in the registry; refused with the registry's currency error.
- The settlement currency has zero decimals (JPY) while items are in EUR; the exponent difference is applied exactly as in MNY-4.

## UX and accessibility

- Values summary: each item with declared amount, the rate labelled 'pinned rate agreed by all parties', converted amount and source label, plus a footer line 'Rates expire at 14:20; after that the proposal needs a refresh and new consent'.
- Rate source details sheet naming source, as-of time and whether the rate was signed by its source or stated by the proposer.

**States:** loading; current; expiring; expired; mismatch; frozen; error

**Accessibility:** Rates are shown as text such as '1 GBP = 1.1700 EUR' with the source named, readable by screen readers.; The expiring and expired banners use text, not only color, and are announced in an aria-live polite region.; All actions are buttons of at least 44 by 44 px.

## Owned data

- `NormalizationRecord` (classrup.mutiny.normalization_record/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `mutiny.normalization.compute`, `mutiny.normalization.verify`
- Queries: `mutiny.normalization.get`, `mutiny.normalization.current_for_subject`
- Emits: `mutiny.values.normalized`, `mutiny.normalization.expired`
- Consumes: `mutiny.valuation.declared`, `mutiny.proposal.revised`, `mutiny.cycle.committed`, `mutiny.proposal.accepted`, `mutiny.cycle.declined`, `mutiny.cycle.cancelled`, `mutiny.proposal.rejected`, `mutiny.proposal.expired`, `mutiny.proposal.withdrawn`, `mutiny.revision.forked`, `mutiny.lock.conflict_detected`, `privacy.deletion.completed`, `commerce.fx_quote.issued`

## Dependencies

F02.S04.M03, F09.S03.M01, F09.S03.M02, F09.S03.M03, F16.S02.M03, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-025-01 | [Domain schema](domain_schema.md) | 3 |
| PS-025-02 | [Validation rules](validation_rules.md) | 3 |
| PS-025-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-025-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-025-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-025-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-025-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-025-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-025-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-025-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/mutiny/src/value_balancing/currency/index.ts`.

## Acceptance criteria

- All tests T01–T19 pass in CI.
- Every converted amount matches the MNY-4 formula with one HALF_EVEN rounding, and every record names its quote sources.
- No cycle can be consented with an expired quote and expiry before commit always requires a new revision and fresh consent from everyone.
