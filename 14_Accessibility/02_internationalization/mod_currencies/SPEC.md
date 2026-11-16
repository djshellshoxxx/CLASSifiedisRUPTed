# F14.S02.M02 — Currency display

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F14.S02](../SPEC.md). **Process IDs:** PS-112-01…PS-112-10. **Code:** `packages/i18n/src/internationalization/currencies`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Locale-aware display and input parsing of Money (CTR-MNY-001: a decimal string of minor units plus a currency code). Formatting never converts minor units to a JavaScript Number: the string is split into whole and fraction digits and formatted through Intl.NumberFormat so values far beyond 2^53 stay exact. Approximate (converted) values are always labelled with the symbol or code, the quote source and the quote time, for example "≈ 42.10 EUR, quote from ECB at 10:15" (CTR-UX-001 UX-4). The module displays and parses only; it does not convert, round or hold funds, and a displayed price is a claim, not a payment instruction.

## Responsibilities

- Format Money { amount, currency } for a locale with the currency exponent supplied from the registry (F09.S03.M01), using string splitting so no Number conversion occurs, with exactly exponent fraction digits and no rounding.
- Support display modes symbol, code and name, ISO 4217 currencies through Intl currency style, and registry crypto assets (BTC 8, ETH 18, USDC 6) through decimal style plus the asset code isolated for bidi.
- Format approximate values with the label from the catalog key money.approx, containing the converted amount with currency code, the quote source name and the quote time in the viewer's time zone.
- Parse user-typed amounts in a locale to minor-unit strings, rejecting more fraction digits than the exponent, mixed separators and values above 30 digits instead of rounding silently.
- Expose parts (sign, currency, integer, group, decimal, fraction) so layouts can style the currency and fraction, and provide spoken-friendly name output used by F14.S01.M02.

## Not responsible for

- Currency registry and exponents (F09.S03.M01), FX rates and quotes (F09.S03.M02) and conversion arithmetic and rounding (F09.S03.M03).
- Message catalogs and locale negotiation (F14.S02.M01), which this module uses.
- Payments, balances and custody; the platform holds no funds and displayed amounts are claims between parties (CTR-COM-001).
- Future: compact notation for large amounts, accounting-style negatives and per-region currency symbol preferences; MVP uses standard notation only.

## User stories

- As a buyer in Germany, I see a EUR price as "45,00 €" and a US buyer sees "€45.00" for the same listing.
- As a user, a very large amount such as 12345678901234567890 minor units is shown with every digit correct.
- As a barter participant, an approximate converted value reads "≈ 42.10 EUR, quote from ECB at 10:15" so I know it is not exact.
- As a user typing a price, "12,50" in a German locale is understood as 12.50 and "12.345" is flagged rather than silently rounded.

## Edge cases

- Amount 5 minor units of a 2-decimal currency formats as 0.05, not 0.5 or 5.00.
- Negative amount -250 formats with the locale's minus sign and, when the whole part is zero (-5), keeps the sign (-0.05).
- Currency with exponent 0 (JPY) shows no fraction; exponent 3 (KWD) shows three digits; exponent 18 (ETH) shows 18 digits with no trailing trim unless the caller requests trimming.
- Amount 9007199254740993 (above 2^53) formats exactly; a Number-based formatter would show ...992.
- The engine lacks exact decimal-string support in Intl.NumberFormat (older Safari); the BigInt part-substitution path is used and produces identical output.
- Quote asOf is older than 24 h; the label adds the localized text "old quote" and the UI offers refresh when online.
- Unknown or non-ISO currency code such as USDC (4 letters) is rendered through decimal style plus the code, never through Intl currency style which would throw.
- Right-to-left locale; the amount is wrapped in bidi isolation so digits and symbol keep order inside RTL text.

## UX and accessibility

- Price display components used in listing cards, offers, proposals and receipts, always with a currency symbol or code.
- Money input field: label with currency, locale-aware decimal separator hint, inline error for too many fraction digits.
- Approximate value chip: '≈ 42.10 EUR' with an info button that opens the quote source and time.

**States:** formatted; approximate; old-quote; invalid-input; parsed

**Accessibility:** Money input uses inputmode=decimal, a visible label including the currency, and errors linked with aria-describedby.; The approximate chip's accessible name contains approximately, the amount with currency name, source and time.; The info button is at least 44×44 px and opens an accessible popover with focus management.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

F14.S02.M01, CTR-MNY-001, CTR-UX-001, CTR-COM-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-112-01 | [Domain schema](domain_schema.md) | 3 |
| PS-112-02 | [Validation rules](validation_rules.md) | 3 |
| PS-112-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-112-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-112-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-112-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-112-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-112-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-112-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-112-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/i18n/src/internationalization/currencies/index.ts`.

## Acceptance criteria

- All tests T01–T14 pass in CI.
- Formatting is digit-exact for any amount up to 78 digits in every shipped locale (property test).
- Every approximate value is shown with currency, quote source and quote time.
