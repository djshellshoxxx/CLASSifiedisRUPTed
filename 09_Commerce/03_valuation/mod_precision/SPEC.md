# F09.S03.M03 — precision

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Commerce Lead (F09). **Parent:** [F09.S03 valuation](../SPEC.md). **Canonical contracts:** CTR-COM-001 (R02 minor units, R04 rounding, quote rate scale), CTR-ERR-001, CTR-SCH-001. **Decisions:** D03 (PROVISIONAL, unapproved).

## Purpose and business behavior
Exact arithmetic rules for every amount in the commerce path: decimal-string parsing, minor-unit scaling by currency exponent, multiplication by a pinned quote rate, HALF_EVEN rounding and overflow limits. The module defines the rules and the test vectors. It does not hold any amount, rate or balance. No binary floating-point value may enter the commerce path.

## User stories
- As a participant, the amount I agree to is the same amount the counterparty sees, to the minor unit.
- As a developer, I can run one set of golden vectors and know that every commerce component rounds the same way.
- As an operator, I see a clear error when an amount would overflow instead of a silent wrap.

## Scope
- In scope: amount grammar, scaling, rounding, overflow, cross-currency conversion formula, rounding golden vectors, float-prohibition lint.
- Out of scope: rate sourcing (mod_rates), registry entries (mod_currency), display formatting (UI, F14 review), tax or fee rules.

## Public interfaces
Library-level functions (no network interface): `parse_amount`, `format_amount`, `scale_to_minor`, `convert_minor(amount_minor, rate, rate_scale, base_exp, quote_exp)`. Errors `PREC.*`. No events.

## Relationships, dependencies and integration
Upstream: `cur_` exponents (mod_currency), `qte_` rates (mod_rates). Downstream: mod_cash ceilings, mod_crypto amount match, mod_receipts amount format, mod_reconciliation sums, LocalMutiny value balancing (via CTR-COM-001).

## Data ownership
Owns the rule set and golden vector suite. Owns no data records.

## Risk considerations
Silent rounding drift between components; integer overflow; locale-dependent parsing; float regressions from UI or serialization code; exponent mismatch between registry and adapter.

## Completion criteria
Golden vectors (≥ 500) pass in two independent implementations; float lint in CI; library selection recorded in an ADR with version and license; no custom decimal implementation.

## Required process specification inventory
- [x] `domain_schema.md` — PS-074-01
- [x] `validation_rules.md` — PS-074-02
- [x] `workflow_state_machine.md` — PS-074-03
- [x] `commands_queries_events.md` — PS-074-04
- [x] `authorization_capabilities.md` — PS-074-05
- [x] `failure_recovery_idempotency.md` — PS-074-06
- [x] `privacy_retention_abuse.md` — PS-074-07
- [x] `observability_performance.md` — PS-074-08
- [x] `contract_and_acceptance_tests.md` — PS-074-09
- [x] `import_export_backup_rollback.md` — PS-074-10
